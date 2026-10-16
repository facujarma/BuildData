import { pool } from "../db.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";
import { calcularRubros, resumir, proyectarGasto } from "../services/presupuesto.service.js";

const MOTIVO_MIN = 10;

const sinAcceso = (res) =>
  res.status(403).json({ code: "FORBIDDEN", message: "No pertenecés a esta obra" });

// GET /presupuestos/:obra_id
// Devuelve { resumen, rubros: [{rubro_id, nombre, cap, spent, comp}], auditLog, forecast }.
// Ejecutado y comprometido se calculan desde gastos y pedidos (ver presupuesto.service.js).
export async function getPresupuesto(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);

    const [rubros, forecast, ajustes] = await Promise.all([
      calcularRubros(pool, obra_id),
      proyectarGasto(pool, obra_id),
      pool.query(
        `SELECT a.id, a.created_at, a.motivo, a.cambios, a.total_anterior, a.total_nuevo,
                COALESCE(p.nombre, 'Sistema') AS usuario_nombre
         FROM presupuesto_ajustes a
         LEFT JOIN personas p ON p.id = a.usuario_id
         WHERE a.obra_id = $1
         ORDER BY a.created_at DESC
         LIMIT 50`,
        [obra_id]
      ),
    ]);

    res.json({
      resumen: resumir(rubros),
      rubros,
      forecast,
      auditLog: ajustes.rows.map((a) => ({
        ...a,
        total_anterior: Number(a.total_anterior),
        total_nuevo: Number(a.total_nuevo),
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// PUT /presupuestos/:obra_id/rubros
// Body: { cambios: [{ rubro_id, cap }], reason }
// Ajusta los topes por rubro, recalcula presupuestos.total y deja el ajuste en el historial.
export async function ajustarRubros(req, res) {
  const { obra_id } = req.params;
  const { cambios } = req.body;
  const motivo = typeof req.body.reason === "string" ? req.body.reason.trim() : "";

  if (motivo.length < MOTIVO_MIN) {
    return res.status(400).json({ code: "VALIDATION", message: `El motivo debe tener al menos ${MOTIVO_MIN} caracteres` });
  }
  if (!Array.isArray(cambios) || cambios.length === 0) {
    return res.status(400).json({ code: "VALIDATION", message: "cambios debe ser un array no vacío" });
  }
  const capPorRubro = new Map();
  for (const c of cambios) {
    const cap = Number(c?.cap);
    if (!c?.rubro_id || !Number.isFinite(cap) || cap < 0) {
      return res.status(400).json({ code: "VALIDATION", message: "Cada cambio necesita rubro_id y un cap >= 0" });
    }
    capPorRubro.set(c.rubro_id, cap);
  }

  let client;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);

    client = await pool.connect();
    await client.query("BEGIN");
    // Serializa ajustes concurrentes de la misma obra
    await client.query(`SELECT 1 FROM obras WHERE id = $1 FOR UPDATE`, [obra_id]);

    const actuales = await calcularRubros(client, obra_id);
    const porId = new Map(actuales.map((r) => [r.rubro_id, r]));

    const ajustados = [];
    const invalidos = [];
    for (const [rubroId, cap] of capPorRubro) {
      const rubro = porId.get(rubroId);
      if (!rubro) {
        await client.query("ROLLBACK");
        return res.status(400).json({ code: "VALIDATION", message: "Hay rubros que no pertenecen a esta obra" });
      }
      if (cap === rubro.cap) continue;
      if (cap < rubro.spent) invalidos.push(rubro.nombre);
      ajustados.push({ rubro_id: rubroId, nombre: rubro.nombre, cap_anterior: rubro.cap, cap_nuevo: cap });
    }

    if (invalidos.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        code: "BELOW_SPENT",
        message: `El monto no puede quedar por debajo de lo ya ejecutado: ${invalidos.join(", ")}`,
      });
    }
    if (ajustados.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ code: "VALIDATION", message: "No hay cambios para guardar" });
    }

    for (const a of ajustados) {
      const upd = await client.query(
        `UPDATE presupuesto_rubros SET cap = $1, updated_at = now() WHERE rubro_id = $2`,
        [a.cap_nuevo, a.rubro_id]
      );
      if (upd.rowCount === 0) {
        await client.query(`INSERT INTO presupuesto_rubros (rubro_id, cap) VALUES ($1, $2)`, [a.rubro_id, a.cap_nuevo]);
      }
    }

    const despues = actuales.map((r) =>
      capPorRubro.has(r.rubro_id) ? { ...r, cap: capPorRubro.get(r.rubro_id) } : r
    );
    const antes = resumir(actuales);
    const resumen = resumir(despues);

    const upd = await client.query(
      `UPDATE presupuestos SET total = $1, ejecutado = $2, comprometido = $3, updated_at = now()
       WHERE obra_id = $4`,
      [resumen.total, resumen.ejecutado, resumen.comprometido, obra_id]
    );
    if (upd.rowCount === 0) {
      await client.query(
        `INSERT INTO presupuestos (obra_id, total, ejecutado, comprometido) VALUES ($1, $2, $3, $4)`,
        [obra_id, resumen.total, resumen.ejecutado, resumen.comprometido]
      );
    }

    await client.query(
      `INSERT INTO presupuesto_ajustes (obra_id, usuario_id, motivo, cambios, total_anterior, total_nuevo)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [obra_id, req.personaId || null, motivo, JSON.stringify(ajustados), antes.total, resumen.total]
    );

    const texto =
      ajustados.length === 1
        ? `${ajustados[0].nombre}: ${ajustados[0].cap_anterior} → ${ajustados[0].cap_nuevo}. Motivo: ${motivo}`
        : `${ajustados.length} rubros, total ${antes.total} → ${resumen.total}. Motivo: ${motivo}`;
    await client.query(
      `INSERT INTO actividad (obra_id, usuario_id, accion, tipo, texto)
       VALUES ($1, $2, 'ajustó el presupuesto', 'Presupuesto', $3)`,
      [obra_id, req.personaId || null, texto]
    );

    await client.query("COMMIT");
    res.json({ resumen, rubros: despues });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  } finally {
    if (client) client.release();
  }
}
