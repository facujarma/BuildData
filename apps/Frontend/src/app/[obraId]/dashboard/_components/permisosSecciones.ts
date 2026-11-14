// Mapa ruta → permiso web de sección. Es la única fuente de verdad del gate del
// dashboard (layout) y del filtrado del sidebar: si se agrega una sección nueva,
// se toca acá y en `buildNavItems`.
//
// `pathname` es el de `usePathname()` (incluye el obraId: /<obraId>/dashboard/…);
// `v` es el query param que usan las secciones con sub-tabs (?v=stock).

/** Un permiso, una lista de alternativas (basta una) o `null` = sin requisito. */
export type PermisoRuta = string | string[] | null;

/** Texto humano del permiso, para el cartel de bloqueo y los `title`. */
export const LABEL_PERMISO: Record<string, string> = {
  "dashboard.ver": "ver el dashboard",
  "bandeja.ver": "ver la bandeja",
  "bandeja.aprobar": "aprobar operaciones",
  "equipo.ver": "ver el equipo",
  "equipo.administrar": "administrar el equipo",
  "configuracion.ver": "ver configuración",
  "configuracion.editar": "editar la configuración",
  "roles.administrar": "administrar roles y permisos",
  "cronograma.ver": "ver el cronograma",
  "cronograma.editar": "editar el cronograma",
  "actividad.ver": "ver la actividad",
  "actividad.registrar": "registrar actividad",
  "galeria.ver": "ver la galería",
  "galeria.gestionar": "gestionar la galería",
  "reportes.ver": "ver reportes",
  "reportes.exportar": "generar y exportar reportes",
  "pedidos.ver": "ver pedidos",
  "pedidos.crear": "crear pedidos",
  "pedidos.aprobar": "aprobar pedidos",
  "pedidos.entregar": "entregar pedidos",
  "stock.ver": "ver stock",
  "stock.ajustar": "ajustar stock y materiales",
  "proveedores.ver": "ver proveedores",
  "proveedores.gestionar": "gestionar proveedores",
  "presupuesto.ver": "ver el presupuesto",
  "presupuesto.editar": "editar el presupuesto",
  "recibos.ver": "ver comprobantes",
  "recibos.gestionar": "gestionar comprobantes",
  "alertas.ver": "ver alertas",
  "alertas.gestionar": "gestionar alertas",
};

export function labelPermiso(permiso: string): string {
  return LABEL_PERMISO[permiso] || permiso;
}

/** Saca el `/<obraId>/dashboard` del pathname y normaliza la barra final. */
function seccionDe(pathname: string): string {
  const marca = "/dashboard";
  const i = pathname.indexOf(marca);
  const sinBarras = (i === -1 ? pathname : pathname.slice(i + marca.length)).replace(/\/+$/, "");
  // Fuera del dashboard no hay sección: no se inventa un requisito.
  if (i === -1) return sinBarras;
  return sinBarras === "" ? "/dashboard" : sinBarras;
}

function subSeccion(v: string | null | undefined, validas: string[], porDefecto: string): string {
  return v && validas.includes(v) ? v : porDefecto;
}

export function permisoDeRuta(pathname: string, v?: string | null): PermisoRuta {
  const s = seccionDe(pathname);

  if (s === "/perfil") return null;
  if (s === "/dashboard") return "dashboard.ver";
  if (s === "/inbox" || s.startsWith("/inbox/")) return "bandeja.ver";
  if (s === "/cronograma" || s.startsWith("/cronograma/")) return "cronograma.ver";
  if (s === "/alertas" || s.startsWith("/alertas/")) return "alertas.ver";
  if (s === "/equipo" || s.startsWith("/equipo/")) return "equipo.ver";

  if (s === "/materiales" || s.startsWith("/materiales/")) {
    switch (subSeccion(v, ["pedidos", "stock", "proveedores"], "pedidos")) {
      case "stock":
        return "stock.ver";
      case "proveedores":
        return "proveedores.ver";
      default:
        return "pedidos.ver";
    }
  }

  if (s === "/costos" || s.startsWith("/costos/")) {
    return subSeccion(v, ["presupuesto", "recibos"], "presupuesto") === "recibos"
      ? "recibos.ver"
      : "presupuesto.ver";
  }

  if (s === "/registro" || s.startsWith("/registro/")) {
    switch (subSeccion(v, ["actividad", "galeria", "reportes"], "actividad")) {
      case "galeria":
        return "galeria.ver";
      case "reportes":
        return "reportes.ver";
      default:
        return "actividad.ver";
    }
  }

  // Configuración se abre con cualquiera de los dos: los tabs internos se
  // filtran uno por uno (Obra → configuracion.ver, Roles → roles.administrar).
  if (s === "/configuracion" || s.startsWith("/configuracion/")) {
    return ["configuracion.ver", "roles.administrar"];
  }

  return null;
}

/** ¿Alcanza con `puede` para el requisito de la ruta? (lista = cualquiera). */
export function puedeSeccion(requerido: PermisoRuta, puede: (permiso: string) => boolean): boolean {
  if (!requerido) return true;
  if (Array.isArray(requerido)) return requerido.some((p) => puede(p));
  return puede(requerido);
}

/**
 * Primer permiso que falta para la ruta (para el cartel). `null` = la sección
 * está permitida o no exige permiso.
 */
export function permisoFaltante(
  requerido: PermisoRuta,
  puede: (permiso: string) => boolean,
): string | null {
  if (!requerido) return null;
  const lista = Array.isArray(requerido) ? requerido : [requerido];
  if (lista.some((p) => puede(p))) return null;
  return lista[0];
}
