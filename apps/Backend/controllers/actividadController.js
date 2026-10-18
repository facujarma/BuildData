import { pool } from "../db.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";

function mapAccion(tipo) {
  const map = {
    "Avance de tarea": "registró un avance",
    "Foto": "subió una foto",
    "Cierre de jornada": "cerró la jornada",
    "Problema": "reportó un problema",
  };
  return map[tipo] || "registró actividad";
}

// GET /actividad/:obra_id — bitácora de la obra con el rol del autor en esa obra y tags
export async function getActividad(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) {
      return res.status(403).json({ error: "No pertenecés a esta obra" });
    }
    const result = await pool.query(
      `SELECT
        a.id,
        a.accion,
        a.tipo,
        a.texto,
        a.tags,
        a.created_at,
        a.entidad_tipo,
        a.entidad_id,
        COALESCE(p.nombre, 'Sistema') AS usuario_nombre,
        mo.rol AS usuario_rol
      FROM actividad a
      LEFT JOIN personas p ON p.id = a.usuario_id
      LEFT JOIN miembros_obra mo ON mo.persona_id = a.usuario_id AND mo.obra_id = a.obra_id
      WHERE a.obra_id = $1
      ORDER BY a.created_at DESC
      LIMIT 300`,
      [obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo actividad" });
  }
}

export async function crearActividad(req, res) {
  const { obra_id, tipo, texto } = req.body;
  const usuario_id = req.personaId;

  if (!usuario_id) {
    return res.status(404).json({ error: "Persona no encontrada para el usuario autenticado" });
  }

  if (!obra_id || !tipo) {
    return res.status(400).json({ error: "obra_id y tipo son requeridos" });
  }

  const accion = mapAccion(tipo);
  // Carga manual desde el panel: se marca para distinguirla de lo que registra el sistema
  const tags = tipo === "Foto" ? ["Manual", "Foto"] : ["Manual"];

  try {
    if (!(await esMiembroDeObra(usuario_id, obra_id))) {
      return res.status(403).json({ error: "No pertenecés a esta obra" });
    }
    const result = await pool.query(
      `INSERT INTO actividad (obra_id, usuario_id, accion, tipo, texto, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [obra_id, usuario_id, accion, tipo, texto || null, tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando actividad" });
  }
}
