"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { Database, Box, Car, Plus, Magnifier, Xmark, Pencil, Comment, Envelope, Microphone, TrashBin } from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { DCard } from "@/components/ui/DCard";
import { DAvatar } from "@/components/ui/DAvatar";
import Button from "@/components/ui/Button";
import { DashToast, useToast } from "../../_components/useToast";
import { SupplierModal, type SupplierData } from "../../_components/SupplierModal";
import { getProveedores, createProveedor, updateProveedor, setFavorito, promoverProveedor, deleteProveedor } from "@/services/proveedoresService";
import { getPedidos } from "@/services/pedidosService";
import { getRubrosDeObra } from "@/services/cronogramaService";
import { RUBRO_COLORS, FALLBACK_RUBRO_COLOR } from "../../cronograma/data";
import { supInitials, type Proveedor } from "../data";
import type { PedidoItem } from "../../pedidos/data";

function Star({ on, onClick, size = 13 }: { on: boolean; onClick: (e: React.MouseEvent) => void; size?: number }) {
  return (
    <button onClick={onClick} className="p-1 -m-1 flex-none" title={on ? "Quitar de frecuentes" : "Marcar como frecuente"}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill={on ? "#F59E0B" : "none"} stroke={on ? "#F59E0B" : "#CBD5E1"} strokeWidth="2">
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    </button>
  );
}

export function ScreenProveedores() {
  const { obraId } = useParams<{ obraId: string }>();
  const router = useRouter();
  const [all, setAll] = useState<Proveedor[]>([]);
  const [orders, setOrders] = useState<PedidoItem[]>([]);
  const [rubros, setRubros] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"global" | "obra">("global");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ initial: SupplierData | null } | null>(null);
  const [toast, flash] = useToast();

const load = useCallback(() => getProveedores(obraId).then(setAll), [obraId]);

  useEffect(() => {
    let active = true;
    load()
      .then(() => { if (active) setLoading(false); })
      .catch(() => { if (active) { setLoading(false); flash("No se pudieron cargar los proveedores"); } });
    getPedidos(obraId).then((rows) => { if (active) setOrders(rows); }).catch(() => {});
    getRubrosDeObra(obraId)
      .then((r) => { if (active) setRubros(r.map((x) => x.nombre)); })
      .catch(() => {});
    return () => { active = false; };
  }, [obraId, load, flash]);

  const globals = all.filter((p) => p.scope === "global");
  const privates = all.filter((p) => p.scope === "obra");
  const inScope = scope === "global" ? globals : privates;

  const shown = inScope.filter((p) => !q || (p.name + " " + p.contact + " " + p.rubro + " " + p.desc).toLowerCase().includes(q.toLowerCase()));
  const favs = shown.filter((p) => p.fav);
  const rest = shown.filter((p) => !p.fav);

  const byRubro = rest.reduce<Record<string, Proveedor[]>>((a, p) => {
    (a[p.rubro] = a[p.rubro] || []).push(p);
    return a;
  }, {});

  const current = sel ? all.find((x) => x.id === sel) || null : null;
  const ordersOf = (id: string) => orders.filter((o) => o.provId === id);

  const toggleFav = async (id: string, cur: boolean) => {
    setAll((prev) => prev.map((p) => (p.id === id ? { ...p, fav: !cur } : p)));
    try {
      await setFavorito(id, !cur);
      flash(cur ? "Quitado de frecuentes" : "Agregado a frecuentes");
    } catch (e) {
      setAll((prev) => prev.map((p) => (p.id === id ? { ...p, fav: cur } : p)));
      flash(e instanceof Error ? e.message : "No se pudo actualizar el favorito");
    }
  };

  // El modal muestra el error y sigue abierto si esto lanza
  const save = async (d: SupplierData) => {
    if (d.id) {
      const actualizado = await updateProveedor(d.id, d);
      setAll((prev) => prev.map((p) => (p.id === d.id ? actualizado : p)));
      flash("Proveedor actualizado");
    } else {
      const nuevo = await createProveedor(obraId, scope, d);
      setAll((prev) => [nuevo, ...prev]);
      setSel(nuevo.id);
      flash(scope === "global" ? "Agregado al catálogo de la empresa" : "Agregado a esta obra");
    }
    setEdit(null);
  };

  const promote = async (p: Proveedor) => {
    try {
      await promoverProveedor(p.id);
      setAll((prev) => prev.map((x) => (x.id === p.id ? { ...x, scope: "global" } : x)));
      setScope("global");
      flash("Agregado al catálogo de la empresa");
    } catch (e) {
      flash(e instanceof Error ? e.message : "No se pudo promover el proveedor");
    }
  };

  const remove = async (p: Proveedor) => {
    try {
      await deleteProveedor(p.id);
      setAll((prev) => prev.filter((x) => x.id !== p.id));
      setSel(null);
      flash("Proveedor eliminado");
    } catch (e) {
      flash(e instanceof Error ? e.message : "No se pudo eliminar el proveedor");
    }
  };

  const Row = (p: Proveedor) => {
    const on = sel === p.id;
    const color = RUBRO_COLORS[p.rubro] || FALLBACK_RUBRO_COLOR;
    return (
      <div
        key={p.id}
        className={"group flex items-center gap-2 pl-3 pr-2 py-[9px] border-l-[3px] cursor-pointer transition-colors " + (on ? "bg-primary-50/60 border-primary" : "border-transparent hover:bg-slate-50")}
        onClick={() => setSel(p.id)}
      >
        <Star on={p.fav} onClick={(e) => { e.stopPropagation(); toggleFav(p.id, p.fav); }} />
        <span className="w-8 h-8 rounded-md flex items-center justify-center flex-none font-extrabold text-[11px]"
          style={{ background: color + "22", color: color }}>
          {supInitials(p.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-bold text-slate-950 truncate leading-tight">{p.name}</div>
          <div className="text-[10px] text-slate-500 truncate">{p.contact || "Sin contacto"} · {p.rubro}</div>
        </div>
        {p.orders > 0 && <span className="text-[10px] font-bold text-slate-500 tnum flex-none">{p.orders} ped.</span>}
        {p.scope === "obra" && <span className="text-[9px] font-bold text-[#A16207] bg-attention-50 rounded px-[5px] py-[2px] flex-none">Esta obra</span>}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500 text-[15px] font-semibold">Cargando...</div>;
  }

  return (
    <>
      <DPageHeader
        title="Proveedores"
        subtitle={`${globals.length} de la obra · ${privates.length} en tu agenda privada`}
        right={<Button variant="primary" size="sm" icon={<Plus width={13} height={13} />} onClick={() => setEdit({ initial: null })}>Nuevo proveedor</Button>}
      />

      {/* Selector de ámbito — dos listas separadas, no un filtro más */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { id: "global" as const, ico: <Database width={16} height={16} />, t: "Catálogo de la empresa", s: "Compartidos entre todas las obras · los usa cualquier equipo", n: globals.length },
          { id: "obra" as const,   ico: <Box width={16} height={16} />,      t: "Solo esta obra",         s: "Conseguidos para esta obra · no aparecen en otras", n: privates.length },
        ].map((x) => {
          const on = scope === x.id;
          return (
            <button key={x.id} onClick={() => { setScope(x.id); setSel(null); }}
              className={"text-left rounded-lg border p-4 transition-all " + (on ? "bg-white border-primary ring-1 ring-primary/20 shadow-card" : "bg-slate-50/60 border-slate-200 hover:border-slate-300")}>
              <div className="flex items-start gap-3">
                <span className={"w-9 h-9 rounded-lg flex items-center justify-center flex-none " + (on ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-500")}>
                  {x.ico}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={"text-[14px] font-bold " + (on ? "text-slate-950" : "text-slate-700")}>{x.t}</span>
                    <span className={"text-[10px] font-bold tnum px-[6px] py-[2px] rounded-full " + (on ? "bg-primary-50 text-primary" : "bg-slate-200 text-slate-600")}>{x.n}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug mt-[3px]">{x.s}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lista + ficha fija (estructura propia de esta subsección) */}
      <div className="grid grid-cols-[320px_1fr] gap-3 items-start">
        {/* Columna izquierda: buscador + listado agrupado */}
        <DCard padding="p-0" className="overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2 py-[6px] text-[12px] text-slate-500 focus-within:border-primary transition-colors">
              <Magnifier width={13} height={13} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proveedor o rubro…"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-slate-950 placeholder:text-slate-400" />
              {q && <button onClick={() => setQ("")} className="text-slate-400 hover:text-slate-700 flex-none"><Xmark width={12} height={12} /></button>}
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            {favs.length > 0 && (
              <>
                <div className="px-3 py-[6px] bg-attention-50 flex items-center gap-[6px] sticky top-0 z-10">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-[#A16207]">Frecuentes</span>
                  <span className="text-[10px] font-bold text-[#A16207]/70 tnum ml-auto">{favs.length}</span>
                </div>
                {favs.map(Row)}
              </>
            )}

            {Object.entries(byRubro).map(([r, ps]) => (
              <Fragment key={r}>
                <div className="px-3 py-[6px] bg-slate-50 flex items-center gap-[6px] border-y border-slate-100">
                  <span className="w-[6px] h-[6px] rounded-full flex-none" style={{ background: RUBRO_COLORS[r] || FALLBACK_RUBRO_COLOR }} />
                  <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-600 truncate">{r}</span>
                  <span className="text-[10px] font-bold text-slate-400 tnum ml-auto">{ps.length}</span>
                </div>
                {ps.map(Row)}
              </Fragment>
            ))}

            {shown.length === 0 && (
              <div className="text-center py-12 px-5">
                <span className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  {q ? <Magnifier width={20} height={20} /> : <Car width={20} height={20} />}
                </span>
                {q ? (
                  <>
                    <div className="text-[13px] font-bold text-slate-700">Sin resultados</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Ningún proveedor coincide con “<b className="text-slate-700">{q}</b>”
                      {scope === "global" ? " en el catálogo." : " en esta obra."}
                    </div>
                    <button onClick={() => { setScope(scope === "global" ? "obra" : "global"); }}
                      className="text-[11px] font-bold text-primary hover:underline mt-3">
                      Buscar en {scope === "global" ? "esta obra" : "el catálogo"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-[13px] font-bold text-slate-700">
                      {scope === "obra" ? "Sin proveedores propios" : "Catálogo vacío"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {scope === "obra"
                        ? "Acá van los que conseguiste solo para esta obra, sin sumarlos al catálogo de la empresa."
                        : "Cargá los proveedores que usa la empresa en todas sus obras."}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-slate-200 bg-slate-50">
            <button onClick={() => setEdit({ initial: null })}
              className="w-full flex items-center justify-center gap-2 text-[12px] font-bold text-primary py-[7px] rounded-md hover:bg-primary-50 transition-colors">
              <Plus width={12} height={12} /> Agregar {scope === "global" ? "al catálogo" : "a esta obra"}
            </button>
          </div>
        </DCard>

        {/* Columna derecha: ficha */}
        {!current ? (
          <DCard className="py-16 text-center">
            <span className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3"><Car width={24} height={24} /></span>
            <div className="text-[14px] font-bold text-slate-700">Elegí un proveedor</div>
            <div className="text-[12px] text-slate-500 mt-1 max-w-[340px] mx-auto leading-snug">
              Vas a ver sus contactos, condiciones comerciales y los pedidos que le hiciste en esta obra.
            </div>
          </DCard>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Encabezado de la ficha */}
            <DCard padding="p-0" className="overflow-hidden">
              <div className="h-[3px] w-full" style={{ background: RUBRO_COLORS[current.rubro] || FALLBACK_RUBRO_COLOR }} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <span className="w-14 h-14 rounded-xl flex items-center justify-center flex-none font-extrabold text-[18px]"
                    style={{ background: (RUBRO_COLORS[current.rubro] || FALLBACK_RUBRO_COLOR) + "22", color: RUBRO_COLORS[current.rubro] || "#64748B" }}>
                    {supInitials(current.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[20px] font-extrabold display-tight text-slate-950 leading-tight">{current.name}</h3>
                      <Star on={current.fav} onClick={() => toggleFav(current.id, current.fav)} size={16} />
                      {current.scope === "obra"
                        ? <span className="text-[9px] font-bold text-[#A16207] bg-attention-50 border border-[#FDE68A] rounded px-[6px] py-[2px]">SOLO ESTA OBRA</span>
                        : <span className="text-[9px] font-bold text-primary bg-primary-50 rounded px-[6px] py-[2px]">TODAS LAS OBRAS</span>}
                    </div>
                    <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-[6px]">
                      <span className="w-[6px] h-[6px] rounded-full flex-none" style={{ background: RUBRO_COLORS[current.rubro] || FALLBACK_RUBRO_COLOR }} />
                      {current.rubro}{current.cuit ? " · CUIT " + current.cuit : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-none">
                    <button onClick={() => setEdit({ initial: current })} className="text-slate-400 hover:text-primary p-2" title="Editar"><Pencil width={14} height={14} /></button>
                    <button onClick={() => { if (window.confirm(`¿Eliminar ${current.name}? No vas a poder deshacerlo desde acá.`)) remove(current); }}
                      className="text-slate-400 hover:text-critical p-2" title="Eliminar"><TrashBin width={14} height={14} /></button>
                  </div>
                </div>

                {/* Contacto directo */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {current.wa && (
                    <a href={"https://wa.me/" + current.wa.replace(/\D/g, "")} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-[6px] text-[12px] font-bold text-white bg-[#25D366] hover:brightness-95 rounded-md px-3 py-[8px] transition-all">
                      <Comment width={13} height={13} /> WhatsApp</a>
                  )}
                  {current.email && (
                    <a href={"mailto:" + current.email}
                      className="inline-flex items-center gap-[6px] text-[12px] font-bold text-slate-700 bg-white border border-slate-200 hover:border-primary rounded-md px-3 py-[8px] transition-colors">
                      <Envelope width={13} height={13} /> Email</a>
                  )}
                  {current.phone && (
                    <a href={"tel:" + current.phone.replace(/\s/g, "")}
                      className="inline-flex items-center gap-[6px] text-[12px] font-bold text-slate-700 bg-white border border-slate-200 hover:border-primary rounded-md px-3 py-[8px] transition-colors">
                      <Microphone width={13} height={13} /> Llamar</a>
                  )}
                  <div className="flex-1" />
                  {current.scope === "obra" && (
                    <Button variant="secondary" size="sm" icon={<Database width={12} height={12} />} onClick={() => promote(current)}>Sumar al catálogo</Button>
                  )}
                </div>
              </div>
            </DCard>

            {/* Datos en dos columnas */}
            <div className="grid grid-cols-2 gap-3 items-start">
              <DCard padding="p-0">
                <div className="px-4 py-3 border-b border-slate-200 text-[13px] font-bold">Contacto</div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                    <DAvatar initials={(current.contact || "?").split(" ").map((w) => w[0]).join("").slice(0, 2)} size={34} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-slate-950 truncate">{current.contact || "Sin contacto"}</div>
                      <div className="text-[11px] text-slate-500">{current.role || "—"}</div>
                    </div>
                  </div>
                  <div className="space-y-[7px]">
                    {([["WhatsApp", current.wa], ["Teléfono", current.phone], ["Email", current.email], ["Web", current.web], ["Dirección", current.address]] as const).map(([l, v]) => (
                      <div key={l} className="grid grid-cols-[76px_1fr] gap-2 text-[11px]">
                        <span className="text-slate-500">{l}</span>
                        <span className={"truncate " + (v ? "font-semibold text-slate-900" : "text-slate-300")}>{v || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </DCard>

              <DCard padding="p-0">
                <div className="px-4 py-3 border-b border-slate-200 text-[13px] font-bold">Condiciones</div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-slate-100">
                    {([["Pago", current.pay], ["Entrega", current.lead]] as const).map(([l, v]) => (
                      <div key={l}>
                        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">{l}</div>
                        <div className="text-[13px] font-bold text-slate-950">{v || "—"}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">Qué provee</div>
                  <p className="text-[12px] text-slate-700 leading-relaxed">{current.desc || <span className="italic text-slate-400">Sin descripción.</span>}</p>
                </div>
              </DCard>
            </div>

            {/* Pedidos */}
            <DCard padding="p-0">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="text-[13px] font-bold">Pedidos en esta obra</div>
                <button onClick={() => router.replace(`/${obraId}/dashboard/materiales?v=pedidos`)} className="text-[11px] font-bold text-primary hover:underline">Ver todos →</button>
              </div>
              {ordersOf(current.id).length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-[12px] text-slate-500 mb-3">Todavía no le hiciste pedidos a este proveedor.</div>
                  <Button variant="secondary" size="sm" icon={<Plus width={12} height={12} />} onClick={() => router.replace(`/${obraId}/dashboard/materiales?v=pedidos`)}>Crear un pedido</Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {ordersOf(current.id).map((o) => (
                    <div key={o.id} className="flex items-center gap-3 px-4 py-[10px]">
                      <span className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center flex-none"><Box width={13} height={13} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-slate-950 truncate">{o.mat}</div>
                        <div className="text-[10px] text-slate-500">{o.qty} · llega {o.date}</div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 tnum flex-none">{o.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </DCard>
          </div>
        )}
      </div>

      {edit && (
        <SupplierModal
          initial={edit.initial}
          scope={scope}
          rubros={rubros}
          onClose={() => setEdit(null)}
          onSave={save}
        />
      )}

      <DashToast msg={toast} />
    </>
  );
}
