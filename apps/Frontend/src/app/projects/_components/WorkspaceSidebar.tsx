"use client";

import { Box } from "@gravity-ui/icons";

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" className="flex-none">
      <rect width="56" height="56" rx="12" fill="#0F4395" />
      <rect x="11" y="30" width="9" height="18" rx="2" fill="white" fillOpacity="0.85" />
      <rect x="23" y="20" width="9" height="28" rx="2" fill="white" />
      <rect x="35" y="10" width="9" height="38" rx="2" fill="#F59E0B" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function WorkspaceSidebar({
  onNewObra,
}: {
  onNewObra: () => void;
}) {
  return (
    <aside className="w-[240px] flex flex-col flex-none bg-ink-deep text-white">
      <div className="px-4 py-4 flex items-center gap-[10px]">
        <LogoMark />
        <div className="font-extrabold text-[16px] display-tight text-white">BuildData</div>
      </div>

      <div className="px-3 pb-3">
        <button onClick={onNewObra} className="w-full font-bold text-[12px] rounded-md px-3 py-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap bg-accent hover:bg-accent-700 text-slate-950">
          <PlusIcon /> Nueva obra
        </button>
      </div>

      <nav className="px-3 flex-1">
        <div className="relative flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left bg-white/10 text-white">
          <span className="absolute -left-3 top-[8px] bottom-[8px] w-[3px] rounded bg-accent" />
          <span className="text-accent"><Box width={16} height={16} /></span>
          <span className="flex-1">Mis obras</span>
        </div>
      </nav>
    </aside>
  );
}
