// Tests del flujo "invitar por WhatsApp" con selector de personas existentes.
//
// Lo que fija:
// - el aviso de revisar primero la lista y las personas ya vinculadas
//   deshabilitadas;
// - elegir una persona usa su nombre/rol (no los del body) y pide el teléfono
//   solo si todavía no tiene uno;
// - la opción "No está en la lista" mantiene el alta manual de siempre;
// - el POST manda `persona_id` + `telefono` en el modo existente y
//   `nombre` + `telefono` + `rol` en el manual.

import { afterAll, afterEach, describe, expect, mock, test } from "bun:test";

process.env.NEXT_PUBLIC_BOT_PHONE = "5491100000000";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";

const PERSONA_SIN_TEL = {
  id: "3b4c5d6e-7f8a-4b9c-8d0e-23456789abcd",
  who: "AW",
  name: "Ana Web",
  email: "ana@ejemplo.com",
  phone: null,
  role: "Capataz",
  tasks: 0,
  reports: 0,
};

const PERSONA_CON_TEL = {
  id: "5d6e7f8a-9b0c-4d1e-8f20-456789abcdef",
  who: "BW",
  name: "Beto Web",
  email: "beto@ejemplo.com",
  phone: "5491100000000",
  role: "Obrero",
  tasks: 0,
  reports: 0,
};

const crearMock = mock(async (obraId: string, datos: Record<string, unknown>) => ({
  id: "inv-1",
  token: "v1.token-de-prueba",
  expira_at: "2026-11-17T12:00:00.000Z",
  nombre: datos.persona_id ? "Ana Web" : String(datos.nombre),
  telefono: String(datos.telefono),
  rol: datos.persona_id ? "Capataz" : String(datos.rol ?? "Obrero"),
  persona_id: datos.persona_id ?? null,
}));

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

mock.module("@/services/equipoService", () => ({
  crearInvitacionObrero: crearMock,
}));

const { cleanup, fireEvent, render, screen, waitFor } = await import(
  "@testing-library/react"
);
const { InviteTeamModal } = await import("./InviteTeamModal");

afterEach(() => {
  cleanup();
  crearMock.mockClear();
});

afterAll(() => {
  mock.restore();
});

function renderModal(personas = [PERSONA_SIN_TEL, PERSONA_CON_TEL], onSave = () => {}) {
  return render(
    <InviteTeamModal
      open
      obraId={OBRA_ID}
      personas={personas}
      onClose={() => {}}
      onSave={onSave}
    />,
  );
}

function completarTelefono(area = "11", numero = "43614361") {
  fireEvent.change(screen.getByLabelText("Código de área"), { target: { value: area } });
  fireEvent.change(screen.getByLabelText("Número de teléfono"), { target: { value: numero } });
}

describe("InviteTeamModal — selector de personas de la obra", () => {
  test("muestra el aviso y deshabilita a quien ya usa WhatsApp", () => {
    renderModal();

    expect(screen.getByText(/Primero fijate si ya está en la obra/)).toBeTruthy();
    expect(screen.getByRole("option", { name: /Ana Web/ }).hasAttribute("disabled")).toBe(
      false,
    );
    expect(
      screen.getByRole("option", { name: /Beto Web/ }).hasAttribute("disabled"),
    ).toBe(true);
  });

  test("al elegir una persona sin teléfono muestra su rol y pide el número", () => {
    renderModal();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: PERSONA_SIN_TEL.id },
    });

    // El nombre/rol salen de la persona elegida, no de un formulario manual.
    expect(screen.getAllByText("Ana Web").length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText("Ej: Ramón Díaz")).toBeNull();
    expect(screen.getByLabelText("Código de área")).toBeTruthy();
    expect(screen.getByText(/Se mantiene el rol que ya tiene en la obra/)).toBeTruthy();
  });

  test("genera el link con persona_id y el teléfono ingresado", async () => {
    renderModal([PERSONA_SIN_TEL]);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: PERSONA_SIN_TEL.id },
    });
    completarTelefono();
    fireEvent.click(screen.getByRole("button", { name: /Generar link/ }));

    await waitFor(() =>
      expect(crearMock).toHaveBeenCalledWith(OBRA_ID, {
        persona_id: PERSONA_SIN_TEL.id,
        telefono: "+54 11 43614361",
      }),
    );
    expect(screen.getByRole("button", { name: /Enviar por WhatsApp/ })).toBeTruthy();
  });

  test("'No está en la lista' vuelve al alta manual con nombre y rol", async () => {
    renderModal();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "__manual__" },
    });

    expect(screen.getByPlaceholderText("Ej: Ramón Díaz")).toBeTruthy();
    expect(screen.getByText(/El obrero no necesita cuenta ni app/)).toBeTruthy();
  });

  test("el alta manual manda nombre, teléfono y rol", async () => {
    renderModal([]);

    fireEvent.change(screen.getByPlaceholderText("Ej: Ramón Díaz"), {
      target: { value: "Ramón Díaz" },
    });
    completarTelefono();
    fireEvent.click(screen.getByRole("button", { name: /Generar link/ }));

    await waitFor(() =>
      expect(crearMock).toHaveBeenCalledWith(OBRA_ID, {
        nombre: "Ramón Díaz",
        telefono: "+54 11 43614361",
        rol: "Obrero",
      }),
    );
  });

  test("al enviar por WhatsApp pasa el nombre/rol guardados y abre wa.me", async () => {
    const onSave = mock(() => {});
    const openMock = mock(() => null);
    const openOriginal = window.open;
    window.open = openMock as unknown as typeof window.open;

    try {
      renderModal([PERSONA_CON_TEL], onSave);
      // Beto ya tiene teléfono: no hay que tipear nada.
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: PERSONA_CON_TEL.id },
      });
      fireEvent.click(screen.getByRole("button", { name: /Generar link/ }));

      const enviar = await screen.findByRole("button", { name: /Enviar por WhatsApp/ });
      fireEvent.click(enviar);

      expect(openMock).toHaveBeenCalledTimes(1);
      expect(String(openMock.mock.calls[0][0])).toContain(
        "wa.me/5491100000000?text=",
      );
      expect(onSave).toHaveBeenCalledWith({
        nombre: "Ana Web",
        telefono: "5491100000000",
        rol: "Capataz",
        link: expect.stringContaining("wa.me/5491100000000"),
      });
    } finally {
      window.open = openOriginal;
    }
  });
});
