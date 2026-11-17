// Tests del gate de POST /obreros/invitacion (crearInvitacionWeb) y de la
// vinculación de cuentas web (POST /obreros/:obrero_id/obra/:obra_id/vincular).
//
// Se usan los servicios REALES de roles/permisos (roles.service.js +
// permisos.service.js) y el de membresía (obraAccess.service.js): el test
// verifica la política de verdad (permiso web `equipo.administrar` + jerarquía
// por `nivel`) y falla si el controller deja de consultarla. Lo que se mockea es
// el acceso a datos: `db.js` responde las consultas de personas/miembros/roles y
// `invitaciones.service.js` (sin cifrar tokens ni insertar filas). El merge de
// personas se mockea porque tiene su propia suite (personas.service.test.js).
// No se toca la base real.
//
// No se mockea permisos.service: dos archivos que mockean el mismo módulo se
// filtran entre sí en Bun y rompen los tests según el orden de ejecución.

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ROLES_SISTEMA, normalizarPermisos } from "../services/roles.service.js";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const OTRA_OBRA_ID = "9f8e7d6c-5b4a-4938-8271-abcdefabcdef";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const DESTINO_ID = "2a3b4c5d-6e7f-4a8b-9c0d-123456789abc";
const ORIGEN_ID = "3b4c5d6e-7f8a-4b9c-8d0e-23456789abcd";
const AUTH_ID = "4c5d6e7f-8a9b-4c0d-9e1f-3456789abcde";
const OTRO_AUTH_ID = "5d6e7f8a-9b0c-4d1e-8f20-456789abcdef";

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
  // vinculación de cuentas
  personas: [],
  membresias: [],
  rolesLlamante: {},
  resumenUnificacion: null,
  errorUnificar: null,
  // GET /obreros/:obra_id
  equipo: [],
  sinSchemaAuth: false,
  miembroDeObra: true,
  errorBuscarTelefono: null,
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

  // esMiembroDeObra (obraAccess.service REAL): membresía del que llama.
  if (consulta.startsWith("SELECT 1 FROM miembros_obra")) {
    return { rows: estado.miembroDeObra ? [{ "?column?": 1 }] : [] };
  }

  if (consulta.startsWith("SELECT rol FROM miembros_obra")) {
    const [personaId, obraId] = params;
    if (personaId !== PERSONA_ID || !obraId) return { rows: [] };
    const rol = estado.rolesLlamante[obraId] ?? estado.rolLlamante;
    return { rows: rol ? [{ rol }] : [] };
  }

  // getUserByPhone: persona + sus obras.
  if (consulta.startsWith("SELECT p.id, p.nombre, p.telefono, mo.obra_id")) {
    return { rows: estado.obrasPersona };
  }

  // getObreros: lista de la obra con email de auth.users (y su fallback).
  if (
    consulta.startsWith("SELECT p.id, p.nombre, p.telefono, p.auth_user_id, mo.rol, mo.joined_at") &&
    consulta.includes("LEFT JOIN auth.users")
  ) {
    if (estado.sinSchemaAuth) {
      throw Object.assign(new Error("permission denied for schema auth"), { code: "42501" });
    }
    return { rows: estado.equipo };
  }
  if (consulta.startsWith("SELECT p.id, p.nombre, p.telefono, p.auth_user_id, mo.rol, mo.joined_at")) {
    return {
      rows: estado.equipo.map(({ email, ...fila }) => fila),
    };
  }

  // crearInvitacionWeb con persona_id: persona + su membresía en la obra.
  if (consulta.startsWith("SELECT p.id, p.nombre, p.telefono, p.auth_user_id, mo.rol")) {
    const [personaId, obraId] = params;
    const persona = estado.personas.find((fila) => fila.id === personaId);
    const miembro = estado.membresias.find(
      (fila) => fila.persona_id === personaId && fila.obra_id === obraId
    );
    return { rows: persona && miembro ? [{ ...persona, rol: miembro.rol }] : [] };
  }

  // vincularCuentaWeb: las dos personas y sus membresías.
  if (consulta.startsWith("SELECT id, auth_user_id, nombre, telefono FROM personas WHERE id = ANY")) {
    const ids = params[0] ?? [];
    return { rows: estado.personas.filter((fila) => ids.includes(fila.id)) };
  }
  if (consulta.includes("FROM miembros_obra mo") && consulta.includes("JOIN obras o")) {
    const ids = params[0] ?? [];
    return { rows: estado.membresias.filter((fila) => ids.includes(fila.persona_id)) };
  }

  if (consulta.includes("FROM roles_obra") && consulta.includes("lower(nombre) = lower($2)")) {
    const [, nombre] = params;
    const buscado = String(nombre).trim().toLowerCase();
    return { rows: filasRoles().filter((rol) => rol.nombre.toLowerCase() === buscado) };
  }

  throw new Error(`pool.query no esperado en obrerosController.test: ${consulta}`);
});

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

mock.module("../services/invitaciones.service.js", () => ({
  crearInvitacion: crearInvitacionMock,
  consumirInvitacion: consumirInvitacionMock,
}));

// El merge real tiene su propia suite (personas.service.test.js). Acá interesa
// el contrato del endpoint: qué valida, con qué ids llama al servicio y qué
// responde. `esPersonaError` se mantiene con la misma semántica (name).
const unificarPersonasMock = mock(async (datos) => {
  if (estado.errorUnificar) throw estado.errorUnificar;
  return (
    estado.resumenUnificacion ?? {
      origen: null,
      destino: null,
      miembros: [],
      referencias: [],
      total_movido: 0,
      ejecutado_por: datos.ejecutadoPor,
    }
  );
});

mock.module("../services/personas.service.js", () => ({
  unificarPersonas: unificarPersonasMock,
  buscarPersonaPorTelefono: async (_db, telefono) => {
    if (estado.errorBuscarTelefono) throw estado.errorBuscarTelefono;
    const digitos = String(telefono ?? "").replace(/\D/g, "");
    return (
      estado.personas.find(
        (persona) => String(persona.telefono ?? "").replace(/\D/g, "") === digitos
      ) ?? null
    );
  },
  esPersonaError: (error) => error?.name === "PersonaError",
}));

const { crearInvitacionWeb, getUserByPhone, getObreros, vincularCuentaWeb } =
  await import("./obrerosController.js");

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
  estado.personas = [];
  estado.membresias = [];
  estado.rolesLlamante = {};
  estado.resumenUnificacion = null;
  estado.errorUnificar = null;
  estado.equipo = [];
  estado.sinSchemaAuth = false;
  estado.miembroDeObra = true;
  estado.errorBuscarTelefono = null;
  poolQuery.mockClear();
  crearInvitacionMock.mockClear();
  consumirInvitacionMock.mockClear();
  unificarPersonasMock.mockClear();
});

describe("crearInvitacionWeb — validación de entrada", () => {
  test("400 si falta obra_id o nombre, sin consultar rol ni crear invitación", async () => {
    const sinObra = await invitar({ obra_id: undefined });
    expect(sinObra.statusCode).toBe(400);
    expect(sinObra.body).toEqual({ error: "obra_id y nombre (o persona_id) son requeridos" });

    const sinNombre = await invitar({ nombre: undefined });
    expect(sinNombre.statusCode).toBe(400);
    expect(sinNombre.body).toEqual({ error: "obra_id y nombre (o persona_id) son requeridos" });

    expect(poolQuery).not.toHaveBeenCalled();
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("400 si persona_id no es un UUID, sin consultar la base", async () => {
    const res = await invitar({ persona_id: "no-es-uuid", nombre: undefined });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "persona_id inválido" });
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

describe("crearInvitacionWeb — persona existente con cuenta web", () => {
  const personaWeb = (extra = {}) => ({
    id: DESTINO_ID,
    auth_user_id: AUTH_ID,
    nombre: "Ana Web",
    telefono: null,
    ...extra,
  });

  function conPersonaEnLaObra(persona, rol = "Capataz") {
    estado.personas = [persona];
    estado.membresias = [{ id: "m-1", persona_id: persona.id, obra_id: OBRA_ID, rol }];
  }

  test("usa el nombre y el rol de la DB e ignora los del body", async () => {
    conPersonaEnLaObra(personaWeb(), "Capataz");

    const res = await invitar({
      persona_id: DESTINO_ID,
      nombre: "Nombre falso",
      rol: "Director",
      telefono: "5491112345678",
    });

    expect(res.statusCode).toBe(201);
    expect(crearInvitacionMock).toHaveBeenCalledTimes(1);
    expect(estado.invitaciones[0]).toEqual({
      obraId: OBRA_ID,
      nombre: "Ana Web",
      telefono: "5491112345678",
      rol: "Capataz",
      creadaPor: PERSONA_ID,
      personaId: DESTINO_ID,
    });
  });

  test("404 si la persona no pertenece a la obra", async () => {
    estado.personas = [personaWeb()];
    estado.membresias = [];

    const res = await invitar({ persona_id: DESTINO_ID, nombre: undefined });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "La persona no pertenece a esta obra" });
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("400 si la persona no tiene cuenta web", async () => {
    conPersonaEnLaObra(personaWeb({ auth_user_id: null }));

    const res = await invitar({ persona_id: DESTINO_ID, nombre: undefined });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("no tiene cuenta web");
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("409 si la persona ya tiene WhatsApp vinculado", async () => {
    conPersonaEnLaObra(personaWeb({ telefono: "5491100000000" }));

    const res = await invitar({ persona_id: DESTINO_ID, nombre: undefined });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toContain("ya tiene WhatsApp vinculado");
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("400 si la persona no tiene teléfono y el body no manda uno para enviar el link", async () => {
    conPersonaEnLaObra(personaWeb());

    const res = await invitar({ persona_id: DESTINO_ID, nombre: undefined, telefono: undefined });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "El teléfono es requerido para enviar el link" });
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("409 si el teléfono ya pertenece a otra persona con una cuenta web distinta", async () => {
    conPersonaEnLaObra(personaWeb());
    estado.personas.push({
      id: "otra-persona",
      auth_user_id: OTRO_AUTH_ID,
      nombre: "Otra web",
      telefono: "5491112345678",
    });

    const res = await invitar({ persona_id: DESTINO_ID, nombre: undefined });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toContain("vinculado a otra cuenta web");
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("201 si el teléfono pertenece a una persona sin cuenta web (se unifica al consumir)", async () => {
    conPersonaEnLaObra(personaWeb());
    estado.personas.push({
      id: "persona-wa",
      auth_user_id: null,
      nombre: "Ana WhatsApp",
      telefono: "5491112345678",
    });

    const res = await invitar({ persona_id: DESTINO_ID, nombre: undefined });

    expect(res.statusCode).toBe(201);
    expect(crearInvitacionMock).toHaveBeenCalledTimes(1);
    expect(estado.invitaciones[0].personaId).toBe(DESTINO_ID);
  });

  test("409 si hay más de una persona con el teléfono ingresado", async () => {
    conPersonaEnLaObra(personaWeb());
    estado.errorBuscarTelefono = Object.assign(new Error("ambiguo"), {
      name: "PersonaError",
      code: "TELEFONO_AMBIGUO",
    });

    const res = await invitar({ persona_id: DESTINO_ID, nombre: undefined });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toContain("más de una persona");
    expect(crearInvitacionMock).not.toHaveBeenCalled();
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

// --- vincularCuentaWeb -------------------------------------------------------

const RESUMEN = {
  origen: { id: ORIGEN_ID, nombre: "Ana Web", telefono: "5491143614361", auth_user_id: AUTH_ID },
  destino: { id: DESTINO_ID, nombre: "Ana WhatsApp", telefono: "5491143614361", auth_user_id: AUTH_ID },
  miembros: [{ obra_id: OBRA_ID, rol_final: "Director", nivel_final: 100 }],
  referencias: [{ tabla: "mensajes", columna: "usuario_id", filas: 3 }],
  total_movido: 3,
  ejecutado_por: PERSONA_ID,
};

function prepararVinculacion({ rolDestino = "Director", rolOrigen = "Director" } = {}) {
  estado.personas = [
    { id: DESTINO_ID, auth_user_id: null, nombre: "Ana WhatsApp", telefono: "5491143614361" },
    { id: ORIGEN_ID, auth_user_id: AUTH_ID, nombre: "Ana Web", telefono: "5491143614361" },
  ];
  estado.membresias = [
    { persona_id: DESTINO_ID, obra_id: OBRA_ID, rol: rolDestino, obra_nombre: "Obra A" },
    { persona_id: ORIGEN_ID, obra_id: OBRA_ID, rol: rolOrigen, obra_nombre: "Obra A" },
  ];
}

function reqVincular(body = {}) {
  return {
    personaId: PERSONA_ID,
    params: { obrero_id: DESTINO_ID, obra_id: OBRA_ID },
    body: { persona_origen_id: ORIGEN_ID, ...body },
  };
}

describe("vincularCuentaWeb — validación de entrada", () => {
  test("400 si falta persona_origen_id (sin consultar la base)", async () => {
    const res = resFalso();
    await vincularCuentaWeb(reqVincular({ persona_origen_id: undefined }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(poolQuery).not.toHaveBeenCalled();
    expect(unificarPersonasMock).not.toHaveBeenCalled();
  });

  test("400 si el origen y el destino son la misma persona", async () => {
    const res = resFalso();
    await vincularCuentaWeb(reqVincular({ persona_origen_id: DESTINO_ID }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("MISMA_PERSONA");
    expect(poolQuery).not.toHaveBeenCalled();
  });

  test("400 si los ids de la ruta no son UUID", async () => {
    const res = resFalso();
    await vincularCuentaWeb({ personaId: PERSONA_ID, params: { obrero_id: "no-uuid", obra_id: OBRA_ID }, body: {} }, res);

    expect(res.statusCode).toBe(400);
    expect(unificarPersonasMock).not.toHaveBeenCalled();
  });
});

describe("vincularCuentaWeb — Director con permiso en la obra", () => {
  test("unifica origen→destino y devuelve el resumen del merge", async () => {
    prepararVinculacion();
    estado.resumenUnificacion = RESUMEN;

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(200);
    expect(unificarPersonasMock).toHaveBeenCalledTimes(1);
    expect(unificarPersonasMock.mock.calls[0][0]).toEqual({
      origenId: ORIGEN_ID,
      destinoId: DESTINO_ID,
      ejecutadoPor: PERSONA_ID,
    });
    expect(res.body).toEqual({ mensaje: "Cuentas vinculadas", ...RESUMEN });
  });
});

describe("vincularCuentaWeb — gate de rol", () => {
  test("Obrero (sin equipo.administrar) recibe 403 y no ejecuta el merge", async () => {
    prepararVinculacion();
    estado.rolLlamante = "Obrero";

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("SIN_PERMISO");
    expect(res.body.message).toContain("Obra A");
    expect(unificarPersonasMock).not.toHaveBeenCalled();
  });

  test("sin membresía en una obra afectada: 403 con la obra que falla", async () => {
    prepararVinculacion();
    estado.membresias.push({
      persona_id: ORIGEN_ID,
      obra_id: OTRA_OBRA_ID,
      rol: "Director",
      obra_nombre: "Obra B",
    });
    estado.rolesLlamante[OTRA_OBRA_ID] = "Obrero";

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("SIN_PERMISO");
    expect(res.body.message).toContain("Obra B");
    expect(unificarPersonasMock).not.toHaveBeenCalled();
  });

  test("no puede unificar un rol de nivel superior al propio en otra obra", async () => {
    prepararVinculacion();
    estado.membresias.push({
      persona_id: ORIGEN_ID,
      obra_id: OTRA_OBRA_ID,
      rol: "Director",
      obra_nombre: "Obra B",
    });
    // Capataz con equipo.administrar (rol personalizado): puede administrar,
    // pero no otorgar un Director en Obra B.
    estado.rolesLlamante[OTRA_OBRA_ID] = "Capataz";
    estado.permisosPorRol["Capataz"] = {
      ...rolSistema("Capataz").permisos,
      web: { ...rolSistema("Capataz").permisos.web, "equipo.administrar": true },
    };

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("SIN_PERMISO");
    expect(res.body.message).toContain("nivel");
    expect(res.body.message).toContain("Obra B");
    expect(unificarPersonasMock).not.toHaveBeenCalled();
  });
});

describe("vincularCuentaWeb — validaciones de las personas", () => {
  test("404 si el destino no es miembro de la obra del path", async () => {
    prepararVinculacion();
    estado.membresias = estado.membresias.filter(
      (membresia) => !(membresia.persona_id === DESTINO_ID && membresia.obra_id === OBRA_ID)
    );
    estado.membresias.push({
      persona_id: DESTINO_ID,
      obra_id: OTRA_OBRA_ID,
      rol: "Obrero",
      obra_nombre: "Obra B",
    });

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("El obrero no pertenece a esta obra");
    expect(unificarPersonasMock).not.toHaveBeenCalled();
  });

  test("404 si la persona de origen no existe", async () => {
    prepararVinculacion();
    estado.personas = estado.personas.filter((persona) => persona.id !== ORIGEN_ID);
    estado.membresias = estado.membresias.filter(
      (membresia) => membresia.persona_id !== ORIGEN_ID
    );

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("La persona de origen no existe");
    expect(unificarPersonasMock).not.toHaveBeenCalled();
  });

  test("400 si el origen no tiene cuenta web (auth_user_id)", async () => {
    prepararVinculacion();
    estado.personas[1].auth_user_id = null;

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("ORIGEN_SIN_CUENTA_WEB");
    expect(unificarPersonasMock).not.toHaveBeenCalled();
  });

  test("409 si el destino ya está vinculado a otra cuenta web", async () => {
    prepararVinculacion();
    estado.personas[0].auth_user_id = OTRO_AUTH_ID;

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe("DESTINO_YA_VINCULADO");
    expect(unificarPersonasMock).not.toHaveBeenCalled();
  });
});

describe("vincularCuentaWeb — errores del merge", () => {
  test("si falta la migración de auditoría responde 503 (no 500)", async () => {
    prepararVinculacion();
    estado.errorUnificar = Object.assign(
      new Error("Falta aplicar outputs/migracion_personas_unificadas.sql"),
      { name: "PersonaError", code: "MIGRACION_PENDIENTE" }
    );

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(503);
    expect(res.body.code).toBe("MIGRACION_PENDIENTE");
  });

  test("un conflicto del plan responde 409 con el detalle", async () => {
    prepararVinculacion();
    estado.errorUnificar = Object.assign(
      new Error("El origen tiene un teléfono distinto al destino; revisalo antes de unificar"),
      { name: "PersonaError", code: "PERSONA_CONFLICTO" }
    );

    const res = resFalso();
    await vincularCuentaWeb(reqVincular(), res);

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe("PERSONA_CONFLICTO");
    expect(res.body.message).toContain("teléfono distinto");
  });
});

describe("getObreros — email de las cuentas web", () => {
  test("suma el email de auth.users sin sacar los campos existentes", async () => {
    estado.equipo = [
      {
        id: DESTINO_ID,
        nombre: "Ana Pérez",
        telefono: "5491143614361",
        auth_user_id: AUTH_ID,
        rol: "Director",
        joined_at: "2026-01-01T00:00:00.000Z",
        email: "ana@example.com",
      },
    ];

    const res = resFalso();
    await getObreros({ personaId: PERSONA_ID, params: { obra_id: OBRA_ID } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body[0]).toEqual(estado.equipo[0]);
  });

  test("si el schema auth no es accesible, devuelve email null y no rompe", async () => {
    estado.equipo = [
      {
        id: DESTINO_ID,
        nombre: "Ana Pérez",
        telefono: "5491143614361",
        auth_user_id: null,
        rol: "Obrero",
        joined_at: "2026-01-01T00:00:00.000Z",
        email: "no-deberia-verse@example.com",
      },
    ];
    estado.sinSchemaAuth = true;

    const res = resFalso();
    await getObreros({ personaId: PERSONA_ID, params: { obra_id: OBRA_ID } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body[0].email).toBeNull();
    expect(res.body[0].rol).toBe("Obrero");
  });
});
