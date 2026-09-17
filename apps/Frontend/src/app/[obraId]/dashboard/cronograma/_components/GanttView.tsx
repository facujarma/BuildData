"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { ChevronRight } from "@gravity-ui/icons";
import { DCard } from "@/components/ui/DCard";
import type { TaskGroup, Timeline } from "../data";
import {
  TASK_STATE_MAP,
  RUBRO_COLORS,
  FALLBACK_RUBRO_COLOR,
  weekDate,
  todayColumn,
  fmtDate,
  isoWeek,
} from "../data";

interface Props {
  groups: TaskGroup[];
  timeline: Timeline;
  onPick: (taskId: string) => void;
}

type ZoomId = "compact" | "normal" | "comfortable";

const ZOOMS: { id: ZoomId; label: string; w: number }[] = [
  { id: "compact", label: "Compacto", w: 56 },
  { id: "normal", label: "Normal", w: 72 },
  { id: "comfortable", label: "Amplio", w: 96 },
];

const NAME_COL = 260;

export function GanttView({ groups, timeline, onPick }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<ZoomId>("normal");
  const weekWidth = ZOOMS.find((z) => z.id === zoom)?.w ?? 72;

  const { weekCount } = timeline;
  const totalWidth = weekCount * weekWidth;
  const todayCol = todayColumn(timeline);

  const scrollToToday = useCallback(() => {
    if (!scrollerRef.current) return;
    const targetX = todayCol * weekWidth - scrollerRef.current.clientWidth / 2 + NAME_COL / 2;
    scrollerRef.current.scrollTo({ left: Math.max(0, targetX), behavior: "smooth" });
  }, [todayCol, weekWidth]);

  useEffect(() => {
    scrollToToday();
  }, [scrollToToday]);

  const months = useMemo(() => {
    const out: { key: string; label: string; span: number }[] = [];
    for (let i = 0; i < weekCount; i++) {
      const d = weekDate(timeline, i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const last = out[out.length - 1];
      if (last && last.key === key) {
        last.span += 1;
      } else {
        out.push({
          key,
          label: d.toLocaleDateString("es-AR", { month: "long", year: "2-digit" }),
          span: 1,
        });
      }
    }
    return out;
  }, [timeline, weekCount]);

  return (
    <DCard padding="p-0" className="overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => scrollerRef.current?.scrollBy({ left: -weekWidth * 4, behavior: "smooth" })}
          className="w-7 h-7 rounded-md hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          title="Atrás"
        >
          <ChevronRight width={13} height={13} className="rotate-180" />
        </button>
        <button
          onClick={scrollToToday}
          className="text-[11px] font-bold px-3 py-[5px] rounded-md bg-white border border-slate-200 hover:border-primary text-slate-700"
        >
          Hoy
        </button>
        <button
          onClick={() => scrollerRef.current?.scrollBy({ left: weekWidth * 4, behavior: "smooth" })}
          className="w-7 h-7 rounded-md hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          title="Adelante"
        >
          <ChevronRight width={13} height={13} />
        </button>

        <div className="text-[11px] text-slate-500 ml-2 flex-1 truncate">
          {fmtDate(weekDate(timeline, 0))} → {fmtDate(weekDate(timeline, weekCount - 1, 6))} · {weekCount} semanas
        </div>

        <div className="flex bg-white border border-slate-200 rounded-md p-[2px] gap-[2px]">
          {ZOOMS.map((z) => (
            <button
              key={z.id}
              onClick={() => setZoom(z.id)}
              className={`text-[10px] font-bold px-[8px] py-[4px] rounded transition-colors ${
                zoom === z.id ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollerRef} className="overflow-auto" style={{ maxHeight: "60vh" }}>
        <div className="relative" style={{ width: NAME_COL + totalWidth }}>
          <div className="flex bg-slate-50 border-b border-slate-200 relative z-40" style={{ paddingLeft: NAME_COL }}>
            {months.map((m) => (
              <div
                key={m.key}
                style={{ width: m.span * weekWidth, minWidth: m.span * weekWidth }}
                className="px-2 py-1 text-[10px] tracking-[0.06em] uppercase font-bold text-slate-600 border-l border-slate-200 capitalize truncate"
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex bg-slate-50 border-b border-slate-200 sticky top-0 z-40">
            <div
              style={{ width: NAME_COL, minWidth: NAME_COL }}
              className="px-4 py-[10px] text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 bg-slate-50 sticky left-0 z-50 border-r border-slate-200"
            >
              Tarea
            </div>
            {Array.from({ length: weekCount }, (_, i) => {
              const isToday = i === Math.floor(todayCol);
              const d = weekDate(timeline, i);
              return (
                <div
                  key={i}
                  style={{ width: weekWidth, minWidth: weekWidth }}
                  className={`px-1 py-[10px] text-[10px] font-bold text-center border-l border-slate-200 ${
                    isToday ? "bg-accent/10 text-accent-700" : "text-slate-500"
                  }`}
                >
                  <div className="leading-tight">S{isoWeek(d)}</div>
                  <div className="text-[9px] font-medium text-slate-400">{fmtDate(d)}</div>
                </div>
              );
            })}
          </div>

          {groups.map((g) => (
            <div key={g.rubro}>
              <div
                className="flex bg-slate-100/70 border-b border-slate-200 sticky left-0 z-30"
                style={{ width: NAME_COL + totalWidth }}
              >
                <div
                  style={{ width: NAME_COL, minWidth: NAME_COL }}
                  className="px-4 py-[8px] flex items-center gap-2 bg-slate-100/95 sticky left-0 z-30 border-r border-slate-200"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-none"
                    style={{ background: RUBRO_COLORS[g.rubro] || FALLBACK_RUBRO_COLOR }}
                  />
                  <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-700 truncate">
                    {g.rubro}
                  </span>
                  <span className="text-[10px] text-slate-500">· {g.items.length}</span>
                </div>
              </div>

              {g.items.map((t) => {
                const s = TASK_STATE_MAP[t.state] || TASK_STATE_MAP.planned;
                return (
                  <div
                    key={t.id}
                    className="flex items-center border-b border-slate-200 last:border-b-0 min-h-[48px] hover:bg-slate-50/60 cursor-pointer transition-colors group"
                    onClick={() => onPick(t.id)}
                  >
                    <div
                      style={{ width: NAME_COL, minWidth: NAME_COL }}
                      className="px-4 py-2 sticky left-0 z-30 bg-white border-r border-slate-200 group-hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="text-[12px] font-semibold text-slate-950 leading-tight group-hover:text-primary transition-colors truncate">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-[1px] flex items-center gap-1">
                        <span className="inline-block w-[5px] h-[5px] rounded-full flex-none" style={{ background: s.dot }} />
                        <span className="truncate">{t.who}</span>
                      </div>
                    </div>

                    <div className="relative h-[48px]" style={{ width: totalWidth }}>
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: weekCount }, (_, i) => (
                          <div
                            key={i}
                            style={{ width: weekWidth, minWidth: weekWidth }}
                            className={`border-l border-dashed border-slate-100 ${
                              i === Math.floor(todayCol) ? "bg-accent/[0.06]" : ""
                            }`}
                          />
                        ))}
                      </div>

                      <div
                        className="absolute top-0 bottom-0 w-px bg-accent/70 pointer-events-none z-[5]"
                        style={{ left: todayCol * weekWidth }}
                      />

                      <div
                        style={{
                          left: t.start * weekWidth,
                          width: Math.max(t.span * weekWidth - 6, 10),
                          background: s.bg,
                          color: s.fg,
                          border: s.border ? `1px solid ${s.border}` : 0,
                        }}
                        className="absolute top-1/2 -translate-y-1/2 ml-[3px] h-[24px] rounded px-2 flex items-center text-[10px] font-bold gap-[6px] overflow-hidden whitespace-nowrap shadow-card hover:shadow-pop transition-shadow z-10"
                      >
                        {(t.state === "progress" || t.state === "late") && t.pct > 0 && (
                          <div className="absolute inset-y-0 left-0 bg-white/25" style={{ width: `${t.pct}%` }} />
                        )}
                        <span className="relative z-10 truncate">
                          {t.name}
                          {t.state !== "done" && t.state !== "planned" ? ` · ${t.pct}%` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </DCard>
  );
}
