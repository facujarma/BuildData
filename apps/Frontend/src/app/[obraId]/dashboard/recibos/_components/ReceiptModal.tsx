"use client";

import { useState, useRef } from "react";
import { Xmark, Plus } from "@gravity-ui/icons";
import { todayISO } from "@/lib/format";
import type { NuevoRecibo } from "@/services/recibosService";
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from "../data";

interface Props {
  cats: string[];
  rubros: { id: string; nombre: string }[];
  onClose: () => void;
  // Si lanza, el modal muestra el error y sigue abierto
  onSave: (data: NuevoRecibo, file: File | null) => Promise<void>;
}

export function ReceiptModal({ cats, rubros, onClose, onSave }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [concept, setConcept] = useState("");
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState(cats[0] || "");
  const [rubroId, setRubroId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [paid, setPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPTED_FILE_TYPES.includes(f.type)) {
      setError("El archivo debe ser PDF, JPG, PNG o WebP");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError("El archivo no puede superar 10 MB");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const handleClick = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0]);
  };

  const montoValido = (parseFloat(amount) || 0) > 0;
  const canSave = concept.trim() && provider.trim() && category && montoValido && date && !saving;

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      await onSave(
        {
          concept: concept.trim(),
          provider: provider.trim(),
          category,
          rubroId: rubroId || null,
          amount: parseFloat(amount) || 0,
          date,
          paid,
        },
        file,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el recibo");
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[480px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="text-[15px] font-extrabold display-tight">Cargar recibo</div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center">
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging ? "border-primary bg-primary-50" : "border-slate-200 hover:border-slate-300 bg-slate-50"
            }`}
          >
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
            <Plus width={24} height={24} className="mx-auto mb-2 text-slate-400" />
            {file ? (
              <div className="text-[13px] font-semibold text-slate-800">{file.name}</div>
            ) : (
              <>
                <div className="text-[13px] font-semibold text-slate-600">Arrastrá un archivo o hacé clic</div>
                <div className="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG o WebP · máx 10 MB · opcional</div>
              </>
            )}
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Concepto</span>
            <input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Cemento × 120 bolsas"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Proveedor</span>
            <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Ej: Cementos del Plata"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Categoría</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
              {cats.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">
              Rubro <span className="font-normal text-slate-500">(opcional · suma al presupuesto del rubro)</span>
            </span>
            <select value={rubroId} onChange={(e) => setRubroId(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
              <option value="">Sin rubro</option>
              {rubros.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <label className="flex flex-col gap-[6px] flex-1">
              <span className="text-[11px] font-bold text-slate-700">Monto AR$</span>
              <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
            </label>
            <label className="flex flex-col gap-[6px] flex-1">
              <span className="text-[11px] font-bold text-slate-700">Fecha</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
            <span className="text-[13px] font-semibold text-slate-700">Marcar como pagado</span>
          </label>
        </div>

        {error && <div className="px-6 py-2 text-[12px] font-semibold text-critical border-t border-slate-200">{error}</div>}

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave}
            className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (canSave ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed")}>
            {saving ? "Guardando…" : "Guardar recibo"}
          </button>
        </div>
      </div>
    </div>
  );
}
