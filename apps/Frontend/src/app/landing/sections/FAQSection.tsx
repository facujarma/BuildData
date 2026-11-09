"use client";

import { useState } from "react";
import Icon from "../_components/Icon";

const QUESTIONS: Array<[string, string]> = [
  [
    "¿Cuánto tiempo toma implementar BuildData?",
    "Menos de un día. Escaneás el QR para vincular el bot de WhatsApp, cargás los datos de la obra y el equipo puede empezar a reportar en el momento.",
  ],
  [
    "¿Mi equipo tiene que aprender a usar una app?",
    "No. Los capataces y obreros siguen usando WhatsApp exactamente como hoy. Solo la dirección entra al panel web.",
  ],
  [
    "¿Qué pasa si la IA interpreta mal un mensaje?",
    "Nada se carga solo. Todo pasa por una bandeja donde ves el mensaje original y lo que la IA entendió: confirmás, corregís o descartás.",
  ],
  [
    "¿Sirve para varias obras a la vez?",
    "Sí. Cada obra tiene su panel, su equipo y su presupuesto, y desde el inicio ves todas juntas con su avance y alertas.",
  ],
  [
    "¿Puedo exportar la información?",
    "Sí. Generás un informe eligiendo qué secciones y qué período, y lo descargás en PDF para mandarle al cliente o al inversor.",
  ],
  [
    "¿Cómo se mide el avance de una tarea?",
    "Por cantidad ejecutada sobre la prevista (por ejemplo 28 de 45 m³) o por subtareas completadas. Nunca es un número estimado a ojo.",
  ],
];

export default function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="relative py-[110px] bg-white overflow-hidden">
      <div className="bd-dots bd-dots-bl" aria-hidden="true" />
      <div className="relative max-w-[1180px] mx-auto px-6 grid lg:grid-cols-[minmax(0,420px)_1fr] gap-14 items-start">
        <div className="relative rounded-[28px] w-full aspect-[4/5] hidden lg:block overflow-hidden bg-gradient-to-b from-[#EAF1FC] to-[#F7F9FD] lg:sticky lg:top-28">
          <svg
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMax meet"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="faqB1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1A4FA6" />
                <stop offset="1" stopColor="#0F4395" />
              </linearGradient>
              <linearGradient id="faqB2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7FA2D9" />
                <stop offset="1" stopColor="#5E86C8" />
              </linearGradient>
              <linearGradient id="faqB3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#C7D7F0" />
                <stop offset="1" stopColor="#AFC4E6" />
              </linearGradient>
            </defs>

            {/* sol + nubes */}
            <circle cx="300" cy="92" r="30" fill="#F59E0B" opacity="0.18" />
            <circle cx="300" cy="92" r="17" fill="#F59E0B" opacity="0.9" />
            <g fill="#fff">
              <rect x="56" y="78" width="74" height="18" rx="9" />
              <rect x="74" y="66" width="38" height="22" rx="11" />
              <rect x="226" y="140" width="56" height="14" rx="7" opacity="0.85" />
            </g>

            {/* grúa */}
            <g stroke="#0F4395" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M268 330 V120" />
              <path d="M200 124 H348" />
              <path d="M268 124 L236 150 M268 124 L300 150" />
              <path d="M330 124 V168" />
            </g>
            <rect x="322" y="168" width="16" height="12" rx="2" fill="#F59E0B" />
            <rect x="202" y="122" width="16" height="10" rx="2" fill="#0F4395" />

            {/* edificio fondo */}
            <rect x="40" y="200" width="70" height="140" rx="6" fill="url(#faqB3)" />
            {[0, 1, 2, 3, 4].map((row) =>
              [0, 1].map((col) => (
                <rect
                  key={"a" + row + col}
                  x={54 + col * 26}
                  y={216 + row * 24}
                  width="16"
                  height="12"
                  rx="2"
                  fill="#fff"
                  opacity="0.8"
                />
              )),
            )}

            {/* edificio principal */}
            <rect x="120" y="150" width="100" height="190" rx="8" fill="url(#faqB1)" />
            {[0, 1, 2, 3, 4, 5].map((row) =>
              [0, 1, 2].map((col) => {
                const accent = (row === 1 && col === 2) || (row === 3 && col === 0);
                return (
                  <rect
                    key={"b" + row + col}
                    x={136 + col * 26}
                    y={170 + row * 26}
                    width="16"
                    height="14"
                    rx="2"
                    fill={accent ? "#F59E0B" : "#fff"}
                    opacity={accent ? 1 : 0.9}
                  />
                );
              }),
            )}
            <rect x="160" y="310" width="20" height="30" rx="2" fill="#0B3275" />

            {/* edificio en construcción */}
            <rect x="232" y="232" width="74" height="108" rx="6" fill="url(#faqB2)" />
            <g stroke="#fff" strokeWidth="2" opacity="0.55">
              <path d="M232 262 H306 M232 292 H306 M232 322 H306" />
              <path d="M257 232 V340 M281 232 V340" />
            </g>
            <rect x="232" y="224" width="74" height="10" rx="3" fill="#F59E0B" />

            {/* suelo */}
            <rect x="24" y="338" width="352" height="6" rx="3" fill="#0F4395" opacity="0.18" />
            <rect x="330" y="316" width="22" height="22" rx="4" fill="#F59E0B" opacity="0.85" />
            <rect x="334" y="304" width="14" height="14" rx="3" fill="#F59E0B" opacity="0.55" />
          </svg>
        </div>

        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.14em] uppercase text-primary mb-5">
            <span className="w-[6px] h-[6px] rounded-full bg-primary" /> Preguntas frecuentes
          </span>
          <h2 className="text-[clamp(30px,4.2vw,46px)] leading-[1.08] font-extrabold display-tight text-slate950 mb-4">
            Encontrá las respuestas
            <br />
            a todas tus preguntas
          </h2>
          <p className="text-[16px] text-slate500 leading-relaxed mb-9">
            Lo que más nos consultan antes de empezar a usar BuildData.
          </p>
          <div className="border-t border-slate200">
            {QUESTIONS.map(([question, answer], index) => {
              const on = open === index;
              return (
                <div key={question} className="border-b border-slate200">
                  <button
                    onClick={() => setOpen(on ? -1 : index)}
                    className="w-full flex items-center justify-between gap-5 text-left py-5 group"
                  >
                    <span
                      className={`text-[16px] font-bold leading-snug transition-colors duration-300 ${
                        on ? "text-primary" : "text-slate950 group-hover:text-primary"
                      }`}
                    >
                      {question}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-none transition-all duration-300 ease-out ${
                        on
                          ? "bg-primary text-white rotate-180"
                          : "bg-slate100 text-slate600 group-hover:bg-primary-50"
                      }`}
                    >
                      <Icon name="chevron-down" size={15} />
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-[380ms] ease-[cubic-bezier(.16,1,.3,1)] ${
                      on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p
                        className={`text-[14.5px] text-slate600 leading-relaxed pb-6 pr-12 transition-transform duration-[380ms] ease-out ${
                          on ? "translate-y-0" : "-translate-y-2"
                        }`}
                      >
                        {answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
