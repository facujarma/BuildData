"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "@gravity-ui/icons";
import type { TaskItem } from "../data";
import { TASK_STATE_MAP } from "../data";
import { parseLocalDate, formatDateLong, formatMonthYear } from "@/lib/format";

interface Props {
  tasks: TaskItem[];
  onPick: (taskId: string) => void;
}

const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKENDS = [5, 6];

interface DayInfo {
  date: Date;
  tasks: TaskItem[];
  isWeekend: boolean;
  isToday: boolean;
}

function buildGrid(tasks: TaskItem[], cursor: Date): { monthLabel: string; days: DayInfo[] } {
  const todayMs = new Date().setHours(0, 0, 0, 0);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() + (first.getDay() === 0 ? -6 : 1 - first.getDay()));

  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const offset = Math.round((first.getTime() - gridStart.getTime()) / 86_400_000);
  const weekCount = Math.max(5, Math.ceil((offset + daysInMonth) / 7));

  const days: DayInfo[] = [];
  for (let i = 0; i < weekCount * 7; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const dMs = d.getTime();

    const activeTasks = tasks.filter((t) => {
      const s = parseLocalDate(t.startDate)?.getTime();
      const e = parseLocalDate(t.dueDate)?.getTime() ?? s;
      return s !== undefined && e !== undefined && dMs >= s && dMs <= e;
    });

    days.push({
      date: d,
      tasks: activeTasks,
      isWeekend: WEEKENDS.includes(d.getDay()),
      isToday: dMs === todayMs,
    });
  }

  return {
    monthLabel: formatMonthYear(cursor),
    days,
  };
}

export function CalendarView({ tasks, onPick }: Props) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const { monthLabel, days } = useMemo(() => buildGrid(tasks, cursor), [tasks, cursor]);

  const shift = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  const goToday = () => {
    const n = new Date();
    setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="text-[14px] font-bold text-slate-950 capitalize">{monthLabel}</div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shift(-1)}
            className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-600 flex items-center justify-center"
            title="Mes anterior"
          >
            <ChevronRight width={12} height={12} className="rotate-180" />
          </button>
          <button
            onClick={goToday}
            className="text-[11px] font-bold px-2 py-1 rounded-md hover:bg-slate-100 text-slate-600"
          >
            Hoy
          </button>
          <button
            onClick={() => shift(1)}
            className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-600 flex items-center justify-center"
            title="Mes siguiente"
          >
            <ChevronRight width={12} height={12} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAY_HEADERS.map((w, i) => (
          <div
            key={w}
            className={`px-3 py-2 text-[10px] tracking-[0.06em] uppercase font-bold ${
              i > 4 ? "text-slate-400 bg-slate-50" : "text-slate-600"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7" style={{ gridAutoRows: "120px" }}>
        {days.map((day, idx) => {
          const inMonth = day.date.getMonth() === cursor.getMonth();
          const shown = day.tasks.slice(0, 3);
          const overflow = day.tasks.length - shown.length;
          const isLastCol = idx % 7 === 6;
          return (
            <div
              key={day.date.getTime()}
              className={`border-b border-slate-100 p-2 flex flex-col overflow-hidden ${isLastCol ? "" : "border-r"} ${
                day.isWeekend ? "bg-slate-50/60" : "bg-white"
              }`}
            >
              <div className={`text-[11px] font-bold mb-1 flex items-center gap-1 ${day.isToday ? "text-primary" : inMonth ? "text-slate-600" : "text-slate-300"}`}>
                {day.isToday ? (
                  <span className="w-5 h-5 rounded-full bg-primary text-white inline-flex items-center justify-center text-[10px]">
                    {day.date.getDate()}
                  </span>
                ) : (
                  day.date.getDate()
                )}
              </div>
              <div className="flex flex-col gap-[3px] min-h-0">
                {shown.map((t) => {
                  const s = TASK_STATE_MAP[t.state] || TASK_STATE_MAP.planned;
                  return (
                    <button
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPick(t.id);
                      }}
                      style={{ background: s.bg, color: s.fg, borderLeft: `3px solid ${s.dot}` }}
                      className="text-left text-[9.5px] font-bold px-[6px] py-[2px] rounded-sm truncate hover:opacity-80 transition-opacity"
                      title={`${t.name} · ${formatDateLong(day.date)}`}
                    >
                      {t.name}
                    </button>
                  );
                })}
                {overflow > 0 && <div className="text-[9px] font-bold text-slate-500">+{overflow} más</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
