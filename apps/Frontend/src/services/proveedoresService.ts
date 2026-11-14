import { supabase } from "@/lib/supabaseClient";
import type { Proveedor } from "@/app/[obraId]/dashboard/proveedores/data";
import type { SupplierData } from "@/app/[obraId]/dashboard/_components/SupplierModal";

interface RawProveedor {
  id: string;
  scope: "global" | "obra";
  nombre: string;
  rubro: string | null;
  cuit: string | null;
  contacto_nombre: string | null;
  contacto_puesto: string | null;
  telefono: string | null;
  whatsapp: string | null;
  email: string | null;
  web: string | null;
  direccion: string | null;
  condicion_pago: string | null;
  plazo_entrega: string | null;
  descripcion: string | null;
  fav: boolean;
  // numeric de PostgreSQL llega como string
  pedidos_count: string | number;
  spent: string | number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function mapRawToProveedor(row: RawProveedor): Proveedor {
  return {
    id: row.id,
    scope: row.scope,
    fav: !!row.fav,
    name: row.nombre,
    rubro: row.rubro || "",
    cuit: row.cuit || "",
    contact: row.contacto_nombre || "",
    role: row.contacto_puesto || "",
    phone: row.telefono || "",
    wa: row.whatsapp || "",
    email: row.email || "",
    web: row.web || "",
    address: row.direccion || "",
    pay: row.condicion_pago || "",
    lead: row.plazo_entrega || "",
    desc: row.descripcion || "",
    orders: Number(row.pedidos_count) || 0,
    spent: Number(row.spent) || 0,
  };
}

function toBody(d: SupplierData) {
  return {
    nombre: d.name,
    rubro: d.rubro,
    cuit: d.cuit,
    contacto_nombre: d.contact,
    contacto_puesto: d.role,
    telefono: d.phone,
    whatsapp: d.wa,
    email: d.email,
    web: d.web,
    direccion: d.address,
    condicion_pago: d.pay,
    plazo_entrega: d.lead,
    descripcion: d.desc,
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

async function parseError(res: Response): Promise<Error> {
  const err = await res.json().catch(() => ({}));
  // Los errores de permisos del backend vienen como { code, message } (403
  // SIN_PERMISO); los de validación, como { error }. Se acepta cualquiera.
  return new Error(err.error || err.message || `Request failed: ${res.status}`);
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// Trae los dos ámbitos (catálogo de la empresa + agenda de esta obra) en paralelo
export async function getProveedores(obraId: string): Promise<Proveedor[]> {
  const headers = await authHeaders();
  const [globales, propios] = await Promise.all([
    request<RawProveedor[]>(`/proveedores?obra_id=${obraId}&scope=global`, { headers }),
    request<RawProveedor[]>(`/proveedores?obra_id=${obraId}&scope=obra`, { headers }),
  ]);
  return [...globales, ...propios].map(mapRawToProveedor);
}

// `obra_id` viaja siempre como contexto de permiso, también para el catálogo
// global (el backend autoriza por el rol que la persona tiene en esa obra).
export async function createProveedor(obraId: string, scope: "global" | "obra", data: SupplierData): Promise<Proveedor> {
  const row = await request<RawProveedor>(`/proveedores`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ scope, obra_id: obraId, ...toBody(data) }),
  });
  return mapRawToProveedor(row);
}

export async function updateProveedor(obraId: string, id: string, data: SupplierData): Promise<Proveedor> {
  const row = await request<RawProveedor>(`/proveedores/${id}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ obra_id: obraId, ...toBody(data) }),
  });
  return mapRawToProveedor(row);
}

export async function setFavorito(obraId: string, id: string, fav: boolean): Promise<void> {
  await request(`/proveedores/${id}/favorito`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ obra_id: obraId, fav }),
  });
}

// Pasa un proveedor de "solo esta obra" al catálogo de la empresa.
// La respuesta no trae fav/pedidos_count/spent (no es la misma query que el
// listado): el caller actualiza esos campos localmente, solo cambia el scope.
export async function promoverProveedor(obraId: string, id: string): Promise<void> {
  await request(`/proveedores/${id}/promover?obra_id=${obraId}`, {
    method: "POST",
    headers: await authHeaders(),
  });
}

export async function deleteProveedor(obraId: string, id: string): Promise<void> {
  await request(`/proveedores/${id}?obra_id=${obraId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
}
