"use client";

import { Check, CircleInfo } from "@gravity-ui/icons";
import { SideDrawer } from "../../_components/SideDrawer";
import Button from "@/components/ui/Button";
import { DPill } from "@/components/ui/DPill";
import { LVL, STATE, type AlertaItem } from "../data";

export function AlertaDrawer({
  alert,
  onClose,
  onResolve,
}: {
  alert: AlertaItem;
  onClose: () => void;
  onResolve: (id: string) => void;
}) {
  const lv = LVL[alert.lvl];
  const st = STATE[alert.state];
  const resolved = alert.state === "resolved";

  const steps = [
    { on: true, label: "Reportada", sub: `${alert.who} · ${alert.time}` },
    { on: resolved, label: "Resuelta", sub: resolved ? "Cerrada" : "Pendiente" },
  ];

  return (
    <SideDrawer
      open
      title={alert.title}
      subtitle={alert.cat}
      accent={lv.stripe}
      onClose={onClose}
      footer={
        !resolved ? (
          <Button
            variant="primary"
            size="sm"
            className="flex-1 justify-center"
            icon={<Check width={14} height={14} />}
            onClick={() => onResolve(alert.id)}
          >
            Resolver alerta
          </Button>
        ) : undefined
      }
    >
      <div
        className={`rounded-lg border border-slate-200 px-4 py-3 flex items-center justify-between mb-4 ${
          resolved ? "bg-success-50" : lv.soft
        }`}
      >
        <DPill tone={st.pill as "slate"}>{st.label}</DPill>
        <div className="text-[11px] text-slate-600">Reportado {alert.time}</div>
      </div>

      <div className="mb-4">
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Seguimiento</div>
        <div className="space-y-0">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-none ${
                    s.on ? "bg-success text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  <Check width={11} height={11} />
                </span>
                {i < steps.length - 1 && (
                  <span className={`w-[2px] h-7 ${steps[i + 1].on ? "bg-success" : "bg-slate-200"}`} />
                )}
              </div>
              <div className={`pb-3 ${s.on ? "" : "opacity-60"}`}>
                <div className="text-[12px] font-bold text-slate-950 leading-tight">{s.label}</div>
                <div className="text-[11px] text-slate-500">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Descripción</div>
        <p className="text-[13px] text-slate-700 leading-relaxed">
          {alert.desc || "Sin descripción."}
        </p>
      </div>

      <div className="flex items-start gap-2 text-[12px] text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <CircleInfo width={13} height={13} className="text-slate-400 mt-[1px] flex-none" />
        <span>
          <b>Categoría:</b> {alert.cat} · <b>Severidad:</b> {lv.tag}
        </span>
      </div>
    </SideDrawer>
  );
}
