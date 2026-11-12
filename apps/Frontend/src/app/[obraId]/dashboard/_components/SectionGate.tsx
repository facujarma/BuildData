"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRole } from "./RoleContext";
import { RoleErrorCard, SectionBlocked } from "./SectionBlocked";
import { permisoDeRuta, permisoFaltante } from "./permisosSecciones";

/** Placeholder del layout mientras se resuelven el rol y los permisos. */
export function SectionSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="shimmer h-7 w-56 rounded-md" />
      <div className="shimmer h-4 w-80 rounded-md" />
      <div className="shimmer h-[160px] w-full rounded-xl" />
    </div>
  );
}

/**
 * Gate de sección del dashboard. Se monta en el layout y decide, según la ruta
 * (`?v=` incluido) y los permisos `web` del rol, si renderiza la pantalla o un
 * cartel. Sin permisos cargados no pinta children: así una sección prohibida no
 * dispara sus requests por URL directa.
 *
 * Vive fuera de `layout.tsx` para poder testearse sin arrastrar el layout
 * completo (ProtectedRoute, providers, quick-add, chat…).
 */
export function SectionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const { loading, error, puede, refresh } = useRole();

  if (loading) return <SectionSkeleton />;
  if (error) return <RoleErrorCard error={error} onRetry={refresh} />;

  const requerido = permisoDeRuta(pathname, sp.get("v"));
  const falta = permisoFaltante(requerido, puede);
  if (falta) return <SectionBlocked permiso={falta} />;

  return <>{children}</>;
}
