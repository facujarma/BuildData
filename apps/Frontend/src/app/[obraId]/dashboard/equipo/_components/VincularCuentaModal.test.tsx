// Test de comportamiento del modal de vinculación de cuentas (Equipo).
//
// Se renderiza el componente real: se mockea `@/lib/supabaseClient` (el módulo
// real exige env al importarse), `@/contexts/AuthContext` (DAvatar lee el perfil)
// y `fetch` global (la API). El test cubre el flujo completo: lista de personas
// con acceso, selección, POST al endpoint de vincular, cierre + callback y el
// error textual inline sin cerrar el modal.

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

// happy-dom se registra una vez para todo el proceso en test/setup.ts.
const { cleanup, fireEvent, render, screen, waitFor } = await import(
  "@testing-library/react"
);
const { VincularCuentaModal } = await import("./VincularCuentaModal");
import type { Obrero, Person } from "../data";

const OBRERO: Obrero = {
  id: "2a3b4c5d-6e7f-4a8b-9c0d-123456789abc",
  name: "Ana WhatsApp",
  phone: "5491143614361",
  link: "",
  sent: true,
  rol: "Obrero",
};

const PERSONAS: Person[] = [
  {
    id: "3b4c5d6e-7f8a-4b9c-8d0e-23456789abcd",
    who: "AW",
    name: "Ana Web",
    email: "ana@ejemplo.com",
    role: "Director",
    tasks: 0,
    reports: 0,
  },
  {
    id: "4c5d6e7f-8a9b-4c0d-9e1f-3456789abcde",
    who: "BG",
    name: "Beto Gómez",
    email: null,
    role: "Capataz",
    tasks: 0,
    reports: 0,
  },
];

type Llamada = { url: string; init: RequestInit & { headers: Record<string, string> } };

const llamadas: Llamada[] = [];
let respuesta: { ok: boolean; status: number; body: unknown };
const fetchOriginal = globalThis.fetch;

beforeEach(() => {
  llamadas.length = 0;
  respuesta = {
    ok: true,
    status: 200,
    body: { mensaje: "Cuentas vinculadas", total_movido: 3 },
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
  cleanup();
  globalThis.fetch = fetchOriginal;
});

afterAll(() => {
  mock.restore();
});

function renderModal(extra: Partial<Parameters<typeof VincularCuentaModal>[0]> = {}) {
  const onClose = mock(() => {});
  const onLinked = mock(() => {});
  const utils = render(
    <VincularCuentaModal
      open
      obraId={OBRA_ID}
      obrero={OBRERO}
      personas={PERSONAS}
      onClose={onClose}
      onLinked={onLinked}
      {...extra}
    />,
  );
  return { ...utils, onClose, onLinked };
}

describe("VincularCuentaModal — vincular una cuenta web con la persona de WhatsApp", () => {
  test("lista las cuentas web con nombre, email y rol y explica el merge", () => {
    renderModal();

    const ana = screen.getByRole("radio", { name: /Ana Web/ }) as HTMLInputElement;
    const beto = screen.getByRole("radio", { name: /Beto Gómez/ }) as HTMLInputElement;

    expect(ana.checked).toBe(false);
    expect(beto.checked).toBe(false);
    expect(screen.getByText("ana@ejemplo.com")).toBeTruthy();
    // Sin email, la fila muestra el fallback y no un hueco.
    expect(screen.getByText("Sin email")).toBeTruthy();
    expect(screen.getByText(/Se conserva el rol más alto/)).toBeTruthy();
    expect(screen.getByText(/migran historial, tareas y membresías/)).toBeTruthy();

    const confirmar = screen.getByRole("button", { name: "Vincular cuenta" }) as HTMLButtonElement;
    expect(confirmar.disabled).toBe(true);

    fireEvent.click(ana);
    expect(ana.checked).toBe(true);
    expect(confirmar.disabled).toBe(false);
  });

  test("al confirmar hace el POST con destino en la URL y origen en el body, y avisa al padre", async () => {
    const { onLinked, onClose } = renderModal();

    fireEvent.click(screen.getByRole("radio", { name: /Ana Web/ }));
    fireEvent.click(screen.getByRole("button", { name: "Vincular cuenta" }));

    await waitFor(() => expect(llamadas).toHaveLength(1));

    expect(llamadas[0].url).toBe(
      `http://localhost:3001/obreros/${OBRERO.id}/obra/${OBRA_ID}/vincular`,
    );
    expect(llamadas[0].init.method).toBe("POST");
    expect(llamadas[0].init.headers.Authorization).toContain("token-de-prueba");
    expect(JSON.parse(String(llamadas[0].init.body))).toEqual({
      persona_origen_id: PERSONAS[0].id,
    });

    await waitFor(() => expect(onLinked.mock.calls.length).toBe(1));
    // `onLinked` corre antes del cierre: el padre hace flash + recargar y el
    // modal se cierra solo.
    expect(onClose.mock.calls.length).toBe(1);
  });

  test("403 del backend: muestra el texto inline, no cierra y no avisa éxito", async () => {
    respuesta = {
      ok: false,
      status: 403,
      body: {
        code: "SIN_PERMISO",
        message: 'No tenés permisos para administrar el equipo de la obra "Obra A"',
      },
    };
    const { onLinked, onClose } = renderModal();

    fireEvent.click(screen.getByRole("radio", { name: /Ana Web/ }));
    fireEvent.click(screen.getByRole("button", { name: "Vincular cuenta" }));

    await waitFor(() =>
      expect(
        screen.getByText('No tenés permisos para administrar el equipo de la obra "Obra A"'),
      ).toBeTruthy(),
    );
    expect(onLinked.mock.calls.length).toBe(0);
    expect(onClose.mock.calls.length).toBe(0);
    // Sigue abierto y se puede reintentar: el botón vuelve a estar habilitado.
    const confirmar = screen.getByRole("button", { name: "Vincular cuenta" }) as HTMLButtonElement;
    expect(confirmar.disabled).toBe(false);
  });

  test("sin cuentas web la acción queda deshabilitada y avisa que no hay nada para unificar", () => {
    renderModal({ personas: [] });

    expect(screen.getByText("No hay cuentas web para vincular.")).toBeTruthy();
    const confirmar = screen.getByRole("button", { name: "Vincular cuenta" }) as HTMLButtonElement;
    expect(confirmar.disabled).toBe(true);
  });

  test("cancelar cierra sin llamar a la API", () => {
    const { onClose, onLinked } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose.mock.calls.length).toBe(1);
    expect(onLinked.mock.calls.length).toBe(0);
    expect(llamadas).toHaveLength(0);
  });
});
