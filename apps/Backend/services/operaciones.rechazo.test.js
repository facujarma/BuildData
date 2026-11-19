// Issue #12: rechazar una operación de la bandeja es una acción de supervisión.
//
// `rechazarOperacion` tiene que exigir el permiso web `bandeja.aprobar` resuelto
// contra `roles_obra` (roles de sistema y personalizados) ANTES de tocar la fila.
// Sin permiso: no cambia el estado, no resuelve la alerta, no actualiza el mensaje
// y —clave del bug— no ejecuta nada por loopback.
//
// Se mockea SOLO `../db.js` (mismo patrón que operaciones.permisos-dinamicos.test.js):
// roles.service.js y operaciones.service.js son los reales, así el test verifica la
// política de verdad y falla si el service deja de consultarla. Nada de base real:
// cualquier SQL no previsto lanza y cualquier `fetch` hace fallar el test.

import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const MENSAJE_ID = "2d9e3f70-3c4d-4e5f-8a01-23456789abcd";
const OP_ID = "3eaf4181-4d5e-4f60-9b12-3456789abcde";

// ─────────────────────────────────────────────────────────────
// Estado del test (lo que el pool falso devuelve)
// ─────────────────────────────────────────────────────────────

const estado = {
  operacion: null,
  rolMiembro: "Obrero",
  roles: [], // filas de roles_obra de la obra
  esMiembro: true,
  rechazos: 0, // UPDATE operaciones_bot ... 'rechazada'
  alertasResueltas: 0, // UPDATE alertas SET resuelta = true
  estadosMensaje: [], // UPDATE mensajes SET estado_procesamiento = ...
};

function normalizar(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

function operacionPendiente(cambios = {}) {
  return {
    id: OP_ID,
    obra_id: OBRA_ID,
    mensaje_id: MENSAJE_ID,
    endpoint: "/bot/pedidoDeCompra",
    method: "POST",
    estado: "pendiente",
    payload: { obra_id: OBRA_ID, items: [] },
    aprobada_por: null,
    ...cambios,
  };
}

// Handler único de pool.query: responde por forma de query, en el orden en que el
// service/controller las hacen. Lo que no está previsto explota (así se detecta
// cualquier acceso nuevo, incluida una ejecución por loopback).
function responder(sqlOriginal, params = []) {
  const sql = normalizar(sqlOriginal);

  // GET /operaciones/:id — resolverAcceso del controller (obraDeOperacion).
  if (sql.startsWith("SELECT obra_id FROM operaciones_bot WHERE id = $1")) {
    const [id] = params;
    const fila = estado.operacion?.id === id ? [{ obra_id: OBRA_ID }] : [];
    return { rows: fila, rowCount: fila.length };
  }

  // resolverAcceso del controller — membresía (obraAccess.service real).
  if (sql.startsWith("SELECT 1 FROM miembros_obra")) {
    const [personaId, obraId] = params;
    const ok = estado.esMiembro && personaId === PERSONA_ID && obraId === OBRA_ID;
    return { rows: ok ? [{ ok: 1 }] : [], rowCount: ok ? 1 : 0 };
  }

  // perfilEnObra — rol del miembro en la obra.
  if (sql.startsWith("SELECT rol FROM miembros_obra")) {
    const [personaId, obraId] = params;
    if (personaId !== PERSONA_ID || obraId !== OBRA_ID) return { rows: [], rowCount: 0 };
    return { rows: [{ rol: estado.rolMiembro }], rowCount: 1 };
  }

  // resolverRol — búsqueda por nombre en roles_obra (case-insensitive).
  if (sql.includes("FROM roles_obra") && sql.includes("lower(nombre) = lower($2)")) {
    const [, nombre] = params;
    const buscado = String(nombre ?? "").trim().toLowerCase();
    const fila = estado.roles.find((rol) => rol.nombre.toLowerCase() === buscado);
    return { rows: fila ? [fila] : [], rowCount: fila ? 1 : 0 };
  }

  // rechazarOperacion — SELECT previo de la operación.
  if (sql.startsWith("SELECT * FROM operaciones_bot WHERE id = $1")) {
    const [id] = params;
    const fila = estado.operacion?.id === id ? [estado.operacion] : [];
    return { rows: fila, rowCount: fila.length };
  }

  // rechazarOperacion — re-lectura cuando el UPDATE condicional no afecta filas.
  if (sql.startsWith("SELECT estado FROM operaciones_bot WHERE id = $1")) {
    const [id] = params;
    const fila = estado.operacion?.id === id ? [{ estado: estado.operacion.estado }] : [];
    return { rows: fila, rowCount: fila.length };
  }

  // rechazarOperacion — UPDATE condicional (anti doble rechazo).
  if (sql.startsWith("UPDATE operaciones_bot") && sql.includes("estado = 'rechazada'")) {
    const [personaId, id] = params;
    if (estado.operacion?.id !== id) return { rows: [], rowCount: 0 };
    if (estado.operacion.estado !== "pendiente" && estado.operacion.estado !== "error") {
      return { rows: [], rowCount: 0 };
    }
    estado.operacion = { ...estado.operacion, estado: "rechazada", aprobada_por: personaId };
    estado.rechazos += 1;
    return { rows: [estado.operacion], rowCount: 1 };
  }

  // resolverAlertaOperacion.
  if (sql.startsWith("UPDATE alertas") && sql.includes("resuelta = true")) {
    estado.alertasResueltas += 1;
    return { rows: [], rowCount: 1 };
  }

  // actualizarEstadoMensaje — conteo de operaciones del mensaje.
  if (sql.includes("count(*) FILTER") && sql.includes("FROM operaciones_bot")) {
    const [mensajeId] = params;
    const propia = estado.operacion?.mensaje_id === mensajeId;
    const estadoActual = propia ? estado.operacion.estado : null;
    return {
      rows: [{
        pendientes: estadoActual === "pendiente" || estadoActual === "ejecutando" ? 1 : 0,
        errores: estadoActual === "error" ? 1 : 0,
        ejecutadas: estadoActual === "ejecutada" ? 1 : 0,
        total: propia ? 1 : 0,
      }],
      rowCount: 1,
    };
  }

  // actualizarEstadoMensaje — estado derivado.
  if (sql.startsWith("UPDATE mensajes")) {
    estado.estadosMensaje.push(params[0]);
    return { rows: [], rowCount: 1 };
  }

  throw new Error(`consulta SQL no prevista en operaciones.rechazo.test: ${sql}`);
}

const poolQuery = mock(async (sql, params) => responder(sql, params));

mock.module("../db.js", () => ({
  pool: {
    query: poolQuery,
    // Rechazar no ejecuta ni abre transacción: si el service lo intentara, el test falla acá.
    connect: async () => {
      throw new Error("pool.connect no esperado: rechazar no ejecuta ni abre transacción");
    },
  },
}));

// `fetch` sí existe en Bun; el executor por loopback lo usaría. Se espía y hace fallar
// ante cualquier llamada: rechazar no puede disparar trabajo.
const fetchOriginal = globalThis.fetch;
const fetchSpy = mock(async (url) => {
  throw new Error(`fetch no esperado en rechazo (se intentó llamar a ${String(url)})`);
});
globalThis.fetch = fetchSpy;

const { ROLES_SISTEMA, normalizarPermisos } = await import("./roles.service.js");
const { rechazarOperacion } = await import("./operaciones.service.js");
const { rechazarOperacionWeb } = await import("../controllers/operacionesController.js");

// Filas de roles_obra tal como las siembra la migración: los seis roles de sistema
// con su matriz completa normalizada.
function filasSistema() {
  return ROLES_SISTEMA.map((rol) => ({
    ...rol,
    id: `rol-${rol.nombre.toLowerCase().replace(/\s+/g, "-")}`,
    obra_id: OBRA_ID,
    permisos: normalizarPermisos(rol.permisos),
  }));
}

// Rol personalizado de la obra. `permisos` va parcial a propósito: perfilEnObra lo
// normaliza igual que la base.
function filaRolPersonalizado({ nombre, web = {}, bot = {} }) {
  return {
    id: `rol-${nombre.toLowerCase().replace(/\s+/g, "-")}`,
    obra_id: OBRA_ID,
    nombre,
    nivel: 40,
    es_sistema: false,
    permisos: { web, bot },
  };
}

function consultas({ desdePool = true } = {}) {
  const llamadas = desdePool ? poolQuery.mock.calls : [];
  return llamadas.map(([sql]) => normalizar(sql));
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

async function rechazarDesdeWeb({ personaId = PERSONA_ID } = {}) {
  const req = { personaId, params: { id: OP_ID } };
  const res = resFalso();
  await rechazarOperacionWeb(req, res);
  return res;
}

beforeEach(() => {
  estado.operacion = operacionPendiente();
  estado.rolMiembro = "Obrero";
  estado.roles = filasSistema();
  estado.esMiembro = true;
  estado.rechazos = 0;
  estado.alertasResueltas = 0;
  estado.estadosMensaje = [];
  poolQuery.mockClear();
  fetchSpy.mockClear();
});

afterAll(() => {
  globalThis.fetch = fetchOriginal;
});

describe("rechazarOperacion — gate de rol (bandeja.aprobar)", () => {
  test("Obrero → forbidden sin tocar la fila, la alerta, el mensaje ni el executor", async () => {
    const resultado = await rechazarOperacion(OP_ID, PERSONA_ID);

    expect(resultado).toEqual({ forbidden: true, rol: "Obrero" });

    // La operación sigue pendiente y no hubo ninguna escritura.
    expect(estado.operacion.estado).toBe("pendiente");
    expect(estado.rechazos).toBe(0);
    expect(estado.alertasResueltas).toBe(0);
    expect(estado.estadosMensaje).toHaveLength(0);

    const escrituras = consultas().filter(
      (sql) => sql.startsWith("UPDATE operaciones_bot") || sql.startsWith("UPDATE alertas") || sql.startsWith("UPDATE mensajes")
    );
    expect(escrituras).toEqual([]);

    // Y jamás se ejecuta por loopback.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("Capataz → rechaza: marca rechazada, resuelve la alerta y actualiza el mensaje", async () => {
    estado.rolMiembro = "Capataz";

    const { operacion } = await rechazarOperacion(OP_ID, PERSONA_ID);

    expect(operacion.estado).toBe("rechazada");
    expect(operacion.aprobada_por).toBe(PERSONA_ID);
    expect(estado.rechazos).toBe(1);

    // La alerta se resuelve una sola vez y por la operación correcta.
    expect(estado.alertasResueltas).toBe(1);
    const updateAlerta = poolQuery.mock.calls.find(([sql]) =>
      normalizar(sql).startsWith("UPDATE alertas")
    );
    expect(updateAlerta?.[1]).toEqual([OP_ID]);

    // Mensaje derivado: todas las operaciones rechazadas → `rechazado`.
    expect(estado.estadosMensaje).toEqual(["rechazado"]);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("rol personalizado CON bandeja.aprobar → rechaza la operación", async () => {
    estado.rolMiembro = "Jefe de Bandeja QA";
    estado.roles.push(
      filaRolPersonalizado({ nombre: "Jefe de Bandeja QA", web: { "bandeja.aprobar": true } })
    );

    const { operacion } = await rechazarOperacion(OP_ID, PERSONA_ID);

    expect(operacion.estado).toBe("rechazada");
    expect(estado.rechazos).toBe(1);
    expect(estado.alertasResueltas).toBe(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("rol personalizado SIN bandeja.aprobar → forbidden y la fila queda pendiente", async () => {
    estado.rolMiembro = "Supervisor QA";
    estado.roles.push(
      filaRolPersonalizado({ nombre: "Supervisor QA", web: { "bandeja.ver": true } })
    );

    const resultado = await rechazarOperacion(OP_ID, PERSONA_ID);

    expect(resultado).toEqual({ forbidden: true, rol: "Supervisor QA" });
    expect(estado.operacion.estado).toBe("pendiente");
    expect(estado.rechazos).toBe(0);
    expect(estado.alertasResueltas).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("rol con permiso bot del endpoint pero SIN bandeja.aprobar → forbidden (Opción A)", async () => {
    estado.rolMiembro = "Repositor QA";
    estado.roles.push(
      filaRolPersonalizado({
        nombre: "Repositor QA",
        web: { "bandeja.ver": true },
        bot: { "pedido.crear": true }, // la operación fixture es /bot/pedidoDeCompra
      })
    );

    const resultado = await rechazarOperacion(OP_ID, PERSONA_ID);

    // Tener el permiso bot del endpoint no alcanza: rechazar exige bandeja.aprobar.
    expect(resultado).toEqual({ forbidden: true, rol: "Repositor QA" });
    expect(estado.rechazos).toBe(0);
    expect(estado.alertasResueltas).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("fail closed: sin personaId → forbidden (rol null) y ni siquiera consulta el perfil", async () => {
    const resultado = await rechazarOperacion(OP_ID, null);

    expect(resultado).toEqual({ forbidden: true, rol: null });
    expect(estado.operacion.estado).toBe("pendiente");
    expect(estado.rechazos).toBe(0);
    expect(estado.alertasResueltas).toBe(0);

    const consultasPerfil = consultas().filter((sql) => sql.includes("FROM miembros_obra"));
    expect(consultasPerfil).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("rechazarOperacionWeb — respuesta HTTP del controller", () => {
  test("Obrero → 403 con mensaje que menciona el rol y la acción, sin rechazar", async () => {
    const res = await rechazarDesdeWeb();

    expect(res.statusCode).toBe(403);
    expect(String(res.body?.error)).toContain("Obrero");
    expect(String(res.body?.error)).toContain("rechazar");

    expect(estado.operacion.estado).toBe("pendiente");
    expect(estado.rechazos).toBe(0);
    expect(estado.alertasResueltas).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("Capataz → 200 con la operación rechazada", async () => {
    estado.rolMiembro = "Capataz";

    const res = await rechazarDesdeWeb();

    expect(res.statusCode).toBe(200);
    expect(res.body?.estado).toBe("rechazada");
    expect(estado.alertasResueltas).toBe(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("ya rechazada → 409 conflict, sin re-rechazar ni resolver la alerta dos veces", async () => {
    estado.operacion = operacionPendiente({ estado: "rechazada" });
    estado.rolMiembro = "Capataz"; // con permiso: el 409 lo decide el estado, no el rol

    const res = await rechazarDesdeWeb();

    expect(res.statusCode).toBe(409);
    expect(String(res.body?.error)).toContain("rechazada");
    expect(estado.rechazos).toBe(0);
    expect(estado.alertasResueltas).toBe(0);
    expect(estado.estadosMensaje).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
