import { Envelope, Lock, Sparkles } from "@gravity-ui/icons";
import { DEMO_EMAILS, DEMO_LIMITES, mailtoDemo } from "../data/demo";

/**
 * Aviso de la demo: explica por qué no hay precios publicados, qué límites
 * tiene la prueba sin costo y a qué casillas escribir para pedir asistencia.
 */
export default function DemoAviso() {
  return (
    <section className="max-w-[1240px] mx-auto px-6 pt-8 pb-2">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary-50 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-5 md:items-start">
          <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center flex-none">
            <Lock width={19} height={19} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1 bg-white border border-primary/20 text-primary rounded-full px-3 py-[4px] text-[10px] tracking-[0.12em] uppercase font-extrabold mb-3">
              <Sparkles width={11} height={11} />
              Demo abierta
            </div>

            <h2 className="text-[22px] md:text-[26px] leading-tight font-extrabold display-tight text-slate950">
              Estamos buscando personas para probar BuildData sin costo.
            </h2>

            <p className="text-[14px] text-slate700 leading-relaxed mt-3 max-w-[720px]">
              Todavía no publicamos precios. Estamos invitando a constructoras y
              equipos de obra a usar la app antes del lanzamiento, sin costo y
              con algunos límites de uso para que la prueba sea pareja para
              todos:
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {DEMO_LIMITES.map((limite) => (
                <span
                  key={limite}
                  className="inline-flex items-center gap-1 bg-white border border-slate200 rounded-md px-2.5 py-[5px] text-[12px] font-semibold text-slate700"
                >
                  {limite}
                </span>
              ))}
            </div>

            <p className="text-[13px] text-slate700 leading-relaxed mt-4">
              Si querés asistencia para configurar tu obra —materiales, rubros,
              equipo, invitaciones— o directamente sumarte a la prueba,
              escribinos por email: te responde una persona del equipo.
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {DEMO_EMAILS.map((email, i) => (
                <a
                  key={email}
                  href={i === 0 ? mailtoDemo() : `mailto:${email}?subject=${encodeURIComponent("Asistencia BuildData")}`}
                  className={`inline-flex items-center gap-2 font-bold rounded-md px-4 py-[9px] text-[13px] transition-colors ${
                    i === 0
                      ? "bg-primary hover:bg-primary-700 text-white"
                      : "bg-white hover:bg-slate50 text-primary border border-primary/25"
                  }`}
                >
                  <Envelope width={14} height={14} />
                  {email}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
