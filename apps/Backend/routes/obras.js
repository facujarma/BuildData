import { Router } from "express";
import {
  getObras,
  getObra,
  getMiRol,
  crearObra,
  updateObra,
  deleteObra,
  toggleStarred,
} from "../controllers/obrasController.js";
import { exigirPermiso, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();

router

// GET /obras
router.get("/obras", getObras);

// GET /obras/:obraId/mi-rol — rol y permisos efectivos del que llama
router.get("/obras/:obraId/mi-rol", getMiRol);

// GET /obras/:obraId
router.get("/obras/:obraId", getObra);

// POST /obras
router.post("/obras", crearObra);

// PATCH /obras/:obraId
router.patch(
  "/obras/:obraId",
  exigirPermiso("configuracion.editar", obraDeParam("obraId")),
  updateObra
);

// DELETE /obras/:obraId
router.delete(
  "/obras/:obraId",
  exigirPermiso("configuracion.editar", obraDeParam("obraId")),
  deleteObra
);

// PATCH /obras/:obraId/starred
router.patch("/obras/:obraId/starred", toggleStarred);

export default router;