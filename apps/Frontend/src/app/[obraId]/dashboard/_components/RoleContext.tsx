"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMiRol,
  type MiRol,
  type PermisosMiRol,
  type RolActual,
} from "@/services/rolesService";

export interface RoleContextValue {
  rol: RolActual | null;
  permisos: PermisosMiRol | null;
  loading: boolean;
  /** Error de `GET /obras/:obraId/mi-rol` (403 si no es miembro, 500, red…). */
  error: Error | null;
  /** `true` solo si el permiso web está explícitamente habilitado. */
  puede: (permisoWeb: string) => boolean;
  /** Vuelve a pedir el rol (después de editar roles, o al reintentar un error). */
  refresh: () => void;
}

export const RoleContext = createContext<RoleContextValue | null>(null);

interface Estado {
  /** Obra a la que corresponde `data`: si no es la activa, se sigue cargando. */
  obraId: string | null;
  loading: boolean;
  data: MiRol | null;
  error: Error | null;
}

export function RoleProvider({ obraId, children }: { obraId: string; children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({
    obraId: null,
    loading: true,
    data: null,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let activo = true;
    getMiRol(obraId)
      .then((data) => {
        if (activo) setEstado({ obraId, loading: false, data, error: null });
      })
      .catch((error: unknown) => {
        if (!activo) return;
        // Fail closed: sin permisos cargados el dashboard no habilita secciones
        // ni acciones, pero tampoco se rompe (el layout muestra el cartel).
        setEstado({
          obraId,
          loading: false,
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
    return () => {
      activo = false;
    };
  }, [obraId, nonce]);

  // Al cambiar de obra los datos previos ya no valen: se muestra el skeleton
  // hasta que llega la respuesta de la obra nueva (sin setState en el effect).
  const loading = estado.loading || estado.obraId !== obraId;

  const refresh = useCallback(() => {
    setEstado((prev) => ({ ...prev, loading: true, error: null }));
    setNonce((n) => n + 1);
  }, []);

  // Mientras carga devuelve false: evita el flash de botones que después
  // desaparecen. Un permiso desconocido también da false (fail closed).
  const puede = useCallback(
    (permisoWeb: string) => !loading && estado.data?.permisos.webMap?.[permisoWeb] === true,
    [loading, estado.data],
  );

  const rol = loading ? null : (estado.data?.rol ?? null);
  const permisos = loading ? null : (estado.data?.permisos ?? null);

  const valor = useMemo<RoleContextValue>(
    () => ({
      rol,
      permisos,
      loading,
      error: estado.error,
      puede,
      refresh,
    }),
    [rol, permisos, loading, estado.error, puede, refresh],
  );

  return <RoleContext.Provider value={valor}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole() tiene que usarse dentro de <RoleProvider> (layout del dashboard)");
  }
  return ctx;
}
