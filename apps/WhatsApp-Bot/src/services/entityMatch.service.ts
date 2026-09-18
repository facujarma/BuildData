export interface EntidadCandidata {
  id: string;
  nombre: string;
}

export interface EntidadResuelta {
  match_id: string | null;
  confianza: "alta" | "baja" | "ninguna";
  candidatos: EntidadCandidata[];
}

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
 * - alta    → match_id del top (con el top entre los candidatos, para el nombre
 *             legible del action_executed)
 * - baja    → sin match y con los candidatos confiables (se encuesta al usuario)
 * - ninguna → sin match, pero con los parecidos más flojos para que el usuario
 *             elija; solo queda sin opciones si el catálogo está vacío.
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
    return {
      match_id: candidatos[0].id,
      confianza: "alta",
      candidatos: [candidatos[0]],
    };
  }
  if (candidatos.length > 0) {
    return {
      match_id: null,
      confianza: resultado?.confianza === "baja" ? "baja" : "ninguna",
      candidatos,
    };
  }
  return { match_id: null, confianza: "ninguna", candidatos: [] };
}
