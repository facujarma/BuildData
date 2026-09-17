import { pool } from "../db.js";
import { guardarEmbedding } from "../services/embeddings.service.js";

// GET /materiales/:obra_id
export async function getMateriales(req, res) {
  const { obra_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM materiales WHERE obra_id = $1 ORDER BY nombre ASC`,
      [obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /materiales
export async function crearMaterial(req, res) {
  const { obra_id, nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario } = req.body;
  if (!obra_id || !nombre) return res.status(400).json({ error: "obra_id y nombre son requeridos" });
  try {
    const result = await pool.query(
      `INSERT INTO materiales (obra_id, nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [obra_id, nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario]
    );
    await guardarEmbedding("material", result.rows[0].id, result.rows[0].nombre);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// PATCH /materiales/:id
export async function actualizarMaterial(req, res) {
  const { id } = req.params;
  const { stock_actual, stock_minimo, costo_unitario } = req.body;
  try {
    const result = await pool.query(
      `UPDATE materiales
       SET stock_actual = COALESCE($1, stock_actual),
           stock_minimo = COALESCE($2, stock_minimo),
           costo_unitario = COALESCE($3, costo_unitario)
       WHERE id = $4 RETURNING *`,
      [stock_actual, stock_minimo, costo_unitario, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}