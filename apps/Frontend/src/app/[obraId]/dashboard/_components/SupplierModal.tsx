"use client";

import { useState, useEffect } from "react";
import { Car, Box, Database, Check, Xmark } from "@gravity-ui/icons";
import { PhoneInput } from "@/components/ui/PhoneInput";

const SUP_INP = "bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none";

function SupField({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <label className={"flex flex-col gap-[6px] " + (span ? "col-span-2" : "")}>
      <span className="text-[11px] font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export interface SupplierData {
  id?: string;
  name: string;
  rubro: string;
  cuit: string;
  contact: string;
  role: string;
  phone: string;
  wa: string;
  email: string;
  web: string;
  address: string;
  pay: string;
  lead: string;
  desc: string;
  scope?: "global" | "obra";
}

interface Props {
  initial: SupplierData | null;
  scope: "global" | "obra";
  rubros: string[];
  onClose: () => void;
  onSave: (data: SupplierData) => void;
}

export function SupplierModal({ initial, scope, rubros, onClose, onSave }: Props) {
  const [d, setD] = useState<SupplierData>(initial || {
    name: "", rubro: rubros[0] || "", cuit: "", contact: "", role: "",
    phone: "", wa: "", email: "", web: "", address: "", pay: "30 días", lead: "", desc: "",
  });

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const set = (patch: Partial<SupplierData>) => setD((p) => ({ ...p, ...patch }));
  const canSave = (d.name || "").trim().length >= 2;
  const isPrivate = (initial ? initial.scope : scope) === "obra";

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[620px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center"><Car width={16} height={16} /></div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">{initial ? "Editar proveedor" : "Nuevo proveedor"}</div>
              <div className="text-[11px] text-slate-500">{isPrivate ? "Queda solo en esta obra" : "Queda en el catálogo de la empresa"}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center"><Xmark width={16} height={16} /></button>
        </div>

        {!initial && (
          <div className={"px-6 py-3 flex items-start gap-2 border-b " + (isPrivate ? "bg-attention-50 border-[#FDE68A]" : "bg-primary-50 border-primary/15")}>
            {isPrivate
              ? <Box width={13} height={13} className="text-[#A16207] mt-[2px] flex-none" />
              : <Database width={13} height={13} className="text-primary mt-[2px] flex-none" />}
            <span className="text-[11px] text-slate-700 leading-snug">
              {isPrivate
                ? "Va a estar disponible solo en esta obra. Podés sumarlo al catálogo de la empresa más adelante desde su ficha."
                : "Va a quedar disponible en todas las obras de la empresa, para cualquier equipo."}
            </span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Identificación</div>
            <div className="grid grid-cols-2 gap-3">
              <SupField label="Razón social*">
                <input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej: Cementos del Plata" className={SUP_INP} />
              </SupField>
              <SupField label="CUIT">
                <input value={d.cuit} onChange={(e) => set({ cuit: e.target.value })} placeholder="30-71234567-4" className={SUP_INP + " tnum"} />
              </SupField>
              <SupField label="Rubro que provee">
                <select value={d.rubro} onChange={(e) => set({ rubro: e.target.value })} className={SUP_INP}>
                  {rubros.map((r) => <option key={r}>{r}</option>)}
                </select>
              </SupField>
              <SupField label="Dirección">
                <input value={d.address} onChange={(e) => set({ address: e.target.value })} placeholder="Calle, localidad" className={SUP_INP} />
              </SupField>
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Contacto</div>
            <div className="grid grid-cols-2 gap-3">
              <SupField label="Persona de contacto">
                <input value={d.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="Ej: Marta Ruiz" className={SUP_INP} />
              </SupField>
              <SupField label="Puesto">
                <input value={d.role} onChange={(e) => set({ role: e.target.value })} placeholder="Ej: Ventas" className={SUP_INP} />
              </SupField>
              <SupField label="WhatsApp" span>
                <PhoneInput value={d.wa} onChange={(full) => set({ wa: full })} />
              </SupField>
              <SupField label="Teléfono fijo" span>
                <PhoneInput value={d.phone} onChange={(full) => set({ phone: full })} />
              </SupField>
              <SupField label="Email">
                <input value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="ventas@proveedor.com" className={SUP_INP} />
              </SupField>
              <SupField label="Sitio web">
                <input value={d.web} onChange={(e) => set({ web: e.target.value })} placeholder="proveedor.com.ar" className={SUP_INP} />
              </SupField>
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Condiciones comerciales</div>
            <div className="grid grid-cols-2 gap-3">
              <SupField label="Condición de pago">
                <select value={d.pay} onChange={(e) => set({ pay: e.target.value })} className={SUP_INP}>
                  {["Contado", "50% anticipo", "15 días", "30 días", "60 días", "90 días"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </SupField>
              <SupField label="Plazo de entrega habitual">
                <input value={d.lead} onChange={(e) => set({ lead: e.target.value })} placeholder="Ej: 5 días" className={SUP_INP} />
              </SupField>
              <SupField label="Qué provee / observaciones" span>
                <textarea value={d.desc} onChange={(e) => set({ desc: e.target.value })} rows={3}
                  placeholder="Materiales que vende, mínimos de compra, si incluye flete o descarga…"
                  className={SUP_INP + " resize-y min-h-[70px]"} />
              </SupField>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
          <button onClick={() => canSave && onSave(d)} disabled={!canSave}
            className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (canSave ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed")}>
            Guardar <Check width={14} height={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
