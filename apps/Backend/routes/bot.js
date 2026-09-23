import { Router } from "express";
import { botAuthMiddleware } from "../middleware/botAuthMiddleware.js";
import {
  recibirMensaje,
  actualizarAccionesMensaje,
  crearPedidoDeCompra,
  registrarRetraso,
  actualizarStock,
  ajustarStockDesdeBot,
} from "../controllers/botController.js";
import { registrarObrero, getUserByPhone } from "../controllers/obrerosController.js";
import { crearTareaDesdeBot } from "../controllers/tareasController.js";
import { completarTareaDesdeBot } from "../controllers/tareasController.js";
import { crearGastoDesdeBot } from "../controllers/gastosController.js";
import { buscarEntidad } from "../controllers/entidadesController.js";

const router = Router();

// Todas las rutas /bot/* requieren la service_role key, no un JWT de usuario
router.use(botAuthMiddleware);

// Recepción del mensaje crudo
router.post("/mensaje", recibirMensaje);

// Persistencia de la interpretación ejecutada (action_executed)
router.patch("/mensaje/:id", actualizarAccionesMensaje);

// Búsqueda de entidades por similitud (exacto → fuzzy → embeddings)
router.get("/entidades/buscar", buscarEntidad);

// Endpoints específicos que Facu llama según lo que detectó en el mensaje
router.post("/pedidoDeCompra", crearPedidoDeCompra);
router.post("/retraso", registrarRetraso);
router.post("/stock", actualizarStock);
router.post("/stock/ajuste", ajustarStockDesdeBot);

// Tareas
router.post("/tareas", crearTareaDesdeBot);
router.patch("/tareas/:id/completar", completarTareaDesdeBot);

// Gastos
router.post("/gastos", crearGastoDesdeBot);

// Obreros
router.post("/obreros/registrar", registrarObrero);
router.get("/obreros/telefono/:phone", getUserByPhone);


export default router;