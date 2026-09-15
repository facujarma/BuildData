"use client";

import type { ReactNode } from "react";

export interface GroupTab {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
}

export function GroupTabs({
  tabs,
  value,
  onSelect,
}: {
  tabs: GroupTab[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-[3px] mb-5 w-fit">
      {tabs.map((x) => {
        const on = value === x.id;
        return (
          <button
            key={x.id}
            onClick={() => onSelect(x.id)}
            className={`inline-flex items-center gap-2 text-[12px] font-bold px-[14px] py-[7px] rounded-md transition-colors ${
              on ? "bg-white text-slate-950 shadow-card" : "text-slate-600 hover:text-slate-950"
            }`}
          >
            <span className={on ? "text-primary" : "text-slate-400"}>{x.icon}</span>
            {x.label}
            {x.badge ? (
              <span
                className={`text-[9px] font-bold px-[5px] py-[1px] rounded-full ${
                  on ? "bg-primary-50 text-primary" : "bg-slate-200 text-slate-600"
                }`}
              >
                {x.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}