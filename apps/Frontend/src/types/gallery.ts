export interface GalleryPhoto {
  id: string;
  url: string;
  taskId: string | null;
  task: string; // "Sin tarea" si no está asociada
  rubro: string; // "Sin rubro" si no hay
  who: string;
  date: string; // etiqueta de día ("Hoy", "Ayer", "18 Ago")
  time: string; // HH:MM
  tone: string; // color del rubro
  note: string;
  flag?: string;
  origen: "web" | "whatsapp";
  fileName: string;
}
