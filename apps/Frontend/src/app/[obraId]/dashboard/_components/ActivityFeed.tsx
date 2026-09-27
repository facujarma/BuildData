"use client";

import { DAvatar } from "@/components/ui/DAvatar";
import { DCard } from "@/components/ui/DCard";
import Button from "@/components/ui/Button";
import type { ActivityFeedItem } from "@/types/dashboard";

interface Props {
  items: ActivityFeedItem[];
  onItemClick?: (item: ActivityFeedItem) => void;
  onViewAll?: () => void;
}

export function ActivityFeed({ items, onItemClick, onViewAll }: Props) {
  return (
    <DCard padding="p-0" className="flex flex-col">
      <div className="px-5 py-3 border-b border-slate-200">
        <div className="text-[14px] font-bold">Avances de hoy</div>
      </div>
      <div className="divide-y divide-slate-200 flex-1">
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-400 text-[12px]">
            Sin actividad registrada hoy
          </div>
        ) : (
          items.map((a, i) => (
            <button
              key={i}
              onClick={() => onItemClick?.(a)}
              className="w-full px-4 py-[10px] flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
            >
              <DAvatar initials={a.initials} size={30} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] leading-snug">
                  <b className="font-bold">{a.name}</b>
                  {a.tipo && <span className="text-slate-500"> · {a.tipo}</span>}
                </div>
                {a.texto && (
                  <div className="text-[11px] text-slate-400 mt-[2px] line-clamp-2">{a.texto}</div>
                )}
              </div>
              <div className="text-[10px] text-slate-500 tnum shrink-0 mt-[2px]">{a.time}</div>
            </button>
          ))
        )}
      </div>
      <div className="p-3 border-t border-slate-200 mt-auto">
        <Button variant="secondary" size="sm" className="w-full justify-center" onClick={onViewAll}>
          Ver todos los avances
        </Button>
      </div>
    </DCard>
  );
}
