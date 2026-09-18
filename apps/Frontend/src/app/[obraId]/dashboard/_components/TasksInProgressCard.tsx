"use client";

import { useState } from "react";
import { Check } from "@gravity-ui/icons";
import { DCard } from "@/components/ui/DCard";
import type { TaskItem } from "@/types/dashboard";

const STATE_MAP: Record<string, { dot: string; label: string }> = {
  completada:  { dot: "#22C55E", label: "Completada" },
  en_progreso: { dot: "#0F4395", label: "En curso" },
  pendiente:   { dot: "#94A3B8", label: "Pendiente" },
  en_retraso:  { dot: "#EF4444", label: "Retraso" },
  programada:  { dot: "#3B82F6", label: "Programada" },
};

const LIMIT = 3;

interface Props {
  tasks: TaskItem[];
  onViewAll?: () => void;
  onComplete?: (task: TaskItem) => Promise<void> | void;
}

export function TasksInProgressCard({ tasks, onViewAll, onComplete }: Props) {
  const [completing, setCompleting] = useState<string | null>(null);

  const done = tasks.filter((t) => t.status === "completada").length;
  const pending = tasks.filter((t) => t.status !== "completada");
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const shown = pending.slice(0, LIMIT);

  const handleComplete = async (task: TaskItem) => {
    setCompleting(task.id);
    try {
      await onComplete?.(task);
    } finally {
      setCompleting(null);
    }
  };

  return (
    <DCard padding="p-0" className="flex flex-col">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-none">
        <div className="text-[13px] font-bold">Tareas en curso</div>
        <button onClick={onViewAll} className="text-[11px] font-bold text-primary hover:underline">
          Ver todas →
        </button>
      </div>
      <div className="p-4 flex-1">
        {tasks.length === 0 ? (
          <div className="text-center text-slate-400 text-[12px] py-6">Sin tareas registradas</div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="font-semibold text-slate-700">
                  {done} de {tasks.length} completadas
                </span>
                <span className="font-bold tnum">{pct}%</span>
              </div>
              <div className="bg-slate-100 h-[8px] rounded-full overflow-hidden">
                <div style={{ width: `${pct}%` }} className="h-full bg-success rounded-full transition-all" />
              </div>
            </div>
            {pending.length === 0 ? (
              <div className="text-center text-[#15803D] text-[12px] py-4 font-bold flex items-center justify-center gap-2">
                <Check width={14} height={14} /> Todas completadas
              </div>
            ) : (
              <div className="space-y-2">
                {shown.map((t) => {
                  const st = STATE_MAP[t.status] || STATE_MAP.pendiente;
                  return (
                    <div key={t.id} className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="w-[6px] h-[6px] rounded-full flex-none" style={{ background: st.dot }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-slate-950 truncate leading-tight">{t.title}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {st.label} · {t.progressPercent}%
                        </div>
                      </div>
                      <button
                        onClick={() => handleComplete(t)}
                        disabled={completing === t.id}
                        className="text-[10px] font-bold text-[#15803D] bg-success-50 hover:bg-success/20 rounded px-2 py-[5px] flex items-center gap-1 flex-none transition-colors disabled:opacity-50"
                      >
                        <Check width={11} height={11} /> Completar
                      </button>
                    </div>
                  );
                })}
                {pending.length > shown.length && (
                  <div className="text-[11px] text-slate-500 text-center pt-1">
                    +{pending.length - shown.length} tarea{pending.length - shown.length === 1 ? "" : "s"} más en curso
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DCard>
  );
}
