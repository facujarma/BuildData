import { completarJSON } from "./groq.service.js";

// Fase 3 del ChatBot AI: redactar la respuesta final a partir de los resultados reales.
// Nunca agrega datos que no estén en las filas ejecutadas.

const MAX_FILAS_POR_SUBPREGUNTA = 50;
const MAX_CARACTERES_CONTEXTO = 10000;

function recortar(subpreguntas) {
  const recortadas = subpreguntas.map((s) => ({
    descripcion: s.descripcion,
    tipo: s.tipo,
    periodo: s.periodo ?? null,
    agrupar_por: s.agrupar_por ?? null,
    error: s.error ?? null,
    filas: s.filas ? s.filas.slice(0, MAX_FILAS_POR_SUBPREGUNTA) : null,
    filas_totales: s.filas?.length ?? 0,
  }));
  const texto = JSON.stringify(recortadas);
  if (texto.length <= MAX_CARACTERES_CONTEXTO) return texto;
  return JSON.stringify(recortadas.map((s) => ({ ...s, filas: s.filas?.slice(0, 10) ?? null })));
}

function construirSystemPrompt() {
  return `
Sos el REDACTER de un asistente de datos para BuildData, una app de gestión de obras de construcción.
Recibís la pregunta original de un usuario, el plan de consulta y los resultados reales de cada subpregunta (filas o error).
Redactás la respuesta final en español rioplatense, clara y breve.

Respondé ÚNICAMENTE con JSON: { "respuesta": "..." }

Reglas:
- Usá SOLO los datos recibidos. Nunca inventes, estimes ni completes con conocimiento general.
- Si una subpregunta tiene error, aclaralo en una frase y respondé igual el resto.
- Si una subpregunta no devolvió filas, decí que no hay datos para ese filtro/período (no lo omitas).
- Montos: formato argentino con separador de miles (ej: $ 1.234.567). Porcentajes con un decimal.
- Si hay dos períodos comparados, decí explícitamente si subió, bajó o se mantuvo, con la diferencia porcentual si se puede calcular.
- Si es un ranking, mencioná los ítems (hasta 5) con su valor.
- Si la pregunta pedía una métrica derivada (ej: "disponible"), calculala con los datos y mostrá el resultado.
- Máximo 6 oraciones o una lista corta. Podés usar **negrita** con moderación.
- No menciones SQL, tablas, columnas ni detalles técnicos.
`.trim();
}

export async function narrar({ pregunta, obra = null, interpretacion, subpreguntas }) {
  const contexto = {
    obra,
    interpretacion,
    resultados: JSON.parse(recortar(subpreguntas)),
  };
  const mensaje = `Pregunta original: "${pregunta}"\n\nResultados:\n${JSON.stringify(contexto)}`;
  const { datos, usage } = await completarJSON({
    system: construirSystemPrompt(),
    user: mensaje,
    maxTokens: 1500,
  });

  const respuesta = typeof datos.respuesta === "string" ? datos.respuesta.trim() : "";
  return { respuesta, usage: usage?.total_tokens ?? 0 };
}
