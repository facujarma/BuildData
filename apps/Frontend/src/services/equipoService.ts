import { supabase } from "@/lib/supabaseClient";
import type { Person, Obrero } from "@/app/[obraId]/dashboard/equipo/data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface EquipoData {
  people: Person[];
  obreros: Obrero[];
}

interface ApiMiembro {
  id: string;
  nombre: string;
  telefono: string | null;
  auth_user_id: string | null;
  rol: string | null;
  joined_at: string;
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

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export interface InvitacionCreada {
  id: string;
  token: string;
  expira_at: string;
}

export async function crearInvitacionObrero(
  obraId: string,
  datos: { nombre: string; telefono: string; rol?: string },
): Promise<InvitacionCreada> {
  const res = await fetch(`${API_URL}/obreros/invitacion`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ obra_id: obraId, ...datos }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getEquipo(obraId: string): Promise<EquipoData> {
  const res = await fetch(`${API_URL}/obreros/${obraId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }

  const rows: ApiMiembro[] = await res.json();

  const people: Person[] = [];
  const obreros: Obrero[] = [];

  for (const r of rows) {
    if (r.auth_user_id) {
      people.push({
        who: initials(r.nombre),
        name: r.nombre,
        role: r.rol || "Sin asignar",
        tasks: 0,
        reports: 0,
      });
    } else {
      obreros.push({
        id: r.id,
        name: r.nombre,
        phone: r.telefono || "",
        link: "",
        sent: true,
      });
    }
  }

  return { people, obreros };
}
