import express from "express";

import {
  getObreros,
  asignarObraObrero,
  quitarObreroDeObra,
  crearInvitacionWeb,
  vincularCuentaWeb,
} from "../controllers/obrerosController.js";
import { exigirPermiso, obraDeBody, obraDeParam } from "../middleware/permisosWeb.js";

const router = express.Router();

router.get("/:obra_id", exigirPermiso("equipo.ver", obraDeParam("obra_id")), getObreros);

router.post(
  "/asignar-obra",
  exigirPermiso("equipo.administrar", obraDeBody("obra_id")),
  asignarObraObrero
);

router.post(
  "/invitacion",
  exigirPermiso("equipo.administrar", obraDeBody("obra_id")),
  crearInvitacionWeb
);

router.delete(
  "/:obrero_id/obra/:obra_id",
  exigirPermiso("equipo.administrar", obraDeParam("obra_id")),
  quitarObreroDeObra
);

// Vincular una cuenta web (persona con auth_user_id) a la persona que ya
// reporta por WhatsApp: unifica las dos filas sin perder historial ni roles.
router.post(
  "/:obrero_id/obra/:obra_id/vincular",
  exigirPermiso("equipo.administrar", obraDeParam("obra_id")),
  vincularCuentaWeb
);

export default router;