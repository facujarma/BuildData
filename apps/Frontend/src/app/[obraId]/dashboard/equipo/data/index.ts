export interface Person {
  who: string;
  name: string;
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
