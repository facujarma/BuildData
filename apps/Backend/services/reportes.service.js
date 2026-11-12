// Datos de los reportes de obra (pantalla Reportes): el snapshot de KPIs y el detalle de
// cada sección, filtrados por período. Lo usa controllers/reportesController.js.
// `db` debe ser el pool: varias consultas corren en paralelo (Promise.all), y un client
// de transacción no admite consultas simultáneas.

import { TZ_NEGOCIO } from "./fecha.service.js";
import { calcularRubros, resumir } from "./presupuesto.service.js";

export const RANGOS = ["semana", "mes", "trimestre", "total"];
export const SECCIONES = [
  "resumen", "avance", "presupuesto", "cronograma", "alertas",
  "pedidos", "stock", "recibos", "equipo", "actividad",
];

const DIAS_POR_RANGO = { semana: 7, mes: 30, trimestre: 90 };
const LIMITE_FILAS = 500; // tope por sección para que el reporte no crezca sin límite

// Secciones que exponen costos o inventario interno: sin el permiso web
// correspondiente no se arman (un rol con `reportes.exportar` pero sin
// `presupuesto.ver` no puede pedirlas por body).
const SECCION_PERMISO = {
  presupuesto: "presupuesto.ver",
  pedidos: "pedidos.ver",
  stock: "stock.ver",
  recibos: "recibos.ver",
};

// Fail closed: solo la clave explícitamente habilitada cuenta.
const puedeVer = (permisosWeb, permiso) => permisosWeb?.[permiso] === true;

// Fecha desde la que cuenta el período (YYYY-MM-DD, en la TZ del negocio), o null para "total".
// Ej: rango 'semana' el 28/10 → '2026-10-21'.
export async function desdeDelRango(db, rango) {
  const dias = DIAS_POR_RANGO[rango];
  if (!dias) return null;
  const { rows } = await db.query(
    `SELECT to_char((now() AT TIME ZONE $1)::date - $2::int, 'YYYY-MM-DD') AS desde`,
    [TZ_NEGOCIO, dias]
  );
  return rows[0].desde;
}

// Condición SQL "este instante (timestamptz) cae dentro del período". $n es el param `desde`:
// si es NULL (rango total) no filtra. El inicio del día se toma en la TZ del negocio.
const enPeriodo = (col, n) => `($${n}::date IS NULL OR ${col} >= ($${n}::date::timestamp AT TIME ZONE '${TZ_NEGOCIO}'))`;
// Lo mismo para columnas de tipo date (fechas de calendario)
const fechaEnPeriodo = (col, n) => `($${n}::date IS NULL OR ${col} >= $${n}::date)`;

// Ejecutado en el período con la misma regla que Presupuesto (presupuesto.service.js):
// gastos ARS con rubro + pedidos entregados sin gasto vinculado.
async function ejecutadoEnPeriodo(db, obraId, desde) {
  const { rows } = await db.query(
    `SELECT
       COALESCE((SELECT SUM(monto) FROM gastos
                 WHERE obra_id = $1 AND rubro_id IS NOT NULL AND COALESCE(moneda, 'ARS') = 'ARS'
                   AND ${fechaEnPeriodo("fecha", 2)}), 0)
     + COALESCE((SELECT SUM(pm.total) FROM pedidos_materiales pm
                 WHERE pm.obra_id = $1 AND pm.rubro_id IS NOT NULL AND pm.estado = 'entregado'
                   AND NOT EXISTS (SELECT 1 FROM gastos g WHERE g.pedido_id = pm.id)
                   AND ${enPeriodo("pm.fecha_entrega", 2)}), 0) AS ejecutado`,
    [obraId, desde]
  );
  return Number(rows[0].ejecutado);
}

// KPIs de la portada del reporte. Los conteos de estado (tareas, stock, recibos pendientes,
// equipo, alertas activas) son la foto de HOY; ejecutado, pedidos, alertas nuevas y tareas
// completadas se acotan al período.
// `permisosWeb` es la matriz web del que pide el reporte (req.perfilObra.permisos.web):
// los campos de costos/inventario se omiten si falta el permiso. Fail closed.
export async function calcularSnapshot(db, obraId, rango, permisosWeb = {}) {
  const verPresupuesto = puedeVer(permisosWeb, "presupuesto.ver");
  const desde = await desdeDelRango(db, rango);
  const [obra, rubros, ejecutadoPeriodo, conteos] = await Promise.all([
    db.query(`SELECT nombre, code FROM obras WHERE id = $1`, [obraId]),
    verPresupuesto ? calcularRubros(db, obraId) : [],
    // El ejecutado del período solo se consulta si se va a poder mostrar.
    verPresupuesto && rango !== "total" ? ejecutadoEnPeriodo(db, obraId, desde) : null,
    db.query(
      `SELECT
         (SELECT COALESCE(ROUND(AVG(porcentaje_avance)), 0)::int FROM tareas
            WHERE obra_id = $1 AND estado <> 'cancelada') AS avance,
         (SELECT count(*)::int FROM tareas WHERE obra_id = $1 AND estado <> 'cancelada') AS t_total,
         (SELECT count(*)::int FROM tareas WHERE obra_id = $1 AND estado = 'completada') AS t_done,
         (SELECT count(*)::int FROM tareas WHERE obra_id = $1 AND estado = 'en_progreso') AS t_prog,
         (SELECT count(*)::int FROM tareas WHERE obra_id = $1 AND estado NOT IN ('completada', 'cancelada')
            AND fecha_limite < (now() AT TIME ZONE '${TZ_NEGOCIO}')::date) AS t_late,
         (SELECT count(*)::int FROM tareas WHERE obra_id = $1 AND estado = 'completada'
            AND ${enPeriodo("fecha_completada", 2)}) AS t_done_periodo,
         (SELECT count(*)::int FROM alertas WHERE obra_id = $1 AND resuelta = false) AS alertas,
         (SELECT count(*)::int FROM alertas WHERE obra_id = $1 AND ${enPeriodo("created_at", 2)}) AS alertas_periodo,
         (SELECT count(*)::int FROM pedidos_materiales WHERE obra_id = $1 AND ${enPeriodo("fecha", 2)}) AS pedidos,
         (SELECT count(*)::int FROM materiales WHERE obra_id = $1 AND activo
            AND stock_minimo IS NOT NULL AND COALESCE(stock_actual, 0) < stock_minimo) AS stock_low,
         (SELECT count(*)::int FROM gastos WHERE obra_id = $1 AND estado_pago = 'pendiente') AS recibos_pend,
         (SELECT count(*)::int FROM miembros_obra WHERE obra_id = $1) AS equipo`,
      [obraId, desde]
    ),
  ]);

  const c = conteos.rows[0];
  const presupuesto = verPresupuesto ? resumir(rubros) : null;
  const snapshot = {
    rango,
    desde, // null = toda la obra
    obra: obra.rows[0]?.nombre || "",
    code: obra.rows[0]?.code || "",
    avance: c.avance,
  };

  if (presupuesto) {
    snapshot.presupuestoTotal = presupuesto.total;
    // En "total" es el ejecutado acumulado (igual que Presupuesto); en otro rango, lo del período
    snapshot.ejecutado = ejecutadoPeriodo ?? presupuesto.ejecutado;
    snapshot.ejecutadoTotal = presupuesto.ejecutado;
    snapshot.comprometido = presupuesto.comprometido;
  }

  snapshot.tareas = { total: c.t_total, done: c.t_done, prog: c.t_prog, late: c.t_late, donePeriodo: c.t_done_periodo };
  snapshot.alertas = c.alertas;
  snapshot.alertasPeriodo = c.alertas_periodo;
  snapshot.pedidos = c.pedidos;
  if (puedeVer(permisosWeb, "stock.ver")) snapshot.stockLow = c.stock_low;
  if (puedeVer(permisosWeb, "recibos.ver")) snapshot.recibosPend = c.recibos_pend;
  snapshot.equipo = c.equipo;
  return snapshot;
}

// Detalle de una sección. `snapshot` ya trae `desde` y la portada.
async function detalleSeccion(db, obraId, seccion, snapshot) {
  const desde = snapshot.desde;
  // conPeriodo: la consulta usa $2 = desde; si no, solo $1 = obra (Postgres no acepta
  // parámetros que la consulta no usa)
  const filas = async (sql, conPeriodo = false) =>
    (await db.query(sql, conPeriodo ? [obraId, desde] : [obraId])).rows;

  switch (seccion) {
    case "resumen":
      return snapshot;

    case "avance":
      return filas(
        `SELECT r.nombre AS rubro,
                COALESCE(ROUND(AVG(t.porcentaje_avance)), 0)::int AS avance,
                count(t.id)::int AS tareas,
                count(t.id) FILTER (WHERE t.estado = 'completada')::int AS completadas
         FROM rubros r
         LEFT JOIN tareas t ON t.rubro_id = r.id AND t.estado <> 'cancelada'
         WHERE r.obra_id = $1
         GROUP BY r.id, r.nombre, r.orden
         ORDER BY r.orden ASC NULLS LAST, r.nombre ASC`
      );

    case "presupuesto": {
      const rubros = await calcularRubros(db, obraId);
      return { resumen: resumir(rubros), rubros, ejecutadoPeriodo: snapshot.ejecutado };
    }

    case "cronograma":
      return filas(
        `SELECT t.titulo, t.estado, t.porcentaje_avance AS avance, r.nombre AS rubro,
                to_char(t.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
                to_char(t.fecha_limite, 'YYYY-MM-DD') AS fecha_limite,
                (t.estado NOT IN ('completada', 'cancelada')
                  AND t.fecha_limite < (now() AT TIME ZONE '${TZ_NEGOCIO}')::date) AS atrasada
         FROM tareas t
         LEFT JOIN rubros r ON r.id = t.rubro_id
         WHERE t.obra_id = $1 AND t.estado <> 'cancelada'
         ORDER BY t.fecha_limite ASC NULLS LAST, t.titulo
         LIMIT ${LIMITE_FILAS}`
      );

    case "alertas":
      // Las que siguen abiertas + las creadas en el período
      return filas(
        `SELECT titulo, mensaje, severity, tipo, resuelta, created_at
         FROM alertas
         WHERE obra_id = $1 AND (resuelta = false OR ${enPeriodo("created_at", 2)})
         ORDER BY created_at DESC
         LIMIT ${LIMITE_FILAS}`,
        true
      );

    case "pedidos":
      return filas(
        `SELECT pm.fecha, pm.estado, pm.total, pm.urgente, pr.nombre AS proveedor, r.nombre AS rubro,
                (SELECT string_agg(m.nombre || ' × ' || i.cantidad, ', ')
                 FROM pedidos_items i JOIN materiales m ON m.id = i.material_id
                 WHERE i.pedido_id = pm.id) AS materiales
         FROM pedidos_materiales pm
         LEFT JOIN proveedores pr ON pr.id = pm.proveedor_id
         LEFT JOIN rubros r ON r.id = pm.rubro_id
         WHERE pm.obra_id = $1 AND ${enPeriodo("pm.fecha", 2)}
         ORDER BY pm.fecha DESC
         LIMIT ${LIMITE_FILAS}`,
        true
      );

    case "stock":
      return filas(
        `SELECT nombre, categoria, unidad, stock_actual, stock_minimo,
                (stock_minimo IS NOT NULL AND COALESCE(stock_actual, 0) < stock_minimo) AS bajo
         FROM materiales
         WHERE obra_id = $1 AND activo
         ORDER BY bajo DESC, nombre
         LIMIT ${LIMITE_FILAS}`
      );

    case "recibos":
      return filas(
        `SELECT to_char(g.fecha, 'YYYY-MM-DD') AS fecha, g.descripcion, g.monto, COALESCE(g.moneda, 'ARS') AS moneda,
                g.estado_pago, COALESCE(g.proveedor, cf.emisor) AS proveedor, r.nombre AS rubro
         FROM gastos g
         LEFT JOIN rubros r ON r.id = g.rubro_id
         LEFT JOIN LATERAL (SELECT c.emisor FROM comprobantes_facturas c WHERE c.gasto_id = g.id LIMIT 1) cf ON true
         WHERE g.obra_id = $1 AND ${fechaEnPeriodo("g.fecha", 2)}
         ORDER BY g.fecha DESC NULLS LAST
         LIMIT ${LIMITE_FILAS}`,
        true
      );

    case "equipo":
      return filas(
        `SELECT p.nombre, mo.rol, mo.joined_at
         FROM miembros_obra mo JOIN personas p ON p.id = mo.persona_id
         WHERE mo.obra_id = $1
         ORDER BY p.nombre`
      );

    case "actividad":
      return filas(
        `SELECT a.created_at, COALESCE(p.nombre, 'Sistema') AS usuario, a.texto, a.accion, a.tipo
         FROM actividad a LEFT JOIN personas p ON p.id = a.usuario_id
         WHERE a.obra_id = $1 AND ${enPeriodo("a.created_at", 2)}
         ORDER BY a.created_at DESC
         LIMIT ${LIMITE_FILAS}`,
        true
      );

    default:
      return null;
  }
}

// Reporte completo: portada + el detalle de cada sección pedida (en el orden de SECCIONES).
// Las secciones de costos/inventario se filtran por permiso, igual que el snapshot.
export async function armarReporte(db, obraId, rango, secciones, permisosWeb = {}) {
  const snapshot = await calcularSnapshot(db, obraId, rango, permisosWeb);
  const pedidas = SECCIONES.filter(
    (s) =>
      secciones.includes(s) &&
      (!SECCION_PERMISO[s] || puedeVer(permisosWeb, SECCION_PERMISO[s]))
  );
  const detalles = await Promise.all(pedidas.map((s) => detalleSeccion(db, obraId, s, snapshot)));
  return {
    snapshot,
    secciones: Object.fromEntries(pedidas.map((s, i) => [s, detalles[i]])),
  };
}
