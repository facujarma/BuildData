// Permisos: ¿esta persona puede tocar esta obra? Lo usan casi todos los controllers de la
// web (materiales, pedidos, proveedores, presupuesto, gastos, actividad, galería) antes de
// leer o escribir: si no es miembro, el controller responde 403.

import { pool } from "../db.js"; // conexión a la base

// ¿La persona es miembro de la obra? (mismo criterio que chatbotController)
// personaId sale de req.personaId (lo deja authMiddleware); obraId, de la URL o del recurso.
export async function esMiembroDeObra(personaId, obraId) {
  if (!personaId || !obraId) return false; // sin persona o sin obra: no hay permiso
  // miembros_obra es la tabla que dice quién está en el equipo de cada obra
  const { rows } = await pool.query(
    `SELECT 1 FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2 LIMIT 1`, // "SELECT 1": solo importa si existe la fila
    [personaId, obraId]
  );
  return rows.length > 0; // true si encontró la fila → es miembro
}

// Devuelve { obra_id } del material/pedido, o null si no existe.
// (un material puede tener obra_id NULL: esMiembroDeObra lo rechaza)
// Sirven cuando la URL trae el id del recurso (ej. /pedidos/:id/entregar) y no el de la
// obra: primero averiguamos de qué obra es, después chequeamos la membresía.
export async function obraDeMaterial(materialId) {
  const { rows } = await pool.query(`SELECT obra_id FROM materiales WHERE id = $1`, [materialId]);
  return rows[0] || null; // null → el controller responde 404
}

// La usa pedidosController.entregarPedido (y aprobar/rechazar/estado) al empezar
export async function obraDePedido(pedidoId) {
  const { rows } = await pool.query(`SELECT obra_id FROM pedidos_materiales WHERE id = $1`, [pedidoId]);
  return rows[0] || null;
}

// Valida que el proveedor exista, esté activo y sea accesible desde esta obra
// (global o scope='obra' de esa misma obra). Devuelve la fila o null.
// Recibe `client` (y no usa pool) porque se llama dentro de la transacción que crea el pedido.
export async function proveedorAccesible(client, obraId, proveedorId) {
  const { rows } = await client.query(
    `SELECT * FROM proveedores
     WHERE id = $1 AND activo AND (scope = 'global' OR obra_id = $2)`,
    [proveedorId, obraId]
  );
  return rows[0] || null;
}
