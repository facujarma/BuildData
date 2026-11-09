"use client";

import { useState } from "react";

const PEOPLE = [
  {
    name: "Juan Méndez",
    role: "Director de obra en Constructora Norte",
    initials: "JM",
    quote:
      "Antes el lunes lo perdía juntando lo que había pasado la semana anterior. Ahora abro el panel y ya está todo cargado.",
    statA: "14 meses",
    statALabel: "Usando BuildData",
    statB: "4",
    statBLabel: "Obras en BuildData",
  },
  {
    name: "Ana Gómez",
    role: "Arquitecta en Estudio AG",
    initials: "AG",
    quote:
      "Las fotos dejaron de ser un rollo en el celular. Cada imagen queda atada a su tarea y su fecha, y eso me salvó en más de una discusión con el cliente.",
    statA: "1.200",
    statALabel: "Fotos organizadas",
    statB: "0",
    statBLabel: "Reclamos perdidos",
  },
  {
    name: "Lucía Benítez",
    role: "Compras en Constructora Norte",
    initials: "LB",
    quote:
      "Apruebo los pedidos desde el celular y sé al instante si un rubro se está pasando de presupuesto. Dejamos de enterarnos a fin de mes.",
    statA: "2 días",
    statALabel: "Antes en aprobar pedidos",
    statB: "−8%",
    statBLabel: "Desvío de costos",
  },
  {
    name: "Carlos Ríos",
    role: "Capataz en Edificio Belgrano",
    initials: "CR",
    quote:
      "Yo sigo mandando audios como siempre. No cambié nada de lo que hacía y ahora queda todo registrado.",
    statA: "0",
    statALabel: "Apps nuevas que aprendió",
    statB: "30 s",
    statBLabel: "Por reporte diario",
  },
];

const PORTRAIT_GRADIENTS = [
  "from-primary via-[#1A4FA6] to-[#0B3275]",
  "from-[#B45309] via-accent to-[#F59E0B]",
  "from-[#15803D] via-[#22C55E] to-[#0F4395]",
  "from-[#1E293B] via-[#334155] to-[#0F4395]",
];

export default function Testimonios() {
  const [active, setActive] = useState(0);
  const person = PEOPLE[active];

  return (
    <section className="py-[110px] bg-paper">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-[clamp(30px,4.2vw,48px)] leading-[1.08] font-extrabold display-tight text-slate950 mb-3">
            Historias reales de obra
          </h2>
          <p className="text-[16px] text-slate500">Lo que dicen quienes ya lo usan todos los días</p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,300px)_1fr] gap-10 items-start">
          <div>
            {PEOPLE.map((item, index) => {
              const on = index === active;
              return (
                <button
                  key={item.name}
                  onClick={() => setActive(index)}
                  className={`w-full text-left py-5 border-b border-slate200 transition-colors ${
                    on ? "" : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <div
                    className={`text-[19px] font-extrabold display-tight ${
                      on ? "text-primary" : "text-slate950"
                    }`}
                  >
                    {item.name}
                  </div>
                  <div className="text-[13px] text-slate500 mt-[2px]">{item.role}</div>
                </button>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-[minmax(0,260px)_1fr] bg-white rounded-[28px] overflow-hidden">
            <div className="relative min-h-[320px] overflow-hidden">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${PORTRAIT_GRADIENTS[active]} transition-colors duration-500`}
              />
              <div
                className="absolute inset-0 opacity-[0.14]"
                style={{
                  backgroundImage:
                    "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[92px] leading-none font-extrabold text-white/90 display-tight">
                  {person.initials}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 pt-16 bg-gradient-to-t from-slate950/85 via-slate950/45 to-transparent pointer-events-none">
                <div className="text-[16px] font-extrabold text-white">{person.name}</div>
                <div className="text-[12px] text-white/75 mt-[2px] leading-snug">{person.role}</div>
              </div>
            </div>
            <div className="bg-primary-50 p-8 flex flex-col justify-between">
              <p className="text-[19px] leading-[1.45] font-bold text-slate950 display-tight mb-10">
                “{person.quote}”
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  [person.statA, person.statALabel],
                  [person.statB, person.statBLabel],
                ].map(([value, label]) => (
                  <div key={label}>
                    <div className="text-[30px] font-extrabold display-tight tnum text-slate950 leading-none">
                      {value}
                    </div>
                    <div className="text-[12px] text-slate500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
