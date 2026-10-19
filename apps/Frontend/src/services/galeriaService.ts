import { supabase } from "@/lib/supabaseClient";
import type { GalleryPhoto } from "@/types/gallery";
import { FALLBACK_TONE } from "@/app/[obraId]/dashboard/registro/data";
import { formatDayLabel, formatTime } from "@/lib/format";

interface RawFoto {
  id: string;
  url: string;
  tarea_id: string | null;
  task: string | null;
  rubro: string | null;
  tone: string | null;
  who: string;
  note: string | null;
  flag: string | null;
  origen: "web" | "whatsapp";
  nombre_archivo: string | null;
  created_at: string;
}

export interface FotoMeta {
  tareaId: string | null;
  nota: string;
  flag: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function mapFoto(f: RawFoto): GalleryPhoto {
  return {
    id: f.id,
    url: f.url,
    taskId: f.tarea_id,
    task: f.task || "Sin tarea",
    rubro: f.rubro || "Sin rubro",
    who: f.who,
    date: formatDayLabel(f.created_at),
    time: formatTime(f.created_at),
    tone: f.tone || FALLBACK_TONE,
    note: f.note || "",
    flag: f.flag || undefined,
    origen: f.origen,
    fileName: f.nombre_archivo || "",
  };
}

async function accessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || "";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, ...init.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getGaleria(obraId: string): Promise<GalleryPhoto[]> {
  const rows = await request<RawFoto[]>(`/galeria/${obraId}`);
  return rows.map(mapFoto);
}

// Sube las fotos de a una (mismo lote → una sola entrada en la bitácora).
// No corta ante un error: devuelve cuántas subieron y cuáles fallaron.
export async function uploadFotos(
  obraId: string,
  files: File[],
  meta: FotoMeta,
  onProgress?: (done: number) => void,
): Promise<{ subidas: GalleryPhoto[]; fallidas: string[] }> {
  const lote = crypto.randomUUID();
  const params = new URLSearchParams({ lote });
  if (meta.tareaId) params.set("tarea_id", meta.tareaId);
  if (meta.nota.trim()) params.set("nota", meta.nota.trim());
  if (meta.flag) params.set("flag", meta.flag);

  const subidas: GalleryPhoto[] = [];
  const fallidas: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    try {
      const row = await request<RawFoto>(`/galeria/${obraId}?${params}`, {
        method: "POST",
        headers: { "Content-Type": f.type, "X-File-Name": encodeURIComponent(f.name) },
        body: f,
      });
      subidas.push(mapFoto(row));
    } catch {
      fallidas.push(f.name);
    }
    onProgress?.(i + 1);
  }
  return { subidas, fallidas };
}

export async function deleteFoto(id: string): Promise<void> {
  await request(`/galeria/${id}`, { method: "DELETE" });
}
