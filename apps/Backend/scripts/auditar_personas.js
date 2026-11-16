// Auditoría de personas duplicadas (issue #13).
//
// Lista los pares "persona web / persona teléfono" que probablemente son el
// mismo humano, con sus membresías, el rol por obra y los conteos de
// referencias. Es el paso previo a `scripts/unificar_personas.js`.
//
// Uso (desde apps/Backend):
//   node scripts/auditar_personas.js
//   node scripts/auditar_personas.js --obra=<uuid>    # solo duplicados con membresía en esa obra
//   node scripts/auditar_personas.js --json           # salida machine-readable
//   node scripts/auditar_personas.js --estricto       # exit 1 si hay candidatos (para CI/monitoreo)
//
// Privacidad: los teléfonos salen SIEMPRE enmascarados (`***últimos 4`), también
// en `--json`. El servicio de auditoría ya los devuelve así; este script no
// consulta ni imprime el número completo. Los ids sí van completos para poder
// pasarlos al script de merge.

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esUuid(valor) {
  return typeof valor === "string" && UUID_RE.test(valor.trim());
}

// Id corto para la tabla; los ids completos quedan en el bloque de detalle y en
// el JSON, que es lo que se copia al comando de merge.
export function idCorto(id) {
  return String(id ?? "").slice(0, 8) || "—";
}

export function parsearArgs(argv = process.argv) {
  const args = { json: false, obra: null, estricto: false, ayuda: false, errores: [] };

  for (const arg of argv.slice(2)) {
    if (arg === "--json") args.json = true;
    else if (arg === "--estricto") args.estricto = true;
    else if (arg === "--ayuda" || arg === "-h" || arg === "--help") args.ayuda = true;
    else if (arg.startsWith("--obra=")) args.obra = arg.slice("--obra=".length).trim();
    else args.errores.push(`Argumento desconocido: ${arg}`);
  }

  if (args.obra !== null && !esUuid(args.obra)) {
    args.errores.push(`--obra debe ser un UUID válido (recibido: ${args.obra || "vacío"})`);
  }

  return args;
}

// La auditoría del servicio recorre toda la base. `--obra` acota a los pares
// donde al menos una de las dos personas tiene membresía en esa obra.
export function filtrarPorObra(candidatos, obraId) {
  if (!obraId) return candidatos;
  return (candidatos ?? []).filter((candidato) => {
    const obras = candidato.obras ?? (candidato.miembros ?? []).map((miembro) => miembro.obra_id);
    return obras.includes(obraId);
  });
}

export function formatearRoles(miembros = []) {
  if (!miembros || miembros.length === 0) return "sin membresías";
  return miembros
    .map((miembro) => {
      const origen = miembro.rol_origen ?? "—";
      const final = miembro.rol_final ?? "Obrero";
      return `${idCorto(miembro.obra_id)} ${origen}→${final}`;
    })
    .join("; ");
}

export function sumarReferencias(referencias = []) {
  return (referencias ?? []).reduce((total, ref) => total + (Number(ref.filas) || 0), 0);
}

// Tabla de ancho fijo. `columnas` = [{ titulo, clave, alinearDerecha? }].
export function formatearTabla(filas, columnas) {
  const encabezado = columnas.map((columna) => columna.titulo);
  const cuerpo = filas.map((fila) =>
    columnas.map((columna) => String(fila[columna.clave] ?? ""))
  );

  const anchos = columnas.map((columna, indice) =>
    Math.max(encabezado[indice].length, ...cuerpo.map((celdas) => celdas[indice].length), 0)
  );

  const linea = (celdas) =>
    celdas
      .map((celda, indice) =>
        columnas[indice].alinearDerecha ? celda.padStart(anchos[indice]) : celda.padEnd(anchos[indice])
      )
      .join("  ")
      .trimEnd();

  return [linea(encabezado), anchos.map((ancho) => "-".repeat(ancho)).join("  "), ...cuerpo.map(linea)].join(
    "\n"
  );
}

export function formatearDetalleReferencias(candidato) {
  const conFilas = (candidato.referencias ?? []).filter((ref) => (Number(ref.filas) || 0) > 0);
  if (conFilas.length === 0) return "      (sin referencias que mover)";
  return conFilas
    .map((ref) => {
      const etiqueta = `${ref.tabla}.${ref.columna}`.padEnd(36);
      const via = ref.via ? `  (vía ${ref.via})` : "";
      return `      ${etiqueta}${String(ref.filas).padStart(5)}${via}`;
    })
    .join("\n");
}

const COLUMNAS = [
  { titulo: "DESTINO", clave: "destino" },
  { titulo: "ORIGEN", clave: "origen" },
  { titulo: "NOMBRE (destino)", clave: "nombre" },
  { titulo: "TEL", clave: "telefono" },
  { titulo: "EMAIL WEB", clave: "email" },
  { titulo: "ROLES POR OBRA (origen→final)", clave: "roles" },
  { titulo: "REFS", clave: "refs", alinearDerecha: true },
  { titulo: "REVISAR", clave: "revisar" },
];

export function construirFilas(candidatos) {
  return candidatos.map((candidato) => ({
    destino: idCorto(candidato.destino?.id),
    origen: idCorto(candidato.origen?.id),
    nombre: candidato.destino?.nombre ?? "—",
    telefono: candidato.destino?.telefono ?? candidato.origen?.telefono ?? "—",
    email: candidato.origen?.email ?? candidato.destino?.email ?? "—",
    roles: formatearRoles(candidato.miembros),
    refs: String(sumarReferencias(candidato.referencias)),
    revisar: candidato.requiere_revision ? "SÍ" : "no",
  }));
}

export function imprimirAyuda(salida = console.log) {
  salida(
    [
      "Uso: node scripts/auditar_personas.js [--obra=<uuid>] [--json] [--estricto]",
      "",
      "  --obra=<uuid>  solo pares con membresía en esa obra",
      "  --json         salida JSON (teléfonos enmascarados)",
      "  --estricto     exit 1 si hay candidatos",
      "",
      "Ejecutar desde apps/Backend (carga apps/Backend/.env).",
    ].join("\n")
  );
}

function imprimirHumano(candidatos) {
  if (candidatos.length === 0) {
    console.log("No hay personas duplicadas candidatas.");
    return;
  }

  console.log(formatearTabla(construirFilas(candidatos), COLUMNAS));
  console.log("");

  for (const candidato of candidatos) {
    console.log(
      `  [destino ${candidato.destino?.id ?? "—"} ← origen ${candidato.origen?.id ?? "—"}] ${candidato.destino?.nombre ?? ""}`
    );
    console.log(`    motivos: ${(candidato.motivos ?? []).join(", ") || "—"}`);
    console.log(formatearDetalleReferencias(candidato));
    if (candidato.conflictos?.length > 0) {
      console.log(`    conflictos: ${candidato.conflictos.join(" | ")}`);
    }
    console.log("");
  }
}

function codigoDeSalida(args, candidatos) {
  return args.estricto && candidatos.length > 0 ? 1 : 0;
}

async function main() {
  const args = parsearArgs(process.argv);

  if (args.ayuda) {
    imprimirAyuda();
    return 0;
  }
  if (args.errores.length > 0) {
    for (const error of args.errores) console.error(`Error: ${error}`);
    imprimirAyuda(console.error);
    return 1;
  }

  // dotenv antes del import dinámico: db.js lee DATABASE_URL al evaluarse.
  // DOTENV_CONFIG_QUIET silencia también el config() de db.js: en `--json`
  // stdout tiene que ser JSON puro (sin los tips de dotenv).
  process.env.DOTENV_CONFIG_QUIET = "true";
  dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
  const { pool } = await import("../db.js");
  const { auditarDuplicadosPersonas } = await import("../services/personas.service.js");

  try {
    const { total, candidatos } = await auditarDuplicadosPersonas(pool);
    const filtrados = filtrarPorObra(candidatos, args.obra);

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            total: filtrados.length,
            total_global: total,
            obra: args.obra,
            telefonos_enmascarados: true,
            candidatos: filtrados,
          },
          null,
          2
        )
      );
    } else {
      console.log(
        `Auditoría de personas duplicadas${args.obra ? ` (obra ${args.obra})` : ""}: ${filtrados.length} de ${total} candidato(s)`
      );
      console.log("");
      imprimirHumano(filtrados);
      if (filtrados.length > 0) {
        console.log(
          "Revisá el plan de cada par con:\n" +
            "  node scripts/unificar_personas.js --destino=<id destino> --origen=<id origen> --dry-run"
        );
      }
    }

    return codigoDeSalida(args, filtrados);
  } catch (error) {
    console.error(`Error en la auditoría: ${error.message ?? error}`);
    if (args.json) {
      console.error(JSON.stringify({ error: error.message ?? String(error) }));
    }
    return 1;
  } finally {
    await pool.end();
  }
}

function esEjecucionDirecta() {
  const entrada = process.argv[1];
  if (!entrada) return false;
  return path.resolve(entrada) === fileURLToPath(import.meta.url);
}

if (esEjecucionDirecta()) {
  process.exitCode = await main();
}
