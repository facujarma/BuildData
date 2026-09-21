"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, Plus, Xmark } from "@gravity-ui/icons";
import { parseLocalDate, formatDateLong, todayISO } from "@/lib/format";
import { getRubrosDeObra, getMiembrosDeObra, type OptionItem } from "@/services/cronogramaService";
import { createTask } from "@/services/tareasService";

interface Props {
  open: boolean;
  obraId: string;
  onClose: () => void;
  // Se llama tras crear la tarea contra la API (el padre refresca la lista).
  onCreate: () => void;
}

const PRIORIDADES = [
  { value: "", label: "Sin prioridad" },
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export function NuevaTareaModal({ open, obraId, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [costo, setCosto] = useState("");
  const [desc, setDesc] = useState("");
  // rubros === null mientras cargan las opciones
  const [rubros, setRubros] = useState<OptionItem[] | null>(null);
  const [rubroId, setRubroId] = useState("");
  const [miembros, setMiembros] = useState<OptionItem[]>([]);
  const [asignadoA, setAsignadoA] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [fechaInicio, setFechaInicio] = useState(todayISO());
  const [fechaLimite, setFechaLimite] = useState("");
  const [optsError, setOptsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !obraId) return;
    let cancelled = false;
    Promise.all([getRubrosDeObra(obraId), getMiembrosDeObra(obraId)])
      .then(([rs, ms]) => {
        if (cancelled) return;
        setRubros(rs);
        setRubroId((prev) => (rs.some((r) => r.id === prev) ? prev : rs[0]?.id || ""));
        setMiembros(ms);
        setAsignadoA("");
      })
      .catch((e) => {
        if (!cancelled) setOptsError(e instanceof Error ? e.message : "Error cargando opciones");
      });
    return () => {
      cancelled = true;
    };
  }, [open, obraId]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose, submitting]);

  const duracionSemanas = useMemo(() => {
    const s = parseLocalDate(fechaInicio);
    const e = parseLocalDate(fechaLimite);
    if (!s) return null;
    if (!e || e < s) return 1;
    return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (7 * 86_400_000)));
  }, [fechaInicio, fechaLimite]);

  const startDate = useMemo(() => parseLocalDate(fechaInicio), [fechaInicio]);
  const endDate = useMemo(() => parseLocalDate(fechaLimite), [fechaLimite]);
  const rubroName = rubros?.find((r) => r.id === rubroId)?.nombre || "Sin rubro";

  const canSave = !submitting && name.trim().length > 0 && fechaInicio.trim().length > 0;

  const resetForm = () => {
    setName("");
    setPrioridad("");
    setFechaInicio(todayISO());
    setFechaLimite("");
    setCosto("");
    setDesc("");
    setSubmitError(null);
  };

  const handleCreate = async () => {
    if (!canSave || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createTask(obraId, {
        nombre: name.trim(),
        desc: desc.trim(),
        rubro_id: rubroId,
        asignado_a: asignadoA,
        prioridad,
        fecha_inicio: fechaInicio,
        fecha_limite: fechaLimite,
        costo_estimado: costo.trim(),
      });
      setSuccessName(name.trim());
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error al crear la tarea");
    } finally {
      setSubmitting(false);
    }
  };

  const closeAfterSuccess = () => {
    onCreate();
    onClose();
  };

  const createAnother = () => {
    resetForm();
    setSuccessName(null);
  };

  if (!open) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[640px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        {successName ? (
          <div className="px-8 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-success text-white flex items-center justify-center mx-auto mb-4">
              <Check width={26} height={26} />
            </div>
            <h3 className="text-[22px] font-extrabold display-tight leading-tight mb-2">Tarea creada</h3>
            <p className="text-[13px] text-slate-600 mb-1">
              <b className="text-slate-950">{successName}</b> · {rubroName}
            </p>
            <p className="text-[12px] text-slate-500 mb-6">
              {startDate ? formatDateLong(startDate) : "—"} → {endDate ? formatDateLong(endDate) : "—"}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={closeAfterSuccess}
                className="text-[13px] font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md px-4 py-[9px]"
              >
                Cerrar
              </button>
              <button
                onClick={createAnother}
                className="text-[13px] font-bold bg-primary hover:bg-primary-700 text-white rounded-md px-4 py-[9px]"
              >
                Crear otra
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md flex items-center justify-center bg-primary-50 text-primary">
                  <Plus width={16} height={16} />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold display-tight">Nueva tarea</div>
                  <div className="text-[11px] text-slate-500">Se agrega al cronograma · podés editarla después</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center"
              >
                <Xmark width={16} height={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate-700">Nombre*</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Hormigonado losa +4"
                  className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate-700">Rubro</span>
                  {rubros === null ? (
                    <div className="text-[12px] text-slate-400 py-2">Cargando rubros…</div>
                  ) : optsError ? (
                    <div className="text-[12px] text-[#B91C1C] py-1">{optsError}</div>
                  ) : rubros.length === 0 ? (
                    <div className="text-[12px] text-slate-500 py-2">La obra no tiene rubros.</div>
                  ) : (
                    <select
                      value={rubroId}
                      onChange={(e) => setRubroId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
                    >
                      {rubros.map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  )}
                </label>
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate-700">Responsable</span>
                  <select
                    value={asignadoA}
                    onChange={(e) => setAsignadoA(e.target.value)}
                    className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
                  >
                    <option value="">Sin asignar</option>
                    {miembros.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate-700">Prioridad</span>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
                  >
                    {PRIORIDADES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate-700">Costo estimado (AR$)</span>
                  <input
                    value={costo}
                    onChange={(e) => setCosto(e.target.value.replace(/[^0-9.,]/g, ""))}
                    placeholder="Ej: 5200000"
                    inputMode="decimal"
                    className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate-700">Fecha de inicio*</span>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum"
                  />
                </label>
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate-700">Fecha límite</span>
                  <input
                    type="date"
                    value={fechaLimite}
                    min={fechaInicio}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum"
                  />
                </label>
              </div>

              {startDate && (
                <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Rango</span>
                  <span className="font-semibold text-slate-950">
                    {formatDateLong(startDate)}
                    {endDate ? ` → ${formatDateLong(endDate)}` : ""}
                    {duracionSemanas ? <span className="text-slate-500"> · {duracionSemanas} sem.</span> : null}
                  </span>
                </div>
              )}

              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate-700">Descripción</span>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Qué hay que hacer, cantidades, observaciones…"
                  rows={3}
                  className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[72px]"
                />
              </label>

              {submitError && (
                <div className="bg-critical-50 border border-[#FECACA] rounded-lg px-3 py-2 text-[12px] font-semibold text-[#B91C1C]">
                  {submitError}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-none">
              <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!canSave}
                className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${
                  canSave ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                {submitting ? "Creando…" : "Crear tarea"} <Check width={14} height={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
