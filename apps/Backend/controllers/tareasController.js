import { pool } from "../db.js";
import { resolvePersonaIdByTelefono } from "../services/personaService.js";
import { guardarEmbedding } from "../services/embeddings.service.js";

const ESTADOS_VALIDOS = ["pendiente", "en_progreso", "completada", "cancelada"];
const PRIORIDADES_VALIDAS = ["baja", "media", "alta", "urgente"];

// Resuelve el id de miembros_obra para una persona dentro de una obra específica.
// asignado_a y completada_por en `tareas` ahora referencian miembros_obra(id),
// no personas(id) directamente — esto centraliza esa resolución.
async function resolveMiembroObraId(personaId, obraId) {
  if (!personaId || !obraId) return null;
  const { rows } = await pool.query(
    `SELECT id FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2`,
    [personaId, obraId]
  );
  return rows[0]?.id ?? null;
}

// GET /tareas/:obra_id — reportes granulares de una obra
export async function getTareas(req, res) {
  const { obra_id } = req.params;
  try {
    const tareas = await pool.query(
      `SELECT t.*,
              p.nombre AS usuario_nombre,
              r.nombre AS rubro_nombre,
              pa.nombre AS asignado_a_nombre,
              pc.nombre AS completada_por_nombre,
              COALESCE((
                SELECT array_agg(td.depende_de ORDER BY td.depende_de)
                FROM tareas_dependencias td
                WHERE td.tarea_id = t.id
              ), '{}') AS dependencias
       FROM tareas t
       LEFT JOIN personas p ON t.usuario_id = p.id
       LEFT JOIN rubros r ON t.rubro_id = r.id
       LEFT JOIN miembros_obra moa ON t.asignado_a = moa.id
       LEFT JOIN personas pa ON moa.persona_id = pa.id
       LEFT JOIN miembros_obra moc ON t.completada_por = moc.id
       LEFT JOIN personas pc ON moc.persona_id = pc.id
       WHERE t.obra_id = $1
       ORDER BY t.fecha_inicio ASC, t.created_at ASC`,
      [obra_id]
    );
    res.json(tareas.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo tareas" });
  }
}

// Valida rubro_id (existe) y resuelve asignado_a de persona_id -> miembro_obra_id.
// Devuelve { error } o { miembroObraId }.
async function validarYResolverReferencias({ rubro_id, asignado_a, obra_id }) {
  if (rubro_id) {
    const rubro = await pool.query(`SELECT id FROM rubros WHERE id = $1`, [rubro_id]);
    if (rubro.rows.length === 0) return { error: "rubro_id no encontrado" };
  }

  let miembroObraId = null;
  if (asignado_a) {
    miembroObraId = await resolveMiembroObraId(asignado_a, obra_id);
    if (!miembroObraId) {
      return { error: "asignado_a no es miembro de esta obra" };
    }
  }

  return { miembroObraId };
}

// POST /tareas — crear reporte granular (usado por QuickAddModal)
export async function crearTarea(req, res) {
  const {
    obra_id,
    titulo,
    descripcion,
    rubro_id,
    prioridad,
    fecha_inicio,
    fecha_limite,
    asignado_a, // persona_id — se resuelve a miembro_obra_id internamente
    costo_estimado,
  } = req.body;

  if (!obra_id || !titulo || !titulo.trim()) {
    return res.status(400).json({ error: "obra_id y titulo son requeridos" });
  }
  if (!fecha_inicio) {
    return res.status(400).json({ error: "fecha_inicio es requerida" });
  }
  if (prioridad && !PRIORIDADES_VALIDAS.includes(prioridad)) {
    return res.status(400).json({ error: `prioridad inválida. Usar: ${PRIORIDADES_VALIDAS.join(", ")}` });
  }

  try {
    const { error: errorRef, miembroObraId } = await validarYResolverReferencias({
      rubro_id,
      asignado_a,
      obra_id,
    });
    if (errorRef) return res.status(404).json({ error: errorRef });

    const personaId = req.personaId || null;
    const result = await pool.query(
      `INSERT INTO tareas
         (obra_id, titulo, descripcion, rubro_id, usuario_id, created_by,
          prioridad, fecha_inicio, fecha_limite, asignado_a, costo_estimado)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        obra_id,
        titulo,
        descripcion || null,
        rubro_id || null,
        personaId,
        prioridad || null,
        fecha_inicio,
        fecha_limite || null,
        miembroObraId,
        costo_estimado || null,
      ]
    );
    await guardarEmbedding("tarea", result.rows[0].id, result.rows[0].titulo);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando tarea" });
  }
}

// POST /bot/tareas — el bot crea un reporte a partir de un mensaje de un obrero.
// obra_id llega resuelto por el poll de obra; rubro_id y asignado_a ya llegan
// resueltos por el pipeline de entidades (pgvector + pg_trgm) como persona_id —
// acá NO se resuelve texto libre, solo se validan/resuelven las UUIDs recibidas.
export async function crearTareaDesdeBot(req, res) {
  const {
    obra_id,
    titulo,
    descripcion,
    rubro_id,
    creada_por,
    creada_por_telefono,
    prioridad,
    fecha_limite,
    asignado_a, // persona_id
  } = req.body;

  if (!obra_id || !titulo || !titulo.trim()) {
    return res.status(400).json({ error: "obra_id y titulo son requeridos" });
  }
  if (titulo.length > 150) {
    return res.status(400).json({ error: "titulo no puede superar los 150 caracteres" });
  }
  if (prioridad && !PRIORIDADES_VALIDAS.includes(prioridad)) {
    return res.status(400).json({ error: `prioridad inválida. Usar: ${PRIORIDADES_VALIDAS.join(", ")}` });
  }

  try {
    const obra = await pool.query(`SELECT id FROM obras WHERE id = $1`, [obra_id]);
    if (obra.rows.length === 0) {
      return res.status(404).json({ error: "obra_id no encontrada" });
    }

    const { error: errorRef, miembroObraId } = await validarYResolverReferencias({
      rubro_id,
      asignado_a,
      obra_id,
    });
    if (errorRef) return res.status(404).json({ error: errorRef });

    // El bot siempre manda teléfono (nunca uuid) para creada_por.
    // created_by/usuario_id se quedan a nivel personas (Opción A).
    let usuarioId = creada_por || null;
    if (!usuarioId && creada_por_telefono) {
      usuarioId = await resolvePersonaIdByTelefono(creada_por_telefono);
      if (!usuarioId) {
        return res.status(404).json({ error: "creada_por_telefono no resuelve a ningún obrero" });
      }
    }

    // fecha_inicio es NOT NULL: las tareas del bot arrancan hoy por defecto.
    const result = await pool.query(
      `INSERT INTO tareas
         (obra_id, titulo, descripcion, rubro_id, usuario_id, created_by,
          prioridad, fecha_inicio, fecha_limite, asignado_a)
       VALUES ($1, $2, $3, $4, $5, $5, $6, CURRENT_DATE, $7, $8)
       RETURNING *`,
      [
        obra_id,
        titulo,
        descripcion || null,
        rubro_id || null,
        usuarioId,
        prioridad || null,
        fecha_limite || null,
        miembroObraId,
      ]
    );
    await guardarEmbedding("tarea", result.rows[0].id, result.rows[0].titulo);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando tarea desde bot" });
  }
}

// PATCH /tareas/:id — corregir/actualizar campos de una tarea.
// No maneja completar la tarea (ver completarTarea) para no permitir
// que el cliente falsifique completada_por / fecha_completada.
// Acepta además porcentaje_avance (0-100) y dependencias (array de uuid,
// replace-all: lo enviado reemplaza el set completo). Si se cambia el estado
// desde 'completada' a otro valor, se limpian completada_por/fecha_completada.
export async function actualizarTarea(req, res) {
  const { id } = req.params;
  const {
    titulo,
    descripcion,
    rubro_id,
    estado,
    prioridad,
    fecha_inicio,
    fecha_limite,
    asignado_a, // persona_id
    costo_estimado,
    porcentaje_avance,
    dependencias, // uuid[] de tareas de las que depende
  } = req.body;

  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `estado inválido. Usar: ${ESTADOS_VALIDOS.join(", ")}` });
  }
  if (estado === "completada") {
    return res.status(400).json({
      error: "Para completar una tarea usá POST /tareas/:id/completar",
    });
  }
  if (prioridad && !PRIORIDADES_VALIDAS.includes(prioridad)) {
    return res.status(400).json({ error: `prioridad inválida. Usar: ${PRIORIDADES_VALIDAS.join(", ")}` });
  }

  let pct = null;
  if (porcentaje_avance !== undefined && porcentaje_avance !== null) {
    pct = Number(porcentaje_avance);
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ error: "porcentaje_avance debe ser un entero entre 0 y 100" });
    }
  }

  // dependencias debe ser array de strings (uuids) si viene
  if (dependencias !== undefined && (!Array.isArray(dependencias) || dependencias.some((d) => typeof d !== "string"))) {
    return res.status(400).json({ error: "dependencias debe ser un array de ids de tareas" });
  }

  try {
    // Necesitamos obra_id de la tarea para resolver asignado_a -> miembro_obra_id
    const tareaActual = await pool.query(`SELECT obra_id FROM tareas WHERE id = $1`, [id]);
    if (tareaActual.rows.length === 0) {
      return res.status(404).json({ error: "tarea no encontrada" });
    }
    const obraId = tareaActual.rows[0].obra_id;

    const { error: errorRef, miembroObraId } = await validarYResolverReferencias({
      rubro_id,
      asignado_a,
      obra_id: obraId,
    });
    if (errorRef) return res.status(404).json({ error: errorRef });

    // Validar que las dependencias sean tareas de la misma obra y no generen auto-dependencia
    if (Array.isArray(dependencias) && dependencias.length > 0) {
      if (dependencias.includes(id)) {
        return res.status(400).json({ error: "una tarea no puede depender de sí misma" });
      }
      const validas = await pool.query(
        `SELECT COUNT(*)::int AS n FROM tareas WHERE id = ANY($1::uuid[]) AND obra_id = $2`,
        [dependencias, obraId]
      );
      if (validas.rows[0].n !== dependencias.length) {
        return res.status(404).json({ error: "alguna dependencia no existe o no pertenece a esta obra" });
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Cambiar el estado fuera de 'completada' implica reabrir: limpiar datos de completado.
      const reabrir = Boolean(estado);

      const result = await client.query(
        `UPDATE tareas
         SET titulo = COALESCE($1, titulo),
             descripcion = COALESCE($2, descripcion),
             rubro_id = COALESCE($3, rubro_id),
             estado = COALESCE($4, estado),
             prioridad = COALESCE($5, prioridad),
             fecha_inicio = COALESCE($6, fecha_inicio),
             fecha_limite = COALESCE($7, fecha_limite),
             asignado_a = COALESCE($8, asignado_a),
             costo_estimado = COALESCE($9, costo_estimado),
             porcentaje_avance = COALESCE($10, porcentaje_avance)
             ${reabrir ? ", completada_por = NULL, fecha_completada = NULL" : ""}
         WHERE id = $11
         RETURNING *`,
        [
          titulo,
          descripcion,
          rubro_id,
          estado,
          prioridad,
          fecha_inicio,
          fecha_limite,
          miembroObraId,
          costo_estimado,
          pct,
          id,
        ]
      );

      // Replace-all del set de dependencias (solo si el campo vino en el body)
      if (Array.isArray(dependencias)) {
        await client.query(`DELETE FROM tareas_dependencias WHERE tarea_id = $1`, [id]);
        for (const depId of dependencias) {
          await client.query(
            `INSERT INTO tareas_dependencias (tarea_id, depende_de) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, depId]
          );
        }
      }

      await client.query("COMMIT");
      if (titulo) {
        await guardarEmbedding("tarea", id, result.rows[0].titulo);
      }
      res.json(result.rows[0]);
    } catch (txError) {
      await client.query("ROLLBACK");
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando tarea" });
  }
}

// POST /tareas/:id/completar — completar desde la web.
// completada_por sale del usuario autenticado (req.personaId), nunca del body,
// y se resuelve a miembro_obra_id contra la obra de la tarea.
export async function completarTarea(req, res) {
  const { id } = req.params;
  const personaId = req.personaId;

  if (!personaId) {
    return res.status(401).json({ error: "No se pudo identificar al usuario que completa la tarea" });
  }

  try {
    const tarea = await pool.query(`SELECT obra_id FROM tareas WHERE id = $1`, [id]);
    if (tarea.rows.length === 0) {
      return res.status(404).json({ error: "tarea no encontrada" });
    }

    const miembroObraId = await resolveMiembroObraId(personaId, tarea.rows[0].obra_id);
    if (!miembroObraId) {
      return res.status(403).json({ error: "El usuario no es miembro de la obra de esta tarea" });
    }

    const result = await pool.query(
      `UPDATE tareas
       SET estado = 'completada',
           completada_por = $1,
           fecha_completada = CURRENT_TIMESTAMP,
           porcentaje_avance = 100
       WHERE id = $2
       RETURNING *`,
      [miembroObraId, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error completando tarea" });
  }
}

// POST /bot/tareas/:id/completar — completar desde el bot de WhatsApp.
// Recibe teléfono (nunca uuid), se resuelve a persona y luego a miembro_obra
// contra la obra de la tarea puntual. Soporta revertir con completada=false.
export async function completarTareaDesdeBot(req, res) {
  const { id } = req.params;
  const { telefono, completada, porcentaje_avance, mensaje_id } = req.body;

  if (!telefono) {
    return res.status(400).json({ error: "telefono es requerido" });
  }

  let pct = null;
  if (porcentaje_avance !== undefined && porcentaje_avance !== null) {
    pct = Number(porcentaje_avance);
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ error: "porcentaje_avance debe ser un entero entre 0 y 100" });
    }
  }

  try {
    const tarea = await pool.query(`SELECT obra_id FROM tareas WHERE id = $1`, [id]);
    if (tarea.rows.length === 0) {
      return res.status(404).json({ error: "tarea no encontrada" });
    }

    const personaId = await resolvePersonaIdByTelefono(telefono);
    if (!personaId) {
      return res.status(404).json({ error: "telefono no resuelve a ningún obrero" });
    }

    const miembroObraId = await resolveMiembroObraId(personaId, tarea.rows[0].obra_id);
    if (!miembroObraId) {
      return res.status(403).json({ error: "El obrero no es miembro de la obra de esta tarea" });
    }

    // completada=false → revertir la marca anterior (reabrir); default → completar.
    const completar = completada !== false;

    let result;
    if (completar) {
      result = await pool.query(
        `UPDATE tareas
         SET estado = 'completada',
             completada_por = $1,
             fecha_completada = CURRENT_TIMESTAMP,
             porcentaje_avance = COALESCE($2, 100)
         WHERE id = $3
         RETURNING *`,
        [miembroObraId, pct, id]
      );
    } else {
      result = await pool.query(
        `UPDATE tareas
         SET estado = 'pendiente',
             completada_por = NULL,
             fecha_completada = NULL,
             porcentaje_avance = COALESCE($1, 0)
         WHERE id = $2
         RETURNING *`,
        [pct, id]
      );
    }
    if (mensaje_id) {
      await pool.query(
        `UPDATE mensajes SET estado_procesamiento = 'procesado' WHERE id = $1`,
        [mensaje_id]
      );
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error completando tarea desde bot" });
  }
}