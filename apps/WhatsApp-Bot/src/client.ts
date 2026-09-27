import mongoose from "mongoose";
import qrcode from "qrcode-terminal";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import { useMongoAuthState } from "./baileys/mongoAuthState.service";
import { buildMessage, isPollVoteMessage } from "./baileys/message.adapter";
import { getPollMessage, storePollMessage } from "./baileys/pollMessage.store";
import { handleMessage } from "./handlers/message.handler";
import { handlePollVoteMessage } from "./services/pollConfirmation.service";

const mongoUri = process.env.MONGO_URI!;
const RECONNECT_DELAY_MS = 5_000;
const MAX_RECONNECT_DELAY_MS = 60_000;

let sock: WASocket | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectDelay = RECONNECT_DELAY_MS;
let connecting = false;

export interface BotClient {
  sendMessage(chatId: string, text: string): Promise<unknown>;
  sendPoll(chatId: string, question: string, values: string[]): Promise<string | undefined>;
}

export function getClient(): BotClient {
  return {
    sendMessage: async (chatId: string, text: string) => {
      if (!sock) throw new Error("El cliente de WhatsApp no está conectado");
      return sock.sendMessage(chatId, { text });
    },
    sendPoll: async (chatId: string, question: string, values: string[]) => {
      if (!sock) throw new Error("El cliente de WhatsApp no está conectado");
      const sent = await sock.sendMessage(chatId, {
        poll: { name: question, values, selectableCount: 1 },
      });
      if (sent?.key?.id) storePollMessage(sent);
      return sent?.key?.id ?? undefined;
    },
  };
}

export async function initClient(): Promise<void> {
  await mongoose.connect(mongoUri);
  console.log("✅ Conectado a MongoDB");
  await connect();
}

async function connect(): Promise<void> {
  if (connecting) return;
  connecting = true;

  try {
    const { state, saveCreds } = await useMongoAuthState();

    const socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu("BuildData"),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      getMessage: async (key) => getPollMessage(key.id)?.message ?? undefined,
    });

    sock = socket;

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        console.log("Escaneá este QR con WhatsApp:");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        reconnectDelay = RECONNECT_DELAY_MS;
        console.log("✅ Bot conectado y listo");
      }

      if (connection === "close") {
        if (sock !== socket) return;
        sock = undefined;

        const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
          ?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        const replaced = statusCode === DisconnectReason.connectionReplaced;
        console.error(
          `❌ Cliente desconectado (código ${statusCode ?? "desconocido"})` +
            (replaced ? " — otra instancia está usando la misma sesión" : ""),
        );

        if (!loggedOut) scheduleReconnect();
      }
    });

    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const raw of messages) {
        try {
          if (isPollVoteMessage(raw)) {
            await handlePollVoteMessage(socket, raw);
            continue;
          }
          const message = buildMessage(socket, raw);
          if (!message) continue;
          const { number } = await message.getContact();
          console.log(`[in] phone=${number} jid=${message.from} tipo=${message.type}`);
          await handleMessage(message);
        } catch (error) {
          console.error("Error procesando mensaje:", error);
        }
      }
    });
  } finally {
    connecting = false;
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;

  const delay = reconnectDelay;
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    connect().catch((error) => {
      console.error("❌ Falló la reconexión:", error);
      scheduleReconnect();
    });
  }, delay);
}
