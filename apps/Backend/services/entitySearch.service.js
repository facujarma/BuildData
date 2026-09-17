import { pool } from "../db.js";
import {
  ENTIDADES,
  aVectorLiteral,
  generarEmbeddings,
  guardarEmbeddings,
  normalizarTextoEntidad,
} from "./embeddings.service.js";

export const UMBRAL_ALTA = 0.82;
export const UMBRAL_BAJA = 0.6;
export const MARGEN_ALTA = 0.05;
export const LIMITE_DEFAULT = 5;
export const LIMITE_MAX = 10;

// Levenshtein normalizado: 1 = iguales, 0 = nada que ver.
export function similitudTexto(a, b) {
  const s = normalizarTextoEntidad(a);
  const t = normalizarTextoEntidad(b);
  if (!s && !t) return 1;
  if (!s || !t) return 0;
  if (s === t) return 1;

  const m = s.length;
  const n = t.length;
  let previos = Array.from({ length: n + 1 }, (_, j) => j);
  let actuales = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    actuales[0] = i;
    for (let j = 1; j <= n; j++) {
      const costo = s[i - 1] === t[j - 1] ? 0 : 1;
      actuales[j] = Math.min(
        previos[j] + 1,
        actuales[j - 1] + 1,
        previos[j - 1] + costo
      );
    }
    [previos, actuales] = [actuales, previos];
  }

  return 1 - previos[n] / Math.max(m, n);
}

export function combinarSimilitudes(fuzzy, vector) {
  const valores = [fuzzy, vector].filter(
    (v) => typeof v === "number" && !Number.isNaN(v)
  );
  return valores.length === 0 ? 0 : Math.max(...valores);
}

export function clasificarCandidatos(
  candidatos,
  { umbralAlta = UMBRAL_ALTA, umbralBaja = UMBRAL_BAJA, margenAlta = MARGEN_ALTA } = {}
) {
  const ordenados = [...candidatos].sort((a, b) => b.similitud - a.similitud);
  if (ordenados.length === 0) return { confianza: "ninguna", candidatos: [] };

  const [primero, segundo] = ordenados;
  const margen = segundo ? primero.similitud - segundo.similitud : 1;

  let confianza;
  if (primero.similitud >= umbralAlta && margen >= margenAlta) {
    confianza = "alta";
  } else if (primero.similitud >= umbralBaja) {
    confianza = "baja";
  } else {
    confianza = "ninguna";
  }

  return { confianza, candidatos: ordenados };
}

// Los materiales pueden ser globales (obra_id NULL); el resto es por obra.
function filtroScope(tipo, obraId, params) {
  if (tipo === "proveedor") return "true";
  params.push(obraId);
  const posicion = `$${params.length}`;
  if (tipo === "material") {
    return `(obra_id = ${posicion} OR obra_id IS NULL)`;
  }
  return `obra_id = ${posicion}`;
}

async function completarEmbeddingsFaltantes(tipo, filas) {
  const faltantes = filas
    .filter((f) => f.sin_embedding)
    .map((f) => ({ id: f.id, nombre: f.nombre }));
  if (faltantes.length === 0) return 0;
  return guardarEmbeddings(tipo, faltantes);
}

// Pipeline: exacto normalizado → fuzzy sobre todos los nombres → similitud
// vectorial (best-effort: si OpenAI falla, sigue con fuzzy). El score final por
// candidato es el máximo entre fuzzy y vector.
export async function buscarCandidatos(tipo, obraId, nombre, limite = LIMITE_DEFAULT) {
  const entidad = ENTIDADES[tipo];
  if (!entidad) throw new Error(`tipo inválido: ${tipo}`);

  const nombreNormalizado = normalizarTextoEntidad(nombre);
  const params = [];
  const filtro = filtroScope(tipo, obraId, params);

  const { rows } = await pool.query(
    `SELECT id, ${entidad.columnaNombre} AS nombre, embedding IS NULL AS sin_embedding
     FROM ${entidad.tabla}
     WHERE ${filtro}`,
    params
  );

  if (rows.length === 0) {
    return { confianza: "ninguna", candidatos: [] };
  }

  const exacto = rows.find(
    (fila) => normalizarTextoEntidad(fila.nombre) === nombreNormalizado
  );
  if (exacto) {
    return {
      confianza: "alta",
      candidatos: [{ id: exacto.id, nombre: exacto.nombre, similitud: 1 }],
    };
  }

  const porId = new Map();
  for (const fila of rows) {
    porId.set(fila.id, {
      id: fila.id,
      nombre: fila.nombre,
      similitud: similitudTexto(nombre, fila.nombre),
    });
  }

  await completarEmbeddingsFaltantes(tipo, rows);

  try {
    const [embedding] = await generarEmbeddings([nombreNormalizado]);
    if (embedding) {
      const paramsVector = [];
      const filtroVector = filtroScope(tipo, obraId, paramsVector);
      paramsVector.push(aVectorLiteral(embedding));

      const { rows: vectoriales } = await pool.query(
        `SELECT id, 1 - (embedding <=> $${paramsVector.length}::vector) AS similitud
         FROM ${entidad.tabla}
         WHERE ${filtroVector} AND embedding IS NOT NULL`,
        paramsVector
      );

      for (const fila of vectoriales) {
        const candidato = porId.get(fila.id);
        if (!candidato) continue;
        candidato.similitud = combinarSimilitudes(
          candidato.similitud,
          Number(fila.similitud)
        );
      }
    }
  } catch (error) {
    console.error(
      `[entitySearch] búsqueda vectorial falló para "${nombre}":`,
      error.message
    );
  }

  const resultado = clasificarCandidatos([...porId.values()]);
  return {
    confianza: resultado.confianza,
    candidatos: resultado.candidatos.slice(0, limite),
  };
}
