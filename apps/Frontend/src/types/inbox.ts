export type InboxKind = "audio" | "photo" | "text";
export type InboxState = "pending" | "confirmed" | "discarded" | "error";
export type OperacionEstado =
  | "pendiente"
  | "ejecutando"
  | "ejecutada"
  | "rechazada"
  | "error";

export interface Operacion {
  id: string;
  endpoint: string;
  method: string;
  tipo: string;
  destino: string;
  campos: [string, string][];
  confianza?: number;
  comment?: string;
  estado: OperacionEstado;
  errorDetalle?: string;
  ejecutadaAt?: string;
  created_at: string;
}

export interface InboxMessage {
  id: string;
  shortId: string;
  kind: InboxKind;
  from: string;
  role: string;
  time: string;
  raw: string;
  state: InboxState;
  operaciones: Operacion[];
}
