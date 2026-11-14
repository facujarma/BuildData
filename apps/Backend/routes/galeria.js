import express, { Router } from "express";
import { getGaleria, subirFoto, eliminarFoto } from "../controllers/galeriaController.js";
import { exigirPermiso, obraDeFoto, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();
const imagenCruda = express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "10mb" });

router.get("/:obra_id", exigirPermiso("galeria.ver", obraDeParam("obra_id")), getGaleria);
router.post(
  "/:obra_id",
  exigirPermiso("galeria.gestionar", obraDeParam("obra_id")),
  imagenCruda,
  subirFoto
);
router.delete("/:id", exigirPermiso("galeria.gestionar", obraDeFoto), eliminarFoto);
export default router;
