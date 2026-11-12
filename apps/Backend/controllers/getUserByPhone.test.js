// Tests de GET /bot/obreros/telefono/:phone (getUserByPhone) con permisos dinámicos.
//
// El bot usa esta respuesta para avisar antes de operar: por cada obra tiene que
// venir el rol canónico y la lista de permisos bot efectivos de roles_obra.
// Se mantiene `rol` (compatibilidad) y se agrega `permisos`. El acceso a datos se
// mockea con un pool falso; la resolución es la REAL de roles.service.js.

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ROLES_SISTEMA, normalizarPermisos } from "../services/roles.service.js";

const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";
const OBRA_A = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const OBRA_B = "9f8e7d6c-5b4a-4938-8271-abcdefabcdef";
const OBRA_C = "3a1b2c3d-4e5f-4a6b-8c7d-0123456789ab";
const TELEFONO = "5491112345678";

const estado = {
  filas: [],
  tablaRoles: true,
  roles: {},
};

function filaRol(nombre, extra = {}) {
  const definicion = ROLES_SISTEMA.find((rol) => rol.nombre === nombre);
  if (!definicion) {
    return {
      id: `custom-${nombre}`,
      obra_id: null,
      nombre,
      descripcion: "",
      nivel: 10,
      es_sistema: false,
      permisos: normalizarPermisos(null),
      ...extra,
    };
  }
  return {
    id: `sistema-${nombre}`,
    obra_id: null,
    nombre,
    descripcion: definicion.descripcion,
    nivel: definicion.nivel,
    es_sistema: true,
    permisos: normalizarPermisos(definicion.permisos),
    ...extra,
  };
}

function rolesSembrados(obraId) {
  return ROLES_SISTEMA.map((rol) => ({ ...filaRol(rol.nombre), obra_id: obraId }));
}

function responder(sqlOriginal, params = []) {
  const sql = String(sqlOriginal).replace(/\s+/g, " ").trim();

  if (sql.startsWith("SELECT p.id, p.nombre, p.telefono, mo.obra_id")) {
    return { rows: estado.filas };
  }

  if (sql.includes("roles_obra")) {
    if (!estado.tablaRoles) {
      throw Object.assign(new Error('relation "roles_obra" does not exist'), { code: "42P01" });
    }
    const [obraId, nombre] = params;
    const buscado = String(nombre).trim().toLowerCase();
    const fila = (estado.roles[obraId] ?? []).find(
      (rol) => rol.nombre.toLowerCase() === buscado
    );
    return { rows: fila ? [fila] : [] };
  }

  throw new Error(`consulta SQL no prevista en getUserByPhone.test: ${sql}`);
}

const pool = { query: mock(responder) };

mock.module("../db.js", () => ({ pool }));

const { getUserByPhone } = await import("./obrerosController.js");

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
  };
}

function req(telefono = TELEFONO) {
  return { params: { phone: telefono } };
}

beforeEach(() => {
  estado.tablaRoles = true;
  estado.roles = {
    [OBRA_A]: rolesSembrados(OBRA_A),
    [OBRA_B]: rolesSembrados(OBRA_B),
    [OBRA_C]: [
      ...rolesSembrados(OBRA_C),
      {
        ...filaRol("Paisajista"),
        id: "custom-paisajista",
        obra_id: OBRA_C,
        permisos: normalizarPermisos({ bot: { "tarea.crear": true } }),
      },
    ],
  };
  estado.filas = [
    {
      id: PERSONA_ID,
      nombre: "Ana Pérez",
      telefono: TELEFONO,
      obra_id: OBRA_A,
      rol: "Capataz",
      obra_nombre: "Obra A",
      direccion: "Calle 1",
    },
    {
      id: PERSONA_ID,
      nombre: "Ana Pérez",
      telefono: TELEFONO,
      obra_id: OBRA_B,
      rol: "Director de obra",
      obra_nombre: "Obra B",
      direccion: "Calle 2",
    },
    {
      id: PERSONA_ID,
      nombre: "Ana Pérez",
      telefono: TELEFONO,
      obra_id: OBRA_C,
      rol: "Paisajista",
      obra_nombre: "Obra C",
      direccion: "Calle 3",
    },
  ];
  pool.query.mockClear();
});

describe("getUserByPhone — permisos por obra", () => {
  test("devuelve rol canónico y permisos bot efectivos por cada obra", async () => {
    const res = makeRes();
    await getUserByPhone(req(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(PERSONA_ID);
    expect(res.body.telefono).toBe(TELEFONO);
    expect(res.body.obras.length).toBe(3);

    const [obraA, obraB, obraC] = res.body.obras;
    expect(obraA.obra_id).toBe(OBRA_A);
    expect(obraA.obra_nombre).toBe("Obra A");
    expect(obraA.rol).toBe("Capataz");
    expect(obraA.permisos).toContain("pedido.entregar");
    expect(obraA.permisos).toContain("stock.ajustar");
    expect(obraA.permisos).toContain("stock.registrar");
    expect(obraA.permisos.length).toBe(10);

    // Rol legacy de la web: se devuelve el nombre canónico.
    expect(obraB.rol).toBe("Director");
    expect(obraB.permisos.length).toBe(10);

    // Rol personalizado: usa la matriz configurada en la obra, no la estática.
    expect(obraC.rol).toBe("Paisajista");
    expect(obraC.permisos).toEqual(["tarea.crear"]);
  });

  test("si la tabla roles_obra no existe, cae a la matriz estática sin romper", async () => {
    estado.tablaRoles = false;
    estado.filas = [
      {
        id: PERSONA_ID,
        nombre: "Ana Pérez",
        telefono: TELEFONO,
        obra_id: OBRA_A,
        rol: "Capataz",
        obra_nombre: "Obra A",
        direccion: "Calle 1",
      },
    ];

    const res = makeRes();
    await getUserByPhone(req(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.obras[0].rol).toBe("Capataz");
    expect(res.body.obras[0].permisos).toContain("pedido.crear");
    expect(res.body.obras[0].permisos.length).toBe(10);
  });

  test("404 si el teléfono no pertenece a ninguna persona", async () => {
    estado.filas = [];
    const res = makeRes();
    await getUserByPhone(req("5491100000000"), res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Obrero no encontrado");
  });

  test("un rol desconocido cae en Obrero (mínimo privilegio) con la matriz de Obrero", async () => {
    estado.filas = [
      {
        id: PERSONA_ID,
        nombre: "Ana Pérez",
        telefono: TELEFONO,
        obra_id: OBRA_A,
        rol: "Rey de la obra",
        obra_nombre: "Obra A",
        direccion: "Calle 1",
      },
    ];

    const res = makeRes();
    await getUserByPhone(req(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.obras[0].rol).toBe("Obrero");
    expect(res.body.obras[0].permisos).toContain("stock.registrar");
    expect(res.body.obras[0].permisos).not.toContain("pedido.crear");
  });
});
