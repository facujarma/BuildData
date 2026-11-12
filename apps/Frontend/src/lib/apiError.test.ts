// Contrato del error de permisos del Backend (403 SIN_PERMISO) en el cliente:
// los services tienen que conservar `status`/`code` para que la pantalla muestre
// el motivo real y no un "no se pudo…" genérico.

import { describe, expect, test } from "bun:test";
import {
  ApiError,
  apiErrorDesde,
  esErrorSinPermiso,
  mensajeAccionRechazada,
  mensajeDeError,
} from "./apiError";

describe("apiErrorDesde", () => {
  test("conserva status, code y el message del backend", () => {
    const error = apiErrorDesde(
      403,
      { code: "SIN_PERMISO", message: "Tu rol Obrero no puede crear pedidos" },
      "fallback",
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(403);
    expect(error.code).toBe("SIN_PERMISO");
    expect(error.message).toBe("Tu rol Obrero no puede crear pedidos");
  });

  test("acepta el shape viejo { error } y cae al fallback si no hay texto", () => {
    expect(apiErrorDesde(409, { error: "Rol en uso" }, "fallback").message).toBe("Rol en uso");
    expect(apiErrorDesde(500, {}, "No se pudo guardar").message).toBe("No se pudo guardar");
  });
});

describe("esErrorSinPermiso", () => {
  test("detecta 403 y code SIN_PERMISO aunque no sea ApiError", () => {
    expect(esErrorSinPermiso(new ApiError("x", { status: 403 }))).toBe(true);
    expect(esErrorSinPermiso(new ApiError("x", { status: 400, code: "SIN_PERMISO" }))).toBe(true);
    expect(esErrorSinPermiso({ status: 403 })).toBe(true);
    expect(esErrorSinPermiso({ code: "SIN_PERMISO" })).toBe(true);
  });

  test("no confunde errores de validación, red o null", () => {
    expect(esErrorSinPermiso(new ApiError("x", { status: 400, code: "VALIDATION_ERROR" }))).toBe(false);
    expect(esErrorSinPermiso(new Error("Failed to fetch"))).toBe(false);
    expect(esErrorSinPermiso(null)).toBe(false);
    expect(esErrorSinPermiso(undefined)).toBe(false);
  });
});

describe("mensajeAccionRechazada", () => {
  test("sin permiso: agrega el camino para habilitarlo", () => {
    const texto = mensajeAccionRechazada(
      new ApiError("Tu rol Obrero no puede aprobar pedidos", { status: 403, code: "SIN_PERMISO" }),
      "No se pudo aprobar el pedido",
    );

    expect(texto).toContain("Tu rol Obrero no puede aprobar pedidos");
    expect(texto).toContain("Configuración → Roles y permisos");
  });

  test("otro error: deja el mensaje real sin agregados", () => {
    expect(mensajeAccionRechazada(new ApiError("Stock insuficiente", { status: 409 }), "fallback")).toBe(
      "Stock insuficiente",
    );
  });

  test("sin mensaje usa el fallback de la pantalla", () => {
    expect(mensajeAccionRechazada(null, "No se pudo guardar")).toBe("No se pudo guardar");
    expect(mensajeDeError({}, "No se pudo guardar")).toBe("No se pudo guardar");
  });
});
