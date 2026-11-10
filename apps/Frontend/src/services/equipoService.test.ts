// Tests de contrato de equipoService:
// - crearInvitacionObrero: el body que sale a POST /obreros/invitacion incluye el rol
//   cuando el modal lo manda (y no lo inventa cuando no viene).
// - getEquipo: el `rol` que devuelve GET /obreros/:obra_id llega a la UI, con
//   fallback 'Obrero' cuando el backend lo trae null/ausente.
//
// Sin red ni Supabase real: se mockea `@/lib/supabaseClient` (el módulo real exige
// NEXT_PUBLIC_SUPABASE_URL/ANON_KEY al importarse) y se reemplaza `fetch` global.
// No es tautológico: si se saca `rol` del payload o el mapeo `rol: r.rol || "Obrero"`
// de getEquipo, los asserts de abajo fallan.

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";

mock.module("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { access_token: "token-de-prueba" } } }),
    },
  },
}));

const { crearInvitacionObrero, getEquipo } = await import("./equipoService");

type Llamada = { url: string; init: RequestInit & { headers: Record<string, string> } };

const llamadas: Llamada[] = [];
let respuesta: { ok: boolean; status: number; body: unknown };

const fetchOriginal = globalThis.fetch;

beforeEach(() => {
  llamadas.length = 0;
  respuesta = {
    ok: true,
    status: 201,
    body: { id: "inv-1", token: "v1.token", expira_at: "2026-11-17T12:00:00.000Z" },
  };
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    llamadas.push({
      url: String(url),
      init: { ...init, headers: (init?.headers as Record<string, string>) ?? {} },
    });
    return {
      ok: respuesta.ok,
      status: respuesta.status,
      json: async () => respuesta.body,
    };
  }) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

function bodyEnviado(): Record<string, unknown> {
  expect(llamadas).toHaveLength(1);
  return JSON.parse(String(llamadas[0].init.body)) as Record<string, unknown>;
}

describe("crearInvitacionObrero — payload de la invitación", () => {
  test("sin rol: manda obra_id/nombre/telefono y no inventa un rol", async () => {
    const creada = await crearInvitacionObrero(OBRA_ID, {
      nombre: "Ana Pérez",
      telefono: "5491112345678",
    });

    expect(llamadas[0].url).toBe("http://localhost:3001/obreros/invitacion");
    expect(llamadas[0].init.method).toBe("POST");
    expect(llamadas[0].init.headers["Content-Type"]).toBe("application/json");
    expect(llamadas[0].init.headers.Authorization).toContain("token-de-prueba");

    const body = bodyEnviado();
    expect(body).toEqual({
      obra_id: OBRA_ID,
      nombre: "Ana Pérez",
      telefono: "5491112345678",
    });
    // Explícito: el default de rol lo resuelve el backend (normalizarRol → Obrero),
    // no el frontend. Si el servicio empieza a mandar rol: "Obrero" por su cuenta,
    // este test lo detecta (y hay que actualizarlo a propósito).
    expect("rol" in body).toBe(false);

    expect(creada).toEqual({ id: "inv-1", token: "v1.token", expira_at: "2026-11-17T12:00:00.000Z" });
  });

  test("con rol: el body incluye rol: 'Capataz'", async () => {
    await crearInvitacionObrero(OBRA_ID, {
      nombre: "Beto Gómez",
      telefono: "5491198765432",
      rol: "Capataz",
    });

    const body = bodyEnviado();
    expect(body).toEqual({
      obra_id: OBRA_ID,
      nombre: "Beto Gómez",
      telefono: "5491198765432",
      rol: "Capataz",
    });
  });

  test("rol 'Director': viaja tal cual lo eligió el usuario", async () => {
    await crearInvitacionObrero(OBRA_ID, {
      nombre: "Carla Ruiz",
      telefono: "5491100001111",
      rol: "Director",
    });

    expect(bodyEnviado().rol).toBe("Director");
  });

  test("403 del backend: el mensaje de error llega tal cual (el modal lo muestra textual)", async () => {
    respuesta = {
      ok: false,
      status: 403,
      body: { error: "No podés invitar con un rol superior al tuyo" },
    };

    await expect(
      crearInvitacionObrero(OBRA_ID, { nombre: "Dani", telefono: "5491100002222", rol: "Director" }),
    ).rejects.toThrow("No podés invitar con un rol superior al tuyo");
  });
});

describe("getEquipo — mapeo del rol del backend a la UI", () => {
  const fila = (extra: Record<string, unknown>) => ({
    id: "persona-1",
    nombre: "Nombre",
    telefono: "5491100000000",
    auth_user_id: null,
    rol: "Obrero",
    joined_at: "2026-11-01T12:00:00.000Z",
    ...extra,
  });

  test("mapea rol de cada miembro, separa people/obreros y hace fallback a 'Obrero'", async () => {
    respuesta = {
      ok: true,
      status: 200,
      body: [
        // Con cuenta web: va a people y el rol llega como `role`.
        fila({ id: "p-1", nombre: "Zoe Directora", auth_user_id: "auth-1", rol: "Director" }),
        // Obrero con rol explícito.
        fila({ id: "p-2", nombre: "Beto Capataz", rol: "Capataz" }),
        // Rol null (fila vieja / migración): fallback Obrero.
        fila({ id: "p-3", nombre: "Nulo", rol: null }),
        // Campo rol directamente ausente en la respuesta (y sin teléfono).
        {
          id: "p-4",
          nombre: "Sin campo",
          telefono: null,
          auth_user_id: null,
          joined_at: "2026-11-01T12:00:00.000Z",
        },
      ],
    };

    const { people, obreros } = await getEquipo(OBRA_ID);

    expect(llamadas[0].url).toBe(`http://localhost:3001/obreros/${OBRA_ID}`);

    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({ name: "Zoe Directora", role: "Director" });

    expect(obreros).toHaveLength(3);
    expect(obreros.find((o) => o.id === "p-2")?.rol).toBe("Capataz");
    expect(obreros.find((o) => o.id === "p-3")?.rol).toBe("Obrero");
    expect(obreros.find((o) => o.id === "p-4")?.rol).toBe("Obrero");
    // Teléfono ausente no rompe la fila.
    expect(obreros.find((o) => o.id === "p-4")?.phone).toBe("");
  });

  test("sin filas devuelve listas vacías", async () => {
    respuesta = { ok: true, status: 200, body: [] };

    const { people, obreros } = await getEquipo(OBRA_ID);
    expect(people).toEqual([]);
    expect(obreros).toEqual([]);
  });
});
