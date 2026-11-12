// Corre cada archivo de test en su propio proceso de Bun.
//
// ¿Por qué? `mock.module()` es global al proceso y, en algunas versiones de Bun
// (p. ej. 1.3.12, la que usa CI), `--isolate` no evita que el mock de un archivo
// se filtre al siguiente. Eso hacía que un mock parcial de `roles.service`,
// `actividad.service`, `user.service` o `next/navigation` rompiera tests de otros
// archivos con "Export named ... not found" o con `ROLES_SISTEMA` vacío.
//
// Un proceso por archivo es la barrera dura: cada test arranca con el registry de
// módulos limpio. Es más lento que un solo `bun test`, pero sigue siendo segundos.
//
// Uso:
//   bun scripts/run-tests-by-file.mjs [--cwd <dir>] <archivo-o-dir> [...]
//
// Sin argumentos corre todos los `*.test.*` desde el cwd del repo.

import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const PATRON_TEST = /\.test\.(?:js|mjs|cjs|ts|tsx|jsx)$/;
const IGNORAR = new Set(["node_modules", ".next", ".git", "dist", "build", "graphify-out", "coverage"]);

const args = process.argv.slice(2);
const cwdIndex = args.indexOf("--cwd");
const cwd = cwdIndex >= 0 ? resolve(args[cwdIndex + 1]) : process.cwd();
if (cwdIndex >= 0) args.splice(cwdIndex, 2);
const raices = args.length > 0 ? args : ["."];

function recorrer(ruta, salida) {
  let entradas;
  try {
    entradas = readdirSync(ruta, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entrada of entradas) {
    if (IGNORAR.has(entrada.name)) continue;
    const completa = join(ruta, entrada.name);
    if (entrada.isDirectory()) recorrer(completa, salida);
    else if (entrada.isFile() && PATRON_TEST.test(entrada.name)) salida.push(completa);
  }
}

const archivos = [];
for (const raiz of raices) recorrer(resolve(cwd, raiz), archivos);
archivos.sort();

if (archivos.length === 0) {
  console.error(`No se encontraron tests en ${raices.join(", ")} (cwd: ${cwd})`);
  process.exit(1);
}

const fallidos = [];
for (const archivo of archivos) {
  const relativo = relative(cwd, archivo);
  process.stdout.write(`\n▶ ${relativo}\n`);
  const resultado = spawnSync(process.execPath, ["test", relativo], {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  if (resultado.status !== 0) fallidos.push(relativo);
}

if (fallidos.length > 0) {
  console.error(`\n${fallidos.length} archivo(s) de test fallaron:`);
  for (const archivo of fallidos) console.error(`  - ${archivo}`);
  process.exit(1);
}

console.log(`\n${archivos.length} archivo(s) de test OK.`);
