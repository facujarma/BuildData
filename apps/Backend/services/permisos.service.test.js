import { describe, expect, test } from "bun:test";
import {
  normalizarRol,
  puede,
  puedeOperar,
  puedeAprobar,
  permisoDeEndpoint,
} from "./permisos.service.js";

describe("normalizarRol", () => {
  test("null/vacío cae en Obrero (mínimo privilegio)", () => {
    expect(normalizarRol(null)).toBe("Obrero");
    expect(normalizarRol("")).toBe("Obrero");
    expect(normalizarRol("   ")).toBe("Obrero");
  });

  test("los tres roles canónicos se respetan", () => {
    expect(normalizarRol("Obrero")).toBe("Obrero");
    expect(normalizarRol("Capataz")).toBe("Capataz");
    expect(normalizarRol("Director")).toBe("Director");
  });

  test("el 'director' en minúscula que manda el wizard de obras se mapea", () => {
    // projectsService.createObra manda myRole: "director"; POST /obras lo normaliza
    // antes del INSERT (miembros_obra_rol_check solo acepta Obrero|Capataz|Director).
    expect(normalizarRol("director")).toBe("Director");
    expect(normalizarRol("operario")).toBe("Obrero");
  });

  test("roles libres viejos de la web se mapean", () => {
    expect(normalizarRol("Director de obra")).toBe("Director");
    expect(normalizarRol("Dueño")).toBe("Director");
    expect(normalizarRol("Arquitecto/a")).toBe("Director");
    expect(normalizarRol("Ingeniero/a")).toBe("Director");
    expect(normalizarRol("Compras")).toBe("Capataz");
    expect(normalizarRol("Seguridad e higiene")).toBe("Capataz");
    expect(normalizarRol("Sin asignar")).toBe("Obrero");
  });
});

describe("permisos por rol", () => {
  test("Obrero reporta el día a día pero no ajusta stock ni maneja pedidos", () => {
    expect(puede("Obrero", "stock.registrar")).toBe(true);
    expect(puede("Obrero", "gasto.crear")).toBe(true);
    expect(puede("Obrero", "alerta.crear")).toBe(true);
    expect(puede("Obrero", "foto.subir")).toBe(true);
    expect(puede("Obrero", "stock.ajustar")).toBe(false);
    expect(puede("Obrero", "pedido.crear")).toBe(false);
    expect(puede("Obrero", "pedido.entregar")).toBe(false);
  });

  test("Capataz suma ajuste de stock y pedidos", () => {
    expect(puede("Capataz", "stock.ajustar")).toBe(true);
    expect(puede("Capataz", "pedido.crear")).toBe(true);
    expect(puede("Capataz", "pedido.entregar")).toBe(true);
  });

  test("Director puede todo lo que está en la matriz", () => {
    expect(puede("Director", "stock.ajustar")).toBe(true);
    expect(puede("Director", "pedido.entregar")).toBe(true);
    expect(puede("Director", "gasto.crear")).toBe(true);
  });

  test("un rol libre se normaliza antes de chequear", () => {
    expect(puede("Director de obra", "pedido.entregar")).toBe(true);
    expect(puede("Sin asignar", "pedido.entregar")).toBe(false);
  });
});

describe("puedeOperar", () => {
  test("mapea endpoint a capacidad", () => {
    expect(puedeOperar("Obrero", "/bot/stock/ajuste")).toBe(false);
    expect(puedeOperar("Capataz", "/bot/stock/ajuste")).toBe(true);
    expect(puedeOperar("Obrero", "/bot/pedidos/entregar")).toBe(false);
    expect(puedeOperar("Capataz", "/bot/pedidos/entregar")).toBe(true);
  });

  test("fail closed: endpoint sin mapear no se puede operar", () => {
    expect(puedeOperar("Director", "/bot/endpoint-inexistente")).toBe(false);
    expect(permisoDeEndpoint("/bot/endpoint-inexistente")).toBeNull();
  });
});

describe("puedeAprobar", () => {
  test("Obrero no aprueba operaciones de la bandeja", () => {
    expect(puedeAprobar("Obrero")).toBe(false);
    expect(puedeAprobar("Sin asignar")).toBe(false);
  });

  test("Capataz y Director aprueban", () => {
    expect(puedeAprobar("Capataz")).toBe(true);
    expect(puedeAprobar("Director de obra")).toBe(true);
  });
});
