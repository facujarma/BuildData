// Matriz de enforcement web por rol: `exigirPermiso` × cada permiso del catálogo.
//
// La matriz esperada está transcripta de docs/roles-permisos.md §Matriz por
// defecto (no se deriva de ROLES_SISTEMA a propósito): si alguien cambia un
// default o el gate, el test falla. El fixture de `roles_obra` también sale de la
// doc, así que el test cubre la cadena completa perfilEnObra → resolverRol →
// normalizarPermisos → gate.
//
// Sin Postgres: se mockea `db.js` con las dos consultas que hace el middleware.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";

// docs/roles-permisos.md §Matriz por defecto → columna Web.
const MATRIZ_DOC = {
  Cliente: [
    "dashboard.ver",
    "equipo.ver",
    "cronograma.ver",
    "actividad.ver",
    "galeria.ver",
    "reportes.ver",
  ],
  Obrero: [
    "dashboard.ver",
    "equipo.ver",
    "cronograma.ver",
    "actividad.ver",
    "actividad.registrar",
    "galeria.ver",
    "galeria.gestionar",
    "stock.ver",
    "alertas.ver",
    "alertas.gestionar",
  ],
  "Seguridad e Higiene": [
    "dashboard.ver",
    "equipo.ver",
    "cronograma.ver",
    "actividad.ver",
    "actividad.registrar",
    "galeria.ver",
    "galeria.gestionar",
    "reportes.ver",
    "stock.ver",
    "alertas.ver",
    "alertas.gestionar",
  ],
  Capataz: [
    "dashboard.ver",
    "bandeja.ver",
    "bandeja.aprobar",
    "equipo.ver",
    "cronograma.ver",
    "cronograma.editar",
    "actividad.ver",
    "actividad.registrar",
    "galeria.ver",
    "galeria.gestionar",
    "reportes.ver",
    "pedidos.ver",
    "pedidos.crear",
    "pedidos.aprobar",
    "pedidos.entregar",
    "stock.ver",
    "stock.ajustar",
    "proveedores.ver",
    "presupuesto.ver",
    "recibos.ver",
    "recibos.gestionar",
    "alertas.ver",
    "alertas.gestionar",
  ],
  Administrativo: [
    "dashboard.ver",
    "bandeja.ver",
    "bandeja.aprobar",
    "equipo.ver",
    "cronograma.ver",
    "actividad.ver",
    "actividad.registrar",
    "galeria.ver",
    "reportes.ver",
    "reportes.exportar",
    "pedidos.ver",
    "pedidos.crear",
    "pedidos.aprobar",
    "stock.ver",
    "stock.ajustar",
    "proveedores.ver",
    "proveedores.gestionar",
    "presupuesto.ver",
    "recibos.ver",
    "recibos.gestionar",
    "alertas.ver",
  ],
  Director: null, // null = todos los permisos del catálogo
};

const NIVEL = {
  Cliente: 5,
  Obrero: 10,
  "Seguridad e Higiene": 25,
  Capataz: 30,
  Administrativo: 60,
  Director: 100,
};

const estado = {
  rol: "Capataz",
  esMiembro: true,
};

function filaRol(nombre) {
  const buscado = String(nombre ?? "").trim().toLowerCase();
  const clave = Object.keys(MATRIZ_DOC).find((rol) => rol.toLowerCase() === buscado);
  if (!clave) return null;
  const habilitados = new Set(MATRIZ_DOC[clave] ?? CLAVES_WEB);
  const web = {};
  for (const permiso of CLAVES_WEB) web[permiso] = habilitados.has(permiso);
  return {
    id: `rol-${clave}`,
    obra_id: OBRA_ID,
    nombre: clave,
    descripcion: `Fixture de ${clave}`,
    nivel: NIVEL[clave],
    es_sistema: true,
    permisos: { bot: {}, web },
    created_at: null,
    updated_at: null,
  };
}

mock.module("../db.js", () => ({
  pool: {
    query: async (sql, params = []) => {
      const consulta = String(sql).replace(/\s+/g, " ").trim();
      if (consulta.startsWith("SELECT rol FROM miembros_obra")) {
        return { rows: estado.esMiembro ? [{ rol: estado.rol }] : [] };
      }
      if (consulta.includes("FROM roles_obra")) {
        const fila = filaRol(params[1]);
        return { rows: fila ? [fila] : [] };
      }
      throw new Error(`pool.query no esperado en permisosWeb.matriz.test: ${consulta}`);
    },
  },
}));

const { CATALOGO_PERMISOS } = await import("../services/roles.service.js");
const { exigirPermiso, obraDeParam } = await import("./permisosWeb.js");

const CLAVES_WEB = CATALOGO_PERMISOS.web.map((permiso) => permiso.key);

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

// Corre el middleware real con un pedido autenticado sobre la obra del fixture.
async function pedir(permiso) {
  const req = { personaId: PERSONA_ID, params: { obra_id: OBRA_ID } };
  const res = resFalso();
  let paso = false;
  await exigirPermiso(permiso, obraDeParam("obra_id"))(req, res, () => {
    paso = true;
  });
  return { res, paso, req };
}

// Espera 200 (permiso) o 403 SIN_PERMISO (sin permiso) y devuelve un string
// legible para que el fallo de la matriz diga exactamente qué combinación falló.
async function esperar(rol, permiso, habilitado) {
  estado.rol = rol;
  const { res, paso } = await pedir(permiso);
  const etiqueta = `${rol} × ${permiso}`;
  if (habilitado) {
    expect({ caso: etiqueta, status: res.statusCode, paso }).toEqual({
      caso: etiqueta,
      status: 200,
      paso: true,
    });
  } else {
    expect({ caso: etiqueta, status: res.statusCode, paso }).toEqual({
      caso: etiqueta,
      status: 403,
      paso: false,
    });
    expect({ caso: etiqueta, code: res.body?.code }).toEqual({
      caso: etiqueta,
      code: "SIN_PERMISO",
    });
  }
}

beforeEach(() => {
  estado.rol = "Capataz";
  estado.esMiembro = true;
});

describe("matriz web por rol (docs/roles-permisos.md)", () => {
  test("cada permiso del catálogo responde según la matriz del rol", async () => {
    for (const [rol, habilitadosDoc] of Object.entries(MATRIZ_DOC)) {
      const habilitados = new Set(habilitadosDoc ?? CLAVES_WEB);
      for (const permiso of CLAVES_WEB) {
        await esperar(rol, permiso, habilitados.has(permiso));
      }
    }
  });

  test("la matriz transcrita usa solo claves del catálogo (sin typos)", () => {
    const catalogo = new Set(CLAVES_WEB);
    for (const [rol, habilitados] of Object.entries(MATRIZ_DOC)) {
      for (const permiso of habilitados ?? []) {
        expect({ rol, permiso, existe: catalogo.has(permiso) }).toEqual({
          rol,
          permiso,
          existe: true,
        });
      }
    }
  });
});

describe("miembro sin rol asignado", () => {
  test("rol NULL cae en Obrero (mínimo privilegio): lectura sí, operación no", async () => {
    estado.rol = null;

    const lectura = await pedir("dashboard.ver");
    expect(lectura.paso).toBe(true);
    expect(lectura.req.perfilObra.rol.nombre).toBe("Obrero");
    expect(lectura.req.perfilObra.permisos.web["dashboard.ver"]).toBe(true);

    const operacion = await pedir("pedidos.crear");
    expect(operacion.paso).toBe(false);
    expect(operacion.res.statusCode).toBe(403);
    expect(operacion.res.body).toMatchObject({ code: "SIN_PERMISO", rol: "Obrero" });
  });

  test("rol que no existe en la obra ni en los de sistema cae en Obrero", async () => {
    estado.rol = "Paisajista";

    // dashboard.ver lo tiene Obrero: pasa y deja ver el perfil resuelto.
    const lectura = await pedir("dashboard.ver");
    expect(lectura.paso).toBe(true);
    expect(lectura.req.perfilObra.rol.nombre).toBe("Obrero");
    expect(lectura.req.perfilObra.permisos.web["dashboard.ver"]).toBe(true);

    // Una capacidad que Obrero no tiene queda bloqueada.
    const operacion = await pedir("stock.ajustar");
    expect(operacion.paso).toBe(false);
    expect(operacion.res.statusCode).toBe(403);
    expect(operacion.res.body).toMatchObject({ code: "SIN_PERMISO", rol: "Obrero" });
  });

  test("sin membresía no se resuelve ningún rol: 403 SIN_MEMBRESIA", async () => {
    estado.esMiembro = false;
    const { res, paso } = await pedir("dashboard.ver");

    expect(paso).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("SIN_MEMBRESIA");
  });
});

// ─────────────────────────────────────────────────────────────
// Criterios de aceptación del issue #8 (rutas críticas, por rol)
// ─────────────────────────────────────────────────────────────

const ACEPTACION = {
  Obrero: {
    permite: ["dashboard.ver", "stock.ver", "galeria.gestionar", "actividad.registrar"],
    rechaza: [
      "pedidos.crear",
      "pedidos.aprobar",
      "pedidos.entregar",
      "stock.ajustar",
      "presupuesto.editar",
      "reportes.exportar",
      "equipo.administrar",
      "roles.administrar",
      "configuracion.editar",
      "bandeja.aprobar",
    ],
  },
  Capataz: {
    permite: [
      "pedidos.crear",
      "pedidos.aprobar",
      "pedidos.entregar",
      "stock.ajustar",
      "cronograma.editar",
      "bandeja.aprobar",
      "presupuesto.ver",
      "recibos.ver",
    ],
    rechaza: [
      "configuracion.editar",
      "presupuesto.editar",
      "reportes.exportar",
      "equipo.administrar",
      "roles.administrar",
    ],
  },
  Administrativo: {
    permite: [
      "proveedores.gestionar",
      "stock.ajustar",
      "recibos.gestionar",
      "presupuesto.ver",
      "reportes.exportar",
      "pedidos.aprobar",
      "bandeja.aprobar",
    ],
    rechaza: [
      "presupuesto.editar",
      "equipo.administrar",
      "configuracion.editar",
      "pedidos.entregar",
      "roles.administrar",
    ],
  },
  Cliente: {
    permite: [
      "dashboard.ver",
      "cronograma.ver",
      "actividad.ver",
      "galeria.ver",
      "reportes.ver",
      "equipo.ver",
    ],
    rechaza: [
      "presupuesto.ver",
      "recibos.ver",
      "pedidos.ver",
      "stock.ver",
      "actividad.registrar",
      "galeria.gestionar",
      "bandeja.ver",
    ],
  },
};

describe("aceptación #8: 403 por capacidad en rutas críticas", () => {
  for (const [rol, casos] of Object.entries(ACEPTACION)) {
    test(`${rol}: permite ${casos.permite.length} capacidades y rechaza ${casos.rechaza.length}`, async () => {
      for (const permiso of casos.permite) await esperar(rol, permiso, true);
      for (const permiso of casos.rechaza) await esperar(rol, permiso, false);
    });
  }

  test("Director conserva todas las capacidades (no se rompen los flujos actuales)", async () => {
    for (const permiso of CLAVES_WEB) await esperar("Director", permiso, true);
  });

  test("invitar/editar roles: solo Director (equipo.administrar + roles.administrar)", async () => {
    const roles = ["Cliente", "Obrero", "Seguridad e Higiene", "Capataz", "Administrativo"];
    for (const rol of roles) {
      await esperar(rol, "equipo.administrar", false);
      await esperar(rol, "roles.administrar", false);
    }
    await esperar("Director", "equipo.administrar", true);
    await esperar("Director", "roles.administrar", true);
  });

  test("la autoaprobación no se prohíbe: aprobar depende del permiso, no del creador", async () => {
    // No hay ninguna regla de "no podés aprobar lo tuyo": Capataz aprueba.
    await esperar("Capataz", "bandeja.aprobar", true);
    await esperar("Capataz", "pedidos.aprobar", true);
  });
});
