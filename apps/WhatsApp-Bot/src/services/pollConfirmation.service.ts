import { Message, Poll } from "whatsapp-web.js";
import { getClient } from "../client";
import { getUserObras } from "./user.service";
import {
  setPending,
  clearPending,
  getPending,
  PendingQuery,
} from "../handlers/pendingQuery.store";
import { callEndpoint } from "./api.service";
import { MSG } from "../shared/responses";

// Los montos de vision.service.ts llegan en formato argentino ("$1.234,56") — hay que
// convertirlos a number antes de mandarlos a /bot/gastos, que espera monto: number.
function parseMontoArg(raw: string): number {
  const normalized = raw.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

async function executePending(pending: PendingQuery, obraNombre: string, phone: string): Promise<void> {
  const tag = `obra "${obraNombre}"`;
  switch (pending.type) {
    case "operation": {
      for (const op of pending.operation) {
        const { endpoint, method, data } = op;
        const payload = {
          ...data,
          obra_id: pending.obra_id,
        };
        console.log(`[executePending] → ${method} ${endpoint} para ${tag}`);
        console.log(`[executePending] payload: ${JSON.stringify(payload)}`);
        try {
          //const result = await callEndpoint(method, endpoint, payload);
          //console.log(`[executePending] respuesta: ${JSON.stringify(result)}`);
        } catch (error) {
          console.error(`[executePending] error llamando ${endpoint}:`, error);
          throw error;
        }
      }
      break;
    }
    case "comprobante": {
      const d = pending.data;
      const payload = {
        obra_id: pending.obra_id,
        telefono: phone,
        monto: parseMontoArg(d.monto),
        moneda: d.moneda || "ARS",
        descripcion: `${d.entidad} - ${d.tipo}`,
        origen: "bot_imagen",
        comprobante_detalle: d,
      };
      console.log(`[executePending] → POST /bot/gastos (comprobante) para ${tag}`);
      const result = await callEndpoint("POST", "/bot/gastos", payload);
      console.log(`[executePending] respuesta: ${JSON.stringify(result)}`);
      break;
    }
    case "factura": {
      const d = pending.data;
      const payload = {
        obra_id: pending.obra_id,
        telefono: phone,
        monto: parseMontoArg(d.total),
        moneda: "ARS",
        descripcion: `Factura ${d.tipoFactura} ${d.numero} de ${d.emisor}`,
        origen: "bot_imagen",
        comprobante_detalle: d,
      };
      console.log(`[executePending] → POST /bot/gastos (factura) para ${tag}`);
      const result = await callEndpoint("POST", "/bot/gastos", payload);
      console.log(`[executePending] respuesta: ${JSON.stringify(result)}`);
      break;
    }
  }
}

export async function sendObraPoll(
  phone: string,
  chatId: string,
  pendingQuery: PendingQuery,
): Promise<void> {
  const user = await getUserObras(phone);
  const client = getClient();
  if (!user || user.obras.length === 0) {
    await client.sendMessage(chatId, MSG.ERROR_NO_OBRA);
    return;
  }

  /*if (user.obras.length === 1) {
    const obra = user.obras[0];
    pendingQuery.obra_id = obra.obra_id;
    executePending(pendingQuery, obra.obra_nombre);
    clearPending(phone);
    await client.sendMessage(chatId,
      `✅ Confirmado automáticamente para la obra *${obra.obra_nombre}*.`,
    );
    return;
  }*/

  setPending(phone, pendingQuery);

  const options = user.obras.map((o) => o.obra_nombre);
  options.push("❌ Cancelar");

  const poll = new Poll("¿En qué obra?", options, {
    allowMultipleAnswers: false,
    messageSecret: undefined,
  });
  await client.sendMessage(chatId, poll);
}

export async function handlePollVote(
  voterPhone: string,
  selectedOptionName: string,
  pollMessage: Message,
): Promise<void> {
  try {
    console.log(`[handlePollVote] Voto de ${voterPhone}: "${selectedOptionName}"`);
    const pending = getPending(voterPhone);
    const client = getClient();

    if (!pending) {
      console.log(`[handlePollVote] Sin pendiente para ${voterPhone}, borrando poll`);
      await pollMessage.delete(true);
      return;
    }

    const chatId = pollMessage.id.remote;
    console.log(`[handlePollVote] chatId: ${chatId}`);

    if (selectedOptionName === "❌ Cancelar") {
      clearPending(voterPhone);
      await pollMessage.delete(true);
      await client.sendMessage(chatId, MSG.SUCCESS_DATA_CANCELLED);
      return;
    }

    const user = await getUserObras(voterPhone);
    if (!user) {
      clearPending(voterPhone);
      await pollMessage.delete(true);
      await client.sendMessage(chatId, MSG.ERROR_NO_OBRA);
      return;
    }

    const obra = user.obras.find((o) => o.obra_nombre === selectedOptionName);
    if (!obra) {
      await client.sendMessage(chatId, "❌ No encontré esa obra. Intenta de nuevo.");
      return;
    }

    pending.obra_id = obra.obra_id;
    clearPending(voterPhone);
    await executePending(pending, obra.obra_nombre, voterPhone);
    await pollMessage.delete(true);
    await client.sendMessage(chatId, MSG.SUCCESS_DATA_SAVED);
  } catch (error) {
    console.error("[handlePollVote] Error:", error);
    try {
      const client = getClient();
      const chatId = pollMessage.id?.remote;
      if (chatId) {
        await client.sendMessage(chatId, "❌ Ocurrió un error al ejecutar la operación. Intentá de nuevo.");
      }
    } catch {}
  }
}

export async function sendObraConfirmationText(
  phone: string,
  chatId: string,
  pendingQuery: PendingQuery,
): Promise<void> {
  const user = await getUserObras(phone);
  const client = getClient();
  if (!user || user.obras.length === 0) {
    await client.sendMessage(chatId, MSG.ERROR_NO_OBRA);
    return;
  }

  setPending(phone, pendingQuery);

  const lista = user.obras
    .map((o, i) => `*${i + 1}.* ${o.obra_nombre}`)
    .join("\n");

  await client.sendMessage(
    chatId,
    `¿En qué obra?\n\n${lista}\n\n*0.* ❌ Cancelar\n\nRespondé con el número.`,
  );
}

export async function handleObraTextReply(
  phone: string,
  selectedIndexRaw: string,
  chatId: string,
): Promise<boolean> {
  const pending = getPending(phone);
  if (!pending) return false;

  const selectedIndex = parseInt(selectedIndexRaw.trim(), 10);
  if (isNaN(selectedIndex)) return false;

  const client = getClient();

  if (selectedIndex === 0) {
    clearPending(phone);
    await client.sendMessage(chatId, MSG.SUCCESS_DATA_CANCELLED);
    return true;
  }

  const user = await getUserObras(phone);
  if (!user) {
    clearPending(phone);
    await client.sendMessage(chatId, MSG.ERROR_NO_OBRA);
    return true;
  }

  const obra = user.obras[selectedIndex - 1];
  if (!obra) {
    await client.sendMessage(chatId, "❌ No encontré esa opción. Intenta de nuevo.");
    return true;
  }

  pending.obra_id = obra.obra_id;
  clearPending(phone);
  try {
    await executePending(pending, obra.obra_nombre, phone);
    await client.sendMessage(chatId, MSG.SUCCESS_DATA_SAVED);
  } catch (error) {
    await client.sendMessage(chatId, "❌ Ocurrió un error al ejecutar la operación. Intentá de nuevo.");
  }
  return true;
}
