import { Router } from "express";
import {
  aprobarOperacionWeb,
  rechazarOperacionWeb,
  reintentarOperacionWeb,
} from "../controllers/operacionesController.js";
import { exigirPermiso, obraDeOperacion } from "../middleware/permisosWeb.js";

const router = Router();
const aprobar = exigirPermiso("bandeja.aprobar", obraDeOperacion);

// Aprobación/rechazo de operaciones del bot desde la bandeja (JWT + membresía + rol).
router.patch("/:id/aprobar", aprobar, aprobarOperacionWeb);
router.patch("/:id/rechazar", aprobar, rechazarOperacionWeb);
router.patch("/:id/reintentar", aprobar, reintentarOperacionWeb);

export default router;
