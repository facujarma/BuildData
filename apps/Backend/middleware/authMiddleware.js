// Middleware de autenticación: corre ANTES de cada controller de la web (server.js lo
// registra con app.use(authMiddleware)). Si el usuario no está logueado, corta acá con 401
// y el controller nunca se ejecuta. Si está logueado, deja en `req` quién es.

import { supabase } from "../supabaseClient.js"; // cliente público de Supabase, para validar el token
import { pool } from "../db.js"; // conexión a la base, para buscar la persona

// Usar en cualquier route que requiera estar logueado:
// router.get("/algo", authMiddleware, elController)

// Express llama a esta función con (req, res, next):
// - req: el pedido que llegó (headers, body, params)
// - res: la respuesta que vamos a devolver
// - next: función que pasa el control al siguiente paso (la ruta y su controller)
export async function authMiddleware(req, res, next) {
  // La web manda el header "Authorization: Bearer <token>" (lo arma authHeaders() en
  // services/pedidosService.ts del frontend con la sesión de Supabase).
  const authHeader = req.headers.authorization;

  // Sin header o con un formato raro → 401 (no autenticado) y no seguimos
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  // "Bearer abc123" → nos quedamos con "abc123"
  const token = authHeader.split(" ")[1];

  // Supabase verifica el token y devuelve el usuario
  // (le pregunta a Supabase Auth si el token es válido y no venció)
  const { data, error } = await supabase.auth.getUser(token);

  // Token inválido o vencido → 401
  if (error || !data.user) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }

  // Adjuntamos el usuario al request para usarlo en los controllers
  req.user = data.user;

  // Resolver auth_user_id → personas.id para que los controllers
  // puedan usar req.personaId al insertar en tablas que referencian personas
  // (el usuario de Supabase Auth y la fila de la tabla `personas` son cosas distintas;
  // personas.auth_user_id las une)
  try {
    const { rows } = await pool.query(
      `SELECT id FROM personas WHERE auth_user_id = $1`, // $1 se reemplaza de forma segura por el valor del array
      [data.user.id]
    );
    if (rows[0]) {
      // De acá en adelante, cualquier controller sabe quién hizo el pedido:
      // ej. esMiembroDeObra(req.personaId, ...) o usuario_id en la bitácora
      req.personaId = rows[0].id;
    }
  } catch (dbError) {
    console.error("Error resolviendo persona_id:", dbError);
  }

  next(); // todo bien: pasa al router que corresponda (ej. routes/pedidos.js)
}
