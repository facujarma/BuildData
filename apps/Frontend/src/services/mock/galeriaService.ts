import { PHOTO_SEED } from "@/app/[obraId]/dashboard/registro/data";
import type { GalleryPhoto } from "@/types/gallery";

interface GaleriaData {
  photos: GalleryPhoto[];
}

export async function getGaleria(): Promise<GaleriaData> {
  await new Promise((r) => setTimeout(r, 250));
  return { photos: JSON.parse(JSON.stringify(PHOTO_SEED)) };
}