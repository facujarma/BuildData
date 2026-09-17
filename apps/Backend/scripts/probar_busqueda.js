import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { pool } = await import("../db.js");
const { ENTIDADES } = await import("../services/embeddings.service.js");
const { buscarCandidatos, LIMITE_DEFAULT } = await import(
  "../services/entitySearch.service.js"
);

function parseArgs(argv) {
  const args = { tipo: null, obra: null, nombre: null, limite: LIMITE_DEFAULT };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--tipo=")) args.tipo = arg.slice("--tipo=".length);
    else if (arg.startsWith("--obra=")) args.obra = arg.slice("--obra=".length);
    else if (arg.startsWith("--nombre=")) args.nombre = arg.slice("--nombre=".length);
    else if (arg.startsWith("--limite=")) args.limite = Number(arg.slice("--limite=".length));
  }
  return args;
}

const args = parseArgs(process.argv);

if (!ENTIDADES[args.tipo] || !args.nombre || (args.tipo !== "proveedor" && !args.obra)) {
  console.error(
    "Uso: node scripts/probar_busqueda.js --tipo=material|proveedor|rubro|tarea --nombre=\"...\" [--obra=<uuid>] [--limite=5]"
  );
  process.exit(1);
}

try {
  const { confianza, candidatos } = await buscarCandidatos(
    args.tipo,
    args.obra,
    args.nombre,
    args.limite
  );

  console.log(`Búsqueda "${args.nombre}" (${args.tipo}${args.obra ? `, obra ${args.obra}` : ""})`);
  console.log(`confianza: ${confianza}`);

  if (candidatos.length === 0) {
    console.log("  (sin candidatos: catálogo vacío o sin embeddings)");
  }
  for (const c of candidatos) {
    console.log(`  ${c.similitud.toFixed(3)}  ${c.nombre}  (${c.id})`);
  }
} catch (error) {
  console.error("Error:", error.message ?? error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
