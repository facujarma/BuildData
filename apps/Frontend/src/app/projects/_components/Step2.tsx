"use client";

import { CircleExclamation } from "@gravity-ui/icons";
import type { WizardData } from "@/types/projects";
import { WField } from "./WField";
import { WInput } from "./WInput";
import { WSelect } from "./WSelect";

export function Step2({ data, setData, errors = {} }: { data: WizardData; setData: (d: WizardData) => void; errors?: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Dirección de obra</div>
        <div className="grid grid-cols-3 gap-4">
          <WField label="Dirección*" span={2} error={errors.address}>
            <WInput value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} placeholder="Av. Belgrano 1842" />
          </WField>
          <WField label="Localidad">
            <WInput value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} placeholder="CABA" />
          </WField>
          <WField label="Provincia">
            <WInput value={data.province} onChange={(e) => setData({ ...data, province: e.target.value })} placeholder="Buenos Aires" />
          </WField>
          <WField label="Código postal">
            <WInput value={data.zip} onChange={(e) => setData({ ...data, zip: e.target.value })} placeholder="C1093" />
          </WField>
          <WField label="País">
            <WSelect value={data.country} onChange={(e) => setData({ ...data, country: e.target.value })}>
              <option value="ar">Argentina</option>
            </WSelect>
          </WField>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden h-[160px] relative bg-slate-100">
        <svg viewBox="0 0 600 160" className="w-full h-full">
          <rect width="600" height="160" fill="#EFF4FC" />
          {[...Array(7)].map((_, i) => (
            <line key={"h" + i} x1="0" x2="600" y1={20 + i * 22} y2={20 + i * 22} stroke="#CBD5E1" strokeWidth="0.5" />
          ))}
          {[...Array(14)].map((_, i) => (
            <line key={"v" + i} x1={i * 44} x2={i * 44} y1="0" y2="160" stroke="#CBD5E1" strokeWidth="0.5" />
          ))}
          <path d="M0 90 L240 90 L240 50 L420 50 L420 120 L600 120" stroke="#94A3B8" strokeWidth="3" fill="none" />
          <circle cx="300" cy="80" r="14" fill="#F59E0B" />
          <circle cx="300" cy="80" r="6" fill="#fff" />
        </svg>
        <div className="absolute bottom-3 left-3 bg-white rounded-md px-3 py-2 shadow-card text-[12px] font-bold text-slate-950 flex items-center gap-2">
          <CircleExclamation width={12} height={12} className="text-accent" />
          {data.address || "Dirección de obra"}{data.city ? `, ${data.city}` : ""}
        </div>
      </div>

      {/*
      <div className="bg-info-50 border border-[#BFDBFE] rounded-lg p-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-info text-white flex items-center justify-center flex-none">
          <CircleInfo width={13} height={13} />
        </div>
        <div className="text-[12px] text-slate-700 leading-snug">
          Usamos la dirección para <b>georreferenciar fotos y reportes</b> que tu equipo manda por WhatsApp. Nunca compartimos esto con nadie.
        </div>
        
      </div>
      */}
    </div>
  );
}
