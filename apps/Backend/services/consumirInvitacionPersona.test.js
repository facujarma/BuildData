// Consumo de una invitación atada a una persona existente (persona_id):
// - si la persona web todavía no tiene teléfono, el número del que abre el link
//   se guarda en ESA persona (no se crea otra);
// - si el número ya pertenece a otra persona, se unifica la cuenta web en la
//   persona del teléfono (mismo merge que "Vincular cuenta") dentro de la
//   transacción de la invitación;
// - si el número no coincide con el teléfono ya registrado, falla cerrado y la
//   invitación no se marca usada.
//
// El fake de DB mantiene el estado en memoria. `personas.service.js` se mockea
// solo en `buscarPersonaPorTelefono`/`unificarPersonas`: la primera se resuelve
// contra el estado y la segunda registra la llamada y simula el merge.

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { cifrarInvitacion } from "./invitaciones.service.js";

process.env.INVITACION_SECRET =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const OBRA_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INVITACION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const WEB_ID = "11111111-1111-4111-8111-111111111111";
const TEL_ID = "22222222-2222-4222-8222-222222222222";
const TELEFONO_BOT = "5491143614361";
const OTRO_TELEFONO = "5491100000000";

const estado = {
  personas: [],
  membresias: [],
  invitacion: null,
  usada: false,
  unificaciones: [],
  conflictoMerge: null,
  queries: [],
};

function tokenDe(personaId = WEB_ID, telefono = TELEFONO_BOT) {
  return cifrarInvitacion({
    v: 1,
    id: INVITACION_ID,
    obra: OBRA_ID,
    nom: "Invitado",
    tel: telefono,
    exp: 4102444800,
  });
}

function crearInvitacion(personaId, telefono = TELEFONO_BOT) {
  return {
    id: INVITACION_ID,
    obra_id: OBRA_ID,
    nombre: "Ana Web",
    telefono,
    rol: "Capataz",
    persona_id: personaId,
    creada_por: null,
  };
}

function matchTelefono(telefono, variantes) {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  return Boolean(digitos) && variantes.includes(digitos);
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
      return { rows: [{ ...estado.invitacion }], rowCount: 1 };
    }

    if (
      sql.startsWith("SELECT id, auth_user_id, nombre, telefono, created_at FROM personas") &&
      sql.includes("WHERE id = $1")
    ) {
      return {
        rows: estado.personas.filter((persona) => persona.id === params[0]),
      };
    }

    if (sql.startsWith("SELECT id, auth_user_id, nombre, telefono, created_at FROM personas")) {
      return {
        rows: estado.personas.filter((persona) =>
          matchTelefono(persona.telefono, params[0] ?? [])
        ),
      };
    }

    if (sql.startsWith("UPDATE personas SET telefono = $1")) {
      const persona = estado.personas.find((fila) => fila.id === params[1]);
      if (persona) persona.telefono = params[0];
      return { rows: [persona], rowCount: persona ? 1 : 0 };
    }

    if (sql.startsWith("INSERT INTO personas (nombre, telefono)")) {
      const persona = {
        id: "nueva",
        auth_user_id: null,
        nombre: params[0],
        telefono: params[1],
        created_at: "2026-01-01T00:00:00.000Z",
      };
      estado.personas.push(persona);
      return { rows: [persona], rowCount: 1 };
    }

    if (sql.startsWith("INSERT INTO miembros_obra")) {
      estado.membresias.push({
        persona_id: params[0],
        obra_id: params[1],
        rol: params[2],
      });
      return { rows: [], rowCount: 1 };
    }

    if (sql.startsWith("UPDATE invitaciones SET usada_por")) {
      estado.invitacion.usada_por = params[0];
      return { rows: [], rowCount: 1 };
    }

    if (sql.startsWith("SELECT id, nombre FROM obras")) {
      return { rows: [{ id: OBRA_ID, nombre: "Obra Test" }] };
    }

    throw new Error(`SQL no esperado en consumirInvitacionPersona.test: ${sql}`);
  }),
  release: mock(() => {}),
};

const poolQuery = mock(async (sqlOriginal) => {
  const sql = String(sqlOriginal).replace(/\s+/g, " ").trim();
  if (sql.includes("FROM roles_obra")) return { rows: [] };
  if (sql.startsWith("SELECT usada_at, expira_at FROM invitaciones")) {
    return { rows: [{ usada_at: null, expira_at: "2099-01-01T00:00:00.000Z" }] };
  }
  throw new Error(`pool.query no esperado en consumirInvitacionPersona.test: ${sql}`);
});

const buscarPersonaMock = mock(async (_db, telefono) => {
  const variantes = [String(telefono).replace(/\D/g, "")];
  if (variantes[0].startsWith("549")) variantes.push(`54${variantes[0].slice(3)}`);
  const filas = estado.personas.filter((persona) =>
    matchTelefono(persona.telefono, variantes)
  );
  if (filas.length > 1) {
    throw Object.assign(new Error("teléfono ambiguo"), { code: "TELEFONO_AMBIGUO" });
  }
  return filas[0] ?? null;
});

const unificarMock = mock(async ({ origenId, destinoId }) => {
  if (estado.conflictoMerge) {
    throw Object.assign(new Error(estado.conflictoMerge), {
      code: "PERSONA_CONFLICTO",
    });
  }
  estado.unificaciones.push({ origenId, destinoId });
  // El merge real mueve membresías y borra el origen; para el contrato alcanza
  // con dejar la persona del teléfono como destino.
  estado.personas = estado.personas.filter((persona) => persona.id !== origenId);
  return { origen: { id: origenId }, destino: { id: destinoId } };
});

mock.module("./personas.service.js", () => ({
  buscarPersonaPorTelefono: buscarPersonaMock,
  unificarPersonas: unificarMock,
  esPersonaError: (error) => error?.name === "Error" && typeof error.code === "string",
}));

mock.module("../db.js", () => ({
  pool: { connect: async () => client, query: poolQuery },
}));

const { consumirInvitacion } = await import("./invitaciones.service.js");

beforeEach(() => {
  estado.personas = [];
  estado.membresias = [];
  estado.invitacion = crearInvitacion(WEB_ID);
  estado.usada = false;
  estado.unificaciones = [];
  estado.conflictoMerge = null;
  estado.queries = [];
  client.query.mockClear();
  client.release.mockClear();
  poolQuery.mockClear();
  buscarPersonaMock.mockClear();
  unificarMock.mockClear();
});

describe("consumirInvitacion — persona_id (cuenta web existente)", () => {
  test("guarda el teléfono en la persona web cuando el número está libre", async () => {
    estado.personas = [
      {
        id: WEB_ID,
        auth_user_id: "auth-1",
        nombre: "Ana Web",
        telefono: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const resultado = await consumirInvitacion({
      token: tokenDe(),
      telefono: TELEFONO_BOT,
    });

    expect(resultado.error).toBeUndefined();
    expect(resultado.persona.id).toBe(WEB_ID);
    expect(estado.personas).toHaveLength(1);
    expect(estado.personas[0].telefono).toBe(TELEFONO_BOT);
    expect(estado.unificaciones).toEqual([]);
    expect(estado.membresias).toEqual([
      { persona_id: WEB_ID, obra_id: OBRA_ID, rol: "Capataz" },
    ]);
    expect(estado.invitacion.usada_por).toBe(WEB_ID);
    expect(estado.queries.some(({ sql }) => sql.startsWith("INSERT INTO personas"))).toBe(
      false
    );
  });

  test("si el número ya es de otra persona, unifica la cuenta web en la del teléfono", async () => {
    estado.personas = [
      {
        id: WEB_ID,
        auth_user_id: "auth-1",
        nombre: "Ana Web",
        telefono: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: TEL_ID,
        auth_user_id: null,
        nombre: "Ana WhatsApp",
        telefono: TELEFONO_BOT,
        created_at: "2026-02-01T00:00:00.000Z",
      },
    ];

    const resultado = await consumirInvitacion({
      token: tokenDe(),
      telefono: TELEFONO_BOT,
    });

    expect(resultado.error).toBeUndefined();
    expect(estado.unificaciones).toEqual([{ origenId: WEB_ID, destinoId: TEL_ID }]);
    expect(resultado.persona.id).toBe(TEL_ID);
    expect(estado.membresias[0].persona_id).toBe(TEL_ID);
    expect(estado.invitacion.usada_por).toBe(TEL_ID);
  });

  test("si la persona ya tiene OTRO teléfono, falla cerrado y no marca usada", async () => {
    estado.personas = [
      {
        id: WEB_ID,
        auth_user_id: "auth-1",
        nombre: "Ana Web",
        telefono: OTRO_TELEFONO,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const resultado = await consumirInvitacion({
      token: tokenDe(),
      telefono: TELEFONO_BOT,
    });

    expect(resultado.error).toBe("otro_telefono");
    expect(estado.usada).toBe(false);
    expect(estado.membresias).toEqual([]);
  });

  test("un conflicto del merge devuelve telefono_de_otra_cuenta", async () => {
    estado.personas = [
      {
        id: WEB_ID,
        auth_user_id: "auth-1",
        nombre: "Ana Web",
        telefono: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: TEL_ID,
        auth_user_id: "auth-2",
        nombre: "Otra cuenta",
        telefono: TELEFONO_BOT,
        created_at: "2026-02-01T00:00:00.000Z",
      },
    ];
    estado.conflictoMerge = "El destino ya está vinculado a otra cuenta web";

    const resultado = await consumirInvitacion({
      token: tokenDe(),
      telefono: TELEFONO_BOT,
    });

    expect(resultado.error).toBe("telefono_de_otra_cuenta");
    expect(estado.usada).toBe(false);
    expect(estado.membresias).toEqual([]);
  });
});
