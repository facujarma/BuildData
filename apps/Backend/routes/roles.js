import { Router } from "express";
import {
  getRoles,
  crearRolWeb,
  actualizarRolWeb,
  eliminarRolWeb,
} from "../controllers/rolesController.js";
import { exigirPermiso, obraDeParam } from "../middleware/permisosWeb.js";

const router = Router();
const administrarRoles = exigirPermiso("roles.administrar", obraDeParam("obra_id"));

// GET /roles/:obra_id — roles de la obra + catálogo de permisos
router.get("/:obra_id", administrarRoles, getRoles);

// POST /roles/:obra_id — crear un rol personalizado
router.post("/:obra_id", administrarRoles, crearRolWeb);

// PATCH /roles/:obra_id/:rol_id — editar nombre/descripción/nivel/permisos
router.patch("/:obra_id/:rol_id", administrarRoles, actualizarRolWeb);

// DELETE /roles/:obra_id/:rol_id — solo roles personalizados sin uso
router.delete("/:obra_id/:rol_id", administrarRoles, eliminarRolWeb);

export default router;
