import { describe, expect, test } from "bun:test";
import {
  normalizarRol,
  puede,
  puedeOperar,
  puedeAprobar,
  puedeAdministrarEquipo,
  puedeAsignarRol,
  permisoDeEndpoint,
  ENDPOINT_PERMISOS,
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

describe("ENDPOINT_PERMISOS", () => {
  test("POST /bot/galeria exige foto.subir", () => {
    // El endpoint directo no pasa por /bot/operaciones: el mapa es la fuente del gate
    // de rol del controller (subirFotoDesdeBot) y del aviso previo del bot.
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
  test("Obrero no aprueba operaciones de la bandeja", () => {
    expect(puedeAprobar("Obrero")).toBe(false);
    expect(puedeAprobar("Sin asignar")).toBe(false);
  });

  test("Capataz y Director aprueban", () => {
    expect(puedeAprobar("Capataz")).toBe(true);
    expect(puedeAprobar("Director de obra")).toBe(true);
  });
});

describe("puedeAdministrarEquipo", () => {
  test("solo Director administra el equipo de una obra", () => {
    expect(puedeAdministrarEquipo("Director")).toBe(true);
    expect(puedeAdministrarEquipo("Director de obra")).toBe(true);
    expect(puedeAdministrarEquipo("Capataz")).toBe(false);
    expect(puedeAdministrarEquipo("Obrero")).toBe(false);
    expect(puedeAdministrarEquipo(null)).toBe(false);
  });
});

describe("puedeAsignarRol", () => {
  test("Director puede otorgar cualquier rol, incluido Director", () => {
    expect(puedeAsignarRol("Director", "Obrero")).toBe(true);
    expect(puedeAsignarRol("Director", "Capataz")).toBe(true);
    expect(puedeAsignarRol("Director", "Director")).toBe(true);
    expect(puedeAsignarRol("Director de obra", "director")).toBe(true);
  });

  test("quien no administra el equipo no puede asignar ningún rol (fail closed)", () => {
    expect(puedeAsignarRol("Obrero", "Obrero")).toBe(false);
    expect(puedeAsignarRol("Capataz", "Obrero")).toBe(false);
    expect(puedeAsignarRol("Capataz", "Director")).toBe(false);
    expect(puedeAsignarRol(null, "Obrero")).toBe(false);
  });
});
