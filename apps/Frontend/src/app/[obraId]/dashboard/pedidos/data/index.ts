import type { PillTone } from "@/components/ui/DPill";

export interface PedidoItem {
  id: string;
  mat: string;
  qty: string;
  prov: string;
  cat: string;
  date: string;
  ordered: string;
  state: string;
  total: number;
  unit: string;
  who: string;
  urgent: boolean;
  note: string;
  delivery?: { date: string; loc: string; receiver: string; doc: string };
}

export const ORDERS: PedidoItem[] = [
  { id: 'PED-0142', mat: 'Cemento Portland · 50 kg',  qty: '120 bolsas', prov: 'Cementos del Plata', cat: 'Áridos y cementos', date: '15 Jun', ordered: '08 Jun', state: 'delivered',  total: 920000, unit: 'AR$ 7.667', who: 'L. Benítez', urgent: false, note: 'Entrega completa. Descargado en Depósito A.', delivery: { date: '15 Jun 2026 · 09:40', loc: 'Depósito A · acceso lateral', receiver: 'C. Ríos', doc: 'DNI 28.114.502' } },
  { id: 'PED-0141', mat: 'Hierro 12 mm · 12 m',       qty: '2,5 t',     prov: 'Aceros Norte',        cat: 'Hierros',           date: '18 Jun', ordered: '10 Jun', state: 'transit',    total: 1250000, unit: 'AR$ 500.000/t', who: 'L. Benítez', urgent: false, note: 'Despachado. Llega en 2 días.' },
  { id: 'PED-0140', mat: 'Ladrillo cerámico 18×18',   qty: '8.000 u',   prov: 'Cerámica San Pedro',  cat: 'Mampostería',       date: '22 Jun', ordered: '11 Jun', state: 'pending',    total: 920000, unit: 'AR$ 115/u', who: 'P. Salas', urgent: true, note: 'Bloquea inicio de tabiquería. Necesita aprobación hoy.' },
  { id: 'PED-0139', mat: 'Arena fina',                 qty: '15 m³',    prov: 'Áridos Río',           cat: 'Áridos y cementos', date: '13 Jun', ordered: '05 Jun', state: 'late',       total: 315000, unit: 'AR$ 21.000/m³', who: 'C. Ríos', urgent: true, note: 'Entrega prevista para el 11 Jun no llegó. Proveedor confirmó retraso de 24-48 h; nueva fecha estimada 13 Jun.' },
  { id: 'PED-0138', mat: 'Pintura látex blanco',      qty: '40 L',     prov: 'Pinturas Capital',     cat: 'Terminaciones',     date: '02 Jul', ordered: '09 Jun', state: 'approved',   total: 145000, unit: 'AR$ 3.625/L', who: 'M. Ortiz', urgent: false, note: 'Aprobado. Pendiente de despacho del proveedor.' },
  { id: 'PED-0137', mat: 'Cable subterráneo 3×6 mm',  qty: '200 m',    prov: 'Eléctrica Plaza',      cat: 'Eléctrico',         date: '08 Jul', ordered: '07 Jun', state: 'draft',      total: 380000, unit: 'AR$ 1.900/m', who: 'M. Ortiz', urgent: false, note: 'Borrador — falta confirmar metraje final.' },
];

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

export const PEOPLE = ['L. Benítez', 'C. Ríos', 'P. Salas', 'M. Ortiz'];

export const UNITS = ['bolsas', 'u', 'm³', 'm', 'm²', 'kg', 't', 'L', 'barras', 'cajas', 'rollos', 'global'];

export function fmtCurrency(n: number) {
  return 'AR$ ' + (Number(n) || 0).toLocaleString('es-AR');
}
