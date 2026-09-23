import { describe, expect, test } from "bun:test";
import {
  collectMissingFields,
  formatMissingQuestion,
  validateApiCall,
  buildEndpointDescription,
  buildEndpointIndex,
  ENDPOINTS,
} from "./endpointSchema";

describe("collectMissingFields", () => {
  test("detecta un campo requerido ausente", () => {
    const missing = collectMissingFields("/bot/retraso", {
      tarea: "Entrega de ladrillos",
    });
    expect(missing.map((m) => m.path)).toEqual(["dias_retraso"]);
    expect(missing[0].type).toBe("number");
  });

  test("ignora obra_id y telefono (los completa el bot)", () => {
    const missing = collectMissingFields("/bot/stock", {
      tipo: "salida",
      movimientos: [{ nombre: "cemento", cantidad: 10 }],
    });
    expect(missing).toEqual([]);
  });

  test("stock sin tipo pide el sentido del movimiento", () => {
    const missing = collectMissingFields("/bot/stock", {
      movimientos: [{ nombre: "cemento", cantidad: 10 }],
    });
    expect(missing.map((m) => m.path)).toEqual(["tipo"]);
    expect(missing[0].examples).toEqual([
      "Llegaron 50 bolsas de cemento",
      "Usé 10 bolsas de cemento",
    ]);
  });

  test("string vacío, numero NaN y array vacío cuentan como faltantes", () => {
    expect(collectMissingFields("/bot/gastos", { monto: 100 })).toEqual([]);
    expect(collectMissingFields("/bot/gastos", { monto: "" }).map((m) => m.path)).toEqual([
      "monto",
    ]);
    expect(
      collectMissingFields("/bot/gastos", { monto: Number.NaN }).map((m) => m.path),
    ).toEqual(["monto"]);
    expect(
      collectMissingFields("/bot/stock", { tipo: "salida", movimientos: [] }).map((m) => m.path),
    ).toEqual(["movimientos"]);
  });

  test("valida subcampos de arrays con path por índice y contexto", () => {
    const missing = collectMissingFields("/bot/stock", {
      tipo: "salida",
      movimientos: [{ nombre: "cemento" }, { nombre: "arena", cantidad: 2 }],
    });
    expect(missing.map((m) => m.path)).toEqual(["movimientos[0].cantidad"]);
    expect(missing[0].dataKey).toBe("movimientos");
    expect(missing[0].itemIndex).toBe(0);
    expect(missing[0].type).toBe("number");
    expect(formatMissingQuestion(missing[0])).toBe("¿Qué cantidad? (cemento)");
  });

  test("ajuste de stock requiere tipo_ajuste y valor", () => {
    const missing = collectMissingFields("/bot/stock/ajuste", {
      movimientos: [{ nombre: "cemento", tipo_ajuste: "delta" }],
    });
    expect(missing.map((m) => m.path)).toEqual(["movimientos[0].valor"]);
    expect(missing[0].prompt).toBe("¿Qué cantidad?");

    const sinTipo = collectMissingFields("/bot/stock/ajuste", {
      movimientos: [{ nombre: "cemento", valor: 5 }],
    });
    expect(sinTipo.map((m) => m.path)).toEqual(["movimientos[0].tipo_ajuste"]);
    expect(sinTipo[0].allowedValues).toEqual(["delta", "stock_final"]);
  });

  test("items de pedido requieren material_nombre y cantidad", () => {
    const missingNombre = collectMissingFields("/bot/pedidoDeCompra", {
      items: [{ cantidad: 5 }],
    });
    expect(missingNombre.map((m) => m.path)).toEqual([
      "items[0].material_nombre",
    ]);

    const missingCantidad = collectMissingFields("/bot/pedidoDeCompra", {
      items: [{ material_nombre: "cemento" }],
    });
    expect(missingCantidad.map((m) => m.path)).toEqual([
      "items[0].cantidad",
    ]);
    expect(missingCantidad[0].prompt).toBe("¿Cuántos pedís?");
  });

  test("propaga el opIndex", () => {
    const missing = collectMissingFields("/bot/gastos", { monto: 100 }, 2);
    expect(missing).toEqual([]);
    expect(collectMissingFields("/bot/gastos", {}, 2)[0].opIndex).toBe(2);
  });
});

describe("validateApiCall", () => {
  test("endpoint inexistente", () => {
    const result = validateApiCall("/bot/nope", {});
    expect(result.valid).toBe(false);
    expect(result.missingRequired[0]).toContain("no existe");
  });

  test("operación completa", () => {
    expect(
      validateApiCall("/bot/retraso", { tarea: "Ladrillos", dias_retraso: 2 }).valid,
    ).toBe(true);
  });

  test("operación incompleta lista los paths faltantes", () => {
    const result = validateApiCall("/bot/gastos", { descripcion: "flete" });
    expect(result.valid).toBe(false);
    expect(result.missingRequired).toEqual(["monto"]);
  });
});

describe("descripciones de endpoints", () => {
  test("buildEndpointDescription(paths) acota al endpoint pedido", () => {
    const desc = buildEndpointDescription(["/bot/retraso"]);
    expect(desc).toContain("/bot/retraso");
    expect(desc).toContain("dias_retraso");
    expect(desc).not.toContain("/bot/stock");
  });

  test("buildEndpointDescription con paths desconocidos cae a todos", () => {
    const desc = buildEndpointDescription(["/bot/inexistente"]);
    expect(desc).toContain("/bot/stock");
    expect(desc).toContain("/bot/retraso");
  });

  test("buildEndpointIndex lista todos los endpoints en una línea", () => {
    const index = buildEndpointIndex();
    for (const endpoint of ENDPOINTS) {
      expect(index).toContain(`${endpoint.method} ${endpoint.path}`);
    }
    expect(index.split("\n").length).toBe(ENDPOINTS.length);
  });
});

describe("schema", () => {
  test("todo campo requerido del LLM (y subcampo de array) tiene prompt", () => {
    for (const endpoint of ENDPOINTS) {
      for (const param of endpoint.params) {
        if (param.required && param.source === "llm") {
          expect(param.prompt).toBeTruthy();
        }
        for (const sub of param.elementParams ?? []) {
          if (sub.required && sub.source === "llm") {
            expect(sub.prompt).toBeTruthy();
          }
        }
      }
    }
  });
});
