import { supabase } from "@/lib/supabaseClient";
import type { Rango } from "@/app/[obraId]/dashboard/reportes/data";

// Portada del reporte (GET /reportes/:obra_id/snapshot). Montos en pesos.
// Los campos de costos/inventario son opcionales: el Backend los omite si el rol
// no tiene `presupuesto.ver`, `recibos.ver` o `stock.ver`.
export interface ReporteSnapshot {
  rango: Rango;
  desde: string | null; // YYYY-MM-DD; null = toda la obra
  obra: string;
  code: string;
  avance: number;
  presupuestoTotal?: number;
  ejecutado?: number; // del período (o acumulado si rango = total)
  ejecutadoTotal?: number;
  comprometido?: number;
  tareas: { total: number; done: number; prog: number; late: number; donePeriodo: number };
  alertas: number; // activas hoy
  alertasPeriodo: number;
  pedidos: number; // del período
  stockLow?: number;
  recibosPend?: number;
  equipo: number;
}

// Reporte generado (POST /reportes/:obra_id/generar): portada + detalle por sección.
// Cada sección trae filas crudas del Backend (ver services/reportes.service.js).
export interface ReporteGenerado {
  id: string;
  titulo: string;
  fecha_generacion: string;
  snapshot: ReporteSnapshot;
  secciones: Record<string, unknown>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getSnapshot(obraId: string, rango: Rango): Promise<ReporteSnapshot> {
  return request(`/reportes/${obraId}/snapshot?rango=${rango}`);
}

export function generarReporte(obraId: string, rango: Rango, secciones: string[]): Promise<ReporteGenerado> {
  return request(`/reportes/${obraId}/generar`, {
    method: "POST",
    body: JSON.stringify({ rango, secciones }),
  });
}
