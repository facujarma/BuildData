"use client";

import { useEffect, useMemo } from "react";
import { Check, ClockArrowRotateLeft, TriangleExclamation, Xmark } from "@gravity-ui/icons";
import { DPill, type PillTone } from "@/components/ui/DPill";
import { DAvatar } from "@/components/ui/DAvatar";
import Button from "@/components/ui/Button";
import type { TaskItem, TaskGroup } from "../data";
import {
  TASK_STATE_MAP,
  RUBRO_COLORS,
  FALLBACK_RUBRO_COLOR,
} from "../data";
import { formatDateLong, parseLocalDate } from "@/lib/format";

interface Props {
  taskId: string | null;
  groups: TaskGroup[];
  onClose: () => void;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
}

const STATE_TONE: Record<string, PillTone> = {
  done: "successSolid",
  progress: "primary",
  late: "criticalSolid",
  planned: "info",
};

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function TaskDetail({ taskId, groups, onClose, onComplete, onReopen }: Props) {
  const task = useMemo<TaskItem | null>(() => {
    if (!taskId) return null;
    for (const g of groups) {
      const found = g.items.find((t) => t.id === taskId);
      if (found) return found;
    }
    return null;
  }, [taskId, groups]);

  useEffect(() => {
    if (!taskId) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [taskId, onClose]);

  if (!taskId || !task) return null;

  const sm = TASK_STATE_MAP[task.state] || TASK_STATE_MAP.planned;
  const rubroColor = RUBRO_COLORS[task.rubro] || FALLBACK_RUBRO_COLOR;
  const startD = parseLocalDate(task.startDate);
  const endD = parseLocalDate(task.dueDate) ?? startD;
  const isLate = task.state === "late";
  const isDone = task.state === "done";

  const deps = task.deps
    .map((depId) => {
      for (const g of groups) {
        const found = g.items.find((t) => t.id === depId);
        if (found) return found;
      }
      return null;
    })
    .filter(Boolean) as TaskItem[];

  const updates = [
    { who: initials(task.who), text: "Reporte de avance enviado por WhatsApp", when: "hace 2 h" },
    { who: "JM", text: "Tarea revisada por dirección", when: "ayer" },
  ];

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[55] bg-slate-950/40 backdrop-blur-[2px] animate-fade-task" />
      <aside className="fixed right-0 top-0 bottom-0 z-[60] w-[420px] max-w-[calc(100vw-32px)] bg-white border-l border-slate-200 shadow-big flex flex-col animate-slide-task overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 flex-none">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: rubroColor }} />
              <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-600 truncate">{task.rubro}</span>
            </div>
            <h3 className="text-[18px] font-extrabold display-tight text-slate-950 leading-tight">{task.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center flex-none"
          >
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex-none">
          <div className="flex items-center justify-between mb-3">
            <DPill tone={STATE_TONE[task.state] || "slate"}>{sm.label}</DPill>
            <div className="text-[20px] font-extrabold tnum display-tight text-slate-950">{task.pct}%</div>
          </div>
          <div className="h-[8px] bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${task.pct}%`, background: sm.dot }} />
          </div>
          {isLate && (
            <div className="mt-3 flex items-start gap-2 bg-critical-50 text-[#B91C1C] text-[11px] rounded p-2">
              <TriangleExclamation width={12} height={12} className="mt-[1px] flex-none" />
              <span>
                <b>Tarea retrasada</b>
                {endD ? ` · prevista para el ${formatDateLong(endD)}.` : "."}
              </span>
            </div>
          )}
          {isDone && task.completedBy && (
            <div className="mt-3 flex items-center gap-2 bg-success-50 text-[#15803D] text-[11px] rounded p-2">
              <Check width={12} height={12} className="flex-none" />
              <span>
                Marcada como completada por <b>{task.completedBy}</b>
                {task.completedOn ? ` el ${task.completedOn}` : ""}.
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {task.desc && (
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Descripción</div>
              <p className="text-[13px] text-slate-700 leading-relaxed">{task.desc}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">Inicio</div>
              <div className="text-[12px] font-semibold text-slate-950">{startD ? formatDateLong(startD) : "—"}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">Fin estimado</div>
              <div className="text-[12px] font-semibold text-slate-950">{endD ? formatDateLong(endD) : "—"}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">Duración</div>
              <div className="text-[12px] font-semibold text-slate-950">
                {task.span} {task.span === 1 ? "semana" : "semanas"}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">Costo</div>
              <div className="text-[12px] font-semibold text-slate-950 tnum">{task.cost}</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Responsable</div>
            <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
              <DAvatar initials={initials(task.who)} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-slate-950 truncate">{task.who}</div>
                <div className="text-[11px] text-slate-500 truncate">{task.rubro}</div>
              </div>
              <button className="text-[11px] font-bold text-primary hover:underline">Mensaje</button>
            </div>
          </div>

          {deps.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Depende de</div>
              <div className="space-y-2">
                {deps.map((d) => {
                  const depSm = TASK_STATE_MAP[d.state] || TASK_STATE_MAP.planned;
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                      <span className="w-2 h-2 rounded-full flex-none" style={{ background: depSm.dot }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold truncate">{d.name}</div>
                        <div className="text-[11px] text-slate-500">{depSm.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Últimas actualizaciones</div>
            <div className="space-y-3">
              {updates.map((u, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]">
                  <DAvatar initials={u.who} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-700 leading-snug">{u.text}</div>
                    <div className="text-[10px] text-slate-500">{u.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-3 flex items-center gap-2 flex-none">
          {isDone ? (
            <>
              <div className="flex-1 flex items-center gap-2 text-[12px] font-bold text-[#15803D]">
                <span className="w-6 h-6 rounded-full bg-success-50 flex items-center justify-center flex-none">
                  <Check width={13} height={13} />
                </span>
                <span className="min-w-0">
                  Completada
                  {task.completedBy && (
                    <span className="block text-[10px] font-semibold text-slate-500">
                      por {task.completedBy}
                      {task.completedOn ? ` · ${task.completedOn}` : ""}
                    </span>
                  )}
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onReopen(task.id)}>
                Reabrir
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" icon={<ClockArrowRotateLeft width={13} height={13} />}>
                Editar
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 justify-center"
                icon={<Check width={14} height={14} />}
                onClick={() => onComplete(task.id)}
              >
                Marcar completada
              </Button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
