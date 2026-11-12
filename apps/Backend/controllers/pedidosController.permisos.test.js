// Gate de permisos del endpoint directo POST /bot/pedidos/entregar
// (`entregarPedidoDesdeBot`). Después del bug de QA, el gate tiene que usar el perfil
// dinámico de la obra (`perfilEnObra` → roles_obra), no la matriz estática del nombre
// del rol. El perfil se mockea acá; la resolución dinámica/fallback se prueba en
// roles.service.test.js y operaciones.permisos-dinamicos.test.js.
//
// Todo el acceso a datos y servicios externos está mockeado: no se abre conexión a
// Postgres ni se toca stock/actividad reales.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const PEDIDO_ID = "3e0f4a81-4d5e-4f60-9b12-3456789abcde";
const TELEFONO = "5491112345678";

const estado = {
  perfil: null,
  obraExiste: true,
  esMiembro: true,
  conexiones: 0,
  updates: 0,
  commits: 0,
};

function perfil(nombre, bot = {}, { esSistema = false } = {}) {
  return {
    rol: { id: `rol-${nombre}`, nombre, nivel: 20, es_sistema: esSistema },
    permisos: { bot, web: {} },
  };
}

function normalizar(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

const perfilEnObraMock = mock(async () => estado.perfil);
const resolvePersonaMock = mock(async () => PERSONA_ID);
const esMiembroMock = mock(async () => estado.esMiembro);
const aplicarMovimientoMock = mock(async () => {});
const registrarActividadMock = mock(async () => {});
const resumenPedidoMock = mock(async () => ({
  material: "Cemento",
  proveedor: null,
  rubroId: null,
  tags: [],
}));

mock.module("../db.js", () => ({
  pool: {
    query: async (sql) => {
      const texto = normalizar(sql);
      if (texto.startsWith("SELECT 1 FROM obras")) {
        return { rows: estado.obraExiste ? [{ "?column?": 1 }] : [], rowCount: 1 };
      }
      if (texto.startsWith("SELECT nombre FROM personas")) {
        return { rows: [{ nombre: "Obrero Test" }], rowCount: 1 };
      }
      throw new Error(`consulta SQL no prevista en el test: ${texto}`);
    },
    connect: async () => {
      estado.conexiones += 1;
      return {
        query: async (sql) => {
          const texto = normalizar(sql);
          if (texto === "BEGIN" || texto === "ROLLBACK") return { rows: [], rowCount: 0 };
          if (texto === "COMMIT") {
            estado.commits += 1;
            return { rows: [], rowCount: 0 };
          }
          if (texto.includes("FROM pedidos_materiales") && texto.includes("FOR UPDATE")) {
            return {
              rows: [{ id: PEDIDO_ID, obra_id: OBRA_ID, estado: "aprobado" }],
              rowCount: 1,
            };
          }
          if (texto.startsWith("UPDATE pedidos_materiales")) {
            estado.updates += 1;
            return { rows: [{ id: PEDIDO_ID, estado: "entregado" }], rowCount: 1 };
          }
          if (texto.includes("FROM pedidos_items")) {
            return { rows: [], rowCount: 0 };
          }
          throw new Error(`consulta SQL no prevista en la transacción: ${texto}`);
        },
        release() {},
      };
    },
  },
}));

mock.module("../services/personaService.js", () => ({
  resolvePersonaIdByTelefono: resolvePersonaMock,
  resolvePersonaIdByNombre: async () => null,
}));

mock.module("../services/obraAccess.service.js", () => ({
  esMiembroDeObra: esMiembroMock,
  rolEnObra: async () => "Obrero",
  obraDePedido: async () => ({ obra_id: OBRA_ID }),
  obraDeMaterial: async () => ({ obra_id: OBRA_ID }),
  proveedorAccesible: async () => null,
}));

// El controller no debe preguntar por la matriz estática: el rol sale resuelto de acá.
mock.module("../services/roles.service.js", () => ({
  perfilEnObra: perfilEnObraMock,
  // Exportes que consumen permisos.service/obraAccess reales si algún módulo los importa.
  CATALOGO_PERMISOS: { bot: [], web: [] },
  ROLES_SISTEMA: [],
  normalizarRol: (rol) => rol ?? "Obrero",
}));

mock.module("../services/stock.service.js", () => ({
  aplicarMovimientoStock: aplicarMovimientoMock,
}));

mock.module("../services/actividad.service.js", () => ({
  registrarActividad: registrarActividadMock,
  resumenPedido: resumenPedidoMock,
}));

const { entregarPedidoDesdeBot } = await import("./pedidosController.js");

function req() {
  return {
    body: { obra_id: OBRA_ID, telefono: TELEFONO, pedido_id: PEDIDO_ID },
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
  estado.perfil = null;
  estado.obraExiste = true;
  estado.esMiembro = true;
  estado.conexiones = 0;
  estado.updates = 0;
  estado.commits = 0;
  perfilEnObraMock.mockClear();
  resolvePersonaMock.mockClear();
  esMiembroMock.mockClear();
  aplicarMovimientoMock.mockClear();
  registrarActividadMock.mockClear();
});

describe("entregarPedidoDesdeBot — permiso bot dinámico pedido.entregar", () => {
  test("403: un rol personalizado sin pedido.entregar no entrega ni muta nada", async () => {
    estado.perfil = perfil("Supervisor QA Cero", {});

    const res = resFalso();
    await entregarPedidoDesdeBot(req(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain("Supervisor QA Cero");
    expect(perfilEnObraMock).toHaveBeenCalledWith(PERSONA_ID, OBRA_ID);
    expect(estado.conexiones).toBe(0); // ni siquiera abre transacción
    expect(estado.updates).toBe(0);
    expect(estado.commits).toBe(0);
  });

  test("403: un rol de sistema con pedido.entregar quitado en la obra tampoco entrega", async () => {
    estado.perfil = perfil("Capataz", {}, { esSistema: true });

    const res = resFalso();
    await entregarPedidoDesdeBot(req(), res);

    expect(res.statusCode).toBe(403);
    expect(estado.conexiones).toBe(0);
    expect(estado.updates).toBe(0);
  });

  test("200: un rol personalizado con pedido.entregar entrega el pedido", async () => {
    estado.perfil = perfil("Ayudante QA", { "pedido.entregar": true });

    const res = resFalso();
    await entregarPedidoDesdeBot(req(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ id: PEDIDO_ID, estado: "entregado" });
    expect(estado.conexiones).toBe(1);
    expect(estado.updates).toBe(1);
    expect(estado.commits).toBe(1);
  });

  test("403: una persona que no es miembro de la obra no entrega nada", async () => {
    estado.esMiembro = false;

    const res = resFalso();
    await entregarPedidoDesdeBot(req(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("No pertenecés a esta obra");
    expect(estado.conexiones).toBe(0);
  });
});
