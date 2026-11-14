// Tests del gate de permisos de POST /bot/galeria (subirFotoDesdeBot).
//
// Después del bug de QA, el endpoint directo tiene que autorizar con los permisos
// dinámicos de la obra (`perfilEnObra` → `roles_obra`), no con la matriz estática
// derivada del nombre del rol. Acá se usa el `roles.service` REAL contra un `pool`
// falso, así el test cubre la cadena completa: miembros_obra → roles_obra → permiso.
//
// Todo el acceso a datos y servicios externos está mockeado: no se importan db.js ni
// supabaseClient.js reales (los que hacen dotenv.config()), no se abre conexión a
// Postgres y no se habla con Supabase.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const TELEFONO = "5491112345678";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// JPEG mínimo: al controller solo le importa que sea un Buffer no vacío con MIME válido.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

const estado = {
  personaId: PERSONA_ID,
  obraExiste: true,
  esMiembro: true,
  miembroRol: "Obrero",
  tablaRoles: true, // false simula la migración de roles_obra pendiente (42P01)
  rolesObra: [],
  consultas: [],
  uploads: [],
  actividad: [],
};

const fotoFila = {
  id: "foto-1",
  url: `https://stub.local/galeria/${OBRA_ID}/foto.jpg`,
  tarea_id: null,
  task: null,
  rubro_id: null,
  rubro: null,
  tone: null,
  who: "Obrero Test",
  note: "avance",
  flag: null,
  origen: "whatsapp",
  nombre_archivo: "whatsapp.jpg",
  created_at: "2026-11-10T12:00:00.000Z",
};

// Fila de roles_obra; `bot` parcial porque normalizarPermisos completa en false.
function filaRol(nombre, bot = {}) {
  return {
    id: `rol-${nombre.toLowerCase().replace(/\s+/g, "-")}`,
    obra_id: OBRA_ID,
    nombre,
    nivel: 20,
    es_sistema: false,
    permisos: { bot, web: {} },
  };
}

function normalizar(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

// Respuestas SQL por forma de query. Cualquier consulta no prevista explota para que el
// test no pase "de casualidad" si el controller cambia de flujo.
function responder(sqlOriginal, params) {
  const texto = normalizar(sqlOriginal);
  estado.consultas.push({ sql: texto, params });

  if (texto.startsWith("SELECT 1 FROM obras")) {
    return { rows: estado.obraExiste ? [{ "?column?": 1 }] : [], rowCount: estado.obraExiste ? 1 : 0 };
  }
  if (texto.startsWith("SELECT rol FROM miembros_obra")) {
    return { rows: estado.esMiembro ? [{ rol: estado.miembroRol }] : [], rowCount: estado.esMiembro ? 1 : 0 };
  }
  if (texto.includes("FROM roles_obra")) {
    if (!estado.tablaRoles) {
      const error = new Error('relation "roles_obra" does not exist');
      error.code = "42P01";
      throw error;
    }
    const buscado = String(params[1] ?? "").toLowerCase();
    const fila = estado.rolesObra.find((rol) => rol.nombre.toLowerCase() === buscado);
    return { rows: fila ? [fila] : [], rowCount: fila ? 1 : 0 };
  }
  if (texto.startsWith("INSERT INTO fotos_obra")) {
    return { rows: [{ id: fotoFila.id }], rowCount: 1 };
  }
  if (texto.startsWith("SELECT f.id")) {
    return { rows: [{ ...fotoFila }], rowCount: 1 };
  }
  if (texto.includes("count(*)::int AS n FROM fotos_obra")) {
    return { rows: [{ n: 1 }], rowCount: 1 };
  }
  if (texto.startsWith("UPDATE actividad")) {
    // rowCount > 0 = la entrada del lote ya existía: registrarLote no crea otra.
    return { rows: [], rowCount: 1 };
  }
  throw new Error(`consulta SQL no prevista en el test: ${texto}`);
}

const rolEnObraMock = mock(async () => estado.miembroRol);
const esMiembroDeObraMock = mock(async () => estado.esMiembro);
const resolvePersonaMock = mock(async () => estado.personaId);
const registrarActividadMock = mock(async (_db, datos) => {
  estado.actividad.push(datos);
});

mock.module("../db.js", () => ({
  pool: { query: async (sql, params) => responder(sql, params) },
}));

mock.module("../supabaseClient.js", () => ({
  supabaseAdmin: {
    storage: {
      from: (bucket) => ({
        upload: async (path, buffer, opciones) => {
          estado.uploads.push({ bucket, path, size: buffer.length, contentType: opciones?.contentType });
          return { data: { path }, error: null };
        },
        getPublicUrl: (path) => ({ data: { publicUrl: `https://stub.local/${bucket}/${path}` } }),
        remove: async (paths) => ({ data: { paths }, error: null }),
      }),
    },
  },
}));

mock.module("../services/personaService.js", () => ({
  resolvePersonaIdByTelefono: resolvePersonaMock,
  resolvePersonaIdByNombre: async () => null,
}));

mock.module("../services/obraAccess.service.js", () => ({
  rolEnObra: rolEnObraMock,
  esMiembroDeObra: esMiembroDeObraMock,
}));

mock.module("../services/actividad.service.js", () => ({
  registrarActividad: registrarActividadMock,
}));

const { subirFotoDesdeBot } = await import("./galeriaController.js");

function reqFoto({ query = {}, headers = {}, body = JPEG } = {}) {
  return {
    query: { obra_id: OBRA_ID, telefono: TELEFONO, nota: "avance", ...query },
    headers: { "content-type": "image/jpeg", ...headers },
    body,
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

const consultasInsert = () => estado.consultas.filter((c) => c.sql.startsWith("INSERT INTO fotos_obra"));

beforeEach(() => {
  estado.personaId = PERSONA_ID;
  estado.obraExiste = true;
  estado.esMiembro = true;
  estado.miembroRol = "Obrero";
  estado.tablaRoles = true;
  estado.rolesObra = [];
  estado.consultas.length = 0;
  estado.uploads.length = 0;
  estado.actividad.length = 0;
  rolEnObraMock.mockClear();
  esMiembroDeObraMock.mockClear();
  resolvePersonaMock.mockClear();
  registrarActividadMock.mockClear();
});

describe("subirFotoDesdeBot — permiso bot dinámico foto.subir", () => {
  test("403: un rol personalizado sin foto.subir no sube ni registra nada", async () => {
    estado.miembroRol = "Supervisor QA Cero";
    estado.rolesObra = [filaRol("Supervisor QA Cero")];

    const res = resFalso();
    await subirFotoDesdeBot(reqFoto(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain("Supervisor QA Cero");
    expect(estado.uploads).toHaveLength(0);
    expect(consultasInsert()).toHaveLength(0);
    expect(registrarActividadMock).not.toHaveBeenCalled();
  });

  test("403: persona que no es miembro de la obra no sube ni registra nada", async () => {
    estado.esMiembro = false;

    const res = resFalso();
    await subirFotoDesdeBot(reqFoto(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("No pertenecés a esta obra");
    expect(estado.uploads).toHaveLength(0);
    expect(consultasInsert()).toHaveLength(0);
    expect(estado.consultas.some((c) => c.sql.includes("FROM roles_obra"))).toBe(false);
  });

  test("201: un rol personalizado con foto.subir sube la foto", async () => {
    estado.miembroRol = "Fotógrafo QA";
    estado.rolesObra = [filaRol("Fotógrafo QA", { "foto.subir": true })];

    const res = resFalso();
    await subirFotoDesdeBot(reqFoto(), res);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(fotoFila);
    expect(estado.uploads).toHaveLength(1);
    expect(estado.uploads[0].bucket).toBe("galeria");
    expect(estado.uploads[0].contentType).toBe("image/jpeg");

    const inserts = consultasInsert();
    expect(inserts).toHaveLength(1);
    expect(inserts[0].params[0]).toBe(OBRA_ID);
    expect(inserts[0].params[3]).toBe(PERSONA_ID);
    expect(inserts[0].params[9]).toBe("whatsapp");
    expect(inserts[0].params[10]).toMatch(UUID_RE);
  });

  test("201: fallback estático cuando la obra no tiene roles_obra (Obrero conserva foto.subir)", async () => {
    estado.tablaRoles = false;
    estado.miembroRol = "Obrero";

    const res = resFalso();
    await subirFotoDesdeBot(reqFoto(), res);

    expect(res.statusCode).toBe(201);
    expect(estado.uploads).toHaveLength(1);
    expect(consultasInsert()).toHaveLength(1);
  });

  test("403: fallback estático fail-closed (Cliente no tiene foto.subir)", async () => {
    estado.tablaRoles = false;
    estado.miembroRol = "Cliente";

    const res = resFalso();
    await subirFotoDesdeBot(reqFoto(), res);

    expect(res.statusCode).toBe(403);
    expect(estado.uploads).toHaveLength(0);
    expect(consultasInsert()).toHaveLength(0);
  });
});
