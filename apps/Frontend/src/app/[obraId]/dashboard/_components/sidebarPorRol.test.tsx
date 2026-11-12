// Tests del sidebar filtrado por rol (ENTREGABLE 2).
//
// Renderiza el `DashSidebar` real con el contexto de rol provisto y verifica
// qué secciones ve cada rol de la matriz web de docs/roles-permisos.md:
// - Obrero: sin Bandeja, Costos, Pedidos ni Configuración.
// - Capataz: con Bandeja/Pedidos/Costos, sin Configuración.
// - Cliente: solo lectura (sin Materiales, Costos, Alertas ni Bandeja).
// - Director: todo, incluida Configuración.
//
// Se mockean la ruta (para abrir un grupo y ver sus hijos), los datos del
// dashboard y las alertas (para no hacer red).

import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("@/lib/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}));

const OBRA = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const BASE = `/${OBRA}/dashboard`;

let pathnameActual = BASE;

mock.module("next/navigation", () => ({
  usePathname: () => pathnameActual,
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    prefetch: () => {},
  }),
  useParams: () => ({ obraId: OBRA }),
}));

mock.module("@/services/alertasService", () => ({
  getAlertas: async () => ({ alerts: [] }),
}));

mock.module("./DashboardDataContext", () => ({
  useDashboardData: () => ({
    obraId: OBRA,
    obraName: "Obra de prueba",
    obraProgress: 42,
    operacionesPendientes: 0,
  }),
}));

// La barra superior arrastra AvatarMenu (AuthProvider) y NotificationsPanel (red):
// para el badge no aportan nada, así que se reemplazan por nodos vacíos.
mock.module("@/components/ui/AvatarMenu", () => ({ AvatarMenu: () => null }));
mock.module("./NotificationsPanel", () => ({ NotificationsPanel: () => null }));

// happy-dom se registra una vez para todo el proceso en test/setup.ts.
const { cleanup, render, screen } = await import("@testing-library/react");
const { fireEvent } = await import("@testing-library/react");
const { DashSidebar } = await import("./DashSidebar");
const { DashTopBar } = await import("./DashTopBar");
const { QuickAddMenu } = await import("./QuickAddMenu");
const { RoleContext } = await import("./RoleContext");

// Matrices web por rol (docs/roles-permisos.md §Matriz por defecto).
const PERMISOS_WEB: Record<string, string[]> = {
  Cliente: [
    "dashboard.ver",
    "equipo.ver",
    "cronograma.ver",
    "actividad.ver",
    "galeria.ver",
    "reportes.ver",
  ],
  Obrero: [
    "dashboard.ver",
    "equipo.ver",
    "cronograma.ver",
    "actividad.ver",
    "galeria.ver",
    "reportes.ver",
    "actividad.registrar",
    "galeria.gestionar",
    "stock.ver",
    "alertas.ver",
    "alertas.gestionar",
  ],
  Capataz: [
    "dashboard.ver",
    "bandeja.ver",
    "bandeja.aprobar",
    "equipo.ver",
    "cronograma.ver",
    "cronograma.editar",
    "actividad.ver",
    "actividad.registrar",
    "galeria.ver",
    "galeria.gestionar",
    "reportes.ver",
    "pedidos.ver",
    "pedidos.crear",
    "pedidos.aprobar",
    "pedidos.entregar",
    "stock.ver",
    "stock.ajustar",
    "proveedores.ver",
    "presupuesto.ver",
    "recibos.ver",
    "recibos.gestionar",
    "alertas.ver",
    "alertas.gestionar",
  ],
  Director: [
    "dashboard.ver",
    "bandeja.ver",
    "bandeja.aprobar",
    "equipo.ver",
    "equipo.administrar",
    "configuracion.ver",
    "configuracion.editar",
    "roles.administrar",
    "cronograma.ver",
    "cronograma.editar",
    "actividad.ver",
    "actividad.registrar",
    "galeria.ver",
    "galeria.gestionar",
    "reportes.ver",
    "reportes.exportar",
    "pedidos.ver",
    "pedidos.crear",
    "pedidos.aprobar",
    "pedidos.entregar",
    "stock.ver",
    "stock.ajustar",
    "proveedores.ver",
    "proveedores.gestionar",
    "presupuesto.ver",
    "presupuesto.editar",
    "recibos.ver",
    "recibos.gestionar",
    "alertas.ver",
    "alertas.gestionar",
  ],
};

function renderSidebar(rolNombre: string, web = PERMISOS_WEB[rolNombre] ?? []) {
  const permitidos = new Set(web);
  return render(
    <RoleContext.Provider
      value={{
        rol: { id: `rol-${rolNombre}`, nombre: rolNombre, nivel: 10, es_sistema: true, descripcion: "" },
        permisos: null,
        loading: false,
        error: null,
        puede: (permiso: string) => permitidos.has(permiso),
        refresh: () => {},
      }}
    >
      <DashSidebar />
    </RoleContext.Provider>,
  );
}

beforeEach(() => {
  pathnameActual = BASE;
  cleanup();
});

afterAll(() => {
  mock.restore();
});

describe("DashSidebar — Obrero", () => {
  test("no ve Bandeja, Costos ni Configuración", () => {
    renderSidebar("Obrero");

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Cronograma")).toBeTruthy();
    expect(screen.getByText("Alertas")).toBeTruthy();
    expect(screen.getByText("Equipo")).toBeTruthy();
    expect(screen.queryByText("Bandeja")).toBeNull();
    expect(screen.queryByText("Costos")).toBeNull();
    expect(screen.queryByText("Configuración")).toBeNull();
  });

  test("en Materiales ve Stock y no Pedidos ni Proveedores", () => {
    pathnameActual = `${BASE}/materiales`;
    renderSidebar("Obrero");

    expect(screen.getByText("Materiales")).toBeTruthy();
    expect(screen.getByText("Stock")).toBeTruthy();
    expect(screen.queryByText("Pedidos")).toBeNull();
    expect(screen.queryByText("Proveedores")).toBeNull();
  });

  test("en Registro ve Actividad, Galería y Reportes", () => {
    pathnameActual = `${BASE}/registro`;
    renderSidebar("Obrero");

    expect(screen.getByText("Actividad")).toBeTruthy();
    expect(screen.getByText("Galería")).toBeTruthy();
    expect(screen.getByText("Reportes")).toBeTruthy();
  });
});

describe("DashSidebar — Capataz", () => {
  test("ve Bandeja y Costos, pero no Configuración", () => {
    pathnameActual = `${BASE}/costos`;
    renderSidebar("Capataz");

    expect(screen.getByText("Bandeja")).toBeTruthy();
    expect(screen.getByText("Costos")).toBeTruthy();
    expect(screen.getByText("Presupuesto")).toBeTruthy();
    expect(screen.getByText("Comprobantes")).toBeTruthy();
    expect(screen.queryByText("Configuración")).toBeNull();
  });

  test("en Materiales ve las tres sub-secciones", () => {
    pathnameActual = `${BASE}/materiales`;
    renderSidebar("Capataz");

    expect(screen.getByText("Pedidos")).toBeTruthy();
    expect(screen.getByText("Stock")).toBeTruthy();
    expect(screen.getByText("Proveedores")).toBeTruthy();
  });
});

describe("DashSidebar — Cliente", () => {
  test("queda en solo lectura: sin Materiales, Costos, Alertas ni Bandeja", () => {
    renderSidebar("Cliente");

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Cronograma")).toBeTruthy();
    expect(screen.getByText("Equipo")).toBeTruthy();
    expect(screen.queryByText("Materiales")).toBeNull();
    expect(screen.queryByText("Costos")).toBeNull();
    expect(screen.queryByText("Alertas")).toBeNull();
    expect(screen.queryByText("Bandeja")).toBeNull();
    expect(screen.queryByText("Configuración")).toBeNull();
  });
});

describe("DashSidebar — Director y estados", () => {
  test("ve Configuración", () => {
    renderSidebar("Director");

    expect(screen.getByText("Configuración")).toBeTruthy();
    expect(screen.getByText("Bandeja")).toBeTruthy();
  });

  test("mientras carga el rol no muestra el menú (evita flash de secciones)", () => {
    // RoleContext.puede() devuelve false mientras carga; el sidebar además
    // reemplaza el nav por skeletons.
    render(
      <RoleContext.Provider
        value={{
          rol: null,
          permisos: null,
          loading: true,
          error: null,
          puede: () => false,
          refresh: () => {},
        }}
      >
        <DashSidebar />
      </RoleContext.Provider>,
    );

    expect(screen.queryByText("Dashboard")).toBeNull();
    expect(screen.queryByText("Configuración")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// Barra superior: badge del rol (ENTREGABLE 6 de la tarjeta D)
// ─────────────────────────────────────────────────────────────
function renderTopBar(rolNombre: string | null, loading = false, web?: string[]) {
  const permitidos = new Set(web ?? (rolNombre ? (PERMISOS_WEB[rolNombre] ?? []) : []));
  return render(
    <RoleContext.Provider
      value={{
        rol: rolNombre && !loading
          ? { id: `rol-${rolNombre}`, nombre: rolNombre, nivel: 10, es_sistema: true, descripcion: "" }
          : null,
        permisos: null,
        loading,
        error: null,
        puede: (permiso: string) => permitidos.has(permiso),
        refresh: () => {},
      }}
    >
      <DashTopBar />
    </RoleContext.Provider>,
  );
}

describe("DashTopBar — badge de rol", () => {
  test("muestra el rol del que llama en la obra", () => {
    renderTopBar("Capataz");

    const badge = screen.getByText("Capataz");
    expect(badge).toBeTruthy();
    expect(badge.getAttribute("title")).toBe("Tu rol en esta obra: Capataz");
  });

  test("muestra el nombre de un rol personalizado tal cual", () => {
    renderTopBar("Paisajista", false, []);

    expect(screen.getByText("Paisajista")).toBeTruthy();
  });

  test("mientras carga no muestra un rol inventado (skeleton)", () => {
    renderTopBar("Director", true);

    expect(screen.queryByText("Director")).toBeNull();
  });

  test("sin rol (error de mi-rol) no muestra badge", () => {
    renderTopBar(null);

    expect(screen.queryByText("Director")).toBeNull();
    expect(screen.queryByText("Obrero")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// Menú "Nuevo": las acciones de crear se ocultan sin permiso
// ─────────────────────────────────────────────────────────────
function renderQuickAdd(rolNombre: string, web: string[]) {
  const permitidos = new Set(web);
  return render(
    <RoleContext.Provider
      value={{
        rol: { id: `rol-${rolNombre}`, nombre: rolNombre, nivel: 10, es_sistema: true, descripcion: "" },
        permisos: null,
        loading: false,
        error: null,
        puede: (permiso: string) => permitidos.has(permiso),
        refresh: () => {},
      }}
    >
      <QuickAddMenu onPick={() => {}} />
    </RoleContext.Provider>,
  );
}

describe("QuickAddMenu — acciones filtradas por permiso", () => {
  test("Obrero: puede reportar alerta/actividad/foto, no crear tarea, pedido, material ni proveedor", () => {
    renderQuickAdd("Obrero", PERMISOS_WEB.Obrero);
    fireEvent.click(screen.getByText("Nuevo"));

    expect(screen.getByText("Alerta")).toBeTruthy();
    expect(screen.getByText("Actividad")).toBeTruthy();
    expect(screen.getByText("Fotos")).toBeTruthy();
    expect(screen.queryByText("Tarea")).toBeNull();
    expect(screen.queryByText("Material")).toBeNull();
    expect(screen.queryByText("Pedido")).toBeNull();
    expect(screen.queryByText("Proveedor")).toBeNull();
    expect(screen.queryByText("Comprobante")).toBeNull();
    expect(screen.queryByText("Invitar al equipo")).toBeNull();
    expect(screen.queryByText("Rubro")).toBeNull();
  });

  test("Capataz: agrega Pedido pero no Proveedor, Comprobante de costos ni Invitar", () => {
    renderQuickAdd("Capataz", PERMISOS_WEB.Capataz);
    fireEvent.click(screen.getByText("Nuevo"));

    expect(screen.getByText("Pedido")).toBeTruthy();
    expect(screen.getByText("Material")).toBeTruthy();
    expect(screen.getByText("Comprobante")).toBeTruthy();
    expect(screen.queryByText("Proveedor")).toBeNull();
    expect(screen.queryByText("Invitar al equipo")).toBeNull();
  });

  test("Cliente sin permisos de escritura: no se ofrece el botón Nuevo", () => {
    renderQuickAdd("Cliente", PERMISOS_WEB.Cliente);

    expect(screen.queryByText("Nuevo")).toBeNull();
  });

  test("mientras carga el rol no se ofrece el botón Nuevo (evita flash)", () => {
    render(
      <RoleContext.Provider
        value={{ rol: null, permisos: null, loading: true, error: null, puede: () => false, refresh: () => {} }}
      >
        <QuickAddMenu onPick={() => {}} />
      </RoleContext.Provider>,
    );

    expect(screen.queryByText("Nuevo")).toBeNull();
  });
});
