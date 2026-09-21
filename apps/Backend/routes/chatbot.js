import { Router } from "express";
import { consultarChat } from "../controllers/chatbotController.js";

const router = Router();

// Requiere authMiddleware (se monta después en server.js)
router.post("/consultar", consultarChat);

export default router;
