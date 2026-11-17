// Regresión del issue #13: consumir una invitación con un teléfono que ya
// existe en otra variante de formato (54... vs 549...) debe reusar la persona
// existente, no crear otra. El fake de DB mantiene el estado en memoria.

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { cifrarInvitacion } from "./invitaciones.service.js";

process.env.INVITACION_SECRET =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const OBRA_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INVITACION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PERSONA_ID = "11111111-1111-4111-8111-111111111111";
const OTRA_PERSONA_ID = "22222222-2222-4222-8222-222222222222";
const TELEFONO_BOT = "5491143614361";

const estado = {
  personas: [],
  membresias: [],
  usada: false,
  queries: [],
};

const invitacion = {
  id: INVITACION_ID,
  obra_id: OBRA_ID,
  nombre: "Invitado",
  telefono: TELEFONO_BOT,
  rol: "Obrero",
};

const token = cifrarInvitacion({
  v: 1,
  id: INVITACION_ID,
  obra: OBRA_ID,
  nom: "Invitado",
  tel: TELEFONO_BOT,
  exp: 4102444800,
});

function variantesCoinciden(telefono, variantes) {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  return digitos && variantes.includes(digitos);
}

const client = {
  query: mock(async (sqlOriginal, params = []) => {
    const sql = String(sqlOriginal).replace(/\s+/g, " ").trim();
    estado.queries.push({ sql, params });

    if (sql === "BEGIN" || sql === "COMMIT") return { rows: [], rowCount: 0 };
    if (sql === "ROLLBACK") {
      estado.usada = false;
      return { rows: [], rowCount: 0 };
    }

    if (sql.startsWith("UPDATE invitaciones SET usada_at = now()")) {
      if (estado.usada) return { rows: [], rowCount: 0 };
      estado.usada = true;
      return { rows: [{ ...invitacion }], rowCount: 1 };
    }

    if (sql.startsWith("SELECT id, auth_user_id, nombre, telefono, created_at FROM personas")) {
      return {
        rows: estado.personas.filter((persona) =>
          variantesCoinciden(persona.telefono, params[0] ?? [])
        ),
      };
    }

    if (sql.startsWith("INSERT INTO personas (nombre, telefono)")) {
      const persona = {
        id: PERSONA_ID,
        auth_user_id: null,
        nombre: params[0],
        telefono: params[1],
        created_at: "2026-01-01T00:00:00.000Z",
      };
      estado.personas.push(persona);
      return { rows: [persona], rowCount: 1 };
    }

    if (sql.startsWith("INSERT INTO miembros_obra")) {
      estado.membresias.push({ persona_id: params[0], obra_id: params[1], rol: params[2] });
      return { rows: [], rowCount: 1 };
    }

    if (sql.startsWith("UPDATE invitaciones SET usada_por")) {
      return { rows: [], rowCount: 1 };
    }

    if (sql.startsWith("SELECT id, nombre FROM obras")) {
      return { rows: [{ id: OBRA_ID, nombre: "Obra Test" }] };
    }

    throw new Error(`SQL no esperado en consumirInvitacion.test: ${sql}`);
  }),
  release: mock(() => {}),
};

const poolQuery = mock(async (sqlOriginal) => {
  const sql = String(sqlOriginal).replace(/\s+/g, " ").trim();
  if (sql.includes("FROM roles_obra")) return { rows: [] };
  if (sql.startsWith("SELECT usada_at, expira_at FROM invitaciones")) {
    return { rows: [{ usada_at: null, expira_at: "2099-01-01T00:00:00.000Z" }] };
  }
  throw new Error(`pool.query no esperado en consumirInvitacion.test: ${sql}`);
});

mock.module("../db.js", () => ({
  pool: { connect: async () => client, query: poolQuery },
}));

const { consumirInvitacion } = await import("./invitaciones.service.js");

beforeEach(() => {
  estado.personas = [];
  estado.membresias = [];
  estado.usada = false;
  estado.queries = [];
  client.query.mockClear();
  client.release.mockClear();
  poolQuery.mockClear();
});

describe("consumirInvitacion — variantes de teléfono", () => {
  test("reusa la persona existente con 54... cuando el bot manda 549...", async () => {
    estado.personas = [
      {
        id: PERSONA_ID,
        auth_user_id: null,
        nombre: "Existente",
        telefono: "541143614361",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const resultado = await consumirInvitacion({ token, telefono: TELEFONO_BOT });

    expect(resultado.error).toBeUndefined();
    expect(resultado.persona.id).toBe(PERSONA_ID);
    expect(estado.personas).toHaveLength(1);
    expect(estado.queries.some(({ sql }) => sql.startsWith("INSERT INTO personas"))).toBe(false);
    expect(estado.membresias).toEqual([
      { persona_id: PERSONA_ID, obra_id: OBRA_ID, rol: "Obrero" },
    ]);
  });

  test("si no existe, inserta con los dígitos normalizados", async () => {
    const resultado = await consumirInvitacion({ token, telefono: "+54 9 11 4361-4361" });

    expect(resultado.error).toBeUndefined();
    expect(estado.personas).toHaveLength(1);
    expect(estado.personas[0].telefono).toBe(TELEFONO_BOT);
    expect(estado.membresias[0].persona_id).toBe(PERSONA_ID);
  });

  test("si hay dos personas con variantes del mismo número, falla cerrado y no marca usada", async () => {
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
        telefono: TELEFONO_BOT,
        created_at: "2026-01-02T00:00:00.000Z",
      },
    ];

    const resultado = await consumirInvitacion({ token, telefono: TELEFONO_BOT });

    expect(resultado.error).toBe("telefono_ambiguo");
    expect(estado.usada).toBe(false);
    expect(estado.membresias).toEqual([]);
  });
});
