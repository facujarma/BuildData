"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChartLineArrowUp,
  Check,
  CircleDollar,
  Clock,
  FileArrowDown,
  Pencil,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import { DashToast, useToast } from "../../_components/useToast";
import { Donut } from "./Donut";
import { BudgetEditModal, type BudgetAuditEntry } from "./BudgetEditModal";
import { useDashboardData } from "../../_components/DashboardDataContext";
import { useRole } from "../../_components/RoleContext";
import { getPresupuesto, ajustarPresupuesto, type PresupuestoData } from "@/services/presupuestoService";
import {
  CURRENCIES,
  formatMoney,
  type BudgetLine,
  type CurrencyKey,
  type ForecastItem,
} from "../data";

const KPI_TONES: Record<string, { tint: string; fg: string }> = {
  primary:   { tint: "bg-primary-50",   fg: "text-primary" },
  info:      { tint: "bg-info-50",      fg: "text-[#1D4ED8]" },
  attention: { tint: "bg-attention-50", fg: "text-[#A16207]" },
  success:   { tint: "bg-success-50",   fg: "text-[#15803D]" },
  critical:  { tint: "bg-critical-50",  fg: "text-[#B91C1C]" },
};

interface ProjectedLine extends BudgetLine {
  projected: number;
  over: boolean;
  deviation: number;
}

function KpiCard({
  tone,
  icon,
  value,
  label,
  foot,
}: {
  tone: string;
  icon: ReactNode;
  value: string;
  label: string;
  foot: string;
}) {
  const t = KPI_TONES[tone] || KPI_TONES.primary;
  return (
    <DCard padding="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.tint} ${t.fg}`}>
          {icon}
        </div>
      </div>
      <div className="text-[22px] font-extrabold display-tight tnum text-slate-950 leading-none">{value}</div>
      <div className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate-600 mt-1">{label}</div>
      <div className="text-[11px] text-slate-500 mt-1">{foot}</div>
    </DCard>
  );
}

export function ScreenPresupuesto() {
  const { obraId } = useDashboardData();
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState<CurrencyKey>("ARS");
  const [editOpen, setEditOpen] = useState(false);
  const [toast, flash] = useToast();
  const [auditLog, setAuditLog] = useState<BudgetAuditEntry[]>([]);
  const { puede } = useRole();
  const puedeEditar = puede("presupuesto.editar");
  const puedeExportar = puede("reportes.exportar");

  const apply = useCallback((d: PresupuestoData) => {
    setLines(d.lines);
    setAuditLog(d.auditLog);
    setForecast(d.forecast);
  }, []);

  const reload = useCallback(() => getPresupuesto(obraId).then(apply), [obraId, apply]);

  useEffect(() => {
    if (!obraId) return;
    let cancelled = false;
    getPresupuesto(obraId)
      .then((d) => { if (!cancelled) apply(d); })
      .catch(() => { if (!cancelled) flash("No se pudo cargar el presupuesto"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
    };
  }, [obraId, apply, flash]);

  const fmt = (m: number) => formatMoney(m, cur);

  const total = lines.reduce((a, l) => a + l.cap, 0);
  const spent = lines.reduce((a, l) => a + l.spent, 0);
  const comp = lines.reduce((a, l) => a + l.comp, 0);
  const avail = total - spent - comp;
  const pctSpent = total > 0 ? Math.round((spent / total) * 100) : 0;
  const pctComp = total > 0 ? Math.round((comp / total) * 100) : 0;

  const proj = useMemo<ProjectedLine[]>(
    () =>
      lines.map((l) => {
        const used = l.spent + l.comp;
        const remainingCap = Math.max(0, l.cap - used);
        const over = l.spent > l.cap;
        const factor = over ? 1.18 : l.spent / Math.max(1, l.cap) > 0.85 ? 1.06 : 1.0;
        const projected = used + remainingCap * factor + (over ? (l.spent - l.cap) * 0.4 : 0);
        return {
          ...l,
          projected: Math.round(projected * 10) / 10,
          over,
          deviation: Math.round((projected - l.cap) * 10) / 10,
        };
      }),
    [lines],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-semibold">Cargando presupuesto…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <DPageHeader
        title="Presupuesto"
        subtitle="Una sola vista del dinero de la obra: ejecutado, comprometido, disponible y estimación de cierre."
        right={
          <>
            <div className="flex bg-slate-100 rounded-md p-[2px] gap-[2px]">
              {(Object.keys(CURRENCIES) as CurrencyKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setCur(k)}
                  className={`text-[11px] font-bold px-[10px] py-[5px] rounded inline-flex items-center gap-1 transition-colors ${
                    cur === k ? "bg-white text-slate-950 shadow-card" : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  {CURRENCIES[k].sym}
                </button>
              ))}
            </div>
            {puedeEditar && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Pencil width={13} height={13} />}
                onClick={() => setEditOpen(true)}
              >
                Editar montos
              </Button>
            )}
            {puedeExportar && (
              <Button
                variant="secondary"
                size="sm"
                icon={<FileArrowDown width={13} height={13} />}
                onClick={() => flash("Exportando presupuesto a XLSX…")}
              >
                Exportar
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-[260px_1fr] gap-3 mb-4">
        <DCard className="flex flex-col items-center justify-center text-center">
          <Donut value={pctSpent} size={150} stroke={15} color="#0F4395" label={`${pctSpent}%`} sub="Ejecutado" />
          <div className="text-[12px] text-slate-600 mt-3 leading-snug">
            <b className="text-slate-950">{fmt(spent)}</b> de <b className="text-slate-950">{fmt(total)}</b>
          </div>
        </DCard>

        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            tone="primary"
            icon={<CircleDollar width={16} height={16} />}
            value={fmt(total)}
            label="Presupuesto total"
            foot={`${lines.length} rubros`}
          />
          <KpiCard
            tone="info"
            icon={<ChartLineArrowUp width={16} height={16} />}
            value={fmt(spent)}
            label="Ejecutado"
            foot={`${pctSpent}% del total`}
          />
          <KpiCard
            tone="attention"
            icon={<Clock width={16} height={16} />}
            value={fmt(comp)}
            label="Comprometido"
            foot={`${pctComp}% en pedidos/órdenes`}
          />
          <KpiCard
            tone={avail < 0 ? "critical" : "success"}
            icon={<Check width={16} height={16} />}
            value={fmt(avail)}
            label="Disponible"
            foot={avail < 0 ? "Sobregiro" : total > 0 ? `${Math.round((avail / total) * 100)}% libre` : "—"}
          />
        </div>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-3">
        <DCard padding="p-0">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-bold text-slate-950">Detalle por rubro</div>
              <div className="text-[11px] text-slate-500 mt-[1px]">
                Ejecutado y comprometido contra lo presupuestado
              </div>
            </div>
          </div>
          <div className="p-3 space-y-1">
            {proj.map((r) => {
              const usedPct = r.cap > 0 ? Math.min(100, Math.round((r.spent / r.cap) * 100)) : 0;
              const compPct = r.cap > 0 ? Math.min(100 - usedPct, Math.round((r.comp / r.cap) * 100)) : 0;
              return (
                <div key={r.rubroId} className="px-2 py-2 rounded-md hover:bg-slate-50/60">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-[12px] font-bold text-slate-800 truncate">{r.name}</div>
                    <div className="flex items-center gap-2 flex-none">
                      {r.over && (
                        <DPill tone="criticalSolid">
                          {r.cap > 0 ? `+${Math.round((r.spent / r.cap - 1) * 100)}%` : "Excedido"}
                        </DPill>
                      )}
                      <div className="text-[12px] tnum font-semibold text-slate-600">
                        {fmt(r.spent)} <span className="text-slate-400">/ {fmt(r.cap)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[8px] rounded-full overflow-hidden flex bg-slate-100">
                    <div
                      style={{ width: usedPct + "%" }}
                      className={r.over ? "h-full bg-critical" : "h-full bg-primary"}
                    />
                    <div style={{ width: compPct + "%" }} className="h-full bg-primary/40" />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                    <span className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Ejecutado
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary/40" />
                        Comprometido
                      </span>
                    </span>
                    <span title="Estimación al cierre según ritmo y precios actuales">
                      Cierre estimado:{" "}
                      <b className={r.deviation > 0.5 ? "text-[#B91C1C]" : "text-slate-700"}>{fmt(r.projected)}</b>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </DCard>

        <div className="flex flex-col gap-3">
          <DCard padding="p-0">
            <div className="px-5 py-3 border-b border-slate-200">
              <div className="text-[14px] font-bold text-slate-950">Cuándo va a subir el gasto</div>
              <div className="text-[11px] text-slate-500 mt-[1px]">Picos de desembolso previstos por IA</div>
            </div>
            <div className="p-4">
              <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
                {forecast.map((f, i) => (
                  <div key={f.month} className="relative">
                    <span
                      className={`absolute -left-[26px] top-[2px] w-3 h-3 rounded-full border-2 ${
                        i === 0 ? "bg-accent border-accent" : "bg-white border-slate-300"
                      }`}
                    />
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[12px] font-bold text-slate-950">
                        {f.month} <span className="text-slate-400 font-semibold">· {f.label}</span>
                      </div>
                      <div className="text-[12px] font-extrabold tnum text-slate-950">~{fmt(f.amount)}</div>
                    </div>
                    {f.items.map((it) => (
                      <div key={it} className="text-[11px] text-slate-500 leading-snug mt-[2px]">
                        {it}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </DCard>

          <DCard padding="p-0">
            <div className="px-5 py-3 border-b border-slate-200">
              <div className="text-[14px] font-bold text-slate-950">Composición</div>
            </div>
            <div className="p-4 space-y-2">
              {lines.map((l) => {
                const share = total > 0 ? Math.round((l.cap / total) * 100) : 0;
                return (
                  <div key={l.rubroId} className="flex items-center gap-2">
                    <div className="text-[11px] text-slate-700 w-[120px] truncate flex-none">{l.name}</div>
                    <div className="flex-1 bg-slate-100 h-[6px] rounded-full overflow-hidden">
                      <div style={{ width: share + "%" }} className="h-full bg-primary rounded-full" />
                    </div>
                    <div className="text-[11px] font-bold tnum w-[34px] text-right">{share}%</div>
                  </div>
                );
              })}
            </div>
          </DCard>
        </div>
      </div>

      <DCard padding="p-0" className="mt-4">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-[14px] font-bold text-slate-950">Historial de ajustes</div>
            <div className="text-[11px] text-slate-500 mt-[1px]">
              Cada cambio de presupuesto queda registrado con autor y motivo
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-[3px] tnum flex-none">
            {auditLog.length}
          </span>
        </div>
        {auditLog.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12px] text-slate-400">
            Todavía no se ajustó el presupuesto.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {auditLog.map((a, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <span className="w-8 h-8 rounded-md bg-primary-50 text-primary flex items-center justify-center flex-none">
                  <Pencil width={13} height={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-slate-800 leading-snug">
                    <b className="text-slate-950">{a.by}</b> · {a.what}
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug mt-[3px] italic">“{a.reason}”</div>
                </div>
                <div className="text-[10px] text-slate-500 tnum flex-none">{a.at}</div>
              </div>
            ))}
          </div>
        )}
      </DCard>

      {editOpen && (
        <BudgetEditModal
          lines={lines}
          cur={cur}
          onClose={() => setEditOpen(false)}
          onCommit={async (cambios, reason) => {
            await ajustarPresupuesto(obraId, cambios, reason);
            await reload();
            flash("Presupuesto actualizado");
          }}
        />
      )}

      <DashToast msg={toast} />
    </>
  );
}
