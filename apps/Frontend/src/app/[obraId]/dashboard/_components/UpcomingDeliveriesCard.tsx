"use client";

import { useEffect, useState } from "react";
import { DCard } from "@/components/ui/DCard";
import { DPill, type PillTone } from "@/components/ui/DPill";
import { getPedidos } from "@/services/pedidosService";
import type { PedidoItem } from "@/app/[obraId]/dashboard/pedidos/data";

const STATE_MAP: Record<string, { label: string; tone: PillTone; dot: string }> = {
  late:     { label: "DEMORADO",   tone: "criticalSolid",  dot: "#EF4444" },
  transit:  { label: "EN CAMINO",  tone: "info",           dot: "#3B82F6" },
  approved: { label: "APROBADO",   tone: "primary",        dot: "#0F4395" },
  pending:  { label: "POR APROBAR", tone: "attentionSolid", dot: "#F59E0B" },
};

const UPCOMING_STATES = ["late", "transit", "approved", "pending"];
const LIMIT = 4;

function sortKey(order: PedidoItem): number {
  if (!order.dateISO) return Number.MAX_SAFE_INTEGER;
  const t = new Date(order.dateISO).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

interface Props {
  obraId: string;
  onViewAll?: () => void;
}

export function UpcomingDeliveriesCard({ obraId, onViewAll }: Props) {
  const [orders, setOrders] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPedidos(obraId)
      .then((rows) => {
        if (active) setOrders(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [obraId]);

  const upcoming = orders
    .filter((o) => UPCOMING_STATES.includes(o.state))
    .sort((a, b) => sortKey(a) - sortKey(b));
  const shown = upcoming.slice(0, LIMIT);

  return (
    <DCard padding="p-0" className="flex flex-col">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-none">
        <div className="text-[13px] font-bold">Próximas entregas</div>
        <button onClick={onViewAll} className="text-[11px] font-bold text-primary hover:underline">
          Ver pedidos →
        </button>
      </div>
      <div className="p-4 flex-1">
        {loading ? (
          <div className="text-center text-slate-400 text-[12px] py-6">Cargando…</div>
        ) : shown.length === 0 ? (
          <div className="text-center text-slate-400 text-[12px] py-6">No hay entregas próximas</div>
        ) : (
          <div className="space-y-2">
            {shown.map((d) => {
              const st = STATE_MAP[d.state] || STATE_MAP.pending;
              return (
                <button
                  key={d.id}
                  onClick={onViewAll}
                  className="w-full flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 hover:border-primary hover:bg-slate-50 text-left transition-colors"
                >
                  <span className="w-[6px] h-[6px] rounded-full flex-none" style={{ background: st.dot }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-slate-950 truncate leading-tight">{d.mat}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {d.prov}
                      {d.date ? ` · ${d.date}` : ""}
                    </div>
                  </div>
                  <DPill tone={st.tone}>{st.label}</DPill>
                </button>
              );
            })}
            {upcoming.length > shown.length && (
              <div className="text-[11px] text-slate-500 text-center pt-1">
                +{upcoming.length - shown.length} pedido{upcoming.length - shown.length === 1 ? "" : "s"} más en camino
              </div>
            )}
          </div>
        )}
      </div>
    </DCard>
  );
}
