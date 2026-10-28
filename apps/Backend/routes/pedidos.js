// Rutas de /pedidos: une cada URL + método HTTP con la función del controller que la
// atiende. server.js monta este router con app.use("/pedidos", pedidosRoutes), así que
// "/:id/entregar" acá es en realidad "/pedidos/:id/entregar".

import { Router } from "express"; // Router = mini-app de Express para agrupar rutas
import {
  getPedidos,
  crearPedidoWeb,
  aprobarPedido,
  rechazarPedido,
  cambiarEstadoPedido,
  entregarPedido,
} from "../controllers/pedidosController.js"; // las funciones que hacen el trabajo real

const router = Router();

// ":algo" es un parámetro: lo que venga en esa parte de la URL llega en req.params.algo
router.get("/:obra_id", getPedidos); // GET /pedidos/<obra> → lista los pedidos de la obra
router.post("/", crearPedidoWeb); // POST /pedidos → crea un pedido (datos en el body)
router.patch("/:id/aprobar", aprobarPedido); // PATCH = modificar algo que ya existe
router.patch("/:id/rechazar", rechazarPedido);
router.patch("/:id/estado", cambiarEstadoPedido); // en_camino / demorado
// La que usamos en el recorrido: la llama entregarPedido() de services/pedidosService.ts
// (frontend) y la atiende entregarPedido() de controllers/pedidosController.js
router.patch("/:id/entregar", entregarPedido);

export default router; // lo importa server.js
