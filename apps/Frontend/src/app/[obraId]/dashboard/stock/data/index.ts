export interface StockItem {
  id: string;
  name: string;
  cat: string;
  unit: string;
  qty: number;
  min: number;
  loc: string;
  photo: string;
}

const CAT_PALETTE = ['#0F4395', '#22C55E', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#94A3B8'];

// Color estable por categoría (las categorías son dinámicas: se derivan del nombre)
export function catColor(cat: string): string {
  if (!cat) return '#94A3B8';
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) >>> 0;
  return CAT_PALETTE[h % CAT_PALETTE.length];
}

export function getStatus(item: StockItem) {
  if (item.qty <= 0) return 'out';
  if (item.qty < item.min) return 'low';
  return 'ok';
}

export const STAT_LABELS: Record<string, { label: string; tone: string; dot: string }> = {
  ok:  { label: 'OK',      tone: 'success',        dot: '#22C55E' },
  low: { label: 'BAJO',    tone: 'attentionSolid', dot: '#F59E0B' },
  out: { label: 'SIN STOCK', tone: 'criticalSolid', dot: '#EF4444' },
};
