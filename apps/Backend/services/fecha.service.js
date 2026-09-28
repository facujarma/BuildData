export const TZ_NEGOCIO = "America/Argentina/Buenos_Aires";

// Fecha de calendario de "hoy" en la TZ del negocio (YYYY-MM-DD).
export function hoyISO(tz = TZ_NEGOCIO) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
