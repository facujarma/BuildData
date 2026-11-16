// Página de planes en modo demo (DEMO_ACTIVO): no se publican precios, cada
// plan aparece bloqueado con la etiqueta "Demo" y el aviso explica que se
// buscan personas para probar la app sin costo, con las dos casillas de email.
import { afterEach, describe, expect, test } from "bun:test";

// happy-dom se registra una vez para todo el proceso en test/setup.ts.
const { cleanup, render, screen } = await import("@testing-library/react");

const { default: PaymentsPage } = await import("./page");

function texto() {
  return document.body.textContent ?? "";
}

function mailtos() {
  return Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(
    (a) => a.getAttribute("href") ?? "",
  );
}

afterEach(() => cleanup());

describe("página de planes en modo demo", () => {
  test("no muestra precios ni facturación", () => {
    render(<PaymentsPage />);
    expect(texto()).not.toContain("AR$");
    expect(texto()).not.toContain("US$");
    expect(texto()).not.toContain("Facturado anualmente");
    expect(texto()).not.toContain("14 días sin tarjeta");
  });

  test("cada plan queda bloqueado y etiquetado como Demo", () => {
    render(<PaymentsPage />);
    // Un "Demo" por tarjeta (Inicio, Profesional, Empresa).
    expect(screen.getAllByText("Demo").length).toBe(3);
    expect(screen.getAllByText(/Precio bloqueado/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText(/Bloqueado/).length).toBeGreaterThanOrEqual(3);
  });

  test("el aviso explica la prueba sin costo y sus límites", () => {
    render(<PaymentsPage />);
    expect(
      screen.getByText(/Estamos buscando personas para probar BuildData sin costo/i),
    ).toBeTruthy();
    expect(texto()).toContain("límites de uso");
    expect(texto()).toContain("1 obra activa por cuenta");
    expect(texto()).toContain("Hasta 5 personas en el equipo");
    expect(texto()).toContain("100 mensajes del bot por mes");
  });

  test("las dos casillas de contacto son links de email", () => {
    render(<PaymentsPage />);
    const hrefs = mailtos();
    expect(hrefs.some((h) => h.includes("info@builddata.com.ar"))).toBe(true);
    expect(hrefs.some((h) => h.includes("facundojarma@gmail.com"))).toBe(true);
    // El CTA de cada tarjeta pide la demo por email.
    expect(screen.getAllByText("Pedir demo").length).toBe(3);
  });

  test("no queda el toggle mensual/anual", () => {
    render(<PaymentsPage />);
    expect(screen.queryByText("Mensual")).toBeNull();
    expect(screen.queryByText("Anual")).toBeNull();
  });
});
