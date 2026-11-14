// Errores HTTP de la API con el contrato de permisos del Backend.
//
// El backend responde `403 { code: "SIN_PERMISO", message, permiso, rol }` cuando
// el rol del usuario no puede hacer la acción (docs/roles-permisos.md). Los
// services convertían la respuesta en un `Error` pelado y se perdía el `code`:
// la pantalla mostraba un texto genérico ("No se pudo aprobar el pedido") en vez
// del motivo real. `ApiError` conserva `status` y `code` sin cambiar la firma
// (`instanceof Error` y `.message` siguen funcionando).

export const SIN_PERMISO = "SIN_PERMISO";

interface CuerpoError {
  message?: string;
  error?: string;
  code?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, opts: { status: number; code?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
  }
}

/** Arma el error de una respuesta !ok conservando `status` y `code`. */
export function apiErrorDesde(status: number, cuerpo: CuerpoError, fallback: string): ApiError {
  return new ApiError(cuerpo?.message || cuerpo?.error || fallback, { status, code: cuerpo?.code });
}

/** ¿El backend rechazó la acción por falta de permiso del rol? */
export function esErrorSinPermiso(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.code === SIN_PERMISO || error.status === 403;
  }
  const posible = error as { code?: string; status?: number } | null | undefined;
  return posible?.code === SIN_PERMISO || posible?.status === 403;
}

/** Mensaje para el usuario: el del backend si existe, el fallback si no. */
export function mensajeDeError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Texto de un toast de acción rechazada. Si fue por rol, agrega a dónde ir a
 * habilitarlo; si no, deja el mensaje tal cual.
 */
export function mensajeAccionRechazada(error: unknown, fallback: string): string {
  const base = mensajeDeError(error, fallback);
  return esErrorSinPermiso(error)
    ? `${base}. Pedile a un Director que lo habilite en Configuración → Roles y permisos.`
    : base;
}
