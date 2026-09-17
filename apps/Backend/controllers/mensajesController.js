import { pool } from "../db.js";

// GET /mensajes/:obraId
// Bandeja de WhatsApp: mensajes crudos registrados por el bot junto con la
// interpretación ejecutada (mensajes.action_executed) para que el frontend
// renderice las cards de "Interpretación de la IA".
export async function getMensajes(req, res) {
  const { obraId } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         m.id,
         m.tipo,
         m.contenido,
         m.estado_procesamiento,
         m.error_detalle,
         m.created_at,
         m.action_executed,
         COALESCE(p.nombre, 'Desconocido') AS usuario_nombre,
         (SELECT mo.rol
            FROM miembros_obra mo
           WHERE mo.persona_id = m.usuario_id AND mo.obra_id = m.obra_id
           LIMIT 1) AS rol
       FROM mensajes m
       LEFT JOIN personas p ON p.id = m.usuario_id
       WHERE m.obra_id = $1
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [obraId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo mensajes" });
  }
}
