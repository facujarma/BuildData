import { Router } from "express";
import { getMensajes } from "../controllers/mensajesController.js";
import { exigirPermiso, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();

router.get("/:obraId", exigirPermiso("bandeja.ver", obraDeParam("obraId")), getMensajes);

export default router;
