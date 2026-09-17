import { describe, expect, test } from "bun:test";
import { backfillSerializedId } from "./whatsappPatch.service";

describe("backfillSerializedId", () => {
  test("copia $1 a _serialized cuando falta", () => {
    const message = {
      id: { fromMe: false, remote: "123456@lid", id: "ABC123", $1: "false_123456@lid_ABC123" },
    };

    expect(backfillSerializedId(message)).toBe("false_123456@lid_ABC123");
    expect(message.id._serialized).toBe("false_123456@lid_ABC123");
  });

  test("respeta el _serialized existente", () => {
    const message = {
      id: {
        fromMe: false,
        remote: "123456@c.us",
        id: "ABC123",
        _serialized: "false_123456@c.us_ABC123",
        $1: "otro_valor",
      },
    };

    expect(backfillSerializedId(message)).toBe("false_123456@c.us_ABC123");
  });

  test("devuelve undefined sin id reconocible", () => {
    expect(backfillSerializedId({ id: { fromMe: true } })).toBeUndefined();
    expect(backfillSerializedId({})).toBeUndefined();
  });
});
