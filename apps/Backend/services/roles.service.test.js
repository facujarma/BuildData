// Tests del núcleo de roles por obra (roles_obra).
//
// Se prueba el contrato puro (catálogo, defaults, normalización, jerarquía) contra
// las definiciones reales de roles.service.js, y la resolución de roles con un
// `pool` falso: no se toca Postgres. El caso 42P01 (tabla sin migrar) es el fallback
// que permite deployar el código nuevo antes de correr la migración.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";

const estado = {
  tablaExiste: false,
  roles: [],
  miembros: [],
};

function errorPostgres(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

const poolQuery = mock(async (sql, params) => {
  const consulta = String(sql).replace(/\s+/g, " ").trim();

  if (!estado.tablaExiste && consulta.includes("roles_obra")) {
    throw errorPostgres("42P01", 'relation "roles_obra" does not exist');
  }
  if (consulta.startsWith("SELECT rol FROM miembros_obra")) {
    const [personaId, obraId] = params;
    return {
      rows: estado.miembros
        .filter((m) => m.persona_id === personaId && m.obra_id === obraId)
        .map((m) => ({ rol: m.rol })),
    };
  }
  if (consulta.includes("FROM roles_obra") && consulta.includes("lower(nombre) = lower($2)")) {
    const [, nombre] = params;
    const buscado = String(nombre).trim().toLowerCase();
    return { rows: estado.roles.filter((r) => r.nombre.toLowerCase() === buscado) };
  }
  if (consulta.includes("FROM roles_obra") && consulta.includes("id = $2")) {
    const [, id] = params;
    return { rows: estado.roles.filter((r) => r.id === id) };
  }
  throw new Error(`consulta no esperada en roles.service.test: ${consulta}`);
});

mock.module("../db.js", () => ({
  pool: { query: poolQuery },
}));

const {
  CATALOGO_PERMISOS,
  ROLES_SISTEMA,
  normalizarPermisos,
  normalizarNombreRol,
  validarNombreRol,
  permisosDeRolSistema,
  puedePorNivel,
  permisosVacios,
  resolverRol,
  perfilEnObra,
} = await import("./roles.service.js");

function claves(superficie) {
  return CATALOGO_PERMISOS[superficie].map((permiso) => permiso.key);
}

function rolSistema(nombre) {
  return ROLES_SISTEMA.find((rol) => rol.nombre === nombre);
}

function filaRol(nombre, extra = {}) {
  const sistema = rolSistema(nombre);
  return {
    id: `rol-${nombre}`,
    obra_id: OBRA_ID,
    nombre: sistema.nombre,
    descripcion: sistema.descripcion,
    nivel: sistema.nivel,
    es_sistema: true,
    permisos: normalizarPermisos(sistema.permisos),
    ...extra,
  };
}

beforeEach(() => {
  estado.tablaExiste = false;
  estado.roles = [];
  estado.miembros = [];
  poolQuery.mockClear();
});

describe("CATALOGO_PERMISOS", () => {
  test("cada superficie tiene claves únicas y las 10/30 de la spec", () => {
    const bot = claves("bot");
    const web = claves("web");

    expect(bot.length).toBe(10);
    expect(web.length).toBe(30);
    expect(new Set(bot).size).toBe(bot.length);
    expect(new Set(web).size).toBe(web.length);

    for (const permiso of CATALOGO_PERMISOS.bot) {
      expect(typeof permiso.key).toBe("string");
      expect(permiso.label.length).toBeGreaterThan(0);
      expect(permiso.grupo.length).toBeGreaterThan(0);
    }
    for (const permiso of CATALOGO_PERMISOS.web) {
      expect(typeof permiso.key).toBe("string");
      expect(permiso.label.length).toBeGreaterThan(0);
      expect(permiso.grupo.length).toBeGreaterThan(0);
    }
  });
});

describe("ROLES_SISTEMA", () => {
  test("son los seis roles de la spec, en orden de nivel y sin duplicados", () => {
    expect(ROLES_SISTEMA.map((rol) => rol.nombre)).toEqual([
      "Cliente",
      "Obrero",
      "Seguridad e Higiene",
      "Capataz",
      "Administrativo",
      "Director",
    ]);
    expect(ROLES_SISTEMA.map((rol) => rol.nivel)).toEqual([5, 10, 25, 30, 60, 100]);
    for (const rol of ROLES_SISTEMA) expect(rol.es_sistema).toBe(true);
  });

  test("cada rol trae el mapa completo de permisos (todas las claves, booleanas)", () => {
    for (const rol of ROLES_SISTEMA) {
      for (const superficie of ["bot", "web"]) {
        expect(Object.keys(rol.permisos[superficie]).sort()).toEqual(claves(superficie).sort());
        for (const valor of Object.values(rol.permisos[superficie])) {
          expect(typeof valor).toBe("boolean");
        }
      }
    }
  });

  test("Director tiene todo y conserva los candados de administración", () => {
    const director = rolSistema("Director");
    expect(Object.values(director.permisos.bot).every(Boolean)).toBe(true);
    expect(Object.values(director.permisos.web).every(Boolean)).toBe(true);
    expect(director.permisos.web["roles.administrar"]).toBe(true);
    expect(director.permisos.web["equipo.administrar"]).toBe(true);
  });

  test("Cliente no tiene permisos de bot ni de operación", () => {
    const cliente = rolSistema("Cliente");
    expect(Object.values(cliente.permisos.bot).some(Boolean)).toBe(false);
    expect(cliente.permisos.web["dashboard.ver"]).toBe(true);
    expect(cliente.permisos.web["presupuesto.ver"]).toBe(false);
    expect(cliente.permisos.web["recibos.ver"]).toBe(false);
  });
});

describe("normalizarPermisos", () => {
  test("sin permisos devuelve el mapa completo en false", () => {
    expect(permisosVacios()).toEqual(normalizarPermisos(null));
    for (const superficie of ["bot", "web"]) {
      const mapa = normalizarPermisos(null)[superficie];
      expect(Object.keys(mapa).sort()).toEqual(claves(superficie).sort());
      expect(Object.values(mapa).every((valor) => valor === false)).toBe(true);
    }
  });

  test("descarta claves desconocidas y completa las faltantes en false", () => {
    const permisos = normalizarPermisos({
      bot: { "stock.registrar": true, "inventada.total": true },
      web: { "dashboard.ver": true },
      otra: { "x.y": true },
    });

    expect(permisos.bot["stock.registrar"]).toBe(true);
    expect(permisos.bot["inventada.total"]).toBeUndefined();
    expect(permisos.bot["stock.ajustar"]).toBe(false);
    expect(Object.keys(permisos.bot).sort()).toEqual(claves("bot").sort());

    expect(permisos.web["dashboard.ver"]).toBe(true);
    expect(permisos.web["roles.administrar"]).toBe(false);
    expect(Object.keys(permisos.web).sort()).toEqual(claves("web").sort());
    expect(permisos.otra).toBeUndefined();
  });

  test("solo el boolean true habilita el permiso", () => {
    const permisos = normalizarPermisos({ bot: { "foto.subir": "true", "gasto.crear": 1 } });
    expect(permisos.bot["foto.subir"]).toBe(false);
    expect(permisos.bot["gasto.crear"]).toBe(false);
  });
});

describe("normalizarNombreRol / validarNombreRol", () => {
  test("recorta y colapsa espacios", () => {
    expect(normalizarNombreRol("  Jefe   de   Obra ")).toBe("Jefe de Obra");
    expect(normalizarNombreRol(null)).toBe("");
    expect(normalizarNombreRol(undefined)).toBe("");
  });

  test("exige entre 2 y 40 caracteres", () => {
    expect(validarNombreRol("A")).toBeTruthy();
    expect(validarNombreRol("   ")).toBeTruthy();
    expect(validarNombreRol("Ab")).toBeNull();
    expect(validarNombreRol("x".repeat(40))).toBeNull();
    expect(validarNombreRol("x".repeat(41))).toBeTruthy();
  });
});

describe("permisosDeRolSistema", () => {
  test("devuelve el mapa normalizado del rol, sin importar mayúsculas", () => {
    const permisos = permisosDeRolSistema("capataz");
    expect(permisos.bot["stock.ajustar"]).toBe(true);
    expect(permisos.web["roles.administrar"]).toBe(false);
    expect(Object.keys(permisos.web).sort()).toEqual(claves("web").sort());
  });

  test("rol desconocido devuelve null", () => {
    expect(permisosDeRolSistema("Rey de la obra")).toBeNull();
  });
});

describe("puedePorNivel", () => {
  test("un rol de nivel mayor o igual puede otorgar el rol objetivo", () => {
    const [cliente, obrero, seguridad, capataz, administrativo, director] = ROLES_SISTEMA;

    expect(puedePorNivel(director, director)).toBe(true);
    expect(puedePorNivel(director, administrativo)).toBe(true);
    expect(puedePorNivel(director, obrero)).toBe(true);
    expect(puedePorNivel(administrativo, capataz)).toBe(true);
    expect(puedePorNivel(administrativo, administrativo)).toBe(true);
    expect(puedePorNivel(capataz, seguridad)).toBe(true);
    expect(puedePorNivel(capataz, obrero)).toBe(true);
    expect(puedePorNivel(obrero, cliente)).toBe(true);
  });

  test("nadie puede otorgar un rol de nivel superior al propio", () => {
    const [, obrero, , capataz, administrativo, director] = ROLES_SISTEMA;

    expect(puedePorNivel(obrero, capataz)).toBe(false);
    expect(puedePorNivel(capataz, administrativo)).toBe(false);
    expect(puedePorNivel(administrativo, director)).toBe(false);
  });

  test("fail closed: falta el nivel en cualquiera de los dos lados", () => {
    const director = rolSistema("Director");
    expect(puedePorNivel(null, director)).toBe(false);
    expect(puedePorNivel(director, null)).toBe(false);
    expect(puedePorNivel({}, director)).toBe(false);
    expect(puedePorNivel(director, { nombre: "Fantasma" })).toBe(false);
    expect(puedePorNivel({ nivel: null }, director)).toBe(false);
    expect(puedePorNivel(director, { nivel: null })).toBe(false);
    expect(puedePorNivel({ nivel: "100" }, director)).toBe(false);
  });
});

describe("resolverRol sin la tabla roles_obra (42P01)", () => {
  test("cae al rol de sistema equivalente con id null", async () => {
    const rol = await resolverRol(OBRA_ID, "Seguridad e higiene");

    expect(rol.nombre).toBe("Seguridad e Higiene");
    expect(rol.id).toBeNull();
    expect(rol.es_sistema).toBe(true);
    expect(rol.permisos.bot["alerta.crear"]).toBe(true);
  });

  test("un rol basura cae en Obrero (mínimo privilegio)", async () => {
    const rol = await resolverRol(OBRA_ID, "Rey de la obra");
    expect(rol.nombre).toBe("Obrero");
    expect(rol.id).toBeNull();
  });

  test("rol vacío o null también cae en Obrero", async () => {
    expect((await resolverRol(OBRA_ID, null)).nombre).toBe("Obrero");
    expect((await resolverRol(OBRA_ID, "   ")).nombre).toBe("Obrero");
  });
});

describe("resolverRol con roles_obra", () => {
  beforeEach(() => {
    estado.tablaExiste = true;
    estado.roles = ROLES_SISTEMA.map((rol) => filaRol(rol.nombre));
  });

  test("prioriza el nombre exacto de la obra (case-insensitive)", async () => {
    estado.roles.push(
      filaRol("Capataz", {
        id: "rol-capataz-propio",
        nombre: "Capataz de turno",
        nivel: 35,
        es_sistema: false,
      })
    );

    const rol = await resolverRol(OBRA_ID, "capataz de turno");
    expect(rol.nombre).toBe("Capataz de turno");
    expect(rol.id).toBe("rol-capataz-propio");
    expect(rol.nivel).toBe(35);
  });

  test("si no hay match exacto, mapea el rol viejo al rol de sistema", async () => {
    const rol = await resolverRol(OBRA_ID, "Director de obra");
    expect(rol.nombre).toBe("Director");
    expect(rol.id).toBe("rol-Director");
  });

  test("rol desconocido cae en el Obrero de la obra", async () => {
    const rol = await resolverRol(OBRA_ID, "Pirata");
    expect(rol.nombre).toBe("Obrero");
    expect(rol.id).toBe("rol-Obrero");
  });

  test("si la obra no tiene fila de Obrero, devuelve el rol de sistema sintético", async () => {
    estado.roles = estado.roles.filter((rol) => rol.nombre !== "Obrero");
    const rol = await resolverRol(OBRA_ID, "Pirata");
    expect(rol.nombre).toBe("Obrero");
    expect(rol.id).toBeNull();
  });
});

describe("perfilEnObra", () => {
  test("sin fila en miembros_obra devuelve null", async () => {
    expect(await perfilEnObra(PERSONA_ID, OBRA_ID)).toBeNull();
    expect(await perfilEnObra(null, OBRA_ID)).toBeNull();
  });

  test("devuelve el rol resuelto y sus permisos normalizados", async () => {
    estado.miembros = [{ persona_id: PERSONA_ID, obra_id: OBRA_ID, rol: "Capataz" }];

    const perfil = await perfilEnObra(PERSONA_ID, OBRA_ID);

    expect(perfil.rol.nombre).toBe("Capataz");
    expect(perfil.permisos.bot["pedido.crear"]).toBe(true);
    expect(perfil.permisos.web["equipo.administrar"]).toBe(false);
    expect(Object.keys(perfil.permisos.web).sort()).toEqual(claves("web").sort());
  });
});
