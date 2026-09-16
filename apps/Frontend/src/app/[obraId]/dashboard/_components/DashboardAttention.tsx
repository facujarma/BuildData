"use client";

import { ArrowRight, Check } from "@gravity-ui/icons";

interface Props {
  mensajes: number;
  pedidos: number;
  alertas: number;
  alertasCriticas: number;
  onNavigate: (section: string) => void;
}

export function DashboardAttention({ mensajes, pedidos, alertas, alertasCriticas, onNavigate }: Props) {
  const actions = [
    {
      n: mensajes,
      label: "mensajes por confirmar",
      sub: "La IA ya los interpretó — revisá antes de aplicar",
      to: "inbox",
      tone: "bg-white border-slate-200",
      badge: "bg-primary text-white",
      cta: "Revisar",
      always: false,
    },
    {
      n: pedidos,
      label: "pedidos por aprobar",
      sub: pedidos > 0 ? `${pedidos} esperando tu aprobación` : "Sin pedidos pendientes",
      to: "pedidos",
      tone: "bg-attention-50 border-[#FDE68A]",
      badge: "bg-accent text-slate-950",
      cta: "Aprobar",
      always: true,
    },
    {
      n: alertas,
      label: "alertas sin atender",
      sub: `${alertasCriticas} crítica${alertasCriticas === 1 ? "" : "s"} frenando trabajo`,
      to: "alertas",
      tone: "bg-critical-50 border-[#FECACA]",
      badge: "bg-critical text-white",
      cta: "Ver",
      always: false,
    },
  ].filter((a) => a.n > 0 || a.always);

  const total = actions.reduce((a, x) => a + x.n, 0);

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] tracking-[0.08em] uppercase font-bold text-slate-600">Requiere tu atención</span>
        <span className="text-[10px] font-bold text-white bg-critical rounded-full px-[7px] py-[2px] tnum">{total}</span>
      </div>
      {actions.length === 0 ? (
        <div className="flex items-center gap-3 bg-success-50 border border-[#BBF7D0] rounded-lg p-4">
          <span className="w-9 h-9 rounded-full bg-success text-white flex items-center justify-center flex-none">
            <Check width={17} height={17} />
          </span>
          <div className="text-[13px] font-bold text-[#15803D]">Todo al día. No hay nada esperando tu decisión.</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => onNavigate(a.to)}
              className={"text-left border rounded-lg p-4 hover:shadow-card2 transition-all group " + a.tone}
            >
              <div className="flex items-start gap-3">
                <span className={"w-9 h-9 rounded-lg flex items-center justify-center flex-none font-extrabold text-[15px] tnum " + a.badge}>
                  {a.n}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-slate-950 leading-tight">{a.label}</div>
                  <div className="text-[11px] text-slate-600 leading-snug mt-[3px]">{a.sub}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-950/[0.07] flex items-center gap-1 text-[11px] font-bold text-primary">
                {a.cta} <ArrowRight width={11} height={11} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
