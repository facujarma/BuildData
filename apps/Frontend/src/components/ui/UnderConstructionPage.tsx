"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "./BrandLogo";
import ConstructionIllustration from "./ConstructionIllustration";
import NotifyForm from "./NotifyForm";

interface UnderConstructionPageProps {
  section?: string;
  desc?: string;
}

export default function UnderConstructionPage({ section, desc }: UnderConstructionPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-paper hero-grid">
      <style>{`
        @keyframes constructionPulse {
          0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.6); }
          70%  { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        .construction-dot {
          box-shadow: 0 0 0 0 rgba(245,158,11,0.6);
          animation: constructionPulse 1.8s infinite ease-out;
        }
      `}</style>

      <header className="px-8 py-6 flex items-center justify-between">
        <BrandLogo />
        <button
          onClick={() => router.back()}
          className="text-slate-600 font-bold text-[12px] px-[14px] py-2 rounded-lg hover:bg-slate-950/[0.05] hover:text-slate-950 transition-colors inline-flex items-center gap-[6px]"
        >
          <span className="text-[13px] leading-none">&#8592;</span> Volver
        </button>
      </header>

      <main className="grid place-items-center px-8 py-8">
        <div className="max-w-[640px] w-full text-center">
          <div className="inline-flex items-center gap-2 bg-accent-50 border border-accent/25 text-accent-700 text-[10px] font-extrabold tracking-[0.18em] uppercase px-3 py-[6px] rounded-full mb-5">
            <span className="w-[7px] h-[7px] rounded-full bg-accent construction-dot" />
            En desarrollo · <span>{section ?? "Próximamente"}</span>
          </div>

          <div className="mx-auto mb-7 max-w-[380px]">
            <ConstructionIllustration />
          </div>

          <h1 className="text-[clamp(32px,5vw,52px)] font-extrabold tracking-[-0.03em] leading-[1.05] mb-4 text-slate-950">
            Estamos <span className="text-primary">construyendo</span><br />
            algo nuevo acá.
          </h1>

          <p className="text-[16px] text-slate-600 leading-[1.55] mx-auto mb-8 max-w-[520px]">
            {desc ?? "Esta sección está en desarrollo. Volvé pronto — falta poco para que esté lista."}
          </p>

          <div className="flex gap-[10px] justify-center flex-wrap mb-7">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-[6px] bg-primary text-white font-bold text-[13px] px-[18px] py-[11px] rounded-lg border border-primary hover:bg-primary-700 transition-colors"
            >
              Volver al dashboard <span className="text-[13px]">&#8594;</span>
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-[6px] bg-white text-slate-600 font-bold text-[13px] px-[18px] py-[11px] rounded-lg border border-slate-200 hover:border-slate-300 hover:text-slate-950 transition-colors"
            >
              Ir al sitio
            </Link>
          </div>

          <NotifyForm />
        </div>
      </main>

      <footer className="px-8 py-6 text-center text-slate-500 text-[11px]">
        &copy; 2026 BuildData &middot; La informaci&oacute;n de tu obra, ordenada en un solo lugar.
      </footer>
    </div>
  );
}
