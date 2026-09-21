import { completarJSON } from "./groq.service.js";
import { resumenSQL } from "./schemaContext.js";
import { validarSQL, construirParams } from "./sqlGuard.service.js";

// Fase 2 del ChatBot AI: traducir UNA subpregunta a UNA consulta SQL SELECT.
// El SQL pasa por validarSQL; si no pasa, se reintenta una vez con los errores.

function construirSystemPrompt() {
  return `
Sos el GENERADOR DE SQL de un asistente de datos para BuildData, una app de gestión de obras de construcción.
Recibís UNA subpregunta ya descompuesta y devolvés UNA consulta SQL SELECT para PostgreSQL que la responde.

Respondé ÚNICAMENTE con JSON, sin markdown:
{ "sql": "SELECT ...", "explicacion": "una frase en español de qué trae la consulta" }

# Esquema (el único permitido)
${resumenSQL()}

# Reglas obligatorias
1. Una sola sentencia que empiece con SELECT o WITH ... SELECT. Sin ";" final, sin comentarios.
2. La obra activa viene en $1 (uuid). Toda tabla con columna obra_id debe filtrarse con obra_id = $1 usando su alias (ej: g.obra_id = $1). Si consultás "obras", filtrá id = $1. Las tablas de detalle (pedidos_items, presupuesto_rubros, factura_items, materiales_proveedores) deben unirse a su tabla padre, que a su vez está filtrada por obra.
3. Si la subpregunta tiene período, $2 (desde) y $3 (hasta) son fechas. Usá SIEMPRE esta forma, que sirve para columnas date y timestamp:
   <columna_fecha> >= $2 AND <columna_fecha> < ($3::date + INTERVAL '1 day')
   Columnas de fecha: gastos.fecha (date), comprobantes_facturas.fecha (date), pedidos_materiales.fecha (timestamp), tareas.fecha_completada (timestamp), movimientos_stock.fecha (timestamp), actividad.created_at (timestamp), tareas.fecha_limite (date), tareas.fecha_inicio (date).
4. Nombres propios (rubro, material, proveedor): usá coincidencia aproximada con ILIKE, ej: r.nombre ILIKE '%albañilería%'. Nunca igualdad exacta.
5. Montos: sumá solo montos de la misma moneda: AND moneda = 'ARS' (salvo que la subpregunta pida otra).
6. Agregaciones: COUNT(*) para conteos, SUM(col) para montos, AVG(col) para promedios, y COALESCE(SUM(col), 0) cuando la subpregunta espera un número único.
7. Rankings: si la subpregunta tiene "limite", terminá con ORDER BY <criterio> DESC LIMIT <ese número exacto>. Si es el mayor/menor de algo, LIMIT 1. En listados sin "limite" no agregues LIMIT.
8. Series temporales: agrupá con date_trunc('month', <fecha>) (o 'week'/'day') y devolvé una etiqueta legible, ej: TO_CHAR(date_trunc('month', g.fecha), 'YYYY-MM') AS periodo, ordenada ascendente.
9. Nombres de columna claros en snake_case. En rankings y listados incluí el dato descriptivo (nombre del material/rubro/proveedor, no solo su id).
10. Nunca inventes tablas ni columnas fuera del esquema. No uses esquemas auth, pg_catalog ni information_schema.
11. "explicacion" en español, una frase, sin SQL.
`.trim();
}

function subpreguntaParaPrompt(sub) {
  return JSON.stringify(
    {
      descripcion: sub.descripcion,
      tipo: sub.tipo,
      agrupar_por: sub.agrupar_por ?? null,
      limite: sub.limite ?? null,
      tablas_esperadas: sub.tablas_esperadas ?? [],
    },
    null,
    2
  );
}

function construirMensaje(subpregunta, obra, obraId) {
  const parametros = subpregunta.periodo
    ? `$1 = '${obraId}' (obra_id), $2 = '${subpregunta.periodo.desde}' (desde), $3 = '${subpregunta.periodo.hasta}' (hasta)`
    : `$1 = '${obraId}' (obra_id). Sin período.`;
  return (
    `${obra ? `Obra activa: "${obra}"\n` : ""}` +
    `Parámetros disponibles: ${parametros}\n\n` +
    `Subpregunta:\n${subpreguntaParaPrompt(subpregunta)}`
  );
}

export async function generarSQL(subpregunta, { obra = null, obraId }) {
  const sistema = construirSystemPrompt();
  const mensaje = construirMensaje(subpregunta, obra, obraId);
  const opciones = { periodo: subpregunta.periodo ?? null, limite: subpregunta.limite ?? null };

  const primera = await completarJSON({ system: sistema, user: mensaje });
  let candidato = primera.datos ?? {};
  let usage = primera.usage?.total_tokens ?? 0;
  let validacion = validarSQL(candidato.sql, opciones);

  if (!validacion.ok) {
    const correccion =
      `\n\nTu SQL anterior fue rechazado por:\n` +
      validacion.errores.map((e) => `- ${e}`).join("\n") +
      `\nDevolvé de nuevo el JSON { "sql": "...", "explicacion": "..." } corregido.`;
    const segunda = await completarJSON({ system: sistema, user: mensaje + correccion });
    usage += segunda.usage?.total_tokens ?? 0;
    candidato = segunda.datos ?? {};
    validacion = validarSQL(candidato.sql, opciones);

    if (!validacion.ok) {
      return {
        ok: false,
        errores: validacion.errores,
        sql: typeof candidato.sql === "string" ? candidato.sql : null,
        explicacion: candidato.explicacion ?? null,
        usage,
      };
    }
    return {
      ok: true,
      reintento: true,
      sql: validacion.sql,
      explicacion: candidato.explicacion ?? null,
      params: construirParams(obraId, subpregunta.periodo),
      usage,
    };
  }

  return {
    ok: true,
    reintento: false,
    sql: validacion.sql,
    explicacion: candidato.explicacion ?? null,
    params: construirParams(obraId, subpregunta.periodo),
    usage,
  };
}
