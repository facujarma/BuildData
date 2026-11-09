import Icon from "../_components/Icon";

export default function CTA() {
  return (
    <section id="cta" className="blueprint-bg relative overflow-hidden">
      <div className="max-w-[1100px] mx-auto px-6 py-24 text-center text-white relative z-10">
        <h2 className="text-[clamp(30px,4.4vw,52px)] leading-[1.08] font-extrabold display-tight mb-5 max-w-[860px] mx-auto">
          <span className="text-white">Probá BuildData en tu obra.</span>
          <br />
          <span className="text-accent">En 24 horas tu información va a estar ordenada.</span>
        </h2>
        <p className="text-[16px] text-white/75 max-w-[560px] mx-auto leading-relaxed mb-9">
          Sin tarjeta de crédito. Sin contratos largos. Sin instalaciones complicadas.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="/payments"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-700 text-slate950 font-bold rounded-md px-6 py-[13px] text-[15px] transition-colors"
          >
            Empezar 14 días gratis <Icon name="arrow-right" size={15} />
          </a>
          <a
            href="mailto:hola@buildata.app"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-md px-6 py-[13px] text-[15px] transition-colors"
          >
            Agendar una demo
          </a>
        </div>
      </div>
    </section>
  );
}
