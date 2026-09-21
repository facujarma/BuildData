import { RECEIPTS } from "@/app/[obraId]/dashboard/recibos/data";
import type { ReciboItem } from "@/app/[obraId]/dashboard/recibos/data";

interface RecibosData {
  receipts: ReciboItem[];
}

export async function getRecibos(): Promise<RecibosData> {
  await new Promise((r) => setTimeout(r, 250));
  return { receipts: JSON.parse(JSON.stringify(RECEIPTS)) };
}
