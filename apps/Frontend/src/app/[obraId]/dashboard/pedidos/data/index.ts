import type { PillTone } from "@/components/ui/DPill";

export interface PedidoItem {
  id: string;
  mat: string;
  qty: string;
  prov: string;
  provId?: string | null;
  cat: string;
  date: string;
  dateISO?: string | null;
  ordered: string;
  state: string;
  total: number;
  unit: string;
  who: string;
  urgent: boolean;
  note: string;
  delivery?: { date: string; loc: string; receiver: string; doc: string };
}

export const STATE_MAP: Record<string, { tone: PillTone; label: string; dot: string; icon: string; step: number }> = {
  delivered: { tone: 'successSolid',   label: 'ENTREGADO',   dot: '#22C55E', icon: 'check',   step: 4 },
  transit:   { tone: 'info',           label: 'EN CAMINO',   dot: '#3B82F6', icon: 'truck',   step: 3 },
  approved:  { tone: 'primary',        label: 'APROBADO',    dot: '#0F4395', icon: 'check',   step: 2 },
  pending:   { tone: 'attentionSolid', label: 'POR APROBAR', dot: '#F59E0B', icon: 'clock',   step: 1 },
  late:      { tone: 'criticalSolid',  label: 'DEMORADO',    dot: '#EF4444', icon: 'alert',   step: 3 },
  draft:     { tone: 'slate',          label: 'BORRADOR',    dot: '#94A3B8', icon: 'edit',    step: 0 },
  cancelled: { tone: 'slate',          label: 'CANCELADO',   dot: '#94A3B8', icon: 'x',      step: 0 },
};

export const FILTERS = ['Todos', 'Por aprobar', 'En camino', 'Demorados', 'Entregados', 'Cancelados'];

export const UNITS = ['bolsas', 'u', 'm³', 'm', 'm²', 'kg', 't', 'L', 'barras', 'cajas', 'rollos', 'global'];
