import express, { Router } from "express";
import {
  getMateriales,
  getCategorias,
  crearCategoria,
  crearMaterial,
  actualizarMaterial,
  ajustarStock,
  subirFotoMaterial,
  eliminarMaterial,
} from "../controllers/materialesController.js";

const router = Router();
const imagenCruda = express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" });

router.get("/:obra_id", getMateriales);
router.get("/:obra_id/categorias", getCategorias);
router.post("/categorias", crearCategoria);
router.post("/", crearMaterial);
router.post("/:id/ajuste", ajustarStock);
router.post("/:id/foto", imagenCruda, subirFotoMaterial);
router.patch("/:id", actualizarMaterial);
router.delete("/:id", eliminarMaterial);
export default router;
