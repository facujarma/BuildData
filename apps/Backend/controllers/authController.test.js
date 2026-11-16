// Tests del alta web y del perfil propio (GET /auth/me) con el servicio de
// identidad REAL (personas.service.js) y la base mockeada.
//
// Lo importante que fijan:
// - register vincula la cuenta nueva a la persona que ya existe por teléfono en
//   vez de crear una segunda fila (el bug del issue #13).
// - Si el teléfono pertenece a otra cuenta web, responde 409 TELEFONO_EN_USO y
//   no toca nada.
// - Un error de la base no se silencia: ROLLBACK + 500.
// - getMe usa req.personaId (resuelto por el middleware) y cae a auth_user_id.
//
// Se mockean `supabaseClient.js` (no hay red) y `db.js` (no hay Postgres). El
// runner del proyecto corre cada archivo en su propio proceso, así que estos
// mocks no se filtran a otros tests.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const AUTH_ID = "11111111-1111-4111-8111-111111111111";
const OTRO_AUTH_ID = "22222222-2222-4222-8222-222222222222";
const PERSONA_TEL = "33333333-3333-4333-8333-333333333333";
const PERSONA_OTRA = "44444444-4444-4444-8444-444444444444";
const PERSONA_WEB = "55555555-5555-4555-8555-555555555555";
const TELEFONO = "5491143614361";

const estado = {
  personas: [],
  queries: [],
  failEn: null,
  errorPersona: null,
  signUp: { data: { user: { id: AUTH_ID, email: "ana@example.com" } }, error: null },
  releases: 0,
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

  if (estado.errorPersona) throw estado.errorPersona;

  if (estado.failEn && consulta.includes(estado.failEn)) {
    throw new Error("fallo de base simulado");
  }

  if (consulta === "BEGIN" || consulta === "COMMIT" || consulta === "ROLLBACK") {
    return { rows: [], rowCount: 0 };
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

  if (consulta.startsWith("SELECT id FROM personas WHERE regexp_replace")) {
    const variantes = params[0] ?? [];
    return {
      rows: estado.personas
        .filter((fila) => variantes.includes(String(fila.telefono ?? "").replace(/\D/g, "")))
        .map((fila) => ({ id: fila.id })),
    };
  }

  if (consulta === "UPDATE personas SET auth_user_id = $1 WHERE id = $2") {
    const fila = estado.personas.find((candidata) => candidata.id === params[1]);
    if (fila) fila.auth_user_id = params[0];
    return { rows: [], rowCount: fila ? 1 : 0 };
  }

  if (consulta === "UPDATE personas SET telefono = $1 WHERE id = $2") {
    const fila = estado.personas.find((candidata) => candidata.id === params[1]);
    if (fila) fila.telefono = params[0];
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

  if (consulta === "SELECT * FROM personas WHERE id = $1") {
    return { rows: estado.personas.filter((fila) => fila.id === params[0]) };
  }

  if (consulta === "SELECT * FROM personas WHERE auth_user_id = $1") {
    return { rows: estado.personas.filter((fila) => fila.auth_user_id === params[0]) };
  }

  throw new Error(`pool.query no esperado en authController.test: ${consulta}`);
}

const dbFake = {
  query: mock(async (sql, params) => responder(sql, params)),
  release: mock(() => {
    estado.releases += 1;
  }),
};

const signUpMock = mock(async () => estado.signUp);
const poolQueryMock = mock(async (sql, params) => responder(sql, params));

mock.module("../supabaseClient.js", () => ({
  supabase: {
    auth: {
      signUp: signUpMock,
      signInWithPassword: mock(async () => ({ data: {}, error: null })),
      signOut: mock(async () => ({ error: null })),
    },
  },
  supabaseAdmin: {},
}));

mock.module("../db.js", () => ({
  pool: {
    query: poolQueryMock,
    connect: async () => dbFake,
  },
}));

const { register, getMe } = await import("./authController.js");
// Misma instancia del servicio que usa el controller (importada después del
// mock de db.js) para poder lanzar un PersonaError real sin tocar Postgres.
const { PersonaError } = await import("../services/personas.service.js");

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

function reqRegister(body = {}) {
  return {
    body: {
      email: "ana@example.com",
      password: "unaClaveSegura",
      nombre: "Ana Pérez",
      telefono: "+54 9 11 4361-4361",
      ...body,
    },
  };
}

const llamadas = (fragmento) => estado.queries.filter(({ sql }) => sql.includes(fragmento));

beforeEach(() => {
  estado.personas = [];
  estado.queries = [];
  estado.failEn = null;
  estado.errorPersona = null;
  estado.releases = 0;
  estado.signUp = { data: { user: { id: AUTH_ID, email: "ana@example.com" } }, error: null };
  signUpMock.mockClear();
  dbFake.query.mockClear();
  dbFake.release.mockClear();
  poolQueryMock.mockClear();
});

describe("register — alta web con teléfono existente", () => {
  test("crea la cuenta web SIN teléfono y la deja pendiente de vinculación", async () => {
    estado.personas = [persona()];

    const res = resFalso();
    await register(reqRegister(), res);

    expect(res.statusCode).toBe(201);
    expect(res.body.requiere_vinculacion).toBe(true);
    expect(res.body.mensaje).toContain("un Director puede vincular");
    expect(signUpMock).toHaveBeenCalledTimes(1);
    // La persona del WhatsApp no se toca: no se le asigna el auth de la cuenta
    // nueva ni se duplica el teléfono.
    expect(estado.personas).toHaveLength(2);
    expect(estado.personas[0].id).toBe(PERSONA_TEL);
    expect(estado.personas[0].auth_user_id).toBeNull();
    const nueva = estado.personas.find((fila) => fila.id !== PERSONA_TEL);
    expect(nueva.auth_user_id).toBe(AUTH_ID);
    expect(nueva.telefono).toBeNull();
    expect(llamadas("UPDATE personas SET auth_user_id = $1")).toEqual([]);
    expect(estado.queries.map(({ sql }) => sql)).toContain("COMMIT");
    expect(estado.releases).toBe(1);
  });

  test("si el teléfono está libre, crea la persona con auth y teléfono", async () => {
    const res = resFalso();
    await register(reqRegister(), res);

    expect(res.statusCode).toBe(201);
    expect(res.body.requiere_vinculacion).toBe(false);
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(estado.personas).toHaveLength(1);
    expect(estado.personas[0].auth_user_id).toBe(AUTH_ID);
    expect(estado.personas[0].telefono).toBe(TELEFONO);
    expect(llamadas("INSERT INTO personas")).toHaveLength(1);
    expect(estado.queries.map(({ sql }) => sql)).toContain("COMMIT");
    expect(estado.releases).toBe(1);
  });

  test("si la cuenta ya tenía persona, la reutiliza sin insertar ni duplicar", async () => {
    estado.personas = [persona({ id: PERSONA_WEB, auth_user_id: AUTH_ID, telefono: null })];

    const res = resFalso();
    await register(reqRegister({ telefono: undefined }), res);

    expect(res.statusCode).toBe(201);
    expect(estado.personas).toHaveLength(1);
    expect(estado.personas[0].id).toBe(PERSONA_WEB);
    expect(llamadas("INSERT INTO personas")).toEqual([]);
  });

  test("crea la persona cuando no hay teléfono ni cuenta previa", async () => {
    const res = resFalso();
    await register(reqRegister({ telefono: undefined }), res);

    expect(res.statusCode).toBe(201);
    expect(estado.personas).toHaveLength(1);
    expect(estado.personas[0].auth_user_id).toBe(AUTH_ID);
    expect(estado.personas[0].telefono).toBeNull();
    expect(llamadas("INSERT INTO personas")).toHaveLength(1);
  });
});

describe("register — teléfono de otra cuenta", () => {
  test("no reclama la identidad ajena: crea la cuenta web sin teléfono", async () => {
    estado.personas = [persona({ id: PERSONA_OTRA, auth_user_id: OTRO_AUTH_ID })];

    const res = resFalso();
    await register(reqRegister(), res);

    expect(res.statusCode).toBe(201);
    expect(res.body.requiere_vinculacion).toBe(true);
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(estado.personas).toHaveLength(2);
    expect(estado.personas[0].id).toBe(PERSONA_OTRA);
    expect(estado.personas[0].auth_user_id).toBe(OTRO_AUTH_ID);
    const nueva = estado.personas.find((fila) => fila.id !== PERSONA_OTRA);
    expect(nueva.auth_user_id).toBe(AUTH_ID);
    expect(nueva.telefono).toBeNull();
    expect(llamadas("INSERT INTO personas")).toHaveLength(1);
    expect(llamadas("UPDATE personas SET auth_user_id = $1")).toEqual([]);
    expect(estado.releases).toBe(1);
  });
});

describe("register — errores de base", () => {
  test("no silencia: ROLLBACK y 500 con log", async () => {
    estado.failEn = "FROM personas";
    const originalError = console.error;
    const logs = [];
    console.error = (...args) => logs.push(args);
    try {
      // Sin teléfono no corre el pre-check: el fallo cae dentro de la
      // transacción del alta y se mapea al 500 del perfil.
      const res = resFalso();
      await register(reqRegister({ telefono: undefined }), res);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        code: "SERVER_ERROR",
        message: "No se pudo crear el perfil del usuario",
      });
      expect(estado.queries.map(({ sql }) => sql)).toContain("ROLLBACK");
      expect(logs.length).toBeGreaterThan(0);
      expect(estado.releases).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test("400 si falta email, password o nombre (no llama a Supabase)", async () => {
    const res = resFalso();
    await register(reqRegister({ nombre: "" }), res);

    expect(res.statusCode).toBe(400);
    expect(signUpMock).not.toHaveBeenCalled();
    expect(estado.queries).toEqual([]);
  });

  test("si falta la migración de personas unificadas responde 503 (no 500)", async () => {
    estado.errorPersona = new PersonaError(
      "MIGRACION_PENDIENTE",
      "Falta aplicar outputs/migracion_personas_unificadas.sql"
    );
    const originalError = console.error;
    console.error = () => {};
    try {
      const res = resFalso();
      await register(reqRegister({ telefono: undefined }), res);

      expect(res.statusCode).toBe(503);
      expect(res.body.code).toBe("MIGRACION_PENDIENTE");
      expect(estado.queries.map(({ sql }) => sql)).toContain("ROLLBACK");
    } finally {
      console.error = originalError;
    }
  });
});

describe("getMe", () => {
  test("devuelve la persona resuelta por el middleware (req.personaId)", async () => {
    estado.personas = [persona()];

    const res = resFalso();
    await getMe({ personaId: PERSONA_TEL, user: { id: AUTH_ID } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([persona()]);
    expect(poolQueryMock.mock.calls[0][0]).toContain("WHERE id = $1");
    expect(poolQueryMock.mock.calls[0][1]).toEqual([PERSONA_TEL]);
  });

  test("sin req.personaId busca por auth_user_id (y devuelve [] si todavía no existe)", async () => {
    const res = resFalso();
    await getMe({ user: { id: AUTH_ID } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
    expect(poolQueryMock.mock.calls[0][0]).toContain("WHERE auth_user_id = $1");
    expect(poolQueryMock.mock.calls[0][1]).toEqual([AUTH_ID]);
  });
});
