// Barrera dura del bot: `registrarOperaciones` tiene que autorizar con los permisos
// dinámicos de `roles_obra` (editables desde Configuración), no con la matriz estática
// derivada del nombre del rol.
//
// Cubre los dos síntomas del bug de QA:
//  - un rol personalizado cuyo nombre "suena" a Capataz/Director ya no hereda permisos;
//  - un permiso otorgado en la obra (a un rol custom o de sistema) sí habilita el lote.
// Y el fallback documentado: si la migración de `roles_obra` no está aplicada, se usa
// la matriz estática del rol normalizado (mínimo privilegio para lo desconocido).
//
// Todo el acceso a datos está mockeado: no se abre conexión a Postgres.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const MENSAJE_ID = "2d9e3f70-3c4d-4e5f-8a01-23456789abcd";

const estado = {
  tablaRoles: true, // false simula la migración pendiente (42P01)
  rolMiembro: "Supervisor QA Cero",
  roles: [],
  operaciones: [],
  inserts: 0,
  alertas: 0,
};

// Fila de roles_obra. `bot` va parcial a propósito: normalizarPermisos completa el
// catálogo en false, igual que la base.
function filaRol({ nombre, bot = {}, esSistema = false, nivel = 20 }) {
  return {
    id: `rol-${nombre.toLowerCase().replace(/\s+/g, "-")}`,
    obra_id: OBRA_ID,
    nombre,
    nivel,
    es_sistema: esSistema,
    permisos: { bot, web: {} },
  };
}

function normalizar(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

// Handler único para pool.query y client.query: responde por forma de query.
function responder(sqlOriginal, params = []) {
  const sql = normalizar(sqlOriginal);

  if (sql.includes("FROM personas") && sql.includes("telefono")) {
    return { rows: [{ id: PERSONA_ID }], rowCount: 1 };
  }
  if (sql.includes("FROM obras")) {
    return { rows: [{ aprobacion_automatica: false }], rowCount: 1 };
  }
  if (sql.startsWith("SELECT rol FROM miembros_obra")) {
    return { rows: [{ rol: estado.rolMiembro }], rowCount: 1 };
  }
  if (sql.includes("FROM roles_obra")) {
    if (!estado.tablaRoles) {
      const error = new Error('relation "roles_obra" does not exist');
      error.code = "42P01";
      throw error;
    }
    const buscado = String(params[1] ?? "").toLowerCase();
    const fila = estado.roles.find((rol) => rol.nombre.toLowerCase() === buscado);
    return { rows: fila ? [fila] : [], rowCount: fila ? 1 : 0 };
  }
  if (sql.includes("count(*) FILTER") && sql.includes("FROM operaciones_bot")) {
    return {
      rows: [{ pendientes: 0, errores: 0, ejecutadas: estado.inserts, total: estado.inserts }],
      rowCount: 1,
    };
  }
  if (sql.startsWith("UPDATE mensajes")) {
    return { rows: [], rowCount: 1 };
  }
  if (sql.includes("FROM operaciones_bot") && sql.includes("mensaje_id")) {
    return { rows: estado.operaciones, rowCount: estado.operaciones.length };
  }
  if (sql.includes("FROM operaciones_bot") && sql.includes("ANY")) {
    return { rows: estado.operaciones, rowCount: estado.operaciones.length };
  }
  if (sql.startsWith("INSERT INTO alertas")) {
    estado.alertas += 1;
    return { rows: [], rowCount: 1 };
  }
  throw new Error(`consulta SQL no prevista en el test: ${sql}`);
}

mock.module("../db.js", () => ({
  pool: {
    query: async (sql, params) => responder(sql, params),
    connect: async () => ({
      query: async (sql, params) => {
        const texto = normalizar(sql);
        if (texto === "BEGIN" || texto === "COMMIT" || texto === "ROLLBACK") {
          return { rows: [], rowCount: 0 };
        }
        if (texto.startsWith("INSERT INTO operaciones_bot")) {
          estado.inserts += 1;
          const fila = {
            id: `00000000-0000-4000-8000-${String(estado.inserts).padStart(12, "0")}`,
            endpoint: params[3],
            method: params[4],
            estado: "pendiente",
          };
          estado.operaciones.push(fila);
          return { rows: [fila], rowCount: 1 };
        }
        return responder(sql, params);
      },
      release() {},
    }),
  },
}));

const { registrarOperaciones } = await import("./operaciones.service.js");

const OP_PEDIDO = [{
  endpoint: "/bot/pedidoDeCompra",
  method: "POST",
  payload: { obra_id: OBRA_ID, items: [{ material_id: PERSONA_ID, cantidad: 1 }] },
}];

function registrar() {
  return registrarOperaciones({
    obra_id: OBRA_ID,
    mensaje_id: MENSAJE_ID,
    telefono: "5491100000006",
    operaciones: OP_PEDIDO,
  });
}

beforeEach(() => {
  estado.tablaRoles = true;
  estado.rolMiembro = "Supervisor QA Cero";
  estado.roles = [];
  estado.operaciones = [];
  estado.inserts = 0;
  estado.alertas = 0;
});

describe("registrarOperaciones — permisos bot dinámicos de roles_obra", () => {
  test("un rol personalizado SIN pedido.crear en la obra no puede registrar el lote", async () => {
    estado.roles = [filaRol({ nombre: "Supervisor QA Cero", bot: {} })];

    await expect(registrar()).rejects.toMatchObject({ status: 403 });

    // Rechazo del lote entero: no se inserta la operación ni nace la alerta.
    expect(estado.inserts).toBe(0);
    expect(estado.alertas).toBe(0);
  });

  test("un rol personalizado CON pedido.crear en la obra sí puede registrar el lote", async () => {
    estado.rolMiembro = "Ayudante QA";
    estado.roles = [filaRol({ nombre: "Ayudante QA", bot: { "pedido.crear": true } })];

    const resultado = await registrar();

    expect(resultado).toHaveLength(1);
    expect(estado.inserts).toBe(1);
    expect(estado.alertas).toBe(1); // pedido: queda pendiente de aprobación
  });

  test("un rol de sistema con pedido.crear quitado en la obra no puede registrar el lote", async () => {
    estado.rolMiembro = "Capataz";
    estado.roles = [filaRol({ nombre: "Capataz", bot: {}, esSistema: true, nivel: 30 })];

    await expect(registrar()).rejects.toMatchObject({ status: 403 });
    expect(estado.inserts).toBe(0);
  });

  test("un rol de sistema con pedido.crear habilitado en la obra sí puede registrar el lote", async () => {
    estado.rolMiembro = "Capataz";
    estado.roles = [
      filaRol({ nombre: "Capataz", bot: { "pedido.crear": true }, esSistema: true, nivel: 30 }),
    ];

    expect(await registrar()).toHaveLength(1);
    expect(estado.inserts).toBe(1);
  });

  test("fallback estático: sin la tabla roles_obra un Capataz sigue operando", async () => {
    estado.tablaRoles = false;
    estado.rolMiembro = "Capataz";

    expect(await registrar()).toHaveLength(1);
    expect(estado.inserts).toBe(1);
  });

  test("fallback estático: sin la tabla roles_obra un Obrero sigue sin poder crear pedidos", async () => {
    estado.tablaRoles = false;
    estado.rolMiembro = "Obrero";

    await expect(registrar()).rejects.toMatchObject({ status: 403 });
    expect(estado.inserts).toBe(0);
  });
});
