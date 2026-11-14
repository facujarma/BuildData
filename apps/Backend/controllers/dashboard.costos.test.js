// Regresión BUG-001 (QA #8): GET /dashboard/:obraId no debe entregar costos ni
// pedidos a un rol sin `presupuesto.ver` / `pedidos.ver`.
//
// El middleware `exigirPermiso` deja el perfil en `req.perfilObra`; el controller
// decide con esa matriz qué bloques serializa:
// - sin `presupuesto.ver` → no viajan `budget` ni `budgetBreakdown`;
// - sin `pedidos.ver` → `orders` viaja vacío (la pantalla espera el array).
//
// Se mockean el pool y el cálculo de presupuesto: el test verifica el contrato
// HTTP del controller, no las consultas SQL.
import { describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";

function fila(sql) {
  const s = sql.replace(/\s+/g, " ");
  if (s.includes("FROM obras")) return { rows: [{ nombre: "Obra QA", last_activity: null }] };
  if (s.includes("COUNT(*) FILTER (WHERE estado = 'completada')")) {
    return { rows: [{ completadas: 0, total: 0 }] };
  }
  if (s.includes("FROM tareas") && s.includes("created_at DESC")) return { rows: [] };
  if (s.includes("severity = 'critical'")) return { rows: [{ criticas: 0, hoy: 0 }] };
  if (s.includes("FROM pedidos_materiales") && s.includes("pendientes")) {
    return { rows: [{ total: 0, pendientes: 0 }] };
  }
  if (s.includes("FROM operaciones_bot")) return { rows: [{ pendientes: 0 }] };
  if (s.includes("FROM pedidos_materiales")) return { rows: [] };
  if (s.includes("FROM presupuestos")) return { rows: [{ updated_at: "2026-01-01T00:00:00Z" }] };
  if (s.includes("FROM rubros")) return { rows: [] };
  if (s.includes("FROM actividad")) return { rows: [] };
  if (s.includes("FROM alertas")) return { rows: [] };
  return { rows: [{ total: 0 }] };
}

mock.module("../db.js", () => ({
  pool: { query: async (sql) => fila(sql) },
}));

mock.module("../services/presupuesto.service.js", () => ({
  calcularRubros: async () => [{ nombre: "Albañilería", cap: 500000, spent: 1500, comp: 4000 }],
  resumir: () => ({ total: 500000, ejecutado: 1500, comprometido: 4000, disponible: 494500 }),
}));

function respuestaFalsa() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

function perfil(nombre, web) {
  return { rol: { nombre }, permisos: { bot: {}, web } };
}

describe("GET /dashboard — costos y pedidos según permisos web", () => {
  test("Cliente (sin presupuesto.ver ni pedidos.ver) no recibe costos y orders viene vacío", async () => {
    const { getDashboard } = await import("./dashboardController.js");
    const res = respuestaFalsa();
    await getDashboard(
      { params: { obraId: OBRA_ID }, perfilObra: perfil("Cliente", { "dashboard.ver": true }) },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.budget).toBeUndefined();
    expect(res.body.budgetBreakdown).toBeUndefined();
    expect(res.body.orders).toEqual([]);
    // El resto del dashboard sigue disponible para el rol de lectura.
    expect(res.body.obra.name).toBe("Obra QA");
    expect(res.body.stats).toBeDefined();
  });

  test("Capataz (con presupuesto.ver y pedidos.ver) sí recibe el presupuesto y los pedidos", async () => {
    const { getDashboard } = await import("./dashboardController.js");
    const res = respuestaFalsa();
    await getDashboard(
      {
        params: { obraId: OBRA_ID },
        perfilObra: perfil("Capataz", {
          "dashboard.ver": true,
          "presupuesto.ver": true,
          "pedidos.ver": true,
        }),
      },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.budget?.total).toBe(500000);
    expect(res.body.budgetBreakdown).toEqual([
      { name: "Albañilería", spent: 1500, comp: 4000, cap: 500000 },
    ]);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  test("sin perfil de obra (fail closed) tampoco se serializan costos", async () => {
    const { getDashboard } = await import("./dashboardController.js");
    const res = respuestaFalsa();
    await getDashboard({ params: { obraId: OBRA_ID } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.budget).toBeUndefined();
    expect(res.body.orders).toEqual([]);
  });
});
