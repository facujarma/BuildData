import { pool } from "../db.js";

// ¿La persona es miembro de la obra? (mismo criterio que chatbotController)
export async function esMiembroDeObra(personaId, obraId) {
  if (!personaId || !obraId) return false;
  const { rows } = await pool.query(
    `SELECT 1 FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2 LIMIT 1`,
    [personaId, obraId]
  );
  return rows.length > 0;
}

// Devuelve { obra_id } del material/pedido, o null si no existe.
// (un material puede tener obra_id NULL: esMiembroDeObra lo rechaza)
export async function obraDeMaterial(materialId) {
  const { rows } = await pool.query(`SELECT obra_id FROM materiales WHERE id = $1`, [materialId]);
  return rows[0] || null;
}

export async function obraDePedido(pedidoId) {
  const { rows } = await pool.query(`SELECT obra_id FROM pedidos_materiales WHERE id = $1`, [pedidoId]);
  return rows[0] || null;
}
