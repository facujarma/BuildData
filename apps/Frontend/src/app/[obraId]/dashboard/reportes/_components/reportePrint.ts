// Arma el HTML imprimible de un reporte generado y lo abre en una ventana nueva con el
// diálogo de impresión, desde donde se guarda como PDF ("Guardar como PDF"). No usa
// librerías de PDF: el navegador hace la conversión.

import type { ReporteGenerado } from "@/services/reportesService";
import { SECTION_DEFS, RANGE_LABELS } from "../data";
import { formatARS, formatDate, formatDateTime, formatNumber } from "@/lib/format";

type Fila = Record<string, unknown>;

// Todo lo que viene de la base pasa por acá antes de entrar al HTML (evita inyectar markup)
function esc(v: unknown): string {
  return String(v ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ESTADOS: Record<string, string> = {
  pendiente: "Pendiente", en_progreso: "En progreso", completada: "Completada", cancelada: "Cancelada",
  aprobado: "Aprobado", rechazado: "Rechazado", en_camino: "En camino", demorado: "Demorado",
  entregado: "Entregado", pagado: "Pagado",
};
const estado = (v: unknown) => ESTADOS[String(v)] || String(v ?? "—");

function tabla(cabeceras: string[], filas: string[][]): string {
  if (filas.length === 0) return `<p class="vacio">Sin datos en este período.</p>`;
  return `<table><thead><tr>${cabeceras.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function kpis(items: [string, string][]): string {
  return `<div class="kpis">${items.map(([l, v]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>`;
}

function seccionHTML(id: string, data: unknown, r: ReporteGenerado): string {
  const s = r.snapshot;
  const filas = (Array.isArray(data) ? data : []) as Fila[];
  switch (id) {
    case "resumen":
      return kpis([
        ["Avance", `${s.avance}%`],
        ["Presupuesto", formatARS(s.presupuestoTotal)],
        [s.rango === "total" ? "Ejecutado" : "Ejecutado en el período", formatARS(s.ejecutado)],
        ["Comprometido", formatARS(s.comprometido)],
        ["Tareas completas", `${s.tareas.done}/${s.tareas.total}`],
        ["Tareas atrasadas", String(s.tareas.late)],
        ["Alertas activas", String(s.alertas)],
        ["Pedidos del período", String(s.pedidos)],
        ["Materiales bajo mínimo", String(s.stockLow)],
        ["Recibos pendientes", String(s.recibosPend)],
        ["Equipo", String(s.equipo)],
      ]);
    case "avance":
      return tabla(["Rubro", "Avance", "Tareas", "Completadas"],
        filas.map((f) => [esc(f.rubro), `${esc(f.avance)}%`, esc(f.tareas), esc(f.completadas)]));
    case "presupuesto": {
      const p = data as { resumen: { total: number; ejecutado: number; comprometido: number; disponible: number }; rubros: Fila[] };
      return kpis([
        ["Total", formatARS(p.resumen.total)],
        ["Ejecutado", formatARS(p.resumen.ejecutado)],
        ["Comprometido", formatARS(p.resumen.comprometido)],
        ["Disponible", formatARS(p.resumen.disponible)],
      ]) + tabla(["Rubro", "Asignado", "Ejecutado", "Comprometido"],
        p.rubros.map((f) => [esc(f.nombre), formatARS(Number(f.cap)), formatARS(Number(f.spent)), formatARS(Number(f.comp))]));
    }
    case "cronograma":
      return tabla(["Tarea", "Rubro", "Estado", "Avance", "Vence"],
        filas.map((f) => [esc(f.titulo) + (f.atrasada ? ' <em class="mal">atrasada</em>' : ""), esc(f.rubro),
          esc(estado(f.estado)), `${esc(f.avance ?? 0)}%`, f.fecha_limite ? esc(formatDate(String(f.fecha_limite))) : "—"]));
    case "alertas":
      return tabla(["Fecha", "Alerta", "Severidad", "Estado"],
        filas.map((f) => [esc(formatDateTime(String(f.created_at))), esc(f.titulo || f.mensaje),
          f.severity === "critical" ? '<em class="mal">Crítica</em>' : esc(f.severity), f.resuelta ? "Resuelta" : "Abierta"]));
    case "pedidos":
      return tabla(["Fecha", "Materiales", "Proveedor", "Estado", "Total"],
        filas.map((f) => [esc(formatDate(String(f.fecha))), esc(f.materiales), esc(f.proveedor), esc(estado(f.estado)),
          formatARS(Number(f.total))]));
    case "stock":
      return tabla(["Material", "Categoría", "Stock", "Mínimo"],
        filas.map((f) => [esc(f.nombre) + (f.bajo ? ' <em class="mal">bajo mínimo</em>' : ""), esc(f.categoria),
          `${formatNumber(Number(f.stock_actual ?? 0), 0)} ${esc(f.unidad ?? "")}`, esc(f.stock_minimo)]));
    case "recibos":
      return tabla(["Fecha", "Concepto", "Proveedor", "Estado", "Monto"],
        filas.map((f) => [f.fecha ? esc(formatDate(String(f.fecha))) : "—", esc(f.descripcion), esc(f.proveedor),
          esc(estado(f.estado_pago)), f.moneda === "USD" ? `US$ ${formatNumber(Number(f.monto), 2)}` : formatARS(Number(f.monto))]));
    case "equipo":
      return tabla(["Nombre", "Rol"], filas.map((f) => [esc(f.nombre), esc(f.rol)]));
    case "actividad":
      return tabla(["Fecha", "Quién", "Qué pasó"],
        filas.map((f) => [esc(formatDateTime(String(f.created_at))), esc(f.usuario), esc(f.texto || f.accion)]));
    default:
      return "";
  }
}

export function abrirReporteImprimible(r: ReporteGenerado): boolean {
  const s = r.snapshot;
  const periodo = s.desde ? `${RANGE_LABELS[s.rango]} (desde ${formatDate(s.desde)})` : RANGE_LABELS[s.rango];
  const cuerpo = SECTION_DEFS.filter((d) => d.id in r.secciones)
    .map((d, i) => `<section><h2>${String(i + 1).padStart(2, "0")} · ${esc(d.label)}</h2>${seccionHTML(d.id, r.secciones[d.id], r)}</section>`)
    .join("");

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(r.titulo)}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;color:#0f172a;margin:32px;font-size:12px}
  header{border-bottom:3px solid #0F4395;padding-bottom:12px;margin-bottom:20px}
  header small{color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:700}
  h1{font-size:22px;margin:4px 0}
  h2{font-size:14px;margin:24px 0 8px;color:#0F4395}
  .meta{color:#64748b}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0}
  .kpis div{border:1px solid #e2e8f0;border-radius:6px;padding:8px}
  .kpis b{display:block;font-size:15px}.kpis span{color:#64748b;font-size:10px;text-transform:uppercase}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;border-bottom:1px solid #cbd5e1;padding:4px}
  td{border-bottom:1px solid #f1f5f9;padding:4px;vertical-align:top}
  em.mal{color:#B91C1C;font-style:normal;font-weight:700;font-size:10px}
  .vacio{color:#94a3b8}
  section{break-inside:avoid-page}
</style></head><body>
<header><small>BuildData · Reporte de obra</small><h1>${esc(s.obra)}</h1>
<div class="meta">${esc(s.code)} · ${esc(periodo)} · generado el ${esc(formatDateTime(r.fecha_generacion))}</div></header>
${cuerpo}
<script>window.onload=()=>window.print()</script>
</body></html>`;

  const ventana = window.open("", "_blank");
  if (!ventana) return false; // el navegador bloqueó la ventana emergente
  ventana.document.write(html);
  ventana.document.close();
  return true;
}
