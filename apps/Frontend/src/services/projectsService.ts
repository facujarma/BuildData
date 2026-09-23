import type { Obra } from "@/types/projects";
import { supabase } from "@/lib/supabaseClient";

interface CreateObraInput {
  tipo: string;
  plantilla: string;
  nombre: string;
  codigo: string;
  direccion: string;
  ciudad?: string;
  provincia?: string;
  zip?: string;
  pais?: string;
  inicio: string;
  fin: string;
  status?: string;
  team: { name: string; phone: string; role: string }[];
  waConnect: boolean;
  presupuestoTotal?: number;
  rubros?: { nombre: string; presupuesto?: number }[];
  clientName?: string;
  clientContact?: string;
  clientCuit?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientNotes?: string;
}

interface CreateObraPayload {
  name: string;
  code: string;
  type: string;
  address: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  myRole: string;
  team?: string[];
  presupuestoTotal: number;
  rubros: { nombre: string; presupuesto?: number }[];
  clientName?: string;
  clientContact?: string;
  clientCuit?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientNotes?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function mapObra(o: any): Obra {
  return {
    id: String(o.id),
    name: o.name,
    code: o.code,
    address: o.address,
    type: o.type,
    status: o.status,
    progress: o.progress ?? 0,
    alerts: o.alerts ?? 0,
    pedidos: o.pedidos ?? 0,
    team: (o.team || []).map((t: any) => t.initials),
    lastActivity: o.lastActivity || "",
    lastActivityWho: o.lastActivityWho || "",
    starred: o.starred || false,
    color: "#0F4395",
  };
}

export async function getObras(): Promise<Obra[]> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}/obras`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
  });

  if (!res.ok) throw new Error("Error al obtener obras");

  const json = await res.json();

  return (json.obras || []).map(mapObra);
}

export async function getObra(obraId: string): Promise<Obra> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}/obras/${obraId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
  });

  if (!res.ok) throw new Error("Error al obtener obra");

  return mapObra(await res.json());
}

export async function createObra(input: CreateObraInput): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();

  const payload: CreateObraPayload = {
    name: input.nombre,
    code: input.codigo,
    type: input.tipo,
    address: input.direccion,
    startDate: input.inicio || undefined,
    endDate: input.fin || undefined,
    city: input.ciudad || "",
    province: input.provincia || "",
    zip: input.zip,
    country: input.pais,
    status: input.status || "planificacion",
    myRole: "director",
    presupuestoTotal: input.presupuestoTotal ?? 1_000_000,
    rubros: input.rubros || [],
    team: input.team.map((t) => t.name),
    clientName: input.clientName,
    clientContact: input.clientContact,
    clientCuit: input.clientCuit,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    clientNotes: input.clientNotes,
  };

  const res = await fetch(`${API_URL}/obras`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Error al crear obra");
  }

  return res.json();
}