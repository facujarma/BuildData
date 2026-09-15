import { PERFIL_SEED } from "@/app/[obraId]/dashboard/perfil/data";
import type { PerfilData } from "@/app/[obraId]/dashboard/perfil/data";

export async function getPerfil(): Promise<PerfilData> {
  await new Promise((r) => setTimeout(r, 250));
  return JSON.parse(JSON.stringify(PERFIL_SEED));
}