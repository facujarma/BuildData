import { supabase } from "@/lib/supabaseClient";
import type { PedidoItem } from "@/app/[obraId]/dashboard/pedidos/data";
import { formatARS, formatDate, formatDateShort, formatNumber, formatTime } from "@/lib/format";

export interface NewPedidoPayload {
  proveedor_id: string;
  items: {
    material_id: string;
    cantidad: number;
  }[];
  rubro_id: string | null;
  urgente: boolean;
  nota: string;
  fecha_llegada_estimada: string | null;
  solicitado_por: string | null;
}

// Lo que se manda en el body de PATCH /pedidos/:id/entregar. Los nombres en español y
// snake_case son los que lee entregarPedido() en apps/Backend/controllers/pedidosController.js
export interface EntregaPayload {
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM (puede ir vacío)
  ubicacion: string;
  recibido_por: string;
  documento: string;
}

export interface ObreroLite {
  id: string;
  nombre: string;
}

interface RawPedidoItem {
  material: string | null;
  unidad: string | null;
  cantidad: number | null;
  precio_unitario: number | null;
  subtotal: number | null;
}

interface RawPedido {
  id: string;
  proveedor_id: string | null;
  estado: string;
  aprobado: boolean;
  fecha: string;
  fecha_llegada_estimada: string | null;
  urgente: boolean;
  nota: string | null;
  total: number | null;
  rubro_id: string | null;
  rubro_nombre: string | null;
  fecha_entrega: string | null; // 'YYYY-MM-DDTHH:MM' (texto, sin zona horaria)
  ubicacion_entrega: string | null;
  recibido_por: string | null;
  documento_receptor: string | null;
  proveedor_nombre: string | null;
  solicitado_por_nombre: string | null;
  aprobado_por_nombre: string | null;
  items: RawPedidoItem[];
}

const ESTADO_DB_UI: Record<string, string> = {
  borrador: "draft",
  pendiente: "pending",
  aprobado: "approved",
  rechazado: "cancelled",
  en_camino: "transit",
  demorado: "late",
  entregado: "delivered",
};

function fmtUnit(precio: number | null, unidad: string | null): string {
  const base = formatARS(precio);
  return unidad ? `${base}/${unidad}` : base;
}

function mapEntrega(row: RawPedido): PedidoItem["delivery"] {
  if (row.estado !== "entregado" || !row.fecha_entrega) return undefined;
  const hora = formatTime(row.fecha_entrega);
  return {
    date: `${formatDate(row.fecha_entrega)}${hora && hora !== "00:00" ? ` · ${hora}` : ""}`,
    loc: row.ubicacion_entrega || "",
    receiver: row.recibido_por || "",
    doc: row.documento_receptor || "",
  };
}

function mapRawToItem(row: RawPedido): PedidoItem {
  const items = row.items || [];
  const first = items[0] || null;
  // El Backend persiste el total; el fallback cubre pedidos viejos sin el campo.
  const total = row.total != null
    ? Number(row.total) || 0
    : items.reduce((s, it) => s + (Number(it.subtotal) || (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0)), 0);

  return {
    id: row.id,
    mat: first?.material || "",
    qty: first && (Number(first.cantidad) || 0) !== 0
      ? `${formatNumber(first.cantidad)} ${first.unidad || ""}`.trim()
      : "",
    prov: row.proveedor_nombre || "",
    provId: row.proveedor_id,
    cat: row.rubro_nombre || "",
    date: formatDateShort(row.fecha_llegada_estimada),
    dateISO: row.fecha_llegada_estimada,
    ordered: formatDateShort(row.fecha),
    orderedISO: row.fecha,
    state: ESTADO_DB_UI[row.estado] || row.estado || "draft",
    total,
    unit: first ? fmtUnit(first.precio_unitario, first.unidad) : "",
    who: row.solicitado_por_nombre || "",
    urgent: row.urgente || false,
    note: row.nota || "",
    delivery: mapEntrega(row),
  };
}

// Dirección del Backend (apps/Backend/server.js). En producción sale de la variable de
// entorno NEXT_PUBLIC_API_URL; en local, el backend corre en el puerto 3001.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Headers de todas las llamadas: avisa que el body es JSON y manda el token de login.
// El token es la sesión de Supabase del navegador; en el Backend lo valida
// middleware/authMiddleware.js (sin token válido responde 401).
async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession(); // sesión del usuario logueado (lib/supabaseClient)
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || ""}`,
  };
}

// Convierte una respuesta de error del Backend (400/403/404/409/500) en un Error de JS con
// el mensaje que mandó el controller (ej. "Solo se pueden entregar pedidos aprobados o en
// curso"). Ese mensaje es el que termina mostrando el modal.
async function parseError(res: Response): Promise<Error> {
  const err = await res.json().catch(() => ({})); // si el body no es JSON, objeto vacío
  return new Error(err.message || err.error || `Request failed: ${res.status}`);
}

export async function getPedidos(obraId: string): Promise<PedidoItem[]> {
  const res = await fetch(`${API_URL}/pedidos/${obraId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw await parseError(res);
  const rows: RawPedido[] = await res.json();
  return rows.map(mapRawToItem);
}

export async function createPedido(obraId: string, payload: NewPedidoPayload) {
  const res = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ obra_id: obraId, ...payload }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function aprobarPedido(id: string) {
  const res = await fetch(`${API_URL}/pedidos/${id}/aprobar`, {
    method: "PATCH",
    headers: await authHeaders(),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function rechazarPedido(id: string) {
  const res = await fetch(`${API_URL}/pedidos/${id}/rechazar`, {
    method: "PATCH",
    headers: await authHeaders(),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function cambiarEstadoPedido(id: string, estado: "en_camino" | "demorado") {
  const res = await fetch(`${API_URL}/pedidos/${id}/estado`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// Marca el pedido como entregado; el Backend suma los ítems al stock
// La llama handleDeliverSave() en ScreenPedidos.tsx. El pedido HTTP entra por
// server.js → authMiddleware → routes/pedidos.js → pedidosController.entregarPedido.
export async function entregarPedido(id: string, payload: EntregaPayload) {
  const res = await fetch(`${API_URL}/pedidos/${id}/entregar`, { // fetch = hace el pedido HTTP
    method: "PATCH", // PATCH: modifica un recurso que ya existe
    headers: await authHeaders(), // token de login + tipo JSON
    body: JSON.stringify(payload), // el objeto se convierte a texto JSON para viajar
  });
  if (!res.ok) throw await parseError(res); // status 4xx/5xx → lanza el error con el mensaje del backend
  return res.json(); // 200: devuelve el pedido actualizado
}

export async function getObreros(obraId: string): Promise<ObreroLite[]> {
  const res = await fetch(`${API_URL}/obreros/${obraId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw await parseError(res);
  const rows: { id: string; nombre: string }[] = await res.json();
  return rows
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map((r) => ({ id: r.id, nombre: r.nombre }));
}