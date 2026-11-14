// Roles y permisos del bot WhatsApp.
//
// Espejo de apps/Backend/services/permisos.service.js (y de roles.service.js): el
// Backend es la barrera dura y este módulo da el mensaje claro antes de registrar
// la operación. Si se cambia un rol o una capacidad, cambiar los dos archivos.
//
// Hay dos fuentes, en este orden:
// 1. `Obra.permisos`: las keys bot que el Backend resuelve para esa persona en
//    esa obra (roles_obra). Incluye roles personalizados y permisos editados
//    desde la web, así que manda sobre la matriz estática.
// 2. `PERMISOS`: matriz estática por defecto, solo como fallback cuando el
//    backend todavía no manda la lista. El rol libre se normaliza con
//    normalizarRol(); cualquier valor desconocido cae en "Obrero" (mínimo
//    privilegio).

export type RolBot =
  | "Cliente"
  | "Obrero"
  | "Seguridad e Higiene"
  | "Capataz"
  | "Administrativo"
  | "Director";

// Orden ascendente por nivel, igual que ROLES_SISTEMA del Backend.
export const ROLES: RolBot[] = [
  "Cliente",
  "Obrero",
  "Seguridad e Higiene",
  "Capataz",
  "Administrativo",
  "Director",
];

// Capacidad → roles habilitados. Matriz **bot** por defecto de
// docs/roles-permisos.md (los seis roles de sistema).
export const PERMISOS: Record<string, RolBot[]> = {
  "stock.registrar": ["Obrero", "Capataz", "Director"],
  "stock.ajustar": ["Capataz", "Administrativo", "Director"],
  "gasto.crear": ["Obrero", "Capataz", "Administrativo", "Director"],
  "pedido.crear": ["Capataz", "Administrativo", "Director"],
  "pedido.entregar": ["Capataz", "Director"],
  "tarea.crear": ["Obrero", "Seguridad e Higiene", "Capataz", "Director"],
  "tarea.completar": ["Obrero", "Capataz", "Director"],
  "retraso.registrar": ["Obrero", "Seguridad e Higiene", "Capataz", "Director"],
  "alerta.crear": ["Obrero", "Seguridad e Higiene", "Capataz", "Director"],
  "foto.subir": ["Obrero", "Seguridad e Higiene", "Capataz", "Administrativo", "Director"],
};

export const PERMISO_LABELS: Record<string, string> = {
  "stock.registrar": "registrar movimientos de stock",
  "stock.ajustar": "ajustar stock",
  "gasto.crear": "cargar gastos",
  "pedido.crear": "crear pedidos de compra",
  "pedido.entregar": "marcar pedidos como entregados",
  "tarea.crear": "reportar tareas",
  "tarea.completar": "completar tareas",
  "retraso.registrar": "registrar retrasos",
  "alerta.crear": "generar alertas",
  "foto.subir": "subir fotos a la galería",
};

// Endpoint de operación del bot → capacidad. Fail closed: un endpoint sin mapear
// no se puede ejecutar.
export const ENDPOINT_PERMISOS: Record<string, string> = {
  "/bot/stock": "stock.registrar",
  "/bot/stock/ajuste": "stock.ajustar",
  "/bot/gastos": "gasto.crear",
  "/bot/pedidoDeCompra": "pedido.crear",
  "/bot/pedidos/entregar": "pedido.entregar",
  "/bot/tareas": "tarea.crear",
  "/bot/tareas/:id/completar": "tarea.completar",
  "/bot/retraso": "retraso.registrar",
  "/bot/alertas": "alerta.crear",
  "/bot/galeria": "foto.subir",
};

function sinAcentos(texto: string | null | undefined): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Mapea el rol libre que se carga desde la web (y los valores viejos: "Director
// de obra", "Compras", "Seguridad e higiene", etc.) a uno de los seis roles de
// sistema. Mismo mapeo y mismo orden que el Backend: "Cliente" ya no cae en
// Director y "Compras" ahora es Administrativo.
export function normalizarRol(rol: string | null | undefined): RolBot {
  const texto = sinAcentos(rol);
  if (!texto) return "Obrero";
  if (/client/.test(texto)) return "Cliente";
  if (/(seguridad|higiene|\bsst\b|\bhse\b)/.test(texto)) return "Seguridad e Higiene";
  if (/(administrativ|administracion|compras|oficina|contable|tesorer)/.test(texto)) {
    return "Administrativo";
  }
  if (/(capataz|jefe|supervisor|encargado)/.test(texto)) return "Capataz";
  if (/(director|duen|gerente|arquitect|ingenier|socio|propietari)/.test(texto)) {
    return "Director";
  }
  return "Obrero";
}

export function puede(rol: string | null | undefined, permiso: string): boolean {
  const normalizado = normalizarRol(rol);
  return (PERMISOS[permiso] ?? []).includes(normalizado);
}

// Permiso efectivo de una obra. Si el Backend manda `permisos` (array, aunque
// esté vacío) esa lista es la verdad: un array vacío significa "no puede nada".
// Solo sin lista (backend viejo) se usa la matriz estática del rol.
export function puedeConPermisos(
  permisos: string[] | undefined,
  permiso: string,
  rolFallback: string | null | undefined,
): boolean {
  if (Array.isArray(permisos)) return permisos.includes(permiso);
  return puede(rolFallback, permiso);
}

export function puedeOperar(rol: string | null | undefined, endpoint: string): boolean {
  const permiso = ENDPOINT_PERMISOS[endpoint];
  if (!permiso) return false;
  return puede(rol, permiso);
}

export function puedeOperarConPermisos(
  permisos: string[] | undefined,
  endpoint: string,
  rolFallback: string | null | undefined,
): boolean {
  const permiso = ENDPOINT_PERMISOS[endpoint];
  if (!permiso) return false;
  return puedeConPermisos(permisos, permiso, rolFallback);
}

export function permisoDeEndpoint(
  endpoint: string,
): { permiso: string; label: string } | null {
  const permiso = ENDPOINT_PERMISOS[endpoint];
  if (!permiso) return null;
  return { permiso, label: PERMISO_LABELS[permiso] ?? permiso };
}

export function permisosDe(rol: string | null | undefined): { permiso: string; label: string }[] {
  const normalizado = normalizarRol(rol);
  return Object.entries(PERMISOS)
    .filter(([, roles]) => roles.includes(normalizado))
    .map(([permiso]) => ({ permiso, label: PERMISO_LABELS[permiso] ?? permiso }));
}

// Permisos bot de una obra para mostrarlos en `!rol`: la lista efectiva del
// Backend si viene, la matriz estática del rol si no. Se respeta el orden del
// catálogo y se descartan las keys que el bot todavía no conoce (no tienen
// label). Un array vacío devuelve [] (rol sin permisos de WhatsApp).
export function permisosDeObra(
  obra: { rol?: string | null; permisos?: string[] } | null | undefined,
): { permiso: string; label: string }[] {
  const efectivos = obra?.permisos;
  if (!Array.isArray(efectivos)) return permisosDe(obra?.rol);
  return Object.keys(PERMISOS)
    .filter((permiso) => efectivos.includes(permiso))
    .map((permiso) => ({ permiso, label: PERMISO_LABELS[permiso] ?? permiso }));
}

// Fuente de los permisos de la obra: los configurados en `roles_obra` (los manda
// el Backend) o la matriz estática del rol como fallback de un backend viejo.
// `!rol` lo muestra para que se entienda de dónde salen las capacidades.
export function origenPermisosDeObra(
  obra: { permisos?: string[] } | null | undefined,
): "obra" | "matriz" {
  return Array.isArray(obra?.permisos) ? "obra" : "matriz";
}

// Nombre de rol para mostrar (`!rol` y el aviso de bloqueo). El Backend manda el
// nombre canónico — rol de sistema o nombre del rol personalizado de la obra —,
// así que se muestra tal cual. Solo sin `permisos` (backend viejo) el valor es el
// texto libre original y se muestra el equivalente normalizado.
export function nombreRolVisible(
  rol: string | null | undefined,
  permisos?: string[],
): string {
  const crudo = String(rol ?? "").replace(/\s+/g, " ").trim();
  if (!crudo) return normalizarRol(crudo);
  if (Array.isArray(permisos)) return crudo;
  return normalizarRol(crudo);
}

// ─────────────────────────────────────────────────────────────
// Compatibilidad con el Backend (shims estáticos)
// ─────────────────────────────────────────────────────────────
// El bot no aprueba operaciones ni administra equipo: esas decisiones son de la
// web y se resuelven con los permisos dinámicos `bandeja.aprobar` /
// `equipo.administrar` (Backend). Se mantienen por paridad con
// apps/Backend/services/permisos.service.js, que los conserva como compat.

// Compat: la política real es el permiso web `bandeja.aprobar`, que también
// habilita a Administrativo.
export function puedeAprobar(rol: string | null | undefined): boolean {
  return ["Capataz", "Director"].includes(normalizarRol(rol));
}

// Compat: la política real es el permiso web `equipo.administrar`.
export function puedeAdministrarEquipo(rol: string | null | undefined): boolean {
  return normalizarRol(rol) === "Director";
}

// Nivel de jerarquía, espejo de ROLES_SISTEMA.nivel del Backend: nadie puede
// otorgar un rol de nivel mayor al propio.
const NIVEL_ROL: Record<RolBot, number> = {
  Cliente: 5,
  Obrero: 10,
  "Seguridad e Higiene": 25,
  Capataz: 30,
  Administrativo: 60,
  Director: 100,
};

// Jerarquía: solo se puede otorgar un rol de nivel igual o menor al propio.
// Fail closed: sin rol administrador, no se asigna nada.
export function puedeAsignarRol(
  rolLlamante: string | null | undefined,
  rolObjetivo: string | null | undefined,
): boolean {
  if (!puedeAdministrarEquipo(rolLlamante)) return false;
  return NIVEL_ROL[normalizarRol(rolObjetivo)] <= NIVEL_ROL[normalizarRol(rolLlamante)];
}
