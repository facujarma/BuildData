import { Router } from "express";
import { getReportes, getSnapshot, generarReporte, crearReporte } from "../controllers/reportesController.js";

const router = Router();

router.get("/:obra_id", getReportes);
router.get("/:obra_id/snapshot", getSnapshot);
router.post("/:obra_id/generar", generarReporte);
router.post("/", crearReporte);

export default router;
