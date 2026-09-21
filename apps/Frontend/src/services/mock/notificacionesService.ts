import { NOTIF_SEED, type NotifItem } from "@/app/[obraId]/dashboard/_components/data/notificaciones";

interface NotificacionesData {
  items: NotifItem[];
}

export async function getNotificaciones(): Promise<NotificacionesData> {
  await new Promise((r) => setTimeout(r, 200));
  return { items: JSON.parse(JSON.stringify(NOTIF_SEED)) };
}