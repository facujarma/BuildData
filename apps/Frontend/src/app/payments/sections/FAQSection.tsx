import FAQ from "../../landing/_components/FAQ";
import { faqItems } from "../data/plans";
import { DEMO_EMAILS } from "../data/demo";

export default function FAQSection() {
  const email = DEMO_EMAILS[0];
  return (
    <section className="max-w-[860px] mx-auto px-6 py-20">
      <div className="text-center mb-10">
        <div className="text-[10px] tracking-[0.18em] uppercase font-bold text-primary mb-2">
          Preguntas frecuentes
        </div>
        <h2 className="text-[28px] font-extrabold display-tight">
          Lo que más nos preguntan
        </h2>
      </div>
      <FAQ items={faqItems} />
      <div className="text-center mt-6 text-[13px] text-slate500">
        ¿Otra duda? Escribinos a{" "}
        <a
          href={`mailto:${email}`}
          className="text-primary font-bold hover:underline"
        >
          {email}
        </a>{" "}
        o a{" "}
        <a
          href={`mailto:${DEMO_EMAILS[1]}`}
          className="text-primary font-bold hover:underline"
        >
          {DEMO_EMAILS[1]}
        </a>
        .
      </div>
    </section>
  );
}
