import crypto from "node:crypto";
import { pool } from "../db.js";
import { resolverRol } from "./roles.service.js";
import {
  buscarPersonaPorTelefono,
  esPersonaError,
  unificarPersonas,
} from "./personas.service.js";
import { normalizarTelefono } from "./telefono.service.js";

export { normalizarTelefono };

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

// Crea la invitación en DB y devuelve el token cifrado que viaja en el link.
// `rol` llega ya validado/canónico desde el controller (resolverRol); se guarda tal
// cual para que un rol personalizado de la obra sobreviva al link.
//
// `personaId` es opcional: cuando el Director elige a alguien que ya tiene
// cuenta web en la obra, el link se ata a esa persona. El rol del link es el
// rol actual de su membresía, no uno nuevo: consumir la invitación no cambia
// roles.
export async function crearInvitacion({
  obraId,
  nombre,
  telefono,
  rol,
  creadaPor,
  personaId = null,
}) {
  const expira = new Date(Date.now() + TTL_DIAS * 24 * 60 * 60 * 1000);
  const rolInvitacion = String(rol ?? "").trim() || "Obrero";
  const { rows } = await pool.query(
    `INSERT INTO invitaciones (obra_id, nombre, telefono, rol, creada_por, persona_id, expira_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, expira_at`,
    [
      obraId,
      nombre,
      telefono || null,
      rolInvitacion,
      creadaPor || null,
      personaId || null,
      expira,
    ]
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

  // El modal usa el nombre/teléfono/rol que quedaron guardados (para una
  // persona existente, el nombre y el rol salen de la DB, no del body).
  return {
    id: invitacion.id,
    token,
    expira_at: invitacion.expira_at,
    nombre,
    telefono: telefono || null,
    rol: rolInvitacion,
    persona_id: personaId || null,
  };
}

// Persona que ya reporta por WhatsApp (o alta nueva si el número está libre).
async function resolverPersonaPorTelefono(client, invitacion, telefonoNormalizado) {
  const existente = telefonoNormalizado
    ? await buscarPersonaPorTelefono(client, telefonoNormalizado)
    : null;
  if (existente) return existente;

  const { rows } = await client.query(
    `INSERT INTO personas (nombre, telefono) VALUES ($1, $2)
     RETURNING id, nombre, telefono`,
    [invitacion.nombre, telefonoNormalizado]
  );
  return rows[0];
}

// La invitación es para una persona web sin teléfono: el número desde el que
// abre el link pasa a ser su WhatsApp. Si ese número ya pertenece a otra fila
// (el humano se había dado de alta antes por WhatsApp), se unifican las dos:
// la cuenta web se absorbe en la persona del teléfono, igual que "Vincular
// cuenta", pero en la misma transacción de la invitación.
async function vincularTelefonoAPersonaWeb(
  client,
  persona,
  telefonoNormalizado,
  ejecutadoPor
) {
  const existente = telefonoNormalizado
    ? await buscarPersonaPorTelefono(client, telefonoNormalizado)
    : null;

  if (existente && existente.id !== persona.id) {
    await unificarPersonas({
      origenId: persona.id,
      destinoId: existente.id,
      ejecutadoPor,
      client,
    });
    return existente;
  }

  const { rows } = await client.query(
    `UPDATE personas SET telefono = $1 WHERE id = $2
     RETURNING id, nombre, telefono`,
    [telefonoNormalizado, persona.id]
  );
  return rows[0];
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
       RETURNING id, obra_id, nombre, telefono, rol, persona_id, creada_por`,
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

    const telefonoNormalizado = String(telefono ?? "").replace(/\D/g, "") || null;

    let persona;
    if (invitacion.persona_id) {
      // Invitación atada a una persona con cuenta web: el WhatsApp del que abre
      // el link se vincula a ESA persona. Si la fila ya no existe (se unificó o
      // borró después de crear el link), cae al flujo manual por teléfono.
      const { rows } = await client.query(
        `SELECT id, auth_user_id, nombre, telefono, created_at
           FROM personas
          WHERE id = $1
          FOR UPDATE`,
        [invitacion.persona_id]
      );
      const seleccionada = rows[0] ?? null;

      if (!seleccionada) {
        persona = await resolverPersonaPorTelefono(
          client,
          invitacion,
          telefonoNormalizado
        );
      } else if (seleccionada.telefono) {
        if (
          normalizarTelefono(seleccionada.telefono) !==
          normalizarTelefono(telefono)
        ) {
          await client.query("ROLLBACK");
          return { error: "otro_telefono" };
        }
        persona = seleccionada;
      } else {
        persona = await vincularTelefonoAPersonaWeb(
          client,
          seleccionada,
          telefonoNormalizado,
          invitacion.creada_por
        );
      }
    } else {
      persona = await resolverPersonaPorTelefono(
        client,
        invitacion,
        telefonoNormalizado
      );
    }

    // El rol se resuelve contra los roles de la obra: si el nombre guardado en la
    // invitación ya no existe (o es un rol viejo), cae en el sistema equivalente.
    // Si la persona ya era miembro, ON CONFLICT/WHERE NOT EXISTS conserva su rol:
    // la invitación vincula identidad, no cambia permisos.
    const rolResuelto = await resolverRol(invitacion.obra_id, invitacion.rol);

    await client.query(
      `INSERT INTO miembros_obra (persona_id, obra_id, rol)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2
       )`,
      [persona.id, invitacion.obra_id, rolResuelto?.nombre ?? "Obrero"]
    );

    await client.query(`UPDATE invitaciones SET usada_por = $1 WHERE id = $2`, [
      persona.id,
      invitacion.id,
    ]);

    const obra = await client.query(
      `SELECT id, nombre FROM obras WHERE id = $1`,
      [invitacion.obra_id]
    );

    await client.query("COMMIT");
    return { persona, obra: obra.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error?.code === "TELEFONO_AMBIGUO") {
      return { error: "telefono_ambiguo" };
    }
    // El número pertenece a una persona con OTRA cuenta web (o el merge no
    // puede resolver la identidad): no se toca nada y se avisa.
    if (esPersonaError(error) && error.code === "PERSONA_CONFLICTO") {
      return { error: "telefono_de_otra_cuenta" };
    }
    if (esPersonaError(error) && error.code === "MIGRACION_PENDIENTE") {
      return { error: "migracion_pendiente" };
    }
    throw error;
  } finally {
    client.release();
  }
}
