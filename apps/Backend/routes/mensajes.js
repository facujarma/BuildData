import { Router } from "express";
import { getMensajes } from "../controllers/mensajesController.js";

const router = Router();

router.get("/:obraId", getMensajes);

export default router;
