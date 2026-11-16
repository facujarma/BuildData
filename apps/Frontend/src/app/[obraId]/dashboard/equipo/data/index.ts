export interface Person {
  // `id` es la persona de `miembros_obra`: lo usa la vinculación de cuentas
  // (POST /obreros/:id/obra/:obraId/vincular) para elegir el origen del merge.
  id: string;
  who: string;
  name: string;
  email?: string | null;
  role: string;
  tasks: number;
  reports: number;
}

export interface Obrero {
  id: string;
  name: string;
  phone: string;
  link: string;
  sent: boolean;
  rol: string;
}

// Payload de `onSave` del InviteTeamModal: solo existe cuando
// POST /obreros/invitacion devolvió 201 y se generó el link.
export interface InvitacionObreroCreada {
  nombre: string;
  telefono: string;
  rol: string;
  link: string;
}

export const ROLES = [
  'Cliente',
  'Obrero',
  'Seguridad e Higiene',
  'Capataz',
  'Administrativo',
  'Director',
];
