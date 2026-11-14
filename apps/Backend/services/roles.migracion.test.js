// Guard de deriva entre el backfill SQL y ROLES_SISTEMA de roles.service.js.
//
// El JSON de la migración está escrito a mano en SQL: si alguien cambia una
// matriz en roles.service.js y no regenera la migración, las obras existentes
// quedan con permisos distintos a las nuevas. Este test compara tupla por tupla
// sin necesidad de Postgres.

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { ROLES_SISTEMA, normalizarPermisos } from "./roles.service.js";

const SQL = readFileSync(
  new URL("../outputs/migracion_roles_permisos.sql", import.meta.url),
  "utf8"
);

function tuplasDelBackfill(sql) {
  const inicio = sql.indexOf("CROSS JOIN (VALUES");
  const fin = sql.indexOf(") AS r(nombre, descripcion, nivel, permisos)");
  expect(inicio).toBeGreaterThan(-1);
  expect(fin).toBeGreaterThan(inicio);
  const bloque = sql.slice(inicio, fin);

  const tuplas = [];
  const regex = /\('([^']+)',\s*'([^']*)',\s*(\d+),\s*\$json\$([\s\S]*?)\$json\$\)/g;
  let match;
  while ((match = regex.exec(bloque)) !== null) {
    tuplas.push({
      nombre: match[1],
      descripcion: match[2],
      nivel: Number(match[3]),
      permisos: JSON.parse(match[4]),
    });
  }
  return tuplas;
}

describe("migracion_roles_permisos.sql", () => {
  test("es idempotente y elimina el CHECK de tres roles", () => {
    expect(SQL).toContain("ALTER TABLE public.miembros_obra DROP CONSTRAINT IF EXISTS miembros_obra_rol_check");
    expect(SQL).toContain("CREATE TABLE IF NOT EXISTS public.roles_obra");
    expect(SQL).toContain("CREATE UNIQUE INDEX IF NOT EXISTS roles_obra_nombre_unique");
    expect(SQL).toContain("(obra_id, lower(nombre))");
    expect(SQL).toContain("ON CONFLICT (obra_id, lower(nombre)) DO NOTHING");
    // No debe volver a crear un CHECK con la lista cerrada de roles.
    expect(SQL).not.toMatch(/miembros_obra_rol_check[\s\S]{0,200}CHECK\s*\(\s*rol\s+IN/i);
  });

  test("backfillea exactamente los seis roles de sistema de ROLES_SISTEMA", () => {
    const tuplas = tuplasDelBackfill(SQL);

    expect(tuplas.map((tupla) => tupla.nombre)).toEqual(
      ROLES_SISTEMA.map((rol) => rol.nombre)
    );

    for (const esperado of ROLES_SISTEMA) {
      const tupla = tuplas.find((candidata) => candidata.nombre === esperado.nombre);
      expect(tupla).toBeTruthy();
      expect(tupla.descripcion).toBe(esperado.descripcion);
      expect(tupla.nivel).toBe(esperado.nivel);
      expect(normalizarPermisos(tupla.permisos)).toEqual(
        normalizarPermisos(esperado.permisos)
      );
    }
  });

  test("la matriz SQL cubre las 10 claves bot y 30 web de cada rol", () => {
    const tuplas = tuplasDelBackfill(SQL);

    for (const tupla of tuplas) {
      expect(Object.keys(tupla.permisos.bot).length).toBe(10);
      expect(Object.keys(tupla.permisos.web).length).toBe(30);
    }
  });
});
