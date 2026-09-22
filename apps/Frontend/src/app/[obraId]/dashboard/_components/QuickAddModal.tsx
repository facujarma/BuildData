"use client";

import { useState, useEffect } from "react";
import { CircleExclamation, Comment, Check, Xmark, Plus } from "@gravity-ui/icons";
import { InviteTeamModal } from "../equipo/_components/InviteTeamModal";
import { SupplierModal } from "./SupplierModal";
import { UploadPhotosModal } from "./UploadPhotosModal";
import { StockItemModal } from "../stock/_components/StockItemModal";
import { catColor as stockCatColor } from "../stock/data";
import { ReceiptModal } from "../recibos/_components/ReceiptModal";
import { CATEGORIES as RECEIPT_CATEGORIES } from "../recibos/data";
import { NuevaTareaModal } from "../cronograma/_components/NuevaTareaModal";
import { NewOrderModal } from "../pedidos/_components/NewOrderModal";
import { CategoryModal } from "./CategoryModal";
import { useDashboardData } from "./DashboardDataContext";
import { getObreros, createPedido, type ObreroLite } from "@/services/pedidosService";
import { getStock, createMaterial } from "@/services/stockService";
import { getRubrosDeObra } from "@/services/cronogramaService";
import { addProveedor, nextProveedorId } from "@/services/mock/proveedoresService";
import { createAlert } from "@/services/alertasService";
import { createActividad } from "@/services/actividadService";

interface FieldDef {
  id: string;
  label: string;
  type: "text" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  addable?: boolean;
  addPlaceholder?: string;
  options?: string[];
}

interface FormConfig {
  title: string;
  icon: typeof CircleExclamation;
  accent: string;
  hint?: string;
  done: (data: Record<string, string>) => string;
  fields: FieldDef[];
}

const QUICK_FORMS: Record<string, FormConfig> = {
  critico: {
    title: "Reportar crítico", icon: CircleExclamation, accent: "#EF4444",
    done: (d) => `Alerta “${d.titulo}” reportada`,
    fields: [
      { id: "titulo", label: "Título del problema", type: "text", placeholder: "Ej: Falla en Grúa Torre 2", required: true },
      { id: "nivel",  label: "Nivel", type: "select", options: ["Crítico", "Importante", "Moderado"] },
      { id: "cat",    label: "Categoría", type: "select", addable: true, addPlaceholder: "Nombre de la categoría", options: ["Equipos", "Materiales", "Seguridad", "Personal", "Logística", "Reportes"] },
      { id: "desc",   label: "Descripción", type: "textarea", placeholder: "Detalle de lo que pasó…" },
    ],
  },
  reporte: {
    title: "Nueva actividad", icon: Comment, accent: "#3B82F6",
    done: () => "Actividad registrada en la bitácora",
    hint: "Usalo cuando algo pasó en la obra pero no entró por el bot: te lo dijeron en persona, el capataz estaba sin señal, o lo viste vos. Queda en la bitácora igual que los mensajes de WhatsApp, marcado como carga manual.",
    fields: [
      { id: "tipo", label: "Tipo", type: "select", options: ["Avance de tarea", "Foto", "Cierre de jornada", "Problema"] },
      { id: "texto", label: "Detalle", type: "textarea", placeholder: "Qué se hizo, cantidades, observaciones…", required: true },
    ],
  },
};

interface Props {
  kind: string | null;
  obraId: string;
  onClose: () => void;
  onDone: (msg: string) => void;
}

// ── Flujos por tipo (mismos modales que cada sección) ────────────────────────

function QuickAddTarea({ obraId, onClose, onDone }: Omit<Props, "kind">) {
  const { refreshDashboard } = useDashboardData();
  return (
    <NuevaTareaModal
      open
      obraId={obraId}
      onClose={onClose}
      onCreate={() => {
        onDone("Tarea agregada al cronograma");
        refreshDashboard().catch(() => {});
      }}
    />
  );
}

function QuickAddPedido({ obraId, onClose, onDone }: Omit<Props, "kind">) {
  const { refreshDashboard } = useDashboardData();
  const [members, setMembers] = useState<ObreroLite[]>([]);
  const [rubros, setRubros] = useState<string[]>([]);

  useEffect(() => {
    getObreros(obraId).then(setMembers).catch(() => {});
    getRubrosDeObra(obraId)
      .then((r) => setRubros(r.map((x) => x.nombre)))
      .catch(() => {});
  }, [obraId]);

  return (
    <NewOrderModal
      onClose={onClose}
      members={members}
      rubros={rubros}
      onSubmit={async (payload) => {
        await createPedido(obraId, payload);
        onDone("Pedido creado");
        refreshDashboard().catch(() => {});
        onClose();
      }}
    />
  );
}

function QuickAddMaterial({ obraId, onClose, onDone }: Omit<Props, "kind">) {
  const [cats, setCats] = useState<string[]>([]);

  useEffect(() => {
    getStock(obraId).then((d) => setCats(d.categories)).catch(() => {});
  }, [obraId]);

  return (
    <StockItemModal
      item={null}
      cats={cats}
      catColor={stockCatColor}
      onClose={onClose}
      onSave={async (item, photo) => {
        await createMaterial(obraId, item, photo);
        onDone(`Material “${item.name}” agregado al stock`);
        onClose();
      }}
    />
  );
}

function QuickAddRecibo({ onClose, onDone }: Omit<Props, "kind" | "obraId">) {
  return (
    <ReceiptModal
      cats={RECEIPT_CATEGORIES}
      onClose={onClose}
      onSave={() => {
        onDone("Comprobante cargado");
        onClose();
      }}
    />
  );
}

function QuickAddRubro({ onClose, onDone }: Omit<Props, "kind" | "obraId">) {
  const { data } = useDashboardData();
  return (
    <CategoryModal
      open
      initial={null}
      availableTasks={data.tasks}
      onClose={onClose}
      onSave={(cat) => onDone(`Rubro “${cat.name}” creado`)}
    />
  );
}

function QuickAddProveedor({ obraId, onClose, onDone }: Omit<Props, "kind">) {
  const [rubros, setRubros] = useState<string[]>([]);

  useEffect(() => {
    getRubrosDeObra(obraId)
      .then((r) => setRubros(r.map((x) => x.nombre)))
      .catch(() => {});
  }, [obraId]);

  return (
    <SupplierModal
      initial={null}
      scope="global"
      rubros={rubros}
      onClose={onClose}
      onSave={(d) => {
        addProveedor({
          id: nextProveedorId(),
          scope: "global",
          fav: false,
          name: d.name,
          rubro: d.rubro,
          cuit: d.cuit,
          contact: d.contact,
          role: d.role,
          phone: d.phone,
          wa: d.wa,
          email: d.email,
          web: d.web,
          address: d.address,
          pay: d.pay,
          lead: d.lead,
          desc: d.desc,
          orders: 0,
          spent: 0,
        });
        onDone(`Proveedor “${d.name}” agregado al catálogo`);
        onClose();
      }}
    />
  );
}

function QuickAddEquipo({ onClose, onDone }: Omit<Props, "kind" | "obraId">) {
  return (
    <InviteTeamModal
      open
      onClose={onClose}
      onSave={(raw) => {
        const d = raw as { mode?: string; name?: string; email?: string };
        onDone(d.mode === "obrero"
          ? `Obrero ${d.name} invitado por WhatsApp`
          : `Invitación enviada a ${d.name || d.email}`);
      }}
    />
  );
}

// ── Formularios genéricos (alerta / actividad) ───────────────────────────────

function QuickAddGeneric({ kind, obraId, onClose, onDone }: Omit<Props, "kind"> & { kind: string }) {
  const cfg = QUICK_FORMS[kind];
  const [data, setData] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    if (cfg) {
      for (const f of cfg.fields) {
        if (f.type === "select" && f.options?.length) defaults[f.id] = f.options[0];
      }
    }
    return defaults;
  });
  const [extraOpts, setExtraOpts] = useState<Record<string, string[]>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [addVal, setAddVal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  if (!cfg) return null;

  const required = cfg.fields.filter((f) => f.required).map((f) => f.id);
  const canSave = required.every((id) => (data[id] || "").trim());
  const set = (id: string, v: string) => setData((p) => ({ ...p, [id]: v }));

  const submit = async () => {
    if (!canSave || submitting) return;
    setSubmitting(true);
    try {
      if (kind === "critico") await createAlert(obraId, data);
      else if (kind === "reporte") await createActividad(obraId, data);
      onDone(cfg.done(data));
      onClose();
    } catch (e: unknown) {
      onDone(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = cfg.icon;

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
          {cfg.hint && (
            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <CircleExclamation width={13} height={13} className="text-slate-400 mt-[1px] flex-none" />
              <span className="text-[11px] text-slate-600 leading-snug">{cfg.hint}</span>
            </div>
          )}
          {cfg.fields.map((f) => {
            const opts = [...(f.options || []), ...(extraOpts[f.id] || [])];
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
                      placeholder={f.addPlaceholder || "Nuevo valor"}
                      className="flex-1 min-w-0 bg-white border border-primary rounded-md px-3 py-[9px] text-[13px] focus:outline-none" />
                    <button type="button" onClick={commitAdd} className="px-3 rounded-md bg-primary text-white flex items-center justify-center"><Check width={14} height={14} /></button>
                    <button type="button" onClick={() => setAdding(null)} className="px-2 rounded-md border border-slate-200 text-slate-500 flex items-center justify-center"><Xmark width={14} height={14} /></button>
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

// ── Dispatcher ───────────────────────────────────────────────────────────────

export function QuickAddModal({ kind, obraId, onClose, onDone }: Props) {
  if (!kind) return null;

  switch (kind) {
    case "tarea":
      return <QuickAddTarea obraId={obraId} onClose={onClose} onDone={onDone} />;
    case "pedido":
      return <QuickAddPedido obraId={obraId} onClose={onClose} onDone={onDone} />;
    case "material":
      return <QuickAddMaterial obraId={obraId} onClose={onClose} onDone={onDone} />;
    case "recibo":
      return <QuickAddRecibo onClose={onClose} onDone={onDone} />;
    case "rubro":
      return <QuickAddRubro onClose={onClose} onDone={onDone} />;
    case "proveedor":
      return <QuickAddProveedor obraId={obraId} onClose={onClose} onDone={onDone} />;
    case "equipo":
      return <QuickAddEquipo onClose={onClose} onDone={onDone} />;
    case "foto":
      return <UploadPhotosModal obraId={obraId} onClose={onClose} onDone={onDone} />;
    default:
      return <QuickAddGeneric key={kind} kind={kind} obraId={obraId} onClose={onClose} onDone={onDone} />;
  }
}
