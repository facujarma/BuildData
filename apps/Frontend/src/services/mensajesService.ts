import { supabase } from "@/lib/supabaseClient";
import type { InboxKind, InboxMessage, InboxState } from "@/types/inbox";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  result?: { id?: string } & Record<string, unknown>;
}

interface MensajeRow {
  id: string;
  tipo: string | null;
  contenido: string | null;
  estado_procesamiento: string | null;
  error_detalle: string | null;
  created_at: string;
  action_executed: ActionExecutedRow[] | null;
  usuario_nombre: string | null;
  rol: string | null;
}

export interface InboxData {
  items: InboxMessage[];
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

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;

  const hhmm = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) return `hoy ${hhmm}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return `ayer ${hhmm}`;

  return `${date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })} ${hhmm}`;
}

// Un mensaje puede tener varias acciones ejecutadas (ej: pedido + stock).
// Se concatenan los campos de todas, desambiguando labels repetidos.
function mergeCampos(actions: ActionExecutedRow[]): [string, string][] {
  if (actions.length <= 1) return actions[0]?.campos ?? [];
  const campos: [string, string][] = [];
  for (const action of actions) {
    for (const [key, value] of action.campos ?? []) {
      const label = campos.some(([k]) => k === key)
        ? `${action.tipo ?? "Acción"} · ${key}`
        : key;
      campos.push([label, value]);
    }
  }
  return campos;
}

function toInboxMessage(row: MensajeRow): InboxMessage {
  const actions = row.action_executed ?? [];
  const primary = actions[0];
  const destinos = [
    ...new Set(actions.map((a) => a.destino).filter((d): d is string => Boolean(d))),
  ];
  const conf = actions.find((a) => typeof a.confianza === "number")?.confianza;
  const errores = row.error_detalle
    ? [row.error_detalle]
    : actions
        .filter((a) => a.estado === "error" && a.error)
        .map((a) => a.error as string);
  const applied = actions
    .filter((a) => a.estado !== "error")
    .map((a) => `${a.destino ?? "Obra"} actualizado`);

  const kind = kindFromTipo(row.tipo);
  const state: InboxState = row.estado_procesamiento === "procesado" ? "confirmed" : "pending";

  const message: InboxMessage = {
    id: shortId(row.id),
    dir: "in",
    kind,
    from: row.usuario_nombre ?? "Desconocido",
    role: row.rol ?? "",
    time: formatTime(row.created_at),
    raw: row.contenido ?? "",
    state,
    mapped: [],
    loose: [],
    parse: primary
      ? {
          tipo: primary.tipo ?? "Operación",
          destino: destinos.join(" + ") || "—",
          campos: mergeCampos(actions),
        }
      : undefined,
    applied: applied.length > 0 ? applied : undefined,
    warn:
      errores.length > 0
        ? `No se pudo ejecutar: ${errores.join(" · ")}`
        : undefined,
  };

  if (typeof conf === "number") message.conf = conf;
  if (kind === "photo") message.photos = 1;
  if (state === "confirmed") {
    message.by = "Bot";
    message.at = formatTime(row.created_at);
  }

  return message;
}

export async function getInbox(obraId: string): Promise<InboxData> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}/mensajes/${obraId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
  });

  if (!res.ok) throw new Error(`Mensajes fetch failed: ${res.status}`);
  const rows = (await res.json()) as MensajeRow[];
  return { items: rows.map(toInboxMessage) };
}
