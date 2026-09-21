import { describe, expect, test } from "bun:test";
import { validarSQL, construirParams, normalizarFilas } from "./sqlGuard.service.js";

const PERIODO = { desde: "2026-09-01", hasta: "2026-09-30" };

describe("validarSQL — válidos", () => {
  test("conteo simple con obra y período", () => {
    const sql = `SELECT COUNT(*) AS total FROM pedidos_materiales p
      WHERE p.obra_id = $1 AND p.fecha >= $2 AND p.fecha < ($3::date + INTERVAL '1 day')`;
    const r = validarSQL(sql, { periodo: PERIODO });
    expect(r.ok).toBe(true);
    expect(r.tablas).toEqual(["pedidos_materiales"]);
  });

  test("ranking con limit y join", () => {
    const sql = `SELECT m.nombre, SUM(ms.cantidad) AS total
      FROM movimientos_stock ms JOIN materiales m ON m.id = ms.material_id
      WHERE ms.obra_id = $1 AND ms.tipo = 'salida'
      GROUP BY m.nombre ORDER BY total DESC LIMIT 3`;
    const r = validarSQL(sql, { limite: 3 });
    expect(r.ok).toBe(true);
    expect(r.usaLimit).toBe(3);
  });

  test("tabla obras filtrada por id", () => {
    expect(validarSQL(`SELECT o.progress FROM obras o WHERE o.id = $1`).ok).toBe(true);
    expect(validarSQL(`SELECT progress FROM obras WHERE id = $1`).ok).toBe(true);
  });

  test("sin período no exige $2/$3", () => {
    expect(validarSQL(`SELECT COUNT(*) FROM gastos g WHERE g.obra_id = $1`).ok).toBe(true);
  });

  test("CTE permitida", () => {
    const sql = `WITH base AS (SELECT COUNT(*) AS total FROM gastos g WHERE g.obra_id = $1)
      SELECT total FROM base`;
    const r = validarSQL(sql);
    expect(r.ok).toBe(true);
    expect(r.tablas).toEqual(["gastos"]);
  });

  test("tabla indirecta unida al padre con obra filtrada", () => {
    const sql = `SELECT pi.cantidad FROM pedidos_items pi
      JOIN pedidos_materiales p ON p.id = pi.pedido_id
      WHERE p.obra_id = $1`;
    expect(validarSQL(sql).ok).toBe(true);
  });

  test("acepta punto y coma final", () => {
    const r = validarSQL(`SELECT COUNT(*) FROM gastos g WHERE g.obra_id = $1;`);
    expect(r.ok).toBe(true);
    expect(r.sql.endsWith(";")).toBe(false);
  });
});

describe("validarSQL — rechazos", () => {
  test("DML/DDL", () => {
    expect(validarSQL(`DELETE FROM gastos WHERE obra_id = $1`).ok).toBe(false);
    expect(validarSQL(`SELECT 1; DROP TABLE obras`).ok).toBe(false);
    expect(validarSQL(`SELECT * INTO copia FROM gastos WHERE obra_id = $1`).ok).toBe(false);
  });

  test("comentarios", () => {
    expect(validarSQL(`SELECT 1 FROM gastos g WHERE g.obra_id = $1 -- chau`).ok).toBe(false);
    expect(validarSQL(`SELECT /* x */ 1 FROM gastos g WHERE g.obra_id = $1`).ok).toBe(false);
  });

  test("tabla desconocida", () => {
    const r = validarSQL(`SELECT * FROM usuarios_app WHERE obra_id = $1`);
    expect(r.ok).toBe(false);
    expect(r.errores.join(" ")).toContain("usuarios_app");
  });

  test("esquemas y funciones del sistema", () => {
    expect(validarSQL(`SELECT * FROM auth.users`).ok).toBe(false);
    expect(validarSQL(`SELECT pg_sleep(10) FROM gastos g WHERE g.obra_id = $1`).ok).toBe(false);
  });

  test("sin filtro de obra", () => {
    expect(validarSQL(`SELECT COUNT(*) FROM gastos`).ok).toBe(false);
    expect(validarSQL(`SELECT progress FROM obras`).ok).toBe(false);
  });

  test("período sin $2/$3", () => {
    const r = validarSQL(`SELECT COUNT(*) FROM gastos g WHERE g.obra_id = $1`, { periodo: PERIODO });
    expect(r.ok).toBe(false);
    expect(r.errores.join(" ")).toContain("$2");
  });

  test("join implícito con coma", () => {
    const r = validarSQL(`SELECT * FROM gastos g, pedidos_materiales p WHERE g.obra_id = $1`);
    expect(r.ok).toBe(false);
    expect(r.errores.join(" ")).toContain("coma");
  });

  test("tabla de detalle sola sin padre", () => {
    expect(validarSQL(`SELECT * FROM pedidos_items`).ok).toBe(false);
  });

  test("LIMIT mayor al pedido o al máximo de seguridad", () => {
    const sql = `SELECT m.nombre FROM materiales m WHERE m.obra_id = $1 ORDER BY m.nombre LIMIT 10`;
    expect(validarSQL(sql, { limite: 3 }).ok).toBe(false);
    const sqlGrande = `SELECT m.nombre FROM materiales m WHERE m.obra_id = $1 ORDER BY m.nombre LIMIT 1000`;
    expect(validarSQL(sqlGrande, { limite: null }).ok).toBe(false);
  });

  test("ranking sin LIMIT", () => {
    const sql = `SELECT m.nombre FROM materiales m WHERE m.obra_id = $1 ORDER BY m.nombre DESC`;
    const r = validarSQL(sql, { limite: 5 });
    expect(r.ok).toBe(false);
    expect(r.errores.join(" ")).toContain("LIMIT");
  });
});

describe("construirParams", () => {
  test("sin período solo obra", () => {
    expect(construirParams("obra-1")).toEqual(["obra-1"]);
  });
  test("con período agrega desde/hasta", () => {
    expect(construirParams("obra-1", PERIODO)).toEqual(["obra-1", "2026-09-01", "2026-09-30"]);
  });
});

describe("normalizarFilas", () => {
  test("convierte numeric e int8 a número y date a ISO", () => {
    const resultado = {
      fields: [
        { name: "nombre", dataTypeID: 25 },
        { name: "total", dataTypeID: 1700 },
        { name: "cantidad", dataTypeID: 20 },
        { name: "fecha", dataTypeID: 1082 },
      ],
      rows: [
        {
          nombre: "cemento",
          total: "1234.50",
          cantidad: "3",
          fecha: new Date("2026-09-21T00:00:00.000Z"),
        },
      ],
    };
    expect(normalizarFilas(resultado)[0]).toEqual({
      nombre: "cemento",
      total: 1234.5,
      cantidad: 3,
      fecha: "2026-09-21",
    });
  });
});
