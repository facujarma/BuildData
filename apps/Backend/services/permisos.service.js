// Roles y permisos del bot WhatsApp (fachada de compatibilidad).
//
// La fuente única de roles, catálogo y defaults vive en roles.service.js; acá se
// derivan las estructuras estáticas que ya consumen el bot y el backend:
// - ROLES / PERMISOS / PERMISO_LABELS: matriz **bot** por defecto.
// - ENDPOINT_PERMISOS: endpoint de operación → permiso bot.
// - normalizarRol: re-exportado (mapea roles libres viejos a los seis de sistema).
//
// El rol que vale es `miembros_obra.rol` (por obra) y los permisos efectivos se
// resuelven contra `roles_obra` con permisos.service/roles.service. El bot tiene un
// espejo en apps/WhatsApp-Bot/src/services/permissions.service.ts: si se cambia el
// catálogo o un default, actualizar los dos (no hay paquete compartido).

import {
  CATALOGO_PERMISOS,
  ROLES_SISTEMA,
  normalizarRol,
} from "./roles.service.js";

export { normalizarRol } from "./roles.service.js";

export const ROLES = ROLES_SISTEMA.map((rol) => rol.nombre);

// Permiso bot → roles de sistema que lo tienen habilitado por defecto.
export const PERMISOS = Object.fromEntries(
  CATALOGO_PERMISOS.bot.map(({ key }) => [
    key,
    ROLES_SISTEMA.filter((rol) => rol.permisos.bot[key] === true).map((rol) => rol.nombre),
  ])
);

// Texto legible para el mensaje de bloqueo del bot (!rol y operaciones rechazadas).
export const PERMISO_LABELS = Object.fromEntries(
  CATALOGO_PERMISOS.bot.map(({ key, label }) => [key, label])
);

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
  "/bot/galeria": "foto.subir",
};

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
// Compatibilidad: la política nueva se aplica con el permiso web `bandeja.aprobar`
// (roles.service), que también habilita a Administrativo.
export function puedeAprobar(rol) {
  return ["Capataz", "Director"].includes(normalizarRol(rol));
}

// Administrar el equipo de una obra (asignar/quitar miembros y emitir
// invitaciones) cambia permisos, así que por defecto es exclusivo de Director.
// El gate real de la web usa el permiso `equipo.administrar` de roles_obra.
export function puedeAdministrarEquipo(rol) {
  return normalizarRol(rol) === "Director";
}

function nivelDeRol(rol) {
  const canonico = normalizarRol(rol);
  const definicion = ROLES_SISTEMA.find((candidato) => candidato.nombre === canonico);
  return definicion ? definicion.nivel : null;
}

// Jerarquía de roles: solo se puede otorgar un rol de nivel igual o menor al
// propio. Fail closed: sin rol administrador o sin nivel, no se asigna nada.
export function puedeAsignarRol(rolLlamante, rolObjetivo) {
  if (!puedeAdministrarEquipo(rolLlamante)) return false;
  const propio = nivelDeRol(rolLlamante);
  const destino = nivelDeRol(rolObjetivo);
  if (propio === null || destino === null) return false;
  return destino <= propio;
}

// Permisos bot que tiene un rol, para mostrarlos en el bot (!rol) o en la web.
export function permisosDe(rol) {
  const normalizado = normalizarRol(rol);
  return Object.entries(PERMISOS)
    .filter(([, roles]) => roles.includes(normalizado))
    .map(([permiso]) => ({ permiso, label: PERMISO_LABELS[permiso] ?? permiso }));
}
