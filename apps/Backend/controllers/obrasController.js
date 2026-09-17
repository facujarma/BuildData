import { pool } from "../db.js";
import { guardarEmbeddings } from "../services/embeddings.service.js";

// Helper: armar objeto Obra completo según el contrato
async function buildObra(obra) {
  const team = await pool.query(
    `SELECT p.id,
       UPPER(LEFT(p.nombre, 1) || LEFT(COALESCE(SPLIT_PART(p.nombre, ' ', 2), ''), 1)) AS initials
     FROM personas p
     JOIN miembros_obra mo ON mo.persona_id = p.id
     WHERE mo.obra_id = $1`,
    [obra.id]
  );

  const tareasTotal = parseInt(obra.tareas_total) || 0;
  const tareasCompletadas = parseInt(obra.tareas_completadas) || 0;
  const progress = tareasTotal > 0
    ? Math.round((tareasCompletadas / tareasTotal) * 100)
    : 0;

  return {
    id: obra.id,
    name: obra.nombre,
    code: obra.code,
    address: obra.direccion,
    city: obra.city,
    province: obra.province,
    zip: obra.zip,
    country: obra.country,
    type: obra.type,
    status: obra.estado,
    progress,
    tareasCompletadas,
    tareasTotal,
    alerts: parseInt(obra.alerts) || 0,
    pedidos: parseInt(obra.pedidos) || 0,
    team: team.rows,
    startDate: obra.fecha_inicio,
    endDate: obra.fecha_fin_estimada,
    lastActivity: obra.last_activity,
    lastActivityWho: obra.last_activity_who,
    starred: obra.starred || false,
    autoApprove: obra.aprobacion_automatica || false,
  };
}

// GET /obras
export async function getObras(req, res) {
  try {
    const result = await pool.query(
      `SELECT o.*,
        (SELECT COUNT(*) FROM alertas a WHERE a.obra_id = o.id AND a.resuelta = false) AS alerts,
        (SELECT COUNT(*) FROM pedidos_materiales p WHERE p.obra_id = o.id AND p.aprobado = false) AS pedidos,
        (SELECT COUNT(*) FROM tareas t WHERE t.obra_id = o.id) AS tareas_total,
        (SELECT COUNT(*) FROM tareas t WHERE t.obra_id = o.id AND t.estado = 'completada') AS tareas_completadas
       FROM obras o
       JOIN miembros_obra mo ON mo.obra_id = o.id
       JOIN personas p ON p.id = mo.persona_id AND p.auth_user_id = $1
       ORDER BY o.last_activity DESC NULLS LAST`,
      [req.user.id]
    );
    const obras = await Promise.all(result.rows.map(buildObra));
    res.json({ obras });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// GET /obras/:obraId
export async function getObra(req, res) {
  const { obraId } = req.params;
  try {
    const result = await pool.query(
      `SELECT o.*,
        (SELECT COUNT(*) FROM alertas a WHERE a.obra_id = o.id AND a.resuelta = false) AS alerts,
        (SELECT COUNT(*) FROM pedidos_materiales p WHERE p.obra_id = o.id AND p.aprobado = false) AS pedidos
       FROM obras o WHERE o.id = $1`,
      [obraId]
    );
    if (!result.rows[0]) return res.status(404).json({ code: "NOT_FOUND", message: "Obra no encontrada" });
    res.json(await buildObra(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// POST /obras
export async function crearObra(req, res) {
  const { name, code, status, type, address, city, province, zip, country,
    startDate, endDate, myRole, team, presupuestoTotal, rubros } = req.body;

  if (!name || !code || !type || !address || !city || !province || !myRole || !presupuestoTotal || !rubros?.length) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: "Faltan campos requeridos" });
  }

  const client = await pool.connect();
  const rubrosCreados = [];
  try {
    await client.query("BEGIN");

    // Verificar código único
    const existing = await client.query(`SELECT id FROM obras WHERE code = $1`, [code]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(422).json({ code: "DUPLICATE_CODE", message: `Ya existe una obra con el código ${code}` });
    }

    const obra = await client.query(
      `INSERT INTO obras (nombre, code, type, direccion, city, province, zip, country, fecha_inicio, fecha_fin_estimada, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, code, type, address, city, province, zip || null, country || 'ar', startDate || null, endDate || null, status || 'planificacion']
    );
    const obra_id = obra.rows[0].id;

    // Vincular creador
    await client.query(
      `INSERT INTO personas (auth_user_id) VALUES ($1)
       ON CONFLICT (auth_user_id) DO NOTHING`,
      [req.user.id]
    );
    await client.query(
      `INSERT INTO miembros_obra (persona_id, obra_id, rol)
       SELECT id, $2, $3 FROM personas WHERE auth_user_id = $1
       ON CONFLICT (persona_id, obra_id) DO NOTHING`,
      [req.user.id, obra_id, myRole]
    );

    // Vincular equipo adicional
    if (team?.length) {
      for (const userId of team) {
        await client.query(
          `INSERT INTO personas (auth_user_id) VALUES ($1)
           ON CONFLICT (auth_user_id) DO NOTHING`,
          [userId]
        );
        await client.query(
          `INSERT INTO miembros_obra (persona_id, obra_id, rol)
           SELECT id, $2, 'operario' FROM personas WHERE auth_user_id = $1
           ON CONFLICT (persona_id, obra_id) DO NOTHING`,
          [userId, obra_id]
        );
      }
    }

    // Presupuesto total
    await client.query(
      `INSERT INTO presupuestos (obra_id, total) VALUES ($1,$2)`,
      [obra_id, presupuestoTotal]
    );

    // Rubros
    for (const rubro of rubros) {
      const rubroResult = await client.query(
        `INSERT INTO rubros (obra_id, nombre) VALUES ($1,$2) RETURNING id`,
        [obra_id, rubro.nombre]
      );
      await client.query(
        `INSERT INTO presupuesto_rubros (rubro_id, cap) VALUES ($1,$2)`,
        [rubroResult.rows[0].id, rubro.presupuesto || 0]
      );
      rubrosCreados.push({ id: rubroResult.rows[0].id, nombre: rubro.nombre });
    }

    await client.query("COMMIT");
    await guardarEmbeddings("rubro", rubrosCreados);

    // Devolver obra completa
    const full = await pool.query(
      `SELECT o.*, 0 AS alerts, 0 AS pedidos FROM obras o WHERE o.id = $1`,
      [obra_id]
    );
    res.status(201).json(await buildObra(full.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  } finally {
    client.release();
  }
}

// PATCH /obras/:obraId
export async function updateObra(req, res) {
  const { obraId } = req.params;
  const { name, status, type, address, city, province, zip, startDate, endDate, autoApprove } = req.body;
  try {
    const result = await pool.query(
      `UPDATE obras SET
        nombre                = CASE WHEN $1::text IS NOT NULL THEN $1 ELSE nombre END,
        estado                = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE estado END,
        type                  = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE type END,
        direccion             = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE direccion END,
        city                  = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE city END,
        province              = CASE WHEN $6::text IS NOT NULL THEN $6 ELSE province END,
        zip                   = CASE WHEN $7::text IS NOT NULL THEN $7 ELSE zip END,
        fecha_inicio          = CASE WHEN $8::text IS NOT NULL THEN $8::date ELSE fecha_inicio END,
        fecha_fin_estimada    = CASE WHEN $9::text IS NOT NULL THEN $9::date ELSE fecha_fin_estimada END,
        aprobacion_automatica = CASE WHEN $11::boolean IS NOT NULL THEN $11 ELSE aprobacion_automatica END
       WHERE id = $10 RETURNING *`,
      [name ?? null, status ?? null, type ?? null, address ?? null,
       city ?? null, province ?? null, zip ?? null,
       startDate ?? null, endDate ?? null, obraId, autoApprove ?? null]
    );
    if (!result.rows[0]) return res.status(404).json({ code: "NOT_FOUND", message: "Obra no encontrada" });
    const full = await pool.query(
      `SELECT o.*,
        (SELECT COUNT(*) FROM alertas a WHERE a.obra_id = o.id AND a.resuelta = false) AS alerts,
        (SELECT COUNT(*) FROM pedidos_materiales p WHERE p.obra_id = o.id AND p.aprobado = false) AS pedidos
       FROM obras o WHERE o.id = $1`, [obraId]
    );
    res.json(await buildObra(full.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// DELETE /obras/:obraId
export async function deleteObra(req, res) {
  const { obraId } = req.params;
  try {
    await pool.query(`DELETE FROM obras WHERE id = $1`, [obraId]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// PATCH /obras/:obraId/starred
export async function toggleStarred(req, res) {
  const { obraId } = req.params;
  const { starred } = req.body;
  try {
    await pool.query(`UPDATE obras SET starred = $1 WHERE id = $2`, [starred, obraId]);
    res.json({ id: obraId, starred });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}