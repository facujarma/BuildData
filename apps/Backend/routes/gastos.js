import express, { Router } from "express";
import { getGastos, crearGasto, actualizarGasto, subirArchivoGasto } from "../controllers/gastosController.js";

const router = Router();
const archivoCrudo = express.raw({
  type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  limit: "10mb",
});

router.get("/:obra_id", getGastos);
router.post("/", crearGasto);
router.patch("/:id", actualizarGasto);
router.post("/:id/archivo", archivoCrudo, subirArchivoGasto);
export default router;
