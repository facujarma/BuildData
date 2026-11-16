// Tests de obrasController: categorías de materiales por defecto al crear una obra
// y validaciones del PATCH (código duplicado, estado inválido, campos vacíos, progress).
//
// Se mockea el acceso a datos (`db.js` y `embeddings.service.js`): no toca Postgres,
// no llama a OpenAI y no necesita dotenv. Las aserciones son sobre el SQL emitido y
// sobre el body de la respuesta.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const AUTH_USER_ID = "7f6e5d4c-3b2a-4190-8f7e-6d5c4b3a2010";
const PERSONA_TEL_ID = "8a7b6c5d-4e3f-4201-9a8b-7c6d5e4f3021";
const PERSONA_NUEVA_ID = "9b8c7d6e-5f4a-4312-8b9c-6d7e8f9a1023";
const RUBRO_ID = "2d9e3f70-3c4d-4e5f-8a11-23456789abcd";

const CATEGORIAS_DEFAULT = [
  "Áridos",
  "Cemento y cal",
  "Hierros y mallas",
  "Ladrillos y bloques",
  "Maderas",
  "Sanitarios y plomería",
  "Electricidad",
  "Pinturas",
  "Impermeabilizantes",
  "Seguridad y EPP",
];

const estado = {
  queries: [],
  codeDuplicado: false,
  obraExiste: true,
  fallaCategoria: false,
  tareasTotal: 0,
  tareasCompletadas: 0,
  // Identidad del creador: por defecto ya existe la persona con auth_user_id.
  personaPorAuth: true,
  personaPorTelefono: null,
};

// --- Datos falsos de la base -------------------------------------------------

const obraRow = (extra = {}) => ({
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
  tareas_total: String(estado.tareasTotal),
  tareas_completadas: String(estado.tareasCompletadas),
  ...extra,
});

function responder(sql) {
  const s = sql.replace(/\s+/g, " ").trim();

  if (s.startsWith("SELECT id FROM obras WHERE code = $1 AND id <> $2")) {
    return { rows: estado.codeDuplicado ? [{ id: "otra-obra" }] : [] };
  }
  if (s.startsWith("SELECT id FROM obras WHERE code = $1")) {
    return { rows: [] };
  }
  if (s.startsWith("INSERT INTO obras")) {
    return { rows: [{ id: OBRA_ID, ...obraRow() }] };
  }
  if (
    s.startsWith(
      "SELECT id, auth_user_id, nombre, telefono, created_at FROM personas WHERE auth_user_id = $1"
    )
  ) {
    if (estado.personaPorAuth === false) return { rows: [] };
    return {
      rows: [
        {
          id: PERSONA_ID,
          auth_user_id: AUTH_USER_ID,
          nombre: "Creador de la obra",
          telefono: null,
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
  }
  if (
    s.startsWith("SELECT id, auth_user_id, nombre, telefono, created_at FROM personas") &&
    s.includes("regexp_replace")
  ) {
    return { rows: estado.personaPorTelefono ? [estado.personaPorTelefono] : [] };
  }
  if (s.startsWith("UPDATE personas SET auth_user_id = $1")) {
    return { rows: [], rowCount: 1 };
  }
  if (s.startsWith("INSERT INTO personas (")) {
    return {
      rows: [
        {
          id: PERSONA_NUEVA_ID,
          auth_user_id: AUTH_USER_ID,
          nombre: "Creador de la obra",
          telefono: null,
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      rowCount: 1,
    };
  }
  if (s.startsWith("SELECT id FROM personas WHERE auth_user_id")) {
    return { rows: [{ id: PERSONA_ID }] };
  }
  if (s.startsWith("INSERT INTO rubros")) {
    return { rows: [{ id: RUBRO_ID }] };
  }
  if (s.startsWith("UPDATE obras SET")) {
    return { rows: estado.obraExiste ? [obraRow()] : [] };
  }
  // SELECT o.* (obra completa) y SELECT p.id (equipo de buildObra)
  return { rows: [] };
}

// --- Mocks de los módulos ----------------------------------------------------

const clientQuery = mock(async (sql) => {
  estado.queries.push(String(sql).replace(/\s+/g, " ").trim());
  if (estado.fallaCategoria && String(sql).includes("INSERT INTO categorias_materiales")) {
    throw new Error('relation "categorias_materiales" does not exist');
  }
  return responder(String(sql));
});

const client = {
  query: clientQuery,
  release: mock(() => {}),
};

const poolQuery = mock(async (sql) => {
  estado.queries.push(String(sql).replace(/\s+/g, " ").trim());
  const s = String(sql);
  if (s.includes("SELECT o.*")) return { rows: [obraRow()] };
  return { rows: [] };
});

mock.module("../db.js", () => ({
  pool: { query: poolQuery, connect: async () => client },
}));

mock.module("../services/embeddings.service.js", () => ({
  guardarEmbeddings: mock(async () => {}),
  guardarEmbedding: mock(async () => {}),
}));

// El import va DESPUÉS de mock.module para que el controller tome los mocks
const { crearObra, updateObra } = await import("./obrasController.js");

// --- Helpers -----------------------------------------------------------------

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

const reqCrear = () => ({
  user: { id: AUTH_USER_ID, user_metadata: {} },
  body: {
    name: "Obra nueva",
    type: "edificio",
    address: "Av. Corrientes 1234",
    presupuestoTotal: 1000000,
    rubros: [{ nombre: "Albañilería", presupuesto: 500000 }],
  },
});

const reqUpdate = (body) => ({ params: { obraId: OBRA_ID }, body });

const llamadas = (fragmento) => estado.queries.filter((q) => q.includes(fragmento));

beforeEach(() => {
  estado.queries = [];
  estado.codeDuplicado = false;
  estado.obraExiste = true;
  estado.fallaCategoria = false;
  estado.tareasTotal = 0;
  estado.tareasCompletadas = 0;
  estado.personaPorAuth = true;
  estado.personaPorTelefono = null;
  clientQuery.mockClear();
  poolQuery.mockClear();
});

// --- crearObra ---------------------------------------------------------------

describe("crearObra — categorías de materiales por defecto", () => {
  test("inserta las 10 categorías dentro de la transacción", async () => {
    const res = makeRes();
    await crearObra(reqCrear(), res);

    expect(res.statusCode).toBe(201);
    const inserts = llamadas("INSERT INTO categorias_materiales");
    expect(inserts.length).toBe(CATEGORIAS_DEFAULT.length);
    // El nombre viaja como parámetro, no interpolado en el SQL
    expect(inserts.every((q) => q.includes("ON CONFLICT (obra_id, lower(nombre))"))).toBe(true);
    expect(clientQuery.mock.calls.filter((c) => c[1]?.[1] === "Áridos").length).toBe(1);
    expect(clientQuery.mock.calls.some((c) => c[1]?.[1] === "Seguridad y EPP")).toBe(true);
  });

  test("la transacción se commitea después de insertar las categorías", async () => {
    const res = makeRes();
    await crearObra(reqCrear(), res);

    const idxCategorias = estado.queries.findIndex((q) => q.includes("INSERT INTO categorias_materiales"));
    const idxCommit = estado.queries.indexOf("COMMIT");
    expect(idxCategorias).toBeGreaterThan(-1);
    expect(idxCommit).toBeGreaterThan(idxCategorias);
  });

  test("si falla el catálogo (migración sin aplicar) la obra se crea igual", async () => {
    estado.fallaCategoria = true;
    const res = makeRes();
    await crearObra(reqCrear(), res);

    expect(res.statusCode).toBe(201);
    expect(estado.queries).toContain("ROLLBACK TO SAVEPOINT categorias_default");
    expect(estado.queries).toContain("COMMIT");
  });
});

describe("crearObra — identidad del creador", () => {
  test("resuelve la persona existente con el servicio y no inserta en personas", async () => {
    const res = makeRes();
    await crearObra(reqCrear(), res);

    expect(res.statusCode).toBe(201);
    expect(estado.queries).toContain(
      "SELECT id, auth_user_id, nombre, telefono, created_at FROM personas WHERE auth_user_id = $1 LIMIT 1"
    );
    expect(llamadas("INSERT INTO personas")).toEqual([]);

    const miembro = clientQuery.mock.calls.find(([sql]) =>
      String(sql).includes("INSERT INTO miembros_obra")
    );
    expect(miembro[1]).toEqual([PERSONA_ID, OBRA_ID, "Director"]);
  });

  test("con teléfono en la metadata NO reclama la persona de WhatsApp: crea una web aparte", async () => {
    estado.personaPorAuth = false;
    estado.personaPorTelefono = {
      id: PERSONA_TEL_ID,
      auth_user_id: null,
      nombre: "Creador por WhatsApp",
      telefono: "5491143614361",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const req = reqCrear();
    req.user.user_metadata = { telefono: "5491143614361" };

    const res = makeRes();
    await crearObra(req, res);

    expect(res.statusCode).toBe(201);
    // El teléfono de la metadata es editable por el usuario: no se usa para
    // reclamar la identidad del bot.
    expect(llamadas("INSERT INTO personas")).toHaveLength(1);
    expect(llamadas("UPDATE personas SET auth_user_id = $1")).toEqual([]);

    const miembro = clientQuery.mock.calls.find(([sql]) =>
      String(sql).includes("INSERT INTO miembros_obra")
    );
    expect(miembro[1]).toEqual([PERSONA_NUEVA_ID, OBRA_ID, "Director"]);
  });
});

// --- updateObra --------------------------------------------------------------

describe("updateObra — validaciones", () => {
  test("rechaza un código que ya usa otra obra (422) sin ejecutar el UPDATE", async () => {
    estado.codeDuplicado = true;
    const res = makeRes();
    await updateObra(reqUpdate({ code: "OBR-2026-0002" }), res);

    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe("DUPLICATE_CODE");
    expect(llamadas("UPDATE obras SET").length).toBe(0);
    expect(estado.queries).toContain("ROLLBACK");
  });

  test("rechaza un estado fuera del CHECK (400)", async () => {
    const res = makeRes();
    await updateObra(reqUpdate({ status: "terminada" }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(estado.queries.length).toBe(0);
  });

  test("rechaza nombre vacío (400)", async () => {
    const res = makeRes();
    await updateObra(reqUpdate({ name: "   " }), res);

    expect(res.statusCode).toBe(400);
    expect(estado.queries.length).toBe(0);
  });

  test("acepta un estado válido y una fecha vacía para limpiarla", async () => {
    const res = makeRes();
    await updateObra(reqUpdate({ status: "pausada", startDate: "" }), res);

    expect(res.statusCode).toBe(200);
    const update = clientQuery.mock.calls.find((c) => String(c[0]).includes("UPDATE obras SET"));
    expect(update).toBeTruthy();
    expect(update[1]).toContain("pausada");
    expect(update[1]).toContain("");  // startDate "" llega tal cual para el CASE de NULL
  });

  test("devuelve el progress calculado con las tareas (no 0)", async () => {
    estado.tareasTotal = 4;
    estado.tareasCompletadas = 1;
    const res = makeRes();
    await updateObra(reqUpdate({ name: "Obra renombrada" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.progress).toBe(25);
    expect(res.body.tareasTotal).toBe(4);
  });

  test("404 si la obra no existe", async () => {
    estado.obraExiste = false;
    const res = makeRes();
    await updateObra(reqUpdate({ name: "Fantasma" }), res);

    expect(res.statusCode).toBe(404);
  });
});
