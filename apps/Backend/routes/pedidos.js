import { Router } from "express";
import {
  getPedidos,
  crearPedidoWeb,
  aprobarPedido,
  rechazarPedido,
  cambiarEstadoPedido,
  entregarPedido,
} from "../controllers/pedidosController.js";

const router = Router();

router.get("/:obra_id", getPedidos);
router.post("/", crearPedidoWeb);
router.patch("/:id/aprobar", aprobarPedido);
router.patch("/:id/rechazar", rechazarPedido);
router.patch("/:id/estado", cambiarEstadoPedido);
router.patch("/:id/entregar", entregarPedido);

export default router;
