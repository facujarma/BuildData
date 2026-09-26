import { describe, expect, test, beforeEach } from "bun:test";
import {
  cifrarInvitacion,
  descifrarInvitacion,
  normalizarTelefono,
  type InvitacionPayload,
} from "./invitaciones.service";

const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const payload: InvitacionPayload = {
  v: 1,
  id: "11111111-1111-1111-1111-111111111111",
  obra: "22222222-2222-2222-2222-222222222222",
  nom: "Ramón Díaz",
  tel: "+54 11 1234 5678",
  exp: 4102444800,
};

beforeEach(() => {
  process.env.INVITACION_SECRET = SECRET;
});

describe("descifrarInvitacion", () => {
  test("el bot descifra el token que genera el Backend (mismo formato)", () => {
    expect(descifrarInvitacion(cifrarInvitacion(payload))).toEqual(payload);
  });

  test("token alterado devuelve null", () => {
    const token = cifrarInvitacion(payload);
    const i = token.length - 5;
    const alterado =
      token.slice(0, i) + (token[i] === "A" ? "B" : "A") + token.slice(i + 1);
    expect(descifrarInvitacion(alterado)).toBeNull();
  });

  test("token inválido o de otra versión devuelve null", () => {
    expect(descifrarInvitacion("")).toBeNull();
    expect(descifrarInvitacion("v9.abc")).toBeNull();
  });

  test("con otra clave devuelve null", () => {
    const token = cifrarInvitacion(payload);
    process.env.INVITACION_SECRET = "f".repeat(64);
    expect(descifrarInvitacion(token)).toBeNull();
  });
});

describe("normalizarTelefono", () => {
  test("AR con y sin 9 coinciden", () => {
    expect(normalizarTelefono("5491112345678")).toBe(
      normalizarTelefono("+54 11 1234 5678")
    );
  });
});
