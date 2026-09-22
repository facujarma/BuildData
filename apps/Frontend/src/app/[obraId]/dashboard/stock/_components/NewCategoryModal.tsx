"use client";

import { useState } from "react";
import { Xmark, FolderPlus } from "@gravity-ui/icons";
import DButton from "@/components/ui/Button";

interface Props {
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  existing: string[];
}

export function NewCategoryModal({ onClose, onSave, existing }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dup = name.trim() && existing.some((c) => c.toLowerCase() === name.trim().toLowerCase());
  const canSave = name.trim().length >= 2 && !dup;

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la categoría");
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[420px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center">
              <FolderPlus width={16} height={16} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">Nueva categoría</div>
              <div className="text-[11px] text-slate-500">Agregá una categoría para clasificar materiales</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center">
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Nombre*</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Herreria, Pintura, Aberturas…"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            {dup && (
              <span className="text-[11px] text-critical font-semibold">Esa categoría ya existe</span>
            )}
            {error && <span className="text-[11px] text-critical font-semibold">{error}</span>}
          </label>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-none">
          <DButton variant="ghost" onClick={onClose}>Cancelar</DButton>
          <DButton onClick={submit} disabled={!canSave || saving}>Crear categoría</DButton>
        </div>
      </div>
    </div>
  );
}
