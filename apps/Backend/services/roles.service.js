// Roles por obra y permisos dinámicos.
//
// Fuente única de:
// - El catálogo de permisos de las dos superficies (bot / web).
// - Los seis roles de sistema con su matriz por defecto y su jerarquía (`nivel`).
// - La normalización de nombres de rol y el mapeo de los roles libres viejos.
// - El CRUD de `roles_obra` y la resolución de permisos efectivos.
//
// `permisos.service.js` re-exporta el catálogo y `normalizarRol` para no duplicar
// defaults (la matriz estática del bot se deriva de ROLES_SISTEMA).
//
// Si la migración `outputs/migracion_roles_permisos.sql` todavía no se aplicó, las
// lecturas caen a ROLES_SISTEMA (id null) y `sembrarRoles` no hace nada: el código
// nuevo puede deployarse antes de correr la migración.

import { pool } from "../db.js";

// ─────────────────────────────────────────────────────────────
// Catálogo de permisos
// ─────────────────────────────────────────────────────────────

// `label` es el texto legible (los 10 del bot se usan en el mensaje de bloqueo de
// operaciones; por eso mantienen el estilo en infinitivo). `grupo` agrupa toggles
// en la UI de Configuración → Roles y permisos.
export const CATALOGO_PERMISOS = {
  bot: [
    { key: "stock.registrar", label: "registrar movimientos de stock", grupo: "Stock" },
    { key: "stock.ajustar", label: "ajustar stock", grupo: "Stock" },
    { key: "gasto.crear", label: "cargar gastos", grupo: "Gastos" },
    { key: "pedido.crear", label: "crear pedidos de compra", grupo: "Pedidos" },
    { key: "pedido.entregar", label: "marcar pedidos como entregados", grupo: "Pedidos" },
    { key: "tarea.crear", label: "reportar tareas", grupo: "Tareas" },
    { key: "tarea.completar", label: "completar tareas", grupo: "Tareas" },
    { key: "retraso.registrar", label: "registrar retrasos", grupo: "Retrasos" },
    { key: "alerta.crear", label: "generar alertas", grupo: "Alertas" },
    { key: "foto.subir", label: "subir fotos a la galería", grupo: "Galería" },
  ],
  web: [
    { key: "dashboard.ver", label: "ver el dashboard", grupo: "General" },
    { key: "bandeja.ver", label: "ver la bandeja de operaciones", grupo: "Bandeja" },
    { key: "bandeja.aprobar", label: "aprobar operaciones", grupo: "Bandeja" },
    { key: "equipo.ver", label: "ver el equipo", grupo: "Equipo" },
    { key: "equipo.administrar", label: "administrar el equipo", grupo: "Equipo" },
    { key: "configuracion.ver", label: "ver configuración", grupo: "Configuración" },
    { key: "configuracion.editar", label: "editar configuración", grupo: "Configuración" },
    { key: "roles.administrar", label: "administrar roles y permisos", grupo: "Configuración" },
    { key: "cronograma.ver", label: "ver el cronograma", grupo: "Cronograma" },
    { key: "cronograma.editar", label: "editar el cronograma", grupo: "Cronograma" },
    { key: "actividad.ver", label: "ver la actividad", grupo: "Actividad" },
    { key: "actividad.registrar", label: "registrar actividad", grupo: "Actividad" },
    { key: "galeria.ver", label: "ver la galería", grupo: "Galería" },
    { key: "galeria.gestionar", label: "gestionar la galería", grupo: "Galería" },
    { key: "reportes.ver", label: "ver reportes", grupo: "Reportes" },
    { key: "reportes.exportar", label: "exportar reportes", grupo: "Reportes" },
    { key: "pedidos.ver", label: "ver pedidos", grupo: "Pedidos" },
    { key: "pedidos.crear", label: "crear pedidos", grupo: "Pedidos" },
    { key: "pedidos.aprobar", label: "aprobar pedidos", grupo: "Pedidos" },
    { key: "pedidos.entregar", label: "entregar pedidos", grupo: "Pedidos" },
    { key: "stock.ver", label: "ver materiales y stock", grupo: "Stock" },
    { key: "stock.ajustar", label: "ajustar stock y materiales", grupo: "Stock" },
    { key: "proveedores.ver", label: "ver proveedores", grupo: "Proveedores" },
    { key: "proveedores.gestionar", label: "gestionar proveedores", grupo: "Proveedores" },
    { key: "presupuesto.ver", label: "ver presupuesto y costos", grupo: "Presupuesto" },
    { key: "presupuesto.editar", label: "editar presupuesto", grupo: "Presupuesto" },
    { key: "recibos.ver", label: "ver recibos y comprobantes", grupo: "Recibos" },
    { key: "recibos.gestionar", label: "gestionar recibos y comprobantes", grupo: "Recibos" },
    { key: "alertas.ver", label: "ver alertas", grupo: "Alertas" },
    { key: "alertas.gestionar", label: "gestionar alertas", grupo: "Alertas" },
  ],
};

const SUPERFICIES = ["bot", "web"];

// Matriz completa (true/false) de una superficie a partir de las claves habilitadas.
// Un typo en una clave revienta al importar el módulo, no se pierde en silencio.
function matriz(superficie, habilitados) {
  const catalogo = new Set(CATALOGO_PERMISOS[superficie].map((permiso) => permiso.key));
  for (const clave of habilitados) {
    if (!catalogo.has(clave)) {
      throw new Error(`Permiso desconocido en ROLES_SISTEMA (${superficie}): ${clave}`);
    }
  }
  const permisos = {};
  for (const clave of catalogo) permisos[clave] = habilitados.includes(clave);
  return permisos;
}

// ─────────────────────────────────────────────────────────────
// Roles de sistema
// ─────────────────────────────────────────────────────────────

// Orden ascendente por nivel (Cliente → Director), igual que la spec.
// El JSON de la migración se genera desde acá: si se toca una matriz, hay que
// regenerar el backfill de outputs/migracion_roles_permisos.sql.
export const ROLES_SISTEMA = [
  {
    nombre: "Cliente",
    descripcion: "Lectura del avance: dashboard, cronograma, actividad, galería y reportes. Sin costos ni operación.",
    nivel: 5,
    es_sistema: true,
    permisos: {
      bot: matriz("bot", []),
      web: matriz("web", [
        "dashboard.ver",
        "equipo.ver",
        "cronograma.ver",
        "actividad.ver",
        "galeria.ver",
        "reportes.ver",
      ]),
    },
  },
  {
    nombre: "Obrero",
    descripcion: "Reporta el día a día desde WhatsApp y consulta stock/actividad/galería desde la web.",
    nivel: 10,
    es_sistema: true,
    permisos: {
      bot: matriz("bot", [
        "stock.registrar",
        "gasto.crear",
        "tarea.crear",
        "tarea.completar",
        "retraso.registrar",
        "alerta.crear",
        "foto.subir",
      ]),
      web: matriz("web", [
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
      ]),
    },
  },
  {
    nombre: "Seguridad e Higiene",
    descripcion: "Alertas, fotos, retrasos y reportes de seguridad. Sin compras ni costos.",
    nivel: 25,
    es_sistema: true,
    permisos: {
      bot: matriz("bot", ["tarea.crear", "retraso.registrar", "alerta.crear", "foto.subir"]),
      web: matriz("web", [
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
      ]),
    },
  },
  {
    nombre: "Capataz",
    descripcion: "Operación de campo y supervisión: pedidos, stock, tareas, bandeja. Sin presupuesto/export/equipo.",
    nivel: 30,
    es_sistema: true,
    permisos: {
      bot: matriz("bot", [
        "stock.registrar",
        "stock.ajustar",
        "gasto.crear",
        "pedido.crear",
        "pedido.entregar",
        "tarea.crear",
        "tarea.completar",
        "retraso.registrar",
        "alerta.crear",
        "foto.subir",
      ]),
      web: matriz("web", [
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
      ]),
    },
  },
  {
    nombre: "Administrativo",
    descripcion: "Oficina: compras, proveedores, stock, comprobantes, presupuesto (solo lectura) y exportación.",
    nivel: 60,
    es_sistema: true,
    permisos: {
      bot: matriz("bot", ["stock.ajustar", "gasto.crear", "pedido.crear", "foto.subir"]),
      web: matriz("web", [
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
      ]),
    },
  },
  {
    nombre: "Director",
    descripcion: "Todo, incluida la administración de equipo y roles.",
    nivel: 100,
    es_sistema: true,
    permisos: {
      bot: matriz("bot", CATALOGO_PERMISOS.bot.map((permiso) => permiso.key)),
      web: matriz("web", CATALOGO_PERMISOS.web.map((permiso) => permiso.key)),
    },
  },
];

const ROL_MINIMO = "Obrero";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorHttp(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function clonarPermisos(permisos) {
  return {
    bot: { ...permisos.bot },
    web: { ...permisos.web },
  };
}

// Fila sintética (id null) para cuando la tabla no existe o la obra no tiene el rol.
function rolSistemaSintetico(nombre) {
  const buscado = normalizarNombreRol(nombre).toLowerCase();
  const definicion = ROLES_SISTEMA.find((rol) => rol.nombre.toLowerCase() === buscado)
    || ROLES_SISTEMA.find((rol) => rol.nombre === ROL_MINIMO);
  return {
    id: null,
    obra_id: null,
    nombre: definicion.nombre,
    descripcion: definicion.descripcion,
    nivel: definicion.nivel,
    es_sistema: true,
    permisos: clonarPermisos(definicion.permisos),
    created_at: null,
    updated_at: null,
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers puros
// ─────────────────────────────────────────────────────────────

export function permisosVacios() {
  return normalizarPermisos(null);
}

// Devuelve siempre { bot: {...}, web: {...} } con TODAS las claves del catálogo.
// Lo que no venga (o no sea exactamente true) queda en false; las claves
// desconocidas se descartan.
export function normalizarPermisos(permisos) {
  const entrada = permisos && typeof permisos === "object" ? permisos : {};
  const salida = {};
  for (const superficie of SUPERFICIES) {
    const origen = entrada[superficie] && typeof entrada[superficie] === "object"
      ? entrada[superficie]
      : {};
    const mapa = {};
    for (const { key } of CATALOGO_PERMISOS[superficie]) {
      mapa[key] = origen[key] === true;
    }
    salida[superficie] = mapa;
  }
  return salida;
}

// Nombre canónico de un rol creado por el usuario: recorta y colapsa espacios.
export function normalizarNombreRol(nombre) {
  return String(nombre ?? "").replace(/\s+/g, " ").trim();
}

// 2..40 caracteres después de normalizar. Devuelve el mensaje de error o null.
export function validarNombreRol(nombre) {
  const limpio = normalizarNombreRol(nombre);
  if (limpio.length < 2) return "El nombre del rol debe tener al menos 2 caracteres";
  if (limpio.length > 40) return "El nombre del rol no puede superar los 40 caracteres";
  return null;
}

function validarNivel(nivel) {
  const numero = Number(nivel);
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    throw errorHttp(400, "VALIDATION_ERROR", "nivel debe ser un entero entre 1 y 100");
  }
  return numero;
}

export function permisosDeRolSistema(nombre) {
  const buscado = normalizarNombreRol(nombre).toLowerCase();
  const rol = ROLES_SISTEMA.find((definicion) => definicion.nombre.toLowerCase() === buscado);
  return rol ? normalizarPermisos(rol.permisos) : null;
}

// Jerarquía: se puede otorgar un rol de nivel menor o igual al propio.
// Fail closed: si falta el nivel de cualquiera de los dos, no se puede.
export function puedePorNivel(rolLlamante, rolObjetivo) {
  const propio = rolLlamante?.nivel;
  const destino = rolObjetivo?.nivel;
  // Nivel numérico y finito de los dos lados: un string, null o faltante es fail closed.
  if (typeof propio !== "number" || !Number.isFinite(propio)) return false;
  if (typeof destino !== "number" || !Number.isFinite(destino)) return false;
  return destino <= propio;
}

// ─────────────────────────────────────────────────────────────
// Mapeo de roles libres viejos → roles de sistema
// ─────────────────────────────────────────────────────────────

function sinAcentos(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Mapea el rol libre que hoy se carga desde la web (invitaciones, equipo) y los
// valores viejos ("Director de obra", "Compras", "Seguridad e higiene", etc.) a uno
// de los seis roles de sistema. Lo desconocido cae en Obrero (mínimo privilegio).
// El catálogo de roles de cada obra es la primera fuente: esto es solo el fallback.
export function normalizarRol(rol) {
  const texto = sinAcentos(rol);
  if (!texto) return "Obrero";
  // "Cliente" ya no puede caer en Director: se chequea antes que todo.
  if (/client/.test(texto)) return "Cliente";
  if (/(seguridad|higiene|\bsst\b|\bhse\b)/.test(texto)) return "Seguridad e Higiene";
  if (/(administrativ|administracion|compras|oficina|contable|tesorer)/.test(texto)) {
    return "Administrativo";
  }
  if (/(capataz|jefe|supervisor|encargado)/.test(texto)) return "Capataz";
  if (/(director|duen|gerente|arquitect|ingenier|socio|propietari)/.test(texto)) {
    return "Director";
  }
  return "Obrero";
}

// ─────────────────────────────────────────────────────────────
// Seed / lectura contra la DB
// ─────────────────────────────────────────────────────────────

// Inserta los seis roles de sistema de una obra. Idempotente (ON CONFLICT DO NOTHING).
// Acepta un client en transacción (crearObra) o el pool. Si la tabla no existe,
// devuelve 0 sin abortar la transacción (pre-chequeo con to_regclass, que no lanza).
export async function sembrarRoles(client, obraId) {
  if (!client || !obraId) return 0;
  try {
    const tabla = await client.query(`SELECT to_regclass('public.roles_obra') AS tabla`);
    if (!tabla.rows[0]?.tabla) return 0;

    let insertados = 0;
    for (const rol of ROLES_SISTEMA) {
      const { rowCount } = await client.query(
        `INSERT INTO roles_obra (obra_id, nombre, descripcion, nivel, es_sistema, permisos)
         VALUES ($1, $2, $3, $4, true, $5::jsonb)
         ON CONFLICT (obra_id, lower(nombre)) DO NOTHING`,
        [obraId, rol.nombre, rol.descripcion, rol.nivel, JSON.stringify(rol.permisos)]
      );
      insertados += rowCount ?? 0;
    }
    return insertados;
  } catch (error) {
    if (error.code === "42P01") return 0; // migración pendiente: no rompe el alta
    throw error;
  }
}

// Roles de la obra (sistema + personalizados). Si la tabla no existe, devuelve los
// seis de sistema como filas sintéticas para que la UI pueda mostrarlos.
export async function listarRoles(obraId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM roles_obra WHERE obra_id = $1 ORDER BY nivel ASC, nombre ASC`,
      [obraId]
    );
    return rows;
  } catch (error) {
    if (error.code !== "42P01") throw error;
    return ROLES_SISTEMA
      .map((rol) => ({ ...rolSistemaSintetico(rol.nombre), obra_id: obraId }))
      .sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre));
  }
}

// Rol por id (uuid) o por nombre (case-insensitive) dentro de la obra.
// null si no existe. Con la tabla sin migrar resuelve solo roles de sistema.
export async function obtenerRol(obraId, rolIdOrNombre) {
  if (!obraId || rolIdOrNombre === undefined || rolIdOrNombre === null) return null;
  const valor = String(rolIdOrNombre).trim();
  if (!valor) return null;
  const esId = UUID_RE.test(valor);

  try {
    const { rows } = esId
      ? await pool.query(
        `SELECT * FROM roles_obra WHERE obra_id = $1 AND id = $2 LIMIT 1`,
        [obraId, valor]
      )
      : await pool.query(
        `SELECT * FROM roles_obra WHERE obra_id = $1 AND lower(nombre) = lower($2) LIMIT 1`,
        [obraId, normalizarNombreRol(valor)]
      );
    return rows[0] || null;
  } catch (error) {
    if (error.code !== "42P01") throw error;
    if (esId) return null;
    const permisos = permisosDeRolSistema(valor);
    if (!permisos) return null;
    return { ...rolSistemaSintetico(valor), obra_id: obraId };
  }
}

// Resuelve el rol de un miembro (o el que manda un formulario) contra la obra:
// 1. nombre exacto en roles_obra (case-insensitive, incluye roles personalizados);
// 2. normalizarRol legacy → rol de sistema equivalente;
// 3. Obrero (mínimo privilegio).
// Si la tabla no existe, devuelve el rol de sistema sintético (id null).
export async function resolverRol(obraId, rolRaw) {
  const legado = normalizarRol(rolRaw);
  if (!obraId) return rolSistemaSintetico(legado);

  const buscado = normalizarNombreRol(rolRaw);
  const candidatos = [];
  if (buscado) candidatos.push(buscado);
  if (!candidatos.some((nombre) => nombre.toLowerCase() === legado.toLowerCase())) {
    candidatos.push(legado);
  }
  if (!candidatos.some((nombre) => nombre.toLowerCase() === ROL_MINIMO.toLowerCase())) {
    candidatos.push(ROL_MINIMO);
  }

  try {
    for (const nombre of candidatos) {
      const { rows } = await pool.query(
        `SELECT * FROM roles_obra WHERE obra_id = $1 AND lower(nombre) = lower($2) LIMIT 1`,
        [obraId, nombre]
      );
      if (rows[0]) return rows[0];
    }
    // La tabla existe pero la obra no tiene roles cargados (o no tiene el rol
    // mínimo): fallback a la matriz estática del rol normalizado. `normalizarRol`
    // ya dejó lo desconocido en Obrero, así que sigue siendo mínimo privilegio.
    return rolSistemaSintetico(legado);
  } catch (error) {
    if (error.code !== "42P01") throw error;
    return rolSistemaSintetico(legado);
  }
}

// Permisos efectivos de un rol: { rol, bot: {...}, web: {...} } con mapas completos.
export async function permisosEfectivos(obraId, rolRaw) {
  const rol = await resolverRol(obraId, rolRaw);
  const permisos = normalizarPermisos(rol.permisos);
  return { rol, bot: permisos.bot, web: permisos.web };
}

// Perfil de una persona en la obra: { rol, permisos: { bot, web } } o null si no
// es miembro. Es la entrada que usan los gates de la web y de la bandeja.
export async function perfilEnObra(personaId, obraId) {
  if (!personaId || !obraId) return null;
  const { rows } = await pool.query(
    `SELECT rol FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2 LIMIT 1`,
    [personaId, obraId]
  );
  if (!rows[0]) return null;
  const rol = await resolverRol(obraId, rows[0].rol);
  return { rol, permisos: normalizarPermisos(rol.permisos) };
}

// ¿El rol tiene `permiso` en `superficie` para esa obra? Fail closed.
export async function puedeEnObra(obraId, rolRaw, superficie, permiso) {
  if (!permiso || !SUPERFICIES.includes(superficie)) return false;
  const efectivos = await permisosEfectivos(obraId, rolRaw);
  return efectivos[superficie]?.[permiso] === true;
}

// ─────────────────────────────────────────────────────────────
// CRUD de roles
// ─────────────────────────────────────────────────────────────

export async function crearRol({ obraId, nombre, descripcion, nivel, permisos }) {
  if (!obraId) throw errorHttp(400, "VALIDATION_ERROR", "obra_id es requerido");

  const nombreCanonico = normalizarNombreRol(nombre);
  const errorNombre = validarNombreRol(nombreCanonico);
  if (errorNombre) throw errorHttp(400, "VALIDATION_ERROR", errorNombre);

  const nivelCanonico = nivel === undefined || nivel === null ? 10 : validarNivel(nivel);
  const permisosCanonicos = normalizarPermisos(permisos);
  const descripcionCanonica = String(descripcion ?? "").trim();

  try {
    const existente = await pool.query(
      `SELECT id FROM roles_obra WHERE obra_id = $1 AND lower(nombre) = lower($2)`,
      [obraId, nombreCanonico]
    );
    if (existente.rows[0]) {
      throw errorHttp(409, "ROL_DUPLICADO", `Ya existe un rol "${nombreCanonico}" en esta obra`);
    }

    const { rows } = await pool.query(
      `INSERT INTO roles_obra (obra_id, nombre, descripcion, nivel, es_sistema, permisos)
       VALUES ($1, $2, $3, $4, false, $5::jsonb)
       RETURNING *`,
      [obraId, nombreCanonico, descripcionCanonica, nivelCanonico, JSON.stringify(permisosCanonicos)]
    );
    return rows[0];
  } catch (error) {
    if (error.code === "42P01") {
      throw errorHttp(503, "MIGRACION_PENDIENTE", "Falta aplicar migracion_roles_permisos.sql");
    }
    if (error.code === "23505") {
      throw errorHttp(409, "ROL_DUPLICADO", `Ya existe un rol "${nombreCanonico}" en esta obra`);
    }
    throw error;
  }
}

export async function actualizarRol({ obraId, rolId, cambios }) {
  const actual = await obtenerRol(obraId, rolId);
  if (!actual) throw errorHttp(404, "NOT_FOUND", "Rol no encontrado");
  if (!actual.id) {
    throw errorHttp(503, "MIGRACION_PENDIENTE", "Falta aplicar migracion_roles_permisos.sql");
  }

  const entrada = cambios && typeof cambios === "object" ? cambios : {};
  const nombrePedido = entrada.nombre === undefined ? actual.nombre : normalizarNombreRol(entrada.nombre);
  const cambiaNombre = nombrePedido.toLowerCase() !== actual.nombre.toLowerCase();
  const nivelPedido = entrada.nivel === undefined ? Number(actual.nivel) : validarNivel(entrada.nivel);
  const cambiaNivel = nivelPedido !== Number(actual.nivel);

  // Los roles de sistema no se renombran NUNCA, ni siquiera con la misma caja
  // ("Director" → "director"). Aceptar ese PATCH los dejaba con un nombre que no
  // coincide con el candado anti-lockout de más abajo y podía dejar la obra sin
  // administrador de roles.
  if (actual.es_sistema && entrada.nombre !== undefined) {
    throw errorHttp(
      409,
      "ROL_SISTEMA_INMUTABLE",
      "Los roles de sistema no se pueden renombrar ni cambiar de nivel"
    );
  }
  if (actual.es_sistema && cambiaNivel) {
    throw errorHttp(
      409,
      "ROL_SISTEMA_INMUTABLE",
      "Los roles de sistema no se pueden renombrar ni cambiar de nivel"
    );
  }

  if (!actual.es_sistema && entrada.nombre !== undefined) {
    const errorNombre = validarNombreRol(nombrePedido);
    if (errorNombre) throw errorHttp(400, "VALIDATION_ERROR", errorNombre);
  }

  // Si no hay rename real, se conserva el nombre tal cual está en la fila: evita
  // que un PATCH con otra caja ("capataz") escriba un nombre distinto sin cascada.
  const nombreFinal = cambiaNombre ? nombrePedido : actual.nombre;

  const permisosActuales = normalizarPermisos(actual.permisos);
  let permisos = permisosActuales;
  if (entrada.permisos !== undefined) {
    // PATCH parcial: si el payload trae una sola superficie (bot o web), la otra
    // conserva la matriz actual. Sin esto, mandar solo `web` borraría todo `bot`.
    const normalizados = normalizarPermisos(entrada.permisos);
    const entradaEsObjeto = entrada.permisos && typeof entrada.permisos === "object";
    permisos = {
      bot: entradaEsObjeto && entrada.permisos.bot !== undefined ? normalizados.bot : permisosActuales.bot,
      web: entradaEsObjeto && entrada.permisos.web !== undefined ? normalizados.web : permisosActuales.web,
    };
  }

  // Candado anti-lockout: el Director de sistema siempre conserva la
  // administración de roles y de equipo, aunque se editen sus permisos. Se
  // reconoce por nombre canónico o por nivel 100 (si la fila viene de una base
  // vieja con otra caja), nunca por una comparación frágil de texto.
  if (actual.es_sistema && (actual.nombre === "Director" || Number(actual.nivel) === 100)) {
    permisos.web["roles.administrar"] = true;
    permisos.web["equipo.administrar"] = true;
  }

  const descripcion = entrada.descripcion === undefined
    ? (actual.descripcion ?? "")
    : String(entrada.descripcion ?? "").trim();

  // Si el rol personalizado cambia de nombre, los miembros e invitaciones
  // pendientes guardan el nombre viejo: se renombran en la misma transacción.
  let hayInvitaciones = false;
  if (cambiaNombre) {
    const tabla = await pool.query(`SELECT to_regclass('public.invitaciones') AS tabla`);
    hayInvitaciones = Boolean(tabla.rows[0]?.tabla);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (cambiaNombre) {
      const duplicado = await client.query(
        `SELECT id FROM roles_obra WHERE obra_id = $1 AND lower(nombre) = lower($2) AND id <> $3`,
        [obraId, nombrePedido, actual.id]
      );
      if (duplicado.rows[0]) {
        throw errorHttp(409, "ROL_DUPLICADO", `Ya existe un rol "${nombrePedido}" en esta obra`);
      }
    }

    const { rows } = await client.query(
      `UPDATE roles_obra
       SET nombre = $3, descripcion = $4, nivel = $5, permisos = $6::jsonb, updated_at = now()
       WHERE id = $1 AND obra_id = $2
       RETURNING *`,
      [actual.id, obraId, nombreFinal, descripcion, nivelPedido, JSON.stringify(permisos)]
    );
    if (!rows[0]) throw errorHttp(404, "NOT_FOUND", "Rol no encontrado");

    if (cambiaNombre) {
      await client.query(
        `UPDATE miembros_obra SET rol = $3
         WHERE obra_id = $1 AND lower(rol) = lower($2)`,
        [obraId, actual.nombre, nombreFinal]
      );
      if (hayInvitaciones) {
        await client.query(
          `UPDATE invitaciones SET rol = $3
           WHERE obra_id = $1 AND usada_at IS NULL AND lower(rol) = lower($2)`,
          [obraId, actual.nombre, nombreFinal]
        );
      }
    }

    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error.code === "23505") {
      throw errorHttp(409, "ROL_DUPLICADO", `Ya existe un rol "${nombrePedido}" en esta obra`);
    }
    if (error.code === "42P01") {
      throw errorHttp(503, "MIGRACION_PENDIENTE", "Falta aplicar migracion_roles_permisos.sql");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function eliminarRol({ obraId, rolId }) {
  const rol = await obtenerRol(obraId, rolId);
  if (!rol) throw errorHttp(404, "NOT_FOUND", "Rol no encontrado");
  if (!rol.id) {
    throw errorHttp(503, "MIGRACION_PENDIENTE", "Falta aplicar migracion_roles_permisos.sql");
  }
  if (rol.es_sistema) {
    throw errorHttp(409, "ROL_SISTEMA", "Los roles de sistema no se pueden eliminar");
  }

  const miembros = await pool.query(
    `SELECT COUNT(*)::int AS total FROM miembros_obra WHERE obra_id = $1 AND lower(rol) = lower($2)`,
    [obraId, rol.nombre]
  );
  const asignados = miembros.rows[0]?.total ?? 0;
  if (asignados > 0) {
    throw errorHttp(
      409,
      "ROL_EN_USO",
      `El rol tiene ${asignados} miembro(s) en la obra: reasignalos antes de eliminarlo`
    );
  }

  const tablaInvitaciones = await pool.query(`SELECT to_regclass('public.invitaciones') AS tabla`);
  if (tablaInvitaciones.rows[0]?.tabla) {
    const invitaciones = await pool.query(
      `SELECT COUNT(*)::int AS total FROM invitaciones
       WHERE obra_id = $1 AND usada_at IS NULL AND lower(rol) = lower($2)`,
      [obraId, rol.nombre]
    );
    const pendientes = invitaciones.rows[0]?.total ?? 0;
    if (pendientes > 0) {
      throw errorHttp(
        409,
        "ROL_EN_USO",
        `El rol tiene ${pendientes} invitación(es) pendiente(s): esperá a que se usen o venzan`
      );
    }
  }

  await pool.query(`DELETE FROM roles_obra WHERE id = $1 AND obra_id = $2`, [rol.id, obraId]);
  return { id: rol.id, nombre: rol.nombre };
}

// ─────────────────────────────────────────────────────────────
// Serialización para la API
// ─────────────────────────────────────────────────────────────

export function serializarRol(rol) {
  if (!rol) return null;
  return {
    id: rol.id ?? null,
    nombre: rol.nombre,
    descripcion: rol.descripcion ?? "",
    nivel: Number(rol.nivel) || 0,
    es_sistema: rol.es_sistema === true,
    permisos: normalizarPermisos(rol.permisos),
  };
}

// Shape de GET /obras/:obraId/mi-rol (y del campo miRol de GET /obras/:obraId).
export function serializarMiRol(perfil) {
  if (!perfil?.rol) return null;
  const permisos = normalizarPermisos(perfil.rol.permisos);
  const claves = (mapa) => Object.keys(mapa).filter((clave) => mapa[clave] === true);
  return {
    rol: {
      id: perfil.rol.id ?? null,
      nombre: perfil.rol.nombre,
      nivel: Number(perfil.rol.nivel) || 0,
      es_sistema: perfil.rol.es_sistema === true,
    },
    permisos: {
      bot: claves(permisos.bot),
      web: claves(permisos.web),
      botMap: permisos.bot,
      webMap: permisos.web,
    },
  };
}
