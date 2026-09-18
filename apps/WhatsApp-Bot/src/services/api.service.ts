import type { User } from "../types/api.types";
import type { ResultadoBusquedaEntidades } from "./entityMatch.service";

const API_URL = process.env.API_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_URL) throw new Error("API_URL no configurada");
if (!SUPABASE_SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada");

const AUTH_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
  "apikey": SUPABASE_SERVICE_KEY,
};

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: AUTH_HEADERS,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (res.status === 401) throw new Error("AUTH_FAILED: credenciales inválidas");
    if (res.status === 403) throw new Error("AUTH_FORBIDDEN: sin permisos");
    if (!res.ok) throw new Error(`API_ERROR: ${res.status}`);

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function callEndpoint(
  method: "POST" | "GET" | "PATCH",
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  return apiRequest<unknown>(method, path, body);
}

export async function registerUser(
  phone: string,
  name: string,
  obra_id: string
): Promise<User> {
  return apiRequest<User>("POST", "/bot/obreros/registrar", {
    telefono: phone,
    nombre: name,
    obra_id,
  });
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const data = await apiRequest<User>("GET", `/bot/obreros/telefono/${phone}`);
    if (!data.obras || data.obras.length === 0) return null;
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("API_ERROR")) return null;
    throw error;
  }
}

// ──────────────────────────────────────────
// Materiales
// ──────────────────────────────────────────

export interface MaterialCreado {
  id: string;
  nombre: string;
  unidad?: string | null;
}

export async function crearMaterial(payload: {
  obra_id: string;
  nombre: string;
  unidad?: string;
}): Promise<MaterialCreado> {
  return apiRequest<MaterialCreado>("POST", "/bot/materiales", payload);
}

// ──────────────────────────────────────────
// Búsqueda de entidades por similitud (sin LLM)
// ──────────────────────────────────────────

export async function buscarEntidades(
  obraId: string,
  tipo: string,
  nombre: string,
  limite = 5,
): Promise<ResultadoBusquedaEntidades> {
  const query = new URLSearchParams({ tipo, nombre, limite: String(limite) });
  if (tipo !== "proveedor") query.set("obra_id", obraId);
  return apiRequest<ResultadoBusquedaEntidades>(
    "GET",
    `/bot/entidades/buscar?${query.toString()}`,
  );
}

export async function registrarMensaje(payload: {
  obra_id: string;
  telefono: string;
  tipo: string;
  contenido: string;
}): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("POST", "/bot/mensaje", payload);
}

// Persiste la interpretación ya ejecutada del mensaje (columna mensajes.action_executed).
export async function actualizarMensajeAcciones(
  mensajeId: string,
  payload: {
    action_executed: unknown[];
    estado_procesamiento?: "procesado" | "error";
    error_detalle?: string;
  },
): Promise<void> {
  await apiRequest("PATCH", `/bot/mensaje/${mensajeId}`, payload);
}
