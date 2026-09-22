import { supabase } from "@/lib/supabaseClient";
import type { TaskGroup, TaskItem, Timeline } from "@/app/[obraId]/dashboard/cronograma/data";
import { computeTimeline, weekIndexOf } from "@/app/[obraId]/dashboard/cronograma/data";
import { formatARSCompact, formatDate, parseLocalDate } from "@/lib/format";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Tipos API (GET /tareas/:obra_id) ─────────────────────────────────────────

interface ApiTarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string; // pendiente | en_progreso | completada | cancelada
  prioridad: string | null;
  porcentaje_avance: number;
  fecha_inicio: string;
  fecha_limite: string | null;
  fecha_completada: string | null;
  costo_estimado: string | number | null;
  usuario_nombre: string | null;
  rubro_nombre: string | null;
  asignado_a_nombre: string | null;
  completada_por_nombre: string | null;
  dependencias: string[] | null;
}

export interface CronogramaData {
  groups: TaskGroup[];
  timeline: Timeline;
}

export interface OptionItem {
  id: string;
  nombre: string;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || ""}`,
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...(await authHeaders()), ...init?.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string; message?: string }).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Transformación API → UI ──────────────────────────────────────────────────

function mapState(row: ApiTarea): string | null {
  if (row.estado === "completada") return "done";
  // 'cancelada' no tiene representación en el cronograma: se excluye.
  if (row.estado === "cancelada") return null;
  const due = parseLocalDate(row.fecha_limite);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due && due < today) return "late";
  return row.estado === "en_progreso" ? "progress" : "planned";
}

function transformCronograma(rows: ApiTarea[]): CronogramaData {
  const active = rows.filter((r) => r.estado !== "cancelada");
  const timeline = computeTimeline(
    active.map((r) => ({ startDate: r.fecha_inicio, dueDate: r.fecha_limite }))
  );

  const rubroOrder: string[] = [];
  const byRubro = new Map<string, TaskItem[]>();

  for (const row of active) {
    const state = mapState(row);
    if (!state) continue;

    const startIdx = Math.max(0, weekIndexOf(timeline, parseLocalDate(row.fecha_inicio) ?? new Date()));
    let span = 1;
  const due = parseLocalDate(row.fecha_limite);
    if (due) span = Math.max(1, weekIndexOf(timeline, due) - startIdx + 1);

    const pctRaw = Number(row.porcentaje_avance ?? 0);
    const pct = state === "done" ? 100 : Math.max(0, Math.min(100, Math.round(pctRaw)));

    const item: TaskItem = {
      id: row.id,
      name: row.titulo,
      who: row.asignado_a_nombre || row.usuario_nombre || "Sin asignar",
      start: startIdx,
      span,
      state,
      pct,
      desc: row.descripcion || "",
      cost: row.costo_estimado != null ? formatARSCompact(Number(row.costo_estimado)) : "—",
      deps: Array.isArray(row.dependencias) ? row.dependencias : [],
      rubro: row.rubro_nombre || "Sin rubro",
      startDate: row.fecha_inicio,
      dueDate: row.fecha_limite,
      completedBy: row.completada_por_nombre || undefined,
      completedOn: row.fecha_completada ? formatDate(row.fecha_completada) : undefined,
    };

    if (!byRubro.has(item.rubro)) {
      byRubro.set(item.rubro, []);
      rubroOrder.push(item.rubro);
    }
    byRubro.get(item.rubro)!.push(item);
  }

  return { groups: rubroOrder.map((rubro) => ({ rubro, items: byRubro.get(rubro)! })), timeline };
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function getCronograma(obraId: string): Promise<CronogramaData> {
  const rows = await request<ApiTarea[]>(`${API_URL}/tareas/${obraId}`);
  return transformCronograma(rows);
}

export async function completeCronogramaTask(taskId: string): Promise<void> {
  await request(`${API_URL}/tareas/${taskId}/completar`, { method: "POST" });
}

export async function reopenCronogramaTask(taskId: string): Promise<void> {
  await request(`${API_URL}/tareas/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ estado: "en_progreso" }),
  });
}

export async function getRubrosDeObra(obraId: string): Promise<OptionItem[]> {
  const json = await request<{ rubros: { id: string; nombre: string }[] }>(
    `${API_URL}/obras/${obraId}/rubros`
  );
  return json.rubros.map((r) => ({ id: r.id, nombre: r.nombre }));
}

export async function createRubro(
  obraId: string,
  nombre: string,
  presupuesto = 0,
  descripcion?: string,
): Promise<OptionItem> {
  const json = await request<{ id: string; nombre: string }>(
    `${API_URL}/obras/${obraId}/rubros`,
    {
      method: "POST",
      body: JSON.stringify({ nombre, presupuesto, descripcion }),
    },
  );
  return { id: json.id, nombre: json.nombre };
}

export async function getMiembrosDeObra(obraId: string): Promise<OptionItem[]> {
  const rows = await request<{ id: string; nombre: string }[]>(`${API_URL}/obreros/${obraId}`);
  return rows.map((r) => ({ id: r.id, nombre: r.nombre }));
}
