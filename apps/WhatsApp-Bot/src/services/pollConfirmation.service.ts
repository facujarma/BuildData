import { Message, Poll } from "whatsapp-web.js";
import { getClient } from "../client";
import { getUserObras } from "./user.service";
import {
  setPending,
  clearPending,
  getPending,
  setEntityPending,
  clearEntityPending,
  getEntityPending,
  PendingQuery,
} from "../handlers/pendingQuery.store";
import { callEndpoint, getCatalogo, registrarMensaje } from "./api.service";
import { MSG } from "../shared/responses";
import { Obra } from "../types/api.types";
import {
  resolveOperationEntities,
  EntityQuestion,
  applyQuestionAnswer,
  EntityKind,
  neededCatalogTipos,
} from "./entityResolution.service";
import { getUserPhoneFields } from "./endpointSchema";
import { interpolatePathParams } from "./pathParams.service";

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
        const payload: Record<string, unknown> = {
          ...data,
          obra_id: pending.obra_id,
          telefono: phone,
          mensaje_id: pending.mensaje_id,
        };
        for (const userPhoneField of getUserPhoneFields(endpoint)) {
          if (payload[userPhoneField] == null) payload[userPhoneField] = phone;
        }
        const { path, body } = interpolatePathParams(endpoint, payload);
        console.log(`[executePending] → ${method} ${path} para ${tag}`);
        console.log(`[executePending] payload: ${JSON.stringify(body)}`);
        try {
          const result = await callEndpoint(method, path, body);
          console.log(`[executePending] respuesta: ${JSON.stringify(result)}`);
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

function entityKindLabel(kind: EntityKind): string {
  switch (kind) {
    case "material":
      return "material";
    case "proveedor":
      return "proveedor";
    case "rubro":
      return "rubro";
    case "tarea":
      return "tarea";
  }
}

function entityKindPlural(kind: EntityKind): string {
  switch (kind) {
    case "material":
      return "materiales";
    case "proveedor":
      return "proveedores";
    case "rubro":
      return "rubros";
    case "tarea":
      return "tareas";
  }
}

async function sendEntityQuestion(chatId: string, question: EntityQuestion): Promise<void> {
  const client = getClient();

  if (question.options.length === 0) {
    await client.sendMessage(
      chatId,
      [
        `🤔 No encontré "*${question.entity}*" entre los *${entityKindPlural(question.kind)}* cargados en la obra.`,
        "",
        `Respondé *0* para cancelar la operación.`,
      ].join("\n"),
    );
    return;
  }

  const lista = question.options
    .map((o, i) => `*${i + 1}.* ${o.nombre}`)
    .join("\n");

  await client.sendMessage(
    chatId,
    [
      `🤔 No estoy seguro de qué ${entityKindLabel(question.kind)} es "*${question.entity}*". Elegí uno:`,
      "",
      lista,
      "",
      `*${question.options.length + 1}.* Ninguno de estos`,
      `*0.* ❌ Cancelar`,
      "",
      "Respondé con el número.",
    ].join("\n"),
  );
}

/**
 * Flujo completo de ejecución tras elegir la obra:
 * 1) registra el mensaje crudo (POST /bot/mensaje) → mensaje_id
 * 2) pide el catálogo y resuelve nombres → IDs (LLM + auto-creación)
 * 3) si algo queda dudoso → encuesta al usuario (y queda en pausa)
 * 4) si todo resuelto → executePending real → mensaje de éxito
 */
async function prepareAndExecute(pending: PendingQuery, obra: Obra, phone: string, chatId: string): Promise<void> {
  pending.obra_id = obra.obra_id;
  const client = getClient();

  if (!pending.mensaje_id && pending.contenido) {
    try {
      const msg = await registrarMensaje({
        obra_id: obra.obra_id,
        telefono: phone,
        tipo: pending.tipo_mensaje || "texto",
        contenido: pending.contenido,
      });
      pending.mensaje_id = msg.id;
    } catch (error) {
      console.error("[prepareAndExecute] no se pudo registrar el mensaje:", error);
    }
  }

  if (pending.type === "operation") {
    try {
      // Se pide el catálogo solo de las entidades que resuelven los endpoints de esta
      // operación (pedidos → materiales/proveedores, tareas → tareas/rubros, etc).
      // Endpoint sin mapear (todavía sin pulir) → catálogo completo, como antes.
      const tipos = neededCatalogTipos(pending.operation);
      const catalogo =
        tipos === null
          ? await getCatalogo(obra.obra_id)
          : tipos.length > 0
            ? await getCatalogo(obra.obra_id, tipos)
            : null;
      if (catalogo) {
        for (let i = 0; i < pending.operation.length; i++) {
          const question = await resolveOperationEntities(pending.operation[i], catalogo, obra.obra_id, i);
          if (question) {
            setEntityPending(phone, { pending, obra, chatId, question });
            await sendEntityQuestion(chatId, question);
            return;
          }
        }
      }
    } catch (error) {
      console.error("[prepareAndExecute] falló la resolución de entidades:", error);
    }
  }

  clearEntityPending(phone);
  clearPending(phone);
  try {
    await executePending(pending, obra.obra_nombre, phone);
    await client.sendMessage(chatId, MSG.SUCCESS_DATA_SAVED);
  } catch (error) {
    console.error("[prepareAndExecute] error ejecutando:", error);
    await client.sendMessage(chatId, "❌ Ocurrió un error al ejecutar la operación. Intentá de nuevo.");
  }
}

export async function handleEntityTextReply(phone: string, raw: string, chatId: string): Promise<boolean> {
  const state = getEntityPending(phone);
  if (!state) return false;

  const selectedIndex = parseInt(raw.trim(), 10);
  if (isNaN(selectedIndex)) return false;

  const client = getClient();

  if (selectedIndex === 0) {
    clearEntityPending(phone);
    clearPending(phone);
    await client.sendMessage(chatId, MSG.SUCCESS_DATA_CANCELLED);
    return true;
  }

  const { pending, obra, question } = state;
  const n = question.options.length;
  if (selectedIndex < 1 || selectedIndex > n + 1) {
    await client.sendMessage(chatId, "❌ Esa opción no existe. Escribí un número de la lista o *0* para cancelar.");
    return true;
  }
  if (n === 0) {
    await client.sendMessage(chatId, "❌ No hay opciones para elegir. Escribí *0* para cancelar.");
    return true;
  }

  const option = selectedIndex <= n ? question.options[selectedIndex - 1] : null;

  clearEntityPending(phone);

  // Para tareas, "Ninguno de estos" cancela la operación: sin tarea válida no hay nada que completar.
  if (option === null && question.kind === "tarea") {
    clearPending(phone);
    await client.sendMessage(chatId, MSG.SUCCESS_DATA_CANCELLED);
    return true;
  }

  await applyQuestionAnswer(pending, question, option, obra.obra_id);
  await prepareAndExecute(pending, obra, phone, chatId);
  return true;
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
    await prepareAndExecute(pending, obra, voterPhone, chatId);
    await pollMessage.delete(true);
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
  await prepareAndExecute(pending, obra, phone, chatId);
  return true;
}
