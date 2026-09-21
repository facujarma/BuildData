import { TABLAS } from "./schemaContext.js";
import { pool } from "../../db.js";

// Guard + ejecutor del SQL generado por el LLM.
// Estrategia de seguridad (SQL libre + guardrails):
//  1. validación estática: una sola sentencia SELECT/WITH, sin comentarios ni DDL/DML,
//     tablas de la whitelist, filtro de obra obligatorio y parámetros requeridos;
//  2. ejecución en transacción READ ONLY con statement_timeout y LIMIT de seguridad.
// La validación es heurística: la barrera dura es la transacción read-only de Postgres.

const PALABRAS_PROHIBIDAS =
  /\b(insert|update|delete|drop|alter|create|grant|revoke|truncate|copy|vacuum|analyze|call|do|merge|refresh|reindex|cluster|discard|listen|notify|lock|begin|commit|rollback|savepoint|release|prepare|deallocate|execute|into|explain|show|set|reset|pg_sleep|dblink|lo_import|lo_export|current_setting|set_config)\b/i;

const ESQUEMAS_PROHIBIDOS = /\b(pg_catalog|information_schema|auth|storage|vault|extensions)\s*\./i;

const PALABRAS_RESERVADAS = new Set([
  "where", "group", "order", "limit", "having", "union", "join", "left", "right",
  "inner", "full", "cross", "on", "using", "window", "offset", "fetch", "as",
]);

export const LIMITE_SEGURIDAD = 500;
export const TIMEOUT_MS = 5000;

function extraerCTEs(sql) {
  const nombres = new Set();
  const re = /\bwith\s+([a-z_][\w]*)\s+as\s*\(/gi;
  let m;
  while ((m = re.exec(sql))) nombres.add(m[1].toLowerCase());
  const re2 = /,\s*([a-z_][\w]*)\s+as\s*\(/gi;
  while ((m = re2.exec(sql))) nombres.add(m[1].toLowerCase());
  return nombres;
}

function extraerTablas(sql) {
  const tablas = new Set();
  const re = /\b(?:from|join)\s+([a-z_][\w]*)(?:\s*\.\s*([a-z_][\w]*))?/gi;
  let m;
  while ((m = re.exec(sql))) {
    const nombre = (m[2] ?? m[1]).toLowerCase();
    tablas.add(nombre);
  }
  return tablas;
}

function aliasDeTabla(sql, tabla) {
  const re = new RegExp(`\\b(?:from|join)\\s+${tabla}\\s+(?:as\\s+)?([a-z_][\\w]*)`, "i");
  const m = sql.match(re);
  if (!m) return null;
  const palabra = m[1].toLowerCase();
  return PALABRAS_RESERVADAS.has(palabra) ? null : m[1];
}

// Rechaza joins implícitos por coma (FROM a, b), que son difíciles de scopear.
function tieneCommaJoin(sql) {
  const re = /\bfrom\b/gi;
  let m;
  while ((m = re.exec(sql))) {
    let depth = 0;
    for (let i = m.index + m[0].length; i < sql.length; i++) {
      const c = sql[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (depth === 0) {
        if (c === ",") return true;
        if (/[a-z_]/i.test(c)) {
          const kw = sql.slice(i).match(/^([a-z_]+)\b/i);
          if (kw && PALABRAS_RESERVADAS.has(kw[1].toLowerCase())) break;
        }
      }
    }
  }
  return false;
}

export function validarSQL(sqlCrudo, { periodo = null, limite = null } = {}) {
  const errores = [];

  let sql = String(sqlCrudo ?? "").trim();
  if (!sql) return { ok: false, errores: ["SQL vacío"], sql: null, tablas: [] };

  if (sql.endsWith(";")) sql = sql.slice(0, -1).trim();
  if (sql.includes(";")) errores.push("Solo se permite una sentencia (sin ';' intermedios)");
  if (/--|\/\*|\*\//.test(sql)) errores.push("No se permiten comentarios");
  if (!/^(select|with)\b/i.test(sql)) errores.push("Debe empezar con SELECT o WITH");
  if (PALABRAS_PROHIBIDAS.test(sql)) errores.push("Contiene una palabra prohibida (DDL/DML o funciones del sistema)");
  if (ESQUEMAS_PROHIBIDOS.test(sql)) errores.push("No se pueden usar esquemas del sistema");
  if (/\bpg_\w+/i.test(sql)) errores.push("No se pueden usar funciones pg_*");
  if (tieneCommaJoin(sql)) errores.push("No se permiten joins implícitos con coma");

  const ctes = extraerCTEs(sql);
  const refs = [...extraerTablas(sql)].filter((t) => !ctes.has(t));

  for (const tabla of refs) {
    if (!TABLAS[tabla]) errores.push(`Tabla desconocida o no permitida: "${tabla}"`);
  }

  const directas = refs.filter((t) => TABLAS[t]?.obraId === "obra_id");
  const indirectas = ["pedidos_items", "presupuesto_rubros", "factura_items", "materiales_proveedores"];
  const usaIndirecta = refs.some((t) => indirectas.includes(t));

  if (refs.length === 0) {
    errores.push("La consulta no usa ninguna tabla del esquema");
  }

  if (directas.length > 0 && !/obra_id\s*=\s*\$1/i.test(sql)) {
    errores.push(`Falta el filtro de obra: ${directas.map((t) => `${t}.obra_id = $1`).join(" / ")}`);
  }

  if (refs.includes("obras")) {
    const alias = aliasDeTabla(sql, "obras");
    const patron = alias
      ? new RegExp(`(?:\\b${alias}\\.id|\\bobras\\.id|(?<![\\w.])id)\\s*=\\s*\\$1`, "i")
      : /(?:\bobras\.id|(?<![\w.])id)\s*=\s*\$1/i;
    if (!patron.test(sql)) errores.push("La tabla obras debe filtrarse con id = $1");
  }

  if (usaIndirecta && directas.length === 0 && !refs.includes("obras")) {
    errores.push("Las tablas de detalle deben unirse a una tabla de la obra filtrada por obra_id = $1");
  }

  if (periodo) {
    if (!/\$2\b/.test(sql)) errores.push("Falta el parámetro $2 (desde) del período");
    if (!/\$3\b/.test(sql)) errores.push("Falta el parámetro $3 (hasta) del período");
  } else if (!/\$1\b/.test(sql)) {
    errores.push("Falta el parámetro $1 (obra)");
  }

  const limitMatch = sql.match(/\blimit\s+(\d+)/i);
  const limitSql = limitMatch ? Number(limitMatch[1]) : null;
  if (limite) {
    if (limitSql === null) errores.push(`La subpregunta pide un ranking: falta LIMIT ${limite}`);
    else if (limitSql > limite) errores.push(`LIMIT ${limitSql} mayor al pedido (${limite})`);
  }
  if (limitSql !== null && limitSql > LIMITE_SEGURIDAD) {
    errores.push(`LIMIT ${limitSql} supera el máximo permitido (${LIMITE_SEGURIDAD})`);
  }

  return { ok: errores.length === 0, errores, sql, tablas: refs, usaLimit: limitSql };
}

export function construirParams(obraId, periodo = null) {
  return periodo ? [obraId, periodo.desde, periodo.hasta] : [obraId];
}

// La columna "fecha_completada" es timestamp y "fecha" es date: el SQL siempre
// compara >= $2 AND < ($3::date + 1 day), que funciona para ambos.
export function normalizarFilas(resultado) {
  const campos = resultado.fields ?? [];
  return resultado.rows.map((fila) => {
    const salida = {};
    for (const campo of campos) {
      const valor = fila[campo.name];
      if (valor === null || valor === undefined) {
        salida[campo.name] = valor;
      } else if (campo.dataTypeID === 1700 || campo.dataTypeID === 20) {
        salida[campo.name] = Number(valor);
      } else if (campo.dataTypeID === 1082 && valor instanceof Date) {
        salida[campo.name] = valor.toISOString().slice(0, 10);
      } else if ((campo.dataTypeID === 1114 || campo.dataTypeID === 1184) && valor instanceof Date) {
        salida[campo.name] = valor.toISOString();
      } else {
        salida[campo.name] = valor;
      }
    }
    return salida;
  });
}

export function mensajeErrorPG(error) {
  const codigos = {
    "42P01": "La tabla no existe",
    "42703": "La columna no existe",
    "42883": "La función no existe",
    "42601": "Error de sintaxis en el SQL",
    "22P02": "Valor inválido para el tipo de dato",
    "57014": `La consulta superó el tiempo máximo (${TIMEOUT_MS / 1000}s)`,
  };
  return codigos[error.code] ?? error.message;
}

export async function ejecutarSQL(sql, params) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL TRANSACTION READ ONLY");
    await client.query(`SET LOCAL statement_timeout = '${TIMEOUT_MS}ms'`);
    const resultado = await client.query(sql, params);
    return normalizarFilas(resultado);
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
  }
}
