import crypto from "node:crypto";

export interface InvitacionPayload {
  v: number;
  id: string;
  obra: string;
  nom: string;
  tel: string | null;
  exp: number;
}

const PREFIJO_TOKEN = "v1.";

function clave(): Buffer {
  const hex = process.env.INVITACION_SECRET || "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("INVITACION_SECRET no configurada (se esperan 64 caracteres hex)");
  }
  return Buffer.from(hex, "hex");
}

// Mismo formato que el Backend: "v1." + base64url(iv(12) || tag(16) || ciphertext).
// AES-256-GCM garantiza confidencialidad e integridad: si alguien altera el
// token, el tag no valida y descifrarInvitacion devuelve null.
export function cifrarInvitacion(payload: InvitacionPayload): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", clave(), iv);
  const cifrado = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIJO_TOKEN}${Buffer.concat([iv, tag, cifrado]).toString("base64url")}`;
}

export function descifrarInvitacion(token: string): InvitacionPayload | null {
  if (typeof token !== "string" || !token.startsWith(PREFIJO_TOKEN)) return null;
  const raw = Buffer.from(token.slice(PREFIJO_TOKEN.length), "base64url");
  if (raw.length < 29) return null;
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const cifrado = raw.subarray(28);
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", clave(), iv);
    decipher.setAuthTag(tag);
    const plano = Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");
    return JSON.parse(plano) as InvitacionPayload;
  } catch {
    return null;
  }
}

// WhatsApp manda los celulares argentinos como 54 9 <area> <numero>, pero el
// admin puede tipear +54 11 ... sin el 9. Se compara sin el 9.
export function normalizarTelefono(telefono: string | null | undefined): string {
  let digitos = String(telefono || "").replace(/\D/g, "");
  if (digitos.startsWith("54") && digitos[2] === "9") {
    digitos = `54${digitos.slice(3)}`;
  }
  return digitos;
}
