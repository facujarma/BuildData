import { pool } from "../db.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";
import { registrarActividad } from "../services/actividad.service.js";
import { RANGOS, SECCIONES, calcularSnapshot, armarReporte } from "../services/reportes.service.js";

const RANGO_LABEL = { semana: "Última semana", mes: "Último mes", trimestre: "Último trimestre", total: "Toda la obra" };

const sinAcceso = (res) => res.status(403).json({ error: "No pertenecés a esta obra" });

// GET /reportes/:obra_id — historial de reportes generados (sin el payload completo)
export async function getReportes(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    const result = await pool.query(
      `SELECT r.id, r.titulo, r.contenido, r.rango, r.secciones, r.fecha_generacion,
              p.nombre AS generado_por_nombre
       FROM reportes r
       LEFT JOIN personas p ON p.id = r.generado_por
       WHERE r.obra_id = $1
       ORDER BY r.fecha_generacion DESC`,
      [obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo reportes" });
  }
}

// GET /reportes/:obra_id/snapshot?rango=semana|mes|trimestre|total — KPIs de la portada
export async function getSnapshot(req, res) {
  const { obra_id } = req.params;
  const rango = req.query.rango || "mes";
  if (!RANGOS.includes(rango)) {
    return res.status(400).json({ error: `rango inválido. Usar: ${RANGOS.join(", ")}` });
  }
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    res.json(await calcularSnapshot(pool, obra_id, rango, req.perfilObra?.permisos?.web));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error calculando el reporte" });
  }
}

// POST /reportes/:obra_id/generar — Body: { rango, secciones: string[] }
// Arma el reporte con las secciones pedidas, lo guarda congelado en `reportes.snapshot`
// (queda la foto de ese momento aunque los datos cambien después), lo registra en la
// bitácora y devuelve el payload completo para descargar/imprimir.
export async function generarReporte(req, res) {
  const { obra_id } = req.params;
  const rango = req.body.rango || "mes";
  const secciones = Array.isArray(req.body.secciones) ? req.body.secciones : [];
  if (!RANGOS.includes(rango)) {
    return res.status(400).json({ error: `rango inválido. Usar: ${RANGOS.join(", ")}` });
  }
  const invalidas = secciones.filter((s) => !SECCIONES.includes(s));
  if (secciones.length === 0 || invalidas.length > 0) {
    return res.status(400).json({ error: `secciones inválidas o vacías. Usar: ${SECCIONES.join(", ")}` });
  }

  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);

    const reporte = await armarReporte(pool, obra_id, rango, secciones, req.perfilObra?.permisos?.web);
    const titulo = `Reporte ${reporte.snapshot.obra} · ${RANGO_LABEL[rango]}`;
    const s = reporte.snapshot;
    const contenido =
      `Avance ${s.avance}% · tareas ${s.tareas.done}/${s.tareas.total} completas, ${s.tareas.late} atrasadas · ` +
      `${s.alertas} alertas activas · ${s.pedidos} pedidos en el período`;

    const guardado = await pool.query(
      `INSERT INTO reportes (obra_id, titulo, contenido, rango, secciones, snapshot, generado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, fecha_generacion`,
      [obra_id, titulo, contenido, rango, Object.keys(reporte.secciones), JSON.stringify(reporte), req.personaId || null]
    );

    await registrarActividad(pool, {
      obraId: obra_id,
      usuarioId: req.personaId || null,
      tipo: "cierre",
      accion: "generó un reporte",
      texto: `Generó el reporte de obra (${RANGO_LABEL[rango].toLowerCase()}, ${secciones.length} secciones)`,
      entidadTipo: "reporte",
      entidadId: guardado.rows[0].id,
      tags: ["Reporte"],
    });

    res.status(201).json({
      id: guardado.rows[0].id,
      titulo,
      fecha_generacion: guardado.rows[0].fecha_generacion,
      ...reporte,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando el reporte" });
  }
}

// POST /reportes — crear reporte (lo va a llamar el sistema automáticamente cada semana)
export async function crearReporte(req, res) {
  const { obra_id, titulo, contenido } = req.body;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    const result = await pool.query(
      `INSERT INTO reportes (obra_id, titulo, contenido)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [obra_id, titulo, contenido]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando reporte" });
  }
}
