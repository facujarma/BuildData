import { formatNumber } from "@/lib/format";

export interface BudgetLine {
  name: string;
  cap: number;
  spent: number;
  comp: number;
}

export const BUDGET_LINES: BudgetLine[] = [
  { name: 'Hormigón armado',  cap: 52, spent: 38, comp: 6 },
  { name: 'Mampostería',      cap: 20, spent: 21, comp: 0 },
  { name: 'Instalaciones',    cap: 24, spent: 9,  comp: 5 },
  { name: 'Terminaciones',    cap: 18, spent: 6,  comp: 2 },
  { name: 'Movimiento de suelos', cap: 10, spent: 7, comp: 2 },
];

export const CURRENCIES = {
  ARS: { sym: 'AR$', rate: 1,        dec: 0 },
  USD: { sym: 'US$', rate: 1 / 1050,   dec: 2 },
  EUR: { sym: '€',   rate: 1 / 1140,   dec: 2 },
};

export type CurrencyKey = keyof typeof CURRENCIES;

export function formatMoney(millonesArs: number, cur: CurrencyKey): string {
  const c = CURRENCIES[cur];
  if (cur === 'ARS') return `${c.sym} ${formatNumber(millonesArs)} M`;
  return `${c.sym} ${formatNumber(millonesArs * c.rate, 2)} M`;
}

const RUBRO_COLORS: Record<string, string> = {
  'Hormigón armado':     '#0F4395',
  'Mampostería':         '#F59E0B',
  'Instalaciones':       '#22C55E',
  'Terminaciones':       '#EF4444',
  'Movimiento de suelos': '#3B82F6',
};

const RUBRO_FALLBACK = ['#0F4395', '#F59E0B', '#22C55E', '#EF4444', '#3B82F6'];

export function rubroColor(name: string, idx = 0): string {
  return RUBRO_COLORS[name] ?? RUBRO_FALLBACK[idx % RUBRO_FALLBACK.length];
}

export const FORECAST_ITEMS = [
  { month: 'Jun', label: 'Este mes', items: ['Hormigón armado cierra compra de hierro'], amount: 14 },
  { month: 'Jul', label: 'Próximo', items: ['Pico de mampostería + inicio instalaciones'], amount: 22 },
  { month: 'Ago', label: 'En 2 meses', items: ['Terminaciones arranca (mayor desembolso)'], amount: 28 },
];

