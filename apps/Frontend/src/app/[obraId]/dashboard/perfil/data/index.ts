interface PerfilPermiso {
  label: string;
  on: boolean;
  area: string;
}

interface PerfilActividad {
  icon: string;
  tint: string;
  text: string;
  when: string;
}

export interface PerfilData {
  who: string;
  first: string;
  last: string;
  role: string;
  roleKey: string;
  email: string;
  phone: string;
  since: string;
  bio: string;
  tasks: number;
  reports: number;
  orders: number;
  alerts: number;
  prefs: { avatarInReports: boolean; compact: boolean; lightTone: boolean };
  perms: PerfilPermiso[];
  activity: PerfilActividad[];
}

export const PERFIL_SEED: PerfilData = {
  who: "JM",
  first: "Juan",
  last: "Méndez",
  role: "Director de obra",
  roleKey: "director",
  email: "juan.mendez@constructora-norte.com.ar",
  phone: "+54 11 5234 8821",
  since: "Marzo 2025",
  bio: "Director de obra con 12 años en construcción de edificios residenciales. Especializado en hormigón armado y coordinación de cuadrillas.",
  tasks: 14,
  reports: 38,
  orders: 22,
  alerts: 9,
  prefs: { avatarInReports: true, compact: false, lightTone: true },
  perms: [
    { label: "Aprobar pedidos de material", on: true, area: "Acción" },
    { label: "Gestionar el cronograma", on: true, area: "Acción" },
    { label: "Invitar y remover personas", on: true, area: "Administración" },
    { label: "Ver costos y facturación", on: true, area: "Administración" },
    { label: "Editar configuración de la obra", on: true, area: "Administración" },
    { label: "Reportar avances desde WhatsApp", on: true, area: "Operativo" },
  ],
  activity: [
    { icon: "check", tint: "bg-success-50 text-[#15803D]", text: "Marcó completada Hormigonado losa +3", when: "hoy 08:42" },
    { icon: "package", tint: "bg-attention-50 text-[#A16207]", text: "Aprobó el pedido PED-0142 (Cemento)", when: "ayer 17:30" },
    { icon: "alert", tint: "bg-critical-50 text-[#B91C1C]", text: "Asignó técnico a falla de Grúa Torre 2", when: "ayer 14:12" },
    { icon: "persons", tint: "bg-info-50 text-[#1D4ED8]", text: "Invitó a M. Ortiz al equipo", when: "12 May" },
    { icon: "calendar", tint: "bg-primary-50 text-primary", text: "Actualizó fechas del cronograma", when: "08 May" },
  ],
};