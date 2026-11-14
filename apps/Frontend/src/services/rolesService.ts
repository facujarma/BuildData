import { supabase } from "@/lib/supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─────────────────────────────────────────────────────────────
// Contratos de GET /obras/:obraId/mi-rol
// ─────────────────────────────────────────────────────────────

export interface RolActual {
  /** null cuando el rol se resolvió por compatibilidad (no hay fila en roles_obra). */
  id: string | null;
  nombre: string;
  nivel: number;
  es_sistema: boolean;
  descripcion: string;
}

export interface PermisosMiRol {
  /** Claves habilitadas en la superficie de WhatsApp. */
  bot: string[];
  /** Claves habilitadas en la superficie web. */
  web: string[];
  botMap: Record<string, boolean>;
  webMap: Record<string, boolean>;
}

export interface MiRol {
  rol: RolActual;
  permisos: PermisosMiRol;
}

// ─────────────────────────────────────────────────────────────
// Contratos de /roles/:obra_id
// ─────────────────────────────────────────────────────────────

export interface PermisosRol {
  bot: Record<string, boolean>;
  web: Record<string, boolean>;
}

export interface RolObra {
  id: string;
  nombre: string;
  descripcion: string;
  nivel: number;
  es_sistema: boolean;
  permisos: PermisosRol;
}

export interface PermisoCatalogo {
  key: string;
  label: string;
  grupo: string;
}

export interface CatalogoPermisos {
  bot: PermisoCatalogo[];
  web: PermisoCatalogo[];
}

export interface RolesDeObra {
  roles: RolObra[];
  catalogo: CatalogoPermisos;
}

export interface DatosRolNuevo {
  nombre: string;
  descripcion?: string;
  nivel: number;
  permisos?: PermisosRol;
}

export type CambiosRol = Partial<DatosRolNuevo>;

/**
 * Error de la API de roles. Guarda el `code` del backend (`SIN_PERMISO`,
 * `ROL_EN_USO`, `VALIDATION_ERROR`, …) porque la UI lo necesita para mostrar el
 * 409 textual de un rol en uso sin parsear el mensaje.
 */
export class RolesApiError extends Error {
  status: number;
  code?: string;
  permiso?: string;
  rol?: string;

  constructor(
    message: string,
    opts: { status: number; code?: string; permiso?: string; rol?: string },
  ) {
    super(message);
    this.name = "RolesApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.permiso = opts.permiso;
    this.rol = opts.rol;
  }
}

// ─────────────────────────────────────────────────────────────
// HTTP
// ─────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || ""}`,
  };
}

interface ErrorBody {
  code?: string;
  message?: string;
  error?: string;
  permiso?: string;
  rol?: string;
}

async function parseError(res: Response): Promise<RolesApiError> {
  const body = (await res.json().catch(() => ({}))) as ErrorBody;
  return new RolesApiError(body.message || body.error || `Request failed: ${res.status}`, {
    status: res.status,
    code: body.code,
    permiso: body.permiso,
    rol: body.rol,
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────
// Mapeo (el backend ya devuelve el shape final; esto normaliza nulos)
// ─────────────────────────────────────────────────────────────

interface RawRol {
  id?: string | null;
  nombre?: string;
  descripcion?: string | null;
  nivel?: number | string | null;
  es_sistema?: boolean;
  permisos?: { bot?: Record<string, boolean>; web?: Record<string, boolean> } | null;
}

function mapPermisos(raw: RawRol["permisos"]): PermisosRol {
  return { bot: raw?.bot ?? {}, web: raw?.web ?? {} };
}

export function mapRol(raw: RawRol): RolObra {
  return {
    id: String(raw.id ?? ""),
    nombre: String(raw.nombre ?? ""),
    descripcion: raw.descripcion ?? "",
    nivel: Number(raw.nivel) || 0,
    es_sistema: raw.es_sistema === true,
    permisos: mapPermisos(raw.permisos),
  };
}

export function mapMiRol(raw: { rol?: RawRol | null; permisos?: PermisosMiRol | null }): MiRol | null {
  if (!raw?.rol) return null;
  const permisos = raw.permisos;
  return {
    rol: {
      id: raw.rol.id ?? null,
      nombre: String(raw.rol.nombre ?? ""),
      nivel: Number(raw.rol.nivel) || 0,
      es_sistema: raw.rol.es_sistema === true,
      descripcion: raw.rol.descripcion ?? "",
    },
    permisos: {
      bot: permisos?.bot ?? [],
      web: permisos?.web ?? [],
      botMap: permisos?.botMap ?? {},
      webMap: permisos?.webMap ?? {},
    },
  };
}

// ─────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────

/** Rol y permisos efectivos del usuario autenticado en la obra. */
export async function getMiRol(obraId: string): Promise<MiRol> {
  const data = await request<{ rol?: RawRol | null; permisos?: PermisosMiRol | null }>(
    `/obras/${obraId}/mi-rol`,
    { headers: await authHeaders() },
  );
  const miRol = mapMiRol(data);
  if (!miRol) throw new RolesApiError("No se pudo resolver tu rol en esta obra", { status: 404 });
  return miRol;
}

/** Roles de la obra + catálogo de permisos (requiere `roles.administrar`). */
export async function getRoles(obraId: string): Promise<RolesDeObra> {
  const data = await request<{ roles?: RawRol[]; catalogo?: CatalogoPermisos }>(
    `/roles/${obraId}`,
    { headers: await authHeaders() },
  );
  return {
    roles: (data.roles ?? []).map(mapRol),
    catalogo: { bot: data.catalogo?.bot ?? [], web: data.catalogo?.web ?? [] },
  };
}

export async function crearRol(obraId: string, datos: DatosRolNuevo): Promise<RolObra> {
  const data = await request<{ rol: RawRol }>(`/roles/${obraId}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(datos),
  });
  return mapRol(data.rol);
}

export async function actualizarRol(
  obraId: string,
  rolId: string,
  cambios: CambiosRol,
): Promise<RolObra> {
  const data = await request<{ rol: RawRol }>(`/roles/${obraId}/${rolId}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(cambios),
  });
  return mapRol(data.rol);
}

export async function eliminarRol(obraId: string, rolId: string): Promise<void> {
  const res = await fetch(`${API_URL}/roles/${obraId}/${rolId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw await parseError(res);
}
