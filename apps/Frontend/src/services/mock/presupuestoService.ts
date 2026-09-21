import { BUDGET_LINES } from "@/app/[obraId]/dashboard/presupuesto/data";
import type { BudgetLine } from "@/app/[obraId]/dashboard/presupuesto/data";

interface PresupuestoData {
  lines: BudgetLine[];
}

export async function getPresupuesto(): Promise<PresupuestoData> {
  await new Promise((r) => setTimeout(r, 300));
  return { lines: JSON.parse(JSON.stringify(BUDGET_LINES)) };
}
