import { supabase } from "../supabaseClient.js";
import { pool } from "../db.js";

// POST /auth/register
// Body: { email, password, nombre, telefono }
export async function register(req, res) {
  const { email, password, nombre, telefono } = req.body;

  if (!email || !password || !nombre) {
    return res.status(400).json({ error: "email, password y nombre son requeridos" });
  }

  // 1. Crear el usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error("Error registrando usuario:", error);
    return res.status(400).json({ error: error.message });
  }

  const userId = data.user.id;

  // 2. Crear/actualizar la persona asociada al auth user
  try {
    await pool.query(
      `INSERT INTO personas (auth_user_id, nombre, telefono)
       VALUES ($3, $1, $2)
       ON CONFLICT (auth_user_id) DO UPDATE SET nombre = $1, telefono = $2`,
      [nombre, telefono, userId]
    );
  } catch (dbError) {
    console.error("Error creando/actualizando persona:", dbError);
  }

  res.status(201).json({
    mensaje: "Usuario registrado. Revisá el email para confirmar la cuenta.",
    usuario: {
      id: userId,
      email: data.user.email,
    },
  });
}


// POST /auth/sync
// Header: Authorization: Bearer <token>
// Crea la persona del usuario autenticado si todavía no existe (ej: primer login con Google).
export async function syncPersona(req, res) {
  const user = req.user;
  const metadata = user.user_metadata || {};
  const nombre =
    String(
      metadata.full_name ||
        metadata.name ||
        metadata.nombre ||
        (user.email ? user.email.split("@")[0] : "Usuario")
    ).trim() || "Usuario";

  try {
    const { rows } = await pool.query(
      `INSERT INTO personas (auth_user_id, nombre)
       VALUES ($1, $2)
       ON CONFLICT (auth_user_id) DO UPDATE
         SET nombre = COALESCE(NULLIF(personas.nombre, ''), EXCLUDED.nombre)
       RETURNING *`,
      [user.id, nombre]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Error sincronizando persona:", error);
    res.status(500).json({ error: "No se pudo sincronizar el perfil" });
  }
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
// Header: Authorization: Bearer <token>
// Devuelve el usuario logueado + su perfil
export async function getMe(req, res) {
  const userId = req.user.id;
  try {
    const persona = await pool.query(
      `SELECT * FROM personas WHERE auth_user_id = $1`,
      [userId]
    );
    res.json(persona.rows);
  } catch (error) {
    console.error(error);  // acá vas a ver el error real en la terminal
    res.status(500).json({ error: error.message });  // cambiá esto temporalmente
  }
}