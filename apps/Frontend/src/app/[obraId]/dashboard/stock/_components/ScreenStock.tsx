"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, LayoutCells, ListUl, Minus, CirclePlus, Camera, Pencil, FolderPlus } from "@gravity-ui/icons";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import DButton from "@/components/ui/Button";
import { DStatTile, DPageHeader } from "@/app/[obraId]/dashboard/_components";
import { DashToast, useToast } from "@/app/[obraId]/dashboard/_components/useToast";
import { useDashboardData } from "@/app/[obraId]/dashboard/_components/DashboardDataContext";
import { getStock, createMaterial, updateMaterial, ajustarStock, deleteMaterial, createCategoria } from "@/services/stockService";
import type { StockItem } from "../data";
import { getStatus, STAT_LABELS, catColor } from "../data";
import { StockItemModal } from "./StockItemModal";
import { NewCategoryModal } from "./NewCategoryModal";

export function ScreenStock() {
  const { obraId } = useDashboardData();
  const [items, setItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("Todas");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [toast, flash] = useToast();

  const load = useCallback(async () => {
    const d = await getStock(obraId);
    setItems(d.items);
    setCategories(d.categories);
  }, [obraId]);

  useEffect(() => {
    load()
      .then(() => setLoading(false))
      .catch(() => { setLoading(false); flash("No se pudo cargar el stock"); });
  }, [load, flash]);

  const filtered = catFilter === "Todas" ? items : items.filter((i) => i.cat === catFilter);

  const total = items.length;
  const ok = items.filter((i) => getStatus(i) === "ok").length;
  const low = items.filter((i) => getStatus(i) === "low").length;
  const out = items.filter((i) => getStatus(i) === "out").length;

  // Optimista: el Backend registra el movimiento; si falla se recarga el estado real
  const adjust = async (id: string, delta: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i));
    try {
      await ajustarStock(id, delta);
    } catch (e) {
      flash(e instanceof Error ? e.message : "No se pudo ajustar el stock");
      load().catch(() => {});
    }
  };

  // El modal muestra el error y sigue abierto si esto lanza
  const handleSave = async (item: StockItem, photo: File | null) => {
    const isNew = !editItem;
    try {
      if (isNew) await createMaterial(obraId, item, photo);
      else await updateMaterial(item, photo);
    } catch (e) {
      // Si el material ya quedó guardado (falló solo la foto), reflejarlo igual
      load().catch(() => {});
      throw e;
    }
    await load();
    setEditItem(null);
    setShowAdd(false);
    flash(isNew ? "Material agregado" : "Material actualizado");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMaterial(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      flash("Material eliminado");
    } catch (e) {
      flash(e instanceof Error ? e.message : "No se pudo eliminar el material");
    }
  };

  const handleAddCat = async (name: string) => {
    const created = await createCategoria(obraId, name);
    setCategories((prev) => [...prev, created].sort((a, b) => a.localeCompare(b)));
    setShowNewCat(false);
    flash("Categoría creada");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500 text-[15px] font-semibold">Cargando...</div>;
  }

  return (
    <div>
      <DPageHeader title="Stock" subtitle="Inventario de materiales"
        right={
          <div className="flex gap-2">
            <DButton variant="outline" icon={<FolderPlus width={14} height={14} />} onClick={() => setShowNewCat(true)}>Nueva categoría</DButton>
            <DButton icon={<Plus width={14} height={14} />} onClick={() => setShowAdd(true)}>Agregar material</DButton>
          </div>
        } />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="primary" label="Materiales" value={String(total)} icon={<Camera width={16} height={16} />} />
        <DStatTile tone="success" label="En nivel" value={String(ok)} icon={<CirclePlus width={16} height={16} />} />
        <DStatTile tone="attention" label="Bajo mínimo" value={String(low)} icon={<Minus width={16} height={16} />} />
        <DStatTile tone="critical" label="Sin stock" value={String(out)} icon={<Minus width={16} height={16} />} />
      </div>

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-1 flex-wrap flex-1">
          <button onClick={() => setCatFilter("Todas")}
            className={"text-[12px] font-bold px-3 py-[6px] rounded-full border transition-colors " + (catFilter === "Todas" ? "bg-slate-950 text-white border-slate-950" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}>
            Todas
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={"text-[12px] font-bold px-3 py-[6px] rounded-full border transition-colors " + (catFilter === c ? "bg-slate-950 text-white border-slate-950" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-none">
          <button onClick={() => setView("grid")}
            className={"w-8 h-8 rounded-md flex items-center justify-center " + (view === "grid" ? "bg-slate-200 text-slate-950" : "text-slate-400 hover:text-slate-600")}>
            <LayoutCells width={16} height={16} />
          </button>
          <button onClick={() => setView("list")}
            className={"w-8 h-8 rounded-md flex items-center justify-center " + (view === "list" ? "bg-slate-200 text-slate-950" : "text-slate-400 hover:text-slate-600")}>
            <ListUl width={16} height={16} />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((item) => {
            const st = getStatus(item);
            const sl = STAT_LABELS[st];
            const pct = item.min > 0 ? Math.round((item.qty / item.min) * 100) : 100;
            return (
              <DCard key={item.id} padding="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-none">
                    {item.photo ? (
                      <img src={item.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Camera width={18} height={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-[2px]">
                      <span className="w-2 h-2 rounded-full flex-none" style={{ background: catColor(item.cat) }} />
                      <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate-500 truncate">{item.cat || "Sin categoría"}</span>
                    </div>
                    <h4 className="text-[13px] font-bold text-slate-950 leading-tight truncate">{item.name}</h4>
                    <div className="text-[11px] text-slate-500">{item.loc || "Sin ubicación"}</div>
                  </div>
                  <DPill tone={sl.tone as any}>{sl.label}</DPill>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[22px] font-extrabold display-tight tnum text-slate-950">{item.qty}</span>
                  <span className="text-[12px] font-semibold text-slate-500">{item.unit}</span>
                </div>
                <div className="h-[6px] bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all" style={{ width: Math.min(pct, 100) + "%", background: sl.dot }} />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => adjust(item.id, -1)} disabled={item.qty <= 0}
                    className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-950 disabled:opacity-40 disabled:pointer-events-none">
                    <Minus width={12} height={12} />
                  </button>
                  <span className="text-[13px] font-bold tnum text-slate-950 w-[32px] text-center">{item.qty}</span>
                  <button onClick={() => adjust(item.id, 1)}
                    className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-950">
                    <Plus width={12} height={12} />
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => setEditItem(item)}
                    className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-950">
                    <Pencil width={12} height={12} />
                  </button>
                </div>
              </DCard>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-bold text-slate-600 tracking-[0.04em] uppercase">Material</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 tracking-[0.04em] uppercase">Categoría</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 tracking-[0.04em] uppercase">Ubicación</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 tracking-[0.04em] uppercase">Disponible</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 tracking-[0.04em] uppercase">Estado</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 tracking-[0.04em] uppercase">Ajustar</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 tracking-[0.04em] uppercase">Editar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const st = getStatus(item);
                const sl = STAT_LABELS[st];
                return (
                  <tr key={item.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-none">
                          {item.photo ? (
                            <img src={item.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Camera width={14} height={14} className="text-slate-400" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-950">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full flex-none" style={{ background: catColor(item.cat) }} />
                        {item.cat || "Sin categoría"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.loc || "—"}</td>
                    <td className="px-4 py-3 text-center font-bold tnum">{item.qty} <span className="font-normal text-slate-500">{item.unit}</span></td>
                    <td className="px-4 py-3 text-center"><DPill tone={sl.tone as any}>{sl.label}</DPill></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => adjust(item.id, -1)} disabled={item.qty <= 0}
                          className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none">
                          <Minus width={12} height={12} />
                        </button>
                        <span className="text-[13px] font-bold tnum w-[32px] text-center">{item.qty}</span>
                        <button onClick={() => adjust(item.id, 1)}
                          className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                          <Plus width={12} height={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setEditItem(item)}
                        className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-950 mx-auto">
                        <Pencil width={12} height={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(editItem || showAdd) && (
        <StockItemModal
          item={showAdd ? null : editItem}
          cats={categories}
          catColor={catColor}
          onClose={() => { setEditItem(null); setShowAdd(false); }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {showNewCat && (
        <NewCategoryModal
          existing={categories}
          onClose={() => setShowNewCat(false)}
          onSave={handleAddCat}
        />
      )}

      <DashToast msg={toast} />
    </div>
  );
}
