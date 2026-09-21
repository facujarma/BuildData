import { supabase } from "@/lib/supabaseClient";
import type { ActivityGroup } from "@/app/[obraId]/dashboard/actividad/data";

import { formatDayLabel, formatTime } from "@/lib/format";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function mapTipoToKind(tipo: string | null): string {
  const lower = (tipo || "").toLowerCase();
  if (lower.includes("problema") || lower.includes("crítico") || lower.includes("critico")) return "alerta";
  if (lower.includes("foto")) return "foto";
  if (lower.includes("cierre")) return "check";
  if (lower.includes("pedido")) return "pedido";
  return "avance";
}

function mapAccionToKind(accion: string): string {
  const lower = accion.toLowerCase();
  if (lower.includes("problema")) return "alerta";
  if (lower.includes("foto")) return "foto";
  if (lower.includes("cerró")) return "check";
  if (lower.includes("pedido")) return "pedido";
  return "avance";
}

function transformActividad(items: any[]): { groups: ActivityGroup[] } {
  const sorted = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const groupsMap = new Map<string, { who: string; name: string; time: string; kind: string; text: string }[]>();
  for (const item of sorted) {
    const label = formatDayLabel(item.created_at);
    if (!groupsMap.has(label)) groupsMap.set(label, []);
    groupsMap.get(label)!.push({
      who: getInitials(item.usuario_nombre || ""),
      name: item.usuario_nombre || "",
      time: formatTime(item.created_at),
      kind: mapTipoToKind(item.tipo) || mapAccionToKind(item.accion),
      text: item.texto || item.accion || "",
    });
  }

  const groups: ActivityGroup[] = [];
  groupsMap.forEach((items, d) =>
    groups.push({
      d,
      items: items.map((i) => ({
        who: i.who,
        name: i.name,
        role: "",
        time: i.time,
        kind: i.kind,
        text: i.text,
        tags: [],
      })),
    })
  );
  return { groups };
}

export async function getActividad(obraId: string): Promise<{ groups: ActivityGroup[] }> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}/actividad/${obraId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
  });

  if (!res.ok) throw new Error(`Actividad fetch failed: ${res.status}`);
  const data = await res.json();
  return transformActividad(data);
}

export async function createActividad(obraId: string, data: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();

  const payload = {
    obra_id: obraId,
    tipo: data.tipo || "Avance de tarea",
    texto: data.texto,
  };

  const res = await fetch(`${API_URL}/actividad`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Error al crear actividad");
  }

  return res.json();
}
