export interface Obra {
  id: string;
  name: string;
  code: string;
  address: string;
  type: string;
  status: "en-curso" | "planificacion" | "pausada" | "finalizada";
  progress: number;
  alerts: number;
  pedidos: number;
  team: string[];
  lastActivity: string;
  lastActivityWho: string;
  starred: boolean;
  color: string;
}

export interface FileItem {
  name: string;
  kind: "xlsx" | "pdf" | "img" | "doc";
  obra: string;
  when: string;
  size: string;
}

export const STATUS: Record<string, { label: string; tone: string; dot: string }> = {
  "en-curso":       { label: "En curso",       tone: "successSolid", dot: "#22C55E" },
  "planificacion":  { label: "Planificación",  tone: "info",         dot: "#3B82F6" },
  "pausada":        { label: "Pausada",        tone: "attentionSolid", dot: "#F59E0B" },
  "finalizada":     { label: "Finalizada",     tone: "slate",        dot: "#64748B" },
};
