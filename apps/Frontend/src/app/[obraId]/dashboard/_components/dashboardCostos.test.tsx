// Regresión BUG-001 (QA #8), UI: la tarjeta de presupuesto del dashboard solo
// se pinta si el rol tiene `presupuesto.ver`, aunque el payload traiga `budget`.
//
// Se renderiza el DashboardContent real con el contexto de rol mockeado y los
// servicios de red reemplazados (el dashboard dispara alertas y pedidos al montar).
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { DashboardData } from "@/types/dashboard";

mock.module("@/lib/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}));

const OBRA = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, prefetch: () => {} }),
  useParams: () => ({ obraId: OBRA }),
  usePathname: () => `/${OBRA}/dashboard`,
  useSearchParams: () => new URLSearchParams(""),
}));

mock.module("@/services/alertasService", () => ({
  getAlertas: async () => ({ alerts: [] }),
}));

mock.module("@/services/pedidosService", () => ({
  getPedidos: async () => [],
}));

mock.module("@/services/cronogramaService", () => ({
  completeCronogramaTask: async () => {},
}));

mock.module("./DashboardDataContext", () => ({
  useDashboardData: () => ({
    obraId: OBRA,
    obraName: "Obra QA",
    obraProgress: 10,
    operacionesPendientes: 0,
    setLookupData: () => {},
    refreshDashboard: async () => {},
  }),
}));

// happy-dom se registra una vez para todo el proceso en test/setup.ts.
const { act, cleanup, render, screen } = await import("@testing-library/react");
const { DashboardContent } = await import("./DashboardContent");
const { RoleContext } = await import("./RoleContext");

const DATA: DashboardData = {
  obra: { name: "Obra QA", lastUpdate: "hoy" },
  stats: {
    avanceTotal: 10,
    avanceDelta: "+0% esta semana",
    alertasCriticas: 0,
    alertasDelta: "+0 hoy",
    pedidos: 0,
    pedidosPendientes: 0,
    operacionesPendientes: 0,
    tareasCompletadas: 0,
    tareasTotal: 0,
  },
  // El backend ya no manda esto sin permiso; el test lo incluye a propósito
  // para probar que el gate de UI no depende del payload.
  budget: {
    total: 500000,
    ejecutado: 1500,
    disponible: 494500,
    ejecutadoPct: 1,
    comprometidoPct: 1,
    librePct: 98,
    updatedAt: "hoy",
  },
  budgetBreakdown: [{ name: "Albañilería", spent: 1500, cap: 500000, over: false }],
  tradeProgress: [],
  activityFeed: [],
  alerts: [],
  tasks: [],
  orders: [],
};

function renderDashboard(rolNombre: string, web: string[], data: DashboardData = DATA) {
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
      <DashboardContent data={data} />
    </RoleContext.Provider>,
  );
}

beforeEach(() => {
  cleanup();
});

afterAll(() => {
  mock.restore();
});

describe("DashboardContent — tarjeta de presupuesto según rol", () => {
  test("Cliente sin presupuesto.ver no ve la tarjeta de presupuesto", async () => {
    renderDashboard("Cliente", [
      "dashboard.ver",
      "equipo.ver",
      "cronograma.ver",
      "actividad.ver",
      "galeria.ver",
      "reportes.ver",
    ]);
    // Flush de los efectos (alertas/pedidos) para no dejar updates fuera de act().
    await act(async () => {});

    expect(screen.queryByText("Ver presupuesto")).toBeNull();
    expect(screen.queryByText("Presupuesto")).toBeNull();
    // El resto del dashboard sigue montado.
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  test("Capataz con presupuesto.ver sí ve la tarjeta y el monto", async () => {
    renderDashboard("Capataz", [
      "dashboard.ver",
      "presupuesto.ver",
      "pedidos.ver",
    ]);
    await act(async () => {});

    expect(screen.getByText("Ver presupuesto")).toBeTruthy();
    expect(screen.getByText("Presupuesto")).toBeTruthy();
    expect(screen.getByText("AR$ 500 K")).toBeTruthy();
  });

  test("sin budget en el payload el dashboard no se rompe ni pinta la tarjeta", async () => {
    renderDashboard("Capataz", ["dashboard.ver", "presupuesto.ver"], {
      ...DATA,
      budget: undefined,
      budgetBreakdown: [],
    });
    await act(async () => {});

    expect(screen.queryByText("Ver presupuesto")).toBeNull();
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });
});
