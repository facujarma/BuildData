import Groq from "groq-sdk";
import { buildEndpointDescription, buildEndpointIndex } from "./endpointSchema";
import type { ApiCall } from "../handlers/pendingQuery.store";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const ENDPOINTS_DESC = buildEndpointDescription();

const SYSTEM_PROMPT = `
Sos un asistente que convierte mensajes de WhatsApp de obreros de la construcción en llamadas a una API REST.

Respondé ÚNICAMENTE con el JSON, sin explicaciones, sin markdown, sin backticks.

Formato:
{
  "endpoint": "/bot/...",
  "method": "POST",
  "data": { "campo": valor, ... },
  "comment": "explicación en español de lo que vas a hacer",
  "confianza": 0.95
}

Tenes que darme un array obligatoriamente, es posible que solo uses un endpoint pero igualmente es necesario que devuelvas un array. Por este mismo motivo tambien podes llamar a mas de un endpoint en la misma respuesta, si es necesario.  
Endpoints disponibles:

${ENDPOINTS_DESC}

Reglas:
- Elegí el endpoint que mejor matchee la intención del mensaje
- Los campos que son nombres (materiales, tareas, proveedores) se pasan con el NOMBRE, no el ID
- No incluyas obra_id ni telefono en el JSON, esos se agregan automáticamente después
- Las fechas relativas (ej: "la semana que viene", "el lunes", "para dentro de 2 días") se convierten a formato YYYY-MM-DD usando la fecha de hoy que se te pasa
- Si falta información para un campo requerido, devolvé igualmente la llamada con los datos que tengas (nunca inventes valores): el sistema le repreguntará al usuario lo que falta
- Solo usá {"error": "explicación del motivo"} si el mensaje no se entiende o no expresa ninguna acción concreta
- El comment debe ser amigable y describir la acción, ej: "Voy a registrar el uso de 10 bolsas de cemento"
- "confianza": número entre 0 y 1 que indica qué tan seguro estás de la interpretación (endpoint y datos). Usalo honestamente: 1 si el mensaje es claro, menos si es ambiguo.
`;

export function hoyEnArgentina(): string {
  return new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export async function textToOperation(userMessage: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Hoy es ${hoyEnArgentina()}. Mensaje del obrero: ${userMessage}`,
      },
    ],
  });

  const result = response.choices[0].message.content?.trim() ?? "";
  return result;
}

// ──────────────────────────────────────────
// Resolución de entidades (nombres → IDs)
// ──────────────────────────────────────────

export interface EntidadCandidata {
  id: string;
  nombre: string;
}

export interface EntidadResuelta {
  match_id: string | null;
  confianza: "alta" | "baja" | "ninguna";
  candidatos: EntidadCandidata[];
}

const ENTITY_SYSTEM_PROMPT = `
Sos un sistema de resolución de entidades para un bot de construcción.
Recibís una entidad mencionada por un obrero (un nombre, probablemente escrito de forma imprecisa o abreviada)
y un catálogo de opciones reales con su id.

Tu tarea es decidir cuál opción del catálogo corresponde.
Respondé ÚNICAMENTE con JSON, sin explicaciones, sin markdown, sin backticks:

{
  "match_id": "id de la opción que elijas, o null si ninguna corresponde",
  "confianza": "alta" | "baja" | "ninguna",
  "candidatos": ["máximo 5 opciones plausibles del catálogo: {id, nombre}"]
}

Reglas:
- "alta": hay UNA opción que claramente es la misma entidad (sinónimos, plurales, marcas, versiones, abreviaturas).
- "baja": hay un par de opciones plausibles pero no estás seguro.
- "ninguna": ninguna opción corresponde. match_id = null.
- candidatos: las mejores opciones para mostrarle al usuario cuando la confianza no es alta.
`;

export async function resolveEntity(
  nombre: string,
  tipo: string,
  candidatosCatalogo: EntidadCandidata[],
): Promise<EntidadResuelta> {
  if (candidatosCatalogo.length === 0) {
    return { match_id: null, confianza: "ninguna", candidatos: [] };
  }

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    messages: [
      { role: "system", content: ENTITY_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `Entidad mencionada (${tipo}): "${nombre}"\n` +
          `Catálogo:\n${JSON.stringify(candidatosCatalogo)}`,
      },
    ],
  });

  const raw = response.choices[0].message.content?.trim() ?? "";
  try {
    const parsed = JSON.parse(raw) as EntidadResuelta;
    if (parsed.confianza !== "alta" && parsed.confianza !== "baja" && parsed.confianza !== "ninguna") {
      parsed.confianza = "ninguna";
    }
    parsed.candidatos = Array.isArray(parsed.candidatos)
      ? parsed.candidatos
          .filter((c) => c && typeof c.id === "string")
          .slice(0, 5)
      : [];
    if (parsed.match_id && !candidatosCatalogo.some((c) => c.id === parsed.match_id)) {
      parsed.match_id = null;
    }
    return parsed;
  } catch {
    return { match_id: null, confianza: "ninguna", candidatos: [] };
  }
}

// ──────────────────────────────────────────
// Repregunta: completar una operación con la respuesta del usuario
// ──────────────────────────────────────────

export interface ClarificationTurn {
  originalText: string;
  tipoMensaje: string;
  ops: ApiCall[];
  missing: { opIndex: number; path: string; prompt: string }[];
  history: { question: string; answer: string }[];
  userReply: string;
}

export type CompleteOperationResult =
  | { type: "ops"; ops: ApiCall[] }
  | { type: "needs_clarification"; question: string };

function buildClarificationSystemPrompt(ops: ApiCall[]): string {
  const paths = [...new Set(ops.map((o) => o.endpoint))];
  return `
Sos un asistente que completa llamadas a una API REST conversando con un obrero de la construcción.
Recibís operaciones ya interpretadas (pueden estar incompletas), los campos que faltan y los últimos intercambios.
Respondé ÚNICAMENTE con JSON, sin explicaciones, sin markdown, sin backticks.

Formato (array obligatorio, aunque sea una sola operación):
[
  {
    "endpoint": "/bot/...",
    "method": "POST",
    "data": { "campo": valor, ... },
    "comment": "explicación en español de lo que vas a hacer",
    "confianza": 0.95
  }
]

Si la respuesta del obrero es ambigua, incoherente o no aporta el dato pedido, respondé:
{ "needs_clarification": "pregunta corta y clara para volver a pedir el dato" }

Endpoints (resumen):
${buildEndpointIndex()}

Schema completo de la operación en curso:
${buildEndpointDescription(paths)}

Reglas:
- Las operaciones actuales que recibís ya contienen todo lo interpretado hasta ahora: partí de ellas y agregá o corregí solo lo que aporta la nueva respuesta
- Una sola respuesta puede completar varios campos
- Si el obrero cambia de idea, podés cambiar el endpoint y/o los datos (el resumen de arriba lista todos los endpoints)
- Los campos que son nombres (materiales, tareas, proveedores, rubros) se pasan con el NOMBRE, no con el ID
- No incluyas obra_id ni telefono, esos se agregan automáticamente después
- Las fechas relativas se convierten a formato YYYY-MM-DD usando la fecha de hoy
- Si sigue faltando un campo requerido, omitilo: el sistema volverá a preguntar. No inventes valores
- Nunca respondas {"error"} por falta de datos
`;
}

const GENERIC_RETRY = "No te entendí, ¿me lo podés decir de otra forma?";

function isApiCallLike(value: unknown): value is ApiCall {
  if (!value || typeof value !== "object") return false;
  const call = value as Record<string, unknown>;
  return (
    typeof call.endpoint === "string" &&
    call.data !== null &&
    typeof call.data === "object"
  );
}

export async function completeOperationFromReply(
  turn: ClarificationTurn,
): Promise<CompleteOperationResult> {
  const missingDesc =
    turn.missing.length > 0
      ? turn.missing
          .map((m) => `- [op ${m.opIndex}] ${m.path}: ${m.prompt}`)
          .join("\n")
      : "- (ninguno)";
  const historyDesc =
    turn.history.length > 0
      ? turn.history.map((h) => `P: ${h.question}\nR: ${h.answer}`).join("\n")
      : "(sin intercambios previos)";

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    messages: [
      { role: "system", content: buildClarificationSystemPrompt(turn.ops) },
      {
        role: "user",
        content:
          `Hoy es ${hoyEnArgentina()}.\n` +
          `Mensaje original del obrero (${turn.tipoMensaje}): "${turn.originalText}"\n\n` +
          `Operaciones actuales:\n${JSON.stringify(turn.ops)}\n\n` +
          `Campos faltantes:\n${missingDesc}\n\n` +
          `Últimos intercambios:\n${historyDesc}\n\n` +
          `Nuevo mensaje del obrero: "${turn.userReply}"`,
      },
    ],
  });

  if (response.usage) {
    console.log(
      `[clarification] tokens prompt=${response.usage.prompt_tokens} completion=${response.usage.completion_tokens}`,
    );
  }

  const raw = response.choices[0].message.content?.trim() ?? "";

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.needs_clarification === "string" && obj.needs_clarification.trim()) {
        return { type: "needs_clarification", question: obj.needs_clarification.trim() };
      }
      if (typeof obj.error === "string" && obj.error.trim()) {
        return {
          type: "needs_clarification",
          question: `No te entendí: ${obj.error.trim()}. ¿Me lo decís de otra forma?`,
        };
      }
    }

    const list = Array.isArray(parsed) ? parsed : [parsed];
    const ops = list.filter(isApiCallLike);
    if (ops.length === 0) {
      return { type: "needs_clarification", question: GENERIC_RETRY };
    }

    for (const op of ops) {
      if (typeof op.confianza === "number") {
        op.confianza = Math.min(1, Math.max(0, op.confianza));
      } else {
        delete op.confianza;
      }
    }

    return { type: "ops", ops };
  } catch {
    return { type: "needs_clarification", question: GENERIC_RETRY };
  }
}
