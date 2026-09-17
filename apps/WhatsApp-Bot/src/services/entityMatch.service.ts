import type { EntidadCandidata, EntidadResuelta } from "./llm.service";

export interface CandidatoBusqueda {
  id: string;
  nombre: string;
  similitud?: number;
}

export interface ResultadoBusquedaEntidades {
  confianza: "alta" | "baja" | "ninguna";
  candidatos: CandidatoBusqueda[];
}

/**
 * Traduce la respuesta de GET /bot/entidades/buscar al contrato que espera
 * resolveSlot (EntidadResuelta):
 * - alta    → match_id del top y sin candidatos (se aplica directo)
 * - baja    → sin match y con candidatos (se encuesta al usuario)
 * - ninguna → sin match ni candidatos (auto-crear material / descartar proveedor)
 */
export function mapearResultadoBusqueda(
  resultado: ResultadoBusquedaEntidades,
): EntidadResuelta {
  const candidatos: EntidadCandidata[] = (resultado?.candidatos ?? [])
    .filter(
      (c) => c && typeof c.id === "string" && typeof c.nombre === "string",
    )
    .map((c) => ({ id: c.id, nombre: c.nombre }));

  if (resultado?.confianza === "alta" && candidatos.length > 0) {
    return { match_id: candidatos[0].id, confianza: "alta", candidatos: [] };
  }
  if (resultado?.confianza === "baja" && candidatos.length > 0) {
    return { match_id: null, confianza: "baja", candidatos };
  }
  return { match_id: null, confianza: "ninguna", candidatos: [] };
}
