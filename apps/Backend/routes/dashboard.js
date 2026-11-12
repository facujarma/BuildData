import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { exigirPermiso, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();

// GET /dashboard/:obraId
router.get("/:obraId", exigirPermiso("dashboard.ver", obraDeParam("obraId")), getDashboard);

export default router;