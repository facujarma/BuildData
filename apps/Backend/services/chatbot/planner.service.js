import { completarJSON } from "./groq.service.js";
import { resumenPlanner, TABLAS_PERMITIDAS, GLOSARIO } from "./schemaContext.js";

// Fase 1 del ChatBot AI: descomponer una pregunta en lenguaje natural en
// subpreguntas atómicas. El planner NO escribe SQL: define qué dato exacto
// necesita cada subpregunta (período, agrupamiento, límite y tablas esperadas).

export const TIPOS = ["conteo", "suma", "promedio", "listado", "ranking", "serie"];

const ZONA = "America/Argentina/Buenos_Aires";
const MAX_SUBPREGUNTAS = 5;

export function hoyISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function aFecha(fechaISO) {
  return new Date(`${fechaISO}T12:00:00Z`);
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function sumarDias(fechaISO, dias) {
  const d = aFecha(fechaISO);
  d.setUTCDate(d.getUTCDate() + dias);
  return iso(d);
}

// Calendario precalculado en Node para no confiarle aritmética de fechas al LLM.
export function contextoFechas(hoy = hoyISO()) {
  const d = aFecha(hoy);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lunes
  const lunes = sumarDias(hoy, -dow);
  const domingo = sumarDias(lunes, 6);
  const lunesPasado = sumarDias(lunes, -7);
  const domingoPasado = sumarDias(lunesPasado, 6);
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));
  const primerDiaMes = new Date(Date.UTC(anio, mes - 1, 1));
  const ultimoDiaMes = new Date(Date.UTC(anio, mes, 0));
  const primerDiaMesPasado = new Date(Date.UTC(anio, mes - 2, 1));
  const ultimoDiaMesPasado = new Date(Date.UTC(anio, mes - 1, 0));

  return {
    hoy,
    ayer: sumarDias(hoy, -1),
    lunesSemanaActual: lunes,
    domingoSemanaActual: domingo,
    lunesSemanaPasada: lunesPasado,
    domingoSemanaPasada: domingoPasado,
    primerDiaMesActual: iso(primerDiaMes),
    ultimoDiaMesActual: iso(ultimoDiaMes),
    primerDiaMesPasado: iso(primerDiaMesPasado),
    ultimoDiaMesPasado: iso(ultimoDiaMesPasado),
    primerDiaAnioActual: `${anio}-01-01`,
  };
}

function descripcionHumanaFecha(fechaISO) {
  return new Date(`${fechaISO}T12:00:00Z`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function construirSystemPrompt() {
  return `
Sos el PLANIFICADOR de un asistente de datos para BuildData, una app de gestión de obras de construcción.
Recibís UNA pregunta en lenguaje natural y la descomponés en subpreguntas atómicas que después se traducen a consultas SQL SELECT sobre UNA sola obra.
Vos NO escribís SQL.

Respondé ÚNICAMENTE con un JSON válido, sin markdown ni texto extra, con esta forma:
{
  "interpretacion": "qué entiende que pide el usuario, en una frase",
  "subpreguntas": [
    {
      "id": "q1",
      "descripcion": "qué dato exacto debe devolver el SELECT. Debe ser autocontenida: incluir filtros, nombres textuales y agrupamiento, porque quien escribe el SQL no ve la pregunta original",
      "tipo": "conteo | suma | promedio | listado | ranking | serie",
      "periodo": { "desde": "YYYY-MM-DD", "hasta": "YYYY-MM-DD" },
      "agrupar_por": null,
      "limite": null,
      "tablas_esperadas": ["tabla1", "tabla2"]
    }
  ],
  "necesita_aclaracion": null
}

Significado de "tipo":
- conteo: cantidad de filas/eventos ("cuántos")
- suma: suma de un campo numérico ("cuánto", "total", "gasto")
- promedio: promedio de un campo numérico
- listado: lista de filas o valores, sin orden ni límite pedido
- ranking: listado ordenado con top N (usar "limite")
- serie: evolución temporal (agrupar_por "mes", "semana" o "dia")

# Esquema disponible (solo tablas permitidas)
${resumenPlanner()}

# Glosario
${GLOSARIO}

# Reglas de descomposición
1. Una subpregunta = un dato que se obtiene con un SELECT.
   - Varias métricas distintas ("cuántos pedidos y cuánto gastamos") → una subpregunta por métrica.
   - Comparación explícita ("vs", "comparado con", "que la semana pasada") → una subpregunta por cada lado de la comparación.
   - Distribución ("por rubro", "por estado", "por proveedor") → UNA subpregunta con "agrupar_por"; "tipo" es "conteo" si cuenta filas o "suma" si suma montos.
   - Categorías de la misma entidad y métrica ("pendientes y completadas", "aprobados y sin aprobar") → UNA subpregunta con "agrupar_por" (el SQL filtra esas categorías). Una subpregunta por categoría solo si son métricas distintas.
   - Rankings ("los 3 más...", "los que más") → UNA subpregunta tipo "ranking": "limite" = el N pedido, o 5 si no aclara cuántos.
   - Superlativos ("el más caro", "la última factura", "el mayor", "el más reciente") → UNA subpregunta tipo "ranking" con "limite": 1.
   - Si hay "limite", el "tipo" SIEMPRE es "ranking" (nunca "listado").
   - Evolución ("por mes", "últimos 6 meses") → UNA subpregunta tipo "serie".
2. Si el usuario nombra una categoría concreta ("en albañilería", "de Hierros San Martín") es un FILTRO dentro de la descripción, NO un "agrupar_por".
3. Períodos: usá el calendario del mensaje del usuario.
   - Períodos en curso ("esta semana", "este mes", "este año") → rango completo del período (lunes a domingo, día 1 al último del mes), aunque incluya días futuros.
   - "hoy" → hoy a hoy. Períodos terminados ("ayer", "la semana pasada", "el mes pasado") → rango completo del período.
   - "últimos N días" → desde HOY - (N-1) hasta HOY. "últimas N semanas" → desde el lunes de la semana N-1 atrás hasta HOY. "últimos N meses" → desde el día 1 del mes que está N-1 meses atrás hasta HOY. (Ej: últimos 30 días con hoy 2026-09-21 → 2026-08-23 a 2026-09-21).
   - Si la pregunta no menciona período → "periodo": null (histórico completo). No inventes períodos.
4. Los nombres propios (rubro, material, proveedor, tarea) se copian tal cual los dijo el usuario, entre comillas, sin inventarlos, traducirlos ni reemplazarlos. La base puede tener variantes (mayúsculas, tildes, nombres más largos): describí la coincidencia como aproximada ("rubro cuyo nombre coincida con 'albañilería'"), nunca como igualdad exacta.
5. Máximo ${MAX_SUBPREGUNTAS} subpreguntas. Si hacen falta más, agrupá las relacionadas o pedí aclaración.
6. Métricas derivadas (ver glosario): incluí las subpreguntas necesarias para calcularlas. Ej: "presupuesto ejecutado vs disponible" → UNA subpregunta "listado" que traiga en una sola fila total, ejecutado y comprometido (el disponible se calcula al narrar).
7. Si falta un dato imprescindible (ej: "cuánto gastamos en el rubro" sin decir cuál) o la pregunta es demasiado ambigua, devolvé "subpreguntas": [] y "necesita_aclaracion" con UNA pregunta corta y concreta.
8. Si pide datos de otra obra o comparar obras → "necesita_aclaracion" aclarando que solo podés responder por la obra activa.
9. Si piden un estado general ("cómo viene la obra"), devolvé un resumen acotado: avance (obras.progress), presupuesto (total, ejecutado, comprometido), tareas por estado, gastos del mes actual y alertas sin resolver. No más de 5 subpreguntas.
10. "tablas_esperadas" solo puede contener tablas de la lista del esquema (2 o 3 como máximo).
11. No inventes valores, IDs, fechas ni resultados. No escribas SQL.

# Ejemplos de forma (los períodos reales salen del calendario de cada consulta)
- "gastos de este mes vs el mes pasado" → 2 subpreguntas "suma" de gastos: una con periodo { "desde": "<primer día del mes actual>", "hasta": "<último día del mes actual>" } y otra con el mes pasado.
- "los 3 materiales más usados" → 1 subpregunta "ranking" con "agrupar_por": "material", "limite": 3, tablas movimientos_stock + materiales.
- "presupuesto ejecutado vs disponible" → 1 subpregunta "listado" que devuelve total, ejecutado y comprometido de presupuestos en una sola fila.
`.trim();
}

export function validarPlan(plan) {
  const errores = [];
  const advertencias = [];

  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return { ok: false, errores: ["La respuesta no es un objeto JSON"], advertencias };
  }

  if (typeof plan.interpretacion !== "string" || !plan.interpretacion.trim()) {
    errores.push("Falta 'interpretacion'");
  }

  const aclaracion = plan.necesita_aclaracion;
  if (aclaracion !== null && aclaracion !== undefined && typeof aclaracion !== "string") {
    errores.push("'necesita_aclaracion' debe ser string o null");
  }

  const subpreguntas = plan.subpreguntas;
  if (!Array.isArray(subpreguntas)) {
    errores.push("'subpreguntas' debe ser un array");
    return { ok: errores.length === 0, errores, advertencias };
  }

  if (subpreguntas.length > MAX_SUBPREGUNTAS) {
    errores.push(`Demasiadas subpreguntas (${subpreguntas.length} > ${MAX_SUBPREGUNTAS})`);
  }
  if (subpreguntas.length === 0 && !(typeof aclaracion === "string" && aclaracion.trim())) {
    errores.push("Sin subpreguntas y sin 'necesita_aclaracion'");
  }

  const ids = new Set();
  const reFecha = /^\d{4}-\d{2}-\d{2}$/;

  subpreguntas.forEach((s, i) => {
    const p = `subpreguntas[${i}]`;
    if (!s || typeof s !== "object") {
      errores.push(`${p}: no es un objeto`);
      return;
    }
    if (typeof s.id !== "string" || !s.id.trim()) errores.push(`${p}.id inválido`);
    else if (ids.has(s.id)) errores.push(`${p}.id duplicado ("${s.id}")`);
    else ids.add(s.id);

    if (typeof s.descripcion !== "string" || !s.descripcion.trim()) {
      errores.push(`${p}.descripcion vacía`);
    } else if (/\b(select|insert|update|delete)\b/i.test(s.descripcion)) {
      advertencias.push(`${p}.descripcion parece contener SQL`);
    }

    if (!TIPOS.includes(s.tipo)) errores.push(`${p}.tipo inválido ("${s.tipo}")`);

    if (s.periodo !== null && s.periodo !== undefined) {
      const { desde, hasta } = s.periodo ?? {};
      if (!reFecha.test(desde ?? "")) errores.push(`${p}.periodo.desde inválido ("${desde}")`);
      if (!reFecha.test(hasta ?? "")) errores.push(`${p}.periodo.hasta inválido ("${hasta}")`);
      if (reFecha.test(desde ?? "") && reFecha.test(hasta ?? "") && desde > hasta) {
        errores.push(`${p}.periodo invertido (${desde} > ${hasta})`);
      }
    }

    if (s.agrupar_por !== null && s.agrupar_por !== undefined && typeof s.agrupar_por !== "string") {
      errores.push(`${p}.agrupar_por debe ser string o null`);
    }
    if (s.limite !== null && s.limite !== undefined && (!Number.isInteger(s.limite) || s.limite < 1)) {
      errores.push(`${p}.limite debe ser entero >= 1 o null`);
    }
    if (s.tipo === "ranking" && !s.limite) advertencias.push(`${p}.tipo ranking sin limite`);

    if (!Array.isArray(s.tablas_esperadas) || s.tablas_esperadas.length === 0) {
      errores.push(`${p}.tablas_esperadas vacío`);
    } else {
      for (const tabla of s.tablas_esperadas) {
        if (!TABLAS_PERMITIDAS.includes(tabla)) {
          errores.push(`${p}.tablas_esperadas: tabla desconocida "${tabla}"`);
        }
      }
    }
  });

  return { ok: errores.length === 0, errores, advertencias };
}

export async function planificar(pregunta, { obra = null, hoy = hoyISO() } = {}) {
  const sistema = construirSystemPrompt();
  const fechas = contextoFechas(hoy);
  const calendario =
    `Hoy es ${descripcionHumanaFecha(hoy)} (${hoy}), zona ${ZONA}. La semana va de lunes a domingo.\n` +
    `- Esta semana: ${fechas.lunesSemanaActual} a ${fechas.domingoSemanaActual}\n` +
    `- Semana pasada: ${fechas.lunesSemanaPasada} a ${fechas.domingoSemanaPasada}\n` +
    `- Este mes: ${fechas.primerDiaMesActual} a ${fechas.ultimoDiaMesActual}\n` +
    `- Mes pasado: ${fechas.primerDiaMesPasado} a ${fechas.ultimoDiaMesPasado}\n` +
    `- Ayer: ${fechas.ayer}`;

  const obraTexto = obra ? `\nObra activa: "${obra}"` : "";
  const mensaje = `${calendario}${obraTexto}\n\nPregunta del usuario: "${pregunta}"`;

  const primera = await completarJSON({ system: sistema, user: mensaje });
  let validacion = validarPlan(primera.datos);
  let usageTotal = primera.usage?.total_tokens ?? 0;

  if (!validacion.ok) {
    const correccion =
      `\n\nTu respuesta JSON anterior fue rechazada por estos motivos:\n` +
      validacion.errores.map((e) => `- ${e}`).join("\n") +
      `\nDevolvé el JSON corregido completo, respetando la forma indicada.`;
    const segunda = await completarJSON({ system: sistema, user: mensaje + correccion });
    usageTotal += segunda.usage?.total_tokens ?? 0;
    validacion = validarPlan(segunda.datos);
    if (!validacion.ok) {
      const error = new Error("El planner devolvió un plan inválido tras el reintento");
      error.errores = validacion.errores;
      error.plan = segunda.datos;
      throw error;
    }
    return { plan: segunda.datos, validacion, usage: usageTotal, reintento: true };
  }

  return { plan: primera.datos, validacion, usage: usageTotal, reintento: false };
}
