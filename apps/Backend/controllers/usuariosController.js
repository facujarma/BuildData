import { pool } from "../db.js";
import { esMiembroDeObra, rolEnObra } from "../services/obraAccess.service.js";
import {
  normalizarRol,
  puedeAdministrarEquipo,
  puedeAsignarRol,
} from "../services/permisos.service.js";

const SIN_PERMISO_EQUIPO = "No tenés permisos para administrar el equipo de esta obra";

// GET /usuarios/:obra_id — equipo de una obra con sus tareas asignadas
export async function getEquipo(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) {
      return res.status(403).json({ error: "No pertenecés a esta obra" });
    }
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
  if (!usuario_id || !obra_id) {
    return res.status(400).json({ error: "usuario_id y obra_id son requeridos" });
  }
  try {
    // Mismo criterio que /obreros/asignar-obra: solo Director de la obra y
    // nunca un rol superior al propio.
    const rolLlamante = await rolEnObra(req.personaId, obra_id);
    if (!puedeAdministrarEquipo(rolLlamante)) {
      return res.status(403).json({ error: SIN_PERMISO_EQUIPO });
    }
    const rolNormalizado = normalizarRol(cargo);
    if (!puedeAsignarRol(rolLlamante, rolNormalizado)) {
      return res.status(403).json({ error: "No podés asignar un rol superior al tuyo" });
    }

    const result = await pool.query(
      `INSERT INTO miembros_obra (persona_id, obra_id, rol)
       VALUES ($1, $2, $3)
       ON CONFLICT (persona_id, obra_id) DO NOTHING
       RETURNING *`,
      [usuario_id, obra_id, rolNormalizado]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error asignando usuario a obra" });
  }
}