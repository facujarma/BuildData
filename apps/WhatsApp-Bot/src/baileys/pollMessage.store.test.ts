import { describe, expect, test } from "bun:test";
import type { WAMessage } from "@whiskeysockets/baileys";
import { getPollMessage, removePollMessage, storePollMessage } from "./pollMessage.store";

function poll(id: string): WAMessage {
  return {
    key: { id, remoteJid: "5491122334455@s.whatsapp.net", fromMe: true },
  } as WAMessage;
}

describe("pollMessage.store", () => {
  test("guarda y recupera el mensaje de la encuesta", () => {
    storePollMessage(poll("POLL1"));
    expect(getPollMessage("POLL1")?.key.id).toBe("POLL1");
  });

  test("removePollMessage lo elimina", () => {
    storePollMessage(poll("POLL2"));
    removePollMessage("POLL2");
    expect(getPollMessage("POLL2")).toBeUndefined();
  });

  test("ignora ids vacíos o desconocidos", () => {
    expect(getPollMessage(undefined)).toBeUndefined();
    expect(getPollMessage("NO_EXISTE")).toBeUndefined();
    expect(() => storePollMessage({ key: {} } as WAMessage)).not.toThrow();
  });
});
