import type { GalleryPhoto } from "@/types/gallery";

export const PHOTO_SEED: GalleryPhoto[] = [
  { id: "F-341", task: "Columnas eje 4-6",     rubro: "Hormigón armado", who: "C. Ríos",    date: "Hoy",    time: "10:15", tone: "#0F4395", note: "Armado de columnas antes del colado." },
  { id: "F-340", task: "Columnas eje 4-6",     rubro: "Hormigón armado", who: "C. Ríos",    date: "Hoy",    time: "10:14", tone: "#0F4395", note: "Detalle de estribos." },
  { id: "F-339", task: "Columnas eje 4-6",     rubro: "Hormigón armado", who: "C. Ríos",    date: "Hoy",    time: "10:13", tone: "#0F4395", note: "" },
  { id: "F-338", task: "Columnas eje 4-6",     rubro: "Hormigón armado", who: "C. Ríos",    date: "Hoy",    time: "10:12", tone: "#0F4395", note: "" },
  { id: "F-337", task: "Hormigonado losa +3",  rubro: "Hormigón armado", who: "L. Benítez", date: "Hoy",    time: "08:42", tone: "#0F4395", note: "Losa terminada, 28 m³." },
  { id: "F-336", task: "Tabiquería interior",  rubro: "Mampostería",     who: "P. Salas",   date: "Ayer",   time: "16:20", tone: "#22C55E", note: "Avance de tabiques planta 2." },
  { id: "F-335", task: "Tabiquería interior",  rubro: "Mampostería",     who: "P. Salas",   date: "Ayer",   time: "16:18", tone: "#22C55E", note: "" },
  { id: "F-334", task: "Andamio perimetral",   rubro: "Mampostería",     who: "A. Gómez",   date: "Ayer",   time: "11:30", tone: "#22C55E", note: "Baranda colocada — alerta AL-056 resuelta.", flag: "Evidencia de alerta" },
  { id: "F-333", task: "Tendido eléctrico",    rubro: "Instalaciones",   who: "M. Ortiz",   date: "18 Ago", time: "14:05", tone: "#3B82F6", note: "Cañería corrugada en losa." },
  { id: "F-332", task: "Hormigonado losa +3",  rubro: "Hormigón armado", who: "L. Benítez", date: "18 Ago", time: "09:10", tone: "#0F4395", note: "Encofrado listo." },
  { id: "F-331", task: "Excavación general",   rubro: "Movimiento de suelos", who: "C. Ríos", date: "12 Ago", time: "07:50", tone: "#94A3B8", note: "Cota de fondo alcanzada." },
  { id: "F-330", task: "Cimentación pilotes",  rubro: "Movimiento de suelos", who: "C. Ríos", date: "12 Ago", time: "07:45", tone: "#94A3B8", note: "Ensayo PIT aprobado.", flag: "Documentación técnica" },
];

export const RUBRO_COLORS: Record<string, string> = {
  "Movimiento de suelos": "#94A3B8",
  "Hormigón armado": "#0F4395",
  "Mampostería": "#22C55E",
  "Instalaciones": "#3B82F6",
};