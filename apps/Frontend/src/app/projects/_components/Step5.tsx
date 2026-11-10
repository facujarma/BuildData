"use client";

import { WField } from "./WField";
import { WInput } from "./WInput";
import { WTextarea } from "./WTextarea";
import type { WizardData } from "@/types/projects";

export function Step5({ data, setData, errors = {} }: { data: WizardData; setData: (d: WizardData) => void; errors?: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Datos del cliente</div>
        <div className="grid grid-cols-2 gap-4">
          <WField label="Nombre del cliente*" hint="Persona o razón social." span={2} error={errors.clientName}>
            <WInput value={data.client.name} onChange={(e) => setData({ ...data, client: { ...data.client, name: e.target.value } })} placeholder="Ej: Inversiones Belgrano S.A." />
          </WField>
          <WField label="Persona de contacto">
            <WInput value={data.client.contact} onChange={(e) => setData({ ...data, client: { ...data.client, contact: e.target.value } })} placeholder="Ej: Marta Robles" />
          </WField>
          <WField label="CUIT / DNI">
            <WInput value={data.client.cuit} onChange={(e) => setData({ ...data, client: { ...data.client, cuit: e.target.value } })} placeholder="30-12345678-9" />
          </WField>
          <WField label="Email" error={errors.clientEmail}>
            <WInput type="email" value={data.client.email} onChange={(e) => setData({ ...data, client: { ...data.client, email: e.target.value } })} placeholder="cliente@empresa.com" />
          </WField>
          <WField label="Teléfono" error={errors.clientPhone}>
            <WInput value={data.client.phone} onChange={(e) => setData({ ...data, client: { ...data.client, phone: e.target.value } })} placeholder="+54 9 11 …" />
          </WField>
          <WField label="Notas" span={2} hint="Condiciones, observaciones del cliente, etc.">
            <WTextarea value={data.client.notes} onChange={(e) => setData({ ...data, client: { ...data.client, notes: e.target.value } })} placeholder="Opcional" />
          </WField>
        </div>
      </div>
    </div>
  );
}
