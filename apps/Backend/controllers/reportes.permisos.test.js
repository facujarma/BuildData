// Regresión BUG-001 (QA #8), cableado del controller de reportes: el snapshot y
// el reporte generado reciben la matriz web de `req.perfilObra` (la deja
// `exigirPermiso`). Si el controller dejara de pasarla, el service volvería a
// fallar abierto y expondría costos.
import { afterAll, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";

const llamado = { snapshot: null, reporte: null };

mock.module("../db.js", () => ({
  pool: {
    query: async (sql) => {
      if (sql.includes("INSERT INTO reportes")) {
        return { rows: [{ id: "rep-1", fecha_generacion: "2026-11-12T12:00:00.000Z" }] };
      }
      return { rows: [] };
    },
  },
}));

mock.module("../services/obraAccess.service.js", () => ({
  esMiembroDeObra: async () => true,
}));

mock.module("../services/actividad.service.js", () => ({
  registrarActividad: async () => {},
}));

mock.module("../services/reportes.service.js", () => ({
  RANGOS: ["semana", "mes", "trimestre", "total"],
  SECCIONES: ["resumen", "presupuesto", "cronograma"],
  calcularSnapshot: async (db, obraId, rango, permisosWeb) => {
    llamado.snapshot = { obraId, rango, permisosWeb };
    return { rango, obra: "Obra QA", avance: 10 };
  },
  armarReporte: async (db, obraId, rango, secciones, permisosWeb) => {
    llamado.reporte = { obraId, rango, secciones, permisosWeb };
    return {
      snapshot: {
        obra: "Obra QA",
        rango,
        avance: 10,
        tareas: { done: 0, total: 0, late: 0 },
        alertas: 0,
        pedidos: 0,
      },
      secciones: { resumen: {} },
    };
  },
}));

const { getSnapshot, generarReporte } = await import("./reportesController.js");

function respuestaFalsa() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

const WEB_CAPATAZ = { "reportes.ver": true, "presupuesto.ver": true };
const WEB_CLIENTE = { "reportes.ver": true };

afterAll(() => {
  mock.restore();
});

describe("reportesController — permisos web hacia el service", () => {
  test("getSnapshot pasa la matriz web de req.perfilObra", async () => {
    const res = respuestaFalsa();
    await getSnapshot(
      {
        params: { obra_id: OBRA_ID },
        query: { rango: "mes" },
        personaId: PERSONA_ID,
        perfilObra: { rol: { nombre: "Capataz" }, permisos: { bot: {}, web: WEB_CAPATAZ } },
      },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(llamado.snapshot.permisosWeb).toEqual(WEB_CAPATAZ);
    expect(llamado.snapshot.rango).toBe("mes");
  });

  test("generarReporte pasa la matriz web de req.perfilObra", async () => {
    const res = respuestaFalsa();
    await generarReporte(
      {
        params: { obra_id: OBRA_ID },
        body: { rango: "mes", secciones: ["resumen"] },
        personaId: PERSONA_ID,
        perfilObra: { rol: { nombre: "Cliente" }, permisos: { bot: {}, web: WEB_CLIENTE } },
      },
      res
    );

    expect(res.statusCode).toBe(201);
    expect(llamado.reporte.permisosWeb).toEqual(WEB_CLIENTE);
  });
});
