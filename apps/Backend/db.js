import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool, types } = pg;

// Fechas de calendario (DATE): llegan como string 'YYYY-MM-DD', sin Date ni TZ.
types.setTypeParser(1082, (v) => v);

// timestamp WITHOUT time zone: el proyecto lo guarda como wall clock UTC (now() de una
// sesión UTC). node-postgres por defecto lo interpreta como hora local del proceso, lo que
// corría todos los instantes. Acá lo interpretamos explícitamente como UTC.
types.setTypeParser(1114, (v) => {
  const limpio = v.replace(" ", "T").replace(/(\.\d{3})\d+$/, "$1");
  return new Date(`${limpio}Z`);
});

// timestamp WITH time zone: el parser por defecto lo resuelve bien (instante exacto).

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});