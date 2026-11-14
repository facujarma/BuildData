import {
  decryptPollVote,
  getAggregateVotesInPollMessage,
  getKeyAuthor,
  jidNormalizedUser,
  normalizeMessageContent,
  type proto,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import { getClient } from "../client";
import { parsePollOptionIndex, resolveKeyPhone } from "../baileys/message.adapter";
import { getPollMessage, removePollMessage } from "../baileys/pollMessage.store";
import { getUserObras } from "./user.service";
import {
  setPending,
  clearPending,
  getPending,
  setEntityPending,
  clearEntityPending,
  getEntityPending,
  setPedidoPending,
  getPedidoPending,
  clearPedidoPending,
  PendingQuery,
  ApiCall,
  PedidoPendiente,
} from "../handlers/pendingQuery.store";
import {
  registrarMensaje,
  registrarOperaciones,
  subirFotoGaleria,
  getPedidosPendientes,
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
import {
  nombreRolVisible,
  puedeConPermisos,
  puedeOperarConPermisos,
  permisoDeEndpoint,
  PERMISO_LABELS,
} from "./permissions.service";
import { filtrarPedidos, pedidoLabel } from "./pedidoMatch.service";

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
  // Las fotos se suben a la galería, no pasan por la cola de aprobación.
  if (pending.type === "foto") return [];

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
  const fallback = () =>
    client.sendMessage(
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

  const values = [
    ...question.options.map((o, i) => `${i + 1}. ${o.nombre}`),
    `${question.options.length + 1}. Ninguno de estos`,
    "0. ❌ Cancelar",
  ];

  await sendPollOrText(
    chatId,
    `🤔 ¿Qué ${entityKindLabel(question.kind)} es "${question.entity}"?`,
    values,
    fallback,
  );
}

// ──────────────────────────────────────────
// Permisos por rol
// ──────────────────────────────────────────

// Devuelve la etiqueta de la acción bloqueada, o null si los permisos de la obra
// pueden hacer todo lo que pide el pending. Usa la lista efectiva que manda el
// Backend (`obra.permisos`) y cae a la matriz estática del rol si no viene. Un
// lote con una sola operación prohibida se rechaza entero (no se ejecuta la mitad).
export function permisoBloqueado(pending: PendingQuery, obra: Obra): string | null {
  const { permisos, rol } = obra;

  if (pending.type === "foto") {
    return puedeConPermisos(permisos, "foto.subir", rol)
      ? null
      : PERMISO_LABELS["foto.subir"];
  }
  if (pending.type === "comprobante" || pending.type === "factura") {
    return puedeConPermisos(permisos, "gasto.crear", rol)
      ? null
      : PERMISO_LABELS["gasto.crear"];
  }
  for (const op of pending.operation) {
    if (!puedeOperarConPermisos(permisos, op.endpoint, rol)) {
      return permisoDeEndpoint(op.endpoint)?.label ?? "hacer esa operación";
    }
  }
  return null;
}

// ──────────────────────────────────────────
// Entrega de pedidos: búsqueda y encuesta
// ──────────────────────────────────────────

// Guarda el pedido elegido en el payload y saca la referencia que emitió el LLM.
function aplicarPedido(op: ApiCall, pedido: PedidoPendiente): void {
  delete op.data.pedido_ref;
  op.data.pedido_id = pedido.id;
  if (!op.display) op.display = {};
  op.display.pedido_id = pedidoLabel(pedido);
}

async function sendPedidoQuestion(
  chatId: string,
  pedidos: PedidoPendiente[],
): Promise<void> {
  const client = getClient();
  const lista = listaNumerada(pedidos.map(pedidoLabel));
  const fallback = () =>
    client.sendMessage(
      chatId,
      [
        "📦 *¿Qué pedido llegó?*",
        "",
        lista,
        "",
        `${emojiNumero(0)} ❌ Cancelar`,
        "",
        "Respondé con el número.",
      ].join("\n"),
    );

  const values = [
    ...pedidos.map((pedido, i) => `${i + 1}. ${pedidoLabel(pedido)}`),
    "0. ❌ Cancelar",
  ];

  await sendPollOrText(chatId, "📦 ¿Qué pedido llegó?", values, fallback);
}

export async function handlePedidoTextReply(
  phone: string,
  raw: string,
  chatId: string,
): Promise<boolean> {
  const state = getPedidoPending(phone);
  if (!state) return false;

  const selectedIndex = parseInt(raw.trim(), 10);
  if (isNaN(selectedIndex)) return false;

  const client = getClient();

  if (selectedIndex === 0) {
    clearPedidoPending(phone);
    clearPending(phone);
    await client.sendMessage(chatId, MSG.SUCCESS_DATA_CANCELLED);
    return true;
  }

  if (selectedIndex < 1 || selectedIndex > state.pedidos.length) {
    await client.sendMessage(
      chatId,
      `❌ Esa opción no existe. Respondé con un número de la lista o ${emojiNumero(0)} para cancelar.`,
    );
    return true;
  }

  const pedido = state.pedidos[selectedIndex - 1];
  const op =
    state.pending.type === "operation"
      ? state.pending.operation[state.opIndex]
      : undefined;
  clearPedidoPending(phone);

  if (!op) {
    clearPending(phone);
    await client.sendMessage(chatId, "❌ No pude resolver el pedido. Probá de nuevo.");
    return true;
  }

  aplicarPedido(op, pedido);
  await prepareAndExecute(state.pending, state.obra, phone, chatId);
  return true;
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
  // El Backend manda el rol canónico y los permisos efectivos de esa obra; el
  // nombre se muestra tal cual (puede ser un rol personalizado) y solo se
  // normaliza si viene de un backend viejo, sin `permisos`.
  const rol = nombreRolVisible(obra.rol, obra.permisos);

  // Gate de permisos del bot. El Backend repite el chequeo al registrar las
  // operaciones (barrera dura); acá se avisa antes de pedir datos o confirmar.
  const bloqueo = permisoBloqueado(pending, obra);
  if (bloqueo) {
    clearPending(phone);
    clearEntityPending(phone);
    clearPedidoPending(phone);
    await client.sendMessage(
      chatId,
      `🔒 Tu rol *${rol}* no puede ${bloqueo}.`,
    );
    return;
  }

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

  // Foto de obra: se sube a la galería y termina el flujo (no hay operación).
  if (pending.type === "foto") {
    try {
      await subirFotoGaleria({
        obraId: obra.obra_id,
        telefono: phone,
        dataBase64: pending.media.data,
        mimetype: pending.media.mimetype,
        nota: pending.nota,
        nombre: pending.media.filename,
      });
      await client.sendMessage(chatId, "✅ Foto guardada en la galería de la obra.");
    } catch (error) {
      console.error("[prepareAndExecute] no se pudo guardar la foto:", error);
      await client.sendMessage(
        chatId,
        "❌ No pude guardar la foto en la galería. Probá de nuevo.",
      );
    }
    clearPending(phone);
    return;
  }

  if (pending.type === "operation") {
    // Entrega de pedidos: se resuelve antes que las entidades porque no usa el
    // buscador de materiales/proveedores, sino los pedidos pendientes de la obra.
    for (let i = 0; i < pending.operation.length; i++) {
      const op = pending.operation[i];
      if (op.endpoint !== "/bot/pedidos/entregar" || !op.data.pedido_ref) continue;

      const ref = String(op.data.pedido_ref ?? "").trim();
      try {
        const todos = await getPedidosPendientes(obra.obra_id, phone);
        const candidatos = filtrarPedidos(todos, ref);

        if (candidatos.length === 0) {
          clearPending(phone);
          await client.sendMessage(
            chatId,
            `📦 No encontré pedidos pendientes de entrega${
              ref ? ` para "*${ref}*"` : ""
            }.`,
          );
          return;
        }

        if (candidatos.length === 1) {
          aplicarPedido(op, candidatos[0]);
          continue;
        }

        const opciones = candidatos.slice(0, 10);
        setPedidoPending(phone, {
          pending,
          obra,
          chatId,
          opIndex: i,
          pedidos: opciones,
        });
        await sendPedidoQuestion(chatId, opciones);
        return;
      } catch (error) {
        console.error("[prepareAndExecute] no se pudieron buscar los pedidos:", error);
        clearPending(phone);
        await client.sendMessage(
          chatId,
          "❌ No pude consultar los pedidos pendientes. Intentá de nuevo.",
        );
        return;
      }
    }

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
  clearPedidoPending(phone);
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
  const fallback = () =>
    client.sendMessage(
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

  const values = [
    ...user.obras.map((o, i) => `${i + 1}. ${o.obra_nombre}`),
    "0. ❌ Cancelar",
  ];

  await sendPollOrText(chatId, "🏗️ ¿En qué obra?", values, fallback);
}

const MAX_POLL_OPTIONS = 12;

async function sendPollOrText(
  chatId: string,
  question: string,
  values: string[],
  fallback: () => Promise<unknown>,
): Promise<void> {
  if (values.length < 2 || values.length > MAX_POLL_OPTIONS) {
    await fallback();
    return;
  }

  try {
    await getClient().sendPoll(chatId, question, values);
  } catch (error) {
    console.error("[poll] no se pudo enviar la encuesta nativa, se usa texto:", error);
    await fallback();
  }
}

export async function handlePollVoteMessage(sock: WASocket, voteMessage: WAMessage): Promise<void> {
  const content = normalizeMessageContent(voteMessage.message);
  const pollUpdate = content?.pollUpdateMessage;
  const creationKey = pollUpdate?.pollCreationMessageKey;
  if (!pollUpdate?.vote || !creationKey?.id) return;

  const creation = getPollMessage(creationKey.id);
  const pollEncKey = creation?.message?.messageContextInfo?.messageSecret;
  if (!creation?.message || !pollEncKey) {
    console.warn(`[poll] falta el mensaje original de la encuesta (${creationKey.id})`);
    return;
  }

  const vote = decryptVote(sock, pollUpdate.vote, pollEncKey, creationKey.id, voteMessage);
  if (!vote) return;

  const optionName = getVotedOptionName(creation.message, voteMessage, vote);
  const index = optionName ? parsePollOptionIndex(optionName) : undefined;
  const phone = await resolveKeyPhone(sock, voteMessage.key);
  const chatId = voteMessage.key.remoteJid;
  if (!optionName || index === undefined || !phone || !chatId) return;

  console.log(`[poll] voto de ${phone}: "${optionName}"`);
  await deletePollMessage(sock, chatId, creation);
  if (await handleEntityTextReply(phone, String(index), chatId)) return;
  if (await handlePedidoTextReply(phone, String(index), chatId)) return;
  await handleObraTextReply(phone, String(index), chatId);
}

async function deletePollMessage(
  sock: WASocket,
  chatId: string,
  creation: WAMessage,
): Promise<void> {
  try {
    await sock.sendMessage(chatId, { delete: creation.key });
    removePollMessage(creation.key.id);
  } catch (error) {
    console.error("[poll] no se pudo borrar la encuesta:", error);
  }
}

function decryptVote(
  sock: WASocket,
  vote: proto.Message.IPollEncValue,
  pollEncKey: Uint8Array,
  pollMsgId: string,
  voteMessage: WAMessage,
): proto.Message.IPollVoteMessage | undefined {
  const voterJids = unique([
    getKeyAuthor(voteMessage.key, sock.user?.id),
    voteMessage.key.remoteJidAlt,
    voteMessage.key.participantAlt,
    voteMessage.key.remoteJid,
  ]);
  const creatorJids = unique([
    sock.user?.id ? jidNormalizedUser(sock.user.id) : undefined,
    sock.user?.lid ? jidNormalizedUser(sock.user.lid) : undefined,
  ]);

  for (const pollCreatorJid of creatorJids) {
    for (const voterJid of voterJids) {
      try {
        return decryptPollVote(vote, { pollCreatorJid, pollMsgId, pollEncKey, voterJid });
      } catch {
        // combinación incorrecta: probamos la siguiente
      }
    }
  }

  console.warn(`[poll] no se pudo desencriptar el voto (${voteMessage.key.id})`);
  return undefined;
}

function getVotedOptionName(
  pollCreation: proto.IMessage,
  voteMessage: WAMessage,
  vote: proto.Message.IPollVoteMessage,
): string | undefined {
  const aggregation = getAggregateVotesInPollMessage({
    message: pollCreation,
    pollUpdates: [{ pollUpdateMessageKey: voteMessage.key, vote }],
  });
  return aggregation.find((option) => option.voters.length > 0)?.name;
}

function unique(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
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
