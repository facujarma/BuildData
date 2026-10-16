import { TZ_NEGOCIO } from "./fecha.service.js";

// Estados de pedido que ya comprometen plata pero todavía no llegaron.
export const ESTADOS_COMPROMETIDOS = ["aprobado", "en_camino", "demorado"];
// Estados que entran en la proyección de gasto (incluye los que esperan aprobación).
const ESTADOS_PROYECTADOS = ["pendiente", ...ESTADOS_COMPROMETIDOS];

// Asignado / ejecutado / comprometido por rubro, calculado desde los datos reales.
// - spent: gastos del rubro (solo ARS) + pedidos entregados que todavía no tienen un
//   gasto vinculado (gastos.pedido_id), para no contar dos veces la misma compra.
// - comp: pedidos aprobados o en curso del rubro.
// `db` es el pool o un client con una transacción abierta.
export async function calcularRubros(db, obraId) {
  const { rows } = await db.query(
    `WITH gastos_r AS (
       SELECT rubro_id, SUM(monto) AS total
       FROM gastos
       WHERE obra_id = $1 AND rubro_id IS NOT NULL AND COALESCE(moneda, 'ARS') = 'ARS'
       GROUP BY rubro_id
     ),
     entregados_r AS (
       SELECT pm.rubro_id, SUM(pm.total) AS total
       FROM pedidos_materiales pm
       WHERE pm.obra_id = $1 AND pm.rubro_id IS NOT NULL AND pm.estado = 'entregado'
         AND NOT EXISTS (SELECT 1 FROM gastos g WHERE g.pedido_id = pm.id)
       GROUP BY pm.rubro_id
     ),
     comp_r AS (
       SELECT rubro_id, SUM(total) AS total
       FROM pedidos_materiales
       WHERE obra_id = $1 AND rubro_id IS NOT NULL AND estado = ANY($2)
       GROUP BY rubro_id
     )
     SELECT
       r.id AS rubro_id,
       r.nombre,
       COALESCE(pr.cap, 0) AS cap,
       COALESCE(g.total, 0) + COALESCE(e.total, 0) AS spent,
       COALESCE(c.total, 0) AS comp
     FROM rubros r
     LEFT JOIN presupuesto_rubros pr ON pr.rubro_id = r.id
     LEFT JOIN gastos_r g ON g.rubro_id = r.id
     LEFT JOIN entregados_r e ON e.rubro_id = r.id
     LEFT JOIN comp_r c ON c.rubro_id = r.id
     WHERE r.obra_id = $1
     ORDER BY r.orden ASC NULLS LAST, r.nombre ASC`,
    [obraId, ESTADOS_COMPROMETIDOS]
  );
  // numeric llega como string desde pg
  return rows.map((r) => ({
    rubro_id: r.rubro_id,
    nombre: r.nombre,
    cap: Number(r.cap),
    spent: Number(r.spent),
    comp: Number(r.comp),
  }));
}

export function resumir(rubros) {
  const total = rubros.reduce((a, r) => a + r.cap, 0);
  const ejecutado = rubros.reduce((a, r) => a + r.spent, 0);
  const comprometido = rubros.reduce((a, r) => a + r.comp, 0);
  return { total, ejecutado, comprometido, disponible: total - ejecutado - comprometido };
}

// Proyección de los próximos 3 meses (mes actual incluido, en la TZ del negocio):
// pedidos por fecha_llegada_estimada y tareas no terminadas con costo_estimado
// (por fecha_inicio, o fecha_limite si no tiene inicio). Lo atrasado (fecha de un
// mes anterior) cuenta en el mes actual: es plata que todavía no salió.
export async function proyectarGasto(db, obraId) {
  const { rows } = await db.query(
    `WITH meses AS (
       SELECT generate_series(
         date_trunc('month', (now() AT TIME ZONE $2)::date),
         date_trunc('month', (now() AT TIME ZONE $2)::date) + interval '2 months',
         interval '1 month'
       )::date AS mes
     ),
     actual AS (SELECT min(mes) AS mes FROM meses),
     eventos AS (
       SELECT GREATEST(date_trunc('month', pm.fecha_llegada_estimada)::date, (SELECT mes FROM actual)) AS mes,
              pm.total AS monto, 'pedido' AS tipo,
              COALESCE(r.nombre, 'Sin rubro') AS rubro
       FROM pedidos_materiales pm
       LEFT JOIN rubros r ON r.id = pm.rubro_id
       WHERE pm.obra_id = $1 AND pm.estado = ANY($3) AND pm.fecha_llegada_estimada IS NOT NULL
       UNION ALL
       SELECT GREATEST(date_trunc('month', COALESCE(t.fecha_inicio, t.fecha_limite))::date, (SELECT mes FROM actual)) AS mes,
              t.costo_estimado AS monto, 'tarea' AS tipo,
              COALESCE(r.nombre, 'Sin rubro') AS rubro
       FROM tareas t
       LEFT JOIN rubros r ON r.id = t.rubro_id
       WHERE t.obra_id = $1 AND t.estado NOT IN ('completada', 'cancelada')
         AND COALESCE(t.costo_estimado, 0) > 0
         AND COALESCE(t.fecha_inicio, t.fecha_limite) IS NOT NULL
     )
     SELECT
       to_char(m.mes, 'YYYY-MM') AS mes,
       COALESCE(SUM(e.monto), 0) AS monto,
       COUNT(*) FILTER (WHERE e.tipo = 'pedido') AS pedidos,
       COUNT(*) FILTER (WHERE e.tipo = 'tarea') AS tareas,
       COALESCE(
         (SELECT array_agg(x.rubro ORDER BY x.total DESC)
          FROM (SELECT e2.rubro, SUM(e2.monto) AS total
                FROM eventos e2 WHERE e2.mes = m.mes
                GROUP BY e2.rubro ORDER BY total DESC LIMIT 3) x),
         '{}'
       ) AS rubros
     FROM meses m
     LEFT JOIN eventos e ON e.mes = m.mes
     GROUP BY m.mes
     ORDER BY m.mes`,
    [obraId, TZ_NEGOCIO, ESTADOS_PROYECTADOS]
  );
  return rows.map((r) => ({
    mes: r.mes,
    monto: Number(r.monto),
    pedidos: Number(r.pedidos),
    tareas: Number(r.tareas),
    rubros: r.rubros,
  }));
}
