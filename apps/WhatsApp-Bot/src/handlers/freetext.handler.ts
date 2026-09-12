import { Message } from "whatsapp-web.js";
import { textToOperation } from "../services/llm.service";
import {
  clearPending,
  hasPending,
  clearEntityPending,
  hasEntityPending,
  ApiCall,
} from "./pendingQuery.store";
import { validateApiCall } from "../services/endpointSchema";
import { sendObraConfirmationText } from "../services/pollConfirmation.service";
import { MSG, MSG_LLM_ERROR } from "../shared/responses";

export async function handleFreeText(phone: string, message: Message): Promise<void> {
  try {
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

    const validCalls: ApiCall[] = [];
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

      const validation = validateApiCall(call.endpoint, call.data);
      if (!validation.valid) {
        invalidDetails.push(`❌ Me falta información: ${validation.missingRequired.join(", ")}. ¿Podés darme más detalles?`);
        continue;
      }

      validCalls.push(call);
    }

    if (validCalls.length === 0) {
      for (const detail of invalidDetails) {
        await message.reply(detail);
      }
      return;
    }

    const primaryComment = validCalls[0].comment || "Estoy procesando tu solicitud...";
    const extra =
      validCalls.length > 1 ? ` Voy a hacer ${validCalls.length} pedidos en total.` : "";
    await message.reply(`Ok! ${primaryComment}${extra}`);

    await sendObraConfirmationText(phone, message.from, {
      type: "operation",
      operation: validCalls,
      contenido: message.body.trim(),
      tipo_mensaje: "texto",
    });

    if (invalidDetails.length > 0) {
      await message.reply(
        `⚠️ Estas acciones quedaron pendientes porque les falta información:\n\n${invalidDetails.join("\n")}`,
      );
    }

  } catch (error) {
    console.error("Error al procesar texto:", error);
    await message.reply(MSG.ERROR_PROCESSING);
  }
}