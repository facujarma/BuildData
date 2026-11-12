import { Router } from "express";
import {
  getProveedores,
  crearProveedor,
  actualizarProveedor,
  promoverProveedor,
  marcarFavorito,
  eliminarProveedor,
  vincularProveedor,
} from "../controllers/proveedoresController.js";
import {
  exigirPermiso,
  obraDeBody,
  obraDeMaterialVinculo,
  obraDeProveedor,
  obraDeQuery,
} from "../middleware/permisosWeb.js";

const router = Router();
router.get("/", exigirPermiso("proveedores.ver", obraDeQuery("obra_id")), getProveedores);
router.post("/", exigirPermiso("proveedores.gestionar", obraDeBody("obra_id")), crearProveedor);
router.post(
  "/vincular",
  exigirPermiso("proveedores.gestionar", obraDeMaterialVinculo),
  vincularProveedor
);
router.patch("/:id", exigirPermiso("proveedores.gestionar", obraDeProveedor), actualizarProveedor);
router.patch(
  "/:id/favorito",
  exigirPermiso("proveedores.gestionar", obraDeProveedor),
  marcarFavorito
);
router.post(
  "/:id/promover",
  exigirPermiso("proveedores.gestionar", obraDeProveedor),
  promoverProveedor
);
router.delete("/:id", exigirPermiso("proveedores.gestionar", obraDeProveedor), eliminarProveedor);
export default router;
