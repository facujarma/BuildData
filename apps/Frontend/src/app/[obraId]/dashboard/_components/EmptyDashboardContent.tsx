"use client";

import {
  LayoutHeaderCellsLarge,
  ChartBar,
  CircleExclamation,
  Box,
  Check,
} from "@gravity-ui/icons";
import { DPageHeader } from "./DPageHeader";
import { DCard } from "@/components/ui/DCard";

function BlueprintIllo() {
  return (
    <div className="w-[220px] h-[160px] rounded-lg blueprint-bg relative overflow-hidden">
      <svg viewBox="0 0 220 160" className="absolute inset-0 w-full h-full opacity-90">
        <rect x="40" y="90" width="22" height="50" rx="2" fill="#F59E0B" opacity="0.85" />
        <rect x="70" y="60" width="22" height="80" rx="2" fill="#ffffff" opacity="0.92" />
        <rect x="100" y="40" width="22" height="100" rx="2" fill="#0F4395" />
        <rect x="130" y="70" width="22" height="70" rx="2" fill="#ffffff" opacity="0.7" />
        <rect x="160" y="50" width="22" height="90" rx="2" fill="#F59E0B" opacity="0.55" />
        <rect x="100" y="40" width="22" height="14" rx="2" fill="#F59E0B" />
        <path d="M30 30 L195 30 M30 30 L30 130 M30 35 L48 30 M30 50 L60 30 M30 65 L72 30" stroke="#ffffff" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function StepRow({
  n,
  title,
  body,
  done,
}: {
  n: number;
  title: string;
  body: string;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] flex-none
          ${done ? "bg-success text-white" : "bg-slate-100 text-slate-600"}`}
      >
        {done ? <Check width={14} height={14} /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-[13px] font-bold leading-tight ${done ? "text-slate-500 line-through" : "text-slate-950"}`}
        >
          {title}
        </div>
        <div className="text-[11px] text-slate-500 leading-snug mt-[2px]">{body}</div>
      </div>
    </div>
  );
}

export function EmptyDashboardContent() {
  const steps = [
    { n: 1, title: "Crear la obra", body: "Nombre, dirección y fechas ya cargados.", done: true },
    { n: 2, title: "Cargar el cronograma", body: "Creá las tareas y sus rubros desde Cronograma.", done: false },
    { n: 3, title: "Invitar al equipo", body: "Sumá capataces, compras y dirección desde Equipo.", done: false },
    { n: 4, title: "Registrar el primer reporte", body: "Cuando el bot de WhatsApp esté conectado, mandá un audio o una foto.", done: false },
  ];

  return (
    <>
      <DPageHeader
        title="¡Bienvenido a BuildData!"
        subtitle="Empecemos a cargar los datos de tu obra."
      />

      <div className="grid grid-cols-[1fr_auto] gap-6 items-center bg-white border border-slate-200 rounded-xl p-7 shadow-card">
        <div className="max-w-[520px]">
          <div className="text-[10px] tracking-[0.08em] uppercase font-bold text-primary mb-2">
            Primeros pasos
          </div>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-none">
              <LayoutHeaderCellsLarge width={18} height={18} />
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold display-tight text-slate-950 leading-tight">
                Tu obra todavía no tiene datos.
              </h2>
              <p className="text-[13px] text-slate-600 leading-snug mt-2">
                Cuando cargues tareas, pedidos y reportes, este panel va a mostrar
                el avance por rubro, las alertas activas y el resumen de lo que pasó
                en la obra.
              </p>
            </div>
          </div>
        </div>
        <div className="flex-none">
          <BlueprintIllo />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-4">
        {[
          { label: "Avance total",     icon: <ChartBar width={16} height={16} />,   tint: "bg-primary-50 text-primary" },
          { label: "Alertas críticas", icon: <CircleExclamation width={16} height={16} />, tint: "bg-critical-50 text-[#B91C1C]" },
          { label: "Pedidos",          icon: <Box width={16} height={16} />,        tint: "bg-attention-50 text-[#A16207]" },
          { label: "Tareas hoy",       icon: <Check width={16} height={16} />,      tint: "bg-success-50 text-[#15803D]" },
        ].map((m) => (
          <DCard key={m.label} padding="p-4" className="opacity-70">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${m.tint}`}>
              {m.icon}
            </div>
            <div className="text-[26px] font-extrabold display-tight tnum text-slate-300 leading-none">
              —
            </div>
            <div className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate-600 mt-1">
              {m.label}
            </div>
            <div className="text-[11px] font-semibold mt-2 text-slate-400">
              Sin datos aún
            </div>
          </DCard>
        ))}
      </div>

      <DCard padding="p-0" className="mt-4 max-w-[640px]">
        <div className="px-5 py-3 border-b border-slate-200">
          <div className="text-[14px] font-bold text-slate-950">Lista de configuración</div>
          <div className="text-[11px] text-slate-500 mt-[1px]">
            1 de {steps.length} pasos completados
          </div>
        </div>
        <div className="px-5 py-2 divide-y divide-slate-100">
          {steps.map((s) => <StepRow key={s.n} {...s} />)}
        </div>
      </DCard>
    </>
  );
}
