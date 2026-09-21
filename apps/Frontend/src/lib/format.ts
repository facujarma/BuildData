const LOCALE = "es-AR";
const DAY_MS = 86_400_000;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function startOfDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function toDate(input: string | number | Date | null | undefined): Date | null {
  if (input == null || input === "") return null;
  const d = input instanceof Date
    ? input
    : typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? parseLocalDate(input)
      : new Date(input);
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

// Convierte 'yyyy-mm-dd' a Date local (evita el offset UTC de new Date(iso))
export function parseLocalDate(ymd?: string | null): Date | null {
  if (!ymd) return null;
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

// ─── Números y moneda ─────────────────────────────────────────────────────────

export function formatNumber(n: number | string | null | undefined, decimals = 0): string {
  const v = Number(n);
  return (Number.isFinite(v) ? v : 0).toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatARS(n: number | string | null | undefined): string {
  return formatCurrency(n, "AR$");
}

// Versión abreviada para espacios reducidos (tiles, tarjetas, gráficos)
export function formatARSCompact(n: number | null | undefined): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  if (v >= 1_000_000) return `AR$ ${Math.round(v / 1_000_000)} M`;
  if (v >= 1_000) return `AR$ ${Math.round(v / 1_000)} K`;
  return `AR$ ${formatNumber(v)}`;
}

function formatCurrency(
  value: number | string | null | undefined,
  symbol: string,
  decimals = 0
): string {
  return `${symbol} ${formatNumber(value, decimals)}`;
}

// ─── Fechas ───────────────────────────────────────────────────────────────────

export function formatDateShort(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  const month = capitalize(d.toLocaleDateString(LOCALE, { month: "short" }).replace(".", ""));
  return `${String(d.getDate()).padStart(2, "0")} ${month}`;
}

export function formatDate(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  return `${formatDateShort(d)} ${d.getFullYear()}`;
}

export function formatDateLong(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  const month = d.toLocaleDateString(LOCALE, { month: "long" });
  return `${d.getDate()} de ${month} de ${d.getFullYear()}`;
}

export function formatTime(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  return d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDateTime(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  return `${formatDate(d)} · ${formatTime(d)}`;
}

export function formatMonthYear(
  input: string | number | Date | null | undefined,
  short = false
): string {
  const d = toDate(input);
  if (!d) return "";
  const month = d.toLocaleDateString(LOCALE, { month: "long" });
  return short ? `${month} ${String(d.getFullYear()).slice(2)}` : `${month} de ${d.getFullYear()}`;
}

export function formatWeekdayDate(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  return d.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });
}

// "ahora" · "hace 12 min" · "hace 3 h" · "ayer" · "hace 5 días"
export function formatRelative(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  const minutes = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

// "hoy" · "ayer" · "15 May"
export function formatRelativeDay(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  const days = Math.floor((startOfDayMs(new Date()) - startOfDayMs(d)) / DAY_MS);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  return formatDateShort(d);
}

// "Hoy" · "Ayer" · "lunes, 15 de mayo"
export function formatDayLabel(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  const days = Math.floor((startOfDayMs(new Date()) - startOfDayMs(d)) / DAY_MS);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return formatWeekdayDate(d);
}

// "Hoy · 09:40" · "Ayer · 09:40" · "15 May · 09:40"
export function formatDayTime(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  return `${formatDayLabel(d)} · ${formatTime(d)}`;
}

// "ahora" · "hace 12 min" · "hoy 10:15" · "ayer 10:15" · "15/05 10:15"
export function formatMessageTime(input: string | number | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  const minutes = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const days = Math.floor((startOfDayMs(new Date()) - startOfDayMs(d)) / DAY_MS);
  const time = formatTime(d);
  if (days === 0) return `hoy ${time}`;
  if (days === 1) return `ayer ${time}`;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${time}`;
}
