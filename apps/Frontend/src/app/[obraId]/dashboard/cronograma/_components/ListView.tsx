"use client";

import type { TaskItem } from "../data";
import { DPill, type PillTone } from "@/components/ui/DPill";
import { DAvatar } from "@/components/ui/DAvatar";
import {
  RUBRO_COLORS,
  FALLBACK_RUBRO_COLOR,
  TASK_STATE_MAP,
} from "../data";
import { formatDateShort, parseLocalDate } from "@/lib/format";

interface Props {
  tasks: TaskItem[];
  onPick: (taskId: string) => void;
}

const STATE_TONE: Record<string, PillTone> = {
  done: "success",
  progress: "primary",
  late: "criticalSolid",
  planned: "info",
};

const GRID = "grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_140px_90px_90px_90px] gap-2";

export function ListView({ tasks, onPick }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-card p-8 text-center text-slate-500 text-[13px]">
        No hay tareas para mostrar
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden">
      <div className={`${GRID} px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500`}>
        <div>Tarea</div>
        <div>Rubro</div>
        <div>Responsable</div>
        <div>Inicio</div>
        <div>Fin</div>
        <div className="text-right">Estado</div>
      </div>

      {tasks.map((t, i) => {
        const sm = TASK_STATE_MAP[t.state] || TASK_STATE_MAP.planned;
        const startD = parseLocalDate(t.startDate);
        const endD = parseLocalDate(t.dueDate) ?? startD;
        return (
          <div
            key={t.id}
            className={`${GRID} px-5 py-3 items-center hover:bg-slate-50 cursor-pointer transition-colors ${
              i < tasks.length - 1 ? "border-b border-slate-100" : ""
            }`}
            onClick={() => onPick(t.id)}
          >
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-slate-950 truncate">{t.name}</div>
              <div className="text-[11px] text-slate-500 truncate mt-[1px]">
                {t.state !== "planned" && t.state !== "done" ? `${t.pct}% completado` : t.rubro}
              </div>
              <div className="mt-2 h-[3px] bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: sm.dot }} />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-slate-700 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-none"
                style={{ background: RUBRO_COLORS[t.rubro] || FALLBACK_RUBRO_COLOR }}
              />
              <span className="truncate">{t.rubro}</span>
            </div>

            <div className="flex items-center gap-2 text-[12px] min-w-0">
              <DAvatar
                initials={t.who.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                size={22}
              />
              <span className="text-slate-700 truncate">{t.who}</span>
            </div>

            <div className="text-[12px] text-slate-700 tnum truncate">{startD ? formatDateShort(startD) : "—"}</div>
            <div className="text-[12px] text-slate-700 tnum truncate">{endD ? formatDateShort(endD) : "—"}</div>

            <div className="flex justify-end">
              <DPill tone={STATE_TONE[t.state] || "slate"}>{sm.label}</DPill>
            </div>
          </div>
        );
      })}
    </div>
  );
}
