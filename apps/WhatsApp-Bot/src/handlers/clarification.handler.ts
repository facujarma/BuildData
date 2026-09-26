import { completeOperationFromReply } from "../services/llm.service";
import {
  collectMissingFields,
  formatMissingQuestion,
  MissingField,
} from "../services/endpointSchema";
import {
  parseSimpleAnswer,
  applySimpleAnswer,
} from "../services/answerParser.service";
import {
  getClarification,
  setClarification,
  clearClarification,
  Clarification,
  ApiCall,
} from "./pendingQuery.store";
import { getClient } from "../client";
import { sendOperationConfirmation } from "../services/pollConfirmation.service";

const MAX_ATTEMPTS = 3;
const GENERIC_RETRY = "🤔 No te entendí, ¿me lo podés decir de otra forma?";
const RECENT_TURNS = 2;

// Emoji según el tipo de dato que se está pidiendo, para que la pregunta se vea más clara.
function emojiCampo(type: MissingField["type"]): string {
  switch (type) {
    case "number":
      return "🔢";
    case "boolean":
      return "✅";
    case "array":
      return "📋";
    default:
      return "✏️";
  }
}

async function ask(
  phone: string,
  chatId: string,
  state: Clarification,
  question: string,
  fieldPath: string | null,
  examples?: string[],
): Promise<void> {
  state.pendingQuestion = question;
  state.pendingFieldPath = fieldPath;
  setClarification(phone, state);

  let text = question;
  if (state.attempts >= MAX_ATTEMPTS) {
    if (examples && examples.length > 0) {
      text += `\n\n💡 Por ejemplo: ${examples.map((e) => `_"${e}"_`).join(" o ")}`;
    }
    text += "\n\n_Si no sabés, respondé *!cancel* y lo dejamos para después._";
  }

  await getClient().sendMessage(chatId, text);
}

function buildContenido(state: Clarification): string {
  const qa = state.history
    .filter((h) => h.answer.trim() !== "")
    .map((h) => `P: ${h.question}\nR: ${h.answer}`)
    .join("\n");

  return qa ? `${state.originalText}\n\n${qa}` : state.originalText;
}

function recalcMissing(ops: ApiCall[]): MissingField[] {
  const missing: MissingField[] = [];
  for (let i = 0; i < ops.length; i++) {
    missing.push(...collectMissingFields(ops[i].endpoint, ops[i].data, i));
  }
  return missing;
}

async function concludeTurn(
  phone: string,
  chatId: string,
  state: Clarification,
): Promise<void> {
  const missing = recalcMissing(state.ops);
  state.attempts =
    missing.length < state.missing.length ? 0 : state.attempts + 1;
  state.missing = missing;

  if (missing.length === 0) {
    const contenido = buildContenido(state);
    clearClarification(phone);
    await sendOperationConfirmation(
      phone,
      chatId,
      state.ops,
      contenido,
      state.tipoMensaje,
    );
    return;
  }

  const next = missing[0];
  await ask(
    phone,
    chatId,
    state,
    `${emojiCampo(next.type)} ${formatMissingQuestion(next)}`,
    next.path,
    next.examples,
  );
}

function tryDeterministicAnswer(state: Clarification, reply: string): boolean {
  if (!state.pendingFieldPath) return false;

  const field = state.missing.find((m) => m.path === state.pendingFieldPath);
  if (!field) return false;

  const parsed = parseSimpleAnswer(field, reply);
  if (!parsed.ok) return false;

  const op = state.ops[field.opIndex];
  if (!op) return false;

  return applySimpleAnswer(op, field, parsed.value);
}

export async function handleClarificationReply(
  phone: string,
  body: string,
  chatId: string,
): Promise<boolean> {
  const state = getClarification(phone);
  if (!state) return false;

  const userReply = body.trim();
  if (!userReply) return true;

  if (state.pendingQuestion) {
    state.history.push({ question: state.pendingQuestion, answer: userReply });
  }

  if (tryDeterministicAnswer(state, userReply)) {
    await concludeTurn(phone, chatId, state);
    return true;
  }

  const result = await completeOperationFromReply({
    originalText: state.originalText,
    tipoMensaje: state.tipoMensaje,
    ops: state.ops,
    missing: state.missing.map(({ opIndex, path, prompt }) => ({
      opIndex,
      path,
      prompt,
    })),
    history: state.history.slice(0, -1).slice(-RECENT_TURNS),
    userReply,
  });

  if (result.type === "needs_clarification") {
    state.attempts += 1;
    await ask(
      phone,
      chatId,
      state,
      result.question || GENERIC_RETRY,
      null,
    );
    return true;
  }

  state.ops = result.ops;
  await concludeTurn(phone, chatId, state);
  return true;
}
