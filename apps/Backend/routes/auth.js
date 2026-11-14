import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  syncPersona,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/sync", authMiddleware, syncPersona);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);  // protegida — necesita token

export default router;