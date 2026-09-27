"use client";

import { Lock } from "@gravity-ui/icons";

export function Step3() {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center flex-none">
          <Lock width={16} height={16} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-950">Equipo</span>
            <span className="text-[9px] font-bold tracking-[0.05em] uppercase text-slate-500 bg-slate-200 rounded px-[5px] py-[2px]">Próximamente</span>
          </div>
          <div className="text-[12px] text-slate-500 leading-snug mt-1">
            Por ahora la obra se crea solo con vos como <b className="text-slate-700">Director de obra</b>. Invitar y asignar roles va a estar disponible en una próxima versión.
          </div>
        </div>
      </div>

      <div className="opacity-50 pointer-events-none select-none border border-dashed border-slate-200 rounded-lg p-4 space-y-2">
        <div className="h-10 rounded-md bg-slate-100" />
        <div className="h-10 rounded-md bg-slate-100" />
        <div className="h-10 rounded-md bg-slate-100" />
        <div className="h-10 rounded-md bg-slate-100" />
      </div>
    </div>
  );
}
