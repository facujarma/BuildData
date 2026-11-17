// Merge manual de dos personas (issue #13).
//
// La persona del teléfono (destino, la que usa el bot) absorbe a la persona web
// (origen, la que creó el login). El servicio `personas.service.js` migra todas
// las FKs, fusiona las membresías con el rol de mayor nivel, remapea
// tareas.asignado_a/completada_por, deja el snapshot en `personas_unificaciones`
// y recién al final borra la fila de origen.
//
// Uso (desde apps/Backend):
//   node scripts/unificar_personas.js --destino=<uuid|telefono> --origen=<uuid|email>
//   node scripts/unificar_personas.js --destino=... --origen=... --aplicar [--si] [--ejecutado-por=<uuid>]
//
//   --dry-run  (default) muestra el plan y NO escribe nada.
//   --aplicar  pide confirmación explícita (--si para modo no interactivo) y ejecuta.
//   --json     salida machine-readable (los errores van a stderr).
//
// Códigos de salida: 0 OK, 1 error de uso/ejecución, 2 conflictos (no escribe).
//
// No hay ids ni datos personales hardcodeados: todo sale de los flags.

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEXTO_TELEFONO_RE = /^\+?[\d\s().-]+$/;

export function esUuid(valor) {
  return typeof valor === "string" && UUID_RE.test(valor.trim());
}

export function idCorto(id) {
  return String(id ?? "").slice(0, 8) || "—";
}

// Misma regla que `personas.service.js:enmascararTelefono`. Se duplica acá para
// que el formateo humano sea puro y no dependa de importar el servicio con DB.
export function enmascararTelefono(telefono) {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  return digitos ? `***${digitos.slice(-4)}` : null;
}

export function clasificarIdentificador(valor) {
  const limpio = String(valor ?? "").trim();
  if (!limpio) return "vacio";
  if (esUuid(limpio)) return "uuid";
  if (limpio.includes("@")) return EMAIL_RE.test(limpio) ? "email" : "invalido";
  if (TEXTO_TELEFONO_RE.test(limpio) && limpio.replace(/\D/g, "").length >= 6) return "telefono";
  return "invalido";
}

export function parsearArgs(argv = process.argv) {
  const args = {
    destino: null,
    origen: null,
    aplicar: false,
    dryRun: false,
    ejecutadoPor: null,
    json: false,
    si: false,
    ayuda: false,
    errores: [],
  };

  for (const arg of argv.slice(2)) {
    if (arg === "--aplicar") args.aplicar = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--si") args.si = true;
    else if (arg === "--ayuda" || arg === "-h" || arg === "--help") args.ayuda = true;
    else if (arg.startsWith("--destino=")) args.destino = arg.slice("--destino=".length).trim();
    else if (arg.startsWith("--origen=")) args.origen = arg.slice("--origen=".length).trim();
    else if (arg.startsWith("--ejecutado-por=")) {
      args.ejecutadoPor = arg.slice("--ejecutado-por=".length).trim();
    } else args.errores.push(`Argumento desconocido: ${arg}`);
  }

  if (args.aplicar && args.dryRun) {
    args.errores.push("--aplicar y --dry-run son excluyentes");
  }

  return args;
}

export function validarArgs(args) {
  const errores = [...args.errores];

  if (!args.destino) errores.push("Falta --destino=<uuid|telefono>");
  else {
    const tipo = clasificarIdentificador(args.destino);
    if (tipo !== "uuid" && tipo !== "telefono") {
      errores.push("--destino debe ser un UUID de persona o un teléfono");
    }
  }

  if (!args.origen) errores.push("Falta --origen=<uuid|email>");
  else {
    const tipo = clasificarIdentificador(args.origen);
    if (tipo !== "uuid" && tipo !== "email") {
      errores.push("--origen debe ser un UUID de persona o un email de la cuenta web");
    }
  }

  if (args.destino && args.origen && args.destino === args.origen) {
    errores.push("--destino y --origen son el mismo valor");
  }

  if (args.ejecutadoPor && !esUuid(args.ejecutadoPor)) {
    errores.push("--ejecutado-por debe ser un UUID de persona");
  }

  return errores;
}

export async function buscarAuthPorEmail(db, email) {
  const { rows } = await db.query(
    `SELECT id, email FROM auth.users WHERE lower(email) = lower($1) LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

// Traduce el identificador que pasó el operador a un id de persona.
// `servicio` = módulo personas.service.js (se inyecta para poder testear sin DB).
export async function resolverPersona(db, valor, rol, servicio) {
  const tipo = clasificarIdentificador(valor);

  if (tipo === "uuid") {
    return { id: valor.trim(), via: "uuid", persona: null };
  }

  if (tipo === "telefono") {
    const persona = await servicio.buscarPersonaPorTelefono(db, valor);
    if (!persona) {
      throw new Error(`No hay ninguna persona con el teléfono ${enmascararTelefono(valor)}`);
    }
    return { id: persona.id, via: "telefono", persona };
  }

  if (tipo === "email") {
    const auth = await buscarAuthPorEmail(db, valor);
    if (!auth) {
      throw new Error(`No existe una cuenta web con el email ${valor}`);
    }
    const persona = await servicio.buscarPersonaPorAuthUserId(db, auth.id);
    if (!persona) {
      throw new Error(
        `La cuenta web ${valor} no tiene una persona asociada (auth_user_id ${auth.id})`
      );
    }
    return { id: persona.id, via: "email", persona, auth };
  }

  throw new Error(
    `No se pudo interpretar "${valor}" como ${rol} (usá uuid${rol === "destino" ? " o teléfono" : " o email"})`
  );
}

export function formatearPlan(plan) {
  if (!plan) return "Sin plan.";
  const lineas = [];

  if (plan.origen || plan.destino) {
    const origen = plan.origen;
    const destino = plan.destino;
    lineas.push("Plan de unificación");
    lineas.push(
      `  ORIGEN  (se elimina)  ${idCorto(origen?.id)}  ${origen?.nombre ?? "—"}${
        origen?.auth_user_id ? `  web: ${origen.auth_user_id}` : ""
      }`
    );
    lineas.push(
      `  DESTINO (se conserva) ${idCorto(destino?.id)}  ${destino?.nombre ?? "—"}  tel: ${
        enmascararTelefono(destino?.telefono) ?? "sin teléfono"
      }`
    );
    lineas.push("");
  }

  if (plan.miembros?.length > 0) {
    lineas.push(`Membresías (${plan.miembros.length}):`);
    for (const miembro of plan.miembros) {
      const origen = miembro.rol_origen ?? "—";
      const destino = miembro.rol_destino ?? "—";
      const crea = miembro.miembro_destino_id ? "" : "  (se crea la membresía)";
      lineas.push(
        `  obra ${idCorto(miembro.obra_id)}  origen ${origen.padEnd(10)} destino ${destino.padEnd(
          10
        )} → ${miembro.rol_final}${crea}`
      );
    }
    lineas.push("");
  } else {
    lineas.push("Membresías: ninguna en las dos personas.");
    lineas.push("");
  }

  const referencias = (plan.referencias ?? []).filter((ref) => (Number(ref.filas) || 0) > 0);
  const total = referencias.reduce((suma, ref) => suma + Number(ref.filas), 0);
  lineas.push(`Referencias a mover (${total} filas):`);
  if (referencias.length === 0) {
    lineas.push("  (ninguna)");
  } else {
    for (const ref of referencias) {
      const etiqueta = `${ref.tabla}.${ref.columna}`.padEnd(36);
      lineas.push(`  ${etiqueta}${String(ref.filas).padStart(5)}${ref.via ? `  (vía ${ref.via})` : ""}`);
    }
  }
  lineas.push("");

  if (plan.conflictos?.length > 0) {
    lineas.push(`Conflictos (${plan.conflictos.length}):`);
    for (const conflicto of plan.conflictos) lineas.push(`  - ${conflicto}`);
  } else {
    lineas.push("Conflictos: ninguno.");
  }

  return lineas.join("\n");
}

export function formatearResumen(resultado) {
  const lineas = ["Merge aplicado."];
  lineas.push(
    `  origen  ${idCorto(resultado.origen?.id)}  ${resultado.origen?.nombre ?? "—"} (eliminada)`
  );
  lineas.push(
    `  destino ${idCorto(resultado.destino?.id)}  ${resultado.destino?.nombre ?? "—"}${
      resultado.destino?.auth_user_id ? `  web: ${resultado.destino.auth_user_id}` : ""
    }`
  );
  lineas.push(`  filas movidas: ${resultado.total_movido ?? 0}`);

  if (resultado.miembros?.length > 0) {
    lineas.push("  membresías resultantes:");
    for (const miembro of resultado.miembros) {
      lineas.push(`    obra ${idCorto(miembro.obra_id)} → ${miembro.rol_final}`);
    }
  }

  lineas.push(`  auditoría: personas_unificaciones`);
  return lineas.join("\n");
}

export function imprimirAyuda(salida = console.log) {
  salida(
    [
      "Uso: node scripts/unificar_personas.js --destino=<uuid|telefono> --origen=<uuid|email> [opciones]",
      "",
      "  --destino=<uuid|telefono>  persona que se conserva (normalmente la del teléfono)",
      "  --origen=<uuid|email>      persona web que se elimina (el email se resuelve en auth.users)",
      "  --dry-run                  muestra el plan y no escribe (default)",
      "  --aplicar                  ejecuta el merge (pide confirmación)",
      "  --si                       confirma sin prompt (para modo no interactivo)",
      "  --ejecutado-por=<uuid>     persona que quedará en la auditoría",
      "  --json                     salida machine-readable; los errores van a stderr",
      "",
      "Con conflictos sale 2 y no escribe nada.",
      "Ejecutar desde apps/Backend (carga apps/Backend/.env).",
    ].join("\n")
  );
}

async function confirmarAplicacion(args) {
  if (args.si) return true;

  if (!process.stdin.isTTY) {
    console.error("Modo no interactivo: repetí el comando con --si para confirmar el merge.");
    return false;
  }

  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({
    input: process.stdin,
    output: args.json ? process.stderr : process.stdout,
  });
  try {
    const respuesta = await rl.question('Escribí "UNIFICAR" para confirmar (cualquier otra cosa cancela): ');
    return respuesta.trim().toUpperCase() === "UNIFICAR";
  } finally {
    rl.close();
  }
}

export function sanearPersona(persona) {
  if (!persona) return null;
  return { ...persona, telefono: enmascararTelefono(persona.telefono) };
}

function imprimirPlan(plan, args) {
  if (args.json) {
    console.log(
      JSON.stringify(
        {
          modo: args.aplicar ? "aplicar-plan" : "dry-run",
          origen: sanearPersona(plan.origen),
          destino: sanearPersona(plan.destino),
          miembros: plan.miembros,
          referencias: plan.referencias,
          conflictos: plan.conflictos,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(formatearPlan(plan));
  if (!args.aplicar) {
    console.log("");
    console.log("Dry-run: no se escribió nada. Para ejecutar, repetí con --aplicar.");
  }
}

function imprimirError(error, args) {
  console.error(`Error: ${error.message ?? error}`);
  if (error.detalle && (!Array.isArray(error.detalle) || error.detalle.length > 0)) {
    const detalle = Array.isArray(error.detalle) ? error.detalle.join(", ") : error.detalle;
    console.error(`Detalle: ${detalle}`);
  }
  if (args.json) {
    console.error(
      JSON.stringify({
        error: {
          code: error.code ?? null,
          message: error.message ?? String(error),
          detalle: error.detalle ?? null,
        },
      })
    );
  }
}

async function main() {
  const args = parsearArgs(process.argv);

  if (args.ayuda) {
    imprimirAyuda();
    return 0;
  }

  const errores = validarArgs(args);
  if (errores.length > 0) {
    for (const error of errores) console.error(`Error: ${error}`);
    imprimirAyuda(console.error);
    return 1;
  }

  // dotenv antes del import dinámico: db.js lee DATABASE_URL al evaluarse.
  // DOTENV_CONFIG_QUIET silencia también el config() de db.js: en `--json`
  // stdout tiene que ser JSON puro (sin los tips de dotenv).
  process.env.DOTENV_CONFIG_QUIET = "true";
  dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
  const { pool } = await import("../db.js");
  const servicio = await import("../services/personas.service.js");

  try {
    // También en dry-run: si aparece una FK nueva que el merge no sabe migrar,
    // el operador tiene que enterarse antes de escribir, no al aplicar.
    await servicio.verificarReferenciasConocidas(pool);

    const destino = await resolverPersona(pool, args.destino, "destino", servicio);
    const origen = await resolverPersona(pool, args.origen, "origen", servicio);

    if (destino.id === origen.id) {
      console.error("Error: --destino y --origen resuelven a la misma persona; no hay nada que unificar.");
      return 2;
    }

    const plan = await servicio.planificarUnificacion(pool, {
      origenId: origen.id,
      destinoId: destino.id,
    });

    imprimirPlan(plan, args);

    if (plan.conflictos?.length > 0) {
      return 2;
    }

    if (!args.aplicar) return 0;

    if (!(await confirmarAplicacion(args))) {
      console.error("Cancelado: no se escribió nada.");
      return 1;
    }

    const resultado = await servicio.unificarPersonas({
      origenId: origen.id,
      destinoId: destino.id,
      ejecutadoPor: args.ejecutadoPor,
    });

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            modo: "aplicar",
            resultado: {
              ...resultado,
              origen: sanearPersona(resultado.origen),
              destino: sanearPersona(resultado.destino),
            },
          },
          null,
          2
        )
      );
    } else {
      console.log("");
      console.log(formatearResumen(resultado));
    }

    return 0;
  } catch (error) {
    imprimirError(error, args);
    return servicio.esPersonaError(error) && error.code === "PERSONA_CONFLICTO" ? 2 : 1;
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
