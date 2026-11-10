"use client";

import { motion as m } from "framer-motion";
import Image from "next/image";
import Icon from "../_components/Icon";

const CALLOUTS = [
  {
    icon: "trending",
    title: "Tendencias automáticas",
    body: "Detecta atrasos en rubros antes de que se vuelvan críticos.",
  },
  {
    icon: "shield",
    title: "Trazabilidad completa",
    body: "Quién reportó qué, cuándo y desde dónde. Auditable.",
  },
  {
    icon: "users",
    title: "Multi-rol, multi-obra",
    body: "Director, jefe de obra, contratista, cliente. Cada uno ve lo suyo.",
  },
];

export default function DashboardSection() {
  return (
    <section
      id="dashboard"
      className="py-[100px] bg-gradient-to-b from-paper to-primary-50/40 relative overflow-hidden"
    >
      <div className="absolute inset-0 hero-mesh opacity-40 pointer-events-none" />
      <div className="relative max-w-[1320px] mx-auto px-6">
        <div className="max-w-[820px] mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="eyebrow text-primary">Dashboard</div>
            <span className="inline-flex items-center gap-1 bg-success50 text-[#15803D] text-[10px] font-bold tracking-wider uppercase px-2 py-[3px] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span>Vista previa</span>
            </span>
          </div>
          <h2 className="text-[clamp(32px,4vw,48px)] leading-[1.08] font-extrabold display-tight text-slate950 mb-4">
            Una vista clara de cada obra.
            <br />
            <span className="text-primary">Conocé el panel por dentro.</span>
          </h2>
          <p className="text-[17px] leading-[26px] text-slate600 max-w-[640px]">
            Un resumen de lo que tu equipo carga por WhatsApp: avance, pedidos, alertas y tareas,
            todo junto y actualizado.
          </p>
        </div>

        {/* Browser frame */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute inset-x-10 -inset-y-2 bg-primary/20 blur-3xl rounded-full -z-0" />
          <div className="relative bg-slate950 rounded-2xl p-3 shadow-big">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="flex gap-[6px]">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 max-w-[420px] mx-auto bg-slate800 text-slate400 text-[11px] rounded-md px-3 py-[5px] flex items-center gap-2 font-mono">
                <Icon name="shield" size={11} className="text-success" />
                <span>app.buildata.com.ar / belgrano</span>
              </div>
              <div className="text-slate500 text-[11px] hidden md:flex items-center gap-3">
                <Icon name="search" size={12} />
                <Icon name="more" size={12} />
              </div>
            </div>

            <div className="hidden lg:block">
              <Image
                src="/landing/dashboard-preview.webp"
                alt="Dashboard de BuildData con el avance, las tareas en curso, los pedidos y las alertas de una obra"
                width={1320}
                height={720}
                className="block w-full h-auto rounded-lg border border-slate200"
              />
            </div>
            <MobileDashboardPreview />
          </div>
        </m.div>

        {/* Three feature callouts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {CALLOUTS.map((callout) => (
            <div
              key={callout.title}
              className="bg-white border border-slate200 rounded-xl p-5 shadow-card"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-3">
                <Icon name={callout.icon} size={18} />
              </div>
              <div className="text-[15px] font-bold text-slate950 mb-1">{callout.title}</div>
              <div className="text-[13px] text-slate600 leading-[20px]">{callout.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileDashboardPreview() {
  const stats = [
    ["68%", "Avance total", "text-primary"],
    ["7", "Pedidos", "text-accent-700"],
    ["3", "Alertas críticas", "text-critical"],
    ["9/12", "Tareas hoy", "text-[#15803D]"],
  ];

  return (
    <div className="lg:hidden bg-paper p-4 text-left">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-[16px] font-extrabold display-tight text-slate950">Dashboard</div>
          <div className="text-[11px] text-slate500 truncate">Edificio Belgrano · hace 12 min</div>
        </div>
        <span className="text-[11px] font-bold text-white bg-primary rounded-md px-3 py-[6px] flex-none">
          + Nuevo
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {stats.map(([value, label, tone]) => (
          <div key={label} className="bg-white border border-slate200 rounded-lg p-3">
            <div className={`text-[22px] font-extrabold display-tight tnum leading-none ${tone}`}>
              {value}
            </div>
            <div className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate600 mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate200 rounded-lg p-4 mb-3">
        <div className="text-[12px] font-bold text-slate950 mb-3">Avance por rubro</div>
        {[
          ["Mampostería", 88, "#22C55E"],
          ["Hormigón armado", 62, "#0F4395"],
          ["Instalaciones", 46, "#3B82F6"],
          ["Terminaciones", 24, "#F59E0B"],
        ].map(([name, pct, color]) => (
          <div key={name} className="grid grid-cols-[minmax(0,1fr)_34px] gap-2 items-center py-[5px]">
            <div className="min-w-0">
              <div className="text-[11px] text-slate700 truncate mb-1">{name}</div>
              <span className="block h-[6px] bg-slate100 rounded-full overflow-hidden">
                <span
                  className="block h-full rounded-full"
                  style={{ width: pct + "%", background: color }}
                />
              </span>
            </div>
            <span className="text-[11px] font-bold text-right tnum">{pct}%</span>
          </div>
        ))}
      </div>

      <div className="blueprint-bg rounded-lg p-4 text-white mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-[9px] font-bold tracking-wider uppercase px-2 py-[3px] rounded">
            <Icon name="sparkle" size={10} /> Análisis IA
          </span>
          <span className="text-[10px] text-white/60">hace 8 min</span>
        </div>
        <div className="text-[13px] font-bold leading-snug">
          El rubro hormigón armado se está retrasando 3 días.
        </div>
      </div>

      <div className="text-[11px] text-slate500 text-center leading-snug">
        La vista completa se ve mejor en una pantalla grande.
      </div>
    </div>
  );
}
