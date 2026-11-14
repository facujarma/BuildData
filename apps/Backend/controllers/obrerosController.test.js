// Tests del gate de POST /obreros/invitacion (crearInvitacionWeb).
//
// Se usan los servicios REALES de roles/permisos (roles.service.js +
// permisos.service.js): el test verifica la política de verdad (permiso web
// `equipo.administrar` + jerarquía por `nivel`) y falla si el controller deja de
// consultarla. Lo que se mockea es el acceso a datos: `db.js` responde las dos
// consultas que hacen perfilEnObra/resolverRol (`miembros_obra` y `roles_obra`),
// `obraAccess.service.js` (membership) e `invitaciones.service.js` (sin cifrar
// tokens ni insertar filas). No se toca la base real.
//
// No se mockea permisos.service: dos archivos que mockean el mismo módulo se
// filtran entre sí en Bun y rompen los tests según el orden de ejecución.

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ROLES_SISTEMA, normalizarPermisos } from "../services/roles.service.js";

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
  permisosPorRol: {},
  invitaciones: [],
  obrasPersona: [],
  errorAlCrear: null,
};

function rolSistema(nombre) {
  return ROLES_SISTEMA.find((rol) => rol.nombre === nombre);
}

function filasRoles() {
  return ROLES_SISTEMA.map((rol) => ({
    ...rol,
    id: `rol-${rol.nombre}`,
    obra_id: OBRA_ID,
    permisos: estado.permisosPorRol[rol.nombre]
      ? normalizarPermisos(estado.permisosPorRol[rol.nombre])
      : normalizarPermisos(rol.permisos),
  }));
}

const poolQuery = mock(async (sql, params) => {
  const consulta = String(sql).replace(/\s+/g, " ").trim();

  if (consulta.startsWith("SELECT rol FROM miembros_obra")) {
    const [personaId, obraId] = params;
    if (personaId !== PERSONA_ID || !estado.rolLlamante) return { rows: [] };
    return { rows: obraId ? [{ rol: estado.rolLlamante }] : [] };
  }

  // getUserByPhone: persona + sus obras.
  if (consulta.startsWith("SELECT p.id, p.nombre, p.telefono, mo.obra_id")) {
    return { rows: estado.obrasPersona };
  }

  if (consulta.includes("FROM roles_obra") && consulta.includes("lower(nombre) = lower($2)")) {
    const [, nombre] = params;
    const buscado = String(nombre).trim().toLowerCase();
    return { rows: filasRoles().filter((rol) => rol.nombre.toLowerCase() === buscado) };
  }

  throw new Error(`pool.query no esperado en obrerosController.test: ${consulta}`);
});

const esMiembroDeObraMock = mock(async () => true);

const crearInvitacionMock = mock(async (datos) => {
  estado.invitaciones.push(datos);
  if (estado.errorAlCrear) throw estado.errorAlCrear;
  return INVITACION;
});

const consumirInvitacionMock = mock(async () => ({ ok: true }));

mock.module("../db.js", () => ({
  pool: {
    query: poolQuery,
    connect: async () => {
      throw new Error("pool.connect no esperado en crearInvitacionWeb");
    },
  },
}));

mock.module("../services/obraAccess.service.js", () => ({
  esMiembroDeObra: esMiembroDeObraMock,
}));

mock.module("../services/invitaciones.service.js", () => ({
  crearInvitacion: crearInvitacionMock,
  consumirInvitacion: consumirInvitacionMock,
}));

const { crearInvitacionWeb, getUserByPhone } = await import("./obrerosController.js");

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

function llamadasMiembros() {
  return poolQuery.mock.calls.filter(([sql]) =>
    String(sql).replace(/\s+/g, " ").trim().startsWith("SELECT rol FROM miembros_obra")
  );
}

beforeEach(() => {
  estado.rolLlamante = "Director";
  estado.permisosPorRol = {};
  estado.invitaciones.length = 0;
  estado.obrasPersona = [];
  estado.errorAlCrear = null;
  poolQuery.mockClear();
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

    expect(poolQuery).not.toHaveBeenCalled();
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });
});

describe("crearInvitacionWeb — rol canónico de la obra", () => {
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

  test("rol en minúscula: se guarda el nombre canónico del rol de la obra", async () => {
    const res = await invitar({ rol: "capataz" });

    expect(res.statusCode).toBe(201);
    expect(estado.invitaciones[0].rol).toBe("Capataz");
  });

  test("rol de sistema con otra capitalización: se guarda el nombre canónico", async () => {
    const res = await invitar({ rol: "Seguridad e higiene" });

    expect(res.statusCode).toBe(201);
    expect(estado.invitaciones[0].rol).toBe("Seguridad e Higiene");
  });

  test("rol viejo de la web ('Director de obra') se resuelve a 'Director'", async () => {
    const res = await invitar({ rol: "Director de obra" });

    expect(res.statusCode).toBe(201);
    expect(estado.invitaciones[0].rol).toBe("Director");
  });
});

describe("crearInvitacionWeb — gate 403 (equipo.administrar)", () => {
  test("Obrero que intenta invitar: 403 y no se crea la invitación", async () => {
    estado.rolLlamante = "Obrero";

    const res = await invitar({ rol: "Obrero" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error: "No tenés permisos para administrar el equipo de esta obra",
    });
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("Capataz sin equipo.administrar: 403 y no se crea la invitación", async () => {
    estado.rolLlamante = "Capataz";

    const res = await invitar({ rol: "Capataz" });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain("permisos");
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("persona sin fila en la obra: 403 y no se crea la invitación", async () => {
    estado.rolLlamante = null;

    const res = await invitar({});

    expect(res.statusCode).toBe(403);
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("un rol personalizado con equipo.administrar puede invitar (no mira el nombre)", async () => {
    estado.rolLlamante = "Capataz";
    estado.permisosPorRol["Capataz"] = {
      ...rolSistema("Capataz").permisos,
      web: { ...rolSistema("Capataz").permisos.web, "equipo.administrar": true },
    };

    const res = await invitar({ rol: "Obrero" });

    expect(res.statusCode).toBe(201);
    expect(estado.invitaciones[0].rol).toBe("Obrero");
  });

  test("con equipo.administrar no se puede otorgar un rol de nivel superior", async () => {
    estado.rolLlamante = "Capataz";
    estado.permisosPorRol["Capataz"] = {
      ...rolSistema("Capataz").permisos,
      web: { ...rolSistema("Capataz").permisos.web, "equipo.administrar": true },
    };

    const res = await invitar({ rol: "Director" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "No podés invitar con un rol superior al tuyo" });
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });
});

describe("crearInvitacionWeb — Director asignando rol", () => {
  test("camino feliz: Director invita con rol 'Capataz'", async () => {
    const res = await invitar({ rol: "Capataz" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(INVITACION);
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

    const [personaId, obraId] = llamadasMiembros()[0][1];
    expect(personaId).toBe(PERSONA_ID);
    expect(obraId).toBe(OTRA_OBRA_ID);
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

describe("getUserByPhone — contrato que consume el bot", () => {
  test("por obra devuelve el rol canónico y los permisos bot efectivos", async () => {
    estado.obrasPersona = [
      {
        id: PERSONA_ID,
        nombre: "Ana Pérez",
        telefono: "5491112345678",
        obra_id: OBRA_ID,
        rol: "Capataz",
        obra_nombre: "Obra A",
        direccion: "Calle 1",
      },
      {
        id: PERSONA_ID,
        nombre: "Ana Pérez",
        telefono: "5491112345678",
        obra_id: OTRA_OBRA_ID,
        rol: "Pirata", // rol libre desconocido: cae en Obrero
        obra_nombre: "Obra B",
        direccion: "Calle 2",
      },
    ];

    const res = resFalso();
    await getUserByPhone({ params: { phone: "5491112345678" } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(PERSONA_ID);
    expect(res.body.nombre).toBe("Ana Pérez");

    expect(res.body.obras[0]).toEqual({
      obra_id: OBRA_ID,
      obra_nombre: "Obra A",
      direccion: "Calle 1",
      rol: "Capataz",
      permisos: expect.arrayContaining([
        "stock.registrar",
        "stock.ajustar",
        "pedido.crear",
        "pedido.entregar",
        "foto.subir",
      ]),
    });

    expect(res.body.obras[1].rol).toBe("Obrero");
    expect(res.body.obras[1].permisos).toContain("stock.registrar");
    expect(res.body.obras[1].permisos).not.toContain("pedido.crear");
    expect(res.body.obras[1].permisos).not.toContain("stock.ajustar");
  });

  test("404 si el teléfono no pertenece a ninguna persona", async () => {
    const res = resFalso();
    await getUserByPhone({ params: { phone: "5491100000000" } }, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "Obrero no encontrado" });
  });
});
