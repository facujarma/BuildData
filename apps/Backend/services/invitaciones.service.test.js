import { describe, expect, test } from "bun:test";
import {
  cifrarInvitacion,
  descifrarInvitacion,
  normalizarTelefono,
} from "./invitaciones.service.js";

process.env.INVITACION_SECRET =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const payload = {
  v: 1,
  id: "11111111-1111-1111-1111-111111111111",
  obra: "22222222-2222-2222-2222-222222222222",
  nom: "Ramón Díaz",
  tel: "+54 11 1234 5678",
  exp: 4102444800,
};

describe("cifrarInvitacion / descifrarInvitacion", () => {
  test("round-trip: el payload vuelve intacto", () => {
    const token = cifrarInvitacion(payload);
    expect(descifrarInvitacion(token)).toEqual(payload);
  });

  test("dos tokens del mismo payload son distintos (IV aleatorio)", () => {
    expect(cifrarInvitacion(payload)).not.toBe(cifrarInvitacion(payload));
  });

  test("un byte alterado invalida el token (GCM)", () => {
    const token = cifrarInvitacion(payload);
    const i = token.length - 5;
    const alterado =
      token.slice(0, i) + (token[i] === "A" ? "B" : "A") + token.slice(i + 1);
    expect(descifrarInvitacion(alterado)).toBeNull();
  });

  test("token con basura o formato desconocido devuelve null", () => {
    expect(descifrarInvitacion("")).toBeNull();
    expect(descifrarInvitacion("v1.no-es-base64url-valido")).toBeNull();
    expect(descifrarInvitacion("v2.abc")).toBeNull();
  });

  test("con otra clave no se puede descifrar", () => {
    const token = cifrarInvitacion(payload);
    process.env.INVITACION_SECRET =
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(descifrarInvitacion(token)).toBeNull();
    process.env.INVITACION_SECRET =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });
});

describe("normalizarTelefono", () => {
  test("WhatsApp AR con 9 y número tipeado sin 9 coinciden", () => {
    expect(normalizarTelefono("5491112345678")).toBe(
      normalizarTelefono("+54 11 1234 5678")
    );
  });

  test("otros países solo comparan dígitos", () => {
    expect(normalizarTelefono("+598 91 234 567")).toBe("59891234567");
    expect(normalizarTelefono(null)).toBe("");
  });
});
