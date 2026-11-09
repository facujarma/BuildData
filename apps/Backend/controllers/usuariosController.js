import { pool } from "../db.js";
import { normalizarRol } from "../services/permisos.service.js";

// GET /usuarios/:obra_id — equipo de una obra con sus tareas asignadas
export async function getEquipo(req, res) {
  const { obra_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.id, p.nombre, p.telefono, mo.rol AS cargo, mo.joined_at
        FROM personas p
        JOIN miembros_obra mo ON p.id = mo.persona_id
        WHERE mo.obra_id = $1`,
      [obra_id]
    );

    // Para cada usuario, traer sus tareas en esa obra
    const equipo = await Promise.all(
      result.rows.map(async (usuario) => {
        const tareas = await pool.query(
          `SELECT t.id, t.titulo, t.estado
           FROM tareas t
           JOIN miembros_obra mo ON t.asignado_a = mo.id
           WHERE t.obra_id = $1 AND mo.persona_id = $2`,
          [obra_id, usuario.id]
        );
        return { ...usuario, tareas: tareas.rows };
      })
    );

    res.json(equipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo equipo" });
  }
}

// POST /usuarios — crear usuario
export async function crearUsuario(req, res) {
  const { nombre, email, password_hash, telefono } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, telefono)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, email, telefono, created_at`,
      [nombre, email, password_hash, telefono]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando usuario" });
  }
}

// POST /usuarios/asignar-obra — asignar usuario a una obra con un cargo
export async function asignarObra(req, res) {
  const { usuario_id, obra_id, cargo } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO miembros_obra (persona_id, obra_id, rol)
       VALUES ($1, $2, $3)
       ON CONFLICT (persona_id, obra_id) DO NOTHING
       RETURNING *`,
      [usuario_id, obra_id, normalizarRol(cargo)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error asignando usuario a obra" });
  }
}