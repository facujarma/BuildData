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

const router = Router();
router.get("/", getProveedores);
router.post("/", crearProveedor);
router.post("/vincular", vincularProveedor);
router.patch("/:id", actualizarProveedor);
router.patch("/:id/favorito", marcarFavorito);
router.post("/:id/promover", promoverProveedor);
router.delete("/:id", eliminarProveedor);
export default router;
