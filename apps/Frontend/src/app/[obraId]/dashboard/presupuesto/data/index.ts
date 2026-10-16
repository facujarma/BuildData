import { formatNumber } from "@/lib/format";

export interface BudgetLine {
  rubroId: string;
  name: string;
  cap: number;
  spent: number;
  comp: number;
}

export const CURRENCIES = {
  ARS: { sym: 'AR$', rate: 1,        dec: 0 },
  USD: { sym: 'US$', rate: 1 / 1050,   dec: 2 },
  EUR: { sym: '€',   rate: 1 / 1140,   dec: 2 },
};

export type CurrencyKey = keyof typeof CURRENCIES;

export function formatMoney(millonesArs: number, cur: CurrencyKey): string {
  const c = CURRENCIES[cur];
  // Con montos reales hay rubros de menos de 10 M: un decimal para no mostrar "0 M"
  if (cur === 'ARS') return `${c.sym} ${formatNumber(millonesArs, Math.abs(millonesArs) < 10 ? 1 : 0)} M`;
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

export interface ForecastItem {
  month: string;
  label: string;
  items: string[];
  amount: number; // millones ARS
}

