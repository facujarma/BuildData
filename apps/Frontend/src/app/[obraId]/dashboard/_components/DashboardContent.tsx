"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChartBar,
  CircleExclamation,
  Box,
  Check,
  FileArrowDown,
  Plus,
} from "@gravity-ui/icons";
import { DPageHeader } from "./DPageHeader";
import { DStatTile } from "./DStatTile";
import { DashboardAttention } from "./DashboardAttention";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import ProgressByTradeCards from "./ProgressByTradeCards";
import CriticalAlertsCard from "./CriticalAlertsCard";
import { BudgetCard } from "./BudgetCard";
import { ActivityFeed } from "./ActivityFeed";
import { SideDrawer } from "./SideDrawer";
import { useToast, DashToast } from "./useToast";
import { CategoryModal, type CategoryFormData } from "./CategoryModal";
import { useDashboardData } from "./DashboardDataContext";
import type { DashboardData } from "@/types/dashboard";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `AR$ ${Math.round(n / 1_000_000)} M`;
  if (n >= 1_000) return `AR$ ${Math.round(n / 1_000)} K`;
  return `AR$ ${n}`;
}

const STATE_MAP: Record<string, { dot: string; label: string }> = {
  completada:   { dot: "#22C55E", label: "Completada" },
  en_progreso:  { dot: "#0F4395", label: "En curso" },
  pendiente:    { dot: "#94A3B8", label: "Pendiente" },
  en_retraso:   { dot: "#EF4444", label: "Retraso" },
  programada:   { dot: "#3B82F6", label: "Programada" },
};

function catProgress(cat: CategoryFormData, tasks: DashboardData["tasks"]): number {
  if (!cat.taskIds.length) return 0;
  const sum = cat.taskIds.reduce((a, id) => {
    const t = tasks.find((tk) => tk.id === id);
    return a + (t ? t.progressPercent : 0);
  }, 0);
  return Math.round(sum / cat.taskIds.length);
}

interface Props {
  data: DashboardData;
  onNavigate?: (section: string) => void;
}

export function DashboardContent({ data, onNavigate }: Props) {
  const router = useRouter();
  const [toast, flash] = useToast();
  const [drawer, setDrawer] = useState<{ kind: string; catId?: string } | null>(null);
  const [catModal, setCatModal] = useState<{ initial: CategoryFormData | null } | null>(null);
  const [categories, setCategories] = useState<CategoryFormData[]>([]);

  const {
    obra,
    stats,
    budget,
    budgetBreakdown,
    tradeProgress,
    activityFeed,
    alerts,
    tasks,
  } = data;

  const { setLookupData } = useDashboardData();
  const { obraId } = useDashboardData();

  const NAV_MAP: Record<string, string> = {
    cronograma: `/cronograma`,
    alertas: `/alertas`,
    equipo: `/equipo`,
    actividades: `/registro?v=actividad`,
    actividad: `/registro?v=actividad`,
    galeria: `/registro?v=galeria`,
    reportes: `/registro?v=reportes`,
    pedidos: `/materiales?v=pedidos`,
    stock: `/materiales?v=stock`,
    recibos: `/costos?v=recibos`,
    presupuesto: `/costos?v=presupuesto`,
    bandeja: `/inbox`,
    inbox: `/inbox`,
    rubros: `/rubros`,
    configuracion: `/configuracion`,
    perfil: `/perfil`,
  };

  useEffect(() => {
    const rubros = tradeProgress.map((t) => ({ id: t.id, name: t.name }));
    setLookupData({
      rubros,
      rubroMap: Object.fromEntries(rubros.map((r) => [r.name, r.id])),
      tasks,
      workers: [],
    });
  }, [tradeProgress, tasks, setLookupData]);

  useEffect(() => {
    if (categories.length === 0 && tasks.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories([
        {
          id: "cat-todas",
          name: "Todas las tareas",
          color: "#0F4395",
          taskIds: tasks.map((t) => t.id),
        },
      ]);
    }
  }, [tasks, categories.length]);

  const pedidosMock = {
    porAprobar: stats.pedidosPendientes,
    enTransito: 4,
    demorados: 1,
    mesEnCurso: 14,
  };

  // No hay endpoint de mensajes pendientes: se mantiene mock, consistente con el Inbox.
  const mensajesPorConfirmar = 3;
  const alertasCriticas = stats.alertasCriticas;

  const totalAvance = categories.length
    ? Math.round(categories.reduce((a, c) => a + catProgress(c, tasks), 0) / categories.length)
    : stats.avanceTotal;

  const handleNav = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    } else {
      const target = NAV_MAP[section.toLowerCase()];
      router.push(target ? `/${obraId}/dashboard${target}` : `/construction?section=${section}`);
    }
  };

  const saveCategory = (cat: CategoryFormData) => {
    setCategories((prev) =>
      prev.find((c) => c.id === cat.id)
        ? prev.map((c) => (c.id === cat.id ? cat : c))
        : [...prev, cat],
    );
    flash(catModal?.initial ? "Categoría actualizada" : "Categoría creada");
  };

  const removeCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDrawer(null);
    flash("Categoría eliminada");
  };

  const drawerCat = drawer && drawer.kind === "rubro"
    ? categories.find((c) => c.id === drawer.catId)
    : null;

  return (
    <>
      <DPageHeader
        title="Dashboard"
        subtitle={`${obra.name} · actualizado ${obra.lastUpdate}`}
        right={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileArrowDown width={13} height={13} />}
              onClick={() => flash("Exportando dashboard a PDF…")}
            >
              Exportar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus width={13} height={13} />}
              onClick={() => handleNav("Reportes")}
            >
              Nuevo reporte
            </Button>
          </>
        }
      />

      <DashboardAttention
        mensajes={mensajesPorConfirmar}
        pedidos={stats.pedidosPendientes}
        alertas={alerts.length}
        alertasCriticas={alertasCriticas}
        onNavigate={handleNav}
      />

      {/* Stat tiles */}
      <div className="text-[11px] tracking-[0.08em] uppercase font-bold text-slate-600 mb-2">Estado general</div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile
          tone="primary"
          label="Avance total"
          value={`${totalAvance}`}
          suffix="%"
          icon={<ChartBar width={16} height={16} />}
          delta={stats.avanceDelta}
          deltaTone="success"
          onClick={() => setDrawer({ kind: "avance" })}
        />
        <DStatTile
          tone="critical"
          label="Alertas críticas"
          value={`${stats.alertasCriticas}`}
          icon={<CircleExclamation width={16} height={16} />}
          delta={stats.alertasDelta}
          deltaTone="critical"
          onClick={() => setDrawer({ kind: "alerts" })}
        />
        <DStatTile
          tone="attention"
          label="Pedidos"
          value={`${stats.pedidos}`}
          icon={<Box width={16} height={16} />}
          delta={`${stats.pedidosPendientes} por aprobar`}
          onClick={() => setDrawer({ kind: "pedidos" })}
        />
        <DStatTile
          tone="success"
          label="Tareas hoy"
          value={`${stats.tareasCompletadas}/${stats.tareasTotal}`}
          icon={<Check width={16} height={16} />}
          delta={`${Math.round((stats.tareasCompletadas / stats.tareasTotal) * 100)}% completadas`}
          deltaTone="success"
          onClick={() => setDrawer({ kind: "tareas" })}
        />
      </div>

      {/* Progress + Criticals */}
      <div className="grid grid-cols-[2fr_1fr] gap-3 mb-4">
        <ProgressByTradeCards
          data={tradeProgress}
          onItemClick={(name) => {
            const cat = categories.find((c) => c.taskIds.some((id) => {
              const t = tasks.find((tk) => tk.id === id);
              return t && t.title === name;
            }));
            if (cat) setDrawer({ kind: "rubro", catId: cat.id });
          }}
          onNewCategory={() => setCatModal({ initial: null })}
          onViewAll={() => setDrawer({ kind: "avance" })}
        />
        <CriticalAlertsCard
          alerts={alerts}
          onItemClick={() => handleNav("Alertas")}
          onViewAll={() => handleNav("Alertas")}
        />
      </div>

      {/* Budget banner + Activity feed */}
      <div className="grid grid-cols-2 gap-3">
        <BudgetCard
          budget={budget}
          budgetBreakdown={budgetBreakdown}
          onViewBreakdown={() => setDrawer({ kind: "budget" })}
          onExport={() => flash("Exportando presupuesto a XLSX…")}
        />
        <ActivityFeed
          items={activityFeed}
          onItemClick={() => handleNav("Actividad")}
        />
      </div>

      {/* ── Detail drawers ─────────────────────────────────────── */}
      <SideDrawer
        open={drawer?.kind === "avance"}
        title="Avance total de la obra"
        subtitle="Resumen por categoría"
        onClose={() => setDrawer(null)}
        footer={
          <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); handleNav("Cronograma"); }}>
            Ver cronograma
          </Button>
        }
      >
        <div className="flex items-baseline gap-2 mb-4">
          <div className="text-[40px] font-extrabold display-tight tnum text-slate-950 leading-none">{totalAvance}%</div>
          <div className="text-[12px] text-slate-500">promedio de {categories.length} categorías</div>
        </div>
        <div className="space-y-3">
          {categories.map((c) => {
            const pct = catProgress(c, tasks);
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.name}
                  </span>
                  <span className="font-bold tnum">{pct}%</span>
                </div>
                <div className="bg-slate-100 h-[7px] rounded-full overflow-hidden">
                  <div style={{ width: pct + "%", background: c.color }} className="h-full rounded-full" />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{c.taskIds.length} tarea{c.taskIds.length === 1 ? "" : "s"} adjunta{c.taskIds.length === 1 ? "" : "s"}</div>
              </div>
            );
          })}
        </div>
      </SideDrawer>

      <SideDrawer
        open={drawer?.kind === "alerts"}
        title="Alertas críticas"
        subtitle={`${alerts.filter((a) => a.tone === "critical").length} sin resolver`}
        onClose={() => setDrawer(null)}
        footer={
          <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); handleNav("Alertas"); }}>
            Ir a Alertas
          </Button>
        }
      >
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`border rounded-lg p-3 ${a.tone === "critical" ? "bg-critical-50 border-[#FECACA]" : "bg-attention-50 border-[#FDE68A]"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CircleExclamation width={13} height={13} className={a.tone === "critical" ? "text-[#B91C1C]" : "text-[#A16207]"} />
                <span className="text-[13px] font-bold text-slate-950">{a.title}</span>
              </div>
              <div className="text-[11px] text-slate-600">{a.subtitle} · hace {a.time}</div>
            </div>
          ))}
        </div>
      </SideDrawer>

      <SideDrawer
        open={drawer?.kind === "pedidos"}
        title="Pedidos de materiales"
        subtitle={`${stats.pedidos} pendientes`}
        onClose={() => setDrawer(null)}
        footer={
          <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); handleNav("Pedidos"); }}>
            Ir a Pedidos
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { l: "Por aprobar", v: `${pedidosMock.porAprobar}`, t: "text-[#A16207]" },
            { l: "En tránsito", v: `${pedidosMock.enTransito}`, t: "text-[#1D4ED8]" },
            { l: "Demorados", v: `${pedidosMock.demorados}`, t: "text-[#B91C1C]" },
            { l: "Mes en curso", v: `${pedidosMock.mesEnCurso}`, t: "text-[#15803D]" },
          ].map((m) => (
            <div key={m.l} className="border border-slate-200 rounded-lg p-3">
              <div className={"text-[22px] font-extrabold tnum " + m.t}>{m.v}</div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mt-1">{m.l}</div>
            </div>
          ))}
        </div>
        <div className="text-[12px] text-slate-600 leading-snug">
          Hay <b className="text-slate-950">{pedidosMock.porAprobar} pedidos</b> esperando tu aprobación.
        </div>
      </SideDrawer>

      <SideDrawer
        open={drawer?.kind === "tareas"}
        title="Tareas de hoy"
        subtitle={`${stats.tareasCompletadas} de ${stats.tareasTotal} completadas`}
        onClose={() => setDrawer(null)}
        footer={
          <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); handleNav("Cronograma"); }}>
            Ver cronograma
          </Button>
        }
      >
        <div className="mb-4">
          <div className="bg-slate-100 h-[8px] rounded-full overflow-hidden">
            <div style={{ width: `${Math.round((stats.tareasCompletadas / stats.tareasTotal) * 100)}%` }} className="h-full bg-success rounded-full" />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {Math.round((stats.tareasCompletadas / stats.tareasTotal) * 100)}% de las tareas de hoy completadas
          </div>
        </div>
        <div className="space-y-2">
          {tasks.map((t) => {
            const statusTone: Record<string, "success" | "info" | "slate"> = {
              completada: "success",
              en_progreso: "info",
              pendiente: "slate",
            };
            const priorityTone: Record<string, "critical" | "attention" | "info" | "slate"> = {
              critica: "critical",
              alta: "attention",
              media: "info",
              baja: "slate",
            };
            return (
              <div key={t.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[13px] font-bold text-slate-950 truncate">{t.title}</span>
                  <DPill tone={priorityTone[t.priority] || "slate"}>{t.priority}</DPill>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <DPill tone={statusTone[t.status] || "slate"}>{t.status}</DPill>
                  {t.dueDate && (
                    <span className="text-[10px] text-slate-500">Vence: {t.dueDate}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 h-[6px] rounded-full overflow-hidden">
                    <div style={{ width: t.progressPercent + "%" }} className="h-full bg-primary rounded-full" />
                  </div>
                  <span className="text-[11px] font-bold tnum w-[34px] text-right">{t.progressPercent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </SideDrawer>

      {/* Budget breakdown */}
      <SideDrawer
        open={drawer?.kind === "budget"}
        title="Desglose de presupuesto"
        subtitle={obra.name}
        onClose={() => setDrawer(null)}
        footer={
          <Button variant="primary" size="sm" className="flex-1 justify-center" icon={<FileArrowDown width={13} height={13} />} onClick={() => flash("Exportando presupuesto a XLSX…")}>
            Exportar XLSX
          </Button>
        }
      >
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { l: "Total", v: budget.total },
            { l: "Ejecutado", v: budget.ejecutado },
            { l: "Disponible", v: budget.disponible },
          ].map((m) => (
            <div key={m.l} className="border border-slate-200 rounded-lg p-3">
              <div className="text-[18px] font-extrabold tnum text-slate-950 leading-tight">{formatCurrency(m.v)}</div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mt-1">{m.l}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Por rubro</div>
        <div className="space-y-3">
          {budgetBreakdown.map((r) => {
            const over = r.spent > r.cap;
            const used = Math.min(100, Math.round((r.spent / r.cap) * 100));
            const compPct = Math.min(100 - used, Math.round((r.cap ? (r.cap - r.spent) / r.cap : 0) * 100));
            return (
              <div key={r.name} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-slate-950">{r.name}</span>
                  {over
                    ? <DPill tone="criticalSolid">+{r.overPct}%</DPill>
                    : <span className="text-[11px] font-bold text-slate-500 tnum">{used}%</span>}
                </div>
                <div className="h-[8px] rounded-full overflow-hidden flex bg-slate-100">
                  <div style={{ width: used + "%" }} className={over ? "h-full bg-critical" : "h-full bg-primary"} />
                  <div style={{ width: compPct + "%" }} className="h-full bg-primary/40" />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-600 tnum">
                  <span>Ejecutado <b className={over ? "text-[#B91C1C]" : "text-slate-950"}>{formatCurrency(r.spent)}</b></span>
                  <span className="text-slate-400">Presupuesto {formatCurrency(r.cap)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </SideDrawer>

      {/* Category detail */}
      <SideDrawer
        open={!!drawerCat}
        title={drawerCat ? drawerCat.name : ""}
        subtitle="Categoría de avance"
        accent={drawerCat ? drawerCat.color : undefined}
        onClose={() => setDrawer(null)}
        footer={drawerCat && (
          <>
            <Button variant="secondary" size="sm" onClick={() => { setCatModal({ initial: drawerCat }); }}>
              Editar
            </Button>
            <Button variant="secondary" size="sm" className="text-[#B91C1C]" onClick={() => removeCategory(drawerCat.id)}>
              Quitar
            </Button>
            <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); handleNav("Cronograma"); }}>
              Cronograma
            </Button>
          </>
        )}
      >
        {drawerCat && (
          <>
            <div className="flex items-baseline gap-2 mb-4">
              <div className="text-[40px] font-extrabold display-tight tnum text-slate-950 leading-none">{catProgress(drawerCat, tasks)}%</div>
              <div className="text-[12px] text-slate-500">promedio de {drawerCat.taskIds.length} tarea{drawerCat.taskIds.length === 1 ? "" : "s"}</div>
            </div>
            <div className="bg-slate-100 h-[8px] rounded-full overflow-hidden mb-5">
              <div style={{ width: catProgress(drawerCat, tasks) + "%", background: drawerCat.color }} className="h-full rounded-full" />
            </div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Tareas adjuntas</div>
            {drawerCat.taskIds.length === 0 && (
              <div className="text-center text-slate-500 text-[12px] py-6 border border-dashed border-slate-200 rounded-lg">
                Sin tareas. Editá la categoría para adjuntar.
              </div>
            )}
            <div className="space-y-2">
              {drawerCat.taskIds.map((id) => {
                const t = tasks.find((tk) => tk.id === id);
                if (!t) return null;
                const st = STATE_MAP[t.status] || STATE_MAP.pendiente;
                return (
                  <div key={id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[12px] font-bold text-slate-950 truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-[6px] rounded-full overflow-hidden">
                        <div style={{ width: t.progressPercent + "%", background: st.dot }} className="h-full rounded-full" />
                      </div>
                      <span className="text-[11px] font-bold tnum w-[34px] text-right">{t.progressPercent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SideDrawer>

      <CategoryModal
        open={!!catModal}
        initial={catModal ? catModal.initial : null}
        availableTasks={tasks}
        onClose={() => setCatModal(null)}
        onSave={saveCategory}
      />

      <DashToast msg={toast} />
    </>
  );
}
