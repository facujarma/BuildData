"use client";

import { useMemo, useState } from "react";
import { Xmark, Plus } from "@gravity-ui/icons";
import DButton from "@/components/ui/Button";
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

  const cats = useMemo(
    () => Array.from(new Set([...rubros, ...customCats])),
    [rubros, customCats]
  );
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
            categoria: currentCat,
            unidad: unit,
            cantidad: qty,
            precio_unitario: total / (qty || 1),
          },
        ],
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
            <input value={mat} onChange={(e) => setMat(e.target.value)} placeholder="Ej: Cemento Portland 50 kg"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Proveedor*</span>
            <input value={prov} onChange={(e) => setProv(e.target.value)} placeholder="Nombre del proveedor"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>

          <div>
            <div className="flex items-center justify-between mb-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Categoría</span>
              <button type="button" onClick={() => setShowNewCat(!showNewCat)}
                className="text-[11px] font-bold text-primary hover:text-primary-700 flex items-center gap-1">
                <Plus width={12} height={12} /> Nuevo
              </button>
            </div>
            {showNewCat ? (
              <div className="flex gap-2">
                <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nueva categoría"
                  className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
                <DButton size="sm" onClick={addCategory} disabled={!newCat.trim()}>Agregar</DButton>
              </div>
            ) : (
              <select value={currentCat} onChange={(e) => setCat(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Cantidad</span>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
            <div>
              <div className="flex items-center justify-between mb-[6px]">
                <span className="text-[11px] font-bold text-slate-700">Unidad</span>
                <button type="button" onClick={() => setShowNewUnit(!showNewUnit)}
                  className="text-[11px] font-bold text-primary hover:text-primary-700 flex items-center gap-1">
                  <Plus width={12} height={12} /> Nuevo
                </button>
              </div>
              {showNewUnit ? (
                <div className="flex gap-2">
                  <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="Nueva unidad"
                    className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
                  <DButton size="sm" onClick={addUnit} disabled={!newUnit.trim()}>Agregar</DButton>
                </div>
              ) : (
                <select value={unit} onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              )}
            </div>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Total AR$</span>
            <input type="number" min={0} value={total} onChange={(e) => setTotal(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Llegada estimada</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>

          <div className="flex items-center gap-3">
            <label className="flex flex-col gap-[6px] flex-1">
              <span className="text-[11px] font-bold text-slate-700">Solicitó</span>
              <select value={who} onChange={(e) => setWho(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                {members.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 pt-5">
              <span className="text-[11px] font-bold text-slate-700">Urgente</span>
              <button type="button" onClick={() => setUrgent(!urgent)}
                className={"w-10 h-[22px] rounded-full transition-colors relative " + (urgent ? "bg-critical" : "bg-slate-300")}>
                <span className={"absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all " + (urgent ? "right-[2px]" : "left-[2px]")} />
              </button>
            </label>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Nota</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Observaciones adicionales…"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-none" />
          </label>

          {error && <div className="text-[12px] font-semibold text-critical">⚠️ {error}</div>}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-none">
          <DButton variant="ghost" onClick={onClose} disabled={saving}>Cancelar</DButton>
          <DButton onClick={submit} disabled={!canSave || saving}>{saving ? "Creando…" : "Crear pedido"}</DButton>
        </div>
      </div>
    </div>
  );
}