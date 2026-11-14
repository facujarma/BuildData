"use client";

import type { ReactNode } from "react";

// Piezas visuales compartidas por las secciones de Configuración. Estaban
// duplicadas dentro de ScreenConfiguracion; se extrajeron para que el editor de
// roles use exactamente el mismo estilo.

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] tracking-wide uppercase font-bold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "text-[13px] bg-slate-50 border border-slate-200 rounded-md px-3 py-[7px] focus:outline-none focus:border-primary focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

export function Toggle({
  on,
  onChange,
  disabled,
  title,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      disabled={disabled}
      title={title}
      className={`w-[38px] h-[22px] rounded-full flex items-center px-[3px] transition-colors flex-none ${on ? "bg-primary justify-end" : "bg-slate-200 justify-start"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}

export function SettingsCard({
  title,
  hint,
  children,
  actions,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-slate-950">{title}</h2>
          {hint && <div className="text-[11px] text-slate-500 mt-[2px]">{hint}</div>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
