import { Router } from "express";
import { consultarChat } from "../controllers/chatbotController.js";
import { exigirPermiso, obraDeBody } from "../middleware/permisosWeb.js";

const router = Router();

// Requiere authMiddleware (se monta después en server.js) + permiso de dashboard.
router.post("/consultar", exigirPermiso("dashboard.ver", obraDeBody("obra_id")), consultarChat);

export default router;
