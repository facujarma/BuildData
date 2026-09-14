"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  CircleExclamation,
  ChartBar,
  Persons,
  Check,
  Xmark,
  Plus,
  Lock,
} from "@gravity-ui/icons";
import { QRCodeSVG } from "qrcode.react";
import { useDashboardData } from "./DashboardDataContext";
import { createTask } from "@/services/tareasService";
import { createAlert } from "@/services/alertasService";
import { createActividad } from "@/services/actividadService";

interface FieldDef {
  id: string;
  label: string;
  type: "text" | "select" | "textarea" | "date";
  placeholder?: string;
  required?: boolean;
  addable?: boolean;
  disabled?: boolean;
  source?: "rubros";
  options?: string[];
}

interface FormConfig {
  title: string;
  icon: typeof Calendar;
  accent: string;
  done: (data: Record<string, string>) => string;
  fields: FieldDef[];
}

const QUICK_FORMS: Record<string, FormConfig> = {
  tarea: {
    title: "Nueva tarea", icon: Calendar, accent: "#0F4395",
    done: (d) => `Tarea "${d.nombre}" agregada al cronograma`,
    fields: [
      { id: "nombre", label: "Nombre de la tarea", type: "text", placeholder: "Ej: Hormigonado losa +4", required: true },
      { id: "rubro",  label: "Rubro", type: "select", addable: true, source: "rubros" },
      { id: "who",    label: "Responsable", type: "select", disabled: true },
      { id: "desc",   label: "Descripción breve", type: "textarea", placeholder: "Qué hay que hacer, cantidades, observaciones…" },
    ],
  },
  critico: {
    title: "Reportar crítico", icon: CircleExclamation, accent: "#EF4444",
    done: (d) => `Alerta "${d.titulo}" reportada`,
    fields: [
      { id: "titulo", label: "Título del problema", type: "text", placeholder: "Ej: Falla en Grúa Torre 2", required: true },
      { id: "nivel",  label: "Nivel", type: "select", options: ["Crítico", "Importante", "Moderado"] },
      { id: "desc",   label: "Descripción", type: "textarea", placeholder: "Detalle de lo que pasó…" },
    ],
  },
  reporte: {
    title: "Nueva actividad", icon: ChartBar, accent: "#3B82F6",
    done: () => "Actividad registrada",
    fields: [
      { id: "tipo", label: "Tipo", type: "select", options: ["Avance de tarea", "Foto", "Cierre de jornada", "Problema"] },
      { id: "texto", label: "Detalle", type: "textarea", placeholder: "Qué se hizo, cantidades, observaciones…", required: true },
    ],
  },
  persona: {
    title: "Invitar persona", icon: Persons, accent: "#22C55E",
    done: (d) => `Enlace de invitación generado para ${d.nombre || "la persona"}`,
    fields: [
      { id: "nombre", label: "Nombre", type: "text", placeholder: "Ej: Marta Robles", required: true },
      { id: "tel",    label: "WhatsApp", type: "text", placeholder: "+54 9 11 …" },
      { id: "rol",    label: "Rol", type: "select", disabled: true },
    ],
  },
};

interface Props {
  kind: string | null;
  obraId: string;
  onClose: () => void;
  onDone: (msg: string) => void;
}

export function QuickAddModal({ kind, obraId, onClose, onDone }: Props) {
  const cfg = kind ? QUICK_FORMS[kind] : null;
  const [data, setData] = useState<Record<string, string>>({});
  const [extraOpts, setExtraOpts] = useState<Record<string, string[]>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [addVal, setAddVal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const { data: lookup, refreshDashboard } = useDashboardData();

  useEffect(() => {
    if (!kind) return;
    const defaults: Record<string, string> = {};
    const form = QUICK_FORMS[kind];
    if (form) {
      for (const f of form.fields) {
        if (f.type === "select" && f.options?.length) {
          defaults[f.id] = f.options[0];
        }
      }
    }
    setData(defaults);
    setExtraOpts({});
    setAdding(null);
    setAddVal("");
    setQrLink(null);
  }, [kind]);

  useEffect(() => {
    if (!kind) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { if (qrLink) setQrLink(null); else onClose(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [kind, onClose, qrLink]);

  if (!cfg) return null;

  const required = cfg.fields.filter((f) => f.required).map((f) => f.id);
  const canSave = required.every((id) => (data[id] || "").trim());

  const set = (id: string, v: string) => setData((p) => ({ ...p, [id]: v }));

  const submit = async () => {
    if (!canSave || submitting) return;
    setSubmitting(true);
    try {
      if (kind === "tarea") await createTask(obraId, { ...data, rubro_id: lookup.rubroMap[data.rubro] || "" });
      else if (kind === "critico") await createAlert(obraId, data);
      else if (kind === "reporte") await createActividad(obraId, data);
      else if (kind === "persona") {
        const phone = process.env.NEXT_PUBLIC_BOT_PHONE;
        const msg = encodeURIComponent(`!iniciar ${data.nombre} ${obraId}`);
        setQrLink(`https://wa.me/${phone}?text=${msg}`);
        return;
      }
      onDone(cfg.done(data));
      onClose();
      refreshDashboard().catch(() => {});
    } catch (e: unknown) {
      onDone(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = cfg.icon;

  const closeQr = () => { setQrLink(null); onClose(); };

  const copyLink = async () => {
    if (!qrLink) return;
    try {
      await navigator.clipboard.writeText(qrLink);
      onDone("Enlace copiado al portapapeles");
    } catch {
      onDone("No se pudo copiar el enlace");
    }
  };

  if (qrLink) {
    return (
      <div onClick={closeQr} className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
        <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[380px] rounded-2xl shadow-big p-6 flex flex-col items-center gap-5 animate-modal-pop">
          <div className="text-center">
            <div className="text-[15px] font-extrabold">Invitación para {data.nombre}</div>
            <div className="text-[11px] text-slate-500 mt-1">Escaneá el código o compartí el enlace</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <QRCodeSVG value={qrLink} size={220} level="M" />
          </div>

          <div className="w-full text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2 truncate text-center select-all">
            {qrLink}
          </div>

          <div className="flex gap-2 w-full">
            <button onClick={copyLink}
              className="flex-1 text-[12px] font-bold rounded-md px-4 py-[9px] bg-primary hover:bg-primary-700 text-white transition-colors">
              Copiar enlace
            </button>
            <button onClick={closeQr}
              className="flex-1 text-[12px] font-bold rounded-md px-4 py-[9px] border border-slate-200 text-slate-600 hover:text-slate-950 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[520px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: cfg.accent + "22", color: cfg.accent }}>
              <Icon width={16} height={16} />
            </div>
            <div className="text-[15px] font-extrabold display-tight">{cfg.title}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center">
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {cfg.fields.map((f) => {
            const sourceOpts = f.source === "rubros" ? lookup.rubros.map((r) => r.name) : [];
            const opts = [...(f.options || []), ...sourceOpts, ...(extraOpts[f.id] || [])];
            const commitAdd = () => {
              const v = addVal.trim();
              if (v) {
                if (!opts.includes(v)) setExtraOpts((p) => ({ ...p, [f.id]: [...(p[f.id] || []), v] }));
                set(f.id, v);
              }
              setAdding(null);
              setAddVal("");
            };
            return (
              <label key={f.id} className="flex flex-col gap-[6px]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">{f.label}{f.required && "*"}</span>
                  {f.addable && adding !== f.id && (
                    <button type="button" onClick={() => { setAdding(f.id); setAddVal(""); }}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]">
                      <Plus width={10} height={10} /> Nuevo
                    </button>
                  )}
                </div>
                {f.addable && adding === f.id ? (
                  <div className="flex gap-1">
                    <input autoFocus value={addVal} onChange={(e) => setAddVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitAdd(); else if (e.key === "Escape") setAdding(null); }}
                      placeholder="Nuevo valor"
                      className="flex-1 min-w-0 bg-white border border-primary rounded-md px-3 py-[9px] text-[13px] focus:outline-none" />
                    <button type="button" onClick={commitAdd} className="px-3 rounded-md bg-primary text-white flex items-center justify-center"><Check width={14} height={14} /></button>
                    <button type="button" onClick={() => setAdding(null)} className="px-2 rounded-md border border-slate-200 text-slate-500 flex items-center justify-center"><Xmark width={14} height={14} /></button>
                  </div>
                ) : f.disabled ? (
                  <div className="relative">
                    <select disabled value=""
                      className="w-full bg-slate-100 border border-slate-200 rounded-md px-3 py-[9px] text-[13px] text-slate-400 cursor-not-allowed appearance-none">
                      <option value="">No disponible aún</option>
                    </select>
                    <Lock width={12} height={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                ) : f.type === "select" ? (
                  <select value={data[f.id] || opts[0]} onChange={(e) => set(f.id, e.target.value)}
                    className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                    {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea value={data[f.id] || ""} onChange={(e) => set(f.id, e.target.value)} placeholder={f.placeholder} rows={3}
                    className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[72px]" />
                ) : (
                  <input type={f.type} value={data[f.id] || ""} onChange={(e) => set(f.id, e.target.value)} placeholder={f.placeholder}
                    className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
                )}
              </label>
            );
          })}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave || submitting}
            className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (canSave && !submitting ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed")}>
            {submitting ? "Guardando…" : "Crear"} {!submitting && <Check width={14} height={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
