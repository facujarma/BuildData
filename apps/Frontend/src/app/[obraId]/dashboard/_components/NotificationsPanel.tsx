"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "@gravity-ui/icons";

/**
 * Notificaciones: todavía no hay un sistema real que las genere. El panel se
 * mantiene para cuando exista, pero no inventa avisos de ejemplo: sin
 * notificaciones reales, la lista queda vacía.
 */
export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const k = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", k);
    return () => document.removeEventListener("mousedown", k);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
        className={`w-9 h-9 rounded-md border bg-white flex items-center justify-center relative transition-colors ${
          open ? "border-primary text-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"
        }`}
      >
        <Bell width={15} height={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-[42px] w-[300px] bg-white rounded-xl border border-slate-200 shadow-pop overflow-hidden z-[80] animate-modal-pop">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-[13px] font-bold text-slate-950">Notificaciones</div>
          </div>
          <div className="p-6 text-center text-[12px] text-slate-500">
            No tenés notificaciones.
          </div>
        </div>
      )}
    </div>
  );
}
