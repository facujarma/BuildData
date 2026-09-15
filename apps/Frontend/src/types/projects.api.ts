/**
 * projects.api.ts
 *
 * Tipos que describen exactamente lo que devuelve el backend.
 * NO contienen lógica de presentación (colores, labels, tones de UI, etc.)
 *
 * El frontend transforma estos tipos antes de pasarlos a los componentes.
 * Importar solo en services/, nunca directamente en componentes.
 */

// ─── GET /api/obras ───────────────────────────────────────────────────────────

export interface ApiObrasResponse {
  obras: ApiObra[];
}

export interface ApiObra {
  id: string;
  name: string;
  code: string;                                               // ej: "OBR-2025-014"
  address: string;
  type: string;                                               // ej: "Edificio en altura"
  status: "en-curso" | "planificacion" | "pausada" | "finalizada";
  progress: number;                                           // 0-100
  alerts: number;
  pedidos: number;
  team: ApiTeamMember[];
  lastActivity: string;                                       // ISO 8601
  lastActivityWho: string;
  starred: boolean;
  // "color" lo asigna el FRONT según status o criterio visual, no lo manda el back
}

export interface ApiTeamMember {
  id: string;
  initials: string;           // ej: "JM"
  // Si en el futuro se necesita nombre completo o avatar, se agrega acá
}

// ─── GET /api/obras/:obraId/files ─────────────────────────────────────────────

export interface ApiFilesResponse {
  files: ApiFileItem[];
}

export interface ApiFileItem {
  id: string;                                                 // identificador único
  name: string;
  kind: "xlsx" | "pdf" | "img" | "doc";
  obraId: string;                                             // el front resuelve el nombre de obra
  obraName: string;                                           // o bien el back lo manda por conveniencia
  uploadedAt: string;                                         // ISO 8601 — el front formatea como "hace 2 h"
  size: number;                                               // en bytes — el front formatea como "1.2 MB"
  url?: string;                                               // URL de descarga si aplica
}

// ─── PATCH /api/obras/:obraId/starred ─────────────────────────────────────────

export interface ApiToggleStarredRequest {
  starred: boolean;
}

export interface ApiToggleStarredResponse {
  id: string;
  starred: boolean;
}