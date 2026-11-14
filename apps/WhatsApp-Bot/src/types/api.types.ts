export interface Obra {
  obra_id: string;
  obra_nombre: string;
  direccion?: string;
  rol?: string;
  // Keys bot en true para esta persona en esta obra (GET /bot/obreros/telefono).
  // Puede faltar si el Backend es viejo: ahí se usa la matriz estática del rol.
  permisos?: string[];
  joined_at?: string;
}

export interface User {
  nombre: string;
  telefono: string;
  obras: Obra[];
}
