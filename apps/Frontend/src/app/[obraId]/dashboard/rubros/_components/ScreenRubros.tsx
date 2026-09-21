"use client";

import { useEffect, useState } from "react";
import { Magnifier, Layers, ChartBar, Calendar, TriangleExclamation } from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { getRubros } from "@/services/mock/rubrosService";
import type { Rubro, CategoriaSeccion } from "../../configuracion/data/rubros";
import { formatARSCompact } from "@/lib/format";

export function ScreenRubros() {
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [categorias, setCategorias] = useState<CategoriaSeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    getRubros().then((d) => { setRubros(d.rubros); setCategorias(d.categorias); setLoading(false); });
  }, []);

  const query = q.trim().toLowerCase();
  const filtered = rubros.filter((r) => !query || r.name.toLowerCase().includes(query));

  if (loading) {
    return (
      <div>
        <div className="mb-5"><div className="shimmer h-7 w-52 rounded-md" /><div className="shimmer h-4 w-96 rounded-md mt-2" /></div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-4"><div className="shimmer h-4 w-40 rounded mb-2" /><div className="shimmer h-3 w-full rounded" /><div className="shimmer h-5 w-full rounded mt-3" /></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <DPageHeader
        title="Rubros de obra"
        subtitle="Estructura de costos y avance por rubro · la IA etiqueta gastos y tareas automáticamente"
        right={
          <div className="flex items-center gap-2 w-[240px] bg-white border border-slate-200 rounded-md px-3 py-[6px] text-[12px] text-slate-500 focus-within:border-primary transition-colors">
            <Magnifier width={14} height={14} className="text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar rubro…" className="w-full bg-transparent focus:outline-none" />
          </div>
        }
      />

      <div className="space-y-3 mb-5">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-10 text-[13px] border border-dashed border-slate-200 rounded-lg">No hay rubros con ese nombre.</div>
        ) : (
          filtered.map((r) => {
            const tPct = r.tasksTotal > 0 ? Math.round((r.tasksDone / r.tasksTotal) * 100) : 0;
            const mPct = r.budgetM > 0 ? Math.round((r.spentM / r.budgetM) * 100) : 0;
            const over = r.spentM > r.budgetM;
            return (
              <div key={r.name} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: r.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-950">{r.name}</div>
                    <div className="text-[11px] text-slate-500">{r.desc}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-[7px] py-[2px] rounded-full ${over ? "bg-critical-50 text-critical" : "bg-slate-100 text-slate-600"}`}>
                    {over ? "Sobre presupuesto" : `${mPct}% usado`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] tracking-wide uppercase font-bold text-slate-400">Tareas</span>
                      <span className="text-[11px] font-semibold text-slate-600">{r.tasksDone}/{r.tasksTotal}</span>
                    </div>
                    <div className="h-[5px] rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-info transition-all" style={{ width: `${tPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] tracking-wide uppercase font-bold text-slate-400">Presupuesto</span>
                      <span className={`text-[11px] font-semibold ${over ? "text-critical" : "text-slate-600"}`}>{formatARSCompact(r.spentM * 1_000_000)} de {formatARSCompact(r.budgetM * 1_000_000)}</span>
                    </div>
                    <div className="h-[5px] rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${over ? "bg-critical" : mPct >= 85 ? "bg-accent" : "bg-success"} transition-all`} style={{ width: `${Math.min(100, mPct)}%` }} />
                    </div>
                  </div>
                </div>

                {over && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700">
                    <TriangleExclamation width={13} height={13} /> Superó el tope en {formatARSCompact((r.spentM - r.budgetM) * 1_000_000)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1.5">
          <Layers width={12} height={12} /> Categorías de IA
        </div>
        <div className="grid grid-cols-2 gap-3">
          {categorias.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-slate-950">{c.label}</span>
                <span className="text-[10px] text-slate-400">{c.items.length} secciones</span>
              </div>
              <div className="space-y-2">
                {c.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center flex-none">{c.id === "tareas" ? <Calendar width={11} height={11} /> : <ChartBar width={11} height={11} />}</span>
                    <span className="text-[12px] text-slate-700 flex-1">{it.name}</span>
                    <span className="text-[11px] font-semibold text-slate-500">{it.itemCount} ítems</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}