"use client";

import { useState, useEffect, useCallback } from "react";
import { Car, Clock, TriangleExclamation, Plus, ArrowUp } from "@gravity-ui/icons";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import DButton from "@/components/ui/Button";
import { DStatTile, DPageHeader } from "@/app/[obraId]/dashboard/_components";
import { DashToast, useToast } from "@/app/[obraId]/dashboard/_components/useToast";
import { useDashboardData } from "@/app/[obraId]/dashboard/_components/DashboardDataContext";
import { getPedidos, createPedido, aprobarPedido, rechazarPedido, getObreros } from "@/services/pedidosService";
import { getRubrosDeObra } from "@/services/cronogramaService";
import type { NewPedidoPayload, ObreroLite } from "@/services/pedidosService";
import type { PedidoItem } from "../data";
import { STATE_MAP, FILTERS, fmtCurrency } from "../data";
import { OrderDrawer } from "./OrderDrawer";
import { NewOrderModal } from "./NewOrderModal";
import { DeliveryModal } from "./DeliveryModal";

export function ScreenPedidos() {
  const { obraId } = useDashboardData();
  const [orders, setOrders] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<PedidoItem | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [deliverFor, setDeliverFor] = useState<PedidoItem | null>(null);
  const [members, setMembers] = useState<ObreroLite[]>([]);
  const [rubros, setRubros] = useState<string[]>([]);
  const [toast, flash] = useToast();

  const load = useCallback(() => {
    return getPedidos(obraId).then(setOrders);
  }, [obraId]);

  useEffect(() => {
    load()
      .then(() => setLoading(false))
      .catch(() => { setLoading(false); flash("No se pudieron cargar los pedidos"); });
    getObreros(obraId).then(setMembers).catch(() => {});
    getRubrosDeObra(obraId)
      .then((r) => setRubros(r.map((x) => x.nombre)))
      .catch(() => {});
  }, [load, obraId, flash]);

  const filtered = orders.filter((o) => {
    if (filter === "Todos") return true;
    const map: Record<string, string> = { "Por aprobar": "pending", "En camino": "transit", Demorados: "late", Entregados: "delivered", Cancelados: "cancelled" };
    return o.state === map[filter];
  });

  const pendingCount = orders.filter((o) => o.state === "pending").length;
  const transitCount = orders.filter((o) => o.state === "transit").length;
  const lateCount = orders.filter((o) => o.state === "late").length;
  const monthTotal = orders
    .filter((o) => o.state === "delivered" || o.state === "approved" || o.state === "transit" || o.state === "pending" || o.state === "late")
    .reduce((s, o) => s + (o.total || 0), 0);

  const handleApprove = async () => {
    if (!selected) return;
    try {
      await aprobarPedido(selected.id);
      await load();
      setSelected(null);
      flash("Pedido aprobado");
    } catch {
      flash("No se pudo aprobar el pedido");
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    try {
      await rechazarPedido(selected.id);
      await load();
      setSelected(null);
      flash("Pedido cancelado");
    } catch {
      flash("No se pudo cancelar el pedido");
    }
  };

  const handleDeliverSave = (delivery: { date: string; time: string; loc: string; receiver: string; doc: string }) => {
    if (!deliverFor) return;
    const displayDate = `${delivery.date}${delivery.time ? ` · ${delivery.time}` : ""}`;
    setOrders((prev) => prev.map((o) => o.id === deliverFor.id ? { ...o, state: "delivered", delivery: { date: displayDate, loc: delivery.loc, receiver: delivery.receiver, doc: delivery.doc } } : o));
    setSelected((prev) => prev && prev.id === deliverFor.id ? { ...prev, state: "delivered", delivery: { date: displayDate, loc: delivery.loc, receiver: delivery.receiver, doc: delivery.doc } } : prev);
    setDeliverFor(null);
    flash("Entrega registrada");
  };

  const handleNewSave = async (payload: NewPedidoPayload) => {
    await createPedido(obraId, payload);
    setShowNew(false);
    await load();
    flash("Pedido creado");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500 text-[15px] font-semibold">Cargando...</div>;
  }

  return (
    <div>
      <DPageHeader title="Pedidos" subtitle="Materiales y órdenes de compra"
        right={<DButton icon={<Plus width={14} height={14} />} onClick={() => setShowNew(true)}>Nuevo pedido</DButton>} />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="attention" label="Por aprobar" value={String(pendingCount)} icon={<Clock width={16} height={16} />} />
        <DStatTile tone="info" label="En tránsito" value={String(transitCount)} icon={<Car width={16} height={16} />} />
        <DStatTile tone="critical" label="Demorados" value={String(lateCount)} icon={<TriangleExclamation width={16} height={16} />} />
        <DStatTile tone="primary" label="Total del mes" value={fmtCurrency(monthTotal)} icon={<ArrowUp width={16} height={16} />} />
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={"text-[12px] font-bold px-3 py-[6px] rounded-full border transition-colors " + (filter === f ? "bg-slate-950 text-white border-slate-950" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((order) => {
          const st = STATE_MAP[order.state] || STATE_MAP.draft;
          const isPending = order.state === "pending";
          return (
            <DCard key={order.id} padding="p-0" className="overflow-hidden">
              <div className="h-1" style={{ background: st.dot }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-[2px]">
                      <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate-500">{order.id}</span>
                      {order.urgent && <DPill tone="criticalSolid">Urgente</DPill>}
                    </div>
                    <h4 className="text-[14px] font-bold text-slate-950 leading-tight truncate">{order.mat}</h4>
                  </div>
                  <DPill tone={st.tone as any}>{st.label}</DPill>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] mb-3">
                  <div><span className="text-slate-500">Proveedor</span><span className="font-semibold text-slate-800 ml-1">{order.prov}</span></div>
                  <div><span className="text-slate-500">Categoría</span><span className="font-semibold text-slate-800 ml-1">{order.cat}</span></div>
                  <div><span className="text-slate-500">Cantidad</span><span className="font-semibold text-slate-800 ml-1">{order.qty}</span></div>
                  <div><span className="text-slate-500">Total</span><span className="font-semibold text-slate-800 ml-1">{fmtCurrency(order.total)}</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Llegada: <b className="text-slate-800">{order.date || "—"}</b></span>
                  </div>
                  <div className="flex gap-1">
                    {isPending && (
                      <>
                        <DButton size="sm" variant="primary" onClick={() => { setSelected(order); handleApprove(); }}>Aprobar</DButton>
                        <DButton size="sm" variant="outline" onClick={() => setSelected(order)}>Ver</DButton>
                      </>
                    )}
                    {!isPending && (
                      <DButton size="sm" variant="outline" onClick={() => setSelected(order)}>Ver</DButton>
                    )}
                  </div>
                </div>
              </div>
            </DCard>
          );
        })}
      </div>

      {selected && (
        <OrderDrawer
          order={selected}
          STATE={STATE_MAP}
          fmt={fmtCurrency}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onDeliver={() => { setDeliverFor(selected); setSelected(null); }}
        />
      )}

      {showNew && (
        <NewOrderModal
          onClose={() => setShowNew(false)}
          onSubmit={handleNewSave}
          members={members}
          rubros={rubros}
        />
      )}

      {deliverFor && (
        <DeliveryModal
          order={deliverFor}
          onClose={() => setDeliverFor(null)}
          onSave={handleDeliverSave}
        />
      )}

      <DashToast msg={toast} />
    </div>
  );
}
