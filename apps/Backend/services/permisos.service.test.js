import { describe, expect, test } from "bun:test";
import {
  ROLES,
  PERMISOS,
  PERMISO_LABELS,
  normalizarRol,
  puede,
  puedeOperar,
  puedeAprobar,
  puedeAdministrarEquipo,
  puedeAsignarRol,
  permisoDeEndpoint,
  permisosDe,
  ENDPOINT_PERMISOS,
} from "./permisos.service.js";

describe("normalizarRol", () => {
  test("null/vacío cae en Obrero (mínimo privilegio)", () => {
    expect(normalizarRol(null)).toBe("Obrero");
    expect(normalizarRol("")).toBe("Obrero");
    expect(normalizarRol("   ")).toBe("Obrero");
  });

  test("los seis roles canónicos se respetan", () => {
    expect(normalizarRol("Cliente")).toBe("Cliente");
    expect(normalizarRol("Obrero")).toBe("Obrero");
    expect(normalizarRol("Seguridad e Higiene")).toBe("Seguridad e Higiene");
    expect(normalizarRol("Capataz")).toBe("Capataz");
    expect(normalizarRol("Administrativo")).toBe("Administrativo");
    expect(normalizarRol("Director")).toBe("Director");
  });

  test("el 'director' en minúscula que manda el wizard de obras se mapea", () => {
    // projectsService.createObra manda myRole: "director"; POST /obras lo normaliza
    // antes del INSERT.
    expect(normalizarRol("director")).toBe("Director");
    expect(normalizarRol("operario")).toBe("Obrero");
  });

  test("roles libres viejos de la web se mapean a los seis roles", () => {
    expect(normalizarRol("Director de obra")).toBe("Director");
    expect(normalizarRol("Dueño")).toBe("Director");
    expect(normalizarRol("Gerente")).toBe("Director");
    expect(normalizarRol("Arquitecto/a")).toBe("Director");
    expect(normalizarRol("Ingeniero/a")).toBe("Director");
    expect(normalizarRol("Socio")).toBe("Director");
    expect(normalizarRol("Capataz")).toBe("Capataz");
    expect(normalizarRol("Jefe de obra")).toBe("Capataz");
    expect(normalizarRol("Supervisor")).toBe("Capataz");
    expect(normalizarRol("Encargado")).toBe("Capataz");
    expect(normalizarRol("Compras")).toBe("Administrativo");
    expect(normalizarRol("Administración")).toBe("Administrativo");
    expect(normalizarRol("Oficina técnica")).toBe("Administrativo");
    expect(normalizarRol("Contable")).toBe("Administrativo");
    expect(normalizarRol("Tesorería")).toBe("Administrativo");
    expect(normalizarRol("Seguridad e higiene")).toBe("Seguridad e Higiene");
    expect(normalizarRol("Higiene y seguridad")).toBe("Seguridad e Higiene");
    expect(normalizarRol("SST")).toBe("Seguridad e Higiene");
    expect(normalizarRol("HSE")).toBe("Seguridad e Higiene");
    expect(normalizarRol("Cliente")).toBe("Cliente");
    expect(normalizarRol("Sin asignar")).toBe("Obrero");
  });

  test("'cliente' ya no cae en Director", () => {
    expect(normalizarRol("cliente")).toBe("Cliente");
    expect(normalizarRol("Cliente externo")).toBe("Cliente");
  });
});

describe("matriz estática del bot", () => {
  test("ROLES son los seis roles de sistema", () => {
    expect(ROLES).toEqual([
      "Cliente",
      "Obrero",
      "Seguridad e Higiene",
      "Capataz",
      "Administrativo",
      "Director",
    ]);
  });

  test("PERMISOS cubre los 10 permisos del catálogo bot", () => {
    expect(Object.keys(PERMISOS).sort()).toEqual(Object.keys(PERMISO_LABELS).sort());
    expect(Object.keys(PERMISOS).length).toBe(10);
  });

  test("Obrero reporta el día a día pero no ajusta stock ni maneja pedidos", () => {
    expect(puede("Obrero", "stock.registrar")).toBe(true);
    expect(puede("Obrero", "gasto.crear")).toBe(true);
    expect(puede("Obrero", "alerta.crear")).toBe(true);
    expect(puede("Obrero", "foto.subir")).toBe(true);
    expect(puede("Obrero", "stock.ajustar")).toBe(false);
    expect(puede("Obrero", "pedido.crear")).toBe(false);
    expect(puede("Obrero", "pedido.entregar")).toBe(false);
  });

  test("Cliente no opera desde WhatsApp", () => {
    for (const permiso of Object.keys(PERMISOS)) {
      expect(puede("Cliente", permiso)).toBe(false);
    }
  });

  test("Seguridad e Higiene reporta tareas, retrasos, alertas y fotos", () => {
    expect(puede("Seguridad e Higiene", "tarea.crear")).toBe(true);
    expect(puede("Seguridad e Higiene", "retraso.registrar")).toBe(true);
    expect(puede("Seguridad e Higiene", "alerta.crear")).toBe(true);
    expect(puede("Seguridad e Higiene", "foto.subir")).toBe(true);
    expect(puede("Seguridad e Higiene", "stock.registrar")).toBe(false);
    expect(puede("Seguridad e Higiene", "gasto.crear")).toBe(false);
    expect(puede("Seguridad e Higiene", "pedido.crear")).toBe(false);
  });

  test("Capataz suma ajuste de stock, pedidos y entregas", () => {
    expect(puede("Capataz", "stock.ajustar")).toBe(true);
    expect(puede("Capataz", "pedido.crear")).toBe(true);
    expect(puede("Capataz", "pedido.entregar")).toBe(true);
    expect(puede("Capataz", "tarea.completar")).toBe(true);
  });

  test("Administrativo compra y ajusta stock, pero no entrega pedidos", () => {
    expect(puede("Administrativo", "stock.ajustar")).toBe(true);
    expect(puede("Administrativo", "gasto.crear")).toBe(true);
    expect(puede("Administrativo", "pedido.crear")).toBe(true);
    expect(puede("Administrativo", "foto.subir")).toBe(true);
    expect(puede("Administrativo", "pedido.entregar")).toBe(false);
    expect(puede("Administrativo", "stock.registrar")).toBe(false);
  });

  test("Director puede todo lo que está en la matriz", () => {
    for (const permiso of Object.keys(PERMISOS)) {
      expect(puede("Director", permiso)).toBe(true);
    }
  });

  test("un rol libre se normaliza antes de chequear", () => {
    expect(puede("Director de obra", "pedido.entregar")).toBe(true);
    expect(puede("Compras", "pedido.crear")).toBe(true);
    expect(puede("Cliente", "foto.subir")).toBe(false);
    expect(puede("Sin asignar", "pedido.entregar")).toBe(false);
  });
});

describe("puedeOperar", () => {
  test("mapea endpoint a capacidad", () => {
    expect(puedeOperar("Obrero", "/bot/stock/ajuste")).toBe(false);
    expect(puedeOperar("Capataz", "/bot/stock/ajuste")).toBe(true);
    expect(puedeOperar("Administrativo", "/bot/stock/ajuste")).toBe(true);
    expect(puedeOperar("Obrero", "/bot/pedidos/entregar")).toBe(false);
    expect(puedeOperar("Capataz", "/bot/pedidos/entregar")).toBe(true);
    expect(puedeOperar("Administrativo", "/bot/pedidos/entregar")).toBe(false);
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
    expect(puedeOperar("Cliente", "/bot/galeria")).toBe(false);
    expect(puedeOperar("Obrero", "/bot/galeria")).toBe(true);
    expect(puedeOperar("Seguridad e Higiene", "/bot/galeria")).toBe(true);
    expect(puedeOperar("Administrativo", "/bot/galeria")).toBe(true);
    expect(puedeOperar("Capataz", "/bot/galeria")).toBe(true);
    expect(puedeOperar("Director", "/bot/galeria")).toBe(true);
  });
});

describe("puedeAprobar", () => {
  test("Obrero y Cliente no aprueban operaciones de la bandeja", () => {
    expect(puedeAprobar("Obrero")).toBe(false);
    expect(puedeAprobar("Cliente")).toBe(false);
    expect(puedeAprobar("Sin asignar")).toBe(false);
  });

  test("Capataz y Director aprueban (compatibilidad)", () => {
    expect(puedeAprobar("Capataz")).toBe(true);
    expect(puedeAprobar("Director de obra")).toBe(true);
  });
});

describe("puedeAdministrarEquipo", () => {
  test("solo Director administra el equipo de una obra", () => {
    expect(puedeAdministrarEquipo("Director")).toBe(true);
    expect(puedeAdministrarEquipo("Director de obra")).toBe(true);
    expect(puedeAdministrarEquipo("Capataz")).toBe(false);
    expect(puedeAdministrarEquipo("Administrativo")).toBe(false);
    expect(puedeAdministrarEquipo("Obrero")).toBe(false);
    expect(puedeAdministrarEquipo(null)).toBe(false);
  });
});

describe("puedeAsignarRol", () => {
  test("Director puede otorgar cualquier rol, incluido Director", () => {
    expect(puedeAsignarRol("Director", "Cliente")).toBe(true);
    expect(puedeAsignarRol("Director", "Obrero")).toBe(true);
    expect(puedeAsignarRol("Director", "Seguridad e Higiene")).toBe(true);
    expect(puedeAsignarRol("Director", "Capataz")).toBe(true);
    expect(puedeAsignarRol("Director", "Administrativo")).toBe(true);
    expect(puedeAsignarRol("Director", "Director")).toBe(true);
    expect(puedeAsignarRol("Director de obra", "director")).toBe(true);
  });

  test("quien no administra el equipo no puede asignar ningún rol (fail closed)", () => {
    expect(puedeAsignarRol("Obrero", "Obrero")).toBe(false);
    expect(puedeAsignarRol("Capataz", "Obrero")).toBe(false);
    expect(puedeAsignarRol("Administrativo", "Obrero")).toBe(false);
    expect(puedeAsignarRol("Capataz", "Director")).toBe(false);
    expect(puedeAsignarRol(null, "Obrero")).toBe(false);
  });
});

describe("permisosDe", () => {
  test("lista los permisos habilitados de un rol con su label", () => {
    const permisos = permisosDe("Administrativo");
    expect(permisos).toEqual(
      expect.arrayContaining([
        { permiso: "pedido.crear", label: "crear pedidos de compra" },
        { permiso: "stock.ajustar", label: "ajustar stock" },
      ])
    );
    expect(permisos.map((p) => p.permiso)).not.toContain("pedido.entregar");
  });
});
