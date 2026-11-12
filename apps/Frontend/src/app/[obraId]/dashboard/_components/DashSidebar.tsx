"use client";

import type React from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutHeaderCellsLarge,
  Comment,
  Calendar,
  Box,
  Car,
  CircleDollar,
  Receipt,
  Picture,
  ChartLine,
  CircleExclamation,
  CircleInfo,
  Persons,
  Gear,
  ChevronUp,
  ChevronDown,
} from "@gravity-ui/icons";
import { useDashboardData } from "./DashboardDataContext";
import { useRole } from "./RoleContext";
import { getAlertas } from "@/services/alertasService";

interface BaseItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Permiso web de la sección (las alternativas se cumplen con cualquiera). */
  permiso: string | string[];
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
  badge?: number;
  permiso: string | string[];
}

type NavEntry = NavLink | NavGroup;

function buildNavItems(obraId: string, operacionesPendientes: number, alertasAbiertas: number): NavEntry[] {
  const p = `/${obraId}/dashboard`;
  return [
    { kind: "link", id: "dashboard",  label: "Dashboard",   href: p,                              icon: <LayoutHeaderCellsLarge width={16} height={16} />, permiso: "dashboard.ver" },
    { kind: "link", id: "inbox",      label: "Bandeja",     href: `${p}/inbox`,                   icon: <Comment width={16} height={16} />,            badge: operacionesPendientes, permiso: "bandeja.ver" },
    { kind: "link", id: "cronograma", label: "Cronograma",  href: `${p}/cronograma`,              icon: <Calendar width={16} height={16} />, permiso: "cronograma.ver" },
    {
      kind: "group", id: "materiales", label: "Materiales", base: `${p}/materiales`,
      icon: <Box width={16} height={16} />,
      children: [
        { id: "pedidos",     label: "Pedidos",     icon: <Car width={14} height={14} />, permiso: "pedidos.ver" },
        { id: "stock",       label: "Stock",       icon: <Box width={14} height={14} />, permiso: "stock.ver" },
        { id: "proveedores", label: "Proveedores", icon: <Car width={14} height={14} />, permiso: "proveedores.ver" },
      ],
    },
    {
      kind: "group", id: "costos", label: "Costos", base: `${p}/costos`,
      icon: <CircleDollar width={16} height={16} />,
      children: [
        { id: "presupuesto", label: "Presupuesto",  icon: <CircleDollar width={14} height={14} />, permiso: "presupuesto.ver" },
        { id: "recibos",     label: "Comprobantes", icon: <Receipt width={14} height={14} />, permiso: "recibos.ver" },
      ],
    },
    { kind: "link", id: "alertas",    label: "Alertas",     href: `${p}/alertas`,                icon: <CircleExclamation width={16} height={16} />,   badge: alertasAbiertas, permiso: "alertas.ver" },
    {
      kind: "group", id: "registro", label: "Registro", base: `${p}/registro`,
      icon: <Picture width={16} height={16} />,
      children: [
        { id: "actividad", label: "Actividad", icon: <Comment width={14} height={14} />, permiso: "actividad.ver" },
        { id: "galeria",   label: "Galería",   icon: <Picture width={14} height={14} />, permiso: "galeria.ver" },
        { id: "reportes",  label: "Reportes",  icon: <ChartLine width={14} height={14} />, permiso: "reportes.ver" },
      ],
    },
    { kind: "link", id: "equipo",     label: "Equipo",      href: `${p}/equipo`,                 icon: <Persons width={16} height={16} />, permiso: "equipo.ver" },
  ];
}

/** ¿El rol tiene el permiso (o alguno de las alternativas)? */
function tienePermiso(
  requerido: string | string[] | undefined,
  puede: (permiso: string) => boolean,
): boolean {
  if (!requerido) return true;
  if (Array.isArray(requerido)) return requerido.some((p) => puede(p));
  return puede(requerido);
}

/**
 * Deja solo lo permitido. En los grupos se filtran los hijos y, si no queda
 * ninguno, se oculta el grupo entero (el link del grupo apunta al primer hijo
 * visible, nunca a uno oculto).
 */
function filtrarNav(navItems: NavEntry[], puede: (permiso: string) => boolean): NavEntry[] {
  const salida: NavEntry[] = [];
  for (const item of navItems) {
    if (item.kind === "group") {
      const children = item.children.filter((c) => tienePermiso(c.permiso, puede));
      if (children.length > 0) salida.push({ ...item, children });
    } else if (tienePermiso(item.permiso, puede)) {
      salida.push(item);
    }
  }
  return salida;
}

function ChildNav({ group, pathname }: { group: NavGroup; pathname: string }) {
  const sp = useSearchParams();
  const v = sp.get("v");
  const activeId = v && group.children.some((c) => c.id === v) ? v : group.children[0]?.id;
  return (
    <div className="relative pl-3 my-1 flex flex-col gap-[2px]">
      {group.children.map((c) => {
        const on = pathname.startsWith(group.base) && activeId === c.id;
        return (
          <Link
            key={c.id}
            href={`${group.base}?v=${c.id}`}
            className={`relative flex items-center gap-[9px] pl-[22px] pr-3 py-[7px] rounded-md text-[12px] font-semibold text-left transition-colors
              ${on ? "bg-white/[0.09] text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white/85"}`}
          >
            <span className={on ? "text-accent" : "text-white/40"}>{c.icon}</span>
            <span className="flex-1">{c.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function GroupItem({ group, pathname }: { group: NavGroup; pathname: string }) {
  const sp = useSearchParams();
  const v = sp.get("v");
  const activeId = v && group.children.some((c) => c.id === v) ? v : group.children[0]?.id;
  const on = pathname.startsWith(group.base);
  return (
    <div>
      <Link
        href={`${group.base}?v=${activeId}`}
        className={`relative flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left transition-colors
          ${on ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
      >
        {on && <span className="absolute -left-3 top-[8px] bottom-[8px] w-[3px] bg-accent rounded" />}
        <span className={on ? "text-accent" : "text-white/55"}>{group.icon}</span>
        <span className="flex-1">{group.label}</span>
        <span className={on ? "text-white/60" : "text-white/35"}>
          {on ? <ChevronUp width={13} height={13} /> : <ChevronDown width={13} height={13} />}
        </span>
      </Link>
      {on && <ChildNav group={group} pathname={pathname} />}
    </div>
  );
}

export function DashSidebar({
  projectLabel: explicitLabel,
}: {
  projectLabel?: string;
}) {
  const pathname = usePathname();
  const { obraName, obraProgress, obraId, operacionesPendientes } = useDashboardData();
  const { puede, loading: rolLoading } = useRole();
  const [alertasAbiertas, setAlertasAbiertas] = useState(0);
  const projectLabel = explicitLabel ?? obraName;
  const obraLoading = !projectLabel;
  const p = `/${obraId}/dashboard`;
  const verAlertas = puede("alertas.ver");
  const verConfiguracion = puede("configuracion.ver") || puede("roles.administrar");

  useEffect(() => {
    if (!obraId || !verAlertas) return;
    let active = true;
    getAlertas(obraId)
      .then((d) => {
        if (active) setAlertasAbiertas(d.alerts.filter((a) => a.state !== "resolved").length);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [obraId, verAlertas]);

  const navItems = filtrarNav(
    buildNavItems(obraId, operacionesPendientes, alertasAbiertas),
    puede,
  );

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
          {obraLoading ? (
            <>
              <div className="h-[14px] w-28 rounded bg-white/10 animate-pulse mt-[4px]" />
              <div className="h-[10px] w-16 rounded bg-white/10 animate-pulse mt-[6px]" />
            </>
          ) : (
            <>
              <div className="text-[13px] font-bold mt-[2px] truncate">{projectLabel}</div>
              <div className="text-[11px] text-white/60 mt-[1px]">{Math.round(obraProgress)}% completa</div>
            </>
          )}
        </div>
        <Link
          href="/projects"
          className="mt-2 flex w-full items-center  gap-[6px] text-[11px] font-bold tracking-[0.04em] text-white/70 bg-white/[0.06] hover:bg-white/[0.12] hover:text-white rounded-md px-[10px] py-[6px] transition-colors"
        >
          <span className="text-[14px] leading-none">←</span> Mis obras
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-3 flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
        {rolLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[32px] rounded-md bg-white/[0.06] animate-pulse" />
            ))
          : navItems.map((s) => {
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

          return (
            <Suspense key={s.id} fallback={null}>
              <GroupItem group={s} pathname={pathname} />
            </Suspense>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-2 pt-1 flex flex-col gap-1">
        {verConfiguracion && (
          <Link
            href={`${p}/configuracion`}
            className={`flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold transition-colors ${isActive(`${p}/configuracion`) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
          >
            <span className={isActive(`${p}/configuracion`) ? "text-accent" : "text-white/55"}><Gear width={16} height={16} /></span>
            <span className="flex-1">Configuración</span>
          </Link>
        )}
        <button
          type="button"
          className="flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <span className="text-white/55"><CircleInfo width={16} height={16} /></span>
          <span className="flex-1">Ayuda y soporte</span>
        </button>
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
