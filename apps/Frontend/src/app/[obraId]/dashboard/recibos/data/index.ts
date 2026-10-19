export interface ReciboItem {
  id: string;
  concept: string;
  prov: string;
  cat: string;
  rubroId: string | null;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: string; // ARS | USD
  status: "pagado" | "pendiente";
  file: string; // nombre del archivo adjunto ("" si no tiene)
  fileUrl: string;
}

export const CATEGORIES = ['Materiales', 'Mano de obra', 'Equipos', 'Logística', 'Servicios'];

// Archivos que acepta POST /gastos/:id/archivo
export const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
