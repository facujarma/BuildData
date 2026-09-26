import crypto from "node:crypto";
import { pool } from "../db.js";

const TTL_DIAS = 7;
const PREFIJO_TOKEN = "v1.";

function clave() {
  const hex = process.env.INVITACION_SECRET || "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("INVITACION_SECRET no configurada (se esperan 64 caracteres hex)");
  }
  return Buffer.from(hex, "hex");
}

// Token = "v1." + base64url(iv(12) || tag(16) || ciphertext).
// AES-256-GCM: cifra los datos y garantiza que no puedan alterarse
// (si cambian un solo byte, el tag no valida y descifrarInvitacion devuelve null).
export function cifrarInvitacion(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", clave(), iv);
  const cifrado = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIJO_TOKEN}${Buffer.concat([iv, tag, cifrado]).toString("base64url")}`;
}

export function descifrarInvitacion(token) {
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
    return JSON.parse(plano);
  } catch {
    return null;
  }
}

// WhatsApp para Argentina manda los celulares como 54 9 <area> <numero>
// (ej: 54911...), pero el admin puede tipear +54 11 ... sin el 9.
// Se normaliza a dígitos sin el 9 para poder comparar.
export function normalizarTelefono(telefono) {
  let digitos = String(telefono || "").replace(/\D/g, "");
  if (digitos.startsWith("54") && digitos[2] === "9") {
    digitos = `54${digitos.slice(3)}`;
  }
  return digitos;
}

// Crea la invitación en DB y devuelve el token cifrado que viaja en el link.
export async function crearInvitacion({ obraId, nombre, telefono, rol, creadaPor }) {
  const expira = new Date(Date.now() + TTL_DIAS * 24 * 60 * 60 * 1000);
  const { rows } = await pool.query(
    `INSERT INTO invitaciones (obra_id, nombre, telefono, rol, creada_por, expira_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, expira_at`,
    [obraId, nombre, telefono || null, rol || null, creadaPor || null, expira]
  );

  const invitacion = rows[0];
  const token = cifrarInvitacion({
    v: 1,
    id: invitacion.id,
    obra: obraId,
    nom: nombre,
    tel: telefono || null,
    exp: Math.floor(new Date(invitacion.expira_at).getTime() / 1000),
  });

  return { id: invitacion.id, token, expira_at: invitacion.expira_at };
}

// Consume la invitación: valida el token, la marca usada de forma atómica
// (anti doble uso), crea/actualiza la persona y la asocia a la obra.
export async function consumirInvitacion({ token, telefono }) {
  if (!telefono) return { error: "invalido" };
  const payload = descifrarInvitacion(token);
  if (!payload?.id) return { error: "invalido" };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reclamo = await client.query(
      `UPDATE invitaciones SET usada_at = now()
       WHERE id = $1 AND usada_at IS NULL AND expira_at > now()
       RETURNING id, obra_id, nombre, telefono, rol`,
      [payload.id]
    );

    if (reclamo.rows.length === 0) {
      await client.query("ROLLBACK");
      const { rows } = await pool.query(
        `SELECT usada_at, expira_at FROM invitaciones WHERE id = $1`,
        [payload.id]
      );
      if (rows.length === 0) return { error: "invalido" };
      if (rows[0].usada_at) return { error: "usada" };
      return { error: "vencida" };
    }

    const invitacion = reclamo.rows[0];

    if (
      invitacion.telefono &&
      normalizarTelefono(invitacion.telefono) !== normalizarTelefono(telefono)
    ) {
      await client.query("ROLLBACK");
      return { error: "otro_telefono" };
    }

    const persona = await client.query(
      `INSERT INTO personas (nombre, telefono) VALUES ($1, $2)
       ON CONFLICT (telefono) DO UPDATE SET nombre = $1
       RETURNING id, nombre, telefono`,
      [invitacion.nombre, telefono]
    );

    await client.query(
      `INSERT INTO miembros_obra (persona_id, obra_id, rol)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2
       )`,
      [persona.rows[0].id, invitacion.obra_id, invitacion.rol]
    );

    await client.query(`UPDATE invitaciones SET usada_por = $1 WHERE id = $2`, [
      persona.rows[0].id,
      invitacion.id,
    ]);

    const obra = await client.query(
      `SELECT id, nombre FROM obras WHERE id = $1`,
      [invitacion.obra_id]
    );

    await client.query("COMMIT");
    return { persona: persona.rows[0], obra: obra.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
