// Tests de los endpoints de rol del core:
// - GET /obras/:obraId/mi-rol (getMiRol): rol + permisos efectivos, 403 sin membresía.
// - GET /obras/:obraId (getObra): agrega miRol y exige membresía.
// - POST /obras (crearObra): siembra los seis roles de sistema en la transacción.
//
// Se usa el roles.service REAL con un pool falso: lo que se verifica es el
// contrato HTTP (shape y códigos) y que el seed corra antes de vincular al creador.
// No se toca Postgres ni se llama a OpenAI.

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ROLES_SISTEMA, normalizarPermisos } from "../services/roles.service.js";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const RUBRO_ID = "2d9e3f70-3c4d-4e5f-8a11-23456789abcd";

const estado = {
  miembro: true,
  rol: "Administrativo",
  obraExiste: true,
  roles: [],
  queries: [],
};

const obraRow = () => ({
  id: OBRA_ID,
  nombre: "Obra de prueba",
  code: "OBR-2026-0001",
  direccion: "Av. Siempre Viva 742",
  city: "CABA",
  province: "Buenos Aires",
  zip: "C1093",
  country: "ar",
  type: "edificio",
  estado: "en-curso",
  fecha_inicio: null,
  fecha_fin_estimada: null,
  aprobacion_automatica: false,
  alerts: "0",
  pedidos: "0",
  tareas_total: "0",
  tareas_completadas: "0",
});

function filaRol(nombre) {
  const definicion = ROLES_SISTEMA.find((rol) => rol.nombre === nombre);
  return {
    id: `00000000-0000-4000-8000-${String(ROLES_SISTEMA.indexOf(definicion) + 1).padStart(12, "0")}`,
    obra_id: OBRA_ID,
    nombre,
    descripcion: definicion.descripcion,
    nivel: definicion.nivel,
    es_sistema: true,
    permisos: normalizarPermisos(definicion.permisos),
    created_at: "2026-11-12T12:00:00.000Z",
    updated_at: "2026-11-12T12:00:00.000Z",
  };
}

function responder(sqlOriginal, params = []) {
  const sql = String(sqlOriginal).replace(/\s+/g, " ").trim();
  estado.queries.push({ sql, params });

  if (/^(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE SAVEPOINT|ROLLBACK TO SAVEPOINT)/.test(sql)) {
    return { rows: [], rowCount: 0 };
  }

  if (sql.startsWith("SELECT 1 FROM miembros_obra")) {
    return { rows: estado.miembro ? [{ "?column?": 1 }] : [] };
  }

  if (sql.startsWith("SELECT rol FROM miembros_obra")) {
    return { rows: estado.miembro ? [{ rol: estado.rol }] : [] };
  }

  if (sql.startsWith("SELECT * FROM roles_obra WHERE obra_id = $1 AND lower(nombre) = lower($2)")) {
    const [, nombre] = params;
    const fila = estado.roles.find(
      (rol) => rol.nombre.toLowerCase() === String(nombre).trim().toLowerCase()
    );
    return { rows: fila ? [fila] : [] };
  }

  if (sql.startsWith("SELECT o.*") && sql.includes("FROM obras o WHERE o.id = $1")) {
    return { rows: estado.obraExiste ? [obraRow()] : [] };
  }

  if (sql.startsWith("SELECT p.id, UPPER(LEFT(p.nombre")) {
    return { rows: [] };
  }

  // --- crearObra ---
  if (sql.startsWith("SELECT id FROM obras WHERE code = $1")) return { rows: [] };
  if (sql.startsWith("INSERT INTO obras")) return { rows: [{ id: OBRA_ID }] };
  if (sql.startsWith("SELECT to_regclass('public.roles_obra')")) {
    return { rows: [{ tabla: "roles_obra" }] };
  }
  if (sql.startsWith("INSERT INTO roles_obra")) {
    const [obraId, nombre, descripcion, nivel, permisosJson] = params;
    estado.roles.push({
      id: `nuevo-${nombre}`,
      obra_id: obraId,
      nombre,
      descripcion,
      nivel: Number(nivel),
      es_sistema: true,
      permisos: JSON.parse(permisosJson),
    });
    return { rows: [], rowCount: 1 };
  }
  if (sql.startsWith("SELECT id FROM personas WHERE auth_user_id")) {
    return { rows: [{ id: PERSONA_ID }] };
  }
  if (sql.startsWith("INSERT INTO miembros_obra")) return { rows: [], rowCount: 1 };
  if (sql.startsWith("INSERT INTO presupuestos")) return { rows: [], rowCount: 1 };
  if (sql.startsWith("INSERT INTO rubros")) return { rows: [{ id: RUBRO_ID }] };
  if (sql.startsWith("INSERT INTO presupuesto_rubros")) return { rows: [], rowCount: 1 };
  if (sql.startsWith("INSERT INTO categorias_materiales")) return { rows: [], rowCount: 1 };

  throw new Error(`consulta SQL no prevista en obras.roles.test: ${sql}`);
}

const client = { query: mock(responder), release: mock(() => {}) };
const pool = {
  query: mock(responder),
  connect: mock(async () => client),
};

mock.module("../db.js", () => ({ pool }));
mock.module("../services/embeddings.service.js", () => ({
  guardarEmbeddings: mock(async () => {}),
  guardarEmbedding: mock(async () => {}),
}));

const { crearObra, getMiRol, getObra } = await import("./obrasController.js");

function makeRes() {
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
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

const reqParams = (extra = {}) => ({ params: { obraId: OBRA_ID }, ...extra });

const reqCrear = () => ({
  user: { id: "auth-user-1", user_metadata: {} },
  body: {
    name: "Obra nueva",
    type: "edificio",
    address: "Av. Corrientes 1234",
    presupuestoTotal: 1000000,
    rubros: [{ nombre: "Albañilería", presupuesto: 500000 }],
  },
});

const llamadas = (fragmento) =>
  estado.queries.filter(({ sql }) => sql.includes(fragmento));

beforeEach(() => {
  estado.miembro = true;
  estado.rol = "Administrativo";
  estado.obraExiste = true;
  estado.roles = ROLES_SISTEMA.map((rol) => filaRol(rol.nombre));
  estado.queries = [];
  client.query.mockClear();
  client.release.mockClear();
  pool.query.mockClear();
  pool.connect.mockClear();
});

// --- GET /obras/:obraId/mi-rol ---------------------------------------------

describe("getMiRol", () => {
  test("devuelve el rol y los permisos efectivos del que llama", async () => {
    const res = makeRes();
    await getMiRol(reqParams({ personaId: PERSONA_ID }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.rol).toEqual({
      id: filaRol("Administrativo").id,
      nombre: "Administrativo",
      nivel: 60,
      es_sistema: true,
    });
    // Matriz bot: Administrativo ajusta stock y crea pedidos, no registra stock.
    expect(res.body.permisos.bot).toContain("stock.ajustar");
    expect(res.body.permisos.bot).toContain("pedido.crear");
    expect(res.body.permisos.bot).not.toContain("stock.registrar");
    // Matriz web: exporta reportes, no administra roles ni configuración.
    expect(res.body.permisos.web).toContain("reportes.exportar");
    expect(res.body.permisos.web).toContain("presupuesto.ver");
    expect(res.body.permisos.web).not.toContain("roles.administrar");
    expect(res.body.permisos.web).not.toContain("configuracion.ver");
    // Los mapas completos permiten chequeos O(1) en el frontend.
    expect(res.body.permisos.botMap["stock.ajustar"]).toBe(true);
    expect(res.body.permisos.botMap["stock.registrar"]).toBe(false);
    expect(res.body.permisos.webMap["roles.administrar"]).toBe(false);
  });

  test("un rol legacy guardado en miembros_obra se resuelve al rol canónico", async () => {
    estado.rol = "Director de obra";
    const res = makeRes();
    await getMiRol(reqParams({ personaId: PERSONA_ID }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.rol.nombre).toBe("Director");
    expect(res.body.permisos.web).toContain("roles.administrar");
  });

  test("403 si la persona no es miembro de la obra", async () => {
    estado.miembro = false;
    const res = makeRes();
    await getMiRol(reqParams({ personaId: PERSONA_ID }), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  test("403 si no hay persona autenticada (sin fila en personas)", async () => {
    const res = makeRes();
    await getMiRol(reqParams({ personaId: undefined }), res);

    expect(res.statusCode).toBe(403);
  });
});

// --- GET /obras/:obraId -----------------------------------------------------

describe("getObra con miRol", () => {
  test("incluye miRol además del contrato existente de la obra", async () => {
    estado.rol = "Capataz";
    const res = makeRes();
    await getObra(reqParams({ personaId: PERSONA_ID }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Obra de prueba");
    expect(res.body.miRol.rol.nombre).toBe("Capataz");
    expect(res.body.miRol.permisos.web).toContain("pedidos.aprobar");
    expect(res.body.miRol.permisos.web).not.toContain("presupuesto.editar");
  });

  test("403 si no es miembro (la obra ya no se filtra solo por autenticación)", async () => {
    estado.miembro = false;
    const res = makeRes();
    await getObra(reqParams({ personaId: PERSONA_ID }), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  test("404 si la obra no existe (siendo miembro)", async () => {
    estado.obraExiste = false;
    const res = makeRes();
    await getObra(reqParams({ personaId: PERSONA_ID }), res);

    expect(res.statusCode).toBe(404);
  });
});

// --- POST /obras ------------------------------------------------------------

describe("crearObra — seed de roles", () => {
  test("inserta los seis roles de sistema antes de vincular al creador", async () => {
    const res = makeRes();
    await crearObra(reqCrear(), res);

    expect(res.statusCode).toBe(201);

    const insertsRoles = llamadas("INSERT INTO roles_obra");
    expect(insertsRoles.length).toBe(6);
    expect(insertsRoles.map(({ params }) => params[1])).toEqual([
      "Cliente",
      "Obrero",
      "Seguridad e Higiene",
      "Capataz",
      "Administrativo",
      "Director",
    ]);
    expect(insertsRoles.every(({ sql }) => sql.includes("ON CONFLICT (obra_id, lower(nombre)) DO NOTHING"))).toBe(true);

    const indicePrimerRol = estado.queries.findIndex(({ sql }) => sql.includes("INSERT INTO roles_obra"));
    const indiceMiembro = estado.queries.findIndex(({ sql }) => sql.includes("INSERT INTO miembros_obra"));
    expect(indicePrimerRol).toBeGreaterThan(-1);
    expect(indiceMiembro).toBeGreaterThan(indicePrimerRol);

    // El creador queda como Director en la obra.
    const miembro = estado.queries.find(({ sql }) => sql.includes("INSERT INTO miembros_obra"));
    expect(miembro.params).toContain("Director");
  });

  test("si el seed falla por falta de migración, la obra se crea igual", async () => {
    // Con to_regclass en null el servicio no inserta (no lanza).
    const responderOriginal = responder;
    estado.roles = [];
    // El fake no distingue to_regclass null; se simula devolviendo null con un
    // wrapper del pool para esta corrida.
    pool.connect.mockImplementationOnce(async () => ({
      query: mock(async (sqlOriginal, params = []) => {
        const sql = String(sqlOriginal).replace(/\s+/g, " ").trim();
        if (sql.startsWith("SELECT to_regclass('public.roles_obra')")) {
          estado.queries.push({ sql, params });
          return { rows: [{ tabla: null }] };
        }
        return responderOriginal(sqlOriginal, params);
      }),
      release: mock(() => {}),
    }));
    const errOriginal = console.warn;
    console.warn = () => {};
    try {
      const res = makeRes();
      await crearObra(reqCrear(), res);
      expect(res.statusCode).toBe(201);
      expect(llamadas("INSERT INTO roles_obra").length).toBe(0);
    } finally {
      console.warn = errOriginal;
    }
  });
});
