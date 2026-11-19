"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChartBar,
  CircleExclamation,
  Box,
  Check,
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
import { TasksInProgressCard, TasksInProgressBody } from "./TasksInProgressCard";
import { UpcomingDeliveriesCard } from "./UpcomingDeliveriesCard";
import { SideDrawer } from "./SideDrawer";
import { completeCronogramaTask } from "@/services/cronogramaService";
import { getAlertas } from "@/services/alertasService";
import { getPedidos } from "@/services/pedidosService";
import { useToast, DashToast } from "./useToast";
import { useDashboardData } from "./DashboardDataContext";
import { useRole } from "./RoleContext";
import type { DashboardData, TaskItem } from "@/types/dashboard";
import type { AlertaItem } from "../alertas/data";
import { formatARSCompact } from "@/lib/format";

interface Props {
  data: DashboardData;
  onNavigate?: (section: string) => void;
}

export function DashboardContent({ data, onNavigate }: Props) {
  const router = useRouter();
  const [toast, flash] = useToast();
  const [drawer, setDrawer] = useState<string | null>(null);
  const [alertasFull, setAlertasFull] = useState<AlertaItem[]>([]);
  const [pedidosResumen, setPedidosResumen] = useState({ porAprobar: 0, enTransito: 0, demorados: 0, mesEnCurso: 0 });

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

  const { setLookupData, obraId, refreshDashboard } = useDashboardData();
  const { puede } = useRole();
  // Sin `presupuesto.ver` el Backend no manda `budget` y la tarjeta no se pinta.
  const puedeVerPresupuesto = puede("presupuesto.ver") && budget != null;

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
    proveedores: `/materiales?v=proveedores`,
    recibos: `/costos?v=recibos`,
    presupuesto: `/costos?v=presupuesto`,
    bandeja: `/inbox`,
    inbox: `/inbox`,
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
    if (!obraId) return;
    let active = true;
    getAlertas(obraId)
      .then((d) => {
        if (active) setAlertasFull(d.alerts.filter((a) => a.state !== "resolved"));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [obraId]);

  useEffect(() => {
    if (!obraId) return;
    let active = true;
    getPedidos(obraId)
      .then((rows) => {
        if (!active) return;
        const ahora = new Date();
        const esDelMes = (iso?: string | null) => {
          if (!iso) return false;
          const d = new Date(iso);
          return d.getFullYear() === ahora.getFullYear() && d.getMonth() === ahora.getMonth();
        };
        setPedidosResumen({
          porAprobar: rows.filter((p) => p.state === "pending").length,
          enTransito: rows.filter((p) => p.state === "transit").length,
          demorados: rows.filter((p) => p.state === "late").length,
          mesEnCurso: rows.filter((p) => esDelMes(p.orderedISO)).length,
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [obraId]);

  const mensajesPorConfirmar = stats.operacionesPendientes;
  const alertasCriticas = stats.alertasCriticas;

  const totalAvance = stats.avanceTotal;

  const handleNav = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    } else {
      const target = NAV_MAP[section.toLowerCase()];
      router.push(target ? `/${obraId}/dashboard${target}` : `/construction?section=${section}`);
    }
  };

  const handleTaskComplete = async (task: TaskItem) => {
    try {
      await completeCronogramaTask(task.id);
      await refreshDashboard();
      flash("Tarea completada");
    } catch {
      flash("No se pudo completar la tarea");
    }
  };

  const drawerAlerts: AlertaItem[] = alertasFull.length > 0
    ? alertasFull
    : alerts.map((a, i) => ({
        id: `dash-${i}`,
        lvl: a.tone === "critical" ? "critical" : "attention",
        state: "open",
        cat: "General",
        title: a.title,
        who: a.subtitle,
        time: a.time,
        desc: a.subtitle,
      }));

  return (
    <>
      <DPageHeader
        title="Dashboard"
        subtitle={`${obra.name} · actualizado ${obra.lastUpdate}`}
        right={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus width={13} height={13} />}
            onClick={() => handleNav("Reportes")}
          >
            Nuevo reporte
          </Button>
        }
      />

      <DashboardAttention
        mensajes={mensajesPorConfirmar}
        pedidos={stats.pedidosPendientes}
        alertas={alerts.length}
        alertasCriticas={alertasCriticas}
        onNavigate={handleNav}
      />

      {/* Hoy en la obra */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] tracking-[0.08em] uppercase font-bold text-slate-600">Hoy en la obra</span>
        </div>
        <div className="grid grid-cols-2 gap-3 items-stretch">
          <TasksInProgressCard
            tasks={tasks}
            onViewAll={() => setDrawer("tareas")}
            onComplete={handleTaskComplete}
          />
          <UpcomingDeliveriesCard
            obraId={obraId}
            onViewAll={() => handleNav("Pedidos")}
          />
        </div>
      </div>

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
          onClick={() => setDrawer("avance")}
        />
        <DStatTile
          tone="critical"
          label="Alertas críticas"
          value={`${stats.alertasCriticas}`}
          icon={<CircleExclamation width={16} height={16} />}
          delta={stats.alertasDelta}
          deltaTone="critical"
          onClick={() => setDrawer("alerts")}
        />
        <DStatTile
          tone="attention"
          label="Pedidos"
          value={`${stats.pedidos}`}
          icon={<Box width={16} height={16} />}
          delta={`${stats.pedidosPendientes} por aprobar`}
          onClick={() => setDrawer("pedidos")}
        />
        <DStatTile
          tone="success"
          label="Tareas hoy"
          value={`${stats.tareasCompletadas}/${stats.tareasTotal}`}
          icon={<Check width={16} height={16} />}
          delta={`${Math.round((stats.tareasCompletadas / stats.tareasTotal) * 100)}% completadas`}
          deltaTone="success"
          onClick={() => setDrawer("tareas")}
        />
      </div>

      {/* Progress + Criticals */}
      <div className="grid grid-cols-[2fr_1fr] gap-3 mb-4 items-stretch">
        <ProgressByTradeCards data={tradeProgress} />
        <CriticalAlertsCard
          alerts={alerts}
          onItemClick={() => handleNav("Alertas")}
          onViewAll={() => handleNav("Alertas")}
        />
      </div>

      {/* Budget banner + Activity feed — la tarjeta de costos solo con permiso */}
      <div className={puedeVerPresupuesto ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
        {puedeVerPresupuesto && budget && (
          <BudgetCard
            budget={budget}
            budgetBreakdown={budgetBreakdown}
            onViewBreakdown={() => setDrawer("budget")}
          />
        )}
        <ActivityFeed
          items={activityFeed}
          onItemClick={() => handleNav("Actividad")}
          onViewAll={() => handleNav("Actividad")}
        />
      </div>

      {/* ── Detail drawers ─────────────────────────────────────── */}
      <SideDrawer
        open={drawer === "avance"}
        title="Avance total de la obra"
        subtitle="Resumen por rubro"
        onClose={() => setDrawer(null)}
        footer={
          <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); handleNav("Cronograma"); }}>
            Ver cronograma
          </Button>
        }
      >
        <div className="flex items-baseline gap-2 mb-4">
          <div className="text-[40px] font-extrabold display-tight tnum text-slate-950 leading-none">{totalAvance}%</div>
          <div className="text-[12px] text-slate-500">promedio de {tradeProgress.length} rubros</div>
        </div>
        <div className="space-y-3">
          {tradeProgress.map((r) => (
            <div key={r.id}>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />{r.name}
                </span>
                <span className="font-bold tnum">{r.pct}%</span>
              </div>
              <div className="bg-slate-100 h-[7px] rounded-full overflow-hidden">
                <div style={{ width: r.pct + "%", background: r.color }} className="h-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </SideDrawer>

      <SideDrawer
        open={drawer === "alerts"}
        title="Alertas activas"
        subtitle="Críticas e importantes"
        onClose={() => setDrawer(null)}
        footer={
          <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); handleNav("Alertas"); }}>
            Ir a Alertas
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { l: "Críticas",    v: drawerAlerts.filter((a) => a.lvl === "critical").length, t: "text-[#B91C1C]" },
            { l: "Importantes", v: drawerAlerts.filter((a) => a.lvl === "attention").length, t: "text-[#A16207]" },
            { l: "Moderadas",   v: drawerAlerts.filter((a) => a.lvl === "moderate").length, t: "text-slate-600" },
            { l: "En progreso", v: drawerAlerts.filter((a) => a.state === "progress").length, t: "text-[#1D4ED8]" },
          ].map((m) => (
            <div key={m.l} className="border border-slate-200 rounded-lg p-3">
              <div className={"text-[22px] font-extrabold tnum leading-none " + m.t}>{m.v}</div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mt-1">{m.l}</div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {Object.entries(drawerAlerts.reduce<Record<string, AlertaItem[]>>((acc, a) => {
            (acc[a.cat] = acc[a.cat] || []).push(a);
            return acc;
          }, {})).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-600">{cat}</span>
                <span className="text-[10px] text-slate-400">· {items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((a) => {
                  const crit = a.lvl === "critical";
                  const mod = a.lvl === "moderate";
                  return (
                    <div key={a.id} className={"border rounded-lg p-3 " + (crit ? "bg-critical-50 border-[#FECACA]" : mod ? "bg-slate-50 border-slate-200" : "bg-attention-50 border-[#FDE68A]")}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400 tnum">{a.id}</span>
                        <DPill tone={crit ? "criticalSolid" : mod ? "slate" : "attentionSolid"}>{crit ? "CRÍTICA" : mod ? "MODERADA" : "IMPORTANTE"}</DPill>
                        {a.state === "progress" && <DPill tone="info">EN PROGRESO</DPill>}
                      </div>
                      <div className="text-[13px] font-bold text-slate-950 leading-tight">{a.title}</div>
                      {a.desc && (
                        <div className="flex items-start gap-1 text-[11px] text-slate-700 mt-1">
                          <CircleExclamation width={11} height={11} className={"mt-[1px] flex-none " + (crit ? "text-[#B91C1C]" : mod ? "text-slate-500" : "text-[#A16207]")} />
                          <span>{a.desc}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-[3px]">Reportó {a.who} · {a.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {drawerAlerts.length === 0 && (
            <div className="text-center text-slate-400 text-[12px] py-8">Sin alertas activas</div>
          )}
        </div>
      </SideDrawer>

      <SideDrawer
        open={drawer === "pedidos"}
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
            { l: "Por aprobar", v: `${pedidosResumen.porAprobar}`, t: "text-[#A16207]" },
            { l: "En tránsito", v: `${pedidosResumen.enTransito}`, t: "text-[#1D4ED8]" },
            { l: "Demorados", v: `${pedidosResumen.demorados}`, t: "text-[#B91C1C]" },
            { l: "Mes en curso", v: `${pedidosResumen.mesEnCurso}`, t: "text-[#15803D]" },
          ].map((m) => (
            <div key={m.l} className="border border-slate-200 rounded-lg p-3">
              <div className={"text-[22px] font-extrabold tnum " + m.t}>{m.v}</div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mt-1">{m.l}</div>
            </div>
          ))}
        </div>
        <div className="text-[12px] text-slate-600 leading-snug">
          Hay <b className="text-slate-950">{pedidosResumen.porAprobar} pedidos</b> esperando tu aprobación.
        </div>
      </SideDrawer>

      <SideDrawer
        open={drawer === "tareas"}
        title="Tareas en curso"
        subtitle={`${stats.tareasCompletadas} de ${stats.tareasTotal} completadas`}
        onClose={() => setDrawer(null)}
        footer={
          <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); handleNav("Cronograma"); }}>
            Ver cronograma
          </Button>
        }
      >
        <TasksInProgressBody tasks={tasks} onComplete={handleTaskComplete} />
      </SideDrawer>

      {/* Budget breakdown — mismo gate que la tarjeta */}
      {puedeVerPresupuesto && budget && (
      <SideDrawer
        open={drawer === "budget"}
        title="Desglose de presupuesto"
        subtitle={obra.name}
        onClose={() => setDrawer(null)}
        footer={
          <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); handleNav("Presupuesto"); }}>
            Ir a Presupuesto
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
              <div className="text-[18px] font-extrabold tnum text-slate-950 leading-tight">{formatARSCompact(m.v)}</div>
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
                  <span>Ejecutado <b className={over ? "text-[#B91C1C]" : "text-slate-950"}>{formatARSCompact(r.spent)}</b></span>
                  <span className="text-slate-400">Presupuesto {formatARSCompact(r.cap)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </SideDrawer>
      )}

      <DashToast msg={toast} />
    </>
  );
}
