import { pool } from "../db.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";

// GET /mensajes/:obraId
// Bandeja de WhatsApp: mensajes crudos registrados por el bot junto con sus
// operaciones (operaciones_bot) para que el frontend renderice las cards de
// "Interpretación de la IA" y los botones de aprobar/rechazar.
export async function getMensajes(req, res) {
  const { obraId } = req.params;

  if (!(await esMiembroDeObra(req.personaId, obraId))) {
    return res.status(403).json({ error: "No pertenecés a esta obra" });
  }

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
           LIMIT 1) AS rol,
         COALESCE((
           SELECT json_agg(o ORDER BY o.created_at)
           FROM (
             SELECT id, endpoint, method, tipo, destino, comment, confianza,
                    campos, estado, resultado, error_detalle, aprobada_por,
                    aprobada_at, ejecutada_at, created_at
             FROM operaciones_bot
             WHERE mensaje_id = m.id
           ) o
         ), '[]'::json) AS operaciones
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
