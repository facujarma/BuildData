import { Message } from "whatsapp-web.js";
import { textToOperation } from "../services/llm.service";
import {
  clearPending,
  hasPending,
  clearEntityPending,
  hasEntityPending,
  hasClarification,
  setClarification,
  ApiCall,
  Clarification,
} from "./pendingQuery.store";
import {
  collectMissingFields,
  formatMissingQuestion,
  MissingField,
} from "../services/endpointSchema";
import { clamp01 } from "../services/actionExecuted.service";
import { sendOperationConfirmation } from "../services/pollConfirmation.service";
import { handleClarificationReply } from "./clarification.handler";
import { MSG, MSG_LLM_ERROR } from "../shared/responses";

export async function handleFreeText(
  phone: string,
  message: Message,
  tipoMensaje: string = "texto",
): Promise<void> {
  try {
    if (hasClarification(phone)) {
      await handleClarificationReply(phone, message.body, message.from);
      return;
    }

    if (hasPending(phone) || hasEntityPending(phone)) {
      clearPending(phone);
      clearEntityPending(phone);
      await message.reply(MSG.ERROR_PENDING_CANCELLED);
    }

    const raw = await textToOperation(message.body.trim());

    let parsed: ApiCall[];
    try {
      parsed = JSON.parse(raw) as ApiCall[];
    } catch {
      await message.reply(MSG.ERROR_PARSE_FAILED);
      return;
    }

    if (!Array.isArray(parsed)) {
      await message.reply(MSG.ERROR_PARSE_FAILED);
      return;
    }

    const calls: ApiCall[] = [];
    const invalidDetails: string[] = [];

    for (const call of parsed) {
      if (call.error) {
        invalidDetails.push(MSG_LLM_ERROR(call.error));
        continue;
      }

      if (!call.endpoint || !call.data) {
        invalidDetails.push(MSG.ERROR_OPERATION_INCOMPLETE);
        continue;
      }

      if (typeof call.confianza === "number") {
        call.confianza = clamp01(call.confianza);
      } else {
        delete call.confianza;
      }

      calls.push(call);
    }

    if (calls.length === 0) {
      for (const detail of invalidDetails) {
        await message.reply(detail);
      }
      return;
    }

    const missing: MissingField[] = [];
    for (let i = 0; i < calls.length; i++) {
      missing.push(...collectMissingFields(calls[i].endpoint, calls[i].data, i));
    }

    if (missing.length > 0) {
      const question = formatMissingQuestion(missing[0]);
      const state: Clarification = {
        ops: calls,
        originalText: message.body.trim(),
        tipoMensaje,
        missing,
        history: [],
        pendingQuestion: question,
        pendingFieldPath: missing[0].path,
        attempts: 0,
        createdAt: Date.now(),
      };
      setClarification(phone, state);

      const comment = calls[0].comment ? `Ok! ${calls[0].comment}\n\n` : "";
      await message.reply(
        `${comment}${question}\n\n_Respondé *!cancel* para cancelar._`,
      );

      for (const detail of invalidDetails) {
        await message.reply(detail);
      }
      return;
    }

    await sendOperationConfirmation(
      phone,
      message.from,
      calls,
      message.body.trim(),
      tipoMensaje,
    );

    if (invalidDetails.length > 0) {
      await message.reply(
        `⚠️ Estas acciones no las pude procesar:\n\n${invalidDetails.join("\n")}`,
      );
    }

  } catch (error) {
    console.error("Error al procesar texto:", error);
    await message.reply(MSG.ERROR_PROCESSING);
  }
}
