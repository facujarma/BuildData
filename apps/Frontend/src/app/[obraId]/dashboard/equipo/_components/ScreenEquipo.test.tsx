// Tests de la acción "Vincular cuenta" en Equipo.
//
// Se renderiza la pantalla real con el contexto de rol provisto a mano y `fetch`
// mockeado (GET /obreros/:obra_id). Lo que se prueba es la regla de la UI:
// - el botón aparece por cada obrero real solo si hay permiso `equipo.administrar`
//   y al menos una persona con acceso web;
// - sin permiso o sin cuentas web no se ofrece la acción;
// - al clickearlo se abre el modal con las cuentas web disponibles.

import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";

mock.module("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { access_token: "token-de-prueba" } } }),
    },
  },
}));

mock.module("@/contexts/AuthContext", () => ({
  useAuth: () => ({ profile: null }),
}));

mock.module("next/navigation", () => ({
  useParams: () => ({ obraId: OBRA_ID }),
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {} }),
  usePathname: () => `/${OBRA_ID}/dashboard/equipo`,
  useSearchParams: () => new URLSearchParams(),
}));

// happy-dom se registra una vez para todo el proceso en test/setup.ts.
const { cleanup, fireEvent, render, screen, waitFor } = await import(
  "@testing-library/react"
);
const { ScreenEquipo } = await import("./ScreenEquipo");
const { RoleContext } = await import("../../_components/RoleContext");

type Fila = {
  id: string;
  nombre: string;
  telefono: string | null;
  auth_user_id: string | null;
  rol: string | null;
  joined_at: string;
  email?: string | null;
};

const PERSONA_WEB: Fila = {
  id: "3b4c5d6e-7f8a-4b9c-8d0e-23456789abcd",
  nombre: "Ana Web",
  telefono: "5491143614361",
  auth_user_id: "auth-1",
  rol: "Director",
  joined_at: "2026-11-01T12:00:00.000Z",
  email: "ana@ejemplo.com",
};

const OBRERO_WA: Fila = {
  id: "2a3b4c5d-6e7f-4a8b-9c0d-123456789abc",
  nombre: "Beto WhatsApp",
  telefono: "5491100000000",
  auth_user_id: null,
  rol: "Obrero",
  joined_at: "2026-11-01T12:00:00.000Z",
  email: null,
};

const OBRERO_WA_2: Fila = {
  ...OBRERO_WA,
  id: "5d6e7f8a-9b0c-4d1e-8f20-456789abcdef",
  nombre: "Carla WhatsApp",
  telefono: "5491100001111",
};

let filas: Fila[] = [];
const fetchOriginal = globalThis.fetch;

beforeEach(() => {
  filas = [];
  globalThis.fetch = (async () => ({
    ok: true,
    status: 200,
    json: async () => filas,
  })) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  globalThis.fetch = fetchOriginal;
});

afterAll(() => {
  mock.restore();
});

function renderEquipo(permisos: string[]) {
  const habilitados = new Set(permisos);
  return render(
    <RoleContext.Provider
      value={{
        rol: { id: "rol-1", nombre: "Director", nivel: 100, es_sistema: true, descripcion: "" },
        permisos: null,
        loading: false,
        error: null,
        puede: (permiso: string) => habilitados.has(permiso),
        refresh: () => {},
      }}
    >
      <ScreenEquipo />
    </RoleContext.Provider>,
  );
}

describe("ScreenEquipo — acción Vincular cuenta", () => {
  test("con equipo.administrar y cuentas web, cada obrero real ofrece vincular", async () => {
    filas = [PERSONA_WEB, OBRERO_WA, OBRERO_WA_2];
    renderEquipo(["equipo.administrar"]);

    await waitFor(() => expect(screen.getByText("Beto WhatsApp")).toBeTruthy());

    // Una acción por obrero de WhatsApp (2), no por persona con acceso.
    const acciones = screen.queryAllByRole("button", { name: "Vincular cuenta" });
    expect(acciones).toHaveLength(2);
    // La persona con acceso se muestra arriba, en su propia tarjeta.
    expect(screen.getByText("Ana Web")).toBeTruthy();
  });

  test("al clickear la acción se abre el modal con las cuentas web para elegir", async () => {
    filas = [PERSONA_WEB, OBRERO_WA];
    renderEquipo(["equipo.administrar"]);

    await waitFor(() => expect(screen.getByText("Beto WhatsApp")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Vincular cuenta" }));

    expect(screen.getByText("Vincular cuenta web")).toBeTruthy();
    expect(screen.getByText(/Se conserva el rol más alto/)).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Ana Web/ })).toBeTruthy();
    // El destino del merge es el obrero clickeado: su nombre aparece en la fila
    // y otra vez dentro del modal (la fila sola ya sumaba 1).
    expect(screen.getAllByText("Beto WhatsApp").length).toBe(2);
  });

  test("sin equipo.administrar no se ofrece la acción (ni invitar)", async () => {
    filas = [PERSONA_WEB, OBRERO_WA];
    renderEquipo([]);

    await waitFor(() => expect(screen.getByText("Beto WhatsApp")).toBeTruthy());
    expect(screen.queryAllByRole("button", { name: "Vincular cuenta" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: /Invitar obrero/ })).toHaveLength(0);
  });

  test("sin personas con acceso no hay nada que unificar: no se muestra la acción", async () => {
    filas = [OBRERO_WA];
    renderEquipo(["equipo.administrar"]);

    await waitFor(() => expect(screen.getByText("Beto WhatsApp")).toBeTruthy());
    expect(screen.queryAllByRole("button", { name: "Vincular cuenta" })).toHaveLength(0);
  });
});
