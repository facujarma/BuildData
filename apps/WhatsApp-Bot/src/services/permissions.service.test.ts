import { describe, expect, test } from "bun:test";
import {
  normalizarRol,
  puede,
  puedeOperar,
  puedeAprobar,
  permisoDeEndpoint,
  ENDPOINT_PERMISOS,
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

describe("ENDPOINT_PERMISOS", () => {
  test("POST /bot/galeria exige foto.subir (espejo del Backend)", () => {
    // Si el Backend mapea un endpoint nuevo y el espejo del bot no lo acompaña,
    // el bot avisa mal antes de confirmar: este test fija la paridad de /bot/galeria.
    expect(ENDPOINT_PERMISOS["/bot/galeria"]).toBe("foto.subir");
    expect(permisoDeEndpoint("/bot/galeria")).toEqual({
      permiso: "foto.subir",
      label: "subir fotos a la galería",
    });
    expect(puedeOperar("Obrero", "/bot/galeria")).toBe(true);
    expect(puedeOperar("Capataz", "/bot/galeria")).toBe(true);
    expect(puedeOperar("Director", "/bot/galeria")).toBe(true);
  });
});

describe("puedeAprobar", () => {
  test("solo supervisión aprueba", () => {
    expect(puedeAprobar("Obrero")).toBe(false);
    expect(puedeAprobar("Capataz")).toBe(true);
    expect(puedeAprobar("Director de obra")).toBe(true);
  });
});
