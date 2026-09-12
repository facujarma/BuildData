export interface Obra {
  obra_id: string;
  obra_nombre: string;
  rol?: string;
  joined_at?: string;
}

export interface User {
  nombre: string;
  telefono: string;
  obras: Obra[];
}
