import {
  DEFAULT_CONNECTION_CONFIG,
  downloadMediaMessage,
  getContentType,
  normalizeMessageContent,
  type proto,
  type WAMessage,
  type WAMessageKey,
  type WASocket,
} from "@whiskeysockets/baileys";
import {
  MessageTypes,
  type DownloadedMedia,
  type Message,
  type MessageContact,
} from "../types/message.types";

const MEDIA_CONTENT_TYPES = [
  "imageMessage",
  "videoMessage",
  "audioMessage",
  "documentMessage",
  "stickerMessage",
];

export function buildMessage(sock: WASocket, raw: WAMessage): Message | null {
  const remoteJid = raw.key.remoteJid;
  if (!remoteJid || raw.key.fromMe || !raw.message) return null;
  if (remoteJid.endsWith("@g.us") || remoteJid.endsWith("@broadcast")) return null;

  const phone = getPhoneFromMessage(raw);
  if (!phone) return null;

  const content = getContentType(raw.message);

  let contact: Promise<MessageContact> | undefined;
  const getContact = () => {
    contact ??= resolveKeyPhone(sock, raw.key).then((number) => ({ number: number ?? phone }));
    return contact;
  };

  return {
    body: extractBody(raw.message),
    from: remoteJid,
    type: resolveType(content, raw.message),
    hasMedia: content !== undefined && MEDIA_CONTENT_TYPES.includes(content),
    reply: async (text: string) => {
      await sock.sendMessage(remoteJid, { text }, { quoted: raw });
    },
    getContact,
    downloadMedia: () => downloadRawMedia(sock, raw),
  };
}

export function isPollVoteMessage(raw: WAMessage): boolean {
  if (!raw.message) return false;
  return getContentType(normalizeMessageContent(raw.message)) === "pollUpdateMessage";
}

export function parsePollOptionIndex(optionName: string): number | undefined {
  const match = /^\s*(\d+)/.exec(optionName);
  if (!match) return undefined;
  const index = parseInt(match[1], 10);
  return Number.isNaN(index) ? undefined : index;
}

export async function resolveKeyPhone(
  sock: WASocket,
  key: WAMessageKey,
): Promise<string | undefined> {
  const phone = getPhoneFromMessage({ key } as WAMessage);
  const remoteJid = key.remoteJid;
  if (!phone || !remoteJid?.endsWith("@lid") || key.remoteJidAlt) return phone;

  try {
    const pn = await sock.signalRepository.lidMapping.getPNForLID(remoteJid);
    return pn?.split("@")[0]?.split(":")[0] ?? phone;
  } catch (error) {
    console.error("[lid] no se pudo resolver el teléfono del chat:", error);
    return phone;
  }
}

export function getPhoneFromMessage(raw: WAMessage): string | undefined {
  const remoteJid = raw.key.remoteJid;
  if (!remoteJid || remoteJid.endsWith("@g.us") || remoteJid.endsWith("@broadcast")) {
    return undefined;
  }
  const phoneJid =
    remoteJid.endsWith("@lid") && raw.key.remoteJidAlt ? raw.key.remoteJidAlt : remoteJid;
  return phoneJid.split("@")[0]?.split(":")[0];
}

function extractBody(message: proto.IMessage): string {
  return (
    message.conversation ??
    message.extendedTextMessage?.text ??
    message.imageMessage?.caption ??
    message.videoMessage?.caption ??
    message.documentMessage?.caption ??
    ""
  );
}

function resolveType(content: string | undefined, message: proto.IMessage): string {
  switch (content) {
    case "conversation":
    case "extendedTextMessage":
      return MessageTypes.TEXT;
    case "imageMessage":
      return MessageTypes.IMAGE;
    case "audioMessage":
      return message.audioMessage?.ptt ? MessageTypes.VOICE : MessageTypes.AUDIO;
    default:
      return content ?? "unknown";
  }
}

async function downloadRawMedia(
  sock: WASocket,
  raw: WAMessage,
): Promise<DownloadedMedia | undefined> {
  if (!raw.message) return undefined;

  try {
    const buffer = await downloadMediaMessage(
      raw,
      "buffer",
      {},
      {
        reuploadRequest: (message) => sock.updateMediaMessage(message),
        logger: DEFAULT_CONNECTION_CONFIG.logger,
      },
    );
    const info = extractMediaInfo(raw.message);
    return {
      data: buffer.toString("base64"),
      mimetype: info.mimetype,
      filename: info.filename,
      filesize: buffer.length,
    };
  } catch (error) {
    console.error("[media] no se pudo descargar el archivo:", error);
    return undefined;
  }
}

function extractMediaInfo(message: proto.IMessage): { mimetype: string; filename?: string } {
  const media =
    message.imageMessage ??
    message.videoMessage ??
    message.audioMessage ??
    message.documentMessage ??
    message.stickerMessage;

  return {
    mimetype: media?.mimetype ?? "application/octet-stream",
    filename: (media as { fileName?: string | null } | undefined)?.fileName ?? undefined,
  };
}
