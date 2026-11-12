import { Router } from "express";
import { getReportes, getSnapshot, generarReporte, crearReporte } from "../controllers/reportesController.js";
import { exigirPermiso, obraDeBody, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();

router.get("/:obra_id", exigirPermiso("reportes.ver", obraDeParam("obra_id")), getReportes);
router.get("/:obra_id/snapshot", exigirPermiso("reportes.ver", obraDeParam("obra_id")), getSnapshot);
router.post(
  "/:obra_id/generar",
  exigirPermiso("reportes.exportar", obraDeParam("obra_id")),
  generarReporte
);
router.post("/", exigirPermiso("reportes.exportar", obraDeBody("obra_id")), crearReporte);

export default router;
