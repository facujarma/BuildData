// Clientes de Supabase para lo que NO es SQL directo: validar logins (auth) y subir
// archivos a Storage. Las consultas a la base van por db.js (pool).

import { createClient } from "@supabase/supabase-js"; // SDK oficial de Supabase
import dotenv from "dotenv"; // lee el .env
dotenv.config(); // carga SUPABASE_URL y las claves en process.env

// Cliente normal — para auth de usuarios (respeta RLS)
// Lo usa middleware/authMiddleware.js para verificar el token que manda la web.
// La "anon key" es pública: solo puede hacer lo que permiten las reglas de seguridad (RLS).
export const supabase = createClient(
  process.env.SUPABASE_URL, // dirección del proyecto de Supabase
  process.env.SUPABASE_ANON_KEY // clave pública (sin privilegios especiales)
);

// Cliente admin — para el bot y operaciones internas (bypasea RLS)
// Lo usan los controllers que suben archivos a Storage (fotos de materiales, comprobantes,
// galería). La "service role key" tiene permisos totales: nunca se manda al navegador.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // clave privada con permisos de administrador
);
