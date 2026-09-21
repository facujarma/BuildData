import { supabase } from "@/lib/supabaseClient";
import type { AlertaItem, AlertaLvl } from "@/app/[obraId]/dashboard/alertas/data";

import { formatRelative } from "@/lib/format";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AlertasData {
  alerts: AlertaItem[];
}

interface ApiAlerta {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  mensaje: string | null;
  severity: string | null;
  tipo: string | null;
  resuelta: boolean;
  created_at: string;
  destinatario: string | null;
}

function mapNivelToSeverity(nivel: string): string {
  if (nivel === "Crítico") return "critical";
  if (nivel === "Moderado") return "moderate";
  return "attention";
}

function mapSeverityToLvl(severity: string | null): AlertaLvl {
  if (severity === "critical") return "critical";
  if (severity === "moderate") return "moderate";
  return "attention";
}

function mapTipoToCat(tipo: string | null): string {
  if (!tipo) return "General";
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function mapAlerta(row: ApiAlerta): AlertaItem {
  return {
    id: row.id,
    lvl: mapSeverityToLvl(row.severity),
    state: row.resuelta ? "resolved" : "open",
    cat: mapTipoToCat(row.tipo),
    title: row.titulo || row.mensaje || "Alerta",
    who: row.destinatario || "Sistema",
    time: formatRelative(row.created_at),
    desc: row.subtitulo || row.mensaje || "",
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

export async function resolverAlerta(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/alertas/${id}/resolver`, {
    method: "PATCH",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }
}

export async function createAlert(obraId: string, data: Record<string, string>) {
  const payload = {
    obra_id: obraId,
    titulo: data.titulo,
    subtitulo: data.desc || "",
    tipo: data.cat || null,
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
