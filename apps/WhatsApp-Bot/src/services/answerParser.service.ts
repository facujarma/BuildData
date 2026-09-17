import type { MissingField } from "./endpointSchema";
import type { ApiCall } from "../handlers/pendingQuery.store";

export interface ParsedAnswer {
  ok: boolean;
  value?: unknown;
}

const AFFIRMATIVE = /^(s[ií]|dale|ok|oka|correcto|afirmativo|claro|yes)$/i;
const NEGATIVE = /^(no|nunca|negativo)$/i;
const EVASIVE =
  /^(no|nunca|s[ií]|dale|ok|nada|ninguno|ninguna|no s[eé]|ni idea|no me acuerdo|no tengo|todav[ií]a no|despu[eé]s|cancelar|cancel[aá]|!cancel)$/i;

function parseNumber(text: string): number | null {
  const cleaned = text.replace(/\s/g, "");
  if (!/^-?\d[\d.,]*$/.test(cleaned)) return null;

  let normalized = cleaned;
  if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "");
  } else if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isNaN(value) ? null : value;
}

// Respuestas que se pueden interpretar sin LLM: número, booleano o una sola
// palabra. Cualquier otra cosa (frases, evasivas, arrays) va al merge con LLM.
export function parseSimpleAnswer(field: MissingField, reply: string): ParsedAnswer {
  const text = reply.trim();
  if (!text || text.startsWith("!")) return { ok: false };

  if (field.type === "boolean") {
    if (AFFIRMATIVE.test(text)) return { ok: true, value: true };
    if (NEGATIVE.test(text)) return { ok: true, value: false };
    return { ok: false };
  }

  if (EVASIVE.test(text)) return { ok: false };

  if (field.type === "number") {
    const value = parseNumber(text);
    return value === null ? { ok: false } : { ok: true, value };
  }

  if (field.type === "string") {
    if (text.length > 40 || /\s/.test(text)) return { ok: false };
    return { ok: true, value: text };
  }

  return { ok: false };
}

export function applySimpleAnswer(
  op: ApiCall,
  field: MissingField,
  value: unknown,
): boolean {
  const data = op.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") return false;

  if (field.dataKey) {
    const container = data[field.dataKey];
    if (!Array.isArray(container)) return false;
    const item = container[field.itemIndex];
    if (!item || typeof item !== "object") return false;
    (item as Record<string, unknown>)[field.name] = value;
    return true;
  }

  data[field.name] = value;
  return true;
}
