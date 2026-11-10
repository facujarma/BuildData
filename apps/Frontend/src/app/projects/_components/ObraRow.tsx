import Link from "next/link";
import type { Obra } from "@/types/projects";
import { STATUS } from "@/types/projects";
import { DPill } from "@/components/ui/DPill";
import { DAvatar } from "@/components/ui/DAvatar";

function BarIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="14" viewBox="0 0 60 40">
      <rect x="6" y="22" width="9" height="14" rx="1.5" fill={color} opacity="0.6" />
      <rect x="20" y="14" width="9" height="22" rx="1.5" fill={color} opacity="0.85" />
      <rect x="34" y="4" width="9" height="32" rx="1.5" fill={color} />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
    </svg>
  );
}

export function ObraRow({ obra }: { obra: Obra }) {
  const s = STATUS[obra.status];
  return (
    <Link href={`/${obra.id}/dashboard`} className="group grid grid-cols-[40px_1fr_140px_120px_180px_100px_24px] items-center gap-4 py-3 px-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
      <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: obra.color + "20" }}>
        <BarIcon color={obra.color} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-bold text-slate-950 truncate group-hover:text-primary">{obra.name}</div>
          {obra.starred && <StarIcon />}
        </div>
        <div className="text-[11px] text-slate-500 truncate">{obra.address} · {obra.type}</div>
      </div>
      <div>
        <DPill tone={s.tone}>{s.label}</DPill>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-[6px] bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
          <div className="h-full rounded-full" style={{ width: `${obra.progress}%`, background: obra.color }} />
        </div>
        <div className="text-[11px] font-bold tnum w-[34px] text-right">{obra.progress}%</div>
      </div>
      <div className="text-[11px] text-slate-600 truncate">{obra.lastActivityWho}</div>
      <div className="flex -space-x-2 justify-end">
        {obra.team.slice(0, 3).map((t) => (
          <div key={t} className="ring-2 ring-white rounded-full">
            <DAvatar initials={t} size={22} />
          </div>
        ))}
      </div>
      <button className="text-slate-400 hover:text-slate-700 p-1" onClick={(e) => { e.preventDefault(); }}>
        <MoreIcon />
      </button>
    </Link>
  );
}
