import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { pool } = await import("../db.js");
const { ENTIDADES, guardarEmbeddings, modeloEmbeddings } = await import(
  "../services/embeddings.service.js"
);

function parseArgs(argv) {
  const args = { tipo: "all", obra: null, force: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--force") args.force = true;
    else if (arg.startsWith("--tipo=")) args.tipo = arg.slice("--tipo=".length);
    else if (arg.startsWith("--obra=")) args.obra = arg.slice("--obra=".length);
  }
  return args;
}

const args = parseArgs(process.argv);

if (!process.env.OPENAI_API_KEY) {
  console.error("Falta OPENAI_API_KEY en apps/Backend/.env");
  process.exit(1);
}

const tipos = args.tipo === "all" ? Object.keys(ENTIDADES) : [args.tipo];
for (const tipo of tipos) {
  if (!ENTIDADES[tipo]) {
    console.error(`Tipo desconocido: ${tipo} (usar: all, ${Object.keys(ENTIDADES).join(", ")})`);
    process.exit(1);
  }
}

console.log(`Backfill de embeddings (modelo: ${modeloEmbeddings()})`);

let total = 0;

try {
  for (const tipo of tipos) {
    const entidad = ENTIDADES[tipo];
    const params = [];
    const where = [args.force ? "true" : "embedding IS NULL"];

    if (args.obra && entidad.tabla !== "proveedores") {
      params.push(args.obra);
      where.push(`obra_id = $${params.length}`);
    }

    const { rows } = await pool.query(
      `SELECT id, ${entidad.columnaNombre} AS nombre FROM ${entidad.tabla}
       WHERE ${where.join(" AND ")}`,
      params
    );

    console.log(`- ${tipo}: ${rows.length} pendientes`);
    if (rows.length === 0) continue;

    const ok = await guardarEmbeddings(tipo, rows);
    total += ok;
    console.log(`  ${ok}/${rows.length} embeddings guardados`);
  }
  console.log(`Listo. Total: ${total}`);
} catch (error) {
  console.error("Error en el backfill:", error.message ?? error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
