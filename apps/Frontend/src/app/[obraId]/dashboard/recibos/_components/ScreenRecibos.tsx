"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, FileArrowDown, FileArrowUp, Check } from "@gravity-ui/icons";
import { getRecibos, createRecibo, setEstadoPago, uploadArchivo } from "@/services/recibosService";
import type { NuevoRecibo } from "@/services/recibosService";
import { getRubrosDeObra } from "@/services/cronogramaService";
import type { ReciboItem } from "@/app/[obraId]/dashboard/recibos/data";
import { CATEGORIES, ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from "@/app/[obraId]/dashboard/recibos/data";
import { useDashboardData } from "@/app/[obraId]/dashboard/_components/DashboardDataContext";
import { formatARS, formatDateShort, formatNumber, todayISO } from "@/lib/format";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import { DPageHeader } from "@/app/[obraId]/dashboard/_components/DPageHeader";
import { DStatTile } from "@/app/[obraId]/dashboard/_components/DStatTile";
import { useToast, DashToast } from "@/app/[obraId]/dashboard/_components/useToast";
import { ReceiptModal } from "./ReceiptModal";

function formatMonto(amount: number, currency: string): string {
  return currency === "USD" ? `US$ ${formatNumber(amount, 2)}` : formatARS(amount);
}

const CAT_TO_TONE: Record<string, string> = {
  Materiales: "primary",
  "Mano de obra": "success",
  Equipos: "info",
  Logística: "attention",
  Servicios: "slate",
};

export function ScreenRecibos() {
  const { obraId } = useDashboardData();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<ReciboItem[]>([]);
  const [rubros, setRubros] = useState<{ id: string; nombre: string }[]>([]);
  const [filter, setFilter] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [attachFor, setAttachFor] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, flash] = useToast();

  useEffect(() => {
    if (!obraId) return;
    let cancelled = false;
    getRecibos(obraId)
      .then((rows) => { if (!cancelled) setReceipts(rows); })
      .catch(() => { if (!cancelled) flash("No se pudieron cargar los recibos"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    getRubrosDeObra(obraId)
      .then((r) => { if (!cancelled) setRubros(r); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [obraId, flash]);

  // Categorías fijas + las que traen los datos (gastos del bot caen en el nombre del rubro)
  const filters = useMemo(() => {
    const cats = [...CATEGORIES];
    for (const r of receipts) if (r.cat && !cats.includes(r.cat)) cats.push(r.cat);
    return ["Todos", "Pendientes", ...cats];
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    if (filter === "Todos") return receipts;
    if (filter === "Pendientes") return receipts.filter((r) => r.status === "pendiente");
    return receipts.filter((r) => r.cat === filter);
  }, [receipts, filter]);

  // Los KPIs suman solo pesos (los recibos en USD se ven en la tabla con su moneda)
  const totalMes = useMemo(() => {
    const mes = todayISO().slice(0, 7);
    return receipts
      .filter((r) => r.currency === "ARS" && r.date.startsWith(mes))
      .reduce((s, r) => s + r.amount, 0);
  }, [receipts]);

  const pendingTotal = useMemo(() =>
    receipts.filter((r) => r.status === "pendiente" && r.currency === "ARS").reduce((s, r) => s + r.amount, 0),
  [receipts]);

  const paidCount = useMemo(() =>
    receipts.filter((r) => r.status === "pagado").length,
  [receipts]);

  // Optimista: si el Backend rechaza, se vuelve al estado anterior
  const toggleStatus = async (r: ReciboItem) => {
    const next = r.status === "pagado" ? "pendiente" : "pagado";
    setReceipts((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
    try {
      await setEstadoPago(r.id, next);
    } catch (e) {
      setReceipts((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: r.status } : x)));
      flash(e instanceof Error ? e.message : "No se pudo actualizar el estado");
    }
  };

  const reload = () => getRecibos(obraId).then(setReceipts).catch(() => {});

  const handleSave = async (data: NuevoRecibo, file: File | null) => {
    try {
      const nuevo = await createRecibo(obraId, data, file);
      setReceipts((prev) => [nuevo, ...prev]);
    } catch (e) {
      // Si falló solo el archivo, el recibo ya existe: refrescar igual
      reload();
      throw e;
    }
    setShowModal(false);
    flash("Recibo cargado correctamente");
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    const id = attachFor;
    e.target.value = "";
    setAttachFor(null);
    if (!f || !id) return;
    if (!ACCEPTED_FILE_TYPES.includes(f.type) || f.size > MAX_FILE_BYTES) {
      flash("El archivo debe ser PDF, JPG, PNG o WebP de hasta 10 MB");
      return;
    }
    try {
      const actualizado = await uploadArchivo(id, f);
      setReceipts((prev) => prev.map((x) => (x.id === id ? actualizado : x)));
      flash("Archivo adjuntado");
    } catch (err) {
      flash(err instanceof Error ? err.message : "No se pudo subir el archivo");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[13px]">
        Cargando recibos…
      </div>
    );
  }

  return (
    <div>
      <DPageHeader
        title="Recibos y comprobantes"
        right={
          <Button size="sm" icon={<Plus width={16} height={16} />} onClick={() => setShowModal(true)}>
            Cargar recibo
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <DStatTile
          tone="primary"
          label="Total del mes"
          value={formatARS(totalMes)}
          icon={<Check width={16} height={16} />}
        />
        <DStatTile
          tone="attention"
          label="Pendiente de pago"
          value={formatARS(pendingTotal)}
          icon={<Check width={16} height={16} />}
        />
        <DStatTile
          tone="success"
          label="Pagados"
          value={String(paidCount)}
          suffix="recibos"
          icon={<Check width={16} height={16} />}
        />
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-[7px] rounded-lg text-[12px] font-bold transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <DCard padding="p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.06em] border-b border-slate-200">
              <th className="px-4 py-3">Comprobante</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReceipts.map((r) => (
              <tr key={r.id} className="text-[13px] hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileArrowDown width={14} height={14} className="text-primary flex-none" />
                    <div>
                      <div className="font-semibold text-slate-900">{r.concept}</div>
                      <div className="text-[11px] text-slate-400">{r.file || "Sin archivo"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.prov}</td>
                <td className="px-4 py-3">
                  <DPill tone={(CAT_TO_TONE[r.cat] || "slate") as "slate"}>{r.cat}</DPill>
                </td>
                <td className="px-4 py-3 text-slate-500 tnum">{r.date ? formatDateShort(r.date) : "—"}</td>
                <td className="px-4 py-3 text-right font-bold tnum text-slate-900">{formatMonto(r.amount, r.currency)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(r)} title="Cambiar estado de pago">
                    <DPill tone={r.status === "pagado" ? "successSolid" : "attentionSolid"}>
                      {r.status === "pagado" ? "PAGADO" : "PENDIENTE"}
                    </DPill>
                  </button>
                </td>
                <td className="px-4 py-3">
                  {r.fileUrl ? (
                    <a href={r.fileUrl} target="_blank" rel="noreferrer" title="Descargar comprobante"
                      className="text-slate-400 hover:text-primary transition-colors inline-flex">
                      <FileArrowDown width={15} height={15} />
                    </a>
                  ) : (
                    <button title="Adjuntar comprobante"
                      onClick={() => { setAttachFor(r.id); fileRef.current?.click(); }}
                      className="text-slate-400 hover:text-primary transition-colors">
                      <FileArrowUp width={15} height={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReceipts.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-[13px]">
            No hay recibos para mostrar
          </div>
        )}
      </DCard>

      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" hidden onChange={handleAttach} />

      {showModal && (
        <ReceiptModal cats={CATEGORIES} rubros={rubros} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
      <DashToast msg={toast} />
    </div>
  );
}
