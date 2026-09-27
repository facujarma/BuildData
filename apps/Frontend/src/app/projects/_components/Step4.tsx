"use client";

import { WField } from "./WField";
import { WDateInput } from "./WDateInput";

export function Step4({ data, setData, errors = {} }: { data: any; setData: (d: any) => void; errors?: Record<string, string> }) {
  return (
    <div className="space-y-5">

      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Fechas estimadas</div>
        <div className="grid grid-cols-2 gap-4">
          <WField label="Inicio de obra" hint="Formato dd/mm/aaaa.">
            <WDateInput value={data.startDate} onChange={(iso) => setData({ ...data, startDate: iso })} />
          </WField>
          <WField label="Fin estimado" hint="Opcional · podés definirlo después." error={errors.endDate}>
            <WDateInput value={data.endDate} onChange={(iso) => setData({ ...data, endDate: iso })} />
          </WField>
        </div>
      </div>
    </div>
  );
}
