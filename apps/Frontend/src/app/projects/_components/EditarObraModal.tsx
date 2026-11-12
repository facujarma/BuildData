"use client";

import { useEffect, useState } from "react";
import { CircleExclamation, Pencil, Xmark } from "@gravity-ui/icons";
import type { Obra } from "@/types/projects";
import { STATUS } from "@/types/projects";
import { TYPES } from "@/app/projects/data/wizard";
import { updateObra, type UpdateObraInput } from "@/services/projectsService";
import { WField } from "./WField";
import { WInput } from "./WInput";
import { WSelect } from "./WSelect";

interface Props {
  /** La obra a editar. El padre la monta con key={obra.id}: cada apertura arranca limpia. */
  obra: Obra;
  onClose: () => void;
  onSaved: (obra: Obra) => void;
}

interface FormState {
  nombre: string;
  codigo: string;
  tipo: string;
  status: Obra["status"];
  direccion: string;
  ciudad: string;
  provincia: string;
  zip: string;
  inicio: string;
  fin: string;
  autoApprove: boolean;
}

/** Las fechas de calendario llegan como YYYY-MM-DD (o ISO); el input date quiere los 10 primeros. */
function toDateInput(value?: string | null): string {
  return value ? String(value).slice(0, 10) : "";
}

function formFromObra(obra: Obra): FormState {
  return {
    nombre: obra.name,
    codigo: obra.code || "",
    tipo: obra.type || "",
    status: obra.status,
    direccion: obra.address,
    ciudad: obra.city || "",
    provincia: obra.province || "",
    zip: obra.zip || "",
    inicio: toDateInput(obra.startDate),
    fin: toDateInput(obra.endDate),
    autoApprove: !!obra.autoApprove,
  };
}

export function EditarObraModal({ obra, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => formFromObra(obra));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const set = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
    setError("");
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "El nombre de la obra es obligatorio";
    else if (form.nombre.trim().length < 2) e.nombre = "El nombre debe tener al menos 2 caracteres";
    if (!form.tipo) e.tipo = "Seleccioná un tipo de obra";
    if (!form.direccion.trim()) e.direccion = "La dirección es obligatoria";
    if (form.inicio && form.fin && form.fin < form.inicio) {
      e.fin = "La fecha de fin no puede ser anterior al inicio";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (saving) return;
    if (!validate()) return;

    const payload: UpdateObraInput = {
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      tipo: form.tipo,
      status: form.status,
      direccion: form.direccion.trim(),
      ciudad: form.ciudad.trim(),
      provincia: form.provincia.trim(),
      zip: form.zip.trim(),
      // "" limpia la fecha en el backend; undefined la dejaría intacta
      inicio: form.inicio,
      fin: form.fin,
      autoApprove: form.autoApprove,
    };

    setSaving(true);
    try {
      const updated = await updateObra(obra.id, payload);
      onSaved(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[640px] max-h-[calc(100vh-32px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center flex-none">
              <Pencil width={16} height={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold display-tight">Editar obra</div>
              <div className="text-[11px] text-slate-500 truncate">
                {obra.name} · {obra.code}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center flex-none"
          >
            <Xmark width={16} height={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <section>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">
              Información básica
            </div>
            <div className="grid grid-cols-2 gap-4">
              <WField label="Nombre de la obra*" span={2} error={errors.nombre}>
                <WInput
                  value={form.nombre}
                  onChange={(e) => set({ nombre: e.target.value })}
                  placeholder="Nombre que ve todo el equipo"
                />
              </WField>
              <WField label="Código interno" hint="Único entre todas las obras.">
                <WInput
                  value={form.codigo}
                  onChange={(e) => set({ codigo: e.target.value })}
                  placeholder="OBR-2026-001"
                />
              </WField>
              <WField label="Estado">
                <WSelect
                  value={form.status}
                  onChange={(e) => set({ status: e.target.value as Obra["status"] })}
                >
                  {(Object.keys(STATUS) as Obra["status"][]).map((k) => (
                    <option key={k} value={k}>
                      {STATUS[k].label}
                    </option>
                  ))}
                </WSelect>
              </WField>
              <WField label="Tipo de obra*" span={2} error={errors.tipo}>
                <WSelect value={form.tipo} onChange={(e) => set({ tipo: e.target.value })}>
                  <option value="">Seleccioná un tipo</option>
                  {TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </WSelect>
              </WField>
            </div>
          </section>

          <section>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">
              Ubicación
            </div>
            <div className="grid grid-cols-3 gap-4">
              <WField label="Dirección*" span={2} error={errors.direccion}>
                <WInput
                  value={form.direccion}
                  onChange={(e) => set({ direccion: e.target.value })}
                  placeholder="Av. Belgrano 1842"
                />
              </WField>
              <WField label="Localidad">
                <WInput
                  value={form.ciudad}
                  onChange={(e) => set({ ciudad: e.target.value })}
                  placeholder="CABA"
                />
              </WField>
              <WField label="Provincia">
                <WInput
                  value={form.provincia}
                  onChange={(e) => set({ provincia: e.target.value })}
                  placeholder="Buenos Aires"
                />
              </WField>
              <WField label="Código postal">
                <WInput
                  value={form.zip}
                  onChange={(e) => set({ zip: e.target.value })}
                  placeholder="C1093"
                />
              </WField>
            </div>
          </section>

          <section>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">
              Cronograma
            </div>
            <div className="grid grid-cols-2 gap-4">
              <WField label="Inicio">
                <WInput
                  type="date"
                  value={form.inicio}
                  onChange={(e) => set({ inicio: e.target.value })}
                />
              </WField>
              <WField label="Fin estimado" error={errors.fin}>
                <WInput
                  type="date"
                  value={form.fin}
                  onChange={(e) => set({ fin: e.target.value })}
                />
              </WField>
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoApprove}
                onChange={(e) => set({ autoApprove: e.target.checked })}
                className="mt-[3px] w-4 h-4 accent-[#0F4395]"
              />
              <span className="min-w-0">
                <span className="block text-[12px] font-bold text-slate-950">
                  Aprobar operaciones del bot automáticamente
                </span>
                <span className="block text-[11px] text-slate-500 leading-snug mt-[2px]">
                  Con esto activado, los pedidos, gastos y ajustes de stock que manda el equipo por
                  WhatsApp se ejecutan sin pasar por la bandeja de aprobación.
                </span>
              </span>
            </label>
          </section>

          <p className="text-[11px] text-slate-500 leading-snug">
            El presupuesto, los rubros y el equipo se editan desde sus propias secciones dentro de
            la obra.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 flex items-center justify-between gap-3 bg-slate-50 flex-none">
          <button
            onClick={onClose}
            className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2 min-w-0">
            {error && (
              <div className="flex items-center gap-2 text-[12px] font-semibold text-critical min-w-0">
                <CircleExclamation width={14} height={14} className="flex-none" />
                <span className="truncate">{error}</span>
              </div>
            )}
            <button
              onClick={submit}
              disabled={saving}
              className={`text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${
                saving
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-700 text-white"
              }`}
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
