"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, FileArrowDown, Check } from "@gravity-ui/icons";
import { getRecibos } from "@/services/mock/recibosService";
import type { ReciboItem } from "@/app/[obraId]/dashboard/recibos/data";
import { CATEGORIES, FILTERS } from "@/app/[obraId]/dashboard/recibos/data";
import { formatARS, formatDateShort } from "@/lib/format";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import { DPageHeader } from "@/app/[obraId]/dashboard/_components/DPageHeader";
import { DStatTile } from "@/app/[obraId]/dashboard/_components/DStatTile";
import { useToast, DashToast } from "@/app/[obraId]/dashboard/_components/useToast";
import { ReceiptModal } from "./ReceiptModal";
import type { ReceiptModalData } from "./ReceiptModal";

const CAT_TO_TONE: Record<string, string> = {
  Materiales: "primary",
  "Mano de obra": "success",
  Equipos: "info",
  Logística: "attention",
  Servicios: "slate",
};

export function ScreenRecibos() {
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<ReciboItem[]>([]);
  const [filter, setFilter] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [toast, flash] = useToast();

  useEffect(() => {
    getRecibos().then((data) => {
      setReceipts(data.receipts);
      setLoading(false);
    });
  }, []);

  const filteredReceipts = useMemo(() => {
    if (filter === "Todos") return receipts;
    if (filter === "Pendientes") return receipts.filter((r) => r.status === "pendiente");
    return receipts.filter((r) => r.cat === filter);
  }, [receipts, filter]);

  const totalMes = useMemo(() =>
    receipts.reduce((s, r) => s + r.amount, 0),
  [receipts]);

  const pendingTotal = useMemo(() =>
    receipts.filter((r) => r.status === "pendiente").reduce((s, r) => s + r.amount, 0),
  [receipts]);

  const paidCount = useMemo(() =>
    receipts.filter((r) => r.status === "pagado").length,
  [receipts]);

  const toggleStatus = (id: string) => {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "pagado" ? "pendiente" : "pagado" } : r
      )
    );
  };

  const handleSave = (data: ReceiptModalData) => {
    const newReceipt: ReciboItem = {
      id: "r" + Date.now().toString(36),
      concept: data.concept,
      prov: data.provider,
      cat: data.category,
      date: data.date,
      amount: data.amount,
      status: data.paid ? "pagado" : "pendiente",
      file: data.file,
    };
    setReceipts((prev) => [newReceipt, ...prev]);
    setShowModal(false);
    flash("Recibo cargado correctamente");
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
        {FILTERS.map((f) => (
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
                      <div className="text-[11px] text-slate-400">{r.file}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.prov}</td>
                <td className="px-4 py-3">
                  <DPill tone={(CAT_TO_TONE[r.cat] || "slate") as "slate"}>{r.cat}</DPill>
                </td>
                <td className="px-4 py-3 text-slate-500 tnum">{formatDateShort(r.date)}</td>
                <td className="px-4 py-3 text-right font-bold tnum text-slate-900">{formatARS(r.amount)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(r.id)}>
                    <DPill tone={r.status === "pagado" ? "successSolid" : "attentionSolid"}>
                      {r.status === "pagado" ? "PAGADO" : "PENDIENTE"}
                    </DPill>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button className="text-slate-400 hover:text-primary transition-colors">
                    <FileArrowDown width={15} height={15} />
                  </button>
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

      {showModal && (
        <ReceiptModal cats={CATEGORIES} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
      <DashToast msg={toast} />
    </div>
  );
}
