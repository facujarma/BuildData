// Roles y permisos del bot WhatsApp.
//
// Fuente única de la matriz de permisos del Backend. El bot tiene un espejo en
// apps/WhatsApp-Bot/src/services/permissions.service.ts: si se cambia un rol o una
// capacidad, hay que cambiar los dos (no hay paquete compartido en el monorepo).
//
// El rol que vale es `miembros_obra.rol` (por obra) y se normaliza con normalizarRol():
// cualquier valor libre desconocido cae en "Obrero" (mínimo privilegio).

export const ROLES = ["Obrero", "Capataz", "Director"];

// Capacidad → roles habilitados. Provisional: el usuario definirá después el detalle.
// - Obrero: reporta el día a día (stock, gastos, tareas, retrasos, alertas, fotos).
// - Capataz: además corrige stock y maneja pedidos (crear y confirmar entregas).
// - Director: todo.
export const PERMISOS = {
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

// Texto legible para el mensaje de bloqueo del bot.
export const PERMISO_LABELS = {
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
// no se puede ejecutar (si se agrega a ENDPOINTS_OPERACION, mapearlo acá).
export const ENDPOINT_PERMISOS = {
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

function sinAcentos(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Mapea el rol libre que hoy se carga desde la web (invitaciones, equipo) a los
// tres roles del bot. Los valores viejos ("Director de obra", "Sin asignar",
// "Compras", etc.) siguen funcionando sin migrar datos.
export function normalizarRol(rol) {
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

export function puede(rol, permiso) {
  const normalizado = normalizarRol(rol);
  return (PERMISOS[permiso] ?? []).includes(normalizado);
}

export function puedeOperar(rol, endpoint) {
  const permiso = ENDPOINT_PERMISOS[endpoint];
  if (!permiso) return false;
  return puede(rol, permiso);
}

export function permisoDeEndpoint(endpoint) {
  const permiso = ENDPOINT_PERMISOS[endpoint];
  if (!permiso) return null;
  return { permiso, label: PERMISO_LABELS[permiso] ?? permiso };
}

// Aprobar una operación de la bandeja es una acción de supervisión: no la puede
// hacer un Obrero aunque tenga la capacidad de crear ese tipo de operación.
export function puedeAprobar(rol) {
  return ["Capataz", "Director"].includes(normalizarRol(rol));
}

// Administrar el equipo de una obra (asignar/quitar miembros y emitir
// invitaciones) cambia permisos, así que es exclusivo de Director. Si la matriz
// final habilita Capataz, sumarlo acá (y en el espejo del bot): igual
// puedeAsignarRol impide que otorgue un rol superior al propio.
export function puedeAdministrarEquipo(rol) {
  return normalizarRol(rol) === "Director";
}

// Jerarquía de roles: solo se puede otorgar un rol de nivel igual o menor al
// propio. Hoy la administración es solo de Director, pero la regla queda
// explícita por si la matriz habilita a Capataz.
const NIVEL_ROL = { Obrero: 1, Capataz: 2, Director: 3 };

// ¿El que llama puede otorgar `rolObjetivo`? Fail closed: sin rol administrador
// no se puede asignar nada.
export function puedeAsignarRol(rolLlamante, rolObjetivo) {
  if (!puedeAdministrarEquipo(rolLlamante)) return false;
  return NIVEL_ROL[normalizarRol(rolObjetivo)] <= NIVEL_ROL[normalizarRol(rolLlamante)];
}

// Permisos que tiene un rol, para mostrarlos en el bot (!rol) o en la web.
export function permisosDe(rol) {
  const normalizado = normalizarRol(rol);
  return Object.entries(PERMISOS)
    .filter(([, roles]) => roles.includes(normalizado))
    .map(([permiso]) => ({ permiso, label: PERMISO_LABELS[permiso] ?? permiso }));
}
