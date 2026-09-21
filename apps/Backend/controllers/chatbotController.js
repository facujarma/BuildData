import { pool } from "../db.js";
import { consultar } from "../services/chatbot/chatbot.service.js";

// POST /chat/consultar
// Body: { pregunta: string, obra_id: uuid }
export async function consultarChat(req, res) {
  const { pregunta, obra_id } = req.body ?? {};

  if (typeof pregunta !== "string" || !pregunta.trim()) {
    return res.status(400).json({ error: "La pregunta es requerida" });
  }
  if (typeof obra_id !== "string" || !obra_id.trim()) {
    return res.status(400).json({ error: "obra_id es requerido" });
  }
  if (!req.personaId) {
    return res.status(403).json({ error: "No se pudo resolver la persona del usuario" });
  }

  try {
    const membresia = await pool.query(
      `SELECT 1 FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2 LIMIT 1`,
      [req.personaId, obra_id]
    );
    if (membresia.rowCount === 0) {
      return res.status(403).json({ error: "No pertenecés a esa obra" });
    }

    const obraResult = await pool.query(`SELECT nombre FROM obras WHERE id = $1`, [obra_id]);
    if (obraResult.rowCount === 0) {
      return res.status(404).json({ error: "Obra no encontrada" });
    }

    const resultado = await consultar({
      pregunta: pregunta.trim(),
      obra: obraResult.rows[0].nombre,
      obraId: obra_id,
      personaId: req.personaId,
    });

    res.json(resultado);
  } catch (error) {
    console.error("[chat] error:", error);
    res.status(500).json({ code: "CHATBOT_ERROR", message: error.message });
  }
}
