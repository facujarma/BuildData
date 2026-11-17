import { pool } from "../db.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";
import { normalizarRol } from "../services/permisos.service.js";
import {
  perfilEnObra,
  permisosEfectivos,
  puedePorNivel,
  resolverRol,
} from "../services/roles.service.js";
import {
  crearInvitacion,
  consumirInvitacion,
} from "../services/invitaciones.service.js";
import { esPersonaError, buscarPersonaPorTelefono, unificarPersonas } from "../services/personas.service.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function esUuid(valor) {
  return typeof valor === "string" && UUID_RE.test(valor);
}

// Mensaje único para no filtrar si la obra existe o si el que llama es miembro
// pero tiene un rol insuficiente: en ambos casos la respuesta es 403.
const SIN_PERMISO_EQUIPO = "No tenés permisos para administrar el equipo de esta obra";

// GET /obreros/:obra_id — obreros de una obra
export async function getObreros(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) {
      return res.status(403).json({ error: "No pertenecés a esta obra" });
    }
    let result;
    try {
      // El email vive en auth.users: la UI lo muestra para distinguir las
      // cuentas web de las personas que solo reportan por WhatsApp.
      result = await pool.query(
        `SELECT p.id, p.nombre, p.telefono, p.auth_user_id, mo.rol, mo.joined_at,
                u.email
         FROM personas p
         JOIN miembros_obra mo ON p.id = mo.persona_id
         LEFT JOIN auth.users u ON u.id = p.auth_user_id
         WHERE mo.obra_id = $1
         ORDER BY p.nombre ASC`,
        [obra_id]
      );
    } catch (error) {
      // Sin acceso al schema auth (tests/entornos restringidos) la lista sigue
      // sirviendo: email queda null y los campos de siempre no cambian.
      if (!["3F000", "42P01", "42501"].includes(error?.code)) throw error;
      result = await pool.query(
        `SELECT p.id, p.nombre, p.telefono, p.auth_user_id, mo.rol, mo.joined_at
         FROM personas p
         JOIN miembros_obra mo ON p.id = mo.persona_id
         WHERE mo.obra_id = $1
         ORDER BY p.nombre ASC`,
        [obra_id]
      );
      result = { rows: result.rows.map((fila) => ({ ...fila, email: null })) };
    }
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /bot/obreros/registrar — el bot crea un obrero y opcionalmente lo asigna a una obra
export async function registrarObrero(req, res) {
  const { nombre, telefono, obra_id, rol } = req.body;
  if (!nombre) return res.status(400).json({ code: "VALIDATION_ERROR", message: "nombre es requerido" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // El UNIQUE de personas.telefono es sobre el texto crudo: WhatsApp manda
    // 549... y la web puede tener 54... (sin el 9). Resolver por variantes antes
    // de insertar evita la segunda persona que después hay que fusionar.
    const telefonoNormalizado = String(telefono ?? "").replace(/\D/g, "") || null;
    const existente = telefonoNormalizado
      ? await buscarPersonaPorTelefono(client, telefonoNormalizado)
      : null;

    const obrero = existente
      ? { rows: [existente] } // se conserva el nombre existente: el bot no pisa datos de la web
      : await client.query(
          `INSERT INTO personas (nombre, telefono) VALUES ($1, $2) RETURNING *`,
          [nombre, telefonoNormalizado]
        );

    if (obra_id) {
      await client.query(
        `INSERT INTO miembros_obra (persona_id, obra_id, rol) VALUES ($1, $2, $3)
         ON CONFLICT (persona_id, obra_id) DO NOTHING`,
        [obrero.rows[0].id, obra_id, normalizarRol(rol)]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(obrero.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    if (esPersonaError(error)) {
      return res.status(error.code === "TELEFONO_AMBIGUO" ? 409 : 400).json({
        code: error.code,
        message: error.message,
      });
    }
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  } finally {
    client.release();
  }
}

// POST /obreros/asignar-obra — vincular obrero a una obra con rol
export async function asignarObraObrero(req, res) {
  const { obrero_id, obra_id, rol } = req.body;
  if (!obrero_id || !obra_id) return res.status(400).json({ error: "obrero_id y obra_id son requeridos" });
  try {
    // El permiso sale de roles_obra (equipo.administrar) y la jerarquía de `nivel`:
    // nadie puede otorgar un rol superior al propio (evita la escalada).
    const perfil = await perfilEnObra(req.personaId, obra_id);
    if (perfil?.permisos.web["equipo.administrar"] !== true) {
      return res.status(403).json({ error: SIN_PERMISO_EQUIPO });
    }
    const rolDestino = await resolverRol(obra_id, rol);
    if (!rolDestino) {
      return res.status(400).json({ error: "El rol indicado no existe en esta obra" });
    }
    if (!puedePorNivel(perfil.rol, rolDestino)) {
      return res.status(403).json({ error: "No podés asignar un rol superior al tuyo" });
    }

    const result = await pool.query(
      `INSERT INTO miembros_obra (persona_id, obra_id, rol)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [obrero_id, obra_id, rolDestino.nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /obreros/:obrero_id/obra/:obra_id — quitar obrero de una obra
export async function quitarObreroDeObra(req, res) {
  const { obrero_id, obra_id } = req.params;
  try {
    const perfil = await perfilEnObra(req.personaId, obra_id);
    if (perfil?.permisos.web["equipo.administrar"] !== true) {
      return res.status(403).json({ error: SIN_PERMISO_EQUIPO });
    }

    await pool.query(
      `DELETE FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2`,
      [obrero_id, obra_id]
    );
    res.json({ mensaje: "Obrero quitado de la obra" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /obreros/invitacion — crea el link cifrado y de uso único para el obrero.
// Dos modos:
//   - persona_id: la persona ya está en la obra y tiene cuenta web. El link se
//     ata a ella (sin nombre/rol del body) y al consumirse vincula su WhatsApp.
//   - nombre + telefono + rol: alta manual, como siempre.
export async function crearInvitacionWeb(req, res) {
  const { obra_id, persona_id, nombre, telefono, rol } = req.body;
  if (!obra_id || (!persona_id && !nombre)) {
    return res.status(400).json({ error: "obra_id y nombre (o persona_id) son requeridos" });
  }
  if (persona_id && !esUuid(persona_id)) {
    return res.status(400).json({ error: "persona_id inválido" });
  }

  try {
    const perfil = await perfilEnObra(req.personaId, obra_id);
    if (perfil?.permisos.web["equipo.administrar"] !== true) {
      return res.status(403).json({ error: SIN_PERMISO_EQUIPO });
    }

    let invitacion;

    if (persona_id) {
      // Persona existente: el rol sale de su membresía y no se toca. El teléfono
      // es solo el canal para enviarle el link porque todavía no lo tiene
      // cargado (si ya lo tuviera, no haría falta invitarla).
      const { rows } = await pool.query(
        `SELECT p.id, p.nombre, p.telefono, p.auth_user_id, mo.rol
           FROM personas p
           JOIN miembros_obra mo ON mo.persona_id = p.id
          WHERE p.id = $1 AND mo.obra_id = $2`,
        [persona_id, obra_id]
      );
      const persona = rows[0];

      if (!persona) {
        return res.status(404).json({ error: "La persona no pertenece a esta obra" });
      }
      if (!persona.auth_user_id) {
        return res.status(400).json({
          error: "La persona no tiene cuenta web; cargá su nombre y teléfono manualmente",
        });
      }
      if (persona.telefono) {
        return res.status(409).json({
          error: "Esa persona ya tiene WhatsApp vinculado; no hace falta invitarla",
        });
      }

      const telefonoDestino = String(telefono ?? "").trim();
      if (!telefonoDestino) {
        return res.status(400).json({ error: "El teléfono es requerido para enviar el link" });
      }

      const rolPersona = (await resolverRol(obra_id, persona.rol)) ?? {
        nombre: persona.rol || "Obrero",
      };

      invitacion = await crearInvitacion({
        obraId: obra_id,
        nombre: persona.nombre,
        telefono: telefonoDestino,
        rol: rolPersona.nombre,
        creadaPor: req.personaId || null,
        personaId: persona.id,
      });
    } else {
      const rolDestino = await resolverRol(obra_id, rol);
      if (!rolDestino) {
        return res.status(400).json({ error: "El rol indicado no existe en esta obra" });
      }
      if (!puedePorNivel(perfil.rol, rolDestino)) {
        return res.status(403).json({ error: "No podés invitar con un rol superior al tuyo" });
      }

      invitacion = await crearInvitacion({
        obraId: obra_id,
        nombre,
        telefono,
        rol: rolDestino.nombre,
        creadaPor: req.personaId || null,
      });
    }

    res.status(201).json(invitacion);
  } catch (error) {
    console.error(error);
    if (error?.code === "42703") {
      return res.status(503).json({
        error: "Falta aplicar outputs/migracion_invitaciones_persona.sql",
      });
    }
    res.status(500).json({ error: error.message });
  }
}

// POST /obreros/:obrero_id/obra/:obra_id/vincular
// Body: { persona_origen_id } — la cuenta web (con auth_user_id) que se fusiona
// en la persona del obrero (destino). El merge vive en personas.service: migra
// FKs y membresías, remapea tareas y recién al final borra el origen.
const ERRORES_UNIFICACION = {
  TELEFONO_EN_USO: { status: 409, message: "Ese teléfono ya está vinculado a otra cuenta" },
  AUTH_EN_USO: { status: 409, message: "Esa cuenta web ya está vinculada a otra persona" },
  PERSONA_CONFLICTO: { status: 409 },
  REFERENCIAS_DESCONOCIDAS: { status: 409 },
  DATOS_INVALIDOS: { status: 400 },
  MIGRACION_PENDIENTE: { status: 503 },
};

export async function vincularCuentaWeb(req, res) {
  const { obrero_id, obra_id } = req.params;
  const personaOrigenId = req.body?.persona_origen_id;

  if (!esUuid(obrero_id) || !esUuid(obra_id)) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", message: "obrero_id u obra_id inválidos" });
  }
  if (!esUuid(personaOrigenId)) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "persona_origen_id es requerido y debe ser un UUID",
    });
  }
  if (personaOrigenId === obrero_id) {
    return res.status(400).json({
      code: "MISMA_PERSONA",
      message: "El origen y el destino no pueden ser la misma persona",
    });
  }

  try {
    const { rows: personas } = await pool.query(
      `SELECT id, auth_user_id, nombre, telefono
         FROM personas
        WHERE id = ANY($1::uuid[])`,
      [[obrero_id, personaOrigenId]]
    );
    const destino = personas.find((persona) => persona.id === obrero_id) ?? null;
    const origen = personas.find((persona) => persona.id === personaOrigenId) ?? null;

    if (!destino) {
      return res.status(404).json({ code: "NOT_FOUND", message: "La persona de destino no existe" });
    }
    if (!origen) {
      return res.status(404).json({ code: "NOT_FOUND", message: "La persona de origen no existe" });
    }
    if (!origen.auth_user_id) {
      return res.status(400).json({
        code: "ORIGEN_SIN_CUENTA_WEB",
        message: "La persona de origen no tiene una cuenta web vinculada",
      });
    }
    if (destino.auth_user_id && destino.auth_user_id !== origen.auth_user_id) {
      return res.status(409).json({
        code: "DESTINO_YA_VINCULADO",
        message: "La persona de destino ya está vinculada a otra cuenta web",
      });
    }

    // Membresías de las dos personas: el merge toca todas, no solo `obra_id`.
    const { rows: membresias } = await pool.query(
      `SELECT mo.persona_id, mo.obra_id, mo.rol, o.nombre AS obra_nombre
         FROM miembros_obra mo
         JOIN obras o ON o.id = mo.obra_id
        WHERE mo.persona_id = ANY($1::uuid[])`,
      [[obrero_id, personaOrigenId]]
    );

    const destinoEnObra = membresias.some(
      (membresia) => membresia.persona_id === obrero_id && membresia.obra_id === obra_id
    );
    if (!destinoEnObra) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "El obrero no pertenece a esta obra",
      });
    }

    // El rol final por obra es el de mayor nivel: el que llama tiene que poder
    // administrar el equipo y asignar ese nivel en CADA obra afectada, no solo
    // en la del path (si no, el merge sería una escalada de permisos).
    const obras = new Map();
    for (const membresia of membresias) {
      if (!obras.has(membresia.obra_id)) {
        obras.set(membresia.obra_id, {
          obra_id: membresia.obra_id,
          obra_nombre: membresia.obra_nombre,
          niveles: [],
        });
      }
      const rol = await resolverRol(membresia.obra_id, membresia.rol);
      obras.get(membresia.obra_id).niveles.push(Number(rol?.nivel) || 10);
    }

    for (const obra of obras.values()) {
      const perfil = await perfilEnObra(req.personaId, obra.obra_id);
      if (perfil?.permisos?.web?.["equipo.administrar"] !== true) {
        return res.status(403).json({
          code: "SIN_PERMISO",
          message: `No tenés permisos para administrar el equipo de la obra "${obra.obra_nombre}"`,
        });
      }
      const nivelFinal = Math.max(...obra.niveles);
      if (!puedePorNivel(perfil.rol, { nivel: nivelFinal })) {
        return res.status(403).json({
          code: "SIN_PERMISO",
          message: `No podés unificar un rol de nivel ${nivelFinal} en la obra "${obra.obra_nombre}": es superior al tuyo`,
        });
      }
    }

    const resumen = await unificarPersonas({
      origenId: personaOrigenId,
      destinoId: obrero_id,
      ejecutadoPor: req.personaId || null,
    });

    return res.json({ mensaje: "Cuentas vinculadas", ...resumen });
  } catch (error) {
    if (esPersonaError(error)) {
      const mapeo = ERRORES_UNIFICACION[error.code] ?? {};
      return res.status(mapeo.status ?? 500).json({
        code: error.code,
        message: mapeo.message ?? error.message,
      });
    }
    console.error(error);
    return res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// POST /bot/invitaciones/consumir — el bot canjea el token cuando el obrero
// manda el link. El token se descifra y se marca usado de forma atómica.
export async function consumirInvitacionBot(req, res) {
  const { token, telefono } = req.body;
  if (!token || !telefono) {
    return res.status(400).json({ error: "token y telefono son requeridos" });
  }

  try {
    const resultado = await consumirInvitacion({ token, telefono });
    if (resultado.error === "invalido") {
      return res.status(400).json({ error: "invitación inválida" });
    }
    if (resultado.error === "usada") {
      return res.status(409).json({ error: "invitación ya usada" });
    }
    if (resultado.error === "vencida") {
      return res.status(410).json({ error: "invitación vencida" });
    }
    if (resultado.error === "otro_telefono") {
      return res.status(403).json({ error: "el teléfono no coincide con la invitación" });
    }
    if (resultado.error === "telefono_ambiguo") {
      return res.status(409).json({
        code: "TELEFONO_AMBIGUO",
        error: "hay más de una persona con ese teléfono; resolvé la duplicación antes de usar la invitación",
      });
    }
    if (resultado.error === "telefono_de_otra_cuenta") {
      return res.status(409).json({
        code: "TELEFONO_DE_OTRA_CUENTA",
        error:
          "ese teléfono ya pertenece a otra persona con cuenta web; unificá las cuentas antes de usar la invitación",
      });
    }
    if (resultado.error === "migracion_pendiente") {
      return res.status(503).json({
        code: "MIGRACION_PENDIENTE",
        error: "falta aplicar la migración de personas unificadas",
      });
    }
    res.json(resultado);
  } catch (error) {
    console.error(error);
    if (error?.code === "42703") {
      return res.status(503).json({
        code: "MIGRACION_PENDIENTE",
        error: "falta aplicar outputs/migracion_invitaciones_persona.sql",
      });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getUserByPhone(req, res) {
  const { phone } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.id, p.nombre, p.telefono, mo.obra_id, mo.rol, ob.nombre AS obra_nombre, ob.direccion
       FROM personas p
       JOIN miembros_obra mo ON p.id = mo.persona_id
       JOIN obras ob ON ob.id = mo.obra_id
       WHERE p.telefono = $1`,
      [phone]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Obrero no encontrado" });

    // Por obra: rol canónico y permisos bot efectivos (roles_obra). El bot usa esta
    // lista para avisar antes de pedir datos; la barrera dura sigue en el Backend.
    const obras = await Promise.all(result.rows.map(async (row) => {
      const efectivos = await permisosEfectivos(row.obra_id, row.rol);
      return {
        obra_id: row.obra_id,
        obra_nombre: row.obra_nombre,
        direccion: row.direccion,
        rol: efectivos.rol.nombre,
        permisos: Object.keys(efectivos.bot).filter((permiso) => efectivos.bot[permiso] === true),
      };
    }));

    const obreroData = {
      id: result.rows[0].id,
      nombre: result.rows[0].nombre,
      telefono: result.rows[0].telefono,
      obras,
    };
    res.json(obreroData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}