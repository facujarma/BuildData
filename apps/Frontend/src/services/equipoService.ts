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
  email?: string | null;
}

// El backend responde errores con `{ error }` en los controllers viejos y con
// `{ code, message }` en los nuevos (ej: vincular): se acepta cualquiera de los
// dos y, si no hay texto, se cae al status para no mostrar un mensaje vacío.
async function errorDeRespuesta(res: Response): Promise<Error> {
  const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  return new Error(body.error || body.message || `Request failed: ${res.status}`);
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
  // Lo que quedó guardado en la invitación. Para una persona existente, el
  // nombre y el rol salen de la DB (no del body).
  nombre: string;
  telefono: string | null;
  rol: string;
  persona_id?: string | null;
}

export async function crearInvitacionObrero(
  obraId: string,
  datos:
    | { nombre: string; telefono: string; rol?: string; persona_id?: never }
    | { persona_id: string; telefono: string; nombre?: never; rol?: never },
): Promise<InvitacionCreada> {
  const res = await fetch(`${API_URL}/obreros/invitacion`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ obra_id: obraId, ...datos }),
  });
  if (!res.ok) throw await errorDeRespuesta(res);
  return res.json();
}

export async function getEquipo(obraId: string): Promise<EquipoData> {
  const res = await fetch(`${API_URL}/obreros/${obraId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw await errorDeRespuesta(res);

  const rows: ApiMiembro[] = await res.json();

  const people: Person[] = [];
  const obreros: Obrero[] = [];

  for (const r of rows) {
    if (r.auth_user_id) {
      people.push({
        id: r.id,
        who: initials(r.nombre),
        name: r.nombre,
        email: r.email ?? null,
        phone: r.telefono || null,
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
        rol: r.rol || "Obrero",
      });
    }
  }

  return { people, obreros };
}

// ─────────────────────────────────────────────────────────────
// Vinculación de una cuenta web con la persona que reporta por WhatsApp
// ─────────────────────────────────────────────────────────────

// El backend fusiona el origen (cuenta web, `auth_user_id`) en el destino (la
// persona del obrero) y devuelve el resumen del merge (membresías, referencias
// migradas, etc.). La UI no necesita los conteos: usa `mensaje` y recarga.
export interface VinculacionCuenta {
  mensaje?: string;
  total_movido?: number;
  [clave: string]: unknown;
}

export async function vincularCuentaWeb(
  obraId: string,
  ids: { personaDestinoId: string; personaOrigenId: string },
): Promise<VinculacionCuenta> {
  const { personaDestinoId, personaOrigenId } = ids;
  const res = await fetch(
    `${API_URL}/obreros/${personaDestinoId}/obra/${obraId}/vincular`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ persona_origen_id: personaOrigenId }),
    },
  );
  if (!res.ok) throw await errorDeRespuesta(res);
  return res.json();
}
