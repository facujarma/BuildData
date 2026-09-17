import { pool } from "../db.js";
import { guardarEmbedding } from "../services/embeddings.service.js";

// GET /proveedores
export async function getProveedores(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM proveedores ORDER BY nombre ASC`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /proveedores
export async function crearProveedor(req, res) {
  const { nombre, telefono, email } = req.body;
  if (!nombre) return res.status(400).json({ error: "nombre es requerido" });
  try {
    const result = await pool.query(
      `INSERT INTO proveedores (nombre, telefono, email) VALUES ($1, $2, $3) RETURNING *`,
      [nombre, telefono, email]
    );
    await guardarEmbedding("proveedor", result.rows[0].id, result.rows[0].nombre);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /proveedores/vincular — vincular proveedor con material
export async function vincularProveedor(req, res) {
  const { material_id, proveedor_id } = req.body;
  if (!material_id || !proveedor_id) return res.status(400).json({ error: "material_id y proveedor_id son requeridos" });
  try {
    const result = await pool.query(
      `INSERT INTO materiales_proveedores (material_id, proveedor_id) VALUES ($1, $2) RETURNING *`,
      [material_id, proveedor_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}