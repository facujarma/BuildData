// Tests de los endpoints de administración de roles (routes/roles.js):
// GET/POST/PATCH/DELETE /roles/:obra_id.
//
// La política fina (seed, defaults, reglas de sistema) está cubierta contra el
// servicio real en roles.crud.test.js / roles.service.test.js. Acá se verifica el
// contrato HTTP: gate 403 SIN_PERMISO, mapeo de errores del servicio a 400/404/409
// y los shapes de respuesta. Se mockea roles.service y db.js (no hay Postgres).

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const ROL_ID = "00000000-0000-4000-8000-000000000001";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";

const CATALOGO = {
  bot: [{ key: "tarea.crear", label: "reportar tareas", grupo: "Tareas" }],
  web: [{ key: "dashboard.ver", label: "ver el dashboard", grupo: "General" }],
};

const ROL = {
  id: ROL_ID,
  nombre: "Capataz",
  descripcion: "Operación de campo",
  nivel: 30,
  es_sistema: true,
  permisos: { bot: { "tarea.crear": true }, web: { "dashboard.ver": true } },
};

const estado = {
  perfil: null,
  roles: [ROL],
  crearError: null,
  actualizarError: null,
  eliminarError: null,
  llamadas: [],
};

const perfilEnObra = mock(async () => estado.perfil);
const listarRoles = mock(async () => estado.roles);
const crearRol = mock(async (datos) => {
  estado.llamadas.push(["crearRol", datos]);
  if (estado.crearError) throw estado.crearError;
  return { ...ROL, id: "nuevo", ...datos, es_sistema: false };
});
const actualizarRol = mock(async (datos) => {
  estado.llamadas.push(["actualizarRol", datos]);
  if (estado.actualizarError) throw estado.actualizarError;
  return { ...ROL, ...datos.cambios };
});
const eliminarRol = mock(async (datos) => {
  estado.llamadas.push(["eliminarRol", datos]);
  if (estado.eliminarError) throw estado.eliminarError;
  return { id: datos.rolId, nombre: "Paisajista" };
});
const serializarRol = mock((rol) => rol);

function perfil(nombreRol, web = {}) {
  return {
    rol: {
      id: `id-${nombreRol}`,
      nombre: nombreRol,
      nivel: 30,
      es_sistema: true,
      permisos: { bot: {}, web },
    },
    permisos: { bot: {}, web },
  };
}

function errorServicio(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

mock.module("../db.js", () => ({
  pool: {
    query: async () => {
      throw new Error("pool.query no esperado en rolesController");
    },
    connect: async () => {
      throw new Error("pool.connect no esperado en rolesController");
    },
  },
}));

mock.module("../services/roles.service.js", () => ({
  CATALOGO_PERMISOS: CATALOGO,
  perfilEnObra,
  listarRoles,
  crearRol,
  actualizarRol,
  eliminarRol,
  serializarRol,
}));

const { getRoles, crearRolWeb, actualizarRolWeb, eliminarRolWeb } = await import(
  "./rolesController.js"
);

function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    enviado: false,
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
      this.enviado = true;
      return this;
    },
  };
}

const req = ({ params = { obra_id: OBRA_ID }, body = {} } = {}) => ({
  personaId: PERSONA_ID,
  params,
  body,
});

beforeEach(() => {
  estado.perfil = perfil("Director", { "roles.administrar": true });
  estado.roles = [ROL];
  estado.crearError = null;
  estado.actualizarError = null;
  estado.eliminarError = null;
  estado.llamadas = [];
  perfilEnObra.mockClear();
  listarRoles.mockClear();
  crearRol.mockClear();
  actualizarRol.mockClear();
  eliminarRol.mockClear();
  serializarRol.mockClear();
});

// --- gate ------------------------------------------------------------------

describe("rolesController — gate de permisos", () => {
  test("sin membresía: 403 SIN_PERMISO con rol null y sin tocar el servicio", async () => {
    estado.perfil = null;
    const res = makeRes();
    await getRoles(req(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      code: "SIN_PERMISO",
      message: "No pertenecés a esta obra",
      permiso: "roles.administrar",
      rol: null,
    });
    expect(listarRoles).not.toHaveBeenCalled();
  });

  test("miembro sin roles.administrar: 403 con su rol", async () => {
    estado.perfil = perfil("Capataz", { "roles.administrar": false });
    const res = makeRes();
    await getRoles(req(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("SIN_PERMISO");
    expect(res.body.permiso).toBe("roles.administrar");
    expect(res.body.rol).toBe("Capataz");
    expect(listarRoles).not.toHaveBeenCalled();
  });

  test("el gate aplica a los cuatro endpoints", async () => {
    estado.perfil = perfil("Obrero", { "roles.administrar": false });

    for (const [fn, args] of [
      [getRoles, req()],
      [crearRolWeb, req({ body: { nombre: "Paisajista" } })],
      [actualizarRolWeb, req({ params: { obra_id: OBRA_ID, rol_id: ROL_ID } })],
      [eliminarRolWeb, req({ params: { obra_id: OBRA_ID, rol_id: ROL_ID } })],
    ]) {
      const res = makeRes();
      await fn(args, res);
      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe("SIN_PERMISO");
    }

    expect(crearRol).not.toHaveBeenCalled();
    expect(actualizarRol).not.toHaveBeenCalled();
    expect(eliminarRol).not.toHaveBeenCalled();
  });
});

// --- GET -------------------------------------------------------------------

describe("GET /roles/:obra_id", () => {
  test("devuelve roles serializados y el catálogo de permisos", async () => {
    const res = makeRes();
    await getRoles(req(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roles).toEqual([ROL]);
    expect(res.body.catalogo).toBe(CATALOGO);
    // `Array.map` pasa el índice como segundo argumento; alcanza con el primero.
    expect(serializarRol.mock.calls[0][0]).toBe(ROL);
  });
});

// --- POST ------------------------------------------------------------------

describe("POST /roles/:obra_id", () => {
  test("201 con el rol creado y el payload completo", async () => {
    const body = {
      nombre: "Paisajista",
      descripcion: "Parques",
      nivel: 20,
      permisos: { bot: { "tarea.crear": true } },
    };
    const res = makeRes();
    await crearRolWeb(req({ body }), res);

    expect(res.statusCode).toBe(201);
    expect(res.body.rol.nombre).toBe("Paisajista");
    expect(crearRol).toHaveBeenCalledWith({ obraId: OBRA_ID, ...body });
  });

  test("mapea el 400 de validación del servicio", async () => {
    estado.crearError = errorServicio(400, "VALIDATION_ERROR", "nombre inválido");
    const res = makeRes();
    await crearRolWeb(req({ body: { nombre: "A" } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ code: "VALIDATION_ERROR", message: "nombre inválido" });
  });

  test("mapea el 409 de nombre duplicado del servicio", async () => {
    estado.crearError = errorServicio(409, "ROL_DUPLICADO", "Ya existe un rol");
    const res = makeRes();
    await crearRolWeb(req({ body: { nombre: "Capataz" } }), res);

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe("ROL_DUPLICADO");
  });

  test("un error inesperado devuelve 500 genérico (no filtra el mensaje interno)", async () => {
    estado.crearError = new Error("password=secreto");
    const originalError = console.error;
    console.error = () => {};
    try {
      const res = makeRes();
      await crearRolWeb(req({ body: { nombre: "Paisajista" } }), res);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        code: "SERVER_ERROR",
        message: "No se pudo crear el rol",
      });
    } finally {
      console.error = originalError;
    }
  });
});

// --- PATCH -----------------------------------------------------------------

describe("PATCH /roles/:obra_id/:rol_id", () => {
  test("reenvía solo los campos presentes", async () => {
    const res = makeRes();
    await actualizarRolWeb(
      req({ params: { obra_id: OBRA_ID, rol_id: ROL_ID }, body: { permisos: { web: { "dashboard.ver": false } } } }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(actualizarRol).toHaveBeenCalledWith({
      obraId: OBRA_ID,
      rolId: ROL_ID,
      cambios: { permisos: { web: { "dashboard.ver": false } } },
    });
  });

  test("mapea 409 de rol de sistema inmutable", async () => {
    estado.actualizarError = errorServicio(409, "ROL_SISTEMA_INMUTABLE", "No se puede renombrar");
    const res = makeRes();
    await actualizarRolWeb(
      req({ params: { obra_id: OBRA_ID, rol_id: ROL_ID }, body: { nombre: "Jefe" } }),
      res
    );

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe("ROL_SISTEMA_INMUTABLE");
  });

  test("mapea 404 de rol inexistente", async () => {
    estado.actualizarError = errorServicio(404, "NOT_FOUND", "Rol no encontrado");
    const res = makeRes();
    await actualizarRolWeb(
      req({ params: { obra_id: OBRA_ID, rol_id: "no-existe" }, body: { descripcion: "x" } }),
      res
    );

    expect(res.statusCode).toBe(404);
  });
});

// --- DELETE ----------------------------------------------------------------

describe("DELETE /roles/:obra_id/:rol_id", () => {
  test("204 sin body cuando el rol se borra", async () => {
    const res = makeRes();
    await eliminarRolWeb(req({ params: { obra_id: OBRA_ID, rol_id: ROL_ID } }), res);

    expect(res.statusCode).toBe(204);
    expect(res.enviado).toBe(true);
    expect(eliminarRol).toHaveBeenCalledWith({ obraId: OBRA_ID, rolId: ROL_ID });
  });

  test("mapea 409 cuando el rol está en uso o es de sistema", async () => {
    estado.eliminarError = errorServicio(409, "ROL_EN_USO", "El rol tiene 2 miembro(s)");
    const res = makeRes();
    await eliminarRolWeb(req({ params: { obra_id: OBRA_ID, rol_id: ROL_ID } }), res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ code: "ROL_EN_USO", message: "El rol tiene 2 miembro(s)" });
  });
});
