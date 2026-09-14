import { pool } from "../db.js";

// GET /obras/:obraId/dashboard
export async function getDashboard(req, res) {
  const { obraId } = req.params;
  try {
    // Info básica de la obra
    const obraResult = await pool.query(
      `SELECT nombre, last_activity FROM obras WHERE id = $1`,
      [obraId]
    );
    const obra = obraResult.rows[0];

    // Stats de tareas
    const tareasResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE estado = 'completada') AS completadas,
        COUNT(*) AS total
       FROM tareas WHERE obra_id = $1`,
      [obraId]
    );
    const tareas = tareasResult.rows[0];
    const tareasListResult = await pool.query(
      `SELECT
          id,
          titulo,
          estado,
          prioridad,
          porcentaje_avance,
          fecha_inicio,
          fecha_limite
      FROM tareas
      WHERE obra_id = $1
      ORDER BY created_at DESC`,
      [obraId]
);

    // Stats de alertas
    const alertasResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE severity = 'critical' AND resuelta = false) AS criticas,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND resuelta = false) AS hoy
       FROM alertas WHERE obra_id = $1`,
      [obraId]
    );
    const alertasStats = alertasResult.rows[0];

    // Stats de pedidos
    const pedidosResult = await pool.query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE aprobado = false) AS pendientes
       FROM pedidos_materiales WHERE obra_id = $1`,
      [obraId]
    );
    const pedidos = pedidosResult.rows[0];
    const pedidosResultRaw = await pool.query(
      `SELECT
          id,
          estado,
          aprobado,
          fecha,
          proveedor_id
      FROM pedidos_materiales
      WHERE obra_id = $1
      ORDER BY fecha DESC`,
      [obraId]
    );

const pedidosConItems = await Promise.all(
  pedidosResultRaw.rows.map(async (pedido) => {
    const itemsResult = await pool.query(
      `SELECT
          material_id,
          cantidad,
          precio_unitario
       FROM pedidos_items
       WHERE pedido_id = $1`,
      [pedido.id]
    );

    return {
      ...pedido,
      items: itemsResult.rows,
    };
  })
);

    // Presupuesto
    const presupuestoResult = await pool.query(
      `SELECT
        p.total,
        COALESCE((
          SELECT SUM(pr.spent)
          FROM presupuesto_rubros pr
          JOIN rubros r ON r.id = pr.rubro_id
          WHERE r.obra_id = $1
        ), 0) AS ejecutado,
        p.comprometido,
        p.updated_at
       FROM presupuestos p
       WHERE p.obra_id = $1`,
      [obraId]
    );
    const pres = presupuestoResult.rows[0] || { total: 0, ejecutado: 0, comprometido: 0 };
    const total = pres.total || 1;
    const disponible = pres.total - pres.ejecutado - pres.comprometido;

    // Budget breakdown por rubro
    const rubrosResult = await pool.query(
      `SELECT r.nombre AS name, pr.spent, pr.cap
       FROM rubros r
       JOIN presupuesto_rubros pr ON pr.rubro_id = r.id
       WHERE r.obra_id = $1`,
      [obraId]
    );

    // Trade progress — avance calculado desde las tareas del rubro
    // (promedio simple de porcentaje_avance, excluyendo canceladas).
    const tradeResult = await pool.query(
      `SELECT r.id, r.nombre AS name,
        COALESCE((
          SELECT ROUND(AVG(t.porcentaje_avance))
          FROM tareas t
          WHERE t.rubro_id = r.id AND t.estado <> 'cancelada'
        ), 0)::int AS pct
       FROM rubros r
       WHERE r.obra_id = $1
       ORDER BY r.nombre ASC`,
      [obraId]
    );

    // Activity feed
    const actividadResult = await pool.query(
       `SELECT
        UPPER(LEFT(COALESCE(p.nombre, 'Sistema'), 1) || LEFT(SPLIT_PART(COALESCE(p.nombre, 'Sistema'), ' ', 2), 1)) AS initials,
        COALESCE(p.nombre, 'Sistema') AS name,
        a.accion AS action,
        a.tipo,
        a.texto,
        a.created_at AS timestamp
       FROM actividad a
       LEFT JOIN personas p ON p.id = a.usuario_id
       WHERE a.obra_id = $1
       ORDER BY a.created_at DESC
       LIMIT 5`,
      [obraId]
    );

    // Alertas sin resolver
    const alertasListResult = await pool.query(
      `SELECT id, titulo AS title, subtitulo AS subtitle, created_at AS timestamp, severity
       FROM alertas
       WHERE obra_id = $1 AND resuelta = false
       ORDER BY created_at DESC`,
      [obraId]
    );

        // Comparación semana actual vs semana anterior
    const semanaActualResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM tareas
       WHERE obra_id = $1
       AND fecha_completada >= date_trunc('week', CURRENT_DATE)`,
      [obraId]
    );

    const semanaAnteriorResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM tareas
       WHERE obra_id = $1
       AND fecha_completada >= date_trunc('week', CURRENT_DATE) - interval '1 week'
       AND fecha_completada < date_trunc('week', CURRENT_DATE)`,
      [obraId]
    );

    const semanaActual =
      parseInt(semanaActualResult.rows[0].total) || 0;

    const semanaAnterior =
      parseInt(semanaAnteriorResult.rows[0].total) || 0;

    let avanceDeltaPct = 0;

    if (semanaAnterior > 0) {
      avanceDeltaPct = Math.round(
        ((semanaActual - semanaAnterior) / semanaAnterior) * 100
      );
    } else if (semanaActual > 0) {
      avanceDeltaPct = 100;
    }

    const avanceTotal = tareas.total > 0
      ? Math.round((tareas.completadas / tareas.total) * 100)
      : 0;

    res.json({
      obra: {
        name: obra.nombre,
        lastUpdate: obra.last_activity,
      },
      stats: {
        avanceTotal,
        avanceDeltaPct,        
        alertasCriticas: parseInt(alertasStats.criticas),
        alertasDeltaHoy: parseInt(alertasStats.hoy),
        pedidos: parseInt(pedidos.total),
        pedidosPendientes: parseInt(pedidos.pendientes),
        tareasCompletadas: parseInt(tareas.completadas),
        tareasTotal: parseInt(tareas.total),
      },
      budget: {
        total: pres.total,
        ejecutado: pres.ejecutado,
        disponible,
        ejecutadoPct: Math.round((pres.ejecutado / total) * 100),
        comprometidoPct: Math.round((pres.comprometido / total) * 100),
        librePct: Math.round((disponible / total) * 100),
        updatedAt: pres.updated_at,
      },
      budgetBreakdown: rubrosResult.rows,
      tradeProgress: tradeResult.rows.map(r => ({ ...r, pct: parseInt(r.pct) })),
      activityFeed: actividadResult.rows,
      alerts: alertasListResult.rows,
      tasks: tareasListResult.rows,
      orders: pedidosConItems,    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}