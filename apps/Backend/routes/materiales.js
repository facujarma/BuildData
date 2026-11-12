import express, { Router } from "express";
import {
  getMateriales,
  getCategorias,
  crearCategoria,
  crearMaterial,
  actualizarMaterial,
  ajustarStock,
  subirFotoMaterial,
  eliminarMaterial,
} from "../controllers/materialesController.js";
import {
  exigirPermiso,
  obraDeBody,
  obraDeMaterial,
  obraDeParam,
} from "../middleware/permisosWeb.js";

const router = Router();
const imagenCruda = express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" });

router.get("/:obra_id", exigirPermiso("stock.ver", obraDeParam("obra_id")), getMateriales);
router.get("/:obra_id/categorias", exigirPermiso("stock.ver", obraDeParam("obra_id")), getCategorias);
router.post("/categorias", exigirPermiso("stock.ajustar", obraDeBody("obra_id")), crearCategoria);
router.post("/", exigirPermiso("stock.ajustar", obraDeBody("obra_id")), crearMaterial);
router.post("/:id/ajuste", exigirPermiso("stock.ajustar", obraDeMaterial), ajustarStock);
router.post(
  "/:id/foto",
  exigirPermiso("stock.ajustar", obraDeMaterial),
  imagenCruda,
  subirFotoMaterial
);
router.patch("/:id", exigirPermiso("stock.ajustar", obraDeMaterial), actualizarMaterial);
router.delete("/:id", exigirPermiso("stock.ajustar", obraDeMaterial), eliminarMaterial);
export default router;
