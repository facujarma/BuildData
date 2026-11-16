import { supabase } from "../supabaseClient.js";
import { pool } from "../db.js";
import {
  buscarPersonaPorTelefono,
  esPersonaError,
  vincularPersonaAuth,
} from "../services/personas.service.js";

// El teléfono del alta web no está verificado (no hay OTP): si ya existe una
// persona con ese número, NO se vincula automáticamente. Vincularlo permitiría
// que cualquiera reclame el WhatsApp de un Director y herede sus obras. Lo hace
// un Director desde Equipo (POST /obreros/:id/obra/:obra/vincular).
const TELEFONO_EN_USO = {
  code: "TELEFONO_EN_USO",
  error:
    "Ese teléfono ya está registrado. Un Director puede vincular tu cuenta desde Equipo.",
};

// POST /auth/register
// Body: { email, password, nombre, telefono }
export async function register(req, res) {
  const { email, password, nombre, telefono } = req.body;

  if (!email || !password || !nombre) {
    return res.status(400).json({ error: "email, password y nombre son requeridos" });
  }

  // 0. El teléfono del alta no está verificado. Si ya existe una persona con
  //    ese número, la cuenta web se crea SIN teléfono y queda pendiente de que
  //    un Director la vincule desde Equipo. Así no se reclama la identidad de
  //    WhatsApp de otra persona ni se duplica el teléfono.
  let telefonoPersona = telefono || null;
  let requiereVinculacion = false;
  if (telefono) {
    try {
      const existente = await buscarPersonaPorTelefono(pool, telefono);
      if (existente) {
        telefonoPersona = null;
        requiereVinculacion = true;
      }
    } catch (error) {
      if (esPersonaError(error) && error.code === "TELEFONO_AMBIGUO") {
        return res.status(409).json({
          code: "TELEFONO_AMBIGUO",
          error: "Hay más de una persona con ese teléfono: resolvé la duplicación antes de registrarte",
        });
      }
      console.error("[auth] error verificando el teléfono del registro:", error);
      return res.status(500).json({
        code: "SERVER_ERROR",
        message: "No se pudo validar el teléfono del registro",
      });
    }
  }

  // 1. Crear el usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error("Error registrando usuario:", error);
    return res.status(400).json({ error: error.message });
  }

  const userId = data?.user?.id;
  if (!userId) {
    console.error("[auth] signUp no devolvió usuario");
    return res.status(500).json({ code: "SERVER_ERROR", message: "No se pudo crear el usuario" });
  }

  // 2. Crear la persona web en una transacción. Si el teléfono estaba libre se
  //    guarda; si ya existía, va null y la cuenta queda pendiente de que un
  //    Director la vincule con la persona de WhatsApp.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const persona = await vincularPersonaAuth({
      authUserId: userId,
      nombre,
      telefono: telefonoPersona,
      permitirVinculoPorTelefono: false,
      client,
    });
    if (!persona?.id) throw new Error("No se pudo resolver la persona del usuario");
    await client.query("COMMIT");
  } catch (dbError) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Si la conexión ya está rota, el error original es el que importa.
    }
    if (esPersonaError(dbError)) {
      if (dbError.code === "TELEFONO_EN_USO") {
        return res.status(409).json(TELEFONO_EN_USO);
      }
      if (dbError.code === "AUTH_EN_USO") {
        return res.status(409).json({
          code: "AUTH_EN_USO",
          error: "Esa cuenta web ya está vinculada a otra persona",
        });
      }
      if (dbError.code === "TELEFONO_AMBIGUO") {
        return res.status(409).json({
          code: "TELEFONO_AMBIGUO",
          error: "Hay más de una persona con ese teléfono: resolvé la duplicación antes de registrarte",
        });
      }
      if (dbError.code === "MIGRACION_PENDIENTE") {
        return res.status(503).json({
          code: "MIGRACION_PENDIENTE",
          error: "Falta aplicar la migración de personas unificadas",
        });
      }
    }
    console.error("[auth] error vinculando la persona del registro:", dbError);
    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "No se pudo crear el perfil del usuario",
    });
  } finally {
    client.release();
  }

  res.status(201).json({
    mensaje: requiereVinculacion
      ? "Usuario registrado. Tu teléfono ya está en uso por WhatsApp: un Director puede vincular tu cuenta desde Equipo."
      : "Usuario registrado. Revisá el email para confirmar la cuenta.",
    requiere_vinculacion: requiereVinculacion,
    usuario: {
      id: userId,
      email: data.user.email,
    },
  });
}


// POST /auth/login
// Body: { email, password }
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email y password son requeridos" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  res.json({
    token: data.session.access_token,   // este token lo mandan en cada request como Bearer
    refresh_token: data.session.refresh_token,
    usuario: {
      id: data.user.id,
      email: data.user.email,
    },
  });
}


// POST /auth/logout
// Header: Authorization: Bearer <token>
export async function logout(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ error: "Token requerido" });
  }

  const { error } = await supabase.auth.signOut(token);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ mensaje: "Sesión cerrada" });
}


// GET /auth/me
// Header: Authorization: Bearer ***
// Devuelve el perfil del usuario logueado. El middleware ya resolvió
// `req.personaId`; si todavía no existe la fila se busca por auth_user_id y se
// devuelve la lista vacía (mismo contrato de array que consume AuthContext).
export async function getMe(req, res) {
  try {
    const persona = req.personaId
      ? await pool.query(`SELECT * FROM personas WHERE id = $1`, [req.personaId])
      : await pool.query(`SELECT * FROM personas WHERE auth_user_id = $1`, [req.user?.id]);
    res.json(persona.rows);
  } catch (error) {
    console.error("[auth] error en getMe:", error);
    res.status(500).json({ code: "SERVER_ERROR", message: "No se pudo obtener el perfil" });
  }
}