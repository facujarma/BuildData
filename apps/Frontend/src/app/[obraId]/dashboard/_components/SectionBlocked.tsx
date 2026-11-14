"use client";

import { Lock, CircleExclamation } from "@gravity-ui/icons";
import { useRole } from "./RoleContext";
import { labelPermiso } from "./permisosSecciones";

/** Texto de `title` para un control que se deja deshabilitado en vez de oculto. */
export function tituloBloqueado(permiso: string, rolNombre?: string | null): string {
  const quien = rolNombre ? `Tu rol ${rolNombre}` : "Tu rol";
  return `${quien} no tiene el permiso "${labelPermiso(permiso)}". Pedile a un Director que lo habilite en Configuración → Roles y permisos.`;
}

/**
 * Cartel que reemplaza a una sección cuando el rol no tiene el permiso de
 * entrada. Se usa en el layout (URL directa a una sección prohibida) y en las
 * pestañas internas de Configuración.
 */
export function SectionBlocked({ permiso }: { permiso?: string | null }) {
  const { rol } = useRole();
  const nombreRol = rol?.nombre;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-none">
          <Lock width={18} height={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-slate-950">Sección bloqueada</h2>
          {permiso ? (
            <p className="text-[13px] text-slate-600 mt-1">
              Tu rol{" "}
              <b className="text-slate-950 font-bold">{nombreRol || "sin rol asignado"}</b> no tiene el
              permiso <b className="text-slate-950 font-bold">{labelPermiso(permiso)}</b>.
              <span className="block mt-1 text-[12px] text-slate-500">
                Pedile a un Director que lo habilite en Configuración → Roles y permisos.
              </span>
            </p>
          ) : (
            <p className="text-[13px] text-slate-600 mt-1">
              Tu rol{" "}
              <b className="text-slate-950 font-bold">{nombreRol || "sin rol asignado"}</b> no tiene
              acceso a esta sección.
              <span className="block mt-1 text-[12px] text-slate-500">
                Pedile a un Director que lo habilite en Configuración → Roles y permisos.
              </span>
            </p>
          )}
          {permiso && (
            <code className="inline-block mt-3 text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-[2px]">
              {permiso}
            </code>
          )}
        </div>
      </div>
    </div>
  );
}

/** Estado de error al cargar el rol (403 sin membresía, red caída, 500…). */
export function RoleErrorCard({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-lg bg-critical-50 text-[#B91C1C] flex items-center justify-center flex-none">
          <CircleExclamation width={18} height={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-slate-950">No pudimos cargar tus permisos</h2>
          <p className="text-[13px] text-slate-600 mt-1">
            {error.message || "Probá de nuevo en unos segundos."}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-[12px] font-bold text-primary hover:underline"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Aviso chico y reutilizable para una acción que no se puede ocultar de forma
 * limpia (se deja el control `disabled` con este texto o con `tituloBloqueado`).
 */
export function ActionBlocked({ permiso, className = "" }: { permiso: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 ${className}`}
    >
      <Lock width={11} height={11} />
      Necesitás el permiso {labelPermiso(permiso)}
    </span>
  );
}
