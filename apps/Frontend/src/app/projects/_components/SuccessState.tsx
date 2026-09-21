"use client";

import { ArrowRight } from "@gravity-ui/icons";
import { TYPES } from "@/app/projects/data/wizard";
import { formatNumber } from "@/lib/format";

export function SuccessState({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="flex flex-col">
      <div className="blueprint-bg px-8 py-10 text-center text-white relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center mx-auto mb-4 ring-4 ring-success/30">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-[26px] font-extrabold display-tight leading-tight">¡Tu obra está creada!</h2>
        <p className="text-[14px] text-white/70 mt-2 max-w-[480px] mx-auto leading-snug">
          <b className="text-white">{data.name}</b> ya está lista. Entrá al dashboard para empezar a gestionarla.
        </p>
      </div>

      <div className="p-8">
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Resumen</div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-[13px]">
          <div className="text-slate-500">Nombre</div><div className="font-bold text-slate-950 text-right truncate">{data.name || "—"}</div>
          <div className="text-slate-500">Tipo</div><div className="font-bold text-slate-950 text-right">{TYPES.find((t: any) => t.id === data.type)?.name || "—"}</div>
          <div className="text-slate-500">Ubicación</div><div className="font-bold text-slate-950 text-right truncate">{data.address ? `${data.address}${data.city ? ", " + data.city : ""}` : "—"}</div>
          <div className="text-slate-500">Equipo</div><div className="font-bold text-slate-950 text-right">{data.team.length} persona{data.team.length === 1 ? "" : "s"}</div>
          <div className="text-slate-500">Cliente</div><div className="font-bold text-slate-950 text-right truncate">{data.client?.name || "—"}</div>
          <div className="text-slate-500">Presupuesto</div><div className="font-bold text-slate-950 text-right tnum">AR$ {formatNumber(data.budgetTotal)}</div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-8 py-4 flex items-center justify-between bg-slate-50">
        <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950">Más tarde</button>
        <a href="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold bg-primary hover:bg-primary-700 text-white rounded-md px-4 py-[9px]">
          Ir al dashboard <ArrowRight width={14} height={14} />
        </a>
      </div>
    </div>
  );
}
