"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutHeaderCellsLarge,
  Persons,
  Layers,
  Database,
  Bell,
  CircleDollar,
  Shield,
  Lock,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { RolesPermisosSection } from "./RolesPermisosSection";
import { SectionComingSoon } from "../../_components/SectionBlocked";
import { useRole } from "../../_components/RoleContext";

/**
 * Configuración: por ahora solo existe "Roles y permisos", que es la única
 * pestaña con datos y acciones reales. El resto está marcado como bloqueado
 * a propósito — no mostramos formularios de ejemplo que no persisten nada.
 */
interface TabDef {
  id: string;
  label: string;
  icon: ReactNode;
  permiso: string;
  disponible: boolean;
  detalle: string;
}

const TABS: TabDef[] = [
  {
    id: "roles",
    label: "Roles y permisos",
    icon: <Persons width={14} height={14} />,
    permiso: "roles.administrar",
    disponible: true,
    detalle: "",
  },
  {
    id: "obra",
    label: "Datos de la obra",
    icon: <LayoutHeaderCellsLarge width={14} height={14} />,
    permiso: "configuracion.ver",
    disponible: false,
    detalle:
      "Va a permitir editar nombre, código, tipo, estado, dirección y fechas de la obra. Mientras tanto, esos datos se editan desde Mis obras → Editar obra.",
  },
  {
    id: "taxonomia",
    label: "Rubros y categorías",
    icon: <Layers width={14} height={14} />,
    permiso: "configuracion.ver",
    disponible: false,
    detalle:
      "Va a concentrar el alta y la edición de rubros y categorías de la obra.",
  },
  {
    id: "integraciones",
    label: "Integraciones",
    icon: <Database width={14} height={14} />,
    permiso: "configuracion.ver",
    disponible: false,
    detalle:
      "Excel, Google Drive/Calendar, Slack y ERPs todavía no tienen conexión implementada.",
  },
  {
    id: "notificaciones",
    label: "Notificaciones",
    icon: <Bell width={14} height={14} />,
    permiso: "configuracion.ver",
    disponible: false,
    detalle:
      "Preferencias de email y WhatsApp: hoy la app no envía notificaciones, así que no hay nada que configurar.",
  },
  {
    id: "plan",
    label: "Plan y facturación",
    icon: <CircleDollar width={14} height={14} />,
    permiso: "configuracion.ver",
    disponible: false,
    detalle:
      "Suscripción, método de cobro e historial de facturas: todavía no existe facturación dentro de la app.",
  },
  {
    id: "seguridad",
    label: "Seguridad",
    icon: <Shield width={14} height={14} />,
    permiso: "configuracion.ver",
    disponible: false,
    detalle:
      "Sesiones activas, cambio de contraseña y eliminación de la obra van a llegar en una próxima versión.",
  },
];

export function ScreenConfiguracion() {
  const [tab, setTab] = useState("roles");
  const { puede } = useRole();

  const navVisible = TABS.filter((t) => puede(t.permiso));
  const tabActiva = navVisible.some((t) => t.id === tab) ? tab : navVisible[0]?.id;

  return (
    <>
      <DPageHeader
        title="Configuración"
        subtitle="Roles, permisos y datos de la obra."
      />

      <div className="grid grid-cols-[220px_1fr] gap-6 items-start">
        <nav className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col gap-[2px] sticky top-2">
          {navVisible.map((x) => {
            const on = tabActiva === x.id;
            return (
              <button
                key={x.id}
                onClick={() => setTab(x.id)}
                className={`flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left transition-colors ${
                  on ? "bg-primary-50 text-primary" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={on ? "text-primary" : "text-slate-500"}>{x.icon}</span>
                <span className="flex-1">{x.label}</span>
                {!x.disponible && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 rounded-full px-[6px] py-[2px]">
                    <Lock width={9} height={9} />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-4">
          {tabActiva === "roles" && <RolesPermisosSection />}
          {navVisible.map(
            (x) =>
              tabActiva === x.id &&
              !x.disponible && (
                <SectionComingSoon key={x.id} title={x.label} detalle={x.detalle} />
              ),
          )}
        </div>
      </div>
    </>
  );
}
