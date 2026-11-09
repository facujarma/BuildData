import { describe, expect, test } from "bun:test";
import {
  normalizarRol,
  puede,
  puedeOperar,
  puedeAprobar,
  permisoDeEndpoint,
} from "./permissions.service";

describe("normalizarRol", () => {
  test("null/vacío cae en Obrero", () => {
    expect(normalizarRol(null)).toBe("Obrero");
    expect(normalizarRol(undefined)).toBe("Obrero");
    expect(normalizarRol("")).toBe("Obrero");
  });

  test("roles canónicos y libres de la web", () => {
    expect(normalizarRol("Capataz")).toBe("Capataz");
    expect(normalizarRol("Director de obra")).toBe("Director");
    expect(normalizarRol("Compras")).toBe("Capataz");
    expect(normalizarRol("Sin asignar")).toBe("Obrero");
  });
});

describe("permisos por rol", () => {
  test("Obrero no ajusta stock ni maneja pedidos", () => {
    expect(puede("Obrero", "stock.registrar")).toBe(true);
    expect(puede("Obrero", "stock.ajustar")).toBe(false);
    expect(puede("Obrero", "pedido.crear")).toBe(false);
    expect(puede("Obrero", "pedido.entregar")).toBe(false);
  });

  test("Capataz suma ajuste y pedidos", () => {
    expect(puede("Capataz", "stock.ajustar")).toBe(true);
    expect(puede("Capataz", "pedido.entregar")).toBe(true);
  });

  test("Director puede todo", () => {
    expect(puede("Director", "pedido.crear")).toBe(true);
    expect(puede("Director", "stock.ajustar")).toBe(true);
  });
});

describe("puedeOperar", () => {
  test("endpoint permitido/bloqueado por rol", () => {
    expect(puedeOperar("Obrero", "/bot/pedidos/entregar")).toBe(false);
    expect(puedeOperar("Capataz", "/bot/pedidos/entregar")).toBe(true);
    expect(puedeOperar("Obrero", "/bot/alertas")).toBe(true);
  });

  test("fail closed con endpoint sin mapear", () => {
    expect(puedeOperar("Director", "/bot/nuevo")).toBe(false);
    expect(permisoDeEndpoint("/bot/nuevo")).toBeNull();
  });
});

describe("puedeAprobar", () => {
  test("solo supervisión aprueba", () => {
    expect(puedeAprobar("Obrero")).toBe(false);
    expect(puedeAprobar("Capataz")).toBe(true);
    expect(puedeAprobar("Director de obra")).toBe(true);
  });
});
