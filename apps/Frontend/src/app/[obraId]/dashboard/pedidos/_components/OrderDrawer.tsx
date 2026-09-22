"use client";

import { useEffect, type ReactNode } from "react";
import {
  Box,
  Check,
  Clock,
  Persons,
  Receipt,
  TriangleExclamation,
  Xmark,
} from "@gravity-ui/icons";
import { DPill } from "@/components/ui/DPill";
import DButton from "@/components/ui/Button";
import type { PedidoItem } from "../data";
import { STATE_MAP } from "../data";
import { formatARS } from "@/lib/format";

interface Props {
  order: PedidoItem;
  onClose: () => void;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  onChangeState: (id: string, estado: "en_camino" | "demorado") => void;
  onDeliver: (id: string) => void;
  onComprobante: () => void;
}

const STEPS = [
  { key: "draft", label: "Creado", n: 0 },
  { key: "pending", label: "Por aprobar", n: 1 },
  { key: "approved", label: "Aprobado", n: 2 },
  { key: "transit", label: "En camino", n: 3 },
  { key: "delivered", label: "Entregado", n: 4 },
];

export function OrderDrawer({ order, onClose, onApprove, onCancel, onChangeState, onDeliver, onComprobante }: Props) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const st = STATE_MAP[order.state] || STATE_MAP.draft;
  const isDelivered = order.state === "delivered";
  const isCancelled = order.state === "cancelled";
  const curStep = order.state === "late" ? 3 : st.step;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[55] bg-slate-950/40 backdrop-blur-[2px] animate-fade-task" />
      <aside className="fixed right-0 top-0 bottom-0 z-[60] w-[440px] max-w-[calc(100vw-32px)] bg-white border-l border-slate-200 shadow-big flex flex-col animate-slide-task overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 flex-none">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 tnum">{order.id.slice(0, 8)}</span>
              {order.urgent && <DPill tone="criticalSolid">URGENTE</DPill>}
            </div>
            <h3 className="text-[18px] font-extrabold display-tight text-slate-950 leading-tight">{order.mat || "Sin material"}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center flex-none"
          >
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <DPill tone={st.tone}>{st.label}</DPill>
            <div className="text-right">
              <div className="text-[20px] font-extrabold tnum text-slate-950 leading-none">{formatARS(order.total)}</div>
              <div className="text-[10px] text-slate-500 mt-[2px]">{order.unit || "—"}</div>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-slate-200">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Estado del pedido</div>
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const reached = step.n <= curStep;
                const isLateHere = order.state === "late" && step.key === "transit";
                return (
                  <div key={step.key} className="flex items-center gap-3 relative">
                    <div className="flex flex-col items-center">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-none text-[10px] font-bold ${
                          isLateHere ? "bg-critical text-white" : reached ? "bg-success text-white" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {reached ? (
                          isLateHere ? (
                            <TriangleExclamation width={11} height={11} />
                          ) : (
                            <Check width={11} height={11} />
                          )
                        ) : (
                          step.n + 1
                        )}
                      </span>
                      {i < STEPS.length - 1 && <span className={`w-[2px] h-6 ${step.n < curStep ? "bg-success" : "bg-slate-200"}`} />}
                    </div>
                    <div className={`text-[12px] font-semibold pb-3 ${reached ? "text-slate-950" : "text-slate-400"}`}>
                      {step.label}
                      {isLateHere && <span className="text-[#B91C1C] font-bold"> · demorado</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-slate-200">
            {(
              [
                ["Proveedor", order.prov],
                ["Rubro", order.cat],
                ["Cantidad", order.qty],
                ["Precio unitario", order.unit],
                ["Pedido el", order.ordered],
                ["Llegada estimada", order.date],
                ["Solicitado por", order.who],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label}>
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">{label}</div>
                <div className="text-[12px] font-semibold text-slate-950">{value || "—"}</div>
              </div>
            ))}
          </div>

          {isDelivered && order.delivery && (
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-[#15803D] mb-2 flex items-center gap-1">
                <Check width={12} height={12} /> Recepción confirmada
              </div>
              <div className="bg-success-50 border border-[#BBF7D0] rounded-lg p-3 space-y-2">
                {(
                  [
                    ["Fecha y hora", order.delivery.date, <Clock key="c" width={13} height={13} />],
                    ["Lugar de entrega", order.delivery.loc, <Box key="b" width={13} height={13} />],
                    ["Recibido por", order.delivery.receiver, <Persons key="p" width={13} height={13} />],
                    ["Documento", order.delivery.doc, <Receipt key="r" width={13} height={13} />],
                  ] as [string, string, ReactNode][]
                ).map(([label, value, icon]) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className="text-[#15803D] mt-[1px] flex-none">{icon}</span>
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-[0.04em] uppercase font-bold text-[#15803D]/70">{label}</div>
                      <div className="text-[12px] font-semibold text-slate-900">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.note && (
            <div className="px-5 py-4">
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Observaciones</div>
              <div
                className={`text-[12px] leading-snug rounded-lg p-3 ${
                  order.state === "late" || order.urgent ? "bg-critical-50 text-[#B91C1C]" : "bg-slate-50 text-slate-700"
                }`}
              >
                {order.note}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-3 flex items-center gap-2 flex-none">
          {order.state === "pending" ? (
            <>
              <DButton variant="secondary" size="sm" className="text-[#B91C1C]" onClick={() => onCancel(order.id)}>
                Cancelar pedido
              </DButton>
              <DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => onApprove(order.id)}>
                Aprobar pedido
              </DButton>
            </>
          ) : isCancelled || isDelivered ? (
            <DButton variant="secondary" size="sm" className="flex-1 justify-center" onClick={onComprobante}>
              Comprobante
            </DButton>
          ) : (
            <>
              <DButton variant="secondary" size="sm" className="text-[#B91C1C]" onClick={() => onCancel(order.id)}>
                Cancelar
              </DButton>
              {order.state !== "transit" && (
                <DButton variant="secondary" size="sm" onClick={() => onChangeState(order.id, "en_camino")}>
                  En camino
                </DButton>
              )}
              {order.state !== "late" && (
                <DButton variant="secondary" size="sm" onClick={() => onChangeState(order.id, "demorado")}>
                  Demorado
                </DButton>
              )}
              <DButton
                variant="primary"
                size="sm"
                className="flex-1 justify-center"
                icon={<Check width={13} height={13} />}
                onClick={() => onDeliver(order.id)}
              >
                Registrar entrega
              </DButton>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
