import { supabase } from "@/lib/supabaseClient";
import type { ActivityGroup } from "@/app/[obraId]/dashboard/actividad/data";

import { formatDayLabel, formatTime } from "@/lib/format";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface RawActividad {
  accion: string | null;
  tipo: string | null;
  texto: string | null;
  tags: string[] | null;
  created_at: string;
  usuario_nombre: string | null;
  usuario_rol: string | null;
}

// Devuelve una key de KIND_ICONS. Cubre los tipos que registra el Backend
// (avance | pedido | problema | foto | cierre) y los de las cargas manuales viejas
// ("Avance de tarea", "Cierre de jornada", "Problema", "Foto").
function mapKind(tipo: string | null, accion: string | null): string {
  const lower = `${tipo || ""} ${accion || ""}`.toLowerCase();
  if (lower.includes("problema") || lower.includes("retraso") || lower.includes("alerta")) return "problema";
  if (lower.includes("foto")) return "foto";
  if (lower.includes("cierre") || lower.includes("cerró")) return "cierre";
  if (lower.includes("pedido") || lower.includes("gasto") || lower.includes("comprobante")) return "pedido";
  return "avance";
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function transformActividad(items: RawActividad[]): { groups: ActivityGroup[] } {
  const sorted = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const groupsMap = new Map<string, ActivityGroup["items"]>();
  for (const item of sorted) {
    const label = formatDayLabel(item.created_at);
    if (!groupsMap.has(label)) groupsMap.set(label, []);
    groupsMap.get(label)!.push({
      who: getInitials(item.usuario_nombre || ""),
      name: item.usuario_nombre || "",
      role: capitalize(item.usuario_rol || ""),
      time: formatTime(item.created_at),
      kind: mapKind(item.tipo, item.accion),
      text: item.texto || item.accion || "",
      tags: item.tags || [],
    });
  }

  const groups: ActivityGroup[] = [];
  groupsMap.forEach((items, d) => groups.push({ d, items }));
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
  const data: RawActividad[] = await res.json();
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
