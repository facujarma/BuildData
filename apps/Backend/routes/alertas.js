import { Router } from "express";
import { getAlertas, resolverAlerta, crearAlerta } from "../controllers/alertasController.js";
import { exigirPermiso, obraDeAlerta, obraDeBody, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();

router.get("/:obra_id", exigirPermiso("alertas.ver", obraDeParam("obra_id")), getAlertas);
router.patch("/:id/resolver", exigirPermiso("alertas.gestionar", obraDeAlerta), resolverAlerta);
router.post("/", exigirPermiso("alertas.gestionar", obraDeBody("obra_id")), crearAlerta);

export default router;