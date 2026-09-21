"use client";

import { ChartBar, FileArrowDown } from "@gravity-ui/icons";
import Button from "@/components/ui/Button";
import type { BudgetOverview, BudgetItem } from "@/types/dashboard";
import { formatARSCompact } from "@/lib/format";

interface Props {
  budget: BudgetOverview;
  budgetBreakdown: BudgetItem[];
  onViewBreakdown?: () => void;
  onExport?: () => void;
}

export function BudgetCard({ budget, budgetBreakdown, onViewBreakdown, onExport }: Props) {
  const ejecutadoPct = budget.total > 0 ? Math.round((budget.ejecutado / budget.total) * 100) : 0;
  const comprometidoPct = 0;
  const librePct = budget.total > 0 ? Math.round((budget.disponible / budget.total) * 100) : 0;

  return (
    <div className="blueprint-bg rounded-lg p-5 text-white relative overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-[9px] font-bold tracking-wider uppercase px-2 py-[3px] rounded">
          <ChartBar width={10} height={10} /> Presupuesto
        </span>
        <span className="text-[10px] text-white/60">
          Actualizado {budget.updatedAt}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/55">
            Total
          </div>
          <div className="text-[18px] font-extrabold display-tight tnum text-white leading-tight">
            {formatARSCompact(budget.total)}
          </div>
        </div>
        <div>
          <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/55">
            Ejecutado
          </div>
          <div className="text-[18px] font-extrabold display-tight tnum text-white leading-tight">
            {formatARSCompact(budget.ejecutado)}
          </div>
          <div className="text-[10px] font-semibold text-white/60">
            {ejecutadoPct} %
          </div>
        </div>
        <div>
          <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/55">
            Disponible
          </div>
          <div className="text-[18px] font-extrabold display-tight tnum text-accent leading-tight">
            {formatARSCompact(budget.disponible)}
          </div>
          <div className="text-[10px] font-semibold text-accent/80">
            {librePct} %
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="h-[10px] w-full rounded-full overflow-hidden flex bg-white/10">
          <div
            style={{ width: `${ejecutadoPct}%` }}
            className="h-full bg-accent"
          />
          <div
            style={{ width: `${comprometidoPct}%` }}
            className="h-full bg-accent/55"
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-white/65">
          <span className="inline-flex items-center gap-[6px]">
            <span className="w-2 h-2 rounded-full bg-accent" /> Ejecutado{" "}
            {ejecutadoPct} %
          </span>
          <span className="inline-flex items-center gap-[6px]">
            <span className="w-2 h-2 rounded-full bg-accent/55" />{" "}
            Comprometido {comprometidoPct} %
          </span>
          <span className="inline-flex items-center gap-[6px]">
            <span className="w-2 h-2 rounded-full bg-white/15" /> Libre{" "}
            {librePct} %
          </span>
        </div>
      </div>

      <div className="border-t border-white/10 pt-3 space-y-[6px] mb-4">
        {budgetBreakdown.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[1fr_auto] items-center text-[11px]"
          >
            <div className="text-white/85 truncate">{r.name}</div>
            <div className="tnum font-semibold">
              <span className={r.over ? "text-critical" : "text-white"}>
                {formatARSCompact(r.spent)}
              </span>
              <span className="text-white/45">
                {" "}
                / {formatARSCompact(r.cap)}
              </span>
              {r.over && (
                <span className="ml-2 text-[9px] font-bold tracking-wider text-critical bg-critical/20 px-[5px] py-[1px] rounded">
                  +{r.overPct} %
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-auto">
        <Button variant="accent" size="sm" onClick={onViewBreakdown}>
          Ver desglose
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          onClick={onExport}
        >
          Exportar
        </Button>
      </div>
    </div>
  );
}
