"use client";

import { useState, useRef } from "react";
import { Xmark, Plus } from "@gravity-ui/icons";

export interface ReceiptModalData {
  file: string;
  concept: string;
  provider: string;
  category: string;
  amount: number;
  date: string;
  paid: boolean;
}

interface Props {
  cats: string[];
  onClose: () => void;
  onSave: (data: ReceiptModalData) => void;
}

export function ReceiptModal({ cats, onClose, onSave }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [concept, setConcept] = useState("");
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState(cats[0] || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [paid, setPaid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("comprobante-" + Date.now().toString(36) + ".pdf");
    }
  };

  const handleClick = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("recibo-" + Date.now().toString(36) + ".pdf");
    }
  };

  const canSave = fileName && concept.trim() && provider.trim() && category && amount && date;

  const submit = () => {
    if (!canSave) return;
    onSave({
      file: fileName,
      concept: concept.trim(),
      provider: provider.trim(),
      category,
      amount: parseFloat(amount) || 0,
      date,
      paid,
    });
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
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
            <Plus width={24} height={24} className="mx-auto mb-2 text-slate-400" />
            {fileName ? (
              <div className="text-[13px] font-semibold text-slate-800">{fileName}</div>
            ) : (
              <>
                <div className="text-[13px] font-semibold text-slate-600">Arrastrá un archivo o hacé clic</div>
                <div className="text-[11px] text-slate-400 mt-1">PDF, JPG o PNG</div>
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

          <div className="flex gap-3">
            <label className="flex flex-col gap-[6px] flex-1">
              <span className="text-[11px] font-bold text-slate-700">Monto AR$</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
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

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave}
            className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (canSave ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed")}>
            Guardar recibo
          </button>
        </div>
      </div>
    </div>
  );
}
