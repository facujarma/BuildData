"use client";

import { useState, useEffect } from "react";
import { LayoutHeaderCellsLarge, FileArrowDown, Plus } from "@gravity-ui/icons";
import type { Obra } from "@/types/projects";
import { STATUS } from "@/types/projects";
import { getObras } from "@/services/projectsService";
import { formatWeekdayDate } from "@/lib/format";
import { DCard } from "@/components/ui/DCard";
import Button from "@/components/ui/Button";
import { WelcomeHero } from "./ObraWelcome";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { WorkspaceTopbar } from "./WorkspaceTopbar";
import { ObraCard } from "./ObraCard";
import { ObraRow } from "./ObraRow";
import { NuevaObraModal } from "./NuevaObraModal";
import { ProjectsSkeleton } from "./ProjectsSkeleton";

const FILTERS = [
  { id: "todas", label: "Todas", match: () => true },
  {
    id: "en-curso",
    label: "En curso",
    match: (o: any) => o.status === "en-curso",
  },
  {
    id: "planificacion",
    label: "Planificación",
    match: (o: any) => o.status === "planificacion",
  },
  {
    id: "pausada",
    label: "Pausadas",
    match: (o: any) => o.status === "pausada",
  },
  {
    id: "finalizada",
    label: "Finalizadas",
    match: (o: any) => o.status === "finalizada",
  },
];

function ListIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

export function ObrasHome({
  cover = "blueprint",
  mood = "focused",
  density = "regular",
}: {
  cover?: string;
  mood?: "focused" | "bright";
  density?: string;
}) {
  const [obras, setObras] = useState<Obra[]>([]);
  const [view, setView] = useState("grid");
  const [filter, setFilter] = useState("todas");
  const [sort, setSort] = useState("reciente");
  const [tab, setTab] = useState("obras");
  const [query, setQuery] = useState("");
  const [newObraOpen, setNewObraOpen] = useState(false);
  const [obrasLoading, setObrasLoading] = useState(true);

  useEffect(() => {
    getObras()
      .then(setObras)
      .finally(() => setObrasLoading(false));
  }, []);

  const activeFilter = FILTERS.find((f) => f.id === filter) || FILTERS[0];
  const filtered = obras
    .filter(activeFilter.match)
    .filter(
      (o) =>
        !query ||
        o.name.toLowerCase().includes(query.toLowerCase()) ||
        o.address.toLowerCase().includes(query.toLowerCase()),
    );

  const recientes = obras.filter((o) => o.status !== "finalizada").slice(0, 4);
  const totals = {
    activas: obras.filter((o) => o.status === "en-curso").length,
    alertas: obras.reduce((s, o) => s + o.alerts, 0),
    pedidos: obras.reduce((s, o) => s + o.pedidos, 0),
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dateLabel = formatWeekdayDate(new Date());

  if (obrasLoading) {
    return (
      <div className="obras-root flex bg-paper overflow-hidden" style={{ height: "100vh" }}>
        <WorkspaceSidebar current={tab} onNav={setTab} onNewObra={() => {}} mood={mood} />
        <div className="flex-1 min-w-0 flex flex-col">
          <WorkspaceTopbar query="" onQuery={() => {}} />
          <main className="flex-1 overflow-y-auto">
            <ProjectsSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      data-density={density}
      style={{ height: "100vh" }}
      className="obras-root flex bg-paper overflow-hidden"
    >
      <WorkspaceSidebar
        current={tab}
        onNav={setTab}
        onNewObra={() => setNewObraOpen(true)}
        mood={mood}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <WorkspaceTopbar query={query} onQuery={setQuery} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1240px] mx-auto px-8 py-8">
            <WelcomeHero
              greeting={greeting}
              dateLabel={dateLabel}
              totals={totals}
            />

            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="text-[11px] tracking-[0.08em] uppercase font-bold text-slate-500">
                Acceso rápido
              </div>
            </div>

            <section className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {recientes.map((o) => {
                  const s = STATUS[o.status];
                  return (
                    <a
                      key={o.id}
                      href={`/${o.id}/dashboard`}
                      className="group bg-white border border-slate-200 rounded-lg p-4 flex gap-3 hover:border-primary hover:shadow-card2 transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center flex-none"
                        style={{ background: o.color + "20" }}
                      >
                        <svg width="18" height="14" viewBox="0 0 60 40">
                          <rect
                            x="6"
                            y="22"
                            width="9"
                            height="14"
                            rx="1.5"
                            fill={o.color}
                            opacity="0.6"
                          />
                          <rect
                            x="20"
                            y="14"
                            width="9"
                            height="22"
                            rx="1.5"
                            fill={o.color}
                            opacity="0.85"
                          />
                          <rect
                            x="34"
                            y="4"
                            width="9"
                            height="32"
                            rx="1.5"
                            fill={o.color}
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-slate-950 truncate group-hover:text-primary">
                          {o.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {o.lastActivity} · {o.progress}%
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <span
                            className="w-[6px] h-[6px] rounded-full"
                            style={{ background: s.dot }}
                          />
                          <span className="text-[10px] font-bold text-slate-600">
                            {s.label}
                          </span>
                          {o.alerts > 0 && (
                            <span className="ml-auto text-[9px] font-bold bg-critical text-white px-[5px] py-[1px] rounded">
                              {o.alerts} ⚠
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div className="text-[11px] tracking-[0.08em] uppercase font-bold text-slate-500">
                  Todas tus obras · {filtered.length}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`text-[11px] font-bold px-3 py-[6px] rounded-full border transition-colors ${filter === f.id ? "bg-primary-50 text-primary border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="text-[11px] font-semibold bg-white border border-slate-200 rounded-md px-2 py-[6px] focus:outline-none focus:border-primary"
                  >
                    <option value="reciente">Más reciente</option>
                    <option value="nombre">Por nombre</option>
                    <option value="avance">Por avance</option>
                  </select>
                  <div className="flex bg-slate-100 rounded-md p-[2px]">
                    <button
                      onClick={() => setView("grid")}
                      className={`p-[6px] rounded ${view === "grid" ? "bg-white shadow-card text-slate-950" : "text-slate-500"}`}
                    >
                      <LayoutHeaderCellsLarge width={14} height={14} />
                    </button>
                    <button
                      onClick={() => setView("list")}
                      className={`p-[6px] rounded ${view === "list" ? "bg-white shadow-card text-slate-950" : "text-slate-500"}`}
                    >
                      <ListIcon />
                    </button>
                  </div>
                </div>
              </div>

              {view === "grid" ? (
                <div className="obras-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((o) => (
                    <ObraCard key={o.id} obra={o} cover={cover} />
                  ))}
                </div>
              ) : (
                <DCard padding="p-0" className="overflow-hidden">
                  <div className="grid grid-cols-[40px_1fr_140px_120px_180px_100px_24px] items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-200 text-[9px] tracking-[0.06em] uppercase font-bold text-slate-500">
                    <div></div>
                    <div>Nombre</div>
                    <div>Estado</div>
                    <div>Avance</div>
                    <div>Última actividad</div>
                    <div className="text-right">Equipo</div>
                    <div></div>
                  </div>
                  {filtered.map((o) => (
                    <ObraRow key={o.id} obra={o} />
                  ))}
                </DCard>
              )}

              {filtered.length === 0 && (
                <div className="text-center text-slate-500 py-12 text-[13px] border border-dashed border-slate-200 rounded-lg">
                  No hay obras que coincidan con tu búsqueda.
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <NuevaObraModal
        open={newObraOpen}
        onClose={() => setNewObraOpen(false)}
      />
    </div>
  );
}
