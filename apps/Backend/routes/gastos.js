import express, { Router } from "express";
import { getGastos, crearGasto, actualizarGasto, subirArchivoGasto } from "../controllers/gastosController.js";
import { exigirPermiso, obraDeBody, obraDeGasto, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();
const archivoCrudo = express.raw({
  type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  limit: "10mb",
});

router.get("/:obra_id", exigirPermiso("recibos.ver", obraDeParam("obra_id")), getGastos);
router.post("/", exigirPermiso("recibos.gestionar", obraDeBody("obra_id")), crearGasto);
router.patch("/:id", exigirPermiso("recibos.gestionar", obraDeGasto), actualizarGasto);
router.post(
  "/:id/archivo",
  exigirPermiso("recibos.gestionar", obraDeGasto),
  archivoCrudo,
  subirArchivoGasto
);
export default router;
