"use client";

import { CircleExclamation, ChevronRight } from "@gravity-ui/icons";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import type { AlertItem } from "@/types/dashboard";

interface Props {
  alerts: AlertItem[];
  onItemClick?: (alert: AlertItem) => void;
  onViewAll?: () => void;
}

function CriticalAlertsCard({ alerts, onItemClick, onViewAll }: Props) {
  const criticalsAlertsCounter = alerts.filter(
    (a) => a.tone === "critical",
  ).length;
  return (
    <DCard padding="p-0">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="text-[14px] font-bold">Críticos activos</div>
        <DPill tone="criticalSolid"> {criticalsAlertsCounter} </DPill>
      </div>
      <div className="divide-y divide-slate-200">
        {alerts.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-400 text-[12px] leading-relaxed">
            No hay alertas activas<br />
            <span className="text-[11px]">Todo en orden por ahora</span>
          </div>
        ) : (
          alerts.slice(0, 3).map((a, i) => (
            <button
              key={i}
              onClick={() => onItemClick?.(a)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center flex-none
                    ${a.tone === "critical" ? "bg-critical-50 text-[#B91C1C]" : "bg-attention-50 text-[#A16207]"}`}
              >
                <CircleExclamation width={14} height={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold leading-tight">
                  {a.title}
                </div>
                <div className="text-[10px] text-slate-500 mt-[2px]">
                  {a.subtitle} · hace {a.time}
                </div>
              </div>
              <ChevronRight width={13} height={13} className="text-slate-300 mt-1 flex-none" />
            </button>
          ))
        )}
      </div>
      {onViewAll && (
        <div className="p-3 border-t border-slate-200">
          <Button variant="secondary" size="sm" className="w-full justify-center" onClick={onViewAll}>
            Ver todas las alertas
          </Button>
        </div>
      )}
    </DCard>
  );
}

export default CriticalAlertsCard;
