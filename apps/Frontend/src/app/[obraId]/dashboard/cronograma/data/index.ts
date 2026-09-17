export const TASK_STATE_MAP: Record<string, { bg: string; fg: string; label: string; tint: string; dot: string; border?: string }> = {
  done:     { bg: '#22C55E', fg: '#fff',     label: 'Completado',  tint: 'bg-success-50 text-[#15803D]',  dot: '#22C55E' },
  progress: { bg: '#0F4395', fg: '#fff',     label: 'En curso',    tint: 'bg-primary-50 text-primary',   dot: '#0F4395' },
  late:     { bg: '#EF4444', fg: '#fff',     label: 'Retraso',     tint: 'bg-critical-50 text-[#B91C1C]', dot: '#EF4444' },
  planned:  { bg: '#EFF6FF', fg: '#1D4ED8',  label: 'Programado',  border: '#3B82F6', tint: 'bg-info-50 text-[#1D4ED8]', dot: '#3B82F6' },
};

export const RUBRO_COLORS: Record<string, string> = {
  'Movimiento de suelos': '#94A3B8',
  'Hormigón armado':      '#0F4395',
  'Mampostería':          '#22C55E',
  'Instalaciones':        '#3B82F6',
};

export const FALLBACK_RUBRO_COLOR = '#94A3B8';

export function fmtDate(d: Date) {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export function fmtDateLong(d: Date) {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Número de semana ISO 8601 (1-53) para el header del Gantt.
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

// ─── Timeline dinámica ────────────────────────────────────────────────────────

export interface Timeline {
  ganttStart: Date; // lunes 00:00 de la primera semana del cronograma
  weekCount: number;
}

export const MIN_WEEK_COUNT = 12;
export const BUFFER_WEEKS = 4;

// Convierte 'yyyy-mm-dd' a Date local (evita el offset UTC de new Date(iso))
export function parseDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toMonday(d: Date): Date {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  const day = m.getDay();
  m.setDate(m.getDate() + (day === 0 ? -6 : 1 - day));
  return m;
}

function startOfDay(d: Date): Date {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  return m;
}

// Calcula la ventana del Gantt a partir de las fechas reales de las tareas:
// arranca el lunes de la semana de la tarea más antigua (o hoy si no hay
// ninguna anterior) y cubre hasta la última fecha límite + buffer.
export function computeTimeline(tasks: { startDate?: string | null; dueDate?: string | null }[]): Timeline {
  const todayMs = startOfDay(new Date()).getTime();
  let minMs: number | null = null;
  let maxMs: number | null = null;

  for (const t of tasks) {
    const s = parseDate(t.startDate)?.getTime() ?? null;
    if (s !== null && (minMs === null || s < minMs)) minMs = s;
    const e = parseDate(t.dueDate)?.getTime() ?? null;
    if (e !== null && (maxMs === null || e > maxMs)) maxMs = e;
  }

  const anchorMs = minMs !== null && minMs < todayMs ? minMs : todayMs;
  const ganttStart = toMonday(new Date(anchorMs));
  const refEndMs = maxMs !== null && maxMs > todayMs ? maxMs : todayMs;
  const weekCount = Math.max(
    MIN_WEEK_COUNT,
    Math.ceil((refEndMs - ganttStart.getTime()) / WEEK_MS) + BUFFER_WEEKS
  );
  return { ganttStart, weekCount };
}

// Fecha de la semana weekIdx (con dayOffset en días) relativa al inicio del gantt
export function weekDate(timeline: Timeline, weekIdx: number, dayOffset = 0): Date {
  const d = new Date(timeline.ganttStart);
  d.setDate(d.getDate() + weekIdx * 7 + dayOffset);
  return d;
}

// Índice de semana (puede ser negativo si la fecha es anterior al gantt)
export function weekIndexOf(timeline: Timeline, date: Date): number {
  return Math.floor((startOfDay(date).getTime() - timeline.ganttStart.getTime()) / WEEK_MS);
}

// Posición fraccionaria (en semanas) de hoy dentro de la grilla, clampeada
export function todayColumn(timeline: Timeline): number {
  const col = (Date.now() - timeline.ganttStart.getTime()) / WEEK_MS;
  return Math.max(0, Math.min(timeline.weekCount, col));
}

// ─── Modelo UI ────────────────────────────────────────────────────────────────

export interface TaskItem {
  id: string;
  name: string;
  who: string;
  start: number; // índice de semana relativo a timeline.ganttStart
  span: number;  // duración en semanas (mínimo 1)
  state: string;
  pct: number;
  desc: string;
  cost: string;
  deps: string[];
  rubro: string;
  startDate?: string;        // yyyy-mm-dd (siempre presente: NOT NULL en DB)
  dueDate?: string | null;   // yyyy-mm-dd opcional
  completedBy?: string;
  completedOn?: string;
}

export interface TaskGroup {
  rubro: string;
  items: TaskItem[];
}
