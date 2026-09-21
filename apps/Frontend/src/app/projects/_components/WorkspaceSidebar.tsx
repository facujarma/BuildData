"use client";

import {
  LayoutHeaderCellsLarge,
  Box,
  Persons,
  Sparkles,
  Calendar,
  CircleCheck,
  Xmark,
} from "@gravity-ui/icons";
import { DAvatar } from "@/components/ui/DAvatar";

const NAV_ITEMS = [
  { id: "obras",       label: "Mis obras",          icon: <Box width={16} height={16} />,                    badge: 4 },
  { id: "compartidas", label: "Compartidas conmigo", icon: <Persons width={16} height={16} />,                badge: null },
];

const NAV_BOTTOM = [
  { id: "papelera",   label: "Papelera",    icon: <Xmark width={16} height={16} /> },
];

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

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

interface SidebarTheme {
  aside: string;
  brand: string;
  newBtn: string;
  navItem: string;
  navItemOn: string;
  navIcon: string;
  navIconOn: string;
  rail: string;
  divider: string;
  bottomItem: string;
  bottomIcon: string;
  storageWrap: string;
  storageLabel: string;
  storageBar: string;
  storageFill: string;
  storageText: string;
  storageLink: string;
  footer: string;
  footerName: string;
  footerRole: string;
  footerArrow: string;
  badge: string;
}

const THEMES: Record<string, SidebarTheme> = {
  focused: {
    aside: "bg-ink-deep text-white",
    brand: "text-white",
    newBtn: "bg-accent hover:bg-accent-700 text-slate-950",
    navItem: "text-white/70 hover:bg-white/[0.06] hover:text-white",
    navItemOn: "bg-white/10 text-white",
    navIcon: "text-white/55",
    navIconOn: "text-accent",
    rail: "bg-accent",
    divider: "border-white/10",
    bottomItem: "text-white/60 hover:bg-white/[0.06] hover:text-white",
    bottomIcon: "text-white/45",
    storageWrap: "bg-white/[0.05]",
    storageLabel: "text-white/50",
    storageBar: "bg-white/10",
    storageFill: "bg-accent",
    storageText: "text-white/60",
    storageLink: "text-accent",
    footer: "border-t border-white/10",
    footerName: "text-white",
    footerRole: "text-white/55",
    footerArrow: "text-white/55 hover:text-white",
    badge: "bg-white/20 text-white",
  },
  bright: {
    aside: "bg-paper border-r border-slate-200 text-slate-800",
    brand: "text-slate-950",
    newBtn: "bg-primary hover:bg-primary-700 text-white",
    navItem: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    navItemOn: "bg-primary-50 text-primary",
    navIcon: "text-slate-500",
    navIconOn: "text-primary",
    rail: "bg-primary",
    divider: "border-slate-200",
    bottomItem: "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
    bottomIcon: "text-slate-400",
    storageWrap: "bg-white border border-slate-200",
    storageLabel: "text-slate-500",
    storageBar: "bg-slate-200",
    storageFill: "bg-accent",
    storageText: "text-slate-600",
    storageLink: "text-primary",
    footer: "border-t border-slate-200",
    footerName: "text-slate-950",
    footerRole: "text-slate-500",
    footerArrow: "text-slate-400 hover:text-slate-700",
    badge: "bg-primary-50 text-primary",
  },
};

export function WorkspaceSidebar({
  current,
  onNav,
  onNewObra,
  mood = "focused",
}: {
  current: string;
  onNav: (id: string) => void;
  onNewObra: () => void;
  mood?: "focused" | "bright";
}) {
  const T = THEMES[mood] || THEMES.focused;

  return (
    <aside className={`w-[240px] flex flex-col flex-none ${T.aside}`}>
      <div className="px-4 py-4 flex items-center gap-[10px]">
        <LogoMark />
        <div className={`font-extrabold text-[16px] display-tight ${T.brand}`}>BuildData</div>
      </div>

      <div className="px-3 pb-3">
        <button onClick={onNewObra} className={`w-full font-bold text-[12px] rounded-md px-3 py-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${T.newBtn}`}>
          <PlusIcon /> Nueva obra
        </button>
      </div>

      <nav className="px-3 flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((s) => {
          const on = current === s.id;
          return (
            <button key={s.id} onClick={() => onNav(s.id)}
              className={`relative flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left transition-colors ${on ? T.navItemOn : T.navItem}`}>
              {on && <span className={`absolute -left-3 top-[8px] bottom-[8px] w-[3px] rounded ${T.rail}`} />}
              <span className={on ? T.navIconOn : T.navIcon}>{s.icon}</span>
              <span className="flex-1">{s.label}</span>
              {s.badge && <span className={`text-[9px] font-bold px-[6px] py-[1.5px] rounded-full ${T.badge}`}>{s.badge}</span>}
            </button>
          );
        })}

        <div className={`border-t my-3 ${T.divider}`} />

        {NAV_BOTTOM.map((s) => (
          <button key={s.id} onClick={() => onNav(s.id)}
            className={`flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left transition-colors ${T.bottomItem}`}>
            <span className={T.bottomIcon}>{s.icon}</span>
            <span className="flex-1">{s.label}</span>
          </button>
        ))}

        <div className={`mt-auto rounded-lg p-3 mt-4 mb-2 ${T.storageWrap}`}>
          <div className={`text-[9px] tracking-[0.06em] uppercase font-bold mb-2 ${T.storageLabel}`}>Almacenamiento</div>
          <div className={`h-[5px] rounded-full overflow-hidden mb-2 ${T.storageBar}`}>
            <div className={`h-full rounded-full ${T.storageFill}`} style={{ width: "42%" }} />
          </div>
          <div className={`text-[10px] ${T.storageText}`}>8,4 GB de 20 GB</div>
          <button className={`text-[10px] font-bold mt-2 hover:underline ${T.storageLink}`}>Ampliar plan →</button>
        </div>
      </nav>
    </aside>
  );
}
