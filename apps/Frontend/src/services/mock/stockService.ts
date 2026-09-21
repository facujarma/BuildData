import { ITEMS, CATEGORIES } from "@/app/[obraId]/dashboard/stock/data";
import type { StockItem } from "@/app/[obraId]/dashboard/stock/data";

interface StockData {
  items: StockItem[];
  categories: string[];
}

export async function getStock(): Promise<StockData> {
  await new Promise((r) => setTimeout(r, 250));
  return { items: JSON.parse(JSON.stringify(ITEMS)), categories: [...CATEGORIES] };
}
