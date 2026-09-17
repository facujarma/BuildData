import { completeOperationFromReply } from "../services/llm.service";
import {
  collectMissingFields,
  formatMissingQuestion,
  MissingField,
} from "../services/endpointSchema";
import {
  getClarification,
  setClarification,
  clearClarification,
  Clarification,
} from "./pendingQuery.store";
import { getClient } from "../client";
import { sendOperationConfirmation } from "../services/pollConfirmation.service";

const MAX_ATTEMPTS = 3;

async function ask(
  phone: string,
  chatId: string,
  state: Clarification,
  question: string,
  examples?: string[],
): Promise<void> {
  state.pendingQuestion = question;
  setClarification(phone, state);

  let text = question;
  if (state.attempts >= MAX_ATTEMPTS) {
    if (examples && examples.length > 0) {
      text += `\n\nPor ejemplo: ${examples.map((e) => `_"${e}"_`).join(" o ")}`;
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

  const result = await completeOperationFromReply({
    originalText: state.originalText,
    tipoMensaje: state.tipoMensaje,
    ops: state.ops,
    missing: state.missing.map(({ opIndex, path, prompt }) => ({
      opIndex,
      path,
      prompt,
    })),
    history: state.history,
    userReply,
  });

  if (result.type === "needs_clarification") {
    state.attempts += 1;
    await ask(
      phone,
      chatId,
      state,
      result.question || "No te entendí, ¿me lo podés decir de otra forma?",
    );
    return true;
  }

  const ops = result.ops;
  const missing: MissingField[] = [];
  for (let i = 0; i < ops.length; i++) {
    missing.push(...collectMissingFields(ops[i].endpoint, ops[i].data, i));
  }

  state.attempts = missing.length < state.missing.length ? 0 : state.attempts + 1;
  state.ops = ops;
  state.missing = missing;

  if (missing.length === 0) {
    const contenido = buildContenido(state);
    clearClarification(phone);
    await sendOperationConfirmation(
      phone,
      chatId,
      ops,
      contenido,
      state.tipoMensaje,
    );
    return true;
  }

  const next = missing[0];
  await ask(phone, chatId, state, formatMissingQuestion(next), next.examples);
  return true;
}
