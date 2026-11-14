import { Router } from "express";
import {
  getRubros,
  crearRubro,
  updateRubro,
  deleteRubro,
} from "../controllers/rubrosController.js";
import { exigirPermiso, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();

router.get("/obras/:obraId/rubros", exigirPermiso("cronograma.ver", obraDeParam("obraId")), getRubros);
router.post("/obras/:obraId/rubros", exigirPermiso("configuracion.editar", obraDeParam("obraId")), crearRubro);
router.patch(
  "/obras/:obraId/rubros/:rubroId",
  exigirPermiso("configuracion.editar", obraDeParam("obraId")),
  updateRubro
);
router.delete(
  "/obras/:obraId/rubros/:rubroId",
  exigirPermiso("configuracion.editar", obraDeParam("obraId")),
  deleteRubro
);

export default router;