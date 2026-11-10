import type { PillTone } from "@/components/ui/DPill";

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

export const STATUS: Record<Obra["status"], { label: string; tone: PillTone; dot: string }> = {
  "en-curso":       { label: "En curso",       tone: "successSolid", dot: "#22C55E" },
  "planificacion":  { label: "Planificación",  tone: "info",         dot: "#3B82F6" },
  "pausada":        { label: "Pausada",        tone: "attentionSolid", dot: "#F59E0B" },
  "finalizada":     { label: "Finalizada",     tone: "slate",        dot: "#64748B" },
};

/** Datos que viajan entre los pasos del alta de obra. */
export interface WizardRubro {
  id: string;
  name: string;
  amount: string;
}

export interface WizardClient {
  name: string;
  contact: string;
  cuit: string;
  email: string;
  phone: string;
  notes: string;
}

export interface WizardData {
  name: string;
  code: string;
  status: string;
  type: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  team: string[];
  teamRoles: Record<string, string>;
  startDate: string;
  endDate: string;
  client: WizardClient;
  budgetTotal: string;
  rubros: WizardRubro[];
}
