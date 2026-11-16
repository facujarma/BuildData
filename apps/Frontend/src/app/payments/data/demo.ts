// Modo demo de la página de planes (/payments).
//
// Mientras `DEMO_ACTIVO` sea `true` la página NO publica precios: cada plan se
// muestra bloqueado con la etiqueta "Demo" y el contacto es por email. Los
// precios siguen en `plans.ts` para cuando se publique la compra online
// (alcanza con poner el flag en `false`).
export const DEMO_ACTIVO = true;

/** Las dos casillas válidas para pedir acceso o asistencia. */
export const DEMO_EMAILS = ["info@builddata.com.ar", "facundojarma@gmail.com"] as const;

export const DEMO_ASUNTO = "Quiero probar BuildData (demo)";

/** `mailto:` con las dos casillas y el asunto ya escapado. */
export function mailtoDemo(asunto: string = DEMO_ASUNTO): string {
  return `mailto:${DEMO_EMAILS.join(",")}?subject=${encodeURIComponent(asunto)}`;
}

/** Límites de la demo, en el orden en que se muestran. */
export const DEMO_LIMITES = [
  "1 obra activa por cuenta",
  "Hasta 5 personas en el equipo",
  "100 mensajes del bot por mes",
] as const;
