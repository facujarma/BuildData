import { pool } from "../db.js";
import { registrarActividad } from "../services/actividad.service.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";
import { resolvePersonaIdByTelefono } from "../services/personaService.js";

const DIAS_INACTIVIDAD = 7;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TIPOS_ALERTA = new Set([
  "problema",
  "seguridad",
  "material",
  "calidad",
  "clima",
  "otro",
  "reporte",
]);
const PRIORIDADES = new Set(["baja", "media", "alta", "urgente"]);
const SEVERITY_POR_PRIORIDAD = {
  baja: "attention",
  media: "attention",
  alta: "attention",
  urgente: "critical",
};

function texto(valor, max) {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio ? limpio.slice(0, max) : null;
}

// Chequeo periódico (ver setInterval en server.js). Una obra 'activa' sin mensajes del bot
// en los últimos DIAS_INACTIVIDAD días genera una alerta 'inactividad' — no duplica si ya
// hay una sin resolver. Se cierra sola en botController.recibirMensaje cuando vuelve a haber
// actividad. Obras que nunca usaron el bot (sin mensajes) quedan afuera: no es "inactividad",
// es que todavía no se sumaron al bot.
export async function verificarInactividad() {
  try {
    const obras = await pool.query(
      `SELECT o.id, o.nombre,
        (SELECT MAX(m.created_at) FROM mensajes m WHERE m.obra_id = o.id) AS ultimo_mensaje
       FROM obras o
       WHERE o.estado = 'activa'`
    );

    for (const obra of obras.rows) {
      if (!obra.ultimo_mensaje) continue;

      const diasInactiva = (Date.now() - new Date(obra.ultimo_mensaje).getTime()) / 86400000;
      if (diasInactiva < DIAS_INACTIVIDAD) continue;

      const yaAlertada = await pool.query(
        `SELECT id FROM alertas WHERE obra_id = $1 AND tipo = 'inactividad' AND resuelta = false`,
        [obra.id]
      );
      if (yaAlertada.rows.length > 0) continue;

      await pool.query(
        `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, titulo, subtitulo, severity)
         VALUES ($1, 'inactividad', $2, 'media', 'Obra sin actividad', $3, 'attention')`,
        [obra.id, `La obra "${obra.nombre}" no tiene actividad del bot hace más de ${DIAS_INACTIVIDAD} días`, `Sin mensajes del bot hace más de ${DIAS_INACTIVIDAD} días`]
      );
    }
  } catch (error) {
    console.error("[verificarInactividad] error:", error);
  }
}

// GET /alertas/:obra_id — alertas sin resolver
export async function getAlertas(req, res) {
  const { obra_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT a.*, u.nombre as destinatario
       FROM alertas a
       LEFT JOIN personas u ON a.usuario_id = u.id
       WHERE a.obra_id = $1 AND a.resuelta = false
       ORDER BY a.created_at DESC`,
      [obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo alertas" });
  }
}

// PATCH /alertas/:id/resolver
export async function resolverAlerta(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE alertas SET resuelta = true WHERE id = $1 RETURNING *`,
      [id]
    );
    const alerta = result.rows[0];
    if (alerta) {
      await registrarActividad(pool, {
        obraId: alerta.obra_id,
        usuarioId: req.personaId || null,
        tipo: "problema",
        accion: "resolvió una alerta",
        texto: `Resolvió la alerta "${alerta.titulo || alerta.mensaje || alerta.tipo}"`,
        entidadTipo: "alerta",
        entidadId: alerta.id,
        tags: alerta.severity === "critical" ? ["Crítico", "Resuelta"] : ["Resuelta"],
      });
    }
    res.json(alerta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error resolviendo alerta" });
  }
}

// POST /alertas — crear alerta (web)
export async function crearAlerta(req, res) {
  const { obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity || 'attention']
    );
    const alerta = result.rows[0];
    await registrarActividad(pool, {
      obraId: alerta.obra_id,
      usuarioId: req.personaId || null,
      tipo: "problema",
      accion: "reportó un problema",
      texto: `Reportó: ${alerta.titulo || alerta.mensaje || alerta.tipo}`,
      entidadTipo: "alerta",
      entidadId: alerta.id,
      tags: alerta.severity === "critical" ? ["Crítico"] : [],
    });
    res.status(201).json(alerta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando alerta" });
  }
}

// POST /bot/alertas — el bot WhatsApp reporta un problema/alerta de la obra.
// Body: { obra_id, telefono, mensaje, titulo?, tipo?, prioridad? }
export async function crearAlertaDesdeBot(req, res) {
  const { obra_id, telefono } = req.body;
  const mensaje = texto(req.body.mensaje, 2000);
  if (!obra_id || !telefono || !mensaje) {
    return res
      .status(400)
      .json({ error: "obra_id, telefono y mensaje son requeridos" });
  }
  // Un id mal formado haría explotar el cast a uuid de Postgres (500): se corta antes.
  if (!UUID_RE.test(String(obra_id))) {
    return res.status(400).json({ error: "obra_id debe ser UUID" });
  }

  try {
    const personaId = await resolvePersonaIdByTelefono(telefono);
    if (!personaId) {
      return res
        .status(404)
        .json({ error: "telefono no resuelve a ningún obrero" });
    }
    // Obra inexistente → 404 (sin esto esMiembroDeObra la rechazaría como 403)
    const obra = await pool.query(`SELECT 1 FROM obras WHERE id = $1`, [obra_id]);
    if (obra.rows.length === 0) {
      return res.status(404).json({ error: "obra no encontrada" });
    }
    if (!(await esMiembroDeObra(personaId, obra_id))) {
      return res.status(403).json({ error: "No pertenecés a esta obra" });
    }

    const tipoCrudo = texto(req.body.tipo, 40)?.toLowerCase() ?? "reporte";
    const tipo = TIPOS_ALERTA.has(tipoCrudo) ? tipoCrudo : "reporte";
    const prioridadCruda =
      texto(req.body.prioridad, 20)?.toLowerCase() ?? "media";
    const prioridad = PRIORIDADES.has(prioridadCruda)
      ? prioridadCruda
      : "media";
    const severity = SEVERITY_POR_PRIORIDAD[prioridad];
    const titulo = texto(req.body.titulo, 200) ?? mensaje.slice(0, 120);

    const { rows } = await pool.query(
      `INSERT INTO alertas
         (obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        obra_id,
        tipo,
        mensaje,
        prioridad,
        personaId,
        titulo,
        "Reportado por WhatsApp",
        severity,
      ]
    );
    const alerta = rows[0];

    await registrarActividad(pool, {
      obraId: obra_id,
      usuarioId: personaId,
      tipo: "problema",
      accion: "reportó una alerta",
      texto: `Reportó: ${titulo}`,
      entidadTipo: "alerta",
      entidadId: alerta.id,
      tags: severity === "critical" ? ["Crítico", "Alerta"] : ["Alerta"],
    });

    res.status(201).json(alerta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
