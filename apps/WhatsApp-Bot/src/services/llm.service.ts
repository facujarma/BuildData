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
- Si el mensaje menciona una cantidad de material (ej: "100 metros de cable", "10 bolsas de cemento") y no un monto de dinero, es un movimiento de stock (/bot/stock), aunque diga "gasto" o "gasté". El endpoint /bot/gastos es solo para montos de dinero (pesos, dólares)
- Los campos que son nombres (materiales, tareas, proveedores) se pasan con el NOMBRE, no el ID
- No incluyas obra_id ni telefono en el JSON, esos se agregan automáticamente después
- Las fechas relativas (ej: "la semana que viene", "el lunes", "para dentro de 2 días") se convierten a formato YYYY-MM-DD usando la fecha de hoy que se te pasa
- Si falta información para un campo requerido, devolvé igualmente la llamada con los datos que tengas (nunca inventes valores): el sistema le repreguntará al usuario lo que falta
- Solo usá {"error": "explicación del motivo"} si el mensaje no se entiende o no expresa ninguna acción concreta
- Si el mensaje es una consulta o pregunta (ej: "¿cuánto cemento queda?", "¿cómo viene el cronograma?"), NO armes una operación: devolvé un array con un solo objeto {"error": "No puedo responder consultas. Puedo registrar movimientos y reportes; para ver los datos, entrá a la web."}
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
