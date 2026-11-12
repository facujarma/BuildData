import { Router } from "express";
import { getActividad, crearActividad } from "../controllers/actividadController.js";
import { exigirPermiso, obraDeBody, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();

router.get("/:obra_id", exigirPermiso("actividad.ver", obraDeParam("obra_id")), getActividad);
router.post("/", exigirPermiso("actividad.registrar", obraDeBody("obra_id")), crearActividad);

export default router;
