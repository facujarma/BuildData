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
import {
  exigirPermiso,
  obraDeBody,
  obraDeParam,
  obraDePedido,
} from "../middleware/permisosWeb.js";

const router = Router();

// ":algo" es un parámetro: lo que venga en esa parte de la URL llega en req.params.algo
router.get("/:obra_id", exigirPermiso("pedidos.ver", obraDeParam("obra_id")), getPedidos); // GET /pedidos/<obra> → lista los pedidos de la obra
router.post("/", exigirPermiso("pedidos.crear", obraDeBody("obra_id")), crearPedidoWeb); // POST /pedidos → crea un pedido (datos en el body)
router.patch("/:id/aprobar", exigirPermiso("pedidos.aprobar", obraDePedido), aprobarPedido); // PATCH = modificar algo que ya existe
router.patch("/:id/rechazar", exigirPermiso("pedidos.aprobar", obraDePedido), rechazarPedido);
router.patch("/:id/estado", exigirPermiso("pedidos.entregar", obraDePedido), cambiarEstadoPedido); // en_camino / demorado
// La que usamos en el recorrido: la llama entregarPedido() de services/pedidosService.ts
// (frontend) y la atiende entregarPedido() de controllers/pedidosController.js
router.patch("/:id/entregar", exigirPermiso("pedidos.entregar", obraDePedido), entregarPedido);

export default router; // lo importa server.js
