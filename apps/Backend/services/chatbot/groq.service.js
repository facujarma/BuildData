import Groq from "groq-sdk";

// Cliente Groq compartido del ChatBot AI. El WhatsApp-Bot usa su propio llm.service.ts.
// gpt-oss-120b es un modelo con razonamiento: hay que darle max_tokens holgado o el
// contenido vuelve vacío (los tokens se consumen en "reasoning").

export const MODELO_DEFAULT = "openai/gpt-oss-120b";

let cliente = null;

function getCliente() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY no configurada en el Backend");
  }
  if (!cliente) {
    cliente = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return cliente;
}

export async function completarJSON({
  system,
  user,
  modelo = MODELO_DEFAULT,
  maxTokens = 4000,
  reasoningEffort = "low",
}) {
  const respuesta = await getCliente().chat.completions.create({
    model: modelo,
    temperature: 0,
    max_tokens: maxTokens,
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = respuesta.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) {
    throw new Error("El LLM devolvió contenido vacío");
  }

  try {
    return { datos: JSON.parse(raw), usage: respuesta.usage ?? null, raw };
  } catch {
    const error = new Error("El LLM devolvió JSON inválido");
    error.raw = raw;
    throw error;
  }
}
