import { SUPPLIERS_SEED } from "@/app/[obraId]/dashboard/proveedores/data";
import type { Proveedor } from "@/app/[obraId]/dashboard/proveedores/data";

let SUPPLIERS: Proveedor[] = SUPPLIERS_SEED.map((s) => ({ ...s }));

export async function getProveedores(): Promise<Proveedor[]> {
  await new Promise((r) => setTimeout(r, 220));
  return JSON.parse(JSON.stringify(SUPPLIERS));
}

export function addProveedor(p: Proveedor): void {
  SUPPLIERS = [{ ...p }, ...SUPPLIERS];
}

export function updateProveedor(id: string, patch: Partial<Proveedor>): void {
  SUPPLIERS = SUPPLIERS.map((p) => (p.id === id ? { ...p, ...patch } : p));
}

export function nextProveedorId(): string {
  const n = SUPPLIERS.length + 1;
  return "PV-" + String(n).padStart(2, "0");
}
