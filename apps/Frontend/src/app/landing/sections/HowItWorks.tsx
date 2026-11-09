"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import Icon from "../_components/Icon";
import PhoneMockup from "../_components/PhoneMockup";

// 1 · Audio entrando por WhatsApp
function HowStage1() {
  return <PhoneMockup width={290} mode="incoming" headerName="Obra Belgrano · Equipo" />;
}

// 2 · Transcripción: mensaje original + lo que se detectó
function HowStage2() {
  return (
    <div className="w-[440px] max-w-full bg-white rounded-2xl border border-slate200 shadow-[0_12px_40px_-12px_rgba(15,23,42,.18)] overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate100">
        <span className="w-[34px] h-[34px] rounded-full bg-primary-50 text-primary text-[12px] font-bold flex items-center justify-center flex-none">
          CR
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-slate950">
            C. Ríos <span className="font-medium text-slate500">· Capataz</span>
          </div>
          <div className="text-[11px] text-slate500">Audio de WhatsApp · 08:42</div>
        </div>
        <span className="text-[10px] font-bold text-slate500 bg-slate100 rounded px-2 py-[3px] tnum">
          0:14
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="text-[10px] tracking-[0.08em] uppercase font-bold text-slate400 mb-2">
          Transcripción
        </div>
        <p className="text-[14px] leading-relaxed text-slate800">
          “Llegó la mitad del hierro, falta varilla de 12. También doce bolsas de cemento para la
          losa.”
        </p>
      </div>
      <div className="px-5 pb-5">
        <div className="text-[10px] tracking-[0.08em] uppercase font-bold text-slate400 mb-2">
          Se registra como
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Entrega parcial", "Hierro 12 mm · 50%", "truck", "bg-info50 text-[#1D4ED8]"],
            ["Faltante", "Varilla de 12", "alert", "bg-critical50 text-[#B91C1C]"],
            ["Pedido", "12 bolsas de cemento", "box", "bg-attention50 text-[#A16207]"],
            ["Tarea", "Hormigonado losa +3", "calendar", "bg-primary-50 text-primary"],
          ].map(([title, detail, icon, tone]) => (
            <div key={title} className="flex items-start gap-2 border border-slate200 rounded-lg p-3">
              <span className={"w-7 h-7 rounded-md flex items-center justify-center flex-none " + tone}>
                <Icon name={icon} size={13} />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate950">{title}</div>
                <div className="text-[11px] text-slate500 truncate">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3 · Bandeja: el director confirma antes de que impacte
function HowStage3() {
  return (
    <div className="w-[440px] max-w-full space-y-3">
      <div className="bg-white rounded-2xl border border-slate200 shadow-[0_12px_40px_-12px_rgba(15,23,42,.18)] overflow-hidden">
        <div className="px-5 py-3 border-b border-slate100 flex items-center justify-between">
          <span className="text-[12px] font-bold text-slate950">Bandeja · por confirmar</span>
          <span className="text-[10px] font-bold text-white bg-primary rounded-full px-2 py-[2px] tnum">
            3
          </span>
        </div>
        <div className="px-5 py-4">
          <div className="text-[13px] font-bold text-slate950 mb-1">Pedido de material</div>
          <div className="text-[12px] text-slate500 mb-4">
            12 bolsas de cemento · Cementos del Plata
          </div>
          <div className="flex gap-2">
            <span className="flex-1 text-center text-[12px] font-bold text-white bg-primary rounded-md py-[9px]">
              Confirmar
            </span>
            <span className="text-[12px] font-bold text-slate700 border border-slate300 rounded-md px-4 py-[9px]">
              Corregir
            </span>
          </div>
        </div>
      </div>
      {[
        ["Entrega parcial registrada", "Hierro 12 mm · 1,25 t de 2,5 t"],
        ["Faltante reportado", "Varilla de 12 · asignado a Compras"],
      ].map(([title, detail]) => (
        <div
          key={title}
          className="bg-white rounded-xl border border-slate200 px-4 py-3 flex items-center gap-3"
        >
          <span className="w-7 h-7 rounded-full bg-success text-white flex items-center justify-center flex-none">
            <Icon name="check" size={13} />
          </span>
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-slate950">{title}</div>
            <div className="text-[11px] text-slate500 truncate">{detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 4 · Panel actualizado — con la navegación actual
function HowStage4() {
  const nav: Array<[string, string, boolean?, number?]> = [
    ["grid", "Dashboard", true],
    ["message", "Bandeja"],
    ["calendar", "Cronograma"],
    ["alert", "Alertas", false, 2],
    ["box", "Materiales"],
    ["dollar", "Costos"],
    ["users", "Equipo"],
  ];
  return (
    <div className="w-[600px] max-w-full bg-white rounded-2xl border border-slate200 shadow-[0_16px_48px_-14px_rgba(15,23,42,.22)] overflow-hidden flex">
      <div className="w-[148px] bg-ink-deep text-white py-4 px-2 flex-none">
        <div className="flex items-center gap-2 px-2 mb-4">
          <Icon name="logo-mark" size={20} />
          <span className="text-[12px] font-extrabold">BuildData</span>
        </div>
        {nav.map(([icon, label, active, badge]) => (
          <div
            key={label}
            className={
              "flex items-center gap-2 px-2 py-[6px] rounded-md text-[11px] font-semibold " +
              (active ? "bg-white/10 text-white" : "text-white/60")
            }
          >
            <Icon name={icon} size={12} className={active ? "text-accent" : ""} />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="text-[9px] font-bold bg-critical rounded-full px-[5px]">{badge}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0 p-4 bg-paper">
        <div className="text-[13px] font-bold text-slate950 mb-3">Requiere tu atención</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            ["3", "pedidos por aprobar", "bg-accent text-slate950"],
            ["2", "alertas sin atender", "bg-critical text-white"],
          ].map(([count, label, tone]) => (
            <div
              key={label}
              className="bg-white border border-slate200 rounded-lg p-3 flex items-center gap-2"
            >
              <span
                className={
                  "w-7 h-7 rounded-md font-extrabold text-[12px] flex items-center justify-center flex-none tnum " +
                  tone
                }
              >
                {count}
              </span>
              <span className="text-[11px] font-bold text-slate800 leading-tight">{label}</span>
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate200 rounded-lg p-3">
          <div className="text-[11px] font-bold text-slate950 mb-2">Avance por rubro</div>
          {[
            ["Mampostería", 88, "#22C55E"],
            ["Hormigón armado", 62, "#0F4395"],
            ["Instalaciones", 46, "#3B82F6"],
          ].map(([name, pct, color]) => (
            <div
              key={name}
              className="grid grid-cols-[92px_1fr_30px] gap-2 items-center py-[3px]"
            >
              <span className="text-[10px] text-slate600 truncate">{name}</span>
              <span className="h-[5px] bg-slate100 rounded-full overflow-hidden">
                <span
                  className="block h-full rounded-full"
                  style={{ width: pct + "%", background: color }}
                />
              </span>
              <span className="text-[10px] font-bold text-right tnum">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "El capataz manda un audio",
    body: "Desde la obra, por WhatsApp, como lo hace todos los días. No instala nada ni aprende una herramienta nueva.",
    visual: HowStage1,
  },
  {
    title: "Queda transcripto y ordenado",
    body: "El audio se pasa a texto y se separa en lo que corresponde: una entrega, un faltante, un pedido.",
    visual: HowStage2,
  },
  {
    title: "Vos confirmás en la bandeja",
    body: "Revisás lo que llegó y lo aprobás. Si algo no está bien, lo corregís antes de que se cargue.",
    visual: HowStage3,
  },
  {
    title: "Aparece en tu panel",
    body: "Stock, pedidos, avance y presupuesto se actualizan solos. Lo que necesita tu decisión queda arriba.",
    visual: HowStage4,
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (value) => {
      setStage(Math.min(STEPS.length - 1, Math.max(0, Math.floor(value * STEPS.length))));
    });
  }, [scrollYProgress]);

  const Visual = STEPS[stage].visual;

  return (
    <section id="how" ref={ref} className="relative bg-white py-20 lg:py-0 lg:h-[360vh]">
      <div className="lg:sticky lg:top-0 lg:h-screen flex items-center">
        <div className="max-w-[1180px] mx-auto px-6 w-full grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-14 items-center">
          {/* Texto */}
          <div>
            <div className="text-[12px] font-bold text-primary mb-3">Cómo funciona</div>
            <h2 className="text-[clamp(30px,3.6vw,42px)] leading-[1.1] font-extrabold display-tight text-slate950 mb-10">
              Del audio al panel,
              <br />
              sin cargar nada a mano.
            </h2>

            <div className="flex flex-col">
              {STEPS.map((step, index) => {
                const active = index === stage;
                return (
                  <div
                    key={step.title}
                    className={
                      "grid grid-cols-[36px_1fr] gap-4 py-4 border-t border-slate200 transition-opacity duration-300 " +
                      (active ? "opacity-100" : "opacity-35")
                    }
                  >
                    <span
                      className={
                        "text-[15px] font-extrabold tnum pt-[2px] " +
                        (active ? "text-primary" : "text-slate400")
                      }
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[17px] font-bold text-slate950 leading-snug">
                        {step.title}
                      </h3>
                      <div
                        className={
                          "grid transition-all duration-300 " +
                          (active ? "grid-rows-[1fr] mt-1" : "grid-rows-[0fr]")
                        }
                      >
                        <p className="overflow-hidden text-[14px] leading-relaxed text-slate600 max-w-[420px]">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Escena */}
          <div className="relative h-[560px] rounded-[28px] bg-paper hidden lg:flex items-center justify-center px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full flex justify-center"
              >
                <Visual />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
