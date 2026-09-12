import { pool } from "../db.js";

const DIAS_INACTIVIDAD = 7;

// Chequeo periódico (ver setInterval en server.js). Una obra 'activa' sin mensajes del bot
// en los últimos DIAS_INACTIVIDAD días genera una alerta 'inactividad' — no duplica si ya
// hay una sin resolver. Se cierra sola en botController.recibirMensaje cuando vuelve a haber
// actividad. Obras que nunca usaron el bot (sin mensajes) quedan afuera: no es "inactividad",
// es que todavía no se sumaron al bot.
export async function verificarInactividad() {
  try {
    const obras = await pool.query(
      `SELECT o.id, o.nombre,
        (SELECT MAX(m.created_at) FROM mensajes m WHERE m.obra_id = o.id) AS ultimo_mensaje
       FROM obras o
       WHERE o.estado = 'activa'`
    );

    for (const obra of obras.rows) {
      if (!obra.ultimo_mensaje) continue;

      const diasInactiva = (Date.now() - new Date(obra.ultimo_mensaje).getTime()) / 86400000;
      if (diasInactiva < DIAS_INACTIVIDAD) continue;

      const yaAlertada = await pool.query(
        `SELECT id FROM alertas WHERE obra_id = $1 AND tipo = 'inactividad' AND resuelta = false`,
        [obra.id]
      );
      if (yaAlertada.rows.length > 0) continue;

      await pool.query(
        `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, titulo, subtitulo, severity)
         VALUES ($1, 'inactividad', $2, 'media', 'Obra sin actividad', $3, 'attention')`,
        [obra.id, `La obra "${obra.nombre}" no tiene actividad del bot hace más de ${DIAS_INACTIVIDAD} días`, `Sin mensajes del bot hace más de ${DIAS_INACTIVIDAD} días`]
      );
    }
  } catch (error) {
    console.error("[verificarInactividad] error:", error);
  }
}

// GET /alertas/:obra_id — alertas sin resolver
export async function getAlertas(req, res) {
  const { obra_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT a.*, u.nombre as destinatario
       FROM alertas a
       LEFT JOIN personas u ON a.usuario_id = u.id
       WHERE a.obra_id = $1 AND a.resuelta = false
       ORDER BY a.created_at DESC`,
      [obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo alertas" });
  }
}

// PATCH /alertas/:id/resolver
export async function resolverAlerta(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE alertas SET resuelta = true WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error resolviendo alerta" });
  }
}

// POST /alertas — crear alerta
export async function crearAlerta(req, res) {
  const { obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity || 'attention']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando alerta" });
  }
}