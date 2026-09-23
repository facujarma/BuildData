"use client";

import { useState, useRef } from "react";
import { Xmark, Camera, TrashBin } from "@gravity-ui/icons";
import DButton from "@/components/ui/Button";
import type { StockItem } from "../data";

interface Props {
  item: StockItem | null;
  cats: string[];
  catColor: (cat: string) => string;
  onClose: () => void;
  onSave: (item: StockItem, photo: File | null) => Promise<void>;
  onDelete?: (id: string) => void;
}

export function StockItemModal({ item, cats, catColor, onClose, onSave, onDelete }: Props) {
  const isNew = !item;
  const [name, setName] = useState(item?.name || "");
  const [cat, setCat] = useState(item ? item.cat : cats[0] || "");
  const [unit, setUnit] = useState(item?.unit || "");
  const [qty, setQty] = useState(item?.qty ?? 0);
  const [min, setMin] = useState(item?.min ?? 0);
  const [cost, setCost] = useState(item?.cost ?? 0);
  const [loc, setLoc] = useState(item?.loc || "");
  const [photo, setPhoto] = useState(item?.photo || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canSave = name.trim() && !saving;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("La foto debe ser JPG, PNG o WebP");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("La foto no puede superar 5 MB");
      return;
    }
    setError("");
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      await onSave(
        {
          id: item?.id || "",
          name: name.trim(),
          cat: cat.trim(),
          unit: unit.trim(),
          qty,
          min,
          cost,
          loc: loc.trim(),
          photo,
        },
        photoFile
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el material");
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[520px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md" style={{ background: catColor(cat) + "22", color: catColor(cat) }}>
              <div className="w-full h-full flex items-center justify-center">
                <Camera width={16} height={16} />
              </div>
            </div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">{isNew ? "Agregar material" : "Editar material"}</div>
              <div className="text-[11px] text-slate-500">{isNew ? "Nuevo item de inventario" : item!.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center">
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-4">
            <div onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors overflow-hidden flex-none">
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera width={24} height={24} className="text-slate-400" />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} hidden />
            <div>
              <div className="text-[13px] font-semibold text-slate-950">Foto del material</div>
              <div className="text-[11px] text-slate-500 mt-[2px]">Tocá para subir una imagen</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px] col-span-2">
              <span className="text-[11px] font-bold text-slate-700">Nombre*</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cemento Portland 50 kg"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Categoría</span>
              <select value={cat} onChange={(e) => setCat(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                <option value="">Sin categoría</option>
                {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Unidad</span>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ej: bolsas, m³, u"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Cantidad</span>
              <input type="number" min={0} value={qty} onChange={(e) => setQty(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Mínimo</span>
              <input type="number" min={0} value={min} onChange={(e) => setMin(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Costo unitario (AR$)</span>
              <input type="number" min={0} value={cost} onChange={(e) => setCost(Number(e.target.value))}
                placeholder="0"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Ubicación</span>
              <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Ej: Depósito A, Playa, Pañol"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>
        </div>

        {error && <div className="px-6 py-2 text-[12px] font-semibold text-critical border-t border-slate-200">{error}</div>}

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-none">
          <div>
            {!isNew && onDelete && (
              <DButton variant="danger" size="sm" onClick={() => { onDelete(item!.id); onClose(); }}>
                <TrashBin width={13} height={13} /> Eliminar
              </DButton>
            )}
          </div>
          <div className="flex gap-2">
            <DButton variant="ghost" onClick={onClose}>Cancelar</DButton>
            <DButton onClick={submit} disabled={!canSave}>{saving ? "Guardando…" : isNew ? "Agregar" : "Guardar"}</DButton>
          </div>
        </div>
      </div>
    </div>
  );
}
