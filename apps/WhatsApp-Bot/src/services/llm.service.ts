import Groq from "groq-sdk";
import { buildEndpointDescription } from "./endpointSchema";

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
  "comment": "explicación en español de lo que vas a hacer"
}

Tenes que darme un array obligatoriamente, es posible que solo uses un endpoint pero igualmente es necesario que devuelvas un array. Por este mismo motivo tambien podes llamar a mas de un endpoint en la misma respuesta, si es necesario.  
Endpoints disponibles:

${ENDPOINTS_DESC}

Reglas:
- Elegí el endpoint que mejor matchee la intención del mensaje
- Los campos que son nombres (materiales, tareas, proveedores) se pasan con el NOMBRE, no el ID
- No incluyas obra_id ni telefono en el JSON, esos se agregan automáticamente después
- Las fechas relativas (ej: "la semana que viene", "el lunes", "para dentro de 2 días") se convierten a formato YYYY-MM-DD usando la fecha de hoy que se te pasa
- Si el usuario no da suficiente información para un campo requerido, responded: {"error": "explicación del motivo"}
- El comment debe ser amigable y describir la acción, ej: "Voy a registrar el uso de 10 bolsas de cemento"
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
