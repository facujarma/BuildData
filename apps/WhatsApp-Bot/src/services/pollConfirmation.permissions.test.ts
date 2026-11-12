// Gate de permisos previo a operar: la lista `permisos` que manda el Backend por
// obra es la verdad; la matriz estática del rol es solo el fallback de un backend
// viejo. `permisoBloqueado` devuelve la etiqueta de la acción bloqueada o null.

import { describe, expect, test } from "bun:test";
import type { Obra } from "../types/api.types";
import type { PendingQuery } from "../handlers/pendingQuery.store";

// pollConfirmation importa api.service y llm.service, que exigen estas variables
// al cargar. Los tests no hacen requests: solo evalúan la decisión de permisos.
process.env.API_URL ??= "http://127.0.0.1:1";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-key";
process.env.GROQ_API_KEY ??= "test-groq-key";

const { permisoBloqueado } = await import("./pollConfirmation.service");

function obra(rol: string, permisos?: string[]): Obra {
  return {
    obra_id: "obra-1",
    obra_nombre: "Torre A",
    rol,
    ...(permisos === undefined ? {} : { permisos }),
  };
}

function operacion(...endpoints: string[]): PendingQuery {
  return {
    type: "operation",
    operation: endpoints.map((endpoint) => ({
      endpoint,
      method: "POST" as const,
      data: {},
    })),
  };
}

const FOTO: PendingQuery = {
  type: "foto",
  media: { data: "", mimetype: "image/jpeg" },
};

const COMPROBANTE: PendingQuery = {
  type: "comprobante",
  data: {
    tipo: "transferencia",
    fecha: "2026-11-12",
    monto: "1000",
    moneda: "ARS",
    origen: "Ana",
    destino: "Proveedor",
    numeroOperacion: "1",
    entidad: "Banco",
  },
};

const FACTURA: PendingQuery = {
  type: "factura",
  data: {
    tipoFactura: "A",
    numero: "0001-00000001",
    fecha: "2026-11-12",
    fechaVencimiento: "2026-12-12",
    emisor: "Proveedor",
    cuitEmisor: "20111111112",
    receptor: "Obra",
    cuitReceptor: "20222222223",
    items: [],
    subtotal: "1000",
    iva: "210",
    total: "1210",
  },
};

describe("permisos dinámicos de la obra", () => {
  test("bloquea la operación si la lista de la obra no trae la capacidad", () => {
    // Capataz por matriz podría entregar, pero la obra le quitó el permiso.
    expect(
      permisoBloqueado(operacion("/bot/pedidos/entregar"), obra("Capataz", [])),
    ).toBe("marcar pedidos como entregados");
    // Obrero tiene stock.registrar en la matriz, pero no en esta obra.
    expect(
      permisoBloqueado(
        operacion("/bot/stock"),
        obra("Obrero", ["tarea.crear", "foto.subir"]),
      ),
    ).toBe("registrar movimientos de stock");
  });

  test("habilita una capacidad que la matriz estática del rol no tiene", () => {
    expect(
      permisoBloqueado(
        operacion("/bot/pedidos/entregar"),
        obra("Administrativo", ["pedido.entregar"]),
      ),
    ).toBeNull();
    // Cliente no tiene ningún permiso por matriz; la obra puede dárselos.
    expect(
      permisoBloqueado(operacion("/bot/galeria"), obra("Cliente", ["foto.subir"])),
    ).toBeNull();
    // Rol personalizado: manda su lista, no la matriz de un rol conocido.
    expect(
      permisoBloqueado(operacion("/bot/tareas"), obra("Paisajista", ["tarea.crear"])),
    ).toBeNull();
  });

  test("un lote con una sola operación prohibida se rechaza entero", () => {
    expect(
      permisoBloqueado(
        operacion("/bot/stock", "/bot/pedidos/entregar"),
        obra("Director", ["stock.registrar"]),
      ),
    ).toBe("marcar pedidos como entregados");
    expect(
      permisoBloqueado(
        operacion("/bot/stock", "/bot/tareas"),
        obra("Director", ["stock.registrar", "tarea.crear"]),
      ),
    ).toBeNull();
  });

  test("un array vacío significa 'no puede nada' (no cae a la matriz)", () => {
    expect(permisoBloqueado(operacion("/bot/stock"), obra("Director", []))).toBe(
      "registrar movimientos de stock",
    );
    expect(permisoBloqueado(FOTO, obra("Obrero", []))).toBe(
      "subir fotos a la galería",
    );
  });

  test("foto y comprobantes usan foto.subir y gasto.crear", () => {
    expect(permisoBloqueado(FOTO, obra("Seguridad e Higiene", ["foto.subir"]))).toBeNull();
    expect(permisoBloqueado(FOTO, obra("Seguridad e Higiene", ["alerta.crear"]))).toBe(
      "subir fotos a la galería",
    );
    expect(
      permisoBloqueado(COMPROBANTE, obra("Administrativo", ["gasto.crear"])),
    ).toBeNull();
    expect(permisoBloqueado(COMPROBANTE, obra("Administrativo", []))).toBe(
      "cargar gastos",
    );
    expect(permisoBloqueado(FACTURA, obra("Obrero", ["gasto.crear"]))).toBeNull();
    expect(permisoBloqueado(FACTURA, obra("Cliente", []))).toBe("cargar gastos");
  });

  test("un endpoint sin permiso mapeado falla cerrado", () => {
    expect(
      permisoBloqueado(operacion("/bot/nuevo"), obra("Director", ["pedido.crear"])),
    ).toBe("hacer esa operación");
    expect(permisoBloqueado(operacion("/bot/nuevo"), obra("Director"))).toBe(
      "hacer esa operación",
    );
  });
});

describe("fallback a la matriz estática (backend viejo)", () => {
  test("sin `permisos` usa la matriz del rol", () => {
    expect(permisoBloqueado(operacion("/bot/pedidos/entregar"), obra("Capataz"))).toBeNull();
    expect(
      permisoBloqueado(operacion("/bot/pedidos/entregar"), obra("Obrero")),
    ).toBe("marcar pedidos como entregados");
    expect(permisoBloqueado(operacion("/bot/stock/ajuste"), obra("Administrativo"))).toBeNull();
    expect(permisoBloqueado(operacion("/bot/stock/ajuste"), obra("Seguridad e Higiene"))).toBe(
      "ajustar stock",
    );
  });

  test("un rol libre viejo se normaliza antes de consultar la matriz", () => {
    expect(
      permisoBloqueado(operacion("/bot/pedidos/entregar"), obra("Director de obra")),
    ).toBeNull();
    expect(permisoBloqueado(operacion("/bot/pedidos/entregar"), obra("Compras"))).toBe(
      "marcar pedidos como entregados",
    );
    // Desconocido → Obrero (mínimo privilegio).
    expect(permisoBloqueado(FOTO, obra("Rey de la obra"))).toBeNull();
    expect(permisoBloqueado(operacion("/bot/pedidos/entregar"), obra("Rey de la obra"))).toBe(
      "marcar pedidos como entregados",
    );
  });

  test("foto y comprobantes también caen a la matriz", () => {
    expect(permisoBloqueado(FOTO, obra("Cliente"))).toBe("subir fotos a la galería");
    expect(permisoBloqueado(FOTO, obra("Obrero"))).toBeNull();
    expect(permisoBloqueado(FACTURA, obra("Obrero"))).toBeNull();
    expect(permisoBloqueado(FACTURA, obra("Seguridad e Higiene"))).toBe("cargar gastos");
  });
});
