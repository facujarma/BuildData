// Resolución de una persona unificada (issue #13): el bot y la web tienen que
// llegar al MISMO `personas.id` y al MISMO rol en cada obra.
//
// - Bot: `getUserByPhone` resuelve por `personas.telefono` y devuelve el rol por
//   obra con los permisos efectivos (roles.service REAL).
// - Web: `getObras` resuelve por `personas.auth_user_id` (el join del SQL) y
//   `perfilEnObra` devuelve el rol de la membresía.
//
// El fake de `db.js` implementa esos joins sobre un estado en memoria con UNA
// sola fila de persona (teléfono + auth_user_id, el resultado del merge). No se
// mockean roles.service ni permisos.service: si el controller o el servicio
// dejan de resolver por el canal correcto, el test falla.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const PERSONA_ID = "11111111-1111-4111-8111-111111111111";
const AUTH_ID = "22222222-2222-4222-8222-222222222222";
const OTRO_AUTH_ID = "33333333-3333-4333-8333-333333333333";
const OBRA_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OBRA_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const TELEFONO = "5491143614361";

const estado = {
  personas: [],
  miembros: [],
  obras: [],
  llamadas: [],
};

function obra(id, nombre) {
  return {
    id,
    nombre,
    code: `OBR-${nombre}`,
    direccion: "Calle 1",
    city: "CABA",
    province: "Buenos Aires",
    zip: null,
    country: "ar",
    type: "edificio",
    estado: "en-curso",
    fecha_inicio: null,
    fecha_fin_estimada: null,
    last_activity: null,
    last_activity_who: null,
    starred: false,
    aprobacion_automatica: false,
    alerts: "0",
    pedidos: "0",
    tareas_total: "0",
    tareas_completadas: "0",
  };
}

function personaPorTelefono(telefono) {
  return estado.personas.find(
    (fila) => String(fila.telefono ?? "").replace(/\D/g, "") === String(telefono).replace(/\D/g, "")
  );
}

function responder(sqlOriginal, params = []) {
  const consulta = String(sqlOriginal).replace(/\s+/g, " ").trim();
  estado.llamadas.push({ sql: consulta, params });

  // Bot: persona por teléfono + sus obras.
  if (consulta.startsWith("SELECT p.id, p.nombre, p.telefono, mo.obra_id")) {
    const persona = personaPorTelefono(params[0]);
    if (!persona) return { rows: [] };
    return {
      rows: estado.miembros
        .filter((miembro) => miembro.persona_id === persona.id)
        .map((miembro) => {
          const obraFila = estado.obras.find((fila) => fila.id === miembro.obra_id);
          return {
            id: persona.id,
            nombre: persona.nombre,
            telefono: persona.telefono,
            obra_id: miembro.obra_id,
            rol: miembro.rol,
            obra_nombre: obraFila?.nombre ?? null,
            direccion: obraFila?.direccion ?? null,
          };
        }),
    };
  }

  // Web: obras donde el auth_user_id pertenece a un miembro.
  if (
    consulta.startsWith("SELECT o.*") &&
    consulta.includes("JOIN personas p ON p.id = mo.persona_id AND p.auth_user_id = $1")
  ) {
    const persona = estado.personas.find((fila) => fila.auth_user_id === params[0]);
    if (!persona) return { rows: [] };
    return {
      rows: estado.miembros
        .filter((miembro) => miembro.persona_id === persona.id)
        .map((miembro) => estado.obras.find((fila) => fila.id === miembro.obra_id))
        .filter(Boolean),
    };
  }

  // perfilEnObra: rol de la persona en una obra.
  if (consulta.startsWith("SELECT rol FROM miembros_obra")) {
    const [personaId, obraId] = params;
    const miembro = estado.miembros.find(
      (fila) => fila.persona_id === personaId && fila.obra_id === obraId
    );
    return { rows: miembro ? [{ rol: miembro.rol }] : [] };
  }

  // resolverRol: sin filas, cae a la matriz estática de roles de sistema.
  if (consulta.includes("FROM roles_obra")) {
    return { rows: [] };
  }

  // buildObra: equipo de la obra.
  if (consulta.startsWith("SELECT p.id, UPPER(")) {
    const [obraId] = params;
    return {
      rows: estado.miembros
        .filter((miembro) => miembro.obra_id === obraId)
        .map((miembro) => {
          const persona = estado.personas.find((fila) => fila.id === miembro.persona_id);
          return {
            id: miembro.persona_id,
            initials: persona?.nombre?.slice(0, 2).toUpperCase() ?? "??",
          };
        }),
    };
  }

  throw new Error(`pool.query no esperado en personas.resolucion.test: ${consulta}`);
}

const poolQueryMock = mock(async (sql, params) => responder(sql, params));

mock.module("../db.js", () => ({
  pool: { query: poolQueryMock },
}));

const { getUserByPhone } = await import("./obrerosController.js");
const { getObras } = await import("./obrasController.js");
// Se importa después del mock de db.js: usa el mismo pool falso que los
// controllers (y la resolución REAL de roles/permisos).
const { perfilEnObra } = await import("../services/roles.service.js");

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
  estado.personas = [
    {
      id: PERSONA_ID,
      auth_user_id: AUTH_ID,
      nombre: "Ana Pérez",
      telefono: TELEFONO,
    },
  ];
  estado.obras = [obra(OBRA_A, "Obra A"), obra(OBRA_B, "Obra B")];
  estado.miembros = [
    { persona_id: PERSONA_ID, obra_id: OBRA_A, rol: "Director" },
    { persona_id: PERSONA_ID, obra_id: OBRA_B, rol: "Capataz" },
  ];
  estado.llamadas = [];
  poolQueryMock.mockClear();
});

describe("persona unificada: bot y web resuelven la misma identidad", () => {
  test("mismo personas.id y mismo rol por obra en los dos canales", async () => {
    // Bot: resuelve por teléfono.
    const resBot = resFalso();
    await getUserByPhone({ params: { phone: TELEFONO } }, resBot);

    expect(resBot.statusCode).toBe(200);
    expect(resBot.body.id).toBe(PERSONA_ID);
    expect(resBot.body.obras.map((fila) => fila.obra_id)).toEqual([OBRA_A, OBRA_B]);
    expect(resBot.body.obras.map((fila) => fila.rol)).toEqual(["Director", "Capataz"]);

    // Web: perfil de la misma persona en cada obra.
    const perfilA = await perfilEnObra(PERSONA_ID, OBRA_A);
    const perfilB = await perfilEnObra(PERSONA_ID, OBRA_B);

    expect(perfilA.rol.nombre).toBe(resBot.body.obras[0].rol);
    expect(perfilB.rol.nombre).toBe(resBot.body.obras[1].rol);
    expect(perfilA.permisos.web["equipo.administrar"]).toBe(true);
    expect(perfilB.permisos.web["equipo.administrar"]).toBe(false);

    // Web: la lista de obras sale del auth_user_id de la MISMA persona.
    const resWeb = resFalso();
    await getObras({ user: { id: AUTH_ID } }, resWeb);

    expect(resWeb.statusCode).toBe(200);
    expect(resWeb.body.obras.map((fila) => fila.id)).toEqual([OBRA_A, OBRA_B]);

    const consultaObras = estado.llamadas.find(
      ({ sql }) => sql.includes("JOIN personas p ON p.id = mo.persona_id AND p.auth_user_id = $1")
    );
    expect(consultaObras.params).toEqual([AUTH_ID]);

    // Una sola fila de persona: no hay duplicado web/WhatsApp.
    expect(estado.personas).toHaveLength(1);
  });

  test("sin el auth_user_id de la persona unificada, la web no lista sus obras", async () => {
    estado.personas[0].auth_user_id = OTRO_AUTH_ID;

    const resWeb = resFalso();
    await getObras({ user: { id: AUTH_ID } }, resWeb);

    expect(resWeb.statusCode).toBe(200);
    expect(resWeb.body.obras).toEqual([]);
  });

  test("el bot no encuentra la persona si el teléfono no coincide", async () => {
    const resBot = resFalso();
    await getUserByPhone({ params: { phone: "5491100000000" } }, resBot);

    expect(resBot.statusCode).toBe(404);
    expect(resBot.body).toEqual({ error: "Obrero no encontrado" });
  });
});
