import { supabase } from "@/lib/supabaseClient";
import type { BudgetLine, ForecastItem } from "@/app/[obraId]/dashboard/presupuesto/data";
import type { BudgetAuditEntry } from "@/app/[obraId]/dashboard/presupuesto/_components/BudgetEditModal";
import { formatDateTime, formatNumber } from "@/lib/format";

// La pantalla trabaja en millones de ARS; la API en pesos.
const MILLON = 1_000_000;
const toM = (pesos: number) => pesos / MILLON;
const toPesos = (m: number) => Math.round(m * MILLON);
const fmtM = (pesos: number) => `${formatNumber(toM(pesos), 1)} M`;

interface RawRubro {
  rubro_id: string;
  nombre: string;
  cap: number;
  spent: number;
  comp: number;
}

interface RawAjuste {
  id: string;
  created_at: string;
  motivo: string;
  cambios: { rubro_id: string; nombre: string; cap_anterior: number; cap_nuevo: number }[];
  total_anterior: number;
  total_nuevo: number;
  usuario_nombre: string;
}

interface RawForecast {
  mes: string; // YYYY-MM
  monto: number;
  pedidos: number;
  tareas: number;
  rubros: string[];
}

interface RawPresupuesto {
  rubros: RawRubro[];
  auditLog: RawAjuste[];
  forecast: RawForecast[];
}

export interface PresupuestoData {
  lines: BudgetLine[];
  auditLog: BudgetAuditEntry[];
  forecast: ForecastItem[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const ETIQUETAS = ["Este mes", "Próximo", "En 2 meses"];

function mapLine(r: RawRubro): BudgetLine {
  return { rubroId: r.rubro_id, name: r.nombre, cap: toM(r.cap), spent: toM(r.spent), comp: toM(r.comp) };
}

function mapAjuste(a: RawAjuste): BudgetAuditEntry {
  const delta = a.total_nuevo - a.total_anterior;
  const what =
    a.cambios.length === 1
      ? `Ajustó ${a.cambios[0].nombre} de ${fmtM(a.cambios[0].cap_anterior)} a ${fmtM(a.cambios[0].cap_nuevo)}`
      : `Ajustó ${a.cambios.length} rubros · total ${delta >= 0 ? "+" : ""}${fmtM(delta)}`;
  return { at: formatDateTime(a.created_at), by: a.usuario_nombre, what, reason: a.motivo };
}

function mapForecast(f: RawForecast, i: number): ForecastItem {
  const mes = Number(f.mes.slice(5, 7)) - 1;
  const partes: string[] = [];
  if (f.pedidos) partes.push(`${f.pedidos} pedido${f.pedidos === 1 ? "" : "s"}`);
  if (f.tareas) partes.push(`${f.tareas} tarea${f.tareas === 1 ? "" : "s"}`);
  const items = partes.length
    ? [`${partes.join(" · ")}${f.rubros.length ? ` — ${f.rubros.join(", ")}` : ""}`]
    : ["Sin gastos previstos"];
  return { month: MESES[mes] || f.mes, label: ETIQUETAS[i] || "", items, amount: toM(f.monto) };
}

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || ""}`,
  };
}

async function parseError(res: Response): Promise<Error> {
  const err = await res.json().catch(() => ({}));
  return new Error(err.message || err.error || `Request failed: ${res.status}`);
}

export async function getPresupuesto(obraId: string): Promise<PresupuestoData> {
  const res = await fetch(`${API_URL}/presupuestos/${obraId}`, { headers: await authHeaders() });
  if (!res.ok) throw await parseError(res);
  const data: RawPresupuesto = await res.json();
  return {
    lines: data.rubros.map(mapLine),
    auditLog: data.auditLog.map(mapAjuste),
    forecast: data.forecast.map(mapForecast),
  };
}

// cambios en millones (como los edita la pantalla)
export async function ajustarPresupuesto(
  obraId: string,
  cambios: { rubroId: string; cap: number }[],
  reason: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/presupuestos/${obraId}/rubros`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify({
      cambios: cambios.map((c) => ({ rubro_id: c.rubroId, cap: toPesos(c.cap) })),
      reason,
    }),
  });
  if (!res.ok) throw await parseError(res);
}
