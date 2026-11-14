import { pool } from "../db.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";
import { perfilEnObra, puedePorNivel, resolverRol } from "../services/roles.service.js";

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
    // Mismo criterio que /obreros/asignar-obra: permiso equipo.administrar de
    // roles_obra y nunca un rol de nivel superior al propio.
    const perfil = await perfilEnObra(req.personaId, obra_id);
    if (perfil?.permisos.web["equipo.administrar"] !== true) {
      return res.status(403).json({ error: SIN_PERMISO_EQUIPO });
    }
    const rolDestino = await resolverRol(obra_id, cargo);
    if (!rolDestino) {
      return res.status(400).json({ error: "El rol indicado no existe en esta obra" });
    }
    if (!puedePorNivel(perfil.rol, rolDestino)) {
      return res.status(403).json({ error: "No podés asignar un rol superior al tuyo" });
    }

    const result = await pool.query(
      `INSERT INTO miembros_obra (persona_id, obra_id, rol)
       VALUES ($1, $2, $3)
       ON CONFLICT (persona_id, obra_id) DO NOTHING
       RETURNING *`,
      [usuario_id, obra_id, rolDestino.nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error asignando usuario a obra" });
  }
}