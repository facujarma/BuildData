// Tests del CRUD de roles_obra y del seed de roles por obra.
//
// Se usa el roles.service REAL contra un `pool` falso en memoria: no se toca
// Postgres. Cubre las reglas que el contrato de la API promete y que no se ven en
// roles.service.test.js (catálogo/resolución):
// - seed idempotente al crear una obra (y no-op si falta la migración);
// - crear rol personalizado (validaciones, duplicados, defaults);
// - editar rol de sistema (no se renombra ni cambia de nivel; Director conserva
//   roles.administrar y equipo.administrar);
// - borrar rol (sistema / en uso / con invitaciones pendientes);
// - renombrar un rol personalizado arrastra miembros e invitaciones pendientes.

import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ROLES_SISTEMA, normalizarPermisos } from "./roles.service.js";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const OTRA_OBRA_ID = "9f8e7d6c-5b4a-4938-8271-abcdefabcdef";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";

const estado = {
  tablaRoles: true,
  tablaInvitaciones: true,
  roles: [],
  miembros: [],
  invitaciones: [],
  inserts: [],
  updates: [],
  deletes: [],
  borrados: 0,
  errorRoles: null,
};

// Ids UUID fijos por rol de sistema (los ids reales son uuid; obtenerRol distingue
// id de nombre con un regex de UUID).
const IDS_SISTEMA = Object.fromEntries(
  ROLES_SISTEMA.map((rol, indice) => [
    rol.nombre,
    `00000000-0000-4000-8000-${String(indice + 1).padStart(12, "0")}`,
  ])
);

function filaRol(nombre, extra = {}) {
  const definicion = ROLES_SISTEMA.find((rol) => rol.nombre === nombre);
  return {
    id: IDS_SISTEMA[nombre],
    obra_id: OBRA_ID,
    nombre,
    descripcion: definicion?.descripcion ?? "",
    nivel: definicion?.nivel ?? 10,
    es_sistema: Boolean(definicion),
    permisos: definicion ? normalizarPermisos(definicion.permisos) : normalizarPermisos(null),
    created_at: "2026-11-12T12:00:00.000Z",
    updated_at: "2026-11-12T12:00:00.000Z",
    ...extra,
  };
}

function sembrarEstado() {
  estado.tablaRoles = true;
  estado.tablaInvitaciones = true;
  estado.roles = ROLES_SISTEMA.map((rol) => filaRol(rol.nombre));
  estado.miembros = [];
  estado.invitaciones = [];
  estado.inserts = [];
  estado.updates = [];
  estado.deletes = [];
  estado.borrados = 0;
  estado.errorRoles = null;
}

function esRoles(sql) {
  return sql.includes("roles_obra");
}

// Handler único para pool.query y client.query: mantiene el estado en memoria y
// responde por forma de query. Lo no previsto explota para que un cambio de flujo
// no pase desapercibido.
async function consultar(sqlOriginal, params = []) {
  const sql = String(sqlOriginal).replace(/\s+/g, " ").trim();

  if (estado.errorRoles && esRoles(sql)) throw estado.errorRoles;

  if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) {
    return { rows: [], rowCount: 0 };
  }

  if (sql.startsWith("SELECT to_regclass('public.roles_obra')")) {
    return { rows: [{ tabla: estado.tablaRoles ? "roles_obra" : null }] };
  }
  if (sql.startsWith("SELECT to_regclass('public.invitaciones')")) {
    return { rows: [{ tabla: estado.tablaInvitaciones ? "invitaciones" : null }] };
  }

  // Cualquier otra consulta a roles_obra con la migración pendiente explota como
  // lo haría Postgres (42P01): es el caso que el servicio captura para el fallback.
  if (!estado.tablaRoles && esRoles(sql)) {
    throw Object.assign(new Error('relation "roles_obra" does not exist'), { code: "42P01" });
  }

  if (sql.startsWith("INSERT INTO roles_obra")) {
    // El seed inserta es_sistema=true literal; crearRol inserta false literal.
    const esSistema = sql.includes("true, $5::jsonb");
    const [obraId, nombre, descripcion, nivel, permisosJson] = params;
    estado.inserts.push({ obraId, nombre, descripcion, nivel, esSistema, permisosJson });
    if (!estado.tablaRoles) throw Object.assign(new Error('relation "roles_obra" does not exist'), { code: "42P01" });
    const existente = estado.roles.find(
      (rol) => rol.obra_id === obraId && rol.nombre.toLowerCase() === String(nombre).toLowerCase()
    );
    if (existente) return { rows: [], rowCount: 0 };
    const fila = {
      id: randomUUID(),
      obra_id: obraId,
      nombre,
      descripcion,
      nivel: Number(nivel),
      es_sistema: Boolean(esSistema),
      permisos: normalizarPermisos(JSON.parse(permisosJson)),
      created_at: "2026-11-12T12:00:00.000Z",
      updated_at: "2026-11-12T12:00:00.000Z",
    };
    estado.roles.push(fila);
    return { rows: [fila], rowCount: 1 };
  }

  if (sql.startsWith("SELECT * FROM roles_obra WHERE obra_id = $1 ORDER BY")) {
    const [obraId] = params;
    return {
      rows: estado.roles
        .filter((rol) => rol.obra_id === obraId)
        .sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre)),
    };
  }

  if (sql.startsWith("SELECT * FROM roles_obra WHERE obra_id = $1 AND id = $2")) {
    const [obraId, id] = params;
    const fila = estado.roles.find((rol) => rol.obra_id === obraId && rol.id === id);
    return { rows: fila ? [fila] : [] };
  }

  if (sql.startsWith("SELECT * FROM roles_obra WHERE obra_id = $1 AND lower(nombre) = lower($2)")) {
    const [obraId, nombre] = params;
    const fila = estado.roles.find(
      (rol) => rol.obra_id === obraId && rol.nombre.toLowerCase() === String(nombre).trim().toLowerCase()
    );
    return { rows: fila ? [fila] : [] };
  }

  if (sql.startsWith("SELECT id FROM roles_obra WHERE obra_id = $1 AND lower(nombre) = lower($2) AND id <> $3")) {
    const [obraId, nombre, id] = params;
    const fila = estado.roles.find(
      (rol) =>
        rol.obra_id === obraId &&
        rol.nombre.toLowerCase() === String(nombre).trim().toLowerCase() &&
        rol.id !== id
    );
    return { rows: fila ? [{ id: fila.id }] : [] };
  }

  if (sql.startsWith("SELECT id FROM roles_obra WHERE obra_id = $1 AND lower(nombre) = lower($2)")) {
    const [obraId, nombre] = params;
    const fila = estado.roles.find(
      (rol) => rol.obra_id === obraId && rol.nombre.toLowerCase() === String(nombre).trim().toLowerCase()
    );
    return { rows: fila ? [{ id: fila.id }] : [] };
  }

  if (sql.startsWith("UPDATE roles_obra")) {
    const [id, obraId, nombre, descripcion, nivel, permisosJson] = params;
    const indice = estado.roles.findIndex((rol) => rol.id === id && rol.obra_id === obraId);
    if (indice === -1) return { rows: [], rowCount: 0 };
    // Postgres devuelve una fila nueva: no mutar el objeto que el servicio leyó
    // antes (actualizarRol usa ese nombre viejo para arrastrar miembros).
    const actualizada = {
      ...estado.roles[indice],
      nombre,
      descripcion,
      nivel: Number(nivel),
      permisos: normalizarPermisos(JSON.parse(permisosJson)),
      updated_at: "2026-11-12T13:00:00.000Z",
    };
    estado.roles[indice] = actualizada;
    estado.updates.push({ id, obraId, nombre, nivel: actualizada.nivel });
    return { rows: [actualizada], rowCount: 1 };
  }

  if (sql.startsWith("UPDATE miembros_obra SET rol = $3")) {
    const [obraId, viejo, nuevo] = params;
    let rowCount = 0;
    for (const miembro of estado.miembros) {
      if (miembro.obra_id === obraId && String(miembro.rol).toLowerCase() === String(viejo).toLowerCase()) {
        miembro.rol = nuevo;
        rowCount++;
      }
    }
    return { rows: [], rowCount };
  }

  if (sql.startsWith("UPDATE invitaciones SET rol = $3")) {
    const [obraId, viejo, nuevo] = params;
    let rowCount = 0;
    for (const invitacion of estado.invitaciones) {
      if (
        invitacion.obra_id === obraId &&
        invitacion.usada_at === null &&
        String(invitacion.rol).toLowerCase() === String(viejo).toLowerCase()
      ) {
        invitacion.rol = nuevo;
        rowCount++;
      }
    }
    return { rows: [], rowCount };
  }

  if (sql.startsWith("SELECT COUNT(*)::int AS total FROM miembros_obra")) {
    const [obraId, rol] = params;
    const total = estado.miembros.filter(
      (miembro) =>
        miembro.obra_id === obraId && String(miembro.rol).toLowerCase() === String(rol).toLowerCase()
    ).length;
    return { rows: [{ total }] };
  }

  if (sql.startsWith("SELECT COUNT(*)::int AS total FROM invitaciones")) {
    const [obraId, rol] = params;
    const total = estado.invitaciones.filter(
      (invitacion) =>
        invitacion.obra_id === obraId &&
        invitacion.usada_at === null &&
        String(invitacion.rol).toLowerCase() === String(rol).toLowerCase()
    ).length;
    return { rows: [{ total }] };
  }

  if (sql.startsWith("DELETE FROM roles_obra")) {
    const [id, obraId] = params;
    const antes = estado.roles.length;
    estado.roles = estado.roles.filter((rol) => !(rol.id === id && rol.obra_id === obraId));
    estado.borrados++;
    estado.deletes.push({ id, obraId });
    return { rows: [], rowCount: antes - estado.roles.length };
  }

  throw new Error(`consulta SQL no prevista en roles.crud.test: ${sql}`);
}

const pool = {
  query: mock(consultar),
  connect: mock(async () => ({
    query: mock(consultar),
    release: mock(() => {}),
  })),
};

mock.module("../db.js", () => ({ pool }));

const {
  actualizarRol,
  crearRol,
  eliminarRol,
  listarRoles,
  resolverRol,
  sembrarRoles,
} = await import("./roles.service.js");

function clientFalso() {
  return { query: mock(consultar) };
}

beforeEach(() => {
  sembrarEstado();
  pool.query.mockClear();
  pool.connect.mockClear();
});

// --- seed ------------------------------------------------------------------

describe("sembrarRoles", () => {
  // El seed se prueba sobre una obra sin roles cargados (el beforeEach general
  // siembra los seis roles de sistema para el resto de los tests).
  beforeEach(() => {
    estado.roles = [];
  });

  test("sin la migración aplicada (42P01) no hace nada y no rompe el alta", async () => {
    estado.tablaRoles = false;
    const client = clientFalso();

    expect(await sembrarRoles(client, OBRA_ID)).toBe(0);
    expect(estado.inserts.length).toBe(0);
  });

  test("inserta los seis roles de sistema con su matriz completa", async () => {
    const client = clientFalso();

    expect(await sembrarRoles(client, OBRA_ID)).toBe(6);
    expect(estado.inserts.length).toBe(6);
    expect(estado.inserts.map((insert) => insert.nombre)).toEqual(
      ROLES_SISTEMA.map((rol) => rol.nombre)
    );
    for (const insert of estado.inserts) {
      expect(insert.obraId).toBe(OBRA_ID);
      expect(insert.esSistema).toBe(true);
      expect(normalizarPermisos(JSON.parse(insert.permisosJson))).toEqual(
        normalizarPermisos(ROLES_SISTEMA.find((rol) => rol.nombre === insert.nombre).permisos)
      );
    }
  });

  test("es idempotente: la segunda corrida no duplica filas", async () => {
    const client = clientFalso();
    await sembrarRoles(client, OBRA_ID);
    const segunda = await sembrarRoles(client, OBRA_ID);

    expect(segunda).toBe(0);
    expect(estado.roles.filter((rol) => rol.obra_id === OBRA_ID).length).toBe(6);
  });

  test("cada obra recibe sus propios roles", async () => {
    const client = clientFalso();
    await sembrarRoles(client, OBRA_ID);
    await sembrarRoles(client, OTRA_OBRA_ID);

    expect(estado.roles.filter((rol) => rol.obra_id === OBRA_ID).length).toBe(6);
    expect(estado.roles.filter((rol) => rol.obra_id === OTRA_OBRA_ID).length).toBe(6);
  });
});

// --- listar ----------------------------------------------------------------

describe("listarRoles", () => {
  test("devuelve los roles de la obra ordenados por nivel", async () => {
    const roles = await listarRoles(OBRA_ID);

    expect(roles.map((rol) => rol.nombre)).toEqual(ROLES_SISTEMA.map((rol) => rol.nombre));
    expect(roles.every((rol) => rol.obra_id === OBRA_ID)).toBe(true);
  });

  test("sin migración devuelve los seis roles de sistema sintéticos (id null)", async () => {
    estado.tablaRoles = false;
    const roles = await listarRoles(OBRA_ID);

    expect(roles.map((rol) => rol.nombre)).toEqual(ROLES_SISTEMA.map((rol) => rol.nombre));
    expect(roles.every((rol) => rol.id === null)).toBe(true);
  });
});

// --- fallback estático -----------------------------------------------------

describe("resolverRol — fallback a la matriz estática", () => {
  test("si la tabla existe pero la obra no tiene roles, usa el rol de sistema equivalente", async () => {
    estado.roles = [];

    const capataz = await resolverRol(OBRA_ID, "Capataz");
    expect(capataz.id).toBeNull();
    expect(capataz.nombre).toBe("Capataz");
    expect(capataz.permisos.bot["pedido.crear"]).toBe(true);
    expect(capataz.permisos.web["roles.administrar"]).toBe(false);

    const administrativo = await resolverRol(OBRA_ID, "Administrativo");
    expect(administrativo.nombre).toBe("Administrativo");
    expect(administrativo.permisos.web["reportes.exportar"]).toBe(true);

    // Lo desconocido sigue cayendo en Obrero (mínimo privilegio).
    const basura = await resolverRol(OBRA_ID, "Rey de la obra");
    expect(basura.nombre).toBe("Obrero");
  });
});

// --- crear -----------------------------------------------------------------

describe("crearRol", () => {
  test("crea un rol personalizado con nombre normalizado y nivel por defecto", async () => {
    const rol = await crearRol({
      obraId: OBRA_ID,
      nombre: "  Paisajista  ",
      descripcion: "  Parques y jardines ",
      permisos: {
        bot: { "tarea.crear": true },
        web: { "cronograma.ver": true, "permiso.inventado": true },
      },
    });

    expect(rol.nombre).toBe("Paisajista");
    expect(rol.descripcion).toBe("Parques y jardines");
    expect(rol.es_sistema).toBe(false);
    expect(rol.nivel).toBe(10);
    expect(rol.permisos.bot["tarea.crear"]).toBe(true);
    expect(rol.permisos.bot["stock.registrar"]).toBe(false);
    expect(rol.permisos.web["cronograma.ver"]).toBe(true);
    expect(rol.permisos.web["permiso.inventado"]).toBeUndefined();
  });

  test("rechaza un nombre de menos de 2 o más de 40 caracteres (400)", async () => {
    for (const nombre of ["A", "   ", "x".repeat(41)]) {
      await expect(crearRol({ obraId: OBRA_ID, nombre })).rejects.toMatchObject({
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }
    expect(estado.inserts.length).toBe(0);
  });

  test("rechaza un nivel fuera de 1..100 (400)", async () => {
    for (const nivel of [0, 101, 1.5, "alto"]) {
      await expect(
        crearRol({ obraId: OBRA_ID, nombre: "Rol válido", nivel })
      ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    }
  });

  test("rechaza un nombre duplicado case-insensitive (409)", async () => {
    await expect(
      crearRol({ obraId: OBRA_ID, nombre: "capataz" })
    ).rejects.toMatchObject({ status: 409, code: "ROL_DUPLICADO" });
    expect(estado.inserts.length).toBe(0);
  });

  test("el mismo nombre sí se puede usar en otra obra", async () => {
    const rol = await crearRol({ obraId: OTRA_OBRA_ID, nombre: "Capataz de turno" });
    expect(rol.obra_id).toBe(OTRA_OBRA_ID);
  });

  test("sin migración responde 503 MIGRACION_PENDIENTE", async () => {
    estado.tablaRoles = false;
    await expect(
      crearRol({ obraId: OBRA_ID, nombre: "Paisajista" })
    ).rejects.toMatchObject({ status: 503, code: "MIGRACION_PENDIENTE" });
  });
});

// --- actualizar ------------------------------------------------------------

describe("actualizarRol — roles de sistema", () => {
  test("no se puede renombrar (409) y no se toca la fila", async () => {
    const capataz = estado.roles.find((rol) => rol.nombre === "Capataz");

    await expect(
      actualizarRol({ obraId: OBRA_ID, rolId: capataz.id, cambios: { nombre: "Jefe" } })
    ).rejects.toMatchObject({ status: 409, code: "ROL_SISTEMA_INMUTABLE" });
    expect(estado.updates.length).toBe(0);
  });

  test("no se puede cambiar el nivel (409)", async () => {
    const capataz = estado.roles.find((rol) => rol.nombre === "Capataz");

    await expect(
      actualizarRol({ obraId: OBRA_ID, rolId: capataz.id, cambios: { nivel: 99 } })
    ).rejects.toMatchObject({ status: 409, code: "ROL_SISTEMA_INMUTABLE" });
  });

  test("sí se pueden editar descripción y permisos", async () => {
    const obrero = estado.roles.find((rol) => rol.nombre === "Obrero");

    const actualizado = await actualizarRol({
      obraId: OBRA_ID,
      rolId: obrero.id,
      cambios: {
        descripcion: "Actualizado",
        permisos: { bot: { "tarea.crear": true }, web: { "stock.ver": true } },
      },
    });

    expect(actualizado.descripcion).toBe("Actualizado");
    expect(actualizado.nivel).toBe(10);
    expect(actualizado.es_sistema).toBe(true);
    expect(actualizado.permisos.bot["tarea.crear"]).toBe(true);
    expect(actualizado.permisos.bot["stock.registrar"]).toBe(false);
    expect(actualizado.permisos.web["stock.ver"]).toBe(true);
  });

  test("Director conserva roles.administrar y equipo.administrar aunque se pidan en false", async () => {
    const director = estado.roles.find((rol) => rol.nombre === "Director");

    const actualizado = await actualizarRol({
      obraId: OBRA_ID,
      rolId: director.id,
      cambios: {
        permisos: {
          web: { "roles.administrar": false, "equipo.administrar": false, "dashboard.ver": false },
        },
      },
    });

    expect(actualizado.permisos.web["roles.administrar"]).toBe(true);
    expect(actualizado.permisos.web["equipo.administrar"]).toBe(true);
    expect(actualizado.permisos.web["dashboard.ver"]).toBe(false);
  });

  // ── Regresión BUG-001 (QA épico roles/permisos) ──────────────────────────
  // Un PATCH con el mismo nombre en otra caja ("capataz") no puede renombrar un
  // rol de sistema: la spec dice que no se renombran y, en Director, un rename
  // dejaba de aplicar el candado anti-lockout (la obra quedaba sin administrador).
  test("un PATCH de nombre en un rol de sistema se rechaza (409) y no lo renombra", async () => {
    const capataz = estado.roles.find((rol) => rol.nombre === "Capataz");

    await expect(
      actualizarRol({
        obraId: OBRA_ID,
        rolId: capataz.id,
        cambios: { nombre: "capataz" },
      })
    ).rejects.toMatchObject({ status: 409, code: "ROL_SISTEMA_INMUTABLE" });

    expect(estado.roles.find((rol) => rol.id === capataz.id).nombre).toBe("Capataz");
  });

  test("el candado del Director sobrevive a un intento de rename de caja", async () => {
    const director = estado.roles.find((rol) => rol.nombre === "Director");

    await expect(
      actualizarRol({ obraId: OBRA_ID, rolId: director.id, cambios: { nombre: "director" } })
    ).rejects.toMatchObject({ status: 409, code: "ROL_SISTEMA_INMUTABLE" });

    const actualizado = await actualizarRol({
      obraId: OBRA_ID,
      rolId: director.id,
      cambios: { permisos: { web: { "roles.administrar": false, "equipo.administrar": false } } },
    });

    expect(actualizado.nombre).toBe("Director");
    expect(actualizado.permisos.web["roles.administrar"]).toBe(true);
    expect(actualizado.permisos.web["equipo.administrar"]).toBe(true);
  });

  test("PATCH parcial: cambiar solo una superficie no borra la otra", async () => {
    const capataz = estado.roles.find((rol) => rol.nombre === "Capataz");

    const soloWeb = await actualizarRol({
      obraId: OBRA_ID,
      rolId: capataz.id,
      cambios: { permisos: { web: { "dashboard.ver": false } } },
    });
    // La matriz bot del Capataz queda intacta.
    expect(soloWeb.permisos.bot["pedido.crear"]).toBe(true);
    expect(soloWeb.permisos.bot["stock.ajustar"]).toBe(true);
    expect(soloWeb.permisos.web["dashboard.ver"]).toBe(false);

    const soloBot = await actualizarRol({
      obraId: OBRA_ID,
      rolId: capataz.id,
      cambios: { permisos: { bot: { "pedido.entregar": false } } },
    });
    // La superficie web editada en el paso anterior se conserva; la bot se
    // reemplaza por el mapa enviado (las claves ausentes quedan en false).
    expect(soloBot.permisos.web["dashboard.ver"]).toBe(false);
    expect(soloBot.permisos.bot["pedido.entregar"]).toBe(false);
    expect(soloBot.permisos.bot["pedido.crear"]).toBe(false);
  });

  test("404 si el rol no existe o es de otra obra", async () => {
    await expect(
      actualizarRol({ obraId: OBRA_ID, rolId: "no-existe", cambios: { descripcion: "x" } })
    ).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });

    const capataz = estado.roles.find((rol) => rol.nombre === "Capataz");
    await expect(
      actualizarRol({ obraId: OTRA_OBRA_ID, rolId: capataz.id, cambios: { descripcion: "x" } })
    ).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("actualizarRol — roles personalizados", () => {
  test("renombrar arrastra miembros e invitaciones pendientes en la misma operación", async () => {
    const custom = await crearRol({ obraId: OBRA_ID, nombre: "Paisajista" });
    estado.miembros.push(
      { persona_id: PERSONA_ID, obra_id: OBRA_ID, rol: "Paisajista" },
      { persona_id: "otra", obra_id: OBRA_ID, rol: "Obrero" }
    );
    estado.invitaciones.push(
      { obra_id: OBRA_ID, rol: "Paisajista", usada_at: null },
      { obra_id: OBRA_ID, rol: "Paisajista", usada_at: "2026-11-01T00:00:00.000Z" },
      { obra_id: OTRA_OBRA_ID, rol: "Paisajista", usada_at: null }
    );

    const actualizado = await actualizarRol({
      obraId: OBRA_ID,
      rolId: custom.id,
      cambios: { nombre: "Jardinero" },
    });

    expect(actualizado.nombre).toBe("Jardinero");
    expect(estado.miembros.find((m) => m.rol === "Jardinero")).toBeTruthy();
    expect(estado.miembros.filter((m) => m.obra_id === OBRA_ID && m.rol === "Paisajista").length).toBe(0);
    expect(estado.invitaciones.filter((i) => i.rol === "Jardinero" && i.usada_at === null).length).toBe(1);
    // La invitación ya usada y la de otra obra no se tocan.
    expect(estado.invitaciones.filter((i) => i.rol === "Paisajista").length).toBe(2);
  });

  test("renombrar a un nombre existente devuelve 409", async () => {
    const custom = await crearRol({ obraId: OBRA_ID, nombre: "Paisajista" });

    await expect(
      actualizarRol({ obraId: OBRA_ID, rolId: custom.id, cambios: { nombre: "Capataz" } })
    ).rejects.toMatchObject({ status: 409, code: "ROL_DUPLICADO" });
  });

  test("permite cambiar el nivel de un rol personalizado", async () => {
    const custom = await crearRol({ obraId: OBRA_ID, nombre: "Paisajista", nivel: 20 });
    const actualizado = await actualizarRol({
      obraId: OBRA_ID,
      rolId: custom.id,
      cambios: { nivel: 45 },
    });
    expect(actualizado.nivel).toBe(45);
  });

  test("ignora es_sistema en el payload: no se puede convertir en rol de sistema", async () => {
    const custom = await crearRol({ obraId: OBRA_ID, nombre: "Paisajista" });
    const actualizado = await actualizarRol({
      obraId: OBRA_ID,
      rolId: custom.id,
      cambios: { es_sistema: true, descripcion: "sigue siendo custom" },
    });
    expect(actualizado.es_sistema).toBe(false);
  });
});

// --- eliminar --------------------------------------------------------------

describe("eliminarRol", () => {
  test("los roles de sistema no se pueden borrar (409)", async () => {
    const capataz = estado.roles.find((rol) => rol.nombre === "Capataz");

    await expect(
      eliminarRol({ obraId: OBRA_ID, rolId: capataz.id })
    ).rejects.toMatchObject({ status: 409, code: "ROL_SISTEMA" });
    expect(estado.deletes.length).toBe(0);
  });

  test("un rol con miembros en la obra no se puede borrar (409 con el conteo)", async () => {
    const custom = await crearRol({ obraId: OBRA_ID, nombre: "Paisajista" });
    estado.miembros.push({ persona_id: PERSONA_ID, obra_id: OBRA_ID, rol: "Paisajista" });

    await expect(
      eliminarRol({ obraId: OBRA_ID, rolId: custom.id })
    ).rejects.toMatchObject({ status: 409, code: "ROL_EN_USO" });
    expect(estado.deletes.length).toBe(0);
  });

  test("un rol con invitaciones pendientes no se puede borrar (409)", async () => {
    const custom = await crearRol({ obraId: OBRA_ID, nombre: "Paisajista" });
    estado.invitaciones.push({ obra_id: OBRA_ID, rol: "Paisajista", usada_at: null });

    await expect(
      eliminarRol({ obraId: OBRA_ID, rolId: custom.id })
    ).rejects.toMatchObject({ status: 409, code: "ROL_EN_USO" });
  });

  test("un rol personalizado sin uso se borra", async () => {
    const custom = await crearRol({ obraId: OBRA_ID, nombre: "Paisajista" });
    // Una invitación usada no bloquea el borrado.
    estado.invitaciones.push({
      obra_id: OBRA_ID,
      rol: "Paisajista",
      usada_at: "2026-11-01T00:00:00.000Z",
    });

    const resultado = await eliminarRol({ obraId: OBRA_ID, rolId: custom.id });

    expect(resultado).toEqual({ id: custom.id, nombre: "Paisajista" });
    expect(estado.roles.some((rol) => rol.id === custom.id)).toBe(false);
  });

  test("404 si el rol no existe", async () => {
    await expect(
      eliminarRol({ obraId: OBRA_ID, rolId: "no-existe" })
    ).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

// --- resolución luego de un cambio de matriz -------------------------------

describe("cambios de matriz y resolución", () => {
  test("un rol personalizado resuelve por nombre exacto y usa sus permisos", async () => {
    await crearRol({
      obraId: OBRA_ID,
      nombre: "Paisajista",
      permisos: { bot: { "foto.subir": true }, web: { "galeria.ver": true } },
    });

    const rol = await resolverRol(OBRA_ID, "paisajista");
    expect(rol.nombre).toBe("Paisajista");
    expect(rol.permisos.bot["foto.subir"]).toBe(true);
    expect(rol.permisos.web["galeria.ver"]).toBe(true);
    expect(rol.permisos.web["roles.administrar"]).toBe(false);
  });

  test("si se revoca un permiso de un rol de sistema, la resolución lo refleja", async () => {
    const obrero = estado.roles.find((rol) => rol.nombre === "Obrero");
    await actualizarRol({
      obraId: OBRA_ID,
      rolId: obrero.id,
      cambios: { permisos: { bot: { "foto.subir": false, "tarea.crear": true } } },
    });

    const rol = await resolverRol(OBRA_ID, "Obrero");
    expect(rol.permisos.bot["foto.subir"]).toBe(false);
    expect(rol.permisos.bot["tarea.crear"]).toBe(true);
  });
});
