"use client";

import { useState, useEffect, useCallback } from "react";
import { ChartBar, FileArrowDown, ListUl, Calendar, Plus } from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import Button from "@/components/ui/Button";
import { DashToast, useToast } from "../../_components/useToast";
import {
  getCronograma,
  completeCronogramaTask,
  reopenCronogramaTask,
  type CronogramaData,
} from "@/services/cronogramaService";
import { useDashboardData } from "../../_components/DashboardDataContext";
import { GanttView } from "./GanttView";
import { ListView } from "./ListView";
import { CalendarView } from "./CalendarView";
import { TaskDetail } from "./TaskDetail";
import { NuevaTareaModal } from "./NuevaTareaModal";
import type { TaskGroup, Timeline } from "../data";
import { TASK_STATE_MAP } from "../data";

type ViewMode = "gantt" | "list" | "calendar";

const VIEW_META: Record<ViewMode, { label: string; icon: typeof ChartBar }> = {
  gantt: { label: "Gantt", icon: ChartBar },
  list: { label: "Lista", icon: ListUl },
  calendar: { label: "Calendario", icon: Calendar },
};

export function ScreenCronograma() {
  const { obraId } = useDashboardData();
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("gantt");
  const [pick, setPick] = useState<string | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, flash] = useToast();

  // El estado se actualiza dentro de los callbacks del fetch (no sincrónico
  // en el cuerpo del efecto). Para recargar, los handlers incrementan refreshKey.
  useEffect(() => {
    if (!obraId) return;
    let cancelled = false;
    getCronograma(obraId)
      .then((data: CronogramaData) => {
        if (cancelled) return;
        setGroups(data.groups);
        setTimeline(data.timeline);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error cargando cronograma");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [obraId, refreshKey]);

  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  const allTasks = groups.flatMap((g) => g.items);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.state === "done").length;
  const progTasks = allTasks.filter((t) => t.state === "progress").length;
  const lateTasks = allTasks.filter((t) => t.state === "late").length;

  const handlePick = useCallback((taskId: string) => {
    setPick(taskId);
  }, []);

  const handleComplete = useCallback(async (id: string) => {
    try {
      await completeCronogramaTask(id);
      refresh();
    } catch (e) {
      console.error("Error completando tarea:", e);
    }
  }, [refresh]);

  const handleReopen = useCallback(async (id: string) => {
    try {
      await reopenCronogramaTask(id);
      refresh();
    } catch (e) {
      console.error("Error reabriendo tarea:", e);
    }
  }, [refresh]);

  // La creación la maneja el modal contra POST /tareas; acá solo refrescamos.
  const handleCreate = useCallback(() => {
    setNewTaskOpen(false);
    refresh();
  }, [refresh]);

  if ((loading && !timeline) || !obraId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-semibold">Cargando cronograma…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-critical/20 rounded-lg p-8 text-center">
        <div className="text-[13px] font-bold text-[#B91C1C] mb-1">No se pudo cargar el cronograma</div>
        <div className="text-[12px] text-slate-500 mb-4">{error}</div>
        <Button variant="secondary" size="sm" onClick={refresh}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!timeline) return null;

  return (
    <>
      <DPageHeader
        title="Cronograma de tareas"
        subtitle={`${totalTasks} tareas en ${groups.length} rubros · ${doneTasks} completadas · ${progTasks} en curso · ${lateTasks} en retraso`}
        right={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileArrowDown width={13} height={13} />}
              onClick={() => flash("Exportando cronograma…")}
            >
              Exportar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus width={13} height={13} />}
              onClick={() => setNewTaskOpen(true)}
            >
              Nueva tarea
            </Button>
          </>
        }
      />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-4 flex-wrap">
          {Object.entries(TASK_STATE_MAP).map(([k, v]) => (
            <div key={k} className="flex items-center gap-[6px] text-[11px] font-semibold text-slate-600">
              <span
                style={{ background: v.bg, border: v.border ? `1px solid ${v.border}` : 0 }}
                className="w-3 h-3 rounded-sm inline-block"
              />
              {v.label}
            </div>
          ))}
        </div>

        <div className="flex bg-slate-100 rounded-md p-[2px] gap-[2px]">
          {(Object.keys(VIEW_META) as ViewMode[]).map((v) => {
            const { label, icon: Icon } = VIEW_META[v];
            const on = view === v;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-[11px] font-bold px-[10px] py-[5px] rounded inline-flex items-center gap-[6px] transition-colors ${
                  on ? "bg-white text-slate-950 shadow-card" : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Icon width={12} height={12} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {totalTasks === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-card p-10 text-center">
          <div className="text-[14px] font-extrabold text-slate-950 mb-1">Todavía no hay tareas</div>
          <div className="text-[12px] text-slate-500">Creá la primera tarea para armar el cronograma de la obra.</div>
        </div>
      ) : (
        <>
          {view === "gantt" && <GanttView groups={groups} timeline={timeline} onPick={handlePick} />}
          {view === "list" && <ListView tasks={allTasks} onPick={handlePick} />}
          {view === "calendar" && <CalendarView tasks={allTasks} onPick={handlePick} />}
        </>
      )}

      <TaskDetail
        taskId={pick}
        groups={groups}
        onClose={() => setPick(null)}
        onComplete={handleComplete}
        onReopen={handleReopen}
      />

      <NuevaTareaModal
        open={newTaskOpen}
        obraId={obraId}
        onClose={() => setNewTaskOpen(false)}
        onCreate={handleCreate}
      />

      <DashToast msg={toast} />
    </>
  );
}
