import { pool } from "../db.js";

function mapAccion(tipo) {
  const map = {
    "Avance de tarea": "registró un avance",
    "Foto": "subió una foto",
    "Cierre de jornada": "cerró la jornada",
    "Problema": "reportó un problema",
  };
  return map[tipo] || "registró actividad";
}

export async function getActividad(req, res) {
  const { obra_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT
        a.id,
        a.accion,
        a.tipo,
        a.texto,
        a.created_at,
        a.entidad_tipo,
        a.entidad_id,
        COALESCE(p.nombre, 'Sistema') AS usuario_nombre
      FROM actividad a
      LEFT JOIN personas p ON p.id = a.usuario_id
      WHERE a.obra_id = $1
      ORDER BY a.created_at DESC`,
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

  try {
    const result = await pool.query(
      `INSERT INTO actividad (obra_id, usuario_id, accion, tipo, texto)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [obra_id, usuario_id, accion, tipo, texto || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando actividad" });
  }
}
