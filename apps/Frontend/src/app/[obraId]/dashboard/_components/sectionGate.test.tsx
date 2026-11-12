// Tests del gate de sección del dashboard (ENTREGABLE 3): cuando se entra por
// URL directa a una sección sin permiso, se renderiza el cartel con el rol y el
// permiso faltante y NO se monta la pantalla (ni sus requests).
//
// Se mockean `next/navigation` (la ruta) y el contexto de rol. El gate real es
// el que usa `layout.tsx`, así que esto prueba el comportamiento de producción:
// la composición `permisoDeRuta` + `permisoFaltante` + `SectionBlocked`.

import type { ReactNode } from "react";
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("@/lib/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}));

const OBRA = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const BASE = `/${OBRA}/dashboard`;

let pathnameActual = BASE;
let busquedaActual = "";

mock.module("next/navigation", () => ({
  usePathname: () => pathnameActual,
  useSearchParams: () => new URLSearchParams(busquedaActual),
}));

// happy-dom se registra una vez para todo el proceso en test/setup.ts.
const { cleanup, render, screen } = await import("@testing-library/react");
const { SectionGate } = await import("./SectionGate");
const { RoleContext } = await import("./RoleContext");

interface Escenario {
  rolNombre: string;
  web: string[];
  loading?: boolean;
  error?: Error | null;
}

function renderGate(escenario: Escenario, children: ReactNode) {
  const web = new Set(escenario.web);
  const refresco = mock(() => {});
  const utils = render(
    <RoleContext.Provider
      value={{
        rol: {
          id: "rol-1",
          nombre: escenario.rolNombre,
          nivel: 10,
          es_sistema: true,
          descripcion: "",
        },
        permisos: null,
        loading: escenario.loading ?? false,
        error: escenario.error ?? null,
        puede: (permiso: string) => web.has(permiso),
        refresh: refresco,
      }}
    >
      <SectionGate>{children}</SectionGate>
    </RoleContext.Provider>,
  );
  return { ...utils, refresco };
}

beforeEach(() => {
  pathnameActual = BASE;
  busquedaActual = "";
  cleanup();
});

afterAll(() => {
  mock.restore();
});

describe("SectionGate — URL directa a una sección sin permiso", () => {
  test("Obrero en Costos: cartel con su rol y el permiso faltante, sin montar la pantalla", () => {
    pathnameActual = `${BASE}/costos`;

    renderGate(
      { rolNombre: "Obrero", web: ["dashboard.ver", "cronograma.ver"] },
      <p>CONTENIDO-DE-PRESUPUESTO</p>,
    );

    expect(screen.getByText("Sección bloqueada")).toBeTruthy();
    expect(screen.getByText("Obrero")).toBeTruthy();
    expect(screen.getByText("ver el presupuesto")).toBeTruthy();
    expect(screen.getByText("presupuesto.ver")).toBeTruthy();
    expect(screen.queryByText("CONTENIDO-DE-PRESUPUESTO")).toBeNull();
  });

  test("la sub-sección manda: Costos con ?v=recibos exige recibos.ver", () => {
    pathnameActual = `${BASE}/costos`;
    busquedaActual = "v=recibos";

    renderGate(
      { rolNombre: "Capataz", web: ["presupuesto.ver", "stock.ver"] },
      <p>CONTENIDO</p>,
    );

    expect(screen.getByText("ver comprobantes")).toBeTruthy();
    expect(screen.queryByText("CONTENIDO")).toBeNull();
  });

  test("Capataz en Configuración: bloqueado (no tiene configuracion.ver ni roles.administrar)", () => {
    pathnameActual = `${BASE}/configuracion`;

    renderGate(
      { rolNombre: "Capataz", web: ["dashboard.ver", "pedidos.ver"] },
      <p>CONTENIDO-CONFIG</p>,
    );

    expect(screen.getByText("Sección bloqueada")).toBeTruthy();
    expect(screen.queryByText("CONTENIDO-CONFIG")).toBeNull();
  });
});

describe("SectionGate — secciones permitidas", () => {
  test("con el permiso se monta la pantalla", () => {
    pathnameActual = `${BASE}/costos`;

    renderGate(
      { rolNombre: "Director", web: ["presupuesto.ver"] },
      <p>CONTENIDO-DE-PRESUPUESTO</p>,
    );

    expect(screen.getByText("CONTENIDO-DE-PRESUPUESTO")).toBeTruthy();
    expect(screen.queryByText("Sección bloqueada")).toBeNull();
  });

  test("Configuración se abre con roles.administrar aunque no tenga configuracion.ver", () => {
    pathnameActual = `${BASE}/configuracion`;

    renderGate(
      { rolNombre: "Auditor", web: ["roles.administrar"] },
      <p>EDITOR-DE-ROLES</p>,
    );

    expect(screen.getByText("EDITOR-DE-ROLES")).toBeTruthy();
  });

  test("las rutas sin requisito (perfil) nunca se bloquean", () => {
    pathnameActual = `${BASE}/perfil`;

    renderGate({ rolNombre: "Cliente", web: [] }, <p>MI-PERFIL</p>);

    expect(screen.getByText("MI-PERFIL")).toBeTruthy();
  });
});

describe("SectionGate — carga y error del rol", () => {
  test("mientras carga no pinta children (evita requests y flash de acciones)", () => {
    pathnameActual = `${BASE}/dashboard`;

    renderGate(
      { rolNombre: "Obrero", web: ["dashboard.ver"], loading: true },
      <p>DASHBOARD</p>,
    );

    expect(screen.queryByText("DASHBOARD")).toBeNull();
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  test("error al cargar permisos: tarjeta con reintento (no un error genérico)", () => {
    pathnameActual = `${BASE}/dashboard`;

    const { refresco } = renderGate(
      {
        rolNombre: "Obrero",
        web: [],
        error: new Error("No pertenecés a esta obra"),
      },
      <p>DASHBOARD</p>,
    );

    expect(screen.getByText("No pudimos cargar tus permisos")).toBeTruthy();
    expect(screen.getByText("No pertenecés a esta obra")).toBeTruthy();
    expect(screen.queryByText("DASHBOARD")).toBeNull();

    screen.getByText("Reintentar").click();
    expect(refresco).toHaveBeenCalledTimes(1);
  });
});
