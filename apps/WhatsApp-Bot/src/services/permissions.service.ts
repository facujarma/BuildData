// Roles y permisos del bot WhatsApp.
//
// Espejo de apps/Backend/services/permisos.service.js: el Backend es la barrera
// dura y este módulo da el mensaje claro antes de registrar la operación. Si se
// cambia un rol o una capacidad, cambiar los dos archivos.
//
// El rol vale por obra (User.obras[].rol) y se normaliza con normalizarRol():
// cualquier valor libre desconocido cae en "Obrero" (mínimo privilegio).

export type RolBot = "Obrero" | "Capataz" | "Director";

export const ROLES: RolBot[] = ["Obrero", "Capataz", "Director"];

// Capacidad → roles habilitados. Provisional: el usuario definirá el detalle.
export const PERMISOS: Record<string, RolBot[]> = {
  "stock.registrar": ["Obrero", "Capataz", "Director"],
  "stock.ajustar": ["Capataz", "Director"],
  "gasto.crear": ["Obrero", "Capataz", "Director"],
  "pedido.crear": ["Capataz", "Director"],
  "pedido.entregar": ["Capataz", "Director"],
  "tarea.crear": ["Obrero", "Capataz", "Director"],
  "tarea.completar": ["Obrero", "Capataz", "Director"],
  "retraso.registrar": ["Obrero", "Capataz", "Director"],
  "alerta.crear": ["Obrero", "Capataz", "Director"],
  "foto.subir": ["Obrero", "Capataz", "Director"],
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
};

function sinAcentos(texto: string | null | undefined): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Mapea el rol libre que hoy se carga desde la web a los tres roles del bot.
export function normalizarRol(rol: string | null | undefined): RolBot {
  const r = sinAcentos(rol);
  if (!r) return "Obrero";
  if (/(director|duen|admin|gerente|arquitect|ingenier|socio|propietari|cliente)/.test(r)) {
    return "Director";
  }
  if (/(capataz|jefe|supervisor|encargado|compras|seguridad|higiene)/.test(r)) {
    return "Capataz";
  }
  return "Obrero";
}

export function puede(rol: string | null | undefined, permiso: string): boolean {
  const normalizado = normalizarRol(rol);
  return (PERMISOS[permiso] ?? []).includes(normalizado);
}

export function puedeOperar(rol: string | null | undefined, endpoint: string): boolean {
  const permiso = ENDPOINT_PERMISOS[endpoint];
  if (!permiso) return false;
  return puede(rol, permiso);
}

// Aprobar una operación de la bandeja es una acción de supervisión.
export function puedeAprobar(rol: string | null | undefined): boolean {
  return ["Capataz", "Director"].includes(normalizarRol(rol));
}

// Administrar el equipo de una obra es una acción de la web (el bot no tiene
// comando para asignar roles). Se mantiene acá por paridad con el Backend: si
// la matriz habilita Capataz, cambiar los dos archivos.
export function puedeAdministrarEquipo(rol: string | null | undefined): boolean {
  return normalizarRol(rol) === "Director";
}

const NIVEL_ROL: Record<RolBot, number> = { Obrero: 1, Capataz: 2, Director: 3 };

// Solo se puede otorgar un rol de nivel igual o menor al propio (fail closed).
export function puedeAsignarRol(
  rolLlamante: string | null | undefined,
  rolObjetivo: string | null | undefined,
): boolean {
  if (!puedeAdministrarEquipo(rolLlamante)) return false;
  return NIVEL_ROL[normalizarRol(rolObjetivo)] <= NIVEL_ROL[normalizarRol(rolLlamante)];
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
