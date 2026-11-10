// Tests del gate de roles de POST /obreros/invitacion (crearInvitacionWeb).
//
// Se usa el permisos.service REAL (normalizarRol / puedeAdministrarEquipo /
// puedeAsignarRol): el test verifica la matriz de verdad y falla si el controller
// deja de consultarla o si cambia la normalización por defecto.
// Lo que se mockea es el acceso a datos: `db.js` (sin Postgres ni dotenv),
// `obraAccess.service.js` (rol del que invita) y `invitaciones.service.js`
// (sin cifrar tokens ni insertar filas). No se toca la base real.
//
// El caso "rol superior al propio" no es alcanzable con la matriz actual (solo un
// Director administra, y puede asignar hasta Director); la jerarquía se cubre en
// apps/Backend/services/permisos.service.test.js (puedeAsignarRol) en vez de
// mockear permisos acá: dos archivos que mockean el mismo módulo se filtran entre
// sí en Bun y rompen los tests según el orden de ejecución.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const OTRA_OBRA_ID = "9f8e7d6c-5b4a-4938-8271-abcdefabcdef";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";

const INVITACION = {
  id: "inv-1",
  token: "v1.token-de-prueba",
  expira_at: "2026-11-17T12:00:00.000Z",
};

const estado = {
  rolLlamante: "Director",
  invitaciones: [],
  errorAlCrear: null,
};

const rolEnObraMock = mock(async () => estado.rolLlamante);
const esMiembroDeObraMock = mock(async () => true);

const crearInvitacionMock = mock(async (datos) => {
  estado.invitaciones.push(datos);
  if (estado.errorAlCrear) throw estado.errorAlCrear;
  return INVITACION;
});

const consumirInvitacionMock = mock(async () => ({ ok: true }));

// El controller no debería tocar el pool en este endpoint; si lo hace, explota.
mock.module("../db.js", () => ({
  pool: {
    query: async () => {
      throw new Error("pool.query no esperado en crearInvitacionWeb");
    },
    connect: async () => {
      throw new Error("pool.connect no esperado en crearInvitacionWeb");
    },
  },
}));

mock.module("../services/obraAccess.service.js", () => ({
  rolEnObra: rolEnObraMock,
  esMiembroDeObra: esMiembroDeObraMock,
}));

mock.module("../services/invitaciones.service.js", () => ({
  crearInvitacion: crearInvitacionMock,
  consumirInvitacion: consumirInvitacionMock,
}));

const { crearInvitacionWeb } = await import("./obrerosController.js");

function reqInvitacion(body = {}) {
  return {
    personaId: PERSONA_ID,
    body: {
      obra_id: OBRA_ID,
      nombre: "Ana Pérez",
      telefono: "5491112345678",
      ...body,
    },
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

async function invitar(body) {
  const res = resFalso();
  await crearInvitacionWeb(reqInvitacion(body), res);
  return res;
}

beforeEach(() => {
  estado.rolLlamante = "Director";
  estado.invitaciones.length = 0;
  estado.errorAlCrear = null;
  rolEnObraMock.mockClear();
  esMiembroDeObraMock.mockClear();
  crearInvitacionMock.mockClear();
  consumirInvitacionMock.mockClear();
});

describe("crearInvitacionWeb — validación de entrada", () => {
  test("400 si falta obra_id o nombre, sin consultar rol ni crear invitación", async () => {
    const sinObra = await invitar({ obra_id: undefined });
    expect(sinObra.statusCode).toBe(400);
    expect(sinObra.body).toEqual({ error: "obra_id y nombre son requeridos" });

    const sinNombre = await invitar({ nombre: undefined });
    expect(sinNombre.statusCode).toBe(400);
    expect(sinNombre.body).toEqual({ error: "obra_id y nombre son requeridos" });

    expect(rolEnObraMock).not.toHaveBeenCalled();
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });
});

describe("crearInvitacionWeb — rol normalizado", () => {
  test("sin rol en el body: la invitación se crea como 'Obrero'", async () => {
    expect("rol" in reqInvitacion().body).toBe(false); // el body del test no manda rol

    const res = await invitar({});

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(INVITACION);
    expect(crearInvitacionMock).toHaveBeenCalledTimes(1);
    expect(estado.invitaciones[0]).toEqual({
      obraId: OBRA_ID,
      nombre: "Ana Pérez",
      telefono: "5491112345678",
      rol: "Obrero",
      creadaPor: PERSONA_ID,
    });
  });

  test("rol libre/minúscula: se normaliza antes de pasarlo al servicio", async () => {
    const res = await invitar({ rol: "capataz" });

    expect(res.statusCode).toBe(201);
    expect(estado.invitaciones[0].rol).toBe("Capataz");
  });

  test("rol viejo de la web ('Director de obra') se normaliza a 'Director'", async () => {
    const res = await invitar({ rol: "Director de obra" });

    expect(res.statusCode).toBe(201);
    expect(estado.invitaciones[0].rol).toBe("Director");
  });
});

describe("crearInvitacionWeb — gate 403 (solo Director administra el equipo)", () => {
  test("Obrero que intenta invitar: 403 y no se crea la invitación", async () => {
    estado.rolLlamante = "Obrero";

    const res = await invitar({ rol: "Obrero" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error: "No tenés permisos para administrar el equipo de esta obra",
    });
    expect(rolEnObraMock).toHaveBeenCalledWith(PERSONA_ID, OBRA_ID);
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("Capataz que intenta invitar: 403 y no se crea la invitación", async () => {
    estado.rolLlamante = "Capataz";

    const res = await invitar({ rol: "Capataz" });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain("permisos");
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("persona sin fila en la obra (rol null): 403 y no se crea la invitación", async () => {
    estado.rolLlamante = null;

    const res = await invitar({});

    expect(res.statusCode).toBe(403);
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });
});

describe("crearInvitacionWeb — Director asignando rol", () => {
  test("camino feliz: Director invita con rol 'Capataz'", async () => {
    const res = await invitar({ rol: "Capataz" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(INVITACION);
    expect(rolEnObraMock).toHaveBeenCalledWith(PERSONA_ID, OBRA_ID);
    expect(crearInvitacionMock).toHaveBeenCalledTimes(1);
    expect(estado.invitaciones[0]).toEqual({
      obraId: OBRA_ID,
      nombre: "Ana Pérez",
      telefono: "5491112345678",
      rol: "Capataz",
      creadaPor: PERSONA_ID,
    });
  });

  test("Director invita con rol 'Director' (igual a su propio nivel)", async () => {
    const res = await invitar({ rol: "Director" });

    expect(res.statusCode).toBe(201);
    expect(estado.invitaciones[0].rol).toBe("Director");
  });

  test("el rol se valida contra la obra del body, no contra otra", async () => {
    await invitar({ obra_id: OTRA_OBRA_ID, rol: "Capataz" });

    expect(rolEnObraMock).toHaveBeenCalledWith(PERSONA_ID, OTRA_OBRA_ID);
    expect(estado.invitaciones[0].obraId).toBe(OTRA_OBRA_ID);
  });

  test("error del servicio: 500 con el mensaje, sin filtrar datos de la invitación", async () => {
    estado.errorAlCrear = new Error("INVITACION_SECRET no configurada");
    const originalError = console.error;
    console.error = () => {};
    try {
      const res = await invitar({ rol: "Capataz" });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "INVITACION_SECRET no configurada" });
    } finally {
      console.error = originalError;
    }
  });
});
