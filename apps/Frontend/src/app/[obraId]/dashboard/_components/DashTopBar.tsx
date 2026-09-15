"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Magnifier } from "@gravity-ui/icons";
import { QuickAddMenu } from "./QuickAddMenu";
import { NotificationsPanel } from "./NotificationsPanel";
import { AvatarMenu } from "@/components/ui/AvatarMenu";
import { useDashboardData } from "./DashboardDataContext";

const CRUMB_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  cronograma: "Cronograma",
  alertas: "Alertas",
  materiales: "Materiales",
  costos: "Costos",
  registro: "Registro",
  inbox: "Bandeja",
  configuracion: "Configuración",
  perfil: "Mi perfil",
  equipo: "Equipo",
};

const SUB_MAP: Record<string, string> = {
  pedidos: "Pedidos",
  stock: "Stock",
  presupuesto: "Presupuesto",
  recibos: "Comprobantes",
  actividad: "Actividad",
  galeria: "Galería",
  reportes: "Reportes",
};

function Crumb() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const crumb = CRUMB_MAP[segment] || "Dashboard";
  const sub = SUB_MAP[sp.get("v") || ""];
  return (
    <div className="text-[12px] text-slate-500">
      {crumb}
      {sub ? (
        <>
          <span className="mx-2 text-slate-300">/</span>
          <b className="text-slate-950">{sub}</b>
        </>
      ) : null}
    </div>
  );
}

export function DashTopBar({
  onQuickAdd,
}: {
  onQuickAdd?: (kind: string) => void;
}) {
  const { obraName } = useDashboardData();

  return (
    <header className="h-[52px] px-5 border-b border-slate-200 bg-white/85 backdrop-blur flex items-center justify-between gap-3 flex-none">
      <div className="text-[12px] text-slate-500 min-w-0 truncate">
        {obraName || "Obra"}
        <span className="mx-2 text-slate-300">/</span>
        <Suspense fallback={null}>
          <Crumb />
        </Suspense>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 w-[260px] bg-white border border-slate-200 rounded-md px-3 py-[6px] text-[12px] text-slate-500 focus-within:border-primary transition-colors">
          <Magnifier width={14} height={14} className="text-slate-400" />
          <input type="text" placeholder="Buscar tareas, pedidos, personas…" className="w-full bg-transparent focus:outline-none" />
          <kbd className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded px-[5px] py-[1px] flex-none">⌘K</kbd>
        </div>
        {onQuickAdd && <QuickAddMenu onPick={onQuickAdd} />}
        <NotificationsPanel />
        <AvatarMenu />
      </div>
    </header>
  );
}