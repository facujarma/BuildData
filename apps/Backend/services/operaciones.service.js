import { pool } from "../db.js";
import { resolvePersonaIdByTelefono } from "./personaService.js";

// Allowlist de operaciones que el executor puede disparar por loopback.
// `auto: true` = no requiere aprobación (se ejecuta al registrarse).
export const ENDPOINTS_OPERACION = {
  "/bot/pedidoDeCompra": { method: "POST", auto: false },
  "/bot/stock": { method: "POST", auto: false },
  "/bot/stock/ajuste": { method: "POST", auto: false },
  "/bot/retraso": { method: "POST", auto: false },
  "/bot/gastos": { method: "POST", auto: false },
  "/bot/tareas": { method: "POST", auto: true },
  "/bot/tareas/:id/completar": { method: "PATCH", auto: true },
};

const TIMEOUT_MS = 15000;

export function esEndpointPermitido(endpoint, method) {
  const def = ENDPOINTS_OPERACION[endpoint];
  return Boolean(def) && def.method === method;
}

export function operacionAutomatica(endpoint) {
  return Boolean(ENDPOINTS_OPERACION[endpoint]?.auto);
}

// Igual que el bot: interpola params de path (ej: :id → payload.tarea_id) y los
// saca del body para que no viajen en el JSON.
export function interpolarPathParams(endpoint, payload) {
  let path = endpoint;
  for (const token of endpoint.match(/:[a-z_]+/gi) ?? []) {
    const name = token.slice(1);
    const value =
      payload[name] ??
      payload[`${name}_id`] ??
      (name === "id" ? payload.tarea_id : undefined);
    if (typeof value === "string" && value) {
      path = path.replace(token, value);
    }
    delete payload[name];
    if (name === "id") delete payload.tarea_id;
  }
  return { path, body: payload };
}

function baseUrl() {
  return process.env.SELF_URL || `http://127.0.0.1:${process.env.PORT || 3001}`;
}

async function ejecutarPorLoopback(endpoint, method, payload) {
  const { path, body } = interpolarPathParams(endpoint, { ...payload });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const texto = await res.text();
    let data = null;
    try {
      data = texto ? JSON.parse(texto) : null;
    } catch {
      data = { raw: texto };
    }
    if (!res.ok) {
      throw new Error(`API_ERROR ${res.status}: ${data?.error || texto}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function ejecutarOperacion(op, { aprobadaPor = null } = {}) {
  const payload = { ...(op.payload || {}) };
  // Un pedido aprobado desde la bandeja nace aprobado (sin doble aprobación).
  if (op.endpoint === "/bot/pedidoDeCompra" && aprobadaPor) {
    payload.aprobado_por = aprobadaPor;
  }
  return ejecutarPorLoopback(op.endpoint, op.method, payload);
}

// Toma la operación de forma condicional (anti doble ejecución) y guarda el
// resultado. Permite reintentar las que quedaron en error.
async function ejecutarYGuardar(op, { aprobadaPor = null } = {}) {
  const claimed = await pool.query(
    `UPDATE operaciones_bot
     SET estado = 'ejecutando', intentos = intentos + 1
     WHERE id = $1 AND estado IN ('pendiente','error')
     RETURNING *`,
    [op.id]
  );
  if (!claimed.rows[0]) return null;
  const actual = claimed.rows[0];

  try {
    const resultado = await ejecutarOperacion(actual, { aprobadaPor });
    const { rows } = await pool.query(
      `UPDATE operaciones_bot
       SET estado = 'ejecutada',
           resultado = $1,
           error_detalle = NULL,
           aprobada_por = COALESCE($2, aprobada_por),
           aprobada_at = COALESCE(aprobada_at, now()),
           ejecutada_at = now()
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(resultado), aprobadaPor, actual.id]
    );
    return rows[0];
  } catch (error) {
    const detalle = String(error?.message ?? error);
    const { rows } = await pool.query(
      `UPDATE operaciones_bot
       SET estado = 'error',
           error_detalle = $1,
           aprobada_por = COALESCE($2, aprobada_por),
           aprobada_at = COALESCE(aprobada_at, now())
       WHERE id = $3
       RETURNING *`,
      [detalle, aprobadaPor, actual.id]
    );
    return rows[0];
  }
}

async function crearAlertaPendiente(op) {
  await pool.query(
    `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity, operacion_id)
     VALUES ($1, 'operacion_pendiente', $2, 'alta', $3, $4, $5, 'attention', $6)`,
    [
      op.obra_id,
      `Operación pendiente de aprobación: ${op.tipo || op.endpoint}`,
      op.usuario_id,
      op.tipo || "Operación pendiente",
      "Requiere aprobación en la bandeja",
      op.id,
    ]
  );
}

async function resolverAlertaOperacion(operacionId) {
  await pool.query(
    `UPDATE alertas
     SET resuelta = true, resolved_at = now()
     WHERE operacion_id = $1 AND resuelta = false`,
    [operacionId]
  );
}

// El estado del mensaje se deriva de sus operaciones.
export async function actualizarEstadoMensaje(mensajeId, client = pool) {
  if (!mensajeId) return;

  const { rows } = await client.query(
    `SELECT
       count(*) FILTER (WHERE estado IN ('pendiente','ejecutando'))::int AS pendientes,
       count(*) FILTER (WHERE estado = 'error')::int AS errores,
       count(*) FILTER (WHERE estado = 'ejecutada')::int AS ejecutadas,
       count(*)::int AS total
     FROM operaciones_bot
     WHERE mensaje_id = $1`,
    [mensajeId]
  );

  const r = rows[0];
  let estado = "procesado";
  if (r.pendientes > 0) estado = "pendiente_aprobacion";
  else if (r.errores > 0) estado = "error";
  else if (r.total > 0 && r.ejecutadas === 0) estado = "rechazado";

  await client.query(
    `UPDATE mensajes SET estado_procesamiento = $1 WHERE id = $2`,
    [estado, mensajeId]
  );
}

export async function obraDeOperacion(operacionId) {
  const { rows } = await pool.query(
    `SELECT obra_id FROM operaciones_bot WHERE id = $1`,
    [operacionId]
  );
  return rows[0]?.obra_id ?? null;
}

export async function listarOperacionesDeMensaje(mensajeId) {
  const { rows } = await pool.query(
    `SELECT id, endpoint, method, tipo, destino, comment, confianza, campos,
            estado, resultado, error_detalle, aprobada_por, aprobada_at,
            ejecutada_at, created_at
     FROM operaciones_bot
     WHERE mensaje_id = $1
     ORDER BY created_at ASC`,
    [mensajeId]
  );
  return rows;
}

// Registra el lote de operaciones de un mensaje. Las automáticas (o todas si la
// obra tiene aprobacion_automatica) se ejecutan al toque; el resto queda pendiente
// con una alerta.
export async function registrarOperaciones({ obra_id, mensaje_id, telefono, operaciones }) {
  const usuario_id = await resolvePersonaIdByTelefono(telefono);
  if (!usuario_id) {
    const error = new Error("telefono no resuelve a ninguna persona");
    error.status = 404;
    throw error;
  }

  const obra = await pool.query(
    `SELECT aprobacion_automatica FROM obras WHERE id = $1`,
    [obra_id]
  );
  if (obra.rows.length === 0) {
    const error = new Error("obra_id no encontrada");
    error.status = 404;
    throw error;
  }
  const autoObra = obra.rows[0].aprobacion_automatica === true;

  const client = await pool.connect();
  const insertadas = [];
  try {
    await client.query("BEGIN");
    for (const op of operaciones) {
      const { rows } = await client.query(
        `INSERT INTO operaciones_bot
           (obra_id, mensaje_id, usuario_id, endpoint, method, payload,
            tipo, destino, comment, confianza, campos, display)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          obra_id,
          mensaje_id || null,
          usuario_id,
          op.endpoint,
          op.method,
          op.payload,
          op.tipo || null,
          op.destino || null,
          op.comment || null,
          typeof op.confianza === "number" ? op.confianza : null,
          op.campos ? JSON.stringify(op.campos) : null,
          op.display ? JSON.stringify(op.display) : null,
        ]
      );
      insertadas.push(rows[0]);
    }
    await actualizarEstadoMensaje(mensaje_id, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  for (const op of insertadas) {
    const auto = autoObra || operacionAutomatica(op.endpoint);
    if (auto) {
      await ejecutarYGuardar(op, { aprobadaPor: null });
    } else {
      await crearAlertaPendiente(op);
    }
  }

  await actualizarEstadoMensaje(mensaje_id);
  return listarOperacionesDeMensaje(mensaje_id);
}

export async function aprobarOperacion(id, personaId) {
  const { rows } = await pool.query(
    `SELECT * FROM operaciones_bot WHERE id = $1`,
    [id]
  );
  const op = rows[0];
  if (!op) return { notFound: true };
  if (op.estado !== "pendiente" && op.estado !== "error") {
    return { conflict: true, estado: op.estado };
  }

  await resolverAlertaOperacion(id);
  const actualizada = await ejecutarYGuardar(op, { aprobadaPor: personaId });
  await actualizarEstadoMensaje(op.mensaje_id);
  return { operacion: actualizada ?? op };
}

export async function rechazarOperacion(id, personaId) {
  const { rows } = await pool.query(
    `UPDATE operaciones_bot
     SET estado = 'rechazada', aprobada_por = $1, aprobada_at = now()
     WHERE id = $2 AND estado IN ('pendiente','error')
     RETURNING *`,
    [personaId, id]
  );
  if (!rows[0]) {
    const existe = await pool.query(
      `SELECT estado FROM operaciones_bot WHERE id = $1`,
      [id]
    );
    if (!existe.rows[0]) return { notFound: true };
    return { conflict: true, estado: existe.rows[0].estado };
  }

  await resolverAlertaOperacion(id);
  await actualizarEstadoMensaje(rows[0].mensaje_id);
  return { operacion: rows[0] };
}
