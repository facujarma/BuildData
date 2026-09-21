"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  CircleExclamation,
  Comment,
  Picture,
  Car,
  Box,
  Receipt,
  Persons,
  Layers,
  Plus,
  ChevronDown,
} from "@gravity-ui/icons";

interface QuickAddItem {
  kind: string;
  label: string;
  sub: string;
  icon: typeof Calendar;
  tint: string;
}

const QUICK_ADD_GROUPS: { g: string; items: QuickAddItem[] }[] = [
  {
    g: "Obra",
    items: [
      { kind: "tarea",   label: "Tarea",     sub: "Sumala al cronograma",           icon: Calendar,          tint: "bg-primary-50 text-primary" },
      { kind: "critico", label: "Alerta",    sub: "Reportá un problema de obra",    icon: CircleExclamation, tint: "bg-critical-50 text-[#B91C1C]" },
      { kind: "reporte", label: "Actividad", sub: "Algo que no llegó por WhatsApp", icon: Comment,           tint: "bg-info-50 text-[#1D4ED8]" },
      { kind: "foto",    label: "Fotos",     sub: "Subilas a la galería",           icon: Picture,           tint: "bg-info-50 text-[#1D4ED8]" },
    ],
  },
  {
    g: "Materiales",
    items: [
      { kind: "pedido",    label: "Pedido",    sub: "Pedí material a un proveedor", icon: Car,  tint: "bg-attention-50 text-[#A16207]" },
      { kind: "material",  label: "Material",  sub: "Cargalo al stock de la obra",  icon: Box,  tint: "bg-success-50 text-[#15803D]" },
      { kind: "proveedor", label: "Proveedor", sub: "Con sus datos y contactos",    icon: Car,  tint: "bg-slate-100 text-slate-700" },
    ],
  },
  {
    g: "Costos",
    items: [
      { kind: "recibo", label: "Comprobante", sub: "Cargá una factura o recibo", icon: Receipt, tint: "bg-attention-50 text-[#A16207]" },
    ],
  },
  {
    g: "Equipo y config.",
    items: [
      { kind: "equipo", label: "Invitar al equipo", sub: "Sumá un miembro u obrero",       icon: Persons, tint: "bg-success-50 text-[#15803D]" },
      { kind: "rubro",  label: "Rubro",             sub: "Agrupa tareas, costos y pedidos", icon: Layers,  tint: "bg-primary-50 text-primary" },
    ],
  },
];

interface Props {
  onPick: (kind: string) => void;
}

export function QuickAddMenu({ onPick }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-[6px] font-bold rounded-md border transition-colors bg-primary hover:bg-primary-700 text-white border-primary text-[12px] px-3 py-[6px]"
      >
        <Plus width={13} height={13} />
        Nuevo
        <ChevronDown width={12} height={12} className={"transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {open && (
        <div className="absolute right-0 top-[42px] w-[290px] max-h-[70vh] overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-pop z-50 animate-fade-task">
          <div className="px-4 py-2 text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 border-b border-slate-100 sticky top-0 bg-white">
            Agregar rápido
          </div>
          {QUICK_ADD_GROUPS.map((grp, gi) => (
            <div key={grp.g} className={gi > 0 ? "border-t border-slate-100" : ""}>
              <div className="px-4 pt-2 pb-1 text-[9px] tracking-[0.08em] uppercase font-bold text-slate-400">{grp.g}</div>
              {grp.items.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.kind}
                    onClick={() => { setOpen(false); onPick(t.kind); }}
                    className="w-full flex items-center gap-3 px-3 py-[9px] hover:bg-slate-50 text-left transition-colors"
                  >
                    <span className={"w-8 h-8 rounded-md flex items-center justify-center flex-none " + t.tint}>
                      <Icon width={15} height={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-slate-950">{t.label}</span>
                      <span className="block text-[11px] text-slate-500 truncate">{t.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
