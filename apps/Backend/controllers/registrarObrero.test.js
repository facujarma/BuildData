// Regresión del issue #13: `POST /bot/obreros/registrar` no debe crear una
// segunda persona cuando el mismo teléfono ya existe con otra variante de
// formato (WhatsApp manda 549..., la web puede tener 54... sin el 9).
//
// El fake de DB mantiene personas y membresías en memoria; el servicio de
// identidad es el real para que el matcheo por variantes se pruebe de verdad.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PERSONA_ID = "11111111-1111-4111-8111-111111111111";
const OTRA_PERSONA_ID = "22222222-2222-4222-8222-222222222222";

const estado = {
  personas: [],
  membresias: [],
  queries: [],
};

function variantesCoinciden(telefono, variantes) {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  return digitos && variantes.includes(digitos);
}

const client = {
  query: mock(async (sqlOriginal, params = []) => {
    const sql = String(sqlOriginal).replace(/\s+/g, " ").trim();
    estado.queries.push({ sql, params });

    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }

    if (sql.startsWith("SELECT id, auth_user_id, nombre, telefono, created_at FROM personas")) {
      return {
        rows: estado.personas.filter((persona) =>
          variantesCoinciden(persona.telefono, params[0] ?? [])
        ),
      };
    }

    if (sql.startsWith("INSERT INTO personas (nombre, telefono)")) {
      const nueva = {
        id: PERSONA_ID,
        auth_user_id: null,
        nombre: params[0],
        telefono: params[1],
        created_at: "2026-01-01T00:00:00.000Z",
      };
      estado.personas.push(nueva);
      return { rows: [nueva], rowCount: 1 };
    }

    if (sql.startsWith("INSERT INTO miembros_obra")) {
      estado.membresias.push({ persona_id: params[0], obra_id: params[1], rol: params[2] });
      return { rows: [], rowCount: 1 };
    }

    throw new Error(`SQL no esperado en registrarObrero.test: ${sql}`);
  }),
  release: mock(() => {}),
};

mock.module("../db.js", () => ({
  pool: {
    connect: async () => client,
    query: async () => {
      throw new Error("pool.query no esperado: registrarObrero usa el client");
    },
  },
}));

const { registrarObrero } = await import("./obrerosController.js");

function req(body = {}) {
  return {
    body: {
      nombre: "Obrero Bot",
      telefono: "5491143614361",
      obra_id: OBRA_ID,
      rol: "Obrero",
      ...body,
    },
  };
}

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

beforeEach(() => {
  estado.personas = [];
  estado.membresias = [];
  estado.queries = [];
  client.query.mockClear();
  client.release.mockClear();
});

describe("registrarObrero — variantes de teléfono", () => {
  test("reusa la persona existente con 54... aunque el bot mande 549...", async () => {
    estado.personas = [
      {
        id: PERSONA_ID,
        auth_user_id: null,
        nombre: "Existente",
        telefono: "541143614361",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const res = resFalso();
    await registrarObrero(req(), res);

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(PERSONA_ID);
    expect(estado.personas).toHaveLength(1);
    expect(estado.queries.some(({ sql }) => sql.startsWith("INSERT INTO personas"))).toBe(false);
    expect(estado.membresias).toEqual([
      { persona_id: PERSONA_ID, obra_id: OBRA_ID, rol: "Obrero" },
    ]);
  });

  test("si no existe, inserta con los dígitos normalizados", async () => {
    const res = resFalso();
    await registrarObrero(req({ telefono: "+54 9 11 4361-4361" }), res);

    expect(res.statusCode).toBe(201);
    expect(estado.personas).toHaveLength(1);
    expect(estado.personas[0].telefono).toBe("5491143614361");
    expect(estado.membresias[0].persona_id).toBe(PERSONA_ID);
  });

  test("si hay dos personas con variantes del mismo número, falla cerrado", async () => {
    estado.personas = [
      {
        id: PERSONA_ID,
        auth_user_id: null,
        nombre: "Una",
        telefono: "541143614361",
        created_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: OTRA_PERSONA_ID,
        auth_user_id: null,
        nombre: "Otra",
        telefono: "5491143614361",
        created_at: "2026-01-02T00:00:00.000Z",
      },
    ];

    const res = resFalso();
    await registrarObrero(req(), res);

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe("TELEFONO_AMBIGUO");
    expect(estado.queries.map(({ sql }) => sql)).toContain("ROLLBACK");
    expect(estado.membresias).toEqual([]);
  });
});
