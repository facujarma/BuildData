import { supabase } from "@/lib/supabaseClient";
import type { AlertaItem } from "@/app/[obraId]/dashboard/alertas/data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface AlertasData {
  alerts: AlertaItem[];
}

interface ApiAlerta {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  mensaje: string | null;
  severity: string | null;
  resuelta: boolean;
  created_at: string;
  destinatario: string | null;
}

function mapNivelToSeverity(nivel: string): string {
  if (nivel === "Crítico") return "critical";
  return "attention";
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

function mapAlerta(row: ApiAlerta): AlertaItem {
  const lvl = row.resuelta
    ? "resolved"
    : row.severity === "critical"
      ? "critical"
      : "attention";
  return {
    id: row.id,
    lvl,
    title: row.titulo || row.mensaje || "Alerta",
    who: row.destinatario || "Sistema",
    time: formatRelativeTime(row.created_at),
    desc: row.subtitulo || row.mensaje || "",
    actions: [],
  };
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

export async function getAlertas(obraId: string): Promise<AlertasData> {
  const res = await fetch(`${API_URL}/alertas/${obraId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }

  const rows: ApiAlerta[] = await res.json();
  return { alerts: rows.map(mapAlerta) };
}

export async function createAlert(obraId: string, data: Record<string, string>) {
  const payload = {
    obra_id: obraId,
    titulo: data.titulo,
    subtitulo: data.desc || "",
    severity: mapNivelToSeverity(data.nivel || "attention"),
  };

  const res = await fetch(`${API_URL}/alertas`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Error al crear alerta");
  }

  return res.json();
}