import { Router } from "express";
import { getEquipo, crearUsuario, asignarObra } from "../controllers/usuariosController.js";
import { exigirPermiso, obraDeBody, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();

router.get("/:obra_id", exigirPermiso("equipo.ver", obraDeParam("obra_id")), getEquipo);
// Legacy: crear usuario (la obra del body es el contexto de permiso)
router.post("/", exigirPermiso("equipo.administrar", obraDeBody("obra_id")), crearUsuario);
router.post("/asignar-obra", exigirPermiso("equipo.administrar", obraDeBody("obra_id")), asignarObra);

export default router;