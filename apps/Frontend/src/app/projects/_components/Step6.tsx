"use client";

import { Plus, Xmark } from "@gravity-ui/icons";
import { WField } from "./WField";
import { WInput } from "./WInput";
import { formatNumber } from "@/lib/format";

export function Step6({ data, setData, errors = {} }: { data: any; setData: (d: any) => void; errors?: Record<string, string> }) {
  const total = Number(data.budgetTotal) || 0;
  const subtotal = (data.rubros || []).reduce((a: number, r: any) => a + (Number(r.amount) || 0), 0);
  const over = total > 0 && subtotal > total;
  const remaining = total - subtotal;

  const setRubro = (id: string, patch: any) =>
    setData({ ...data, rubros: data.rubros.map((r: any) => r.id === id ? { ...r, ...patch } : r) });

  const addRubro = () =>
    setData({ ...data, rubros: [...data.rubros, { id: "r-" + Date.now(), name: "", amount: "" }] });

  const delRubro = (id: string) =>
    setData({ ...data, rubros: data.rubros.filter((r: any) => r.id !== id) });

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Presupuesto total de la obra</div>
        <WField label="Monto total*" hint="En pesos. Es la referencia para controlar gastos por rubro." error={errors.budgetTotal}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-500">AR$</span>
            <WInput type="number" min="0" value={data.budgetTotal}
              onChange={(e: any) => setData({ ...data, budgetTotal: e.target.value })}
              placeholder="0" className="pl-12 tnum" />
          </div>
        </WField>
      </div>

      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500">Presupuesto por rubro</div>
            <div className="text-[11px] text-slate-500 mt-[1px]">Repartí el total entre los rubros de la obra.</div>
          </div>
          <button type="button" onClick={addRubro}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline">
            <Plus width={13} height={13} /> Agregar rubro
          </button>
        </div>

        <div className="space-y-2">
          {(data.rubros || []).map((r: any) => (
            <div key={r.id} className="grid grid-cols-[1fr_180px_32px] gap-2 items-center">
              <WInput value={r.name} onChange={(e: any) => setRubro(r.id, { name: e.target.value })} placeholder="Nombre del rubro" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-500">AR$</span>
                <WInput type="number" min="0" value={r.amount} onChange={(e: any) => setRubro(r.id, { amount: e.target.value })} placeholder="0" className="pl-11 tnum" />
              </div>
              <button type="button" onClick={() => delRubro(r.id)}
                className="w-8 h-8 rounded-md hover:bg-critical-50 text-slate-400 hover:text-[#B91C1C] flex items-center justify-center">
                <Xmark width={14} height={14} />
              </button>
            </div>
          ))}
          {(!data.rubros || data.rubros.length === 0) && (
            <div className="text-center text-slate-400 text-[12px] py-6 border border-dashed border-slate-200 rounded-lg">
              Sin rubros. Agregá al menos uno.
            </div>
          )}
          {errors.rubros && (
            <span className="text-[11px] font-semibold text-[#B91C1C] flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.rubros}
            </span>
          )}
        </div>

        <div className={`mt-4 rounded-lg border p-4 ${over ? "bg-critical-50 border-[#FECACA]" : "bg-paper border-slate-200"}`}>
          <div className="flex items-center justify-between text-[12px] mb-2">
            <span className="text-slate-600">Suma de rubros</span>
            <span className={`font-extrabold tnum ${over ? "text-[#B91C1C]" : "text-slate-950"}`}>AR$ {formatNumber(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-[12px] mb-2">
            <span className="text-slate-600">Presupuesto total</span>
            <span className="font-bold tnum text-slate-950">AR$ {formatNumber(total)}</span>
          </div>
          <div className="h-px bg-slate-200 my-2" />
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-slate-600">{remaining >= 0 ? "Sin asignar" : "Excedente"}</span>
            <span className={`font-extrabold tnum ${over ? "text-[#B91C1C]" : remaining === 0 ? "text-[#15803D]" : "text-slate-950"}`}>
              AR$ {formatNumber(Math.abs(remaining))}
            </span>
          </div>

          {total > 0 && (
            <div className="mt-3 h-[8px] bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${over ? "bg-critical" : "bg-primary"}`}
                style={{ width: Math.min(100, (subtotal / total) * 100) + "%" }} />
            </div>
          )}

          {over && (
            <div className="mt-3 flex items-start gap-2 text-[12px] text-[#B91C1C] font-semibold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[1px] flex-none">
                <path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.535a1.876 1.876 0 0 0 1.626 2.874h16.234a1.876 1.876 0 0 0 1.626-2.874L13.637 3.59a1.876 1.876 0 0 0-3.274 0z" />
                <path d="M12 17h.01" />
              </svg>
              La suma de rubros supera el presupuesto total por AR$ {formatNumber(subtotal - total)}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
