import { Lock, Sparkles } from "@gravity-ui/icons";
import { DEMO_ACTIVO } from "../data/demo";

export default function Hero() {
  if (DEMO_ACTIVO) {
    return (
      <section className="hero-grid relative">
        <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary border border-primary/15 rounded-full px-3 py-[5px] text-[10px] tracking-[0.12em] uppercase font-bold mb-5">
            <Sparkles />
            Demo · sin costo · cupos limitados
          </div>
          <h1 className="text-[clamp(36px,5vw,56px)] leading-[1.05] font-extrabold display-tight max-w-[820px] mx-auto">
            Probalo primero.
            <br />
            <span className="text-primary">Los precios, después.</span>
          </h1>
          <p className="text-[16px] text-slate600 leading-relaxed max-w-[640px] mx-auto mt-5">
            Estamos invitando a constructoras y equipos de obra a probar
            BuildData antes del lanzamiento. Sin costo, con límites de uso
            claros y con el equipo acompañándote. Todavía no publicamos precios.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold text-slate600 bg-white border border-slate200 rounded-full px-4 py-[7px] shadow-card">
            <Lock width={12} height={12} className="text-primary" />
            Planes bloqueados · acceso por invitación
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-grid relative">
      <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary border border-primary/15 rounded-full px-3 py-[5px] text-[10px] tracking-[0.12em] uppercase font-bold mb-5">
          <Sparkles />
          Sin tarjeta · cancelás cuando quieras
        </div>
        <h1 className="text-[clamp(36px,5vw,56px)] leading-[1.05] font-extrabold display-tight max-w-[820px] mx-auto">
          Un plan para cada tipo de obra.
          <br />
          <span className="text-primary">
            Sin sorpresas, sin contratos largos.
          </span>
        </h1>
        <p className="text-[16px] text-slate600 leading-relaxed max-w-[640px] mx-auto mt-5">
          Probá gratis durante 14 días. Cuando estés convencido elegís el plan
          que más se ajuste a tu volumen de obra — y lo cambiás cuando
          crezcas.
        </p>
      </div>
    </section>
  );
}
