import { pool } from "../db.js";
import { guardarEmbedding } from "../services/embeddings.service.js";

function formatRubro(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    // Avance del rubro derivado de sus tareas (promedio simple, sin canceladas).
    // La columna manual rubros.porcentaje_avance quedó obsoleta y se ignora.
    porcentaje_avance: parseInt(row.avance_tareas) || 0,
    cap: parseInt(row.cap) || 0,
    spent: parseInt(row.spent) || 0,
    progress: parseInt(row.progress) || 0,
  };
}

const AVANCE_TAREAS_SQL = `
  COALESCE((
    SELECT ROUND(AVG(t.porcentaje_avance))
    FROM tareas t
    WHERE t.rubro_id = r.id AND t.estado <> 'cancelada'
  ), 0)::int AS avance_tareas`;

// GET /obras/:obraId/rubros
export async function getRubros(req, res) {
  const { obraId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, pr.cap, pr.spent,
        ${AVANCE_TAREAS_SQL},
        CASE WHEN pr.cap > 0 THEN ROUND((pr.spent::numeric / pr.cap) * 100) ELSE 0 END AS progress
       FROM rubros r
       LEFT JOIN presupuesto_rubros pr ON pr.rubro_id = r.id
       WHERE r.obra_id = $1 ORDER BY r.orden ASC, r.nombre ASC`,
      [obraId]
    );
    res.json({ rubros: result.rows.map(formatRubro) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// POST /obras/:obraId/rubros
export async function crearRubro(req, res) {
  const { obraId } = req.params;
  const { nombre, presupuesto, descripcion } = req.body;
  if (!nombre || presupuesto === undefined) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: "nombre y presupuesto son requeridos" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rubro = await client.query(
      `INSERT INTO rubros (obra_id, nombre, descripcion)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [obraId, nombre, descripcion || null]
    );
    await client.query(
      `INSERT INTO presupuesto_rubros (rubro_id, cap) VALUES ($1,$2)`,
      [rubro.rows[0].id, presupuesto]
    );
    await client.query("COMMIT");
    await guardarEmbedding("rubro", rubro.rows[0].id, rubro.rows[0].nombre);
    res.status(201).json(formatRubro({ ...rubro.rows[0], cap: presupuesto, spent: 0, progress: 0, avance_tareas: 0 }));
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  } finally { client.release(); }
}

// PATCH /obras/:obraId/rubros/:rubroId
// porcentaje_avance ya no es editable: se deriva de las tareas del rubro.
export async function updateRubro(req, res) {
  const { rubroId, obraId } = req.params;
  const { cap, spent, nombre, descripcion } = req.body;
  try {
    await pool.query(
      `UPDATE rubros SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [nombre, descripcion, rubroId]
    );

    if (cap !== undefined || spent !== undefined) {
      await pool.query(
        `UPDATE presupuesto_rubros SET
          cap = COALESCE($1, cap),
          spent = COALESCE($2, spent),
          updated_at = NOW()
         WHERE rubro_id = $3`,
        [cap, spent, rubroId]
      );
      // Recalcular ejecutado total
      await pool.query(
        `UPDATE presupuestos SET
          ejecutado = (SELECT COALESCE(SUM(pr.spent),0) FROM presupuesto_rubros pr JOIN rubros r ON r.id = pr.rubro_id WHERE r.obra_id = $1),
          updated_at = NOW()
         WHERE obra_id = $1`, [obraId]
      );
    }

    const result = await pool.query(
      `SELECT r.*, pr.cap, pr.spent,
        ${AVANCE_TAREAS_SQL},
        CASE WHEN pr.cap > 0 THEN ROUND((pr.spent::numeric / pr.cap)*100) ELSE 0 END AS progress
       FROM rubros r LEFT JOIN presupuesto_rubros pr ON pr.rubro_id = r.id
       WHERE r.id = $1`, [rubroId]
    );
    if (nombre) {
      await guardarEmbedding("rubro", rubroId, result.rows[0].nombre);
    }
    res.json(formatRubro(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// DELETE /obras/:obraId/rubros/:rubroId
export async function deleteRubro(req, res) {
  const { rubroId } = req.params;
  try {
    await pool.query(`DELETE FROM rubros WHERE id = $1`, [rubroId]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}