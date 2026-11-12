import express from "express";

import {
  getObreros,
  asignarObraObrero,
  quitarObreroDeObra,
  crearInvitacionWeb,
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

export default router;