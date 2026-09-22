"use client";

import { useState, useEffect, useCallback } from "react";
import { Car, CircleDollar, Clock, Plus, TriangleExclamation } from "@gravity-ui/icons";
import { DPill } from "@/components/ui/DPill";
import DButton from "@/components/ui/Button";
import { DStatTile, DPageHeader } from "@/app/[obraId]/dashboard/_components";
import { DashToast, useToast } from "@/app/[obraId]/dashboard/_components/useToast";
import { useDashboardData } from "@/app/[obraId]/dashboard/_components/DashboardDataContext";
import { getPedidos, createPedido, aprobarPedido, rechazarPedido, cambiarEstadoPedido, entregarPedido, getObreros } from "@/services/pedidosService";
import { getRubrosDeObra } from "@/services/cronogramaService";
import { getProveedores } from "@/services/proveedoresService";
import type { Proveedor } from "../../proveedores/data";
import type { NewPedidoPayload, ObreroLite } from "@/services/pedidosService";
import type { RubroOption } from "./NewOrderModal";
import type { PedidoItem } from "../data";
import { STATE_MAP, FILTERS } from "../data";
import { formatARS } from "@/lib/format";
import { OrderDrawer } from "./OrderDrawer";
import { NewOrderModal } from "./NewOrderModal";
import { DeliveryModal } from "./DeliveryModal";

const FILTER_MATCH: Record<string, (o: PedidoItem) => boolean> = {
  Todos: () => true,
  "Por aprobar": (o) => o.state === "pending",
  "En camino": (o) => o.state === "transit",
  Demorados: (o) => o.state === "late",
  Entregados: (o) => o.state === "delivered",
  Cancelados: (o) => o.state === "cancelled",
};

export function ScreenPedidos() {
  const { obraId } = useDashboardData();
  const [orders, setOrders] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<PedidoItem | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [deliverFor, setDeliverFor] = useState<PedidoItem | null>(null);
  const [members, setMembers] = useState<ObreroLite[]>([]);
  const [rubros, setRubros] = useState<RubroOption[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
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
      .then((r) => setRubros(r.map((x) => ({ id: x.id, nombre: x.nombre }))))
      .catch(() => {});
    getProveedores(obraId).then(setProveedores).catch(() => {});
  }, [load, obraId, flash]);

  const filtered = orders.filter(FILTER_MATCH[filter] || FILTER_MATCH.Todos);

  const pendingCount = orders.filter((o) => o.state === "pending").length;
  const transitCount = orders.filter((o) => o.state === "transit").length;
  const lateCount = orders.filter((o) => o.state === "late").length;
  const monthTotal = orders.reduce((s, o) => s + (o.total || 0), 0);

  const handleApprove = async (id: string) => {
    try {
      await aprobarPedido(id);
      await load();
      setSelected(null);
      flash("Pedido aprobado");
    } catch {
      flash("No se pudo aprobar el pedido");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await rechazarPedido(id);
      await load();
      setSelected(null);
      flash("Pedido cancelado");
    } catch {
      flash("No se pudo cancelar el pedido");
    }
  };

  const handleChangeState = async (id: string, estado: "en_camino" | "demorado") => {
    try {
      await cambiarEstadoPedido(id, estado);
      await load();
      setSelected(null);
      flash(estado === "en_camino" ? "Pedido marcado en camino" : "Pedido marcado como demorado");
    } catch (e) {
      flash(e instanceof Error ? e.message : "No se pudo actualizar el pedido");
    }
  };

  // El modal muestra el error y sigue abierto si esto lanza
  const handleDeliverSave = async (delivery: { date: string; time: string; loc: string; receiver: string; doc: string }) => {
    if (!deliverFor) return;
    await entregarPedido(deliverFor.id, {
      fecha: delivery.date,
      hora: delivery.time,
      ubicacion: delivery.loc,
      recibido_por: delivery.receiver,
      documento: delivery.doc,
    });
    await load();
    setDeliverFor(null);
    flash("Entrega registrada y stock actualizado");
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
      <DPageHeader
        title="Pedidos de materiales"
        subtitle={`${orders.length} pedidos · ${pendingCount} esperan tu aprobación`}
        right={<DButton icon={<Plus width={14} height={14} />} onClick={() => setShowNew(true)}>Nuevo pedido</DButton>}
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile
          tone="attention"
          label="Por aprobar"
          value={String(pendingCount)}
          icon={<Clock width={16} height={16} />}
          delta={pendingCount ? "Requieren acción" : "Al día"}
          deltaTone={pendingCount ? "critical" : "success"}
          onClick={() => setFilter("Por aprobar")}
        />
        <DStatTile
          tone="info"
          label="En tránsito"
          value={String(transitCount)}
          icon={<Car width={16} height={16} />}
          onClick={() => setFilter("En camino")}
        />
        <DStatTile
          tone="critical"
          label="Demorados"
          value={String(lateCount)}
          icon={<TriangleExclamation width={16} height={16} />}
          onClick={() => setFilter("Demorados")}
        />
        <DStatTile
          tone="success"
          label="Total del mes"
          value={formatARS(monthTotal)}
          icon={<CircleDollar width={16} height={16} />}
        />
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 flex-wrap">
        {FILTERS.map((f) => {
          const on = filter === f;
          const n = orders.filter(FILTER_MATCH[f] || FILTER_MATCH.Todos).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors ${
                on ? "text-primary border-primary" : "text-slate-500 border-transparent hover:text-slate-700"
              }`}
            >
              {f}
              <span className={`text-[10px] font-bold px-[6px] py-[2px] rounded-full ${on ? "bg-primary-50 text-primary" : "bg-slate-100 text-slate-700"}`}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((o) => {
          const st = STATE_MAP[o.state] || STATE_MAP.draft;
          return (
            <div
              key={o.id}
              onClick={() => setSelected(o)}
              className="text-left bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-primary hover:shadow-card2 transition-all group flex flex-col self-start w-full cursor-pointer"
            >
              <div className="h-[3px] w-full" style={{ background: st.dot }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-[2px]">
                      <span className="text-[10px] font-bold text-slate-400 tnum">{o.id.slice(0, 8)}</span>
                      {o.urgent && <DPill tone="criticalSolid">URGENTE</DPill>}
                    </div>
                    <div className="text-[15px] font-extrabold text-slate-950 leading-tight group-hover:text-primary transition-colors">
                      {o.mat || "Sin material"}
                    </div>
                  </div>
                  <span className="flex-none self-start">
                    <DPill tone={st.tone}>{st.label}</DPill>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[12px] text-slate-600 mb-3">
                  <Car width={13} height={13} className="text-slate-400" />
                  <span className="truncate">{o.prov || "Sin proveedor"}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">{o.cat || "Sin rubro"}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate-400">Cantidad</div>
                    <div className="text-[13px] font-bold text-slate-950 tnum">{o.qty || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate-400">Llegada</div>
                    <div className="text-[13px] font-bold text-slate-950">{o.date || "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate-400">Total</div>
                    <div className="text-[13px] font-extrabold text-slate-950 tnum">{formatARS(o.total)}</div>
                  </div>
                </div>

                {o.state === "pending" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => handleApprove(o.id)}>
                      Aprobar
                    </DButton>
                    <DButton variant="secondary" size="sm" onClick={() => setSelected(o)}>
                      Ver
                    </DButton>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center text-slate-500 py-12 text-[13px] border border-dashed border-slate-200 rounded-lg">
            No hay pedidos en este filtro.
          </div>
        )}
      </div>

      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onChangeState={handleChangeState}
          onDeliver={(id) => { setDeliverFor(orders.find((o) => o.id === id) || selected); setSelected(null); }}
          onComprobante={() => flash("Comprobante no disponible")}
        />
      )}

      {showNew && (
        <NewOrderModal
          obraId={obraId}
          onClose={() => setShowNew(false)}
          onSubmit={handleNewSave}
          members={members}
          rubros={rubros}
          proveedores={proveedores}
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
