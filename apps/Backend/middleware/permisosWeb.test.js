// Tests del enforcement web de roles (middleware/permisosWeb.js).
//
// Se testea la política REAL: el middleware usa `roles.service` (no mockeado) y los
// controllers reales de pedidos/materiales/presupuestos/operaciones. Lo único que se
// mockea es el acceso a datos (`db.js`), que responde las consultas de membresía,
// `roles_obra` y de los recursos, y los servicios de efecto lateral que no son objeto
// de este test (stock, actividad, presupuesto, Supabase).
//
// Por qué un solo archivo: dos archivos que mockean el mismo módulo se filtran entre
// sí en Bun. Acá se ejecutan tanto los casos unitarios del middleware como la cadena
// `exigirPermiso + controller` sin duplicar mocks.

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ROLES_SISTEMA, normalizarPermisos } from "../services/roles.service.js";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const OTRA_OBRA_ID = "9f8e7d6c-5b4a-4938-8271-abcdefabcdef";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const PEDIDO_ID = "3d4e5f60-6a7b-4c8d-9e0f-112233445566";
const MATERIAL_ID = "4e5f6071-7b8c-4d9e-8f01-223344556677";
const OPERACION_ID = "5f607182-8c9d-4e0f-9a12-334455667788";
const PROVEEDOR_ID = "60718293-9d0e-4f10-8b23-445566778899";
const RUBRO_ID = "718293a4-0e1f-4a21-9c34-556677889900";

const estado = {
  rolLlamante: "Capataz", // rol del miembro (null = miembro con rol sin asignar)
  esMiembro: true, // false = no pertenece a la obra
  permisosPorRol: {}, // override de la matriz por nombre de rol
  obraRecurso: OBRA_ID,
  recursoExiste: true,
  proveedorScope: "obra",
  proveedorObra: OBRA_ID,
  operacion: {
    id: OPERACION_ID,
    obra_id: OBRA_ID,
    estado: "pendiente",
    endpoint: "/bot/pedidoDeCompra",
    method: "POST",
    mensaje_id: null,
  },
  consultas: [],
};

function filaRol(nombre) {
  const buscado = String(nombre ?? "").trim().toLowerCase();
  const base = ROLES_SISTEMA.find((rol) => rol.nombre.toLowerCase() === buscado);
  if (!base) return null;
  const override = estado.permisosPorRol[base.nombre];
  const permisos = override
    ? {
      bot: { ...base.permisos.bot, ...override.bot },
      web: { ...base.permisos.web, ...override.web },
    }
    : base.permisos;
  return {
    id: `rol-${base.nombre}`,
    obra_id: OBRA_ID,
    nombre: base.nombre,
    descripcion: base.descripcion,
    nivel: base.nivel,
    es_sistema: true,
    permisos: normalizarPermisos(permisos),
  };
}

const normalizar = (sql) => String(sql).replace(/\s+/g, " ").trim();
const TABLAS_RECURSO = ["pedidos_materiales", "materiales", "gastos", "tareas", "alertas", "fotos_obra", "operaciones_bot"];

// Traduce el SQL a filas. Lo que no está mapeado revienta: si un controller cambia
// una consulta, el test avisa en vez de pasar con datos inventados.
function responder(sql, params = []) {
  const consulta = normalizar(sql);
  estado.consultas.push(consulta);

  if (/^(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)/.test(consulta)) {
    return { rows: [], rowCount: 0 };
  }

  // roles.service.perfilEnObra
  if (consulta.startsWith("SELECT rol FROM miembros_obra")) {
    return { rows: estado.esMiembro ? [{ rol: estado.rolLlamante }] : [] };
  }

  // roles.service.resolverRol
  if (consulta.includes("FROM roles_obra") && consulta.includes("lower(nombre) = lower($2)")) {
    const rol = filaRol(params[1]);
    return { rows: rol ? [rol] : [] };
  }

  // obraAccess.service.esMiembroDeObra
  if (consulta.startsWith("SELECT 1 FROM miembros_obra")) {
    return { rows: estado.esMiembro ? [{}] : [] };
  }

  // Resolvers de recurso del middleware (y obraAccess.obraDeMaterial/obraDePedido)
  if (consulta === "SELECT obra_id, scope FROM proveedores WHERE id = $1") {
    if (!estado.recursoExiste) return { rows: [] };
    return { rows: [{ obra_id: estado.proveedorObra, scope: estado.proveedorScope }] };
  }
  for (const tabla of TABLAS_RECURSO) {
    if (consulta === `SELECT obra_id FROM ${tabla} WHERE id = $1`) {
      return { rows: estado.recursoExiste ? [{ obra_id: estado.obraRecurso }] : [] };
    }
  }

  // ── pedidosController.crearPedidoWeb ──
  if (consulta === "SELECT id FROM obras WHERE id = $1") {
    return { rows: [{ id: params[0] }] };
  }
  if (consulta.includes("FROM proveedores WHERE id = $1 AND activo")) {
    return { rows: [{ id: params[0], scope: "obra", obra_id: estado.obraRecurso, nombre: "Ferretería" }] };
  }
  if (consulta.startsWith("SELECT costo_unitario FROM materiales")) {
    return { rows: [{ costo_unitario: "150.00" }] };
  }
  if (consulta.startsWith("INSERT INTO pedidos_materiales")) {
    return { rows: [{ id: PEDIDO_ID, obra_id: params[0], total: 300 }], rowCount: 1 };
  }
  if (consulta.startsWith("INSERT INTO pedidos_items")) {
    return { rows: [], rowCount: 1 };
  }
  if (consulta.startsWith("INSERT INTO alertas")) {
    return { rows: [], rowCount: 1 };
  }

  // ── operacionesController (aprobar/rechazar) ──
  if (consulta === "SELECT * FROM operaciones_bot WHERE id = $1") {
    return { rows: params[0] === estado.operacion.id ? [{ ...estado.operacion }] : [] };
  }
  if (consulta.startsWith("UPDATE operaciones_bot SET estado = 'rechazada'")) {
    return {
      rows: [{ ...estado.operacion, estado: "rechazada", aprobada_por: params[0] }],
      rowCount: 1,
    };
  }
  if (consulta.startsWith("UPDATE alertas SET resuelta")) {
    return { rows: [], rowCount: 0 };
  }
  if (consulta.startsWith("UPDATE mensajes")) {
    return { rows: [], rowCount: 1 };
  }
  if (consulta.includes("FROM operaciones_bot WHERE mensaje_id = $1")) {
    return { rows: [{ pendientes: 0, errores: 0, ejecutadas: 0, total: 0 }] };
  }

  // ── presupuestosController.ajustarRubros ──
  if (consulta === "SELECT 1 FROM obras WHERE id = $1 FOR UPDATE") {
    return { rows: [{}] };
  }
  if (consulta.startsWith("UPDATE presupuesto_rubros")) {
    return { rows: [], rowCount: 1 };
  }
  if (consulta.startsWith("UPDATE presupuestos SET total")) {
    return { rows: [], rowCount: 1 };
  }
  if (consulta.startsWith("INSERT INTO presupuestos (obra_id")) {
    return { rows: [], rowCount: 1 };
  }
  if (consulta.startsWith("INSERT INTO presupuesto_ajustes")) {
    return { rows: [], rowCount: 1 };
  }

  throw new Error(`pool.query no esperado en permisosWeb.test: ${consulta}`);
}

const poolQuery = mock(async (sql, params) => responder(sql, params));
const clientQuery = mock(async (sql, params) => responder(sql, params));

mock.module("../db.js", () => ({
  pool: {
    query: poolQuery,
    connect: async () => ({ query: clientQuery, release: () => {} }),
  },
}));

// Supabase solo lo usa materialesController para Storage: acá no se sube nada.
mock.module("../supabaseClient.js", () => ({ supabase: {}, supabaseAdmin: {} }));

const MATERIAL_ACTUALIZADO = { id: MATERIAL_ID, nombre: "Cemento", stock_actual: 15 };
const aplicarMovimientoStockMock = mock(async () => MATERIAL_ACTUALIZADO);
mock.module("../services/stock.service.js", () => ({
  aplicarMovimientoStock: aplicarMovimientoStockMock,
}));

const registrarActividadMock = mock(async () => {});
mock.module("../services/actividad.service.js", () => ({
  registrarActividad: registrarActividadMock,
  resumenPedido: async () => ({
    material: "Cemento",
    proveedor: "Ferretería",
    rubroId: null,
    tags: [],
  }),
}));

const calcularRubrosMock = mock(async () => [
  { rubro_id: RUBRO_ID, nombre: "Albañilería", cap: 1000, spent: 100, comp: 0 },
]);
mock.module("../services/presupuesto.service.js", () => ({
  calcularRubros: calcularRubrosMock,
  resumir: (rubros) => ({
    total: rubros.reduce((suma, r) => suma + Number(r.cap), 0),
    ejecutado: rubros.reduce((suma, r) => suma + Number(r.spent), 0),
    comprometido: rubros.reduce((suma, r) => suma + Number(r.comp), 0),
  }),
  proyectarGasto: async () => [],
}));

const {
  exigirPermiso,
  labelDePermiso,
  obraDeBody,
  obraDeMaterial,
  obraDeMaterialVinculo,
  obraDeOperacion,
  obraDeParam,
  obraDeProveedor,
  obraDeQuery,
} = await import("./permisosWeb.js");
const { ajustarRubros } = await import("../controllers/presupuestosController.js");
const { ajustarStock } = await import("../controllers/materialesController.js");
const { crearPedidoWeb } = await import("../controllers/pedidosController.js");
const { aprobarOperacionWeb, rechazarOperacionWeb } = await import(
  "../controllers/operacionesController.js"
);

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

// Corre la cadena real: middleware → (si dio permiso) controller.
async function ejecutar(middleware, controller, req) {
  const res = resFalso();
  let paso = false;
  await middleware(req, res, () => {
    paso = true;
  });
  if (paso) await controller(req, res);
  return { res, paso };
}

function consultasDe(texto) {
  return estado.consultas.filter((consulta) => consulta.startsWith(texto));
}

beforeEach(() => {
  estado.rolLlamante = "Capataz";
  estado.esMiembro = true;
  estado.permisosPorRol = {};
  estado.obraRecurso = OBRA_ID;
  estado.recursoExiste = true;
  estado.proveedorScope = "obra";
  estado.proveedorObra = OBRA_ID;
  estado.operacion = {
    id: OPERACION_ID,
    obra_id: OBRA_ID,
    estado: "pendiente",
    endpoint: "/bot/pedidoDeCompra",
    method: "POST",
    mensaje_id: null,
  };
  estado.consultas.length = 0;
  poolQuery.mockClear();
  clientQuery.mockClear();
  aplicarMovimientoStockMock.mockClear();
  registrarActividadMock.mockClear();
  calcularRubrosMock.mockClear();
});

// ─────────────────────────────────────────────────────────────
// exigirPermiso — contrato del 403/404
// ─────────────────────────────────────────────────────────────

describe("exigirPermiso — membrecía y permisos", () => {
  test("sin membresía: 403 SIN_MEMBRESIA y no sigue", async () => {
    estado.esMiembro = false;
    const req = { personaId: PERSONA_ID, params: { obra_id: OBRA_ID } };
    const { res, paso } = await ejecutar(exigirPermiso("pedidos.ver", obraDeParam()), () => {
      throw new Error("el controller no debería correr");
    }, req);

    expect(paso).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ code: "SIN_MEMBRESIA", message: "No pertenecés a esta obra" });
  });

  test("con membresía pero sin permiso: 403 con code, permiso y rol", async () => {
    estado.rolLlamante = "Obrero";
    const req = { personaId: PERSONA_ID, params: { obra_id: OBRA_ID } };
    const { res, paso } = await ejecutar(exigirPermiso("pedidos.crear", obraDeParam()), () => {
      throw new Error("el controller no debería correr");
    }, req);

    expect(paso).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      code: "SIN_PERMISO",
      capacidad: "pedidos.crear",
      mensaje: "Tu rol Obrero no puede crear pedidos",
      permiso: "pedidos.crear",
      message: "Tu rol Obrero no puede crear pedidos",
      rol: "Obrero",
    });
    expect(labelDePermiso("pedidos.crear")).toBe("crear pedidos");
  });

  test("el middleware expone el permiso que exige (cobertura de rutas)", () => {
    expect(exigirPermiso("bandeja.aprobar", obraDeOperacion).permiso).toBe("bandeja.aprobar");
  });

  test("permiso true: llama next(), setea req.obraId y req.perfilObra", async () => {
    const req = { personaId: PERSONA_ID, params: { obra_id: OBRA_ID } };
    const { res, paso } = await ejecutar(exigirPermiso("pedidos.crear", obraDeParam()), () => {}, req);

    expect(paso).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(req.obraId).toBe(OBRA_ID);
    expect(req.perfilObra.rol.nombre).toBe("Capataz");
    expect(req.perfilObra.permisos.web["pedidos.crear"]).toBe(true);
  });

  test("la matriz es la del rol (datos), no el nombre: Capataz sin pedidos.crear da 403", async () => {
    estado.permisosPorRol.Capataz = { web: { "pedidos.crear": false } };
    const req = { personaId: PERSONA_ID, params: { obra_id: OBRA_ID } };
    const { res, paso } = await ejecutar(exigirPermiso("pedidos.crear", obraDeParam()), () => {}, req);

    expect(paso).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.rol).toBe("Capataz");
    expect(res.body.permiso).toBe("pedidos.crear");
  });

  test("un permiso web desconocido revienta al montar la ruta (fail loud)", () => {
    expect(() => exigirPermiso("pedidos.inventado", obraDeParam())).toThrow(
      "Permiso web desconocido: pedidos.inventado"
    );
  });

  test("un error de base responde 500 sin filtrar el detalle", async () => {
    const originalError = console.error;
    console.error = () => {};
    try {
      const middleware = exigirPermiso("pedidos.ver", async () => {
        throw new Error("password de la base");
      });
      const { res, paso } = await ejecutar(middleware, () => {}, { personaId: PERSONA_ID });

      expect(paso).toBe(false);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: "SERVER_ERROR", message: "Error validando permisos" });
    } finally {
      console.error = originalError;
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Resolvers
// ─────────────────────────────────────────────────────────────

describe("resolvers de obra", () => {
  test("recurso inexistente: 404 NOT_FOUND", async () => {
    estado.recursoExiste = false;
    const req = { personaId: PERSONA_ID, params: { id: MATERIAL_ID } };
    const { res, paso } = await ejecutar(exigirPermiso("stock.ajustar", obraDeMaterial), () => {}, req);

    expect(paso).toBe(false);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ code: "NOT_FOUND", message: "Obra no encontrada" });
    expect(consultasDe("SELECT rol FROM miembros_obra")).toHaveLength(0);
  });

  test("id que no es uuid: 404 sin consultar la base", async () => {
    const req = { personaId: PERSONA_ID, params: { id: "no-es-uuid" } };
    const { res } = await ejecutar(exigirPermiso("stock.ajustar", obraDeMaterial), () => {}, req);

    expect(res.statusCode).toBe(404);
    expect(poolQuery).toHaveBeenCalledTimes(0);
  });

  test("obraDeParam acepta obra_id y obraId; un valor inválido da 404", async () => {
    expect(await obraDeParam("obra_id")({ params: { obra_id: OBRA_ID } })).toBe(OBRA_ID);
    expect(await obraDeParam("obraId")({ params: { obraId: OBRA_ID } })).toBe(OBRA_ID);
    expect(await obraDeParam("obraId")({ params: { obraId: "123" } })).toBeNull();
  });

  test("obraDeBody / obraDeQuery: 400 cuando falta el contexto", async () => {
    const sinBody = resFalso();
    await exigirPermiso("pedidos.crear", obraDeBody())({ personaId: PERSONA_ID, body: {} }, sinBody, () => {});
    expect(sinBody.statusCode).toBe(400);
    expect(sinBody.body).toEqual({ code: "OBRA_REQUERIDA", message: "obra_id es requerido" });

    const sinQuery = resFalso();
    await exigirPermiso("proveedores.ver", obraDeQuery())({ personaId: PERSONA_ID, query: {} }, sinQuery, () => {});
    expect(sinQuery.statusCode).toBe(400);
    expect(sinQuery.body.code).toBe("OBRA_REQUERIDA");
  });

  test("obraDeBody: obra_id malformada da 400 (no 500 de Postgres)", async () => {
    const res = resFalso();
    await exigirPermiso("pedidos.crear", obraDeBody())({ personaId: PERSONA_ID, body: { obra_id: "abc" } }, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ code: "OBRA_INVALIDA", message: "obra_id inválido" });
  });

  test("proveedor de obra: autoriza en la obra del proveedor, ignore el contexto", async () => {
    estado.rolLlamante = "Administrativo";
    const req = { personaId: PERSONA_ID, params: { id: PROVEEDOR_ID }, body: { obra_id: OTRA_OBRA_ID } };
    const { paso } = await ejecutar(exigirPermiso("proveedores.gestionar", obraDeProveedor), () => {}, req);

    expect(paso).toBe(true);
    expect(req.obraId).toBe(OBRA_ID);
  });

  test("proveedor global: exige obra_id de contexto (400) y autoriza en esa obra", async () => {
    estado.rolLlamante = "Administrativo";
    estado.proveedorScope = "global";
    estado.proveedorObra = null;

    const sinContexto = resFalso();
    await exigirPermiso("proveedores.gestionar", obraDeProveedor)(
      { personaId: PERSONA_ID, params: { id: PROVEEDOR_ID }, body: {} },
      sinContexto,
      () => {}
    );
    expect(sinContexto.statusCode).toBe(400);
    expect(sinContexto.body.code).toBe("OBRA_REQUERIDA");

    const req = { personaId: PERSONA_ID, params: { id: PROVEEDOR_ID }, body: { obra_id: OTRA_OBRA_ID } };
    const { paso } = await ejecutar(exigirPermiso("proveedores.gestionar", obraDeProveedor), () => {}, req);
    expect(paso).toBe(true);
    expect(req.obraId).toBe(OTRA_OBRA_ID);
  });

  test("obraDeMaterialVinculo usa el material del body (400 si falta)", async () => {
    estado.rolLlamante = "Administrativo";
    const sinMaterial = resFalso();
    await exigirPermiso("proveedores.gestionar", obraDeMaterialVinculo)(
      { personaId: PERSONA_ID, body: {} },
      sinMaterial,
      () => {}
    );
    expect(sinMaterial.statusCode).toBe(400);
    expect(sinMaterial.body.code).toBe("MATERIAL_REQUERIDO");

    const req = { personaId: PERSONA_ID, body: { material_id: MATERIAL_ID } };
    const { paso } = await ejecutar(exigirPermiso("proveedores.gestionar", obraDeMaterialVinculo), () => {}, req);
    expect(paso).toBe(true);
    expect(req.obraId).toBe(OBRA_ID);
  });
});

// ─────────────────────────────────────────────────────────────
// Cadena middleware + controller (403 antes de tocar el controller)
// ─────────────────────────────────────────────────────────────

describe("PATCH /operaciones/:id/rechazar", () => {
  function reqRechazar() {
    return { personaId: PERSONA_ID, params: { id: OPERACION_ID }, body: {} };
  }

  test("Obrero: 403 SIN_PERMISO (bandeja.aprobar) y no rechaza nada", async () => {
    estado.rolLlamante = "Obrero";
    const { res } = await ejecutar(
      exigirPermiso("bandeja.aprobar", obraDeOperacion),
      rechazarOperacionWeb,
      reqRechazar()
    );

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ code: "SIN_PERMISO", permiso: "bandeja.aprobar", rol: "Obrero" });
    expect(consultasDe("UPDATE operaciones_bot")).toHaveLength(0);
  });

  test("Capataz: 200 y la operación queda rechazada", async () => {
    const { res } = await ejecutar(
      exigirPermiso("bandeja.aprobar", (await import("./permisosWeb.js")).obraDeOperacion),
      rechazarOperacionWeb,
      reqRechazar()
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.estado).toBe("rechazada");
    expect(consultasDe("UPDATE operaciones_bot")).toHaveLength(1);
  });

  test("Administrativo (bandeja.aprobar dinámico): 200 aunque la matriz vieja lo excluía", async () => {
    estado.rolLlamante = "Administrativo";
    const { res } = await ejecutar(
      exigirPermiso("bandeja.aprobar", (await import("./permisosWeb.js")).obraDeOperacion),
      rechazarOperacionWeb,
      reqRechazar()
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.estado).toBe("rechazada");
  });
});

describe("PATCH /operaciones/:id/aprobar", () => {
  test("Administrativo sin el permiso bot del endpoint: 403 del servicio, no ejecuta", async () => {
    estado.rolLlamante = "Administrativo";
    estado.operacion.endpoint = "/bot/pedidos/entregar"; // Administrativo no tiene pedido.entregar
    const req = { personaId: PERSONA_ID, params: { id: OPERACION_ID }, body: {} };
    const { res } = await ejecutar(
      exigirPermiso("bandeja.aprobar", (await import("./permisosWeb.js")).obraDeOperacion),
      aprobarOperacionWeb,
      req
    );

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("tu rol Administrativo no puede aprobar esta operación");
  });
});

describe("POST /pedidos", () => {
  function reqPedido() {
    return {
      personaId: PERSONA_ID,
      params: {},
      body: {
        obra_id: OBRA_ID,
        proveedor_id: PROVEEDOR_ID,
        items: [{ material_id: MATERIAL_ID, cantidad: 2 }],
      },
    };
  }

  test("Obrero: 403 SIN_PERMISO (pedidos.crear) y no inserta el pedido", async () => {
    estado.rolLlamante = "Obrero";
    const { res } = await ejecutar(
      exigirPermiso("pedidos.crear", obraDeBody("obra_id")),
      crearPedidoWeb,
      reqPedido()
    );

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ code: "SIN_PERMISO", permiso: "pedidos.crear", rol: "Obrero" });
    expect(consultasDe("INSERT INTO pedidos_materiales")).toHaveLength(0);
  });

  test("Capataz: 201 y crea el pedido", async () => {
    const { res } = await ejecutar(
      exigirPermiso("pedidos.crear", obraDeBody("obra_id")),
      crearPedidoWeb,
      reqPedido()
    );

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(PEDIDO_ID);
    expect(consultasDe("INSERT INTO pedidos_materiales")).toHaveLength(1);
    expect(consultasDe("INSERT INTO pedidos_items")).toHaveLength(1);
  });

  test("sin obra_id en el body: 400 antes de consultar la membresía", async () => {
    const req = reqPedido();
    delete req.body.obra_id;
    const { res } = await ejecutar(
      exigirPermiso("pedidos.crear", obraDeBody("obra_id")),
      crearPedidoWeb,
      req
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("OBRA_REQUERIDA");
    expect(consultasDe("SELECT rol FROM miembros_obra")).toHaveLength(0);
  });
});

describe("POST /materiales/:id/ajuste", () => {
  function reqAjuste() {
    return { personaId: PERSONA_ID, params: { id: MATERIAL_ID }, body: { delta: 5 } };
  }

  test("Obrero: 403 SIN_PERMISO (stock.ajustar) y no mueve stock", async () => {
    estado.rolLlamante = "Obrero";
    const { res } = await ejecutar(
      exigirPermiso("stock.ajustar", obraDeMaterial),
      ajustarStock,
      reqAjuste()
    );

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ code: "SIN_PERMISO", permiso: "stock.ajustar", rol: "Obrero" });
    expect(aplicarMovimientoStockMock).not.toHaveBeenCalled();
  });

  test("Capataz: 200 y aplica el movimiento", async () => {
    const { res } = await ejecutar(
      exigirPermiso("stock.ajustar", obraDeMaterial),
      ajustarStock,
      reqAjuste()
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(MATERIAL_ACTUALIZADO);
    expect(aplicarMovimientoStockMock).toHaveBeenCalledTimes(1);
  });
});

describe("PUT /presupuestos/:obra_id/rubros", () => {
  function reqAjusteRubros() {
    return {
      personaId: PERSONA_ID,
      params: { obra_id: OBRA_ID },
      body: {
        cambios: [{ rubro_id: RUBRO_ID, cap: 2000 }],
        reason: "Ajuste por inflación del trimestre",
      },
    };
  }

  test("Administrativo: 403 SIN_PERMISO (presupuesto.editar) y no toca el presupuesto", async () => {
    estado.rolLlamante = "Administrativo";
    const { res } = await ejecutar(
      exigirPermiso("presupuesto.editar", obraDeParam("obra_id")),
      ajustarRubros,
      reqAjusteRubros()
    );

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      code: "SIN_PERMISO",
      permiso: "presupuesto.editar",
      rol: "Administrativo",
    });
    expect(consultasDe("UPDATE presupuesto_rubros")).toHaveLength(0);
    expect(calcularRubrosMock).not.toHaveBeenCalled();
  });

  test("Director: 200 y persiste el ajuste con su historial", async () => {
    estado.rolLlamante = "Director";
    const { res } = await ejecutar(
      exigirPermiso("presupuesto.editar", obraDeParam("obra_id")),
      ajustarRubros,
      reqAjusteRubros()
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.resumen.total).toBe(2000);
    expect(consultasDe("UPDATE presupuesto_rubros")).toHaveLength(1);
    expect(consultasDe("INSERT INTO presupuesto_ajustes")).toHaveLength(1);
    expect(registrarActividadMock).toHaveBeenCalledTimes(1);
  });
});
