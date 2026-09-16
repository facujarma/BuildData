"use client";

import { useMemo, useState } from "react";
import { Check, Plus, TriangleExclamation, Xmark } from "@gravity-ui/icons";
import { UNITS } from "../data";
import type { NewPedidoPayload } from "@/services/pedidosService";
import type { ObreroLite } from "@/services/pedidosService";

interface Props {
  onClose: () => void;
  onSubmit: (payload: NewPedidoPayload) => Promise<void>;
  members: ObreroLite[];
  rubros: string[];
}

export function NewOrderModal({ onClose, onSubmit, members, rubros }: Props) {
  const [customCats, setCustomCats] = useState<string[]>([]);
  const [units, setUnits] = useState([...UNITS]);
  const [mat, setMat] = useState("");
  const [prov, setProv] = useState("");
  const [cat, setCat] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [unit, setUnit] = useState(units[0]);
  const [total, setTotal] = useState<number>(0);
  const [date, setDate] = useState("");
  const [who, setWho] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [note, setNote] = useState("");

  const [newCat, setNewCat] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [showNewUnit, setShowNewUnit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cats = useMemo(() => Array.from(new Set([...rubros, ...customCats])), [rubros, customCats]);
  const currentCat = cat || cats[0] || "";

  const canSave = mat.trim() && prov.trim();

  const addCategory = () => {
    const val = newCat.trim();
    if (val && !cats.includes(val)) {
      setCustomCats((prev) => [...prev, val]);
      setCat(val);
    }
    setNewCat("");
    setShowNewCat(false);
  };

  const addUnit = () => {
    const val = newUnit.trim();
    if (val && !units.includes(val)) {
      setUnits([...units, val]);
      setUnit(val);
    }
    setNewUnit("");
    setShowNewUnit(false);
  };

  const submit = async () => {
    if (!canSave || saving) return;
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        proveedor_nombre: prov.trim(),
        items: [
          {
            material_nombre: mat.trim(),
            unidad: unit,
            cantidad: qty,
            precio_unitario: total / (qty || 1),
          },
        ],
        categoria: currentCat,
        urgente: urgent,
        nota: note.trim(),
        fecha_llegada_estimada: date || null,
        solicitado_por: who || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el pedido");
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[560px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center">
              <Plus width={16} height={16} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">Nuevo pedido</div>
              <div className="text-[11px] text-slate-500">Completá los datos del material a pedir</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center">
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Material*</span>
            <input value={mat} onChange={(e) => setMat(e.target.value)} placeholder="Ej: Cemento Portland · 50 kg"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Proveedor*</span>
              <input value={prov} onChange={(e) => setProv(e.target.value)} placeholder="Ej: Cementos del Plata"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>

            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Rubro</span>
                <button type="button" onClick={() => setShowNewCat(true)}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]">
                  <Plus width={10} height={10} /> Nuevo rubro
                </button>
              </div>
              {showNewCat ? (
                <div className="flex gap-1">
                  <input autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCategory(); else if (e.key === "Escape") setShowNewCat(false); }}
                    placeholder="Nuevo rubro"
                    className="flex-1 min-w-0 bg-white border border-primary rounded-md px-3 py-[9px] text-[13px] focus:outline-none" />
                  <button type="button" onClick={addCategory} className="px-3 rounded-md bg-primary text-white flex items-center justify-center">
                    <Check width={14} height={14} />
                  </button>
                  <button type="button" onClick={() => setShowNewCat(false)} className="px-2 rounded-md border border-slate-200 text-slate-500 flex items-center justify-center">
                    <Xmark width={14} height={14} />
                  </button>
                </div>
              ) : (
                <select value={currentCat} onChange={(e) => setCat(e.target.value)}
                  className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                  {cats.length === 0 && <option value="">Sin rubros</option>}
                  {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Cantidad</span>
                {!showNewUnit && (
                  <button type="button" onClick={() => { setShowNewUnit(true); setNewUnit(""); }}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]">
                    <Plus width={10} height={10} /> Unidad
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input type="number" min={0} value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="0"
                  className="w-[90px] bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
                {showNewUnit ? (
                  <div className="flex gap-1 flex-1 min-w-0">
                    <input autoFocus value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addUnit(); else if (e.key === "Escape") setShowNewUnit(false); }}
                      placeholder="Nueva unidad"
                      className="flex-1 min-w-0 bg-white border border-primary rounded-md px-2 py-[9px] text-[13px] focus:outline-none" />
                    <button type="button" onClick={addUnit} className="px-2 rounded-md bg-primary text-white flex items-center justify-center">
                      <Check width={14} height={14} />
                    </button>
                    <button type="button" onClick={() => setShowNewUnit(false)} className="px-2 rounded-md border border-slate-200 text-slate-500 flex items-center justify-center">
                      <Xmark width={14} height={14} />
                    </button>
                  </div>
                ) : (
                  <select value={unit} onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 min-w-0 bg-white border border-slate-200 rounded-md px-2 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                    {units.map((u) => <option key={u}>{u}</option>)}
                  </select>
                )}
              </div>
            </div>

            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Total (AR$)*</span>
              <input type="number" min={0} value={total} onChange={(e) => setTotal(Number(e.target.value))} placeholder="0"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
            </label>

            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Llegada estimada</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>

            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Solicitó</span>
              <select value={who} onChange={(e) => setWho(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                <option value="">—</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Nota</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Observaciones adicionales…"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[60px]" />
          </label>

          <button type="button" onClick={() => setUrgent(!urgent)}
            className={`w-full flex items-center gap-3 rounded-lg border px-3 py-[10px] transition-colors text-left ${
              urgent ? "bg-critical-50 border-[#FECACA]" : "bg-white border-slate-200 hover:border-slate-300"
            }`}>
            <span className={`w-9 h-[22px] rounded-full p-[2px] flex-none transition-colors ${urgent ? "bg-critical" : "bg-slate-300"}`}>
              <span className={`block w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${urgent ? "translate-x-[16px]" : "translate-x-0"}`} />
            </span>
            <span className="flex-1 min-w-0">
              <span className={`block text-[13px] font-bold ${urgent ? "text-[#B91C1C]" : "text-slate-950"}`}>Pedido urgente</span>
              <span className="block text-[11px] text-slate-500">Se prioriza y notifica al director de obra.</span>
            </span>
            {urgent && <TriangleExclamation width={16} height={16} className="text-[#B91C1C]" />}
          </button>

          {error && <div className="text-[12px] font-semibold text-critical">{error}</div>}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave || saving}
            className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${
              canSave && !saving ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}>
            {saving ? "Creando…" : "Crear pedido"} {!saving && <Check width={14} height={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
