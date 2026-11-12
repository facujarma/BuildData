// Regresión BUG-001 (QA #8): el snapshot de reportes no debe exponer costos ni
// inventario a un rol sin el permiso web correspondiente.
//
// Se llama al service con un pool falso: el objetivo es el filtrado por permisos
// (`presupuesto.ver`, `recibos.ver`, `stock.ver`), no las consultas SQL.
import { describe, expect, test } from "bun:test";
import { armarReporte, calcularSnapshot } from "./reportes.service.js";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";

function consulta(sql) {
  const s = sql.replace(/\s+/g, " ");
  if (s.includes("WITH gastos_r")) {
    return { rows: [{ rubro_id: "r1", nombre: "Albañilería", cap: "500000", spent: "1500", comp: "4000" }] };
  }
  if (s.includes("SUM(monto) FROM gastos")) return { rows: [{ ejecutado: "1500" }] };
  if (s.includes("FROM obras")) return { rows: [{ nombre: "Obra QA", code: "OB-1" }] };
  if (s.includes("AS avance")) {
    return {
      rows: [{
        avance: 40,
        t_total: 10,
        t_done: 4,
        t_prog: 2,
        t_late: 1,
        t_done_periodo: 2,
        alertas: 1,
        alertas_periodo: 1,
        pedidos: 3,
        stock_low: 2,
        recibos_pend: 5,
        equipo: 6,
      }],
    };
  }
  return { rows: [] };
}

const dbFalso = { query: async (sql) => consulta(sql) };
const SIN_PERMISOS = {};

describe("calcularSnapshot — filtrado de costos por permisos web", () => {
  test("sin permisos no incluye campos de presupuesto, recibos ni stock", async () => {
    const snapshot = await calcularSnapshot(dbFalso, OBRA_ID, "total", SIN_PERMISOS);

    expect("presupuestoTotal" in snapshot).toBe(false);
    expect("ejecutado" in snapshot).toBe(false);
    expect("ejecutadoTotal" in snapshot).toBe(false);
    expect("comprometido" in snapshot).toBe(false);
    expect("recibosPend" in snapshot).toBe(false);
    expect("stockLow" in snapshot).toBe(false);
    // Los KPIs operativos (no costos) siguen disponibles.
    expect(snapshot.avance).toBe(40);
    expect(snapshot.tareas.total).toBe(10);
    expect(snapshot.pedidos).toBe(3);
    expect(snapshot.equipo).toBe(6);
  });

  test("con presupuesto.ver incluye los montos, pero no recibos ni stock", async () => {
    const snapshot = await calcularSnapshot(dbFalso, OBRA_ID, "total", { "presupuesto.ver": true });

    expect(snapshot.presupuestoTotal).toBe(500000);
    expect(snapshot.ejecutado).toBe(1500);
    expect(snapshot.ejecutadoTotal).toBe(1500);
    expect(snapshot.comprometido).toBe(4000);
    expect("recibosPend" in snapshot).toBe(false);
    expect("stockLow" in snapshot).toBe(false);
  });

  test("con recibos.ver y stock.ver agrega sus KPIs", async () => {
    const snapshot = await calcularSnapshot(dbFalso, OBRA_ID, "total", {
      "recibos.ver": true,
      "stock.ver": true,
    });

    expect(snapshot.recibosPend).toBe(5);
    expect(snapshot.stockLow).toBe(2);
    expect("presupuestoTotal" in snapshot).toBe(false);
  });
});

describe("armarReporte — secciones de costos según permisos web", () => {
  test("sin presupuesto.ver/recibos.ver/pedidos.ver/stock.ver no arma esas secciones", async () => {
    const reporte = await armarReporte(
      dbFalso,
      OBRA_ID,
      "total",
      ["resumen", "presupuesto", "recibos", "pedidos", "stock", "cronograma"],
      SIN_PERMISOS
    );

    expect(Object.keys(reporte.secciones)).toEqual(["resumen", "cronograma"]);
    expect(reporte.secciones.presupuesto).toBeUndefined();
    expect(reporte.secciones.recibos).toBeUndefined();
    expect(reporte.secciones.pedidos).toBeUndefined();
    expect(reporte.secciones.stock).toBeUndefined();
  });

  test("con los permisos arma las secciones pedidas", async () => {
    const reporte = await armarReporte(dbFalso, OBRA_ID, "total", ["presupuesto", "recibos"], {
      "presupuesto.ver": true,
      "recibos.ver": true,
    });

    expect(Object.keys(reporte.secciones)).toEqual(["presupuesto", "recibos"]);
    expect(reporte.secciones.presupuesto.resumen.total).toBe(500000);
  });
});
