import { Router } from "express";
import { getPresupuesto, ajustarRubros } from "../controllers/presupuestosController.js";
import { exigirPermiso, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();
router.get("/:obra_id", exigirPermiso("presupuesto.ver", obraDeParam("obra_id")), getPresupuesto);
router.put("/:obra_id/rubros", exigirPermiso("presupuesto.editar", obraDeParam("obra_id")), ajustarRubros);
export default router;
