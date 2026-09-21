interface ChatPeriodo {
  desde: string;
  hasta: string;
}

interface ChatSubpregunta {
  id: string;
  descripcion: string;
  tipo: string;
  periodo: ChatPeriodo | null;
  agrupar_por: string | null;
  limite: number | null;
  explicacion?: string | null;
  sql?: string | null;
  filas?: Record<string, unknown>[] | null;
  error?: string | null;
  ms?: number;
}

export interface ChatRespuesta {
  respuesta: string;
  interpretacion: string;
  necesita_aclaracion: boolean;
  subpreguntas: ChatSubpregunta[];
}
