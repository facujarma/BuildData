import { describe, expect, test } from "bun:test";
import type { WAMessage } from "@whiskeysockets/baileys";
import { getPhoneFromMessage, isPollVoteMessage, parsePollOptionIndex } from "./message.adapter";

function message(key: WAMessage["key"]): WAMessage {
  return { key } as WAMessage;
}

describe("getPhoneFromMessage", () => {
  test("extrae el teléfono de un jid @s.whatsapp.net", () => {
    expect(getPhoneFromMessage(message({ remoteJid: "5491122334455@s.whatsapp.net" }))).toBe(
      "5491122334455",
    );
  });

  test("saca el sufijo de dispositivo", () => {
    expect(getPhoneFromMessage(message({ remoteJid: "5491122334455:12@s.whatsapp.net" }))).toBe(
      "5491122334455",
    );
  });

  test("con @lid prefiere remoteJidAlt (teléfono real)", () => {
    expect(
      getPhoneFromMessage(
        message({
          remoteJid: "123456789012345@lid",
          remoteJidAlt: "5491122334455@s.whatsapp.net",
        }),
      ),
    ).toBe("5491122334455");
  });

  test("@lid sin remoteJidAlt devuelve el lid como número", () => {
    expect(getPhoneFromMessage(message({ remoteJid: "123456789012345@lid" }))).toBe(
      "123456789012345",
    );
  });

  test("ignora grupos y broadcasts", () => {
    expect(getPhoneFromMessage(message({ remoteJid: "123-456@g.us" }))).toBeUndefined();
    expect(getPhoneFromMessage(message({ remoteJid: "status@broadcast" }))).toBeUndefined();
    expect(getPhoneFromMessage(message({}))).toBeUndefined();
  });
});

describe("isPollVoteMessage", () => {
  test("detecta un voto de encuesta", () => {
    const vote = { ...message({ remoteJid: "5491122334455@s.whatsapp.net" }) };
    vote.message = { pollUpdateMessage: { pollCreationMessageKey: { id: "POLL1" } } };
    expect(isPollVoteMessage(vote)).toBe(true);
  });

  test("detecta el voto dentro de un mensaje efímero", () => {
    const vote = { ...message({ remoteJid: "5491122334455@s.whatsapp.net" }) };
    vote.message = {
      ephemeralMessage: {
        message: { pollUpdateMessage: { pollCreationMessageKey: { id: "POLL1" } } },
      },
    };
    expect(isPollVoteMessage(vote)).toBe(true);
  });

  test("no confunde un texto común", () => {
    const text = { ...message({ remoteJid: "5491122334455@s.whatsapp.net" }) };
    text.message = { conversation: "hola" };
    expect(isPollVoteMessage(text)).toBe(false);
    expect(isPollVoteMessage(message({}))).toBe(false);
  });
});

describe("parsePollOptionIndex", () => {
  test("lee el número del prefijo de la opción", () => {
    expect(parsePollOptionIndex("1. Cemento")).toBe(1);
    expect(parsePollOptionIndex("12. Cal")).toBe(12);
    expect(parsePollOptionIndex("0. ❌ Cancelar")).toBe(0);
    expect(parsePollOptionIndex("  3. Arena")).toBe(3);
  });

  test("devuelve undefined sin prefijo numérico", () => {
    expect(parsePollOptionIndex("Cemento")).toBeUndefined();
    expect(parsePollOptionIndex("")).toBeUndefined();
  });
});
