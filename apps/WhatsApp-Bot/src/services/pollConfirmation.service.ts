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
  ApiCall,
} from "../handlers/pendingQuery.store";
import {
  registrarMensaje,
  registrarOperaciones,
  OperacionParaRegistrar,
  OperacionRegistrada,
} from "./api.service";
import {
  buildComprobanteMetadata,
  buildFacturaMetadata,
  buildOperationMetadata,
} from "./operationMetadata.service";
import { MSG } from "../shared/responses";
import { emojiNumero, listaNumerada } from "../shared/format";
import { Obra } from "../types/api.types";
import {
  resolveOperationEntities,
  EntityQuestion,
  applyQuestionAnswer,
  EntityKind,
} from "./entityResolution.service";
import { getUserPhoneFields } from "./endpointSchema";

// Los montos de vision.service.ts llegan en formato argentino ("$1.234,56") — hay que
// convertirlos a number antes de mandarlos a /bot/gastos, que espera monto: number.
function parseMontoArg(raw: string): number {
  const normalized = raw.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

// Arma el lote de operaciones del mensaje y lo registra en el Backend. El
// Backend decide: ejecuta al toque (tareas u obra con aprobacion_automatica) o
// deja la operación pendiente de aprobación en la bandeja. No se manda
// `mensaje_id` en el payload para que los endpoints de negocio no pisen el
// estado del mensaje (lo administra el servicio de operaciones).
async function registrarOperacionesDelMensaje(
  pending: PendingQuery,
  obra: Obra,
  phone: string,
): Promise<OperacionRegistrada[]> {
  const operaciones: OperacionParaRegistrar[] = [];
  const base = { obra_id: pending.obra_id, telefono: phone };

  if (pending.type === "operation") {
    for (const op of pending.operation) {
      // La nota ya es el mensaje crudo: no se re-ejecuta.
      if (op.endpoint === "/bot/mensaje") continue;

      const payload: Record<string, unknown> = { ...op.data, ...base };
      for (const userPhoneField of getUserPhoneFields(op.endpoint)) {
        if (payload[userPhoneField] == null) payload[userPhoneField] = phone;
      }
      operaciones.push({
        endpoint: op.endpoint,
        method: op.method,
        payload,
        ...buildOperationMetadata(op, payload),
        display: op.display,
      });
    }
  } else if (pending.type === "comprobante") {
    const d = pending.data;
    const payload = {
      ...base,
      monto: parseMontoArg(d.monto),
      moneda: d.moneda || "ARS",
      descripcion: `${d.entidad} - ${d.tipo}`,
      origen: "bot_imagen",
      comprobante_detalle: d,
    };
    operaciones.push({
      endpoint: "/bot/gastos",
      method: "POST",
      payload,
      ...buildComprobanteMetadata(d),
    });
  } else {
    const d = pending.data;
    const payload = {
      ...base,
      monto: parseMontoArg(d.total),
      moneda: "ARS",
      descripcion: `Factura ${d.tipoFactura} ${d.numero} de ${d.emisor}`,
      origen: "bot_imagen",
      comprobante_detalle: d,
    };
    operaciones.push({
      endpoint: "/bot/gastos",
      method: "POST",
      payload,
      ...buildFacturaMetadata(d),
    });
  }

  console.log(
    `[operaciones] registrando ${operaciones.length} operación(es) para obra "${obra.obra_nombre}"`,
  );
  const { operaciones: registradas } = await registrarOperaciones({
    obra_id: obra.obra_id,
    mensaje_id: pending.mensaje_id,
    telefono: phone,
    operaciones,
  });
  console.log(`[operaciones] estados: ${registradas.map((o) => o.estado).join(", ")}`);
  return registradas;
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
        `Respondé ${emojiNumero(0)} para cancelar la operación.`,
      ].join("\n"),
    );
    return;
  }

  const lista = listaNumerada(question.options.map((o) => o.nombre));

  await client.sendMessage(
    chatId,
    [
      `🤔 No estoy seguro de qué ${entityKindLabel(question.kind)} es "*${question.entity}*". Elegí uno:`,
      "",
      lista,
      "",
      `${emojiNumero(question.options.length + 1)} Ninguno de estos`,
      `${emojiNumero(0)} ❌ Cancelar`,
      "",
      "Respondé con el número.",
    ].join("\n"),
  );
}

/**
 * Flujo completo tras elegir la obra:
 * 1) registra el mensaje crudo (POST /bot/mensaje) → mensaje_id
 * 2) resuelve nombres → IDs por similitud (Backend /bot/entidades/buscar)
 * 3) si algo queda dudoso → encuesta al usuario (y queda en pausa)
 * 4) si todo resuelto → registra las operaciones (POST /bot/operaciones);
 *    el Backend ejecuta las automáticas y deja el resto pendiente de aprobación
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
      for (let i = 0; i < pending.operation.length; i++) {
        const question = await resolveOperationEntities(pending.operation[i], obra.obra_id, i);
        if (question) {
          setEntityPending(phone, { pending, obra, chatId, question });
          await sendEntityQuestion(chatId, question);
          return;
        }
      }
    } catch (error) {
      console.error("[prepareAndExecute] falló la resolución de entidades:", error);
    }
  }

  clearEntityPending(phone);
  clearPending(phone);
  try {
    const registradas = await registrarOperacionesDelMensaje(pending, obra, phone);
    const pendientes = registradas.filter((o) => o.estado === "pendiente").length;
    const errores = registradas.filter((o) => o.estado === "error").length;

    if (errores > 0) {
      await client.sendMessage(
        chatId,
        "❌ No pude registrar la operación. Intentá de nuevo.",
      );
    } else if (pendientes > 0) {
      await client.sendMessage(chatId, MSG.SUCCESS_DATA_PENDING_APPROVAL);
    } else {
      await client.sendMessage(chatId, MSG.SUCCESS_DATA_SAVED);
    }
  } catch (error) {
    console.error("[prepareAndExecute] error registrando operaciones:", error);
    await client.sendMessage(
      chatId,
      "❌ Ocurrió un error al registrar la operación. Intentá de nuevo.",
    );
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
    await client.sendMessage(chatId, `❌ Esa opción no existe. Respondé con un número de la lista o ${emojiNumero(0)} para cancelar.`);
    return true;
  }
  if (n === 0) {
    await client.sendMessage(chatId, `❌ No hay opciones para elegir. Respondé ${emojiNumero(0)} para cancelar.`);
    return true;
  }

  const option = selectedIndex <= n ? question.options[selectedIndex - 1] : null;

  clearEntityPending(phone);

  // "Ninguno de estos" → error y cancelar: no se auto-crean entidades.
  if (option === null) {
    clearPending(phone);
    await client.sendMessage(
      chatId,
      `❌ No encontré el ${entityKindLabel(question.kind)} "*${question.entity}*". No puedo continuar sin él. Crealo desde la web y volvé a intentar.`,
    );
    return true;
  }

  await applyQuestionAnswer(pending, question, option, obra.obra_id);
  await prepareAndExecute(pending, obra, phone, chatId);
  return true;
}

// ──────────────────────────────────────────
// Poll nativo — código muerto. El hook WAWebAddonPollVoteTableMode de
// whatsapp-web.js no emite vote_update con la versión actual de WhatsApp Web.
// Se usa el sistema de texto numerado (sendEntityQuestion / handleEntityTextReply
// / sendObraConfirmationText / handleObraTextReply).
// ──────────────────────────────────────────
// export async function sendObraPoll(
//   phone: string,
//   chatId: string,
//   pendingQuery: PendingQuery,
// ): Promise<void> {
//   const user = await getUserObras(phone);
//   const client = getClient();
//   if (!user || user.obras.length === 0) {
//     await client.sendMessage(chatId, MSG.ERROR_NO_OBRA);
//     return;
//   }
//
//   setPending(phone, pendingQuery);
//
//   const options = user.obras.map((o) => o.obra_nombre);
//   options.push("❌ Cancelar");
//
//   const poll = new Poll("¿En qué obra?", options, {
//     allowMultipleAnswers: false,
//     messageSecret: undefined,
//   });
//   await client.sendMessage(chatId, poll);
// }
//
// export async function handlePollVote(
//   voterPhone: string,
//   selectedOptionName: string,
//   pollMessage: Message,
// ): Promise<void> {
//   try {
//     console.log(`[handlePollVote] Voto de ${voterPhone}: "${selectedOptionName}"`);
//     const pending = getPending(voterPhone);
//     const client = getClient();
//
//     if (!pending) {
//       console.log(`[handlePollVote] Sin pendiente para ${voterPhone}, borrando poll`);
//       await pollMessage.delete(true);
//       return;
//     }
//
//     const chatId = pollMessage.id.remote;
//     console.log(`[handlePollVote] chatId: ${chatId}`);
//
//     if (selectedOptionName === "❌ Cancelar") {
//       clearPending(voterPhone);
//       await pollMessage.delete(true);
//       await client.sendMessage(chatId, MSG.SUCCESS_DATA_CANCELLED);
//       return;
//     }
//
//     const user = await getUserObras(voterPhone);
//     if (!user) {
//       clearPending(voterPhone);
//       await pollMessage.delete(true);
//       await client.sendMessage(chatId, MSG.ERROR_NO_OBRA);
//       return;
//     }
//
//     const obra = user.obras.find((o) => o.obra_nombre === selectedOptionName);
//     if (!obra) {
//       await client.sendMessage(chatId, "❌ No encontré esa obra. Intenta de nuevo.");
//       return;
//     }
//
//     pending.obra_id = obra.obra_id;
//     await prepareAndExecute(pending, obra, voterPhone, chatId);
//     await pollMessage.delete(true);
//   } catch (error) {
//     console.error("[handlePollVote] Error:", error);
//     try {
//       const client = getClient();
//       const chatId = pollMessage.id?.remote;
//       if (chatId) {
//         await client.sendMessage(chatId, "❌ Ocurrió un error al ejecutar la operación. Intentá de nuevo.");
//       }
//     } catch {}
//   }
// }

/**
 * Respuesta "Ok!" + encuesta de obra para una operación ya validada.
 * Reutilizada por el flujo normal (freetext) y por el de repregunta.
 */
export async function sendOperationConfirmation(
  phone: string,
  chatId: string,
  ops: ApiCall[],
  contenido: string,
  tipoMensaje: string,
): Promise<void> {
  const client = getClient();
  const primaryComment = ops[0].comment || "Estoy procesando tu solicitud...";
  const extra =
    ops.length > 1 ? ` Voy a hacer ${ops.length} operaciones en total.` : "";
  await client.sendMessage(chatId, `👍 Ok! ${primaryComment}${extra}`);

  await sendObraConfirmationText(phone, chatId, {
    type: "operation",
    operation: ops,
    contenido,
    tipo_mensaje: tipoMensaje,
  });
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

  const lista = listaNumerada(user.obras.map((o) => o.obra_nombre));

  await client.sendMessage(
    chatId,
    [
      "🏗️ *¿En qué obra?*",
      "",
      lista,
      "",
      `${emojiNumero(0)} ❌ Cancelar`,
      "",
      "Respondé con el número.",
    ].join("\n"),
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
    await client.sendMessage(chatId, "❌ No encontré esa opción. Probá de nuevo.");
    return true;
  }

  pending.obra_id = obra.obra_id;
  clearPending(phone);
  await prepareAndExecute(pending, obra, phone, chatId);
  return true;
}
