import { Client, RemoteAuth } from "whatsapp-web.js";
import mongoose from "mongoose";
import qrcode from "qrcode-terminal";
import { mongoStore } from "./mongoStore";
import { handleMessage } from "./handlers/message.handler";
import { handlePollVote } from "./services/pollConfirmation.service";
import { applyWhatsappPatches } from "./services/whatsappPatch.service";

const mongoUri = process.env.MONGO_URI!;
const isProduction = process.env.NODE_ENV === "production";

let client: Client;

export function getClient(): Client {
  return client;
}

export async function initClient() {
  await mongoose.connect(mongoUri);
  console.log("✅ Conectado a MongoDB");

  applyWhatsappPatches();

  client = new Client({
    authStrategy: new RemoteAuth({
      clientId: "whatsapp-bot-final",
      store: mongoStore,
      backupSyncIntervalMs: 300_000,
    }),
    puppeteer: {
      headless: true,
      executablePath: isProduction
        ? "./puppeteer_data/chrome/linux-146.0.7680.31/chrome-linux64/chrome"
        : undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    console.log("Escaneá este QR con WhatsApp:");
    qrcode.generate(qr, { small: true });
  });

  client.on("remote_session_saved", () => {
    console.log("💾 Sesión guardada en MongoDB");
  });

  client.on("ready", async () => {
    console.log("✅ Bot conectado y listo");
  });

  client.on("auth_failure", () => {
    console.error("❌ Error de autenticación");
  });

  client.on("disconnected", (reason) => {
    console.error("❌ Cliente desconectado:", reason);
  });

  client.on("message", (message) => {
    handleMessage(message);
  });

  client.on("vote_update", (vote) => {
    console.log("[vote_update] Evento recibido:", JSON.stringify({
      voter: vote.voter,
      selectedOptions: vote.selectedOptions?.map(o => o.name),
      hasParentMessage: !!vote.parentMessage,
      parentId: vote.parentMessage?.id?.id,
    }));
    const voterPhone = vote.voter.split("@")[0];
    const selected = vote.selectedOptions[0]?.name;
    if (!selected) return;
    handlePollVote(voterPhone, selected, vote.parentMessage);
  });

  client.initialize();
}
