// Tests del mapa ruta → permiso del dashboard. Cubre todas las secciones del
// layout, las sub-secciones con `?v=`, los defaults (sin `v` o con `v` basura)
// y las rutas que no exigen permiso (`null`).

import { describe, expect, test } from "bun:test";
import {
  LABEL_PERMISO,
  labelPermiso,
  permisoDeRuta,
  permisoFaltante,
  puedeSeccion,
} from "./permisosSecciones";

const OBRA = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const base = `/${OBRA}/dashboard`;

describe("permisoDeRuta — secciones simples", () => {
  test("dashboard", () => {
    expect(permisoDeRuta(base)).toBe("dashboard.ver");
    expect(permisoDeRuta(`${base}/`)).toBe("dashboard.ver");
  });

  test("bandeja, cronograma, alertas y equipo", () => {
    expect(permisoDeRuta(`${base}/inbox`)).toBe("bandeja.ver");
    expect(permisoDeRuta(`${base}/inbox/123`)).toBe("bandeja.ver");
    expect(permisoDeRuta(`${base}/cronograma`)).toBe("cronograma.ver");
    expect(permisoDeRuta(`${base}/alertas`)).toBe("alertas.ver");
    expect(permisoDeRuta(`${base}/equipo`)).toBe("equipo.ver");
  });

  test("perfil no exige permiso", () => {
    expect(permisoDeRuta(`${base}/perfil`)).toBeNull();
  });

  test("configuración se abre con configuracion.ver o roles.administrar", () => {
    expect(permisoDeRuta(`${base}/configuracion`)).toEqual([
      "configuracion.ver",
      "roles.administrar",
    ]);
  });

  test("rutas desconocidas y fuera del dashboard: null (no bloquear)", () => {
    expect(permisoDeRuta(`${base}/seccion-inventada`)).toBeNull();
    expect(permisoDeRuta("/projects")).toBeNull();
    expect(permisoDeRuta("/")).toBeNull();
  });
});

describe("permisoDeRuta — materiales ?v=", () => {
  test("cada sub-sección tiene su permiso", () => {
    expect(permisoDeRuta(`${base}/materiales`, "pedidos")).toBe("pedidos.ver");
    expect(permisoDeRuta(`${base}/materiales`, "stock")).toBe("stock.ver");
    expect(permisoDeRuta(`${base}/materiales`, "proveedores")).toBe("proveedores.ver");
  });

  test("sin v o con v desconocido cae en la primera sub-sección (pedidos)", () => {
    expect(permisoDeRuta(`${base}/materiales`)).toBe("pedidos.ver");
    expect(permisoDeRuta(`${base}/materiales`, null)).toBe("pedidos.ver");
    expect(permisoDeRuta(`${base}/materiales`, "otra-cosa")).toBe("pedidos.ver");
  });
});

describe("permisoDeRuta — costos ?v=", () => {
  test("presupuesto y comprobantes", () => {
    expect(permisoDeRuta(`${base}/costos`, "presupuesto")).toBe("presupuesto.ver");
    expect(permisoDeRuta(`${base}/costos`, "recibos")).toBe("recibos.ver");
  });

  test("default presupuesto", () => {
    expect(permisoDeRuta(`${base}/costos`)).toBe("presupuesto.ver");
    expect(permisoDeRuta(`${base}/costos`, "basura")).toBe("presupuesto.ver");
  });
});

describe("permisoDeRuta — registro ?v=", () => {
  test("actividad, galería y reportes", () => {
    expect(permisoDeRuta(`${base}/registro`, "actividad")).toBe("actividad.ver");
    expect(permisoDeRuta(`${base}/registro`, "galeria")).toBe("galeria.ver");
    expect(permisoDeRuta(`${base}/registro`, "reportes")).toBe("reportes.ver");
  });

  test("default actividad", () => {
    expect(permisoDeRuta(`${base}/registro`)).toBe("actividad.ver");
    expect(permisoDeRuta(`${base}/registro`, "x")).toBe("actividad.ver");
  });
});

describe("puedeSeccion", () => {
  test("un permiso cualquiera alcanza (lista = OR)", () => {
    const soloRoles = (p: string) => p === "roles.administrar";
    const soloConfig = (p: string) => p === "configuracion.ver";

    expect(puedeSeccion("dashboard.ver", () => true)).toBe(true);
    expect(puedeSeccion("dashboard.ver", () => false)).toBe(false);
    expect(puedeSeccion(["configuracion.ver", "roles.administrar"], soloRoles)).toBe(true);
    expect(puedeSeccion(["configuracion.ver", "roles.administrar"], soloConfig)).toBe(true);
    expect(puedeSeccion(["configuracion.ver", "roles.administrar"], () => false)).toBe(false);
  });

  test("sin requisito siempre se puede", () => {
    expect(puedeSeccion(null, () => false)).toBe(true);
  });
});

describe("permisoFaltante", () => {
  test("devuelve el permiso que falta (o null si la sección está permitida)", () => {
    expect(permisoFaltante(null, () => false)).toBeNull();
    expect(permisoFaltante("stock.ver", () => true)).toBeNull();
    expect(permisoFaltante("stock.ver", () => false)).toBe("stock.ver");
  });

  test("con alternativas devuelve el primero cuando no tiene ninguno", () => {
    const requerido = ["configuracion.ver", "roles.administrar"];
    expect(permisoFaltante(requerido, (p) => p === "roles.administrar")).toBeNull();
    expect(permisoFaltante(requerido, () => false)).toBe("configuracion.ver");
  });
});

describe("labelPermiso", () => {
  test("todos los permisos del mapa de rutas tienen label humano", () => {
    const requeridos = [
      permisoDeRuta(base),
      permisoDeRuta(`${base}/inbox`),
      permisoDeRuta(`${base}/cronograma`),
      permisoDeRuta(`${base}/materiales`, "stock"),
      permisoDeRuta(`${base}/materiales`, "proveedores"),
      permisoDeRuta(`${base}/costos`),
      permisoDeRuta(`${base}/costos`, "recibos"),
      permisoDeRuta(`${base}/alertas`),
      permisoDeRuta(`${base}/registro`, "galeria"),
      permisoDeRuta(`${base}/registro`, "reportes"),
      permisoDeRuta(`${base}/equipo`),
      ...(permisoDeRuta(`${base}/configuracion`) as string[]),
    ];

    for (const permiso of requeridos) {
      expect(typeof permiso).toBe("string");
      expect(LABEL_PERMISO[permiso as string]).toBeTruthy();
      expect(labelPermiso(permiso as string)).not.toBe(permiso as string);
    }
  });

  test("un permiso sin label cae en la clave (no rompe el cartel)", () => {
    expect(labelPermiso("permiso.inventado")).toBe("permiso.inventado");
  });
});
