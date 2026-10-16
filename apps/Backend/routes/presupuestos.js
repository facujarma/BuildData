import { Router } from "express";
import { getPresupuesto, ajustarRubros } from "../controllers/presupuestosController.js";

const router = Router();
router.get("/:obra_id", getPresupuesto);
router.put("/:obra_id/rubros", ajustarRubros);
export default router;
