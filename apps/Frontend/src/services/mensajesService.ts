import { supabase } from "@/lib/supabaseClient";
import type {
  InboxKind,
  InboxMessage,
  InboxState,
  Operacion,
} from "@/types/inbox";

import { formatMessageTime } from "@/lib/format";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface OperacionRow {
  id: string;
  endpoint: string;
  method: string;
  tipo?: string | null;
  destino?: string | null;
  comment?: string | null;
  confianza?: number | null;
  campos?: [string, string][] | null;
  estado: string;
  error_detalle?: string | null;
  ejecutada_at?: string | null;
  created_at: string;
}

// Mensajes viejos (previos a la cola de operaciones): su interpretación quedó en
// action_executed. Se mapean como operaciones ya ejecutadas para no perder historial.
interface ActionExecutedRow {
  endpoint?: string;
  method?: string;
  tipo?: string;
  destino?: string;
  confianza?: number;
  comment?: string;
  campos?: [string, string][];
  estado?: string;
  error?: string;
}

interface MensajeRow {
  id: string;
  tipo: string | null;
  contenido: string | null;
  estado_procesamiento: string | null;
  error_detalle: string | null;
  created_at: string;
  action_executed: ActionExecutedRow[] | null;
  operaciones: OperacionRow[] | null;
  usuario_nombre: string | null;
  rol: string | null;
}

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || ""}`,
  };
}

function shortId(id: string): string {
  return `IN-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function kindFromTipo(tipo: string | null): InboxKind {
  const t = (tipo || "").toLowerCase();
  if (t === "audio") return "audio";
  if (t === "imagen" || t === "foto") return "photo";
  return "text";
}

function toOperacion(row: OperacionRow): Operacion {
  const operacion: Operacion = {
    id: row.id,
    endpoint: row.endpoint,
    method: row.method,
    tipo: row.tipo ?? "Operación",
    destino: row.destino ?? "—",
    campos: Array.isArray(row.campos) ? row.campos : [],
    estado: (row.estado as Operacion["estado"]) ?? "pendiente",
    created_at: row.created_at,
  };
  if (typeof row.confianza === "number") operacion.confianza = row.confianza;
  if (row.comment) operacion.comment = row.comment;
  if (row.error_detalle) operacion.errorDetalle = row.error_detalle;
  if (row.ejecutada_at) operacion.ejecutadaAt = row.ejecutada_at;
  return operacion;
}

function legacyOperacion(row: ActionExecutedRow, index: number): Operacion {
  return {
    id: `legacy-${index}`,
    endpoint: row.endpoint ?? "",
    method: row.method ?? "",
    tipo: row.tipo ?? "Operación",
    destino: row.destino ?? "—",
    campos: row.campos ?? [],
    confianza: row.confianza,
    estado: row.estado === "error" ? "error" : "ejecutada",
    errorDetalle: row.error,
    created_at: "",
  };
}

function estadoDeMensaje(row: MensajeRow, operaciones: Operacion[]): InboxState {
  if (operaciones.some((o) => o.estado === "pendiente" || o.estado === "ejecutando")) {
    return "pending";
  }
  if (operaciones.some((o) => o.estado === "error")) return "error";
  if (operaciones.some((o) => o.estado === "ejecutada")) return "confirmed";
  if (operaciones.length > 0) return "discarded";

  // Sin operaciones: nota guardada o mensaje sin acción.
  if (row.estado_procesamiento === "pendiente_aprobacion") return "pending";
  if (row.estado_procesamiento === "error") return "error";
  if (row.estado_procesamiento === "rechazado") return "discarded";
  return "confirmed";
}

function toInboxMessage(row: MensajeRow): InboxMessage {
  const nuevas = Array.isArray(row.operaciones) ? row.operaciones : [];
  const legacy = Array.isArray(row.action_executed) ? row.action_executed : [];
  const operaciones =
    nuevas.length > 0
      ? nuevas.map(toOperacion)
      : legacy.map(legacyOperacion);

  return {
    id: row.id,
    shortId: shortId(row.id),
    kind: kindFromTipo(row.tipo),
    from: row.usuario_nombre ?? "Desconocido",
    role: row.rol ?? "",
    time: formatMessageTime(row.created_at),
    raw: row.contenido ?? "",
    state: estadoDeMensaje(row, operaciones),
    operaciones,
  };
}

export interface InboxData {
  items: InboxMessage[];
}

export async function getInbox(obraId: string): Promise<InboxData> {
  const res = await fetch(`${API_URL}/mensajes/${obraId}`, {
    headers: await authHeaders(),
  });

  if (!res.ok) throw new Error(`Mensajes fetch failed: ${res.status}`);
  const rows = (await res.json()) as MensajeRow[];
  return { items: rows.map(toInboxMessage) };
}

async function accionOperacion(id: string, accion: string): Promise<void> {
  const res = await fetch(`${API_URL}/operaciones/${id}/${accion}`, {
    method: "PATCH",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `No se pudo ${accion} la operación (${res.status})`);
  }
}

export async function aprobarOperacion(id: string): Promise<void> {
  return accionOperacion(id, "aprobar");
}

export async function rechazarOperacion(id: string): Promise<void> {
  return accionOperacion(id, "rechazar");
}

export async function reintentarOperacion(id: string): Promise<void> {
  return accionOperacion(id, "reintentar");
}
