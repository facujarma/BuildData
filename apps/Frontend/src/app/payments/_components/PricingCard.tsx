"use client";

import { Check, Xmark, ArrowRight, Lock } from "@gravity-ui/icons";
import Button from "@/components/ui/Button";
import { DEMO_ACTIVO, mailtoDemo } from "../data/demo";

interface Feature {
  text: string;
  included: boolean;
  bold?: boolean;
}

interface PricingCardProps {
  planLabel: string;
  labelColor: string;
  title: string;
  price: string;
  priceSub: string;
  idealFor: string;
  features: Feature[];
  isFeatured?: boolean;
  ctaText: string;
  ctaHref: string;
  badge?: string;
  facturation?: "mensual" | "anual";
}

export default function PricingCard({
  planLabel,
  labelColor,
  title,
  price,
  priceSub,
  idealFor,
  features,
  isFeatured = false,
  ctaText,
  ctaHref,
  badge,
}: PricingCardProps) {
  // En modo demo no se publican precios: la tarjeta va bloqueada y el precio se
  // reemplaza por "Demo". Con `DEMO_ACTIVO = false` vuelve el diseño pago.
  const demo = DEMO_ACTIVO;
  const featured = isFeatured && !demo;

  return (
    <div
      className={`relative rounded-2xl p-7 flex flex-col ${
        featured
          ? "border border-transparent blueprint-bg text-white ring-2 ring-accent shadow-pop scale-[1.02]"
          : demo
            ? "bg-white text-slate950 border border-dashed border-slate300 shadow-card"
            : "bg-white text-slate950 border border-slate200 shadow-card"
      }`}
    >
      {badge && !demo && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-accent text-slate950 text-[10px] tracking-[0.12em] uppercase font-extrabold px-3 py-[5px] rounded-full shadow-card whitespace-nowrap">
          {badge}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-1">
        <div
          className="text-[12px] font-bold tracking-[0.06em] uppercase"
          style={{ color: labelColor }}
        >
          {planLabel}
        </div>
        {demo && (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold tracking-[0.1em] uppercase bg-slate950 text-white px-2 py-[3px] rounded-full flex-none">
            <Lock width={9} height={9} /> Bloqueado
          </span>
        )}
      </div>

      <h3 className="text-[20px] font-extrabold display-tight leading-tight min-h-[75px]">
        {title}
      </h3>

      <div className="mt-6 mb-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`text-[44px] font-extrabold display-tight tnum ${featured ? "text-white" : "text-slate950"}`}
          >
            {demo ? "Demo" : price}
          </span>
          {demo && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate600 bg-slate100 rounded-full px-2 py-[3px]">
              <Lock width={9} height={9} /> Precio bloqueado
            </span>
          )}
        </div>
        <div className={`text-[12px] ${featured ? "text-white/65" : "text-slate500"}`}>
          {demo ? "Sin costo durante la prueba · acceso por invitación" : priceSub}
        </div>
      </div>

      <div
        className={`text-[12px] mt-2 leading-snug min-h-[36px] ${featured ? "text-white/65" : "text-slate500"}`}
      >
        <b className={featured ? "text-white" : "text-slate700"}>
          Ideal para:
        </b>{" "}
        {idealFor}
      </div>

      <Button
        variant={featured ? "primary" : "outline"}
        href={demo ? mailtoDemo(`Quiero probar BuildData — plan ${planLabel}`) : ctaHref}
        className={`mt-5 inline-flex items-center justify-center gap-2 font-bold rounded-md px-4 py-[11px] text-[13px] w-full ${
          featured
            ? "!bg-accent hover:!bg-accent-700 !text-slate950 !border-accent"
            : "!bg-white hover:!bg-slate50 !text-slate700 !border-slate300"
        }`}
      >
        {demo ? "Pedir demo" : ctaText} <ArrowRight width={14} height={14} />
      </Button>

      <div
        className={`text-[10px] tracking-[0.06em] uppercase font-bold mt-7 mb-3 ${featured ? "text-white/65" : "text-slate500"}`}
      >
        Incluye
      </div>

      <ul className="flex flex-col gap-2 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            {feature.included ? (
              <span
                className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-none mt-[1px] ${
                  featured
                    ? "bg-accent text-slate950"
                    : "bg-success-50 text-[#15803D]"
                }`}
              >
                <Check width={11} height={11} />
              </span>
            ) : (
              <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-none mt-[1px] bg-slate100 text-slate400">
                <Xmark width={11} height={11} />
              </span>
            )}
            <span
              className={`text-[12.5px] leading-snug ${
                featured
                  ? feature.bold
                    ? "text-white font-bold"
                    : "text-white/85"
                  : feature.included
                    ? feature.bold
                      ? "text-slate950 font-bold"
                      : "text-slate700"
                    : "text-slate400 line-through"
              }`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
