// Tests del gate de rol de POST /bot/galeria (subirFotoDesdeBot).
//
// Todo el acceso a datos y servicios externos está mockeado: no se importan db.js ni
// supabaseClient.js (los que hacen dotenv.config()), no se abre conexión a Postgres y no
// se habla con Supabase. Los mocks se declaran con `mock.module` antes del import dinámico
// del controller para que intercepten sus imports.
//
// Caso 403 "rol sin foto.subir": hoy PERMISOS["foto.subir"] habilita a los tres roles, así
// que la rama de permiso del controller es defensa a futuro. Para ejercitarla se angosta
// la matriz temporalmente (se restaura en `finally`) y se usa el `puede()` real: el test
// falla si el controller deja de consultar la matriz o de cortar antes de subir.

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
  rol: "Obrero",
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

// Respuestas SQL por forma de query. Cualquier consulta no prevista explota para que el
// test no pase "de casualidad" si el controller cambia de flujo.
function responder(sql, params) {
  const texto = String(sql).replace(/\s+/g, " ").trim();
  estado.consultas.push({ sql: texto, params });

  if (texto.startsWith("SELECT 1 FROM obras")) {
    return { rows: estado.obraExiste ? [{ "?column?": 1 }] : [], rowCount: estado.obraExiste ? 1 : 0 };
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

const rolEnObraMock = mock(async () => estado.rol);
const esMiembroDeObraMock = mock(async () => true);
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
const { PERMISOS } = await import("../services/permisos.service.js");

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
  estado.rol = "Obrero";
  estado.consultas.length = 0;
  estado.uploads.length = 0;
  estado.actividad.length = 0;
  rolEnObraMock.mockClear();
  esMiembroDeObraMock.mockClear();
  resolvePersonaMock.mockClear();
  registrarActividadMock.mockClear();
});

describe("subirFotoDesdeBot — gate de rol", () => {
  test("403: rol sin 'foto.subir' no sube ni registra nada", async () => {
    const matrizOriginal = PERMISOS["foto.subir"];
    PERMISOS["foto.subir"] = ["Director"]; // simula una matriz futura que excluye a Obrero
    try {
      estado.rol = "Obrero";
      // Se retiene la respuesta para inspeccionarla sin depender del valor de retorno.
      const res = resFalso();
      await subirFotoDesdeBot(reqFoto(), res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Obrero");
      expect(rolEnObraMock).toHaveBeenCalledWith(PERSONA_ID, OBRA_ID); // sí resolvió el rol
      expect(estado.uploads).toHaveLength(0);
      expect(consultasInsert()).toHaveLength(0);
      expect(registrarActividadMock).not.toHaveBeenCalled();
    } finally {
      PERMISOS["foto.subir"] = matrizOriginal;
    }
  });

  test("403: persona que no es miembro de la obra no sube ni registra nada", async () => {
    estado.rol = null; // rolEnObra devuelve null cuando no hay fila en miembros_obra
    const res = resFalso();
    await subirFotoDesdeBot(reqFoto(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("No pertenecés a esta obra");
    expect(estado.uploads).toHaveLength(0);
    expect(consultasInsert()).toHaveLength(0);
    expect(registrarActividadMock).not.toHaveBeenCalled();
  });

  test("201: rol permitido sube la foto y la registra como antes", async () => {
    estado.rol = "Obrero"; // hoy la matriz habilita foto.subir a los tres roles
    // El controller no devuelve la response en el camino feliz: se retiene la referencia.
    const res = resFalso();
    await subirFotoDesdeBot(reqFoto(), res);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(fotoFila);

    // Subida al bucket: una sola, con el MIME recibido.
    expect(estado.uploads).toHaveLength(1);
    expect(estado.uploads[0].bucket).toBe("galeria");
    expect(estado.uploads[0].contentType).toBe("image/jpeg");

    // Registro en fotos_obra: una fila, con la persona y el origen del bot.
    const inserts = consultasInsert();
    expect(inserts).toHaveLength(1);
    const params = inserts[0].params;
    expect(params[0]).toBe(OBRA_ID);
    expect(params[3]).toBe(PERSONA_ID);
    expect(params[6]).toBe("whatsapp.jpg");
    expect(params[9]).toBe("whatsapp");
    expect(params[10]).toMatch(UUID_RE); // lote_id generado en el backend

    // Membresía y rol salen de un único SELECT (rolEnObra), sin duplicar con esMiembroDeObra.
    expect(resolvePersonaMock).toHaveBeenCalledWith(TELEFONO);
    expect(rolEnObraMock).toHaveBeenCalledTimes(1);
    expect(rolEnObraMock).toHaveBeenCalledWith(PERSONA_ID, OBRA_ID);
    expect(esMiembroDeObraMock).not.toHaveBeenCalled();
  });
});
