import { ComprobanteData, FacturaData } from "../services/vision.service";
import { Obra } from "../types/api.types";
import type { EntityQuestion } from "../services/entityResolution.service";
import type { MissingField } from "../services/endpointSchema";

export interface ApiCall {
  endpoint: string;
  method: "POST" | "GET" | "PATCH";
  data: Record<string, unknown>;
  comment?: string;
  confianza?: number;
  error?: string;
  // Nombres legibles de las entidades resueltas (material_id → "Cemento Portland").
  // Clave: path del campo en data (ej: "items[0].material_id" o "rubro_id").
  display?: Record<string, string>;
}

export type PendingQuery =
  | {
      type: "operation";
      operation: ApiCall[];
      obra_id?: string;
      contenido?: string;
      tipo_mensaje?: string;
      mensaje_id?: string;
    }
  | { type: "comprobante"; data: ComprobanteData; obra_id?: string; contenido?: string; tipo_mensaje?: string; mensaje_id?: string }
  | { type: "factura"; data: FacturaData; obra_id?: string; contenido?: string; tipo_mensaje?: string; mensaje_id?: string };

const pendingQueries = new Map<string, PendingQuery>();

export function setPending(phone: string, query: PendingQuery): void {
  pendingQueries.set(phone, query);
}

export function getPending(phone: string): PendingQuery | undefined {
  return pendingQueries.get(phone);
}

export function clearPending(phone: string): void {
  pendingQueries.delete(phone);
}

export function hasPending(phone: string): boolean {
  return pendingQueries.has(phone);
}

// ──────────────────────────────────────────
// Estado de encuestas de entidad (materiales/proveedores/rubros)
// ──────────────────────────────────────────

export interface EntityPending {
  pending: PendingQuery;
  obra: Obra;
  chatId: string;
  question: EntityQuestion;
}

const entityPending = new Map<string, EntityPending>();

export function setEntityPending(phone: string, state: EntityPending): void {
  entityPending.set(phone, state);
}

export function getEntityPending(phone: string): EntityPending | undefined {
  return entityPending.get(phone);
}

export function clearEntityPending(phone: string): void {
  entityPending.delete(phone);
}

export function hasEntityPending(phone: string): boolean {
  return entityPending.has(phone);
}

// ──────────────────────────────────────────
// Estado de repregunta (datos faltantes)
// ──────────────────────────────────────────

export interface Clarification {
  ops: ApiCall[];
  originalText: string;
  tipoMensaje: string;
  missing: MissingField[];
  history: { question: string; answer: string }[];
  pendingQuestion: string;
  pendingFieldPath: string | null;
  attempts: number;
  createdAt: number;
}

const clarifications = new Map<string, Clarification>();

export function setClarification(phone: string, state: Clarification): void {
  clarifications.set(phone, state);
}

export function getClarification(phone: string): Clarification | undefined {
  return clarifications.get(phone);
}

export function clearClarification(phone: string): void {
  clarifications.delete(phone);
}

export function hasClarification(phone: string): boolean {
  return clarifications.has(phone);
}