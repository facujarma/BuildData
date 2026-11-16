// Identidad de personas: una sola fila por humano, sin importar el canal.
//
// El bot resuelve a la persona por `personas.telefono`; la web por
// `personas.auth_user_id`. Cuando el mismo humano se dio de alta por los dos
// caminos quedan dos filas y el rol de `miembros_obra` se parte en dos. Este
// servicio centraliza:
//
// - La normalización de teléfonos (el 9 de celular argentino no debe impedir
//   el match) y de nombres (para la auditoría).
// - La auditoría de duplicados, con roles y conteo de referencias.
// - El merge transaccional: la persona del teléfono (destino) absorbe a la
//   persona web (origen). Primero se migran TODAS las FKs y las membresías;
//   recién al final se borra el origen.
// - El alta/vinculación: si el teléfono ya existe, se completa el auth_user_id
//   en esa fila en vez de crear otra persona.
//
// La lista de FKs es explícita (`REFERENCIAS_PERSONA`) y se contrasta contra
// `information_schema` antes de tocar nada: si aparece una tabla nueva que
// referencia personas/miembros_obra, el merge aborta en vez de perder datos.

import { pool } from "../db.js";
import { resolverRol } from "./roles.service.js";
import {
  enmascararTelefono,
  normalizarTelefonoPersona,
  variantesTelefono,
} from "./telefono.service.js";

export { enmascararTelefono, normalizarTelefonoPersona, variantesTelefono };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// FKs simples: UPDATE tabla SET columna = destino WHERE columna = origen.
// `proveedores_favoritos` queda afuera porque su PK es (persona_id, proveedor_id)
// y el merge necesita INSERT ... ON CONFLICT DO NOTHING antes del DELETE.
export const REFERENCIAS_PERSONA = [
  { tabla: "actividad", columna: "usuario_id" },
  { tabla: "alertas", columna: "usuario_id" },
  { tabla: "chat_consultas", columna: "persona_id" },
  { tabla: "fotos_obra", columna: "usuario_id" },
  { tabla: "gastos", columna: "usuario_id" },
  { tabla: "invitaciones", columna: "creada_por" },
  { tabla: "invitaciones", columna: "usada_por" },
  { tabla: "mensajes", columna: "usuario_id" },
  { tabla: "movimientos_stock", columna: "usuario_id" },
  { tabla: "operaciones_bot", columna: "usuario_id" },
  { tabla: "operaciones_bot", columna: "aprobada_por" },
  { tabla: "pedidos_materiales", columna: "solicitado_por" },
  { tabla: "pedidos_materiales", columna: "aprobado_por" },
  { tabla: "presupuesto_ajustes", columna: "usuario_id" },
  { tabla: "reportes", columna: "generado_por" },
  { tabla: "tareas", columna: "created_by" },
  { tabla: "tareas", columna: "usuario_id" },
];

// FKs que apuntan a miembros_obra (el id de la membresía, no el de la persona).
// El merge remapea estas columnas antes de borrar la membresía del origen.
export const REFERENCIAS_MIEMBROS_OBRA = [
  { tabla: "tareas", columna: "asignado_a" },
  { tabla: "tareas", columna: "completada_por" },
];

const REFERENCIAS_PERSONA_ESPECIALES = [
  { tabla: "proveedores_favoritos", columna: "persona_id" },
];

const REFERENCIAS_CONOCIDAS = new Set([
  ...REFERENCIAS_PERSONA.map((ref) => `public.${ref.tabla}.${ref.columna}`),
  ...REFERENCIAS_PERSONA_ESPECIALES.map((ref) => `public.${ref.tabla}.${ref.columna}`),
  "public.miembros_obra.persona_id",
  // FK de la tabla de auditoría (ON DELETE SET NULL). Si `ejecutado_por` era el
  // origen, el delete la deja en NULL; no hay datos que migrar.
  "public.personas_unificaciones.ejecutado_por",
]);

const REFERENCIAS_MIEMBROS_CONOCIDAS = new Set(
  REFERENCIAS_MIEMBROS_OBRA.map((ref) => `public.${ref.tabla}.${ref.columna}`)
);

export class PersonaError extends Error {
  constructor(code, message, detalle = null) {
    super(message);
    this.name = "PersonaError";
    this.code = code;
    this.detalle = detalle;
  }
}

export function esPersonaError(error) {
  return error instanceof PersonaError;
}

// ─────────────────────────────────────────────────────────────
// Normalización
// ─────────────────────────────────────────────────────────────

export function normalizarNombrePersona(nombre) {
  return String(nombre ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(v\.?\s*web|web)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function esUuid(valor) {
  return typeof valor === "string" && UUID_RE.test(valor);
}

function normalizarNombre(nombre) {
  const limpio = String(nombre ?? "").trim();
  return limpio || "Usuario";
}

// Datos de alta que ya vienen en el usuario de Supabase Auth: el teléfono puede
// estar en `phone` (auth por teléfono) o en la metadata que carga la web, y el
// nombre cae al local-part del email. Es el único lugar que decide ese mapeo:
// lo usan el alta web, el middleware y el alta de obra.
export function datosPersonaDesdeAuthUser(user) {
  const metadata =
    user?.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};
  const telefono = user?.phone || metadata.telefono || metadata.phone || null;
  const nombre =
    metadata.nombre ||
    metadata.full_name ||
    metadata.name ||
    (user?.email ? String(user.email).split("@")[0] : "") ||
    "Usuario";
  return {
    nombre: normalizarNombre(nombre),
    telefono: telefono ? String(telefono) : null,
  };
}

// ─────────────────────────────────────────────────────────────
// Búsqueda
// ─────────────────────────────────────────────────────────────

const CAMPOS_PERSONA = "id, auth_user_id, nombre, telefono, created_at";

export async function buscarPersonasPorTelefono(db, telefono) {
  const variantes = variantesTelefono(telefono);
  if (variantes.length === 0) return [];
  const { rows } = await db.query(
    `SELECT ${CAMPOS_PERSONA}
       FROM personas
      WHERE regexp_replace(COALESCE(telefono, ''), '\\D', '', 'g') = ANY($1::text[])
      ORDER BY created_at ASC`,
    [variantes]
  );
  return rows;
}

export async function buscarPersonaPorTelefono(db, telefono) {
  const filas = await buscarPersonasPorTelefono(db, telefono);
  if (filas.length > 1) {
    throw new PersonaError(
      "TELEFONO_AMBIGUO",
      "Hay más de una persona con ese teléfono; resolvé la duplicación antes de continuar",
      { personas: filas.map((fila) => fila.id) }
    );
  }
  return filas[0] ?? null;
}

export async function buscarPersonaPorAuthUserId(db, authUserId) {
  if (!esUuid(authUserId)) return null;
  const { rows } = await db.query(
    `SELECT ${CAMPOS_PERSONA} FROM personas WHERE auth_user_id = $1 LIMIT 1`,
    [authUserId]
  );
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────
// Roles por obra (custom de roles_obra + fallback a roles de sistema)
// ─────────────────────────────────────────────────────────────

async function resolverRolPersona(db, obraId, rolRaw) {
  const rol = await resolverRol(obraId, rolRaw, db);
  return { nombre: rol.nombre, nivel: Number(rol.nivel) };
}

function rolFinal(origen, destino) {
  if (!destino) return origen;
  if (!origen) return destino;
  // Gana el rol de mayor nivel: la persona es la misma en los dos canales y no
  // se le pueden quitar permisos que ya tenía en alguno de ellos.
  return destino.nivel >= origen.nivel ? destino : origen;
}

// ─────────────────────────────────────────────────────────────
// Auditoría de referencias
// ─────────────────────────────────────────────────────────────

export async function verificarReferenciasConocidas(db) {
  const { rows } = await db.query(
    `SELECT tc.table_schema, tc.table_name, kcu.column_name,
            ccu.table_name AS tabla_referida
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
       JOIN information_schema.referential_constraints rc
         ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_schema = 'public'
        AND ccu.table_name IN ('personas', 'miembros_obra')`
  );

  const desconocidas = rows.filter((fila) => {
    const clave = `${fila.table_schema}.${fila.table_name}.${fila.column_name}`;
    if (fila.tabla_referida === "personas") return !REFERENCIAS_CONOCIDAS.has(clave);
    if (fila.tabla_referida === "miembros_obra") return !REFERENCIAS_MIEMBROS_CONOCIDAS.has(clave);
    return true;
  });

  if (desconocidas.length > 0) {
    throw new PersonaError(
      "REFERENCIAS_DESCONOCIDAS",
      "Hay referencias a personas/miembros_obra que este merge no sabe migrar; abortado para no perder datos",
      desconocidas.map((fila) => `${fila.table_name}.${fila.column_name}`)
    );
  }
}

async function contarReferencias(db, origenId, origenMiembroIds) {
  const referencias = [];

  for (const ref of REFERENCIAS_PERSONA) {
    const { rows } = await db.query(
      `SELECT count(*)::int AS filas FROM ${ref.tabla} WHERE ${ref.columna} = $1`,
      [origenId]
    );
    referencias.push({ tabla: ref.tabla, columna: ref.columna, filas: rows[0]?.filas ?? 0 });
  }

  for (const ref of REFERENCIAS_PERSONA_ESPECIALES) {
    const { rows } = await db.query(
      `SELECT count(*)::int AS filas FROM ${ref.tabla} WHERE ${ref.columna} = $1`,
      [origenId]
    );
    referencias.push({ tabla: ref.tabla, columna: ref.columna, filas: rows[0]?.filas ?? 0 });
  }

  const { rows: miembros } = await db.query(
    `SELECT count(*)::int AS filas FROM miembros_obra WHERE persona_id = $1`,
    [origenId]
  );
  referencias.push({ tabla: "miembros_obra", columna: "persona_id", filas: miembros[0]?.filas ?? 0 });

  if (origenMiembroIds.length > 0) {
    for (const ref of REFERENCIAS_MIEMBROS_OBRA) {
      const { rows } = await db.query(
        `SELECT count(*)::int AS filas FROM ${ref.tabla} WHERE ${ref.columna} = ANY($1::uuid[])`,
        [origenMiembroIds]
      );
      referencias.push({
        tabla: ref.tabla,
        columna: ref.columna,
        filas: rows[0]?.filas ?? 0,
        via: "miembros_obra",
      });
    }
  }

  return referencias;
}

// ─────────────────────────────────────────────────────────────
// Plan / merge
// ─────────────────────────────────────────────────────────────

export async function planificarUnificacion(db, { origenId, destinoId, bloquear = false }) {
  const conflictos = [];

  if (!esUuid(origenId) || !esUuid(destinoId)) {
    return {
      origen: null,
      destino: null,
      miembros: [],
      referencias: [],
      conflictos: ["Los ids de origen y destino deben ser UUID válidos"],
    };
  }
  if (origenId === destinoId) {
    return {
      origen: null,
      destino: null,
      miembros: [],
      referencias: [],
      conflictos: ["El origen y el destino no pueden ser la misma persona"],
    };
  }

  const { rows } = await db.query(
    `SELECT ${CAMPOS_PERSONA}
       FROM personas
      WHERE id = ANY($1::uuid[])
      ${bloquear ? "FOR UPDATE" : ""}`,
    [[origenId, destinoId]]
  );
  const origen = rows.find((fila) => fila.id === origenId) ?? null;
  const destino = rows.find((fila) => fila.id === destinoId) ?? null;

  if (!origen) conflictos.push("La persona de origen no existe");
  if (!destino) conflictos.push("La persona de destino no existe");

  if (origen && destino) {
    if (!origen.auth_user_id) {
      conflictos.push("La persona de origen no tiene una cuenta web (auth_user_id)");
    }
    if (destino.auth_user_id && destino.auth_user_id !== origen.auth_user_id) {
      conflictos.push("La persona de destino ya está vinculada a otra cuenta web");
    }
    if (
      origen.telefono &&
      destino.telefono &&
      normalizarTelefonoPersona(origen.telefono) !== normalizarTelefonoPersona(destino.telefono)
    ) {
      conflictos.push("El origen tiene un teléfono distinto al destino; revisalo antes de unificar");
    }
  }

  if (conflictos.length > 0) {
    return { origen, destino, miembros: [], referencias: [], conflictos };
  }

  const { rows: filasMiembros } = await db.query(
    `SELECT id, persona_id, obra_id, rol
       FROM miembros_obra
      WHERE persona_id = ANY($1::uuid[])
      ORDER BY obra_id ASC, persona_id ASC`,
    [[origenId, destinoId]]
  );

  const obras = [...new Set(filasMiembros.map((fila) => fila.obra_id))];
  const miembros = [];

  for (const obraId of obras) {
    const filaOrigen = filasMiembros.find(
      (fila) => fila.obra_id === obraId && fila.persona_id === origenId
    );
    const filaDestino = filasMiembros.find(
      (fila) => fila.obra_id === obraId && fila.persona_id === destinoId
    );
    if (!filaOrigen && !filaDestino) continue;

    const rolOrigen = filaOrigen
      ? await resolverRolPersona(db, obraId, filaOrigen.rol)
      : null;
    const rolDestino = filaDestino
      ? await resolverRolPersona(db, obraId, filaDestino.rol)
      : null;
    const final = rolFinal(rolOrigen, rolDestino);

    miembros.push({
      obra_id: obraId,
      miembro_origen_id: filaOrigen?.id ?? null,
      miembro_destino_id: filaDestino?.id ?? null,
      rol_origen: rolOrigen?.nombre ?? null,
      rol_destino: rolDestino?.nombre ?? null,
      rol_final: final?.nombre ?? "Obrero",
      nivel_final: final?.nivel ?? 10,
    });
  }

  const origenMiembroIds = filasMiembros
    .filter((fila) => fila.persona_id === origenId)
    .map((fila) => fila.id);

  const referencias = await contarReferencias(db, origenId, origenMiembroIds);

  return { origen, destino, miembros, referencias, conflictos };
}

function resumenPersona(persona) {
  if (!persona) return null;
  return {
    id: persona.id,
    nombre: persona.nombre,
    telefono: persona.telefono,
    auth_user_id: persona.auth_user_id,
  };
}

export async function unificarPersonas({
  origenId,
  destinoId,
  ejecutadoPor = null,
  client = null,
}) {
  const propiaTransaccion = !client;
  const db = client ?? (await pool.connect());

  try {
    if (propiaTransaccion) await db.query("BEGIN");
    await verificarReferenciasConocidas(db);

    const plan = await planificarUnificacion(db, { origenId, destinoId, bloquear: true });
    if (plan.conflictos.length > 0) {
      throw new PersonaError(
        "PERSONA_CONFLICTO",
        plan.conflictos.join("; "),
        { conflictos: plan.conflictos }
      );
    }

    const movidos = [];
    for (const ref of REFERENCIAS_PERSONA) {
      const resultado = await db.query(
        `UPDATE ${ref.tabla} SET ${ref.columna} = $1 WHERE ${ref.columna} = $2`,
        [destinoId, origenId]
      );
      if (resultado.rowCount > 0) {
        movidos.push({ tabla: ref.tabla, columna: ref.columna, filas: resultado.rowCount });
      }
    }

    for (const ref of REFERENCIAS_PERSONA_ESPECIALES) {
      await db.query(
        `INSERT INTO ${ref.tabla} (${ref.columna}, proveedor_id)
         SELECT $1, proveedor_id FROM ${ref.tabla} WHERE ${ref.columna} = $2
         ON CONFLICT DO NOTHING`,
        [destinoId, origenId]
      );
      const resultado = await db.query(
        `DELETE FROM ${ref.tabla} WHERE ${ref.columna} = $1`,
        [origenId]
      );
      if (resultado.rowCount > 0) {
        movidos.push({
          tabla: ref.tabla,
          columna: ref.columna,
          filas: resultado.rowCount,
          modo: "merge_pk",
        });
      }
    }

    for (const miembro of plan.miembros) {
      let miembroDestinoId = miembro.miembro_destino_id;

      if (miembroDestinoId) {
        await db.query(
          `UPDATE miembros_obra SET rol = $1 WHERE id = $2`,
          [miembro.rol_final, miembroDestinoId]
        );
      } else {
        const { rows } = await db.query(
          `INSERT INTO miembros_obra (persona_id, obra_id, rol)
           VALUES ($1, $2, $3)
           ON CONFLICT (persona_id, obra_id) DO UPDATE SET rol = EXCLUDED.rol
           RETURNING id`,
          [destinoId, miembro.obra_id, miembro.rol_final]
        );
        miembroDestinoId = rows[0]?.id ?? null;
      }

      if (miembro.miembro_origen_id && miembroDestinoId) {
        for (const ref of REFERENCIAS_MIEMBROS_OBRA) {
          const resultado = await db.query(
            `UPDATE ${ref.tabla} SET ${ref.columna} = $1 WHERE ${ref.columna} = $2`,
            [miembroDestinoId, miembro.miembro_origen_id]
          );
          if (resultado.rowCount > 0) {
            movidos.push({
              tabla: ref.tabla,
              columna: ref.columna,
              filas: resultado.rowCount,
              via: "miembros_obra",
            });
          }
        }
      }
    }

    await db.query(`DELETE FROM miembros_obra WHERE persona_id = $1`, [origenId]);

    // La DB tiene el CHECK `personas_auth_or_phone_chk` (auth_user_id o
    // teléfono, al menos uno). Una persona web suele no tener teléfono, así que
    // NO se puede limpiar su auth_user_id antes de borrarla: violaría el check.
    // Se borra el origen (ya sin refs ni membresías) y después se transfiere el
    // auth al destino, que tiene teléfono o ya tenía auth.
    const authUserId = plan.origen.auth_user_id;
    await db.query(`DELETE FROM personas WHERE id = $1`, [origenId]);

    if (authUserId) {
      await db.query(`UPDATE personas SET auth_user_id = $1 WHERE id = $2`, [
        authUserId,
        destinoId,
      ]);
    }

    // La auditoría va después del delete: `persona_origen` no tiene FK (guarda
    // el id histórico) y `ejecutado_por` sí; si el ejecutor era el origen, se
    // deja NULL para no violar la FK.
    const ejecutadoPorAuditoria =
      ejecutadoPor && ejecutadoPor !== origenId ? ejecutadoPor : null;

    try {
      await db.query(
        `INSERT INTO personas_unificaciones
           (persona_origen, persona_destino, auth_user_id, telefono, snapshot, ejecutado_por)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
        [
          origenId,
          destinoId,
          authUserId,
          plan.destino.telefono,
          JSON.stringify({
            origen: plan.origen,
            destino: plan.destino,
            miembros: plan.miembros,
            referencias: plan.referencias,
            movidos,
          }),
          ejecutadoPorAuditoria,
        ]
      );
    } catch (error) {
      if (error?.code === "42P01") {
        throw new PersonaError(
          "MIGRACION_PENDIENTE",
          "Falta aplicar outputs/migracion_personas_unificadas.sql (tabla personas_unificaciones)"
        );
      }
      throw error;
    }

    if (propiaTransaccion) await db.query("COMMIT");

    return {
      origen: resumenPersona(plan.origen),
      destino: resumenPersona({
        ...plan.destino,
        auth_user_id: authUserId ?? plan.destino.auth_user_id,
      }),
      miembros: plan.miembros,
      referencias: movidos,
      total_movido: movidos.reduce((total, item) => total + item.filas, 0),
      ejecutado_por: ejecutadoPor ?? null,
    };
  } catch (error) {
    if (propiaTransaccion) {
      try {
        await db.query("ROLLBACK");
      } catch {
        // El error original es el que importa.
      }
    }
    throw error;
  } finally {
    if (propiaTransaccion) db.release();
  }
}

// ─────────────────────────────────────────────────────────────
// Alta / vinculación de cuenta web
// ─────────────────────────────────────────────────────────────

async function vincularConTransaccion(
  db,
  { authUserId, nombre, telefono, ejecutadoPor, permitirVinculoPorTelefono }
) {
  if (!esUuid(authUserId)) {
    throw new PersonaError("DATOS_INVALIDOS", "auth_user_id inválido");
  }

  const porAuth = await buscarPersonaPorAuthUserId(db, authUserId);
  const porTelefono = telefono ? await buscarPersonaPorTelefono(db, telefono) : null;

  if (porAuth && porTelefono && porAuth.id !== porTelefono.id) {
    if (!permitirVinculoPorTelefono) {
      throw new PersonaError(
        "TELEFONO_EN_USO",
        "Ese teléfono ya está registrado. Un Director puede vincular tu cuenta desde Equipo."
      );
    }
    // El humano ya existe por teléfono y además tiene una cuenta web separada:
    // se unifica el teléfono (destino) con la cuenta web (origen).
    await unificarPersonas({
      origenId: porAuth.id,
      destinoId: porTelefono.id,
      ejecutadoPor,
      client: db,
    });
    return await buscarPersonaPorAuthUserId(db, authUserId);
  }

  if (porAuth) {
    if (telefono && !porTelefono) {
      // `buscarPersonaPorTelefono` ya cubrió todas las variantes: si devolvió
      // null, el número está libre. La carrera la cubre el UNIQUE (23505).
      await db.query(`UPDATE personas SET telefono = $1 WHERE id = $2`, [
        String(telefono).replace(/\D/g, "") || null,
        porAuth.id,
      ]);
      porAuth.telefono = String(telefono).replace(/\D/g, "") || null;
    }
    return porAuth;
  }

  if (porTelefono) {
    if (!permitirVinculoPorTelefono) {
      throw new PersonaError(
        "TELEFONO_EN_USO",
        "Ese teléfono ya está registrado. Un Director puede vincular tu cuenta desde Equipo."
      );
    }
    if (porTelefono.auth_user_id && porTelefono.auth_user_id !== authUserId) {
      throw new PersonaError(
        "TELEFONO_EN_USO",
        "Ese teléfono ya está vinculado a otra cuenta web"
      );
    }
    await db.query(`UPDATE personas SET auth_user_id = $1 WHERE id = $2`, [
      authUserId,
      porTelefono.id,
    ]);
    return { ...porTelefono, auth_user_id: authUserId };
  }

  const { rows } = await db.query(
    `INSERT INTO personas (auth_user_id, nombre, telefono)
     VALUES ($1, $2, $3)
     RETURNING ${CAMPOS_PERSONA}`,
    [
      authUserId,
      normalizarNombre(nombre),
      String(telefono ?? "").replace(/\D/g, "") || null,
    ]
  );
  return rows[0];
}

export async function vincularPersonaAuth({
  authUserId,
  nombre,
  telefono = null,
  ejecutadoPor = null,
  client = null,
  // El teléfono que llega del alta web o de `user_metadata` NO está verificado:
  // vincular automáticamente por él permitiría que cualquiera reclame el número
  // de un Director y herede sus obras. Solo un flujo confiable (script de
  // administración o un endpoint con identidad probada) puede pasar `true`.
  permitirVinculoPorTelefono = false,
}) {
  const propiaTransaccion = !client;
  const db = client ?? (await pool.connect());

  try {
    if (propiaTransaccion) await db.query("BEGIN");
    const persona = await vincularConTransaccion(db, {
      authUserId,
      nombre,
      telefono,
      ejecutadoPor,
      permitirVinculoPorTelefono,
    });
    if (propiaTransaccion) await db.query("COMMIT");
    return persona;
  } catch (error) {
    if (propiaTransaccion) {
      try {
        await db.query("ROLLBACK");
      } catch {
        // El error original es el que importa.
      }
    }
    if (error?.code === "23505") {
      const detalle = `${error.constraint ?? ""} ${error.detail ?? ""}`;
      if (detalle.includes("auth_user_id")) {
        throw new PersonaError(
          "AUTH_EN_USO",
          "Esa cuenta web ya está vinculada a otra persona"
        );
      }
      throw new PersonaError(
        "TELEFONO_EN_USO",
        "Ese teléfono o cuenta web ya está vinculado a otra persona"
      );
    }
    throw error;
  } finally {
    if (propiaTransaccion) db.release();
  }
}

// ─────────────────────────────────────────────────────────────
// Auditoría de duplicados
// ─────────────────────────────────────────────────────────────

function agregarCandidato(mapa, filas, motivos) {
  const [a, b] = filas;
  const conAuth = [a, b].filter((fila) => fila.auth_user_id);
  const conTelefono = [a, b].filter((fila) => fila.telefono);

  let origen = null;
  let destino = null;
  let requiereRevision = false;

  if (
    conAuth.length === 1 &&
    conTelefono.length === 1 &&
    conAuth[0].id !== conTelefono[0].id
  ) {
    origen = conAuth[0];
    destino = conTelefono[0];
  } else {
    requiereRevision = true;
    origen = a;
    destino = b;
  }

  if (!origen || !destino || origen.id === destino.id) return;

  const clave = [origen.id, destino.id].sort().join("|");
  const existente = mapa.get(clave);
  if (existente) {
    existente.motivos = [...new Set([...existente.motivos, ...motivos])];
    existente.requiere_revision = existente.requiere_revision || requiereRevision;
    return;
  }

  mapa.set(clave, {
    origen_id: origen.id,
    destino_id: destino.id,
    origen: {
      id: origen.id,
      nombre: origen.nombre,
      telefono: enmascararTelefono(origen.telefono),
      auth_user_id: origen.auth_user_id,
      email: origen.email ?? null,
    },
    destino: {
      id: destino.id,
      nombre: destino.nombre,
      telefono: enmascararTelefono(destino.telefono),
      auth_user_id: destino.auth_user_id,
      email: destino.email ?? null,
    },
    motivos: [...new Set(motivos)],
    requiere_revision: requiereRevision,
  });
}

export async function auditarDuplicadosPersonas(db) {
  let filas;
  try {
    const resultado = await db.query(
      `SELECT p.id, p.nombre, p.telefono, p.auth_user_id, p.created_at, u.email
         FROM personas p
         LEFT JOIN auth.users u ON u.id = p.auth_user_id
        ORDER BY p.created_at ASC`
    );
    filas = resultado.rows;
  } catch (error) {
    // Sin acceso al schema auth (tests/entornos restringidos) la auditoría
    // sigue sirviendo: el email es contexto, no la clave del match.
    if (error?.code !== "3F000" && error?.code !== "42P01" && error?.code !== "42501") throw error;
    const resultado = await db.query(
      `SELECT id, nombre, telefono, auth_user_id, created_at FROM personas ORDER BY created_at ASC`
    );
    filas = resultado.rows;
  }

  const porId = new Map(filas.map((fila) => [fila.id, fila]));
  const candidatos = new Map();

  const gruposTelefono = new Map();
  for (const fila of filas) {
    const clave = normalizarTelefonoPersona(fila.telefono);
    if (!clave) continue;
    if (!gruposTelefono.has(clave)) gruposTelefono.set(clave, []);
    gruposTelefono.get(clave).push(fila);
  }
  for (const grupo of gruposTelefono.values()) {
    if (grupo.length < 2) continue;
    for (let i = 0; i < grupo.length; i += 1) {
      for (let j = i + 1; j < grupo.length; j += 1) {
        agregarCandidato(candidatos, [grupo[i], grupo[j]], ["telefono"]);
      }
    }
  }

  const gruposNombre = new Map();
  for (const fila of filas) {
    const clave = normalizarNombrePersona(fila.nombre);
    if (!clave) continue;
    if (!gruposNombre.has(clave)) gruposNombre.set(clave, []);
    gruposNombre.get(clave).push(fila);
  }
  for (const grupo of gruposNombre.values()) {
    if (grupo.length < 2) continue;
    for (let i = 0; i < grupo.length; i += 1) {
      for (let j = i + 1; j < grupo.length; j += 1) {
        agregarCandidato(candidatos, [grupo[i], grupo[j]], ["nombre"]);
      }
    }
  }

  // Nombres contenidos ("Facundo Jarma" vs "Facundo Jarma v. WEB" ya cae por
  // normalización, pero este segundo pase cubre variantes con segundo nombre).
  for (let i = 0; i < filas.length; i += 1) {
    for (let j = i + 1; j < filas.length; j += 1) {
      const a = normalizarNombrePersona(filas[i].nombre);
      const b = normalizarNombrePersona(filas[j].nombre);
      if (!a || !b) continue;
      if (a === b) continue;
      const corto = a.length <= b.length ? a : b;
      const largo = a.length <= b.length ? b : a;
      if (corto.length >= 6 && largo.includes(corto)) {
        agregarCandidato(candidatos, [filas[i], filas[j]], ["nombre_parecido"]);
      }
    }
  }

  const resultado = [];
  for (const candidato of candidatos.values()) {
    const origen = porId.get(candidato.origen_id);
    const destino = porId.get(candidato.destino_id);

    // Membresías crudas: `plan.miembros` viene vacío cuando hay conflictos y
    // `--obra` no puede depender de eso para no esconder los pares a revisar.
    const { rows: obrasFilas } = await db.query(
      `SELECT DISTINCT obra_id FROM miembros_obra
        WHERE persona_id = ANY($1::uuid[])`,
      [[candidato.origen_id, candidato.destino_id]]
    );

    let plan = null;
    let error = null;
    try {
      plan = await planificarUnificacion(db, {
        origenId: candidato.origen_id,
        destinoId: candidato.destino_id,
      });
    } catch (planError) {
      error = planError.message;
    }

    resultado.push({
      ...candidato,
      obras: obrasFilas.map((fila) => fila.obra_id),
      origen: { ...candidato.origen, nombre: origen?.nombre ?? candidato.origen.nombre },
      destino: { ...candidato.destino, nombre: destino?.nombre ?? candidato.destino.nombre },
      miembros: plan?.miembros ?? [],
      referencias: plan?.referencias ?? [],
      conflictos: plan?.conflictos ?? (error ? [error] : []),
    });
  }

  resultado.sort((a, b) => a.destino.nombre.localeCompare(b.destino.nombre));
  return { total: resultado.length, candidatos: resultado };
}
