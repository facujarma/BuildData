"use client";

import type React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutHeaderCellsLarge,
  Envelope,
  Calendar,
  Box,
  Cubes3,
  Car,
  ChartBar,
  Receipt,
  Clock,
  Picture,
  ChartLine,
  CircleExclamation,
  Persons,
  Gear,
  Person,
  ChevronLeft,
  ChevronDown,
  ArrowRightFromSquare,
} from "@gravity-ui/icons";
import { useDashboardData } from "./DashboardDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { DAvatar } from "@/components/ui/DAvatar";

interface BaseItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  kind: "group";
  id: string;
  label: string;
  base: string;
  icon: React.ReactNode;
  children: BaseItem[];
}

interface NavLink {
  kind: "link";
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

type NavEntry = NavLink | NavGroup;

function buildNavItems(obraId: string): NavEntry[] {
  const p = `/${obraId}/dashboard`;
  return [
    { kind: "link", id: "dashboard",  label: "Dashboard",   href: p,                              icon: <LayoutHeaderCellsLarge width={16} height={16} /> },
    { kind: "link", id: "inbox",      label: "Bandeja",     href: `${p}/inbox`,                   icon: <Envelope width={16} height={16} />,            badge: 3 },
    { kind: "link", id: "cronograma", label: "Cronograma",  href: `${p}/cronograma`,              icon: <Calendar width={16} height={16} /> },
    {
      kind: "group", id: "materiales", label: "Materiales", base: `${p}/materiales`,
      icon: <Box width={16} height={16} />,
      children: [
        { id: "pedidos",     label: "Pedidos",     icon: <Box width={13} height={13} /> },
        { id: "stock",       label: "Stock",       icon: <Cubes3 width={13} height={13} /> },
        { id: "proveedores", label: "Proveedores", icon: <Car width={13} height={13} /> },
      ],
    },
    {
      kind: "group", id: "costos", label: "Costos", base: `${p}/costos`,
      icon: <ChartBar width={16} height={16} />,
      children: [
        { id: "presupuesto", label: "Presupuesto",  icon: <ChartBar width={13} height={13} /> },
        { id: "recibos",     label: "Comprobantes", icon: <Receipt width={13} height={13} /> },
      ],
    },
    { kind: "link", id: "alertas",    label: "Alertas",     href: `${p}/alertas`,                icon: <CircleExclamation width={16} height={16} />,   badge: 2 },
    {
      kind: "group", id: "registro", label: "Registro", base: `${p}/registro`,
      icon: <Picture width={16} height={16} />,
      children: [
        { id: "actividad", label: "Actividad", icon: <Clock width={13} height={13} /> },
        { id: "galeria",   label: "Galería",   icon: <Picture width={13} height={13} /> },
        { id: "reportes",  label: "Reportes",  icon: <ChartLine width={13} height={13} /> },
      ],
    },
    { kind: "link", id: "equipo",     label: "Equipo",      href: `${p}/equipo`,                 icon: <Persons width={16} height={16} /> },
  ];
}

function ChildNav({ group, pathname }: { group: NavGroup; pathname: string }) {
  const sp = useSearchParams();
  const v = sp.get("v");
  return (
    <div className="pl-[10px] mt-1 ml-6 border-l border-white/10 flex flex-col gap-[2px]">
      {group.children.map((c) => {
        const href = `${group.base}?v=${c.id}`;
        const on = pathname.startsWith(group.base) && v === c.id;
        return (
          <Link
            key={c.id}
            href={href}
            className={`flex items-center gap-[8px] px-2 py-[6px] rounded-md text-[11px] font-medium transition-colors
              ${on ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white"}`}
          >
            <span className={on ? "text-accent" : "text-white/45"}>{c.icon}</span>
            <span>{c.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function DashSidebar({
  projectLabel: explicitLabel,
}: {
  projectLabel?: string;
}) {
  const pathname = usePathname();
  const { obraName, obraProgress, obraId } = useDashboardData();
  const { profile, logout } = useAuth();
  const projectLabel = explicitLabel ?? (obraName || "Edificio Belgrano");
  const navItems = buildNavItems(obraId);
  const p = `/${obraId}/dashboard`;
  const nombre = (profile?.nombre as string | undefined)?.trim() || "Usuario";

  const isGroupOn = (g: NavGroup) => pathname.startsWith(g.base);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-[220px] bg-ink-deep text-white flex flex-col flex-none">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-[10px]">
        <LogoMark />
        <div className="font-extrabold text-[16px] display-tight">BuildData</div>
      </div>

      {/* Project */}
      <div className="px-3 pb-3">
        <div className="bg-white/[0.06] rounded-lg px-3 py-[10px]">
          <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/50">
            Obra activa
          </div>
          <div className="text-[13px] font-bold mt-[2px] truncate">{projectLabel}</div>
          {obraProgress > 0 ? (
            <>
              <div className="text-[11px] text-white/60 mt-[1px]">{Math.round(obraProgress)}% completa</div>
              <div className="h-[3px] rounded-full bg-white/10 mt-[6px] overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${Math.min(100, obraProgress)}%` }} />
              </div>
            </>
          ) : (
            <div className="text-[11px] text-white/60 mt-[1px]">0% completa</div>
          )}
        </div>
        <Link href="/projects" className="flex items-center rounded-md mt-4 font-semibold text-white/70 hover:text-white transition-colors">
          <ChevronLeft width={10} height={10} className="text-white/55" />
          <span className="flex-1 text-[10px]">Volver a mis obras</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-3 flex-1 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((s) => {
          if (s.kind === "link") {
            const on = isActive(s.href);
            return (
              <Link
                key={s.id}
                href={s.href}
                className={`relative flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left transition-colors
                  ${on ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
              >
                {on && <span className="absolute -left-3 top-[8px] bottom-[8px] w-[3px] bg-accent rounded" />}
                <span className={on ? "text-accent" : "text-white/55"}>{s.icon}</span>
                <span className="flex-1">{s.label}</span>
                {s.badge ? (
                  <span className={`text-[9px] font-bold px-[6px] py-[1.5px] rounded-full ${s.id === "alertas" ? "bg-critical text-white" : "bg-white/20 text-white"}`}>
                    {s.badge}
                  </span>
                ) : null}
              </Link>
            );
          }

          const on = isGroupOn(s);
          return (
            <div key={s.id}>
              <Link
                href={`${s.base}?v=${s.children[0].id}`}
                className={`relative flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left transition-colors
                  ${on ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
              >
                {on && <span className="absolute -left-3 top-[8px] bottom-[8px] w-[3px] bg-accent rounded" />}
                <span className={on ? "text-accent" : "text-white/55"}>{s.icon}</span>
                <span className="flex-1">{s.label}</span>
                <span className="text-white/35"><ChevronDown width={12} height={12} /></span>
              </Link>
              {on && (
                <Suspense fallback={null}>
                  <ChildNav group={s} pathname={pathname} />
                </Suspense>
              )}
            </div>
          );
        })}
      </nav>

      {/* Settings + Perfil */}
      <div className="px-3 pb-2 pt-1 flex flex-col gap-1">
        <Link
          href={`${p}/configuracion`}
          className={`flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold transition-colors ${isActive(`${p}/configuracion`) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
        >
          <span className={isActive(`${p}/configuracion`) ? "text-accent" : "text-white/55"}><Gear width={16} height={16} /></span>
          <span className="flex-1">Configuración</span>
        </Link>
        <Link
          href={`${p}/perfil`}
          className={`flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold transition-colors ${isActive(`${p}/perfil`) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
        >
          <span className={isActive(`${p}/perfil`) ? "text-accent" : "text-white/55"}><Person width={16} height={16} /></span>
          <span className="flex-1">Mi perfil</span>
        </Link>
      </div>

      {/* Footer user */}
      <div className="px-3 pb-3 pt-1 border-t border-white/10">
        <div className="flex items-center gap-[10px] px-2 py-[7px] rounded-lg">
          <DAvatar size={32} />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold truncate">{nombre}</div>
            <div className="text-[10px] text-white/55">Administrador</div>
          </div>
          <button
            onClick={() => void logout()}
            title="Cerrar sesión"
            className="text-white/50 hover:text-critical transition-colors flex-none"
          >
            <ArrowRightFromSquare width={15} height={15} />
          </button>
        </div>
      </div>
    </aside>
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