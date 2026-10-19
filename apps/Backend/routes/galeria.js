import express, { Router } from "express";
import { getGaleria, subirFoto, eliminarFoto } from "../controllers/galeriaController.js";

const router = Router();
const imagenCruda = express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "10mb" });

router.get("/:obra_id", getGaleria);
router.post("/:obra_id", imagenCruda, subirFoto);
router.delete("/:id", eliminarFoto);
export default router;
