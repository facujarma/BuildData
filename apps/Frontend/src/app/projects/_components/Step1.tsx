"use client";

import { ChartBar, LayoutHeaderCellsLarge, Box } from "@gravity-ui/icons";
import { TYPES } from "@/app/projects/data/wizard";
import type { WizardData } from "@/types/projects";
import { WField } from "./WField";
import { WInput } from "./WInput";
import { WSelect } from "./WSelect";
import { PickCard } from "./PickCard";

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  chart: <ChartBar width={16} height={16} />,
  grid: <LayoutHeaderCellsLarge width={16} height={16} />,
  package: <Box width={16} height={16} />,
  truck: <TruckIcon />,
};

export function Step1({ data, setData, errors = {} }: { data: WizardData; setData: (d: WizardData) => void; errors?: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Información básica</div>
        <div className="grid grid-cols-2 gap-4">
          <WField label="Nombre de la obra*" hint="Ej: Edificio Belgrano, Casa Villa Urquiza…" span={2} error={errors.name}>
            <WInput value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Nombre que ve todo el equipo" />
          </WField>
          <WField label="Código interno" hint="Opcional · para referencias con proveedores.">
            <WInput value={data.code} onChange={(e) => setData({ ...data, code: e.target.value })} placeholder="OBR-2026-001" />
          </WField>
          <WField label="Estado inicial">
            <WSelect value={data.status} onChange={(e) => setData({ ...data, status: e.target.value })}>
              <option value="planificacion">En planificación</option>
              <option value="en-curso">En curso</option>
            </WSelect>
          </WField>
        </div>
      </div>

      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Tipo de obra*</div>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => (
            <PickCard key={t.id} on={data.type === t.id} onClick={() => setData({ ...data, type: t.id })}
              icon={TYPE_ICONS[t.icon]} name={t.name} sub={t.sub} />
          ))}
        </div>
        {errors.type && (
          <span className="text-[11px] font-semibold text-[#B91C1C] flex items-center gap-1 mt-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errors.type}
          </span>
        )}
      </div>
    </div>
  );
}
