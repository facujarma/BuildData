import { describe, expect, test } from "bun:test";
import { debeAlertarStockNegativo, calcularDeltaAjuste } from "./stock.service.js";

describe("debeAlertarStockNegativo", () => {
  test("salida que cruza de cero a negativo", () => {
    expect(debeAlertarStockNegativo(-5, -5)).toBe(true);
  });

  test("salida desde stock positivo a negativo", () => {
    expect(debeAlertarStockNegativo(-3, -5)).toBe(true);
  });

  test("ya estaba negativo: no repite la alerta", () => {
    expect(debeAlertarStockNegativo(-8, -3)).toBe(false);
  });

  test("entrada que sigue dejando el stock negativo", () => {
    expect(debeAlertarStockNegativo(-3, 5)).toBe(false);
  });

  test("entrada que recupera el stock a positivo", () => {
    expect(debeAlertarStockNegativo(2, 5)).toBe(false);
  });

  test("movimiento que no llega a negativo", () => {
    expect(debeAlertarStockNegativo(1, -1)).toBe(false);
  });
});

describe("calcularDeltaAjuste", () => {
  test("delta se aplica tal cual (puede ser negativo)", () => {
    expect(calcularDeltaAjuste("delta", 5, 10)).toBe(5);
    expect(calcularDeltaAjuste("delta", -3, 10)).toBe(-3);
  });

  test("stock_final se convierte en la diferencia contra el stock actual", () => {
    expect(calcularDeltaAjuste("stock_final", 30, 10)).toBe(20);
    expect(calcularDeltaAjuste("stock_final", 2, 10)).toBe(-8);
    expect(calcularDeltaAjuste("stock_final", 0, 3)).toBe(-3);
  });

  test("stock_final igual al actual da delta cero", () => {
    expect(calcularDeltaAjuste("stock_final", 10, 10)).toBe(0);
  });
});
