import { supabase } from "@/lib/supabaseClient";
import type { ReciboItem } from "@/app/[obraId]/dashboard/recibos/data";

export interface NuevoRecibo {
  concept: string;
  provider: string;
  category: string;
  rubroId: string | null;
  amount: number;
  date: string; // YYYY-MM-DD
  paid: boolean;
}

interface RawRecibo {
  id: string;
  descripcion: string;
  proveedor: string;
  categoria: string;
  rubro_id: string | null;
  fecha: string | null;
  monto: string | number; // numeric llega como string
  moneda: string;
  estado_pago: "pagado" | "pendiente";
  archivo_url: string | null;
  archivo_nombre: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function mapRecibo(r: RawRecibo): ReciboItem {
  return {
    id: r.id,
    concept: r.descripcion,
    prov: r.proveedor,
    cat: r.categoria,
    rubroId: r.rubro_id,
    date: r.fecha || "",
    amount: Number(r.monto) || 0,
    currency: r.moneda || "ARS",
    status: r.estado_pago,
    file: r.archivo_nombre || "",
    fileUrl: r.archivo_url || "",
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await accessToken()}`, ...init.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getRecibos(obraId: string): Promise<ReciboItem[]> {
  const rows = await request<RawRecibo[]>(`/gastos/${obraId}`);
  return rows.map(mapRecibo);
}

// Crea el gasto y, si hay archivo, lo sube después. Si falla solo la subida, el recibo
// ya quedó guardado: se informa con un error específico.
export async function createRecibo(obraId: string, data: NuevoRecibo, file: File | null): Promise<ReciboItem> {
  const row = await request<RawRecibo>(`/gastos`, {
    method: "POST",
    body: JSON.stringify({
      obra_id: obraId,
      descripcion: data.concept,
      proveedor: data.provider,
      categoria: data.category,
      rubro_id: data.rubroId,
      monto: data.amount,
      fecha: data.date,
      pagado: data.paid,
    }),
  });
  if (!file) return mapRecibo(row);
  try {
    return await uploadArchivo(row.id, file);
  } catch {
    throw new Error("El recibo se guardó, pero no se pudo subir el archivo");
  }
}

export async function setEstadoPago(id: string, estado: "pagado" | "pendiente"): Promise<ReciboItem> {
  const row = await request<RawRecibo>(`/gastos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ estado_pago: estado }),
  });
  return mapRecibo(row);
}

export async function uploadArchivo(id: string, file: File): Promise<ReciboItem> {
  const row = await request<RawRecibo>(`/gastos/${id}/archivo`, {
    method: "POST",
    headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) },
    body: file,
  });
  return mapRecibo(row);
}
