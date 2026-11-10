import { describe, expect, test } from "bun:test";
import type { PedidoPendiente } from "../handlers/pendingQuery.store";
import { filtrarPedidos, pedidoLabel } from "./pedidoMatch.service";

function pedido(
  id: string,
  proveedor: string | null,
  materiales: string,
): PedidoPendiente {
  return { id, estado: "aprobado", proveedor, materiales };
}

const CEMENTO_SUR = pedido("p1", "Corralón Sur", "Cemento Portland 50kg");
const CEMENTO_NORTE = pedido("p2", "Corralón Norte", "Cemento Portland 50kg");
const HIERRO_SUR = pedido("p3", "Corralón Sur", "Hierro del 8");
const TODOS = [CEMENTO_SUR, CEMENTO_NORTE, HIERRO_SUR];

describe("filtrarPedidos", () => {
  test("un token único deja un solo candidato", () => {
    expect(filtrarPedidos(TODOS, "hierro")).toEqual([HIERRO_SUR]);
    expect(filtrarPedidos(TODOS, "norte")).toEqual([CEMENTO_NORTE]);
  });

  test("dos tokens exigen que coincidan todos (every)", () => {
    // "sur" solo aparece en el proveedor: alcanza para descartar a Norte.
    expect(filtrarPedidos(TODOS, "cemento sur")).toEqual([CEMENTO_SUR]);
    expect(filtrarPedidos(TODOS, "cemento norte")).toEqual([CEMENTO_NORTE]);
  });

  test("una referencia con solo stopwords devuelve todos", () => {
    expect(filtrarPedidos(TODOS, "llegó el pedido de materiales hoy")).toBe(TODOS);
    expect(filtrarPedidos(TODOS, "de la y que")).toBe(TODOS);
    expect(filtrarPedidos(TODOS, "")).toBe(TODOS);
  });

  test("sin coincidencias devuelve todos para que el usuario elija", () => {
    expect(filtrarPedidos(TODOS, "zapatillas de seguridad")).toBe(TODOS);
  });

  test("compara sin tildes ni mayúsculas", () => {
    expect(filtrarPedidos(TODOS, "CEMENTÓ PORTLAND")).toEqual([
      CEMENTO_SUR,
      CEMENTO_NORTE,
    ]);
  });
});

describe("pedidoLabel", () => {
  test("arma proveedor — materiales", () => {
    expect(pedidoLabel(CEMENTO_SUR)).toBe("Corralón Sur — Cemento Portland 50kg");
  });

  test("sin proveedor usa 'Sin proveedor'", () => {
    expect(pedidoLabel(pedido("p4", null, ""))).toBe("Sin proveedor");
  });

  test("trunca a 90 caracteres", () => {
    const largo = pedido("p5", "Proveedor", "x".repeat(200));
    const label = pedidoLabel(largo);
    expect(label.length).toBe(88); // 87 + "…"
    expect(label.endsWith("…")).toBe(true);
  });
});
