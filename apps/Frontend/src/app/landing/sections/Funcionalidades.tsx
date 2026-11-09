"use client";

import { motion as m } from "framer-motion";
import Icon from "../_components/Icon";

const FEATURES = [
  { icon: "mic", title: "Audios → datos", body: "Transcribe y clasifica notas de voz en pedidos, avances, alertas o faltantes.", tone: "primary" },
  { icon: "photo", title: "Fotos georeferenciadas", body: "Cada imagen queda asociada al rubro y la fecha. Buscable por palabra clave.", tone: "accent" },
  { icon: "alert", title: "Alertas inteligentes", body: "El bot detecta urgencia y avisa al director sin esperar al parte diario.", tone: "critical" },
  { icon: "package", title: "Pedidos automáticos", body: "Identifica materiales y cantidades. Arma el pedido, lo manda a aprobación.", tone: "success" },
  { icon: "chart", title: "KPIs por rubro", body: "Avance, costos y desvíos por rubro. Comparados contra el plan.", tone: "info" },
  { icon: "calendar", title: "Cronograma vivo", body: "El Gantt se actualiza solo con los avances que reportan en obra.", tone: "primary" },
  { icon: "users", title: "Roles y permisos", body: "Capataces, directores, proveedores. Cada uno ve lo que le toca.", tone: "accent" },
  { icon: "download", title: "Reportes a un clic", body: "Informe semanal para el cliente o el inversor, generado solo.", tone: "success" },
] as const;

const TONES = {
  primary: { tint: "bg-primary-50", fg: "text-primary" },
  accent: { tint: "bg-accent-50", fg: "text-accent-700" },
  critical: { tint: "bg-critical50", fg: "text-critical" },
  success: { tint: "bg-success50", fg: "text-[#15803D]" },
  info: { tint: "bg-info50", fg: "text-info" },
};

export default function Funcionalidades() {
  return (
    <section id="funcionalidades" className="py-[120px] bg-paper">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="max-w-[720px] mb-14">
          <div className="eyebrow text-primary mb-3">Funcionalidades</div>
          <h2 className="text-[clamp(32px,4vw,48px)] leading-[1.08] font-extrabold display-tight mb-4 text-slate950">
            Todo lo que pasa en la obra, <span className="text-primary">organizado solo.</span>
          </h2>
          <p className="text-[17px] leading-[26px] text-slate600 max-w-[600px]">
            Ocho módulos hechos para constructoras: del audio del capataz al reporte para el
            cliente, sin que nadie copie y pegue.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => {
            const tone = TONES[feature.tone];
            return (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4 }}
                className="bg-white border border-slate200 rounded-xl p-5 hover:shadow-pop hover:border-slate300 transition-all group"
              >
                <div
                  className={`w-11 h-11 rounded-lg ${tone.tint} ${tone.fg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon name={feature.icon} size={20} />
                </div>
                <div className="text-[16px] font-bold mb-1 text-slate950">{feature.title}</div>
                <div className="text-[13px] leading-[19px] text-slate600">{feature.body}</div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
