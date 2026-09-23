import { supabase } from "@/lib/supabaseClient";
import type { StockItem } from "@/app/[obraId]/dashboard/stock/data";

export interface StockData {
  items: StockItem[];
  categories: string[];
}

interface RawMaterial {
  id: string;
  nombre: string;
  categoria: string | null;
  unidad: string | null;
  // numeric de PostgreSQL llega como string
  stock_actual: string | number | null;
  stock_minimo: string | number | null;
  costo_unitario: string | number | null;
  ubicacion: string | null;
  foto_url: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function mapRawToItem(row: RawMaterial): StockItem {
  return {
    id: row.id,
    name: row.nombre,
    cat: row.categoria || "",
    unit: row.unidad || "",
    qty: Number(row.stock_actual) || 0,
    min: Number(row.stock_minimo) || 0,
    cost: Number(row.costo_unitario) || 0,
    loc: row.ubicacion || "",
    photo: row.foto_url || "",
  };
}

async function accessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || "";
}

async function authHeaders(): Promise<Record<string, string>> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${await accessToken()}`,
  };
}

async function parseError(res: Response): Promise<Error> {
  const err = await res.json().catch(() => ({}));
  return new Error(err.message || err.error || `Request failed: ${res.status}`);
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function getStock(obraId: string): Promise<StockData> {
  const headers = await authHeaders();
  const [rows, cats] = await Promise.all([
    request<RawMaterial[]>(`/materiales/${obraId}`, { headers }),
    request<{ nombre: string }[]>(`/materiales/${obraId}/categorias`, { headers }),
  ]);
  const items = rows.map(mapRawToItem);
  const categories = cats.map((c) => c.nombre);
  // Defensa: categorías presentes en materiales que no estén en la tabla
  for (const it of items) {
    if (it.cat && !categories.some((c) => c.toLowerCase() === it.cat.toLowerCase())) categories.push(it.cat);
  }
  return { items, categories };
}

// Sube la foto a Storage vía Backend (imagen cruda) y devuelve el material actualizado
async function uploadFoto(id: string, file: File): Promise<StockItem> {
  const row = await request<RawMaterial>(`/materiales/${id}/foto`, {
    method: "POST",
    headers: { "Content-Type": file.type, Authorization: `Bearer ${await accessToken()}` },
    body: file,
  });
  return mapRawToItem(row);
}

function toBody(item: StockItem) {
  return {
    nombre: item.name,
    categoria: item.cat,
    unidad: item.unit,
    ubicacion: item.loc,
    stock_actual: item.qty,
    stock_minimo: item.min,
    costo_unitario: item.cost,
  };
}

export async function createMaterial(obraId: string, item: StockItem, photo: File | null): Promise<StockItem> {
  const row = await request<RawMaterial>(`/materiales`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ obra_id: obraId, ...toBody(item) }),
  });
  const created = mapRawToItem(row);
  if (!photo) return created;
  try {
    return await uploadFoto(created.id, photo);
  } catch {
    throw new Error("El material se guardó, pero no se pudo subir la foto");
  }
}

export async function updateMaterial(item: StockItem, photo: File | null): Promise<StockItem> {
  const row = await request<RawMaterial>(`/materiales/${item.id}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(toBody(item)),
  });
  const updated = mapRawToItem(row);
  if (!photo) return updated;
  try {
    return await uploadFoto(item.id, photo);
  } catch {
    throw new Error("El material se guardó, pero no se pudo subir la foto");
  }
}

// delta > 0 suma, delta < 0 resta; el Backend registra el movimiento de stock
export async function ajustarStock(id: string, delta: number): Promise<StockItem> {
  const row = await request<RawMaterial>(`/materiales/${id}/ajuste`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ delta }),
  });
  return mapRawToItem(row);
}

export async function deleteMaterial(id: string): Promise<void> {
  await request(`/materiales/${id}`, { method: "DELETE", headers: await authHeaders() });
}

export async function createCategoria(obraId: string, nombre: string): Promise<string> {
  const row = await request<{ nombre: string }>(`/materiales/categorias`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ obra_id: obraId, nombre }),
  });
  return row.nombre;
}
