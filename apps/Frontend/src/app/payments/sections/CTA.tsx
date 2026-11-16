import { ArrowRight, Envelope } from "@gravity-ui/icons";
import { DEMO_EMAILS, mailtoDemo } from "../data/demo";

export default function CTA() {
  return (
    <section className="blueprint-bg relative overflow-hidden">
      <div className="max-w-[1100px] mx-auto px-6 py-20 text-center text-white relative z-10">
        <h2 className="text-[clamp(28px,4vw,44px)] leading-[1.1] font-extrabold display-tight mb-4 max-w-[760px] mx-auto">
          <span style={{ color: "#FFFFFF" }}>
            Probá BuildData en tu obra.
          </span>
          <br />
          <span className="text-accent">
            En 24 horas tu información va a estar ordenada.
          </span>
        </h2>
        <p className="text-[15px] text-white/70 max-w-[560px] mx-auto leading-relaxed mb-8">
          Sin costo durante la demo. Sin tarjeta, sin contrato y con límites de
          uso claros. Escribinos y te damos acceso.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href={mailtoDemo()}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-700 text-slate950 font-bold rounded-md px-6 py-[12px] text-[14px] transition-colors"
          >
            Pedir acceso a la demo <ArrowRight />
          </a>
          <a
            href={`mailto:${DEMO_EMAILS[0]}?subject=${encodeURIComponent("Asistencia BuildData")}`}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-md px-6 py-[12px] text-[14px] transition-colors"
          >
            <Envelope width={14} height={14} /> {DEMO_EMAILS[0]}
          </a>
        </div>
      </div>
    </section>
  );
}
