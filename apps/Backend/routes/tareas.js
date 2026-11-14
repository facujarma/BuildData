import { Router } from "express";
import { getTareas, crearTarea, actualizarTarea, completarTarea } from "../controllers/tareasController.js";
import { exigirPermiso, obraDeBody, obraDeParam, obraDeTarea } from "../middleware/permisosWeb.js";

const router = Router();

router.get("/:obra_id", exigirPermiso("cronograma.ver", obraDeParam("obra_id")), getTareas);
router.post("/", exigirPermiso("cronograma.editar", obraDeBody("obra_id")), crearTarea);
router.post("/:id/completar", exigirPermiso("cronograma.editar", obraDeTarea), completarTarea);
router.patch("/:id", exigirPermiso("cronograma.editar", obraDeTarea), actualizarTarea);

export default router;