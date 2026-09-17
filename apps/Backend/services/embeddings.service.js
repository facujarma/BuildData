import { pool } from "../db.js";

const MODELO_DEFAULT = "text-embedding-3-small";
const URL_OPENAI = "https://api.openai.com/v1/embeddings";
const TIMEOUT_MS = 8000;
const LOTE_MAX = 100;

// Tipos de entidad resolubles: tabla y columna que guarda el nombre visible.
// Los nombres de tabla/columna salen de acá (nunca de input del usuario), por eso
// se pueden interpolar en el SQL de forma segura.
export const ENTIDADES = {
  material: { tabla: "materiales", columnaNombre: "nombre" },
  proveedor: { tabla: "proveedores", columnaNombre: "nombre" },
  rubro: { tabla: "rubros", columnaNombre: "nombre" },
  tarea: { tabla: "tareas", columnaNombre: "titulo" },
};

export function modeloEmbeddings() {
  return process.env.OPENAI_EMBEDDING_MODEL || MODELO_DEFAULT;
}

export function normalizarTextoEntidad(texto) {
  return String(texto ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function aVectorLiteral(vector) {
  return `[${vector.join(",")}]`;
}

// Llama a la API de embeddings de OpenAI en lotes y devuelve los vectores en el
// mismo orden que los textos. Lanza error si la API falla (los callers deciden).
export async function generarEmbeddings(textos) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada");

  const resultados = [];

  for (let i = 0; i < textos.length; i += LOTE_MAX) {
    const lote = textos.slice(i, i + LOTE_MAX);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(URL_OPENAI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: modeloEmbeddings(), input: lote }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detalle = await res.text().catch(() => "");
        throw new Error(`OPENAI_ERROR ${res.status}: ${detalle.slice(0, 200)}`);
      }

      const data = await res.json();
      const ordenados = [...data.data].sort((a, b) => a.index - b.index);
      resultados.push(...ordenados.map((d) => d.embedding));
    } finally {
      clearTimeout(timeout);
    }
  }

  return resultados;
}

// Best-effort: nunca lanza. Si el embedding falla, la fila queda con embedding
// NULL y se reintenta después (backfill o auto-reparación en la búsqueda).
export async function guardarEmbedding(tipo, id, nombre) {
  const entidad = ENTIDADES[tipo];
  if (!entidad || !id || !nombre) return false;

  try {
    const [vector] = await generarEmbeddings([normalizarTextoEntidad(nombre)]);
    if (!vector) return false;

    await pool.query(
      `UPDATE ${entidad.tabla}
       SET embedding = $1::vector, embedding_model = $2, embedding_updated_at = now()
       WHERE id = $3`,
      [aVectorLiteral(vector), modeloEmbeddings(), id]
    );
    return true;
  } catch (error) {
    console.error(`[embeddings] no se pudo embeber ${tipo} ${id}:`, error.message);
    return false;
  }
}

export async function guardarEmbeddings(tipo, filas) {
  const entidad = ENTIDADES[tipo];
  if (!entidad) return 0;

  const validas = (filas ?? []).filter((f) => f && f.id && f.nombre);
  if (validas.length === 0) return 0;

  let guardadas = 0;

  for (let i = 0; i < validas.length; i += LOTE_MAX) {
    const lote = validas.slice(i, i + LOTE_MAX);
    try {
      const vectores = await generarEmbeddings(
        lote.map((f) => normalizarTextoEntidad(f.nombre))
      );

      for (let j = 0; j < lote.length; j++) {
        if (!vectores[j]) continue;
        await pool.query(
          `UPDATE ${entidad.tabla}
           SET embedding = $1::vector, embedding_model = $2, embedding_updated_at = now()
           WHERE id = $3`,
          [aVectorLiteral(vectores[j]), modeloEmbeddings(), lote[j].id]
        );
        guardadas++;
      }
    } catch (error) {
      console.error(`[embeddings] lote de ${tipo} falló:`, error.message);
    }
  }

  return guardadas;
}

