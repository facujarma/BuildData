// Conexión a la base de datos PostgreSQL (la de Supabase). Todos los controllers y
// services importan `pool` de acá para ejecutar SQL.

import pg from "pg"; // librería "node-postgres": el cliente que habla con Postgres
import dotenv from "dotenv"; // lee las variables de entorno del archivo .env

dotenv.config(); // carga el .env en process.env (de ahí sale DATABASE_URL)

const { Pool, types } = pg; // Pool = conjunto de conexiones reutilizables; types = cómo convertir tipos de Postgres a JS

// Fechas de calendario (DATE): llegan como string 'YYYY-MM-DD', sin Date ni TZ.
// 1082 es el código interno de Postgres para el tipo DATE. Devolverlo tal cual evita que
// una fecha se corra un día por la zona horaria.
types.setTypeParser(1082, (v) => v);

// timestamp WITHOUT time zone: el proyecto lo guarda como wall clock UTC (now() de una
// sesión UTC). node-postgres por defecto lo interpreta como hora local del proceso, lo que
// corría todos los instantes. Acá lo interpretamos explícitamente como UTC.
// 1114 es el código de Postgres para "timestamp sin zona horaria".
types.setTypeParser(1114, (v) => {
  // Pasa "2026-10-26 14:30:00.123456" a "2026-10-26T14:30:00.123" (formato ISO, máx 3 decimales)
  const limpio = v.replace(" ", "T").replace(/(\.\d{3})\d+$/, "$1");
  return new Date(`${limpio}Z`); // la "Z" final le dice a JS que la hora está en UTC
});

// timestamp WITH time zone: el parser por defecto lo resuelve bien (instante exacto).

// El pool que usa todo el backend. Dos formas de usarlo:
// - pool.query(sql, params): una consulta suelta.
// - pool.connect(): pide una conexión exclusiva para una transacción (BEGIN/COMMIT/ROLLBACK),
//   como hace pedidosController.entregarPedido.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // URL de conexión a la base (usuario, clave, host), sale del .env
});
