import Link from "next/link";
import type { Obra } from "@/types/projects";
import { STATUS } from "@/types/projects";
import { DPill } from "@/components/ui/DPill";
import { DAvatar } from "@/components/ui/DAvatar";
import { ObraThumb } from "./ObraThumb";

function MoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
    </svg>
  );
}

export function ObraCard({ obra, cover = "blueprint" }: { obra: Obra; cover?: string }) {
  const s = STATUS[obra.status];
  return (
    <Link href={`/${obra.id}/dashboard`} className="obra-card group bg-white border border-slate-200 rounded-lg overflow-hidden shadow-card hover:shadow-pop hover:border-primary transition-all">
      <ObraThumb obra={obra} height={104} variant={cover as "blueprint" | "minimal" | "swatch"} />
      <div className="p-4 obra-card-body">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="text-[14px] font-extrabold text-slate-950 leading-tight group-hover:text-primary transition-colors">{obra.name}</div>
          <button className="text-slate-400 hover:text-slate-700 -mt-1 -mr-1 p-1" onClick={(e) => { e.preventDefault(); }}>
            <MoreIcon />
          </button>
        </div>
        <div className="text-[11px] text-slate-500 leading-snug truncate">{obra.address}</div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <DPill tone={s.tone}>{s.label}</DPill>
          {obra.alerts > 0 && <DPill tone="criticalSolid">{obra.alerts} alerta{obra.alerts > 1 ? "s" : ""}</DPill>}
        </div>

        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className="flex -space-x-2">
            {obra.team.slice(0, 4).map((t) => (
              <div key={t} className="ring-2 ring-white rounded-full">
                <DAvatar initials={t} size={22} />
              </div>
            ))}
            {obra.team.length > 4 && (
              <div className="w-[22px] h-[22px] rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                +{obra.team.length - 4}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-500 truncate">{obra.lastActivity}</div>
        </div>
      </div>
    </Link>
  );
}
