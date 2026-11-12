// Regresión BUG-001 (QA #8), adaptador: `getDashboard` no debe romperse cuando el
// Backend omite `budget`/`budgetBreakdown`/`orders` para un rol sin los permisos.
import { afterAll, describe, expect, mock, test } from "bun:test";

mock.module("@/lib/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token-qa" } } }) } },
}));

const { getDashboard } = await import("./dashboardService");

const fetchOriginal = globalThis.fetch;

function apiBase() {
  return {
    obra: { name: "Obra QA", lastUpdate: "2026-11-12T12:00:00.000Z" },
    stats: {
      avanceTotal: 10,
      avanceDeltaPct: 0,
      alertasCriticas: 0,
      alertasDeltaHoy: 0,
      pedidos: 0,
      pedidosPendientes: 0,
      operacionesPendientes: 0,
      tareasCompletadas: 0,
      tareasTotal: 0,
    },
    tradeProgress: [],
    activityFeed: [],
    alerts: [],
    tasks: [],
  };
}

function responderCon(payload: unknown) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;
}

afterAll(() => {
  globalThis.fetch = fetchOriginal;
  mock.restore();
});

describe("getDashboard — payload sin bloques de costos", () => {
  test("sin budget/budgetBreakdown/orders el dashboard se transforma igual", async () => {
    responderCon(apiBase());

    const data = await getDashboard("0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab");

    expect(data.budget).toBeUndefined();
    expect(data.budgetBreakdown).toEqual([]);
    expect(data.orders).toEqual([]);
    expect(data.obra.name).toBe("Obra QA");
  });

  test("con los bloques presentes los sigue mapeando", async () => {
    responderCon({
      ...apiBase(),
      budget: {
        total: 500000,
        ejecutado: 1500,
        disponible: 494500,
        ejecutadoPct: 1,
        comprometidoPct: 1,
        librePct: 98,
        updatedAt: "2026-11-12T12:00:00.000Z",
      },
      budgetBreakdown: [{ name: "Albañilería", spent: 1500, cap: 500000 }],
      orders: [{
        id: "p1",
        estado: "aprobado",
        aprobado: true,
        fecha: "2026-11-10T12:00:00.000Z",
        proveedor_id: "prov-1",
        items: [{ material_id: "m1", cantidad: 1, precio_unitario: 1000 }],
      }],
    });

    const data = await getDashboard("0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab");

    expect(data.budget?.total).toBe(500000);
    expect(data.budgetBreakdown[0].name).toBe("Albañilería");
    expect(data.orders[0].items[0].unitPrice).toBe(1000);
  });
});
