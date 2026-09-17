import { ENTIDADES } from "../services/embeddings.service.js";
import {
  LIMITE_DEFAULT,
  LIMITE_MAX,
  UMBRAL_BAJA,
  buscarCandidatos,
} from "../services/entitySearch.service.js";

// GET /bot/entidades/buscar?tipo=material|proveedor|rubro|tarea&nombre=...&obra_id=...&limite=5
// Devuelve { confianza: "alta"|"baja"|"ninguna", candidatos: [{ id, nombre, similitud }] }.
// - alta/baja: solo los candidatos confiables (≥ UMBRAL_BAJA) para la encuesta.
// - ninguna: no hay match confiable, así que se devuelven igual los parecidos
//   más flojos para que el usuario elija (nunca se auto-crea/descarta por esto).
export async function buscarEntidad(req, res) {
  const { tipo, nombre } = req.query;
  const obraId = req.query.obra_id || null;

  if (!ENTIDADES[tipo]) {
    return res.status(400).json({
      error: `tipo inválido. Usar: ${Object.keys(ENTIDADES).join(", ")}`,
    });
  }
  if (typeof nombre !== "string" || !nombre.trim()) {
    return res.status(400).json({ error: "nombre es requerido" });
  }
  if (tipo !== "proveedor" && !obraId) {
    return res.status(400).json({ error: "obra_id es requerido" });
  }

  const limiteRaw = Number(req.query.limite);
  const limite =
    Number.isFinite(limiteRaw) && limiteRaw > 0
      ? Math.min(Math.trunc(limiteRaw), LIMITE_MAX)
      : LIMITE_DEFAULT;

  try {
    const resultado = await buscarCandidatos(tipo, obraId, nombre, limite);
    const candidatos =
      resultado.confianza === "ninguna"
        ? resultado.candidatos
        : resultado.candidatos.filter((c) => c.similitud >= UMBRAL_BAJA);
    res.json({ confianza: resultado.confianza, candidatos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error buscando entidad" });
  }
}
