import { supabase } from "@/lib/supabaseClient";
import { todayISO } from "@/lib/format";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function createTask(obraId: string, data: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();

  const payload: Record<string, unknown> = {
    obra_id: obraId,
    titulo: data.nombre,
    descripcion: data.desc || "",
    rubro_id: data.rubro_id || null,
    // fecha_inicio es NOT NULL en la base: default hoy si no viene
    fecha_inicio: data.fecha_inicio || todayISO(),
    fecha_limite: data.fecha_limite || null,
    prioridad: data.prioridad || null,
    asignado_a: data.asignado_a || null,
    costo_estimado: data.costo_estimado ? Number(data.costo_estimado) : null,
  };

  const res = await fetch(`${API_URL}/tareas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Error al crear tarea");
  }

  return res.json();
}
