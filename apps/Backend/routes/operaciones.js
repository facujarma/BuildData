import { Router } from "express";
import {
  aprobarOperacionWeb,
  rechazarOperacionWeb,
  reintentarOperacionWeb,
} from "../controllers/operacionesController.js";

const router = Router();

// Aprobación/rechazo de operaciones del bot desde la bandeja (JWT + membresía).
router.patch("/:id/aprobar", aprobarOperacionWeb);
router.patch("/:id/rechazar", rechazarOperacionWeb);
router.patch("/:id/reintentar", reintentarOperacionWeb);

export default router;
