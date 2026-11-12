"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Xmark } from "@gravity-ui/icons";
import { formatDateLong, parseLocalDate } from "@/lib/format";
import { getRubrosDeObra, getMiembrosDeObra, type OptionItem } from "@/services/cronogramaService";
import { updateTask } from "@/services/tareasService";
import type { TaskItem } from "../data";

interface Props {
  /** Tarea a editar. El padre la monta con key={task.id}: cada apertura arranca limpia. */
  task: TaskItem;
  obraId: string;
  onClose: () => void;
  /** Se llama después del PATCH exitoso (el padre cierra y refresca el cronograma). */
  onSaved: () => void;
}

const PRIORIDADES = [
  { value: "", label: "Sin prioridad" },
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

// El estado "completada" no se edita acá: el backend exige POST /tareas/:id/completar
// y el drawer ya tiene los botones Completar / Reabrir.
type EstadoEditable = "pendiente" | "en_progreso";

function estadoInicial(task: TaskItem): EstadoEditable | "completada" {
  if (task.estado === "completada") return "completada";
  return task.estado === "en_progreso" ? "en_progreso" : "pendiente";
}

/** yyyy-mm-dd (o ISO) → los 10 primeros caracteres que espera <input type="date"> */
function toDateInput(value?: string | null): string {
  return value ? String(value).slice(0, 10) : "";
}

export function EditarTareaModal({ task, obraId, onClose, onSaved }: Props) {
  const completada = task.estado === "completada";

  const [nombre, setNombre] = useState(task.name);
  const [desc, setDesc] = useState(task.desc);
  const [rubroId, setRubroId] = useState(task.rubroId || "");
  const [asignadoA, setAsignadoA] = useState(task.assigneeId || "");
  const [prioridad, setPrioridad] = useState(task.priority || "");
  const [costo, setCosto] = useState(task.costRaw != null ? String(task.costRaw) : "");
  const [fechaInicio, setFechaInicio] = useState(toDateInput(task.startDate));
  const [fechaLimite, setFechaLimite] = useState(toDateInput(task.dueDate));
  const [estado, setEstado] = useState<EstadoEditable | "completada">(estadoInicial(task));
  const [avance, setAvance] = useState(String(task.pct ?? 0));

  const [rubros, setRubros] = useState<OptionItem[] | null>(null);
  const [miembros, setMiembros] = useState<OptionItem[] | null>(null);
  const [optsError, setOptsError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getRubrosDeObra(obraId), getMiembrosDeObra(obraId)])
      .then(([rs, ms]) => {
        if (cancelled) return;
        setRubros(rs);
        setMiembros(ms);
      })
      .catch((e) => {
        if (!cancelled) setOptsError(e instanceof Error ? e.message : "Error cargando opciones");
      });
    return () => {
      cancelled = true;
    };
  }, [obraId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const duracionSemanas = useMemo(() => {
    const s = parseLocalDate(fechaInicio);
    const e = parseLocalDate(fechaLimite);
    if (!s) return null;
    if (!e || e < s) return 1;
    return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (7 * 86_400_000)));
  }, [fechaInicio, fechaLimite]);

  const rangoInicio = parseLocalDate(fechaInicio);
  const rangoFin = parseLocalDate(fechaLimite);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!fechaInicio.trim()) e.fechaInicio = "La fecha de inicio es obligatoria";
    if (fechaInicio && fechaLimite && fechaLimite < fechaInicio) {
      e.fechaLimite = "La fecha límite no puede ser anterior al inicio";
    }
    if (!completada) {
      const n = Number(avance);
      if (!Number.isInteger(n) || n < 0 || n > 100) e.avance = "Avance: entero entre 0 y 100";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await updateTask(task.id, {
        nombre: nombre.trim(),
        descripcion: desc.trim(),
        rubroId,
        estado: completada ? undefined : (estado as EstadoEditable),
        prioridad,
        fechaInicio,
        fechaLimite,
        asignadoA,
        // "" limpia costo / fecha límite / responsable en el backend
        costoEstimado: costo.trim() === "" ? "" : Number(costo),
        porcentajeAvance: completada ? undefined : Number(avance),
      });
      onSaved();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[640px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md flex items-center justify-center bg-primary-50 text-primary flex-none">
              <Pencil width={16} height={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold display-tight">Editar tarea</div>
              <div className="text-[11px] text-slate-500 truncate">
                {task.rubro} · los cambios se ven en el cronograma al guardar
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
        <div className="p-6 space-y-4 overflow-y-auto">
          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Nombre*</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Hormigonado losa +4"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
            />
            {errors.nombre && <span className="text-[11px] font-semibold text-[#B91C1C]">{errors.nombre}</span>}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Rubro</span>
              {rubros === null ? (
                <div className="text-[12px] text-slate-400 py-2">Cargando rubros…</div>
              ) : optsError ? (
                <div className="text-[12px] text-[#B91C1C] py-1">{optsError}</div>
              ) : (
                <select
                  value={rubroId}
                  onChange={(e) => setRubroId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
                >
                  <option value="">Sin rubro</option>
                  {rubros.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              )}
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Responsable</span>
              {miembros === null ? (
                <div className="text-[12px] text-slate-400 py-2">Cargando equipo…</div>
              ) : (
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
              )}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Estado</span>
              <select
                value={estado}
                disabled={completada}
                onChange={(e) => setEstado(e.target.value as EstadoEditable)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                {completada && <option value="completada">Completada</option>}
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
              </select>
              {completada && (
                <span className="text-[10px] text-slate-500 leading-snug">
                  Para reabrirla usá “Reabrir” en el detalle de la tarea.
                </span>
              )}
            </label>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Costo estimado (AR$)</span>
              <input
                value={costo}
                onChange={(e) => setCosto(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Sin costo"
                inputMode="numeric"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum"
              />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Avance (%)</span>
              <input
                value={completada ? "100" : avance}
                disabled={completada}
                onChange={(e) => setAvance(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                inputMode="numeric"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum disabled:bg-slate-50 disabled:text-slate-500"
              />
              {errors.avance && <span className="text-[11px] font-semibold text-[#B91C1C]">{errors.avance}</span>}
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
              {errors.fechaInicio && <span className="text-[11px] font-semibold text-[#B91C1C]">{errors.fechaInicio}</span>}
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
              {errors.fechaLimite && <span className="text-[11px] font-semibold text-[#B91C1C]">{errors.fechaLimite}</span>}
            </label>
          </div>

          {rangoInicio && (
            <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Rango</span>
              <span className="font-semibold text-slate-950">
                {formatDateLong(rangoInicio)}
                {rangoFin ? ` → ${formatDateLong(rangoFin)}` : ""}
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-none">
          <button
            onClick={onClose}
            className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${
              saving ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-primary hover:bg-primary-700 text-white"
            }`}
          >
            {saving ? "Guardando…" : "Guardar cambios"} <Check width={14} height={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
