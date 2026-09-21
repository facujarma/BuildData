import { RUBROS_SEED, CATEGORIES_SEED } from "@/app/[obraId]/dashboard/configuracion/data/rubros";
import type { Rubro, CategoriaSeccion } from "@/app/[obraId]/dashboard/configuracion/data/rubros";

interface RubrosData {
  rubros: Rubro[];
  categorias: CategoriaSeccion[];
}

export async function getRubros(): Promise<RubrosData> {
  await new Promise((r) => setTimeout(r, 200));
  return { rubros: JSON.parse(JSON.stringify(RUBROS_SEED)), categorias: JSON.parse(JSON.stringify(CATEGORIES_SEED)) };
}