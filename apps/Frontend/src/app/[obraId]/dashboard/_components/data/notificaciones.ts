export type NotifKind =
  | "invite"
  | "critical"
  | "order"
  | "delivery"
  | "budget"
  | "activity";

export interface NotifItem {
  id: string;
  kind: NotifKind;
  read: boolean;
  time: string;
  icon?: string;
  tint?: string;
  title?: string;
  text?: string;
  by?: string;
  obra?: string;
  role?: string;
  resolved?: "accepted" | "rejected";
}

export const NOTIF_SEED: NotifItem[] = [
  { id: "n1", kind: "invite", read: false, time: "hace 5 min", obra: "Torre Rivadavia", by: "M. Sosa", role: "Capataz", text: "te invitó a sumarte a la obra" },
  { id: "n2", kind: "critical", read: false, time: "hace 12 min", icon: "alert", tint: "bg-critical-50 text-[#B91C1C]", title: "Alerta crítica", text: "Falla en Grúa Torre 2 · Edificio Belgrano" },
  { id: "n3", kind: "order", read: false, time: "hace 1 h", icon: "package", tint: "bg-attention-50 text-[#A16207]", title: "Pedido por aprobar", text: "PED-0140 · Ladrillo cerámico espera tu aprobación" },
  { id: "n4", kind: "delivery", read: true, time: "hace 3 h", icon: "truck", tint: "bg-info-50 text-[#1D4ED8]", title: "Entrega registrada", text: "Cemento × 120 bolsas recibido por C. Ríos" },
  { id: "n5", kind: "budget", read: true, time: "ayer", icon: "dollar", tint: "bg-primary-50 text-primary", title: "Aviso de presupuesto", text: "Mampostería superó su tope en 5%" },
  { id: "n6", kind: "activity", read: true, time: "ayer", icon: "check", tint: "bg-success-50 text-[#15803D]", title: "Tarea completada", text: "L. Benítez marcó “Hormigonado losa +3”" },
];