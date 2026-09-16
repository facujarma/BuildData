"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChartLineArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollar,
  CircleInfo,
  Clock,
  FileArrowDown,
  Pencil,
  Sparkles,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import { DashToast, useToast } from "../../_components/useToast";
import { Donut } from "./Donut";
import { BudgetEditModal, type BudgetAuditEntry } from "./BudgetEditModal";
import { getPresupuesto } from "@/services/mock/presupuestoService";
import {
  CURRENCIES,
  FORECAST_ITEMS,
  formatMoney,
  type BudgetLine,
  type CurrencyKey,
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

const ASSUMPTIONS = [
  "Los precios unitarios se mantienen como en los últimos comprobantes cargados.",
  "El ritmo de ejecución de cada rubro sigue la tendencia de las últimas 4 semanas.",
  "Los pedidos aprobados y no entregados se ejecutan por su monto actual.",
  "No se incorporan trabajos adicionales ni cambios de proyecto.",
];

export function ScreenPresupuesto() {
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState<CurrencyKey>("ARS");
  const [editOpen, setEditOpen] = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const [toast, flash] = useToast();
  const [auditLog, setAuditLog] = useState<BudgetAuditEntry[]>([
    {
      at: "12 Ago 14:20",
      by: "J. Méndez",
      what: "Ajustó Hormigón armado de 48 M a 52 M",
      reason: "Aumento de precio del hierro",
    },
  ]);

  useEffect(() => {
    let cancelled = false;
    getPresupuesto().then((d) => {
      if (!cancelled) {
        setLines(d.lines);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
  const projTotal = Math.round(proj.reduce((a, l) => a + l.projected, 0));
  const projDev = projTotal - total;
  const projDevPct = total > 0 ? Math.round((projDev / total) * 100) : 0;
  const riskRubros = proj
    .filter((l) => l.deviation > 0.5)
    .sort((a, b) => b.deviation - a.deviation);

  const advance = pctSpent;
  const band = advance < 40 ? 0.12 : advance < 70 ? 0.08 : 0.05;
  const low = Math.round(projTotal * (1 - band));
  const high = Math.round(projTotal * (1 + band));
  const confLabel = advance < 40 ? "Baja" : advance < 70 ? "Media" : "Alta";
  const confTone =
    advance < 40
      ? "bg-critical-50 text-[#B91C1C]"
      : advance < 70
        ? "bg-attention-50 text-[#A16207]"
        : "bg-success-50 text-[#15803D]";

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
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil width={13} height={13} />}
              onClick={() => setEditOpen(true)}
            >
              Editar montos
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileArrowDown width={13} height={13} />}
              onClick={() => flash("Exportando presupuesto a XLSX…")}
            >
              Exportar
            </Button>
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

      <div className="blueprint-bg rounded-lg p-5 text-white mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-[9px] font-bold tracking-wider uppercase px-2 py-[3px] rounded">
            <Sparkles width={10} height={10} /> Predicción IA
          </span>
          <span className="text-[10px] text-white/60">en base a ritmo de gasto y pedidos</span>
        </div>
        <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
          <div className="flex flex-col items-center">
            <Donut
              value={total > 0 ? Math.min(100, Math.round((projTotal / total) * 100)) : 0}
              size={130}
              stroke={13}
              color={projDev > 0 ? "#F59E0B" : "#22C55E"}
              track="rgba(255,255,255,0.14)"
              labelColor="#ffffff"
              label={`${projDev >= 0 ? "+" : ""}${projDevPct}%`}
              sub="vs presupuesto"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[9px] font-bold tracking-[0.08em] uppercase bg-white/10 text-white/70 rounded px-2 py-[3px]">
                Estimación · no es una garantía
              </span>
              <span
                className={`text-[9px] font-bold tracking-[0.06em] uppercase rounded px-2 py-[3px] ${confTone}`}
              >
                Confianza {confLabel}
              </span>
            </div>
            <div className="text-[15px] font-bold leading-snug mb-1">
              Cierre estimado entre <span className="text-accent">{fmt(low)}</span> y{" "}
              <span className="text-accent">{fmt(high)}</span>
            </div>
            <div className="text-[12px] text-white/70 leading-snug mb-3">
              {projDev > 0
                ? `Si se mantiene el ritmo y los precios actuales, la obra podría cerrar por encima del presupuesto. Escenario más probable: ${fmt(projTotal)} (${projDevPct > 0 ? "+" : ""}${projDevPct}%). ${riskRubros.length} rubro${riskRubros.length === 1 ? "" : "s"} explican la mayor parte del desvío.`
                : "Si se mantiene el ritmo y los precios actuales, la obra cerraría dentro del presupuesto."}
            </div>
            <div className="flex flex-wrap gap-2">
              {riskRubros.slice(0, 3).map((r) => (
                <span
                  key={r.name}
                  className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-[5px] text-[11px] font-semibold"
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-critical" /> {r.name}{" "}
                  <span className="text-critical">+{fmt(r.deviation)}</span>
                </span>
              ))}
            </div>

            <button
              onClick={() => setShowMethod((v) => !v)}
              className="mt-3 inline-flex items-center gap-[6px] text-[11px] font-bold text-white/70 hover:text-white"
            >
              <CircleInfo width={11} height={11} /> {showMethod ? "Ocultar" : "Ver"} en qué se basa esta estimación
              {showMethod ? <ChevronUp width={11} height={11} /> : <ChevronDown width={11} height={11} />}
            </button>

            {showMethod && (
              <div className="mt-3 bg-white/[0.06] border border-white/10 rounded-lg p-3">
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-white/55 mb-2">
                  Supuestos del cálculo
                </div>
                <ul className="space-y-[6px] mb-3">
                  {ASSUMPTIONS.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-[11px] text-white/75 leading-snug">
                      <span className="w-[4px] h-[4px] rounded-full bg-accent mt-[6px] flex-none" />
                      {a}
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] text-white/60 leading-snug border-t border-white/10 pt-2">
                  Se calcula con los datos cargados en la obra ({pctSpent}% de avance financiero). A menor avance,
                  mayor incertidumbre — por eso se muestra un rango y no un valor único.{" "}
                  <b className="text-white/80">
                    No reemplaza el criterio profesional ni constituye una garantía de resultado.
                  </b>
                </div>
              </div>
            )}
          </div>
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
                <div key={r.name} className="px-2 py-2 rounded-md hover:bg-slate-50/60">
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
                {FORECAST_ITEMS.map((f, i) => (
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
                  <div key={l.name} className="flex items-center gap-2">
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
          onCommit={(next) => {
            setLines(next);
            flash("Presupuesto actualizado");
          }}
          onLog={(entry) => setAuditLog((p) => [entry, ...p])}
        />
      )}

      <DashToast msg={toast} />
    </>
  );
}
