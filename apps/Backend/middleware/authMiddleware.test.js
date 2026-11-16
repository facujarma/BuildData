// Tests del middleware de autenticación con el servicio de identidad REAL.
//
// Cubre el camino que hoy deja gente sin `req.personaId`: un usuario de Supabase
// Auth que todavía no tiene fila en `personas` (web nueva o cuenta creada antes
// del deploy). El middleware la resuelve por teléfono o la crea, nunca duplica
// una persona que ya existe por WhatsApp, y jamás tira la request por un error
// de identidad.
//
// Se mockean `supabaseClient.js` (validación del token) y `db.js` (Postgres);
// cada archivo de test corre en su propio proceso con el runner del repo.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const AUTH_ID = "11111111-1111-4111-8111-111111111111";
const OTRO_AUTH_ID = "22222222-2222-4222-8222-222222222222";
const PERSONA_TEL = "33333333-3333-4333-8333-333333333333";
const PERSONA_OTRA = "44444444-4444-4444-8444-444444444444";
const PERSONA_WEB = "55555555-5555-4555-8555-555555555555";
const TELEFONO = "5491143614361";

const estado = {
  user: {
    id: AUTH_ID,
    email: "ana@example.com",
    phone: "",
    user_metadata: { nombre: "Ana Pérez", telefono: "+54 9 11 4361-4361" },
  },
  getTokenError: null,
  personas: [],
  queries: [],
  failEn: null,
};

function persona(extra = {}) {
  return {
    id: PERSONA_TEL,
    auth_user_id: null,
    nombre: "Ana Pérez",
    telefono: TELEFONO,
    created_at: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

function responder(sqlOriginal, params = []) {
  const consulta = String(sqlOriginal).replace(/\s+/g, " ").trim();
  estado.queries.push({ sql: consulta, params });

  if (estado.failEn && consulta.includes(estado.failEn)) {
    throw new Error("fallo de base simulado");
  }

  if (consulta === "BEGIN" || consulta === "COMMIT" || consulta === "ROLLBACK") {
    return { rows: [], rowCount: 0 };
  }

  if (consulta === "SELECT id FROM personas WHERE auth_user_id = $1") {
    return {
      rows: estado.personas
        .filter((fila) => fila.auth_user_id === params[0])
        .map((fila) => ({ id: fila.id })),
    };
  }

  const campos = "SELECT id, auth_user_id, nombre, telefono, created_at FROM personas";

  if (consulta.startsWith(campos) && consulta.includes("WHERE auth_user_id = $1")) {
    return { rows: estado.personas.filter((fila) => fila.auth_user_id === params[0]) };
  }

  if (consulta.startsWith(campos) && consulta.includes("regexp_replace")) {
    const variantes = params[0] ?? [];
    return {
      rows: estado.personas.filter((fila) =>
        variantes.includes(String(fila.telefono ?? "").replace(/\D/g, ""))
      ),
    };
  }

  if (consulta === "UPDATE personas SET auth_user_id = $1 WHERE id = $2") {
    const fila = estado.personas.find((candidata) => candidata.id === params[1]);
    if (fila) fila.auth_user_id = params[0];
    return { rows: [], rowCount: fila ? 1 : 0 };
  }

  if (consulta.startsWith("INSERT INTO personas (auth_user_id, nombre, telefono)")) {
    const nueva = persona({
      id: `nueva-${estado.personas.length + 1}`,
      auth_user_id: params[0],
      nombre: params[1],
      telefono: params[2],
    });
    estado.personas.push(nueva);
    return { rows: [nueva], rowCount: 1 };
  }

  throw new Error(`pool.query no esperado en authMiddleware.test: ${consulta}`);
}

const dbFake = {
  query: mock(async (sql, params) => responder(sql, params)),
  release: mock(() => {}),
};

const poolQueryMock = mock(async (sql, params) => responder(sql, params));
const getUserMock = mock(async () => ({
  data: { user: estado.getTokenError ? null : estado.user },
  error: estado.getTokenError,
}));

mock.module("../supabaseClient.js", () => ({
  supabase: { auth: { getUser: getUserMock } },
  supabaseAdmin: {},
}));

mock.module("../db.js", () => ({
  pool: { query: poolQueryMock, connect: async () => dbFake },
}));

const { authMiddleware } = await import("./authMiddleware.js");

function resFalso() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function reqConToken() {
  return { headers: { authorization: "Bearer token-de-prueba" }, body: {} };
}

async function correrMiddleware(req = reqConToken()) {
  const res = resFalso();
  let siguiente = 0;
  await authMiddleware(req, res, () => {
    siguiente += 1;
  });
  return { req, res, siguiente };
}

beforeEach(() => {
  estado.user = {
    id: AUTH_ID,
    email: "ana@example.com",
    phone: "",
    user_metadata: { nombre: "Ana Pérez", telefono: "+54 9 11 4361-4361" },
  };
  estado.getTokenError = null;
  estado.personas = [];
  estado.queries = [];
  estado.failEn = null;
  getUserMock.mockClear();
  poolQueryMock.mockClear();
  dbFake.query.mockClear();
  dbFake.release.mockClear();
});

describe("authMiddleware — persona ya resuelta", () => {
  test("usa el personas.id de auth_user_id y no escribe nada", async () => {
    estado.personas = [persona({ auth_user_id: AUTH_ID })];

    const { req, siguiente } = await correrMiddleware();

    expect(siguiente).toBe(1);
    expect(req.personaId).toBe(PERSONA_TEL);
    expect(estado.queries.map(({ sql }) => sql).some((sql) => sql.startsWith("INSERT"))).toBe(
      false
    );
  });
});

describe("authMiddleware — alta implícita de la persona", () => {
  test("no vincula por el teléfono de la metadata: crea una persona web sin teléfono", async () => {
    estado.personas = [persona()];

    const { req, siguiente } = await correrMiddleware();

    expect(siguiente).toBe(1);
    expect(req.personaId).toBeDefined();
    expect(estado.personas).toHaveLength(2);
    // La persona del WhatsApp no se toca: el teléfono de la metadata es
    // editable por el usuario y no prueba que sea suyo.
    expect(estado.personas[0].auth_user_id).toBeNull();
    const nueva = estado.personas.find((fila) => fila.id === req.personaId);
    expect(nueva.auth_user_id).toBe(AUTH_ID);
    expect(nueva.telefono).toBeNull();
  });

  test("tampoco vincula por data.user.phone: crea la persona web aparte", async () => {
    estado.user = {
      id: AUTH_ID,
      email: "ana@example.com",
      phone: TELEFONO,
      user_metadata: {},
    };
    estado.personas = [persona()];

    const { req } = await correrMiddleware();

    expect(req.personaId).toBeDefined();
    expect(estado.personas).toHaveLength(2);
    expect(estado.personas[0].auth_user_id).toBeNull();
    expect(estado.personas.find((fila) => fila.id === req.personaId).telefono).toBeNull();
  });

  test("sin teléfono: crea la persona con auth_user_id y el nombre del email", async () => {
    estado.user = { id: AUTH_ID, email: "ana.perez@example.com", user_metadata: {} };

    const { req } = await correrMiddleware();

    expect(req.personaId).toBeDefined();
    expect(estado.personas).toHaveLength(1);
    expect(estado.personas[0].auth_user_id).toBe(AUTH_ID);
    expect(estado.personas[0].nombre).toBe("ana.perez");
    expect(estado.personas[0].telefono).toBeNull();
  });

  test("si el teléfono es de otra cuenta: no lo reclama y crea la persona web aparte", async () => {
    estado.personas = [persona({ id: PERSONA_OTRA, auth_user_id: OTRO_AUTH_ID })];

    const { req, siguiente } = await correrMiddleware();

    expect(siguiente).toBe(1);
    expect(req.personaId).toBeDefined();
    expect(estado.personas).toHaveLength(2);
    const otra = estado.personas.find((fila) => fila.id === PERSONA_OTRA);
    expect(otra.auth_user_id).toBe(OTRO_AUTH_ID);
    const nueva = estado.personas.find((fila) => fila.id === req.personaId);
    expect(nueva.auth_user_id).toBe(AUTH_ID);
    expect(nueva.telefono).toBeNull();
  });
});

describe("authMiddleware — resiliencia", () => {
  test("un error de base se loguea pero la request sigue (next)", async () => {
    estado.failEn = "FROM personas";
    const originalError = console.error;
    console.error = () => {};
    try {
      const { req, siguiente } = await correrMiddleware();

      expect(siguiente).toBe(1);
      expect(req.personaId).toBeUndefined();
    } finally {
      console.error = originalError;
    }
  });

  test("token inválido o ausente: 401 y no llama a la base", async () => {
    const sinHeader = await correrMiddleware({ headers: {} });
    expect(sinHeader.res.statusCode).toBe(401);
    expect(sinHeader.siguiente).toBe(0);

    estado.getTokenError = "invalid token";
    estado.user = null;
    const invalido = await correrMiddleware();
    expect(invalido.res.statusCode).toBe(401);
    expect(invalido.siguiente).toBe(0);
    expect(poolQueryMock).not.toHaveBeenCalled();
  });
});
