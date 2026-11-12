// Tests de tareasController.actualizarTarea: contrato de limpieza de campos del PATCH.
//
// El contrato es: "" limpia (NULL), null/undefined no tocan el valor actual. Antes
// todo era COALESCE, así que borrar una fecha, un costo o el responsable no tenía
// efecto: el formulario de edición parecía guardar pero el dato seguía igual.
//
// Se mockea el acceso a datos y los servicios laterales (embeddings, actividad,
// persona). No toca Postgres ni OpenAI.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const TAREA_ID = "4a1b2c3d-1111-4eee-9fff-0123456789ab";
const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const RUBRO_ID = "7f6e5d4c-3333-4bbb-8aaa-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const MIEMBRO_ID = "9e8d7c6b-4444-4ccc-9ddd-0123456789ab";

const estado = {
  queries: [],
  esMiembro: true,
  tareaExiste: true,
};

function normalizar(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

function responder(sql, params) {
  const s = normalizar(sql);
  if (s.startsWith("SELECT obra_id FROM tareas WHERE id = $1")) {
    return { rows: estado.tareaExiste ? [{ obra_id: OBRA_ID }] : [] };
  }
  if (s.startsWith("SELECT id FROM rubros WHERE id = $1")) {
    return { rows: params?.[0] ? [{ id: params[0] }] : [] };
  }
  if (s.startsWith("SELECT id FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2")) {
    return { rows: estado.esMiembro ? [{ id: MIEMBRO_ID }] : [] };
  }
  if (s.startsWith("UPDATE tareas SET")) {
    return { rows: [{ id: TAREA_ID, titulo: "Tarea editada", obra_id: OBRA_ID }] };
  }
  return { rows: [] };
}

const clientQuery = mock(async (sql, params) => {
  estado.queries.push({ sql: normalizar(sql), params });
  return responder(sql, params);
});

const client = { query: clientQuery, release: mock(() => {}) };

const poolQuery = mock(async (sql, params) => {
  estado.queries.push({ sql: normalizar(sql), params });
  return responder(sql, params);
});

mock.module("../db.js", () => ({
  pool: { query: poolQuery, connect: async () => client },
}));

mock.module("../services/embeddings.service.js", () => ({
  guardarEmbedding: mock(async () => {}),
  guardarEmbeddings: mock(async () => {}),
}));

mock.module("../services/actividad.service.js", () => ({
  registrarActividad: mock(async () => {}),
}));

mock.module("../services/personaService.js", () => ({
  resolvePersonaIdByTelefono: mock(async () => null),
}));

// El import va DESPUÉS de mock.module para que el controller tome los mocks
const { actualizarTarea } = await import("./tareasController.js");

function makeRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

const reqPatch = (body) => ({ params: { id: TAREA_ID }, body });
const buscar = (fragmento) => estado.queries.find((q) => q.sql.startsWith(fragmento));

beforeEach(() => {
  estado.queries = [];
  estado.esMiembro = true;
  estado.tareaExiste = true;
  clientQuery.mockClear();
  poolQuery.mockClear();
});

describe("actualizarTarea — validaciones", () => {
  test("rechaza titulo vacío sin tocar la base", async () => {
    const res = makeRes();
    await actualizarTarea(reqPatch({ titulo: "   " }), res);

    expect(res.statusCode).toBe(400);
    expect(estado.queries.length).toBe(0);
  });

  test("rechaza fecha_inicio vacía (es NOT NULL)", async () => {
    const res = makeRes();
    await actualizarTarea(reqPatch({ fecha_inicio: "" }), res);

    expect(res.statusCode).toBe(400);
    expect(estado.queries.length).toBe(0);
  });

  test("rechaza completar por PATCH (va por /completar)", async () => {
    const res = makeRes();
    await actualizarTarea(reqPatch({ estado: "completada" }), res);

    expect(res.statusCode).toBe(400);
    expect(estado.queries.length).toBe(0);
  });

  test("404 si la tarea no existe", async () => {
    estado.tareaExiste = false;
    const res = makeRes();
    await actualizarTarea(reqPatch({ titulo: "Otra" }), res);

    expect(res.statusCode).toBe(404);
  });

  test("404 si asignado_a no es miembro de la obra", async () => {
    estado.esMiembro = false;
    const res = makeRes();
    await actualizarTarea(reqPatch({ asignado_a: PERSONA_ID }), res);

    expect(res.statusCode).toBe(404);
    expect(buscar("UPDATE tareas SET")).toBeUndefined();
  });
});

describe("actualizarTarea — contrato de limpieza ('' => NULL)", () => {
  test("manda '' para descripcion, fecha_limite, asignado_a y costo", async () => {
    const res = makeRes();
    await actualizarTarea(
      reqPatch({
        descripcion: "",
        fecha_limite: "",
        asignado_a: "",
        costo_estimado: "",
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    const update = buscar("UPDATE tareas SET");
    expect(update).toBeTruthy();
    // El SQL no usa COALESCE para los campos limpiables
    expect(update.sql).toContain("CASE WHEN $2::text = '' THEN NULL");
    expect(update.sql).toContain("CASE WHEN $7::text = '' THEN NULL");
    expect(update.sql).toContain("CASE WHEN $8::text = '' THEN NULL");
    expect(update.sql).toContain("CASE WHEN $9::text = '' THEN NULL");
    // ...y los params son el string vacío, no null (null = "no tocar")
    expect(update.params[1]).toBe("");
    expect(update.params[6]).toBe("");
    expect(update.params[7]).toBe("");
    expect(update.params[8]).toBe("");
  });

  test("un campo ausente viaja como null y queda sin tocar", async () => {
    const res = makeRes();
    await actualizarTarea(reqPatch({ titulo: "Solo el título" }), res);

    expect(res.statusCode).toBe(200);
    const update = buscar("UPDATE tareas SET");
    expect(update.params[0]).toBe("Solo el título");
    expect(update.params[1]).toBe(null); // descripcion
    expect(update.params[6]).toBe(null); // fecha_limite
    expect(update.params[8]).toBe(null); // costo
  });

  test("resuelve asignado_a (persona) a miembros_obra.id", async () => {
    const res = makeRes();
    await actualizarTarea(reqPatch({ asignado_a: PERSONA_ID }), res);

    expect(res.statusCode).toBe(200);
    const update = buscar("UPDATE tareas SET");
    expect(update.params[7]).toBe(MIEMBRO_ID);
  });

  test("valida el rubro y lo pasa como uuid", async () => {
    const res = makeRes();
    await actualizarTarea(reqPatch({ rubro_id: RUBRO_ID }), res);

    expect(res.statusCode).toBe(200);
    expect(buscar("SELECT id FROM rubros WHERE id = $1")).toBeTruthy();
    expect(buscar("UPDATE tareas SET").params[2]).toBe(RUBRO_ID);
  });

  test("sin estado no limpia los datos de completado (no reabre)", async () => {
    const res = makeRes();
    await actualizarTarea(reqPatch({ titulo: "Sin estado" }), res);

    const update = buscar("UPDATE tareas SET");
    expect(update.sql).not.toContain("completada_por = NULL");
    expect(update.sql).not.toContain("fecha_completada = NULL");
  });

  test("con estado pendiente reabre y limpia completada_por", async () => {
    const res = makeRes();
    await actualizarTarea(reqPatch({ estado: "pendiente" }), res);

    const update = buscar("UPDATE tareas SET");
    expect(update.sql).toContain("completada_por = NULL");
    expect(update.sql).toContain("fecha_completada = NULL");
  });

  test("porcentaje_avance fuera de rango devuelve 400", async () => {
    const res = makeRes();
    await actualizarTarea(reqPatch({ porcentaje_avance: 130 }), res);

    expect(res.statusCode).toBe(400);
    expect(estado.queries.length).toBe(0);
  });
});
