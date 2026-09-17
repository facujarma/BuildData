import * as WAWebJS from "whatsapp-web.js";

export interface RawMessageId {
  fromMe?: boolean;
  remote?: unknown;
  id?: string;
  participant?: unknown;
  _serialized?: string;
  $1?: string;
}

declare const window: any;

const PATCH_FLAG = "__builddataPatch";

export function backfillSerializedId(message: { id?: RawMessageId }): string | undefined {
  const rawId = message && message.id;
  if (!rawId) return undefined;

  const serialized = rawId._serialized || rawId.$1;
  if (!serialized) return undefined;

  if (rawId._serialized !== serialized) {
    try {
      Object.defineProperty(rawId, "_serialized", {
        value: serialized,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    } catch {
      return serialized;
    }
  }

  return serialized;
}

function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

async function resolveMediaInPage(msgId: string | undefined, rawId: any) {
  const describe = (error: any): string => {
    if (error && error.name && error.message) return `${error.name}: ${error.message}`;
    return String(error);
  };

  const errors: string[] = [];
  const debug: { errors: string[]; via: string | null; stage: string | null } = {
    errors,
    via: null,
    stage: null,
  };

  let Msg: any;
  try {
    Msg = window.require("WAWebCollections").Msg;
  } catch (error) {
    errors.push(`WAWebCollections: ${describe(error)}`);
    return { error: "waweb_collections_failed", debug };
  }

  const candidates: any[] = [];
  const addCandidate = (candidate: any) => {
    if (candidate !== undefined && candidate !== null && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  };

  addCandidate(msgId);
  addCandidate(rawId);
  addCandidate(rawId && rawId.id);

  try {
    const { createWid } = window.require("WAWebWidFactory");
    const toWid = (value: any) => (typeof value === "string" ? createWid(value) : value);
    addCandidate({
      ...(rawId || {}),
      remote: toWid(rawId && rawId.remote),
      participant: toWid(rawId && rawId.participant),
    });
  } catch (error) {
    errors.push(`WAWebWidFactory: ${describe(error)}`);
  }

  let msg: any;
  for (const candidate of candidates) {
    try {
      msg = Msg.get(candidate);
    } catch (error) {
      errors.push(`Msg.get: ${describe(error)}`);
    }
    if (msg) {
      debug.via = "Msg.get";
      break;
    }
  }

  if (!msg && msgId) {
    try {
      const response = await Msg.getMessagesById([msgId]);
      msg = response && response.messages && response.messages[0];
      if (msg) debug.via = "Msg.getMessagesById";
    } catch (error) {
      errors.push(`Msg.getMessagesById: ${describe(error)}`);
    }
  }

  if (!msg && rawId) {
    try {
      const models = typeof Msg.getModelsArray === "function" ? Msg.getModelsArray() : [];
      msg = models.find((model: any) => {
        const modelId = model && model.id;
        if (!modelId) return false;
        if (msgId && (modelId._serialized === msgId || modelId.$1 === msgId)) return true;
        return Boolean(rawId.id && modelId.id === rawId.id && modelId.fromMe === rawId.fromMe);
      });
      if (msg) debug.via = "scan";
    } catch (error) {
      errors.push(`scan: ${describe(error)}`);
    }
  }

  if (!msg) return { error: "message_not_found", debug };

  debug.stage = (msg.mediaData && msg.mediaData.mediaStage) || null;

  try {
    if (!msg.mediaData || msg.mediaData.mediaStage !== "REUPLOADING") {
      await msg.downloadMedia({
        downloadEvenIfExpensive: true,
        rmrReason: 1,
        isUserInitiated: true,
      });
      debug.stage = (msg.mediaData && msg.mediaData.mediaStage) || null;
    }
  } catch (error) {
    errors.push(`msg.downloadMedia: ${describe(error)}`);
  }

  const toBase64 = async (buffer: ArrayBuffer): Promise<string> => {
    if (window.WWebJS && window.WWebJS.arrayBufferToBase64Async) {
      return window.WWebJS.arrayBufferToBase64Async(buffer);
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
  };

  let blob: any = null;

  try {
    const cache = window.require("WAWebMediaInMemoryBlobCache");
    const hash = msg.mediaObject && msg.mediaObject.filehash;
    const cached = cache && cache.InMemoryMediaBlobCache && cache.InMemoryMediaBlobCache.get(hash);
    if (cached) blob = typeof cached.forceToBlob === "function" ? cached.forceToBlob() : cached;
  } catch (error) {
    errors.push(`InMemoryMediaBlobCache: ${describe(error)}`);
  }

  if (!blob) {
    try {
      const mediaBlob = msg.mediaObject && msg.mediaObject.mediaBlob;
      if (mediaBlob && typeof mediaBlob.forceToBlob === "function") blob = mediaBlob.forceToBlob();
      else if (mediaBlob && typeof mediaBlob.arrayBuffer === "function") blob = mediaBlob;
    } catch (error) {
      errors.push(`mediaObject.mediaBlob: ${describe(error)}`);
    }
  }

  if (blob) {
    try {
      const data = await toBase64(await blob.arrayBuffer());
      if (data) {
        return { data, mimetype: msg.mimetype, filename: msg.filename, filesize: msg.size, debug };
      }
    } catch (error) {
      errors.push(`base64: ${describe(error)}`);
    }
  }

  try {
    const mockQpl = {
      addAnnotations: function () {
        return this;
      },
      addPoint: function () {
        return this;
      },
    };
    const decrypted = await window
      .require("WAWebDownloadManager")
      .downloadManager.downloadAndMaybeDecrypt({
        directPath: msg.directPath,
        encFilehash: msg.encFilehash,
        filehash: msg.filehash,
        mediaKey: msg.mediaKey,
        mediaKeyTimestamp: msg.mediaKeyTimestamp,
        type: msg.type,
        signal: new AbortController().signal,
        downloadQpl: mockQpl,
      });
    const data = await toBase64(decrypted);
    if (data) {
      return { data, mimetype: msg.mimetype, filename: msg.filename, filesize: msg.size, debug };
    }
  } catch (error) {
    errors.push(`downloadAndMaybeDecrypt: ${describe(error)}`);
  }

  return { error: "blob_not_available", debug };
}

export function applyWhatsappPatches(): void {
  const runtime = WAWebJS as any;
  const proto = runtime.Message && runtime.Message.prototype;
  if (!proto || proto[PATCH_FLAG]) return;
  proto[PATCH_FLAG] = true;

  const originalPatch = proto._patch;
  proto._patch = function (this: any, data: any) {
    const result = originalPatch.call(this, data);
    backfillSerializedId(this);
    return result;
  };

  proto.downloadMedia = async function (this: any) {
    if (!this.hasMedia) return undefined;

    const serialized = backfillSerializedId(this);
    const rawId = this.id as RawMessageId | undefined;
    const pageId = rawId
      ? {
          fromMe: rawId.fromMe,
          remote: typeof rawId.remote === "string" ? rawId.remote : undefined,
          id: rawId.id,
          participant: typeof rawId.participant === "string" ? rawId.participant : undefined,
          $1: rawId.$1,
          _serialized: serialized,
        }
      : undefined;

    let result: any;
    try {
      result = await this.client.pupPage.evaluate(resolveMediaInPage, serialized, pageId);
    } catch (error) {
      console.error(`[downloadMedia] Falló la evaluación en WhatsApp Web: ${describeError(error)}`);
      return undefined;
    }

    if (!result || result.error || !result.data) {
      console.error(`[downloadMedia] No se pudo descargar el media: ${JSON.stringify(result)}`);
      return undefined;
    }

    return new runtime.MessageMedia(result.mimetype, result.data, result.filename, result.filesize);
  };
}
