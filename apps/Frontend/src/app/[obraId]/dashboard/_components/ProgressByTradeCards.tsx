"use client";

import { DCard } from "@/components/ui/DCard";
import { ChevronRight } from "@gravity-ui/icons";
import type { TradeProgress } from "@/types/dashboard";
import Button from "@/components/ui/Button";

interface Props {
  data: TradeProgress[];
  onItemClick?: (name: string) => void;
  onManageRubros?: () => void;
}

function ProgressByTradeCards({ data, onItemClick, onManageRubros }: Props) {
  return (
    <DCard padding="p-0" className="flex flex-col">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
        <div>
          <div className="text-[14px] font-bold text-slate-950">
            Avance por rubro
          </div>
          <div className="text-[11px] text-slate-500 mt-[1px]">
            Calculado con las tareas de cada rubro
          </div>
        </div>
        <button
          onClick={onManageRubros}
          className="text-[11px] font-bold text-primary hover:underline flex-none"
        >
          Administrar →
        </button>
      </div>
      <div className="p-3">
        {data.map((r) => (
          <button
            key={r.name}
            onClick={() => onItemClick?.(r.name)}
            className="w-full grid grid-cols-[170px_1fr_44px] gap-3 items-center px-2 py-2 rounded-md hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: r.color }} />
              <span className="text-[12px] font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">{r.name}</span>
            </div>
            <div className="bg-slate-100 h-[8px] rounded-full overflow-hidden">
              <div
                style={{ width: `${r.pct}%`, background: r.color }}
                className="h-full rounded-full"
              />
            </div>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[12px] font-bold tnum">{r.pct}%</span>
              {onItemClick && <ChevronRight width={12} height={12} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-none" />}
            </div>
          </button>
        ))}
      </div>
      <div className="p-3 border-t border-slate-200 mt-auto">
        <Button variant="secondary" size="sm" className="w-full justify-center" onClick={onManageRubros}>
          Ver todos los rubros
        </Button>
      </div>
    </DCard>
  );
}

export default ProgressByTradeCards;
