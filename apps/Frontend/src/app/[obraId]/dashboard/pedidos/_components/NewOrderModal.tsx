"use client";

import { useMemo, useState } from "react";
import { Check, Plus, TriangleExclamation, Xmark } from "@gravity-ui/icons";
import type { NewPedidoPayload } from "@/services/pedidosService";
import type { ObreroLite } from "@/services/pedidosService";
import { createProveedor } from "@/services/proveedoresService";
import { createRubro } from "@/services/cronogramaService";
import { SupplierModal } from "../../_components/SupplierModal";
import { CategoryModal, type CategoryFormData } from "../../_components/CategoryModal";
import type { Proveedor } from "../../proveedores/data";
import { formatARS } from "@/lib/format";

export interface RubroOption {
  id: string;
  nombre: string;
}

export interface MaterialOption {
  id: string;
  name: string;
  unit: string;
  cost: number;
}

interface Props {
  obraId: string;
  onClose: () => void;
  onSubmit: (payload: NewPedidoPayload) => Promise<void>;
  members: ObreroLite[];
  rubros: RubroOption[];
  proveedores: Proveedor[];
  materiales: MaterialOption[];
}

export function NewOrderModal({ obraId, onClose, onSubmit, members, rubros, proveedores, materiales }: Props) {
  const [rubroList, setRubroList] = useState<RubroOption[]>(rubros);
  const [matId, setMatId] = useState("");
  const [provs, setProvs] = useState(proveedores);
  const [provId, setProvId] = useState("");
  const [showNewProv, setShowNewProv] = useState(false);
  const [rubroId, setRubroId] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [date, setDate] = useState("");
  const [who, setWho] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [note, setNote] = useState("");

  const [showNewCat, setShowNewCat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sortedRubros = useMemo(() => [...rubroList].sort((a, b) => a.nombre.localeCompare(b.nombre)), [rubroList]);
  const sortedProvs = useMemo(() => [...provs].sort((a, b) => a.name.localeCompare(b.name)), [provs]);
  const sortedMateriales = useMemo(() => [...materiales].sort((a, b) => a.name.localeCompare(b.name)), [materiales]);

  const material = sortedMateriales.find((m) => m.id === matId) || null;
  const precioUnitario = material?.cost ?? 0;
  const total = (Number(qty) || 0) * precioUnitario;

  const canSave = matId && qty > 0 && provId;

  const handleCreateRubro = async (cat: CategoryFormData) => {
    try {
      const nuevo = await createRubro(obraId, cat.name, 0, cat.desc || undefined);
      setRubroList((prev) => [...prev, nuevo]);
      setRubroId(nuevo.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el rubro");
    }
    setShowNewCat(false);
  };

  const submit = async () => {
    if (!canSave || saving) return;
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        proveedor_id: provId,
        items: [
          {
            material_id: matId,
            cantidad: qty,
          },
        ],
        rubro_id: rubroId || null,
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
            <select value={matId} onChange={(e) => setMatId(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
              <option value="">{sortedMateriales.length === 0 ? "Sin materiales cargados en stock" : "Elegí un material…"}</option>
              {sortedMateriales.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {sortedMateriales.length === 0 && (
              <span className="text-[10px] text-slate-500">Cargá el material desde Stock antes de pedirlo.</span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Proveedor*</span>
                <button type="button" onClick={() => setShowNewProv(true)}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]">
                  <Plus width={10} height={10} /> Nuevo proveedor
                </button>
              </div>
              <select value={provId} onChange={(e) => setProvId(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                <option value="">{sortedProvs.length === 0 ? "Sin proveedores cargados" : "Elegí un proveedor…"}</option>
                {sortedProvs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.scope === "obra" ? " (esta obra)" : ""}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Rubro</span>
                <button type="button" onClick={() => setShowNewCat(true)}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]">
                  <Plus width={10} height={10} /> Nuevo rubro
                </button>
              </div>
              <select value={rubroId} onChange={(e) => setRubroId(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                <option value="">{sortedRubros.length === 0 ? "Sin rubros" : "Sin rubro"}</option>
                {sortedRubros.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>

            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Cantidad{material?.unit ? ` (${material.unit})` : ""}</span>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="0"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
            </label>

            <div className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Precio unitario</span>
              <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-[9px] text-[13px] font-semibold text-slate-950 tnum">
                {material ? `${formatARS(precioUnitario)}${material.unit ? `/${material.unit}` : ""}` : "—"}
              </div>
              {material && precioUnitario === 0 && (
                <span className="text-[10px] font-semibold text-[#B91C1C]">El material no tiene costo cargado en Stock.</span>
              )}
            </div>

            <div className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Total</span>
              <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-[9px] text-[13px] font-extrabold text-slate-950 tnum">
                {formatARS(total)}
              </div>
            </div>

            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Llegada estimada</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>

            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Solicitó</span>
              <select value={who} onChange={(e) => setWho(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                <option value="">—</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Nota</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Observaciones adicionales…"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[60px]" />
          </label>

          <button type="button" onClick={() => setUrgent(!urgent)}
            className={`w-full flex items-center gap-3 rounded-lg border px-3 py-[10px] transition-colors text-left ${
              urgent ? "bg-critical-50 border-[#FECACA]" : "bg-white border-slate-200 hover:border-slate-300"
            }`}>
            <span className={`w-9 h-[22px] rounded-full p-[2px] flex-none transition-colors ${urgent ? "bg-critical" : "bg-slate-300"}`}>
              <span className={`block w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${urgent ? "translate-x-[16px]" : "translate-x-0"}`} />
            </span>
            <span className="flex-1 min-w-0">
              <span className={`block text-[13px] font-bold ${urgent ? "text-[#B91C1C]" : "text-slate-950"}`}>Pedido urgente</span>
              <span className="block text-[11px] text-slate-500">Se prioriza y notifica al director de obra.</span>
            </span>
            {urgent && <TriangleExclamation width={16} height={16} className="text-[#B91C1C]" />}
          </button>

          {error && <div className="text-[12px] font-semibold text-critical">{error}</div>}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave || saving}
            className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${
              canSave && !saving ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}>
            {saving ? "Creando…" : "Crear pedido"} {!saving && <Check width={14} height={14} />}
          </button>
        </div>
      </div>

      {showNewProv && (
        <SupplierModal
          initial={null}
          scope="obra"
          rubros={sortedRubros.map((r) => r.nombre)}
          onClose={() => setShowNewProv(false)}
          onSave={async (d) => {
            const nuevo = await createProveedor(obraId, "obra", d);
            setProvs((prev) => [...prev, nuevo]);
            setProvId(nuevo.id);
            setShowNewProv(false);
          }}
        />
      )}

      {showNewCat && (
        <CategoryModal
          open={showNewCat}
          initial={null}
          availableTasks={[]}
          onClose={() => setShowNewCat(false)}
          onSave={handleCreateRubro}
        />
      )}
    </div>
  );
}
