"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Xmark } from "@gravity-ui/icons";

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  accent?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function SideDrawer({ open, title, subtitle, accent, onClose, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-x-0 bottom-0 top-[var(--dash-topbar-h)] z-[55] bg-slate-950/40 backdrop-blur-[2px] animate-fade-task" />
      <aside className="fixed right-0 top-[var(--dash-topbar-h)] bottom-0 z-[60] w-[440px] max-w-[calc(100vw-32px)] bg-white border-l border-slate-200 shadow-big flex flex-col animate-slide-task overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 flex-none">
          <div className="min-w-0 flex-1">
            {accent
              ? (
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full flex-none" style={{ background: accent }} />
                  <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-600 truncate">{subtitle}</span>
                </div>
              )
              : subtitle && <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">{subtitle}</div>}
            <h3 className="text-[18px] font-extrabold display-tight text-slate-950 leading-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center flex-none">
            <Xmark width={16} height={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-slate-200 p-3 flex items-center gap-2 flex-none">{footer}</div>}
      </aside>
    </>
  );
}
