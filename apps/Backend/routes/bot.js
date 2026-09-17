import { Router } from "express";
import { botAuthMiddleware } from "../middleware/botAuthMiddleware.js";
import {
  recibirMensaje,
  actualizarAccionesMensaje,
  crearPedidoDeCompra,
  registrarRetraso,
  actualizarStock,
  getCatalogo,
  crearMaterialDesdeBot,
} from "../controllers/botController.js";
import { registrarObrero, getUserByPhone } from "../controllers/obrerosController.js";
import { crearTareaDesdeBot } from "../controllers/tareasController.js";
import { completarTareaDesdeBot } from "../controllers/tareasController.js";
import { crearGastoDesdeBot } from "../controllers/gastosController.js";

const router = Router();

// Todas las rutas /bot/* requieren la service_role key, no un JWT de usuario
router.use(botAuthMiddleware);

// Recepción del mensaje crudo
router.post("/mensaje", recibirMensaje);

// Persistencia de la interpretación ejecutada (action_executed)
router.patch("/mensaje/:id", actualizarAccionesMensaje);

// Catálogo para resolver nombres → IDs (GET) y auto-crear materiales
router.get("/catalogo", getCatalogo);
router.post("/materiales", crearMaterialDesdeBot);

// Endpoints específicos que Facu llama según lo que detectó en el mensaje
router.post("/pedidoDeCompra", crearPedidoDeCompra);
router.post("/retraso", registrarRetraso);
router.post("/stock", actualizarStock);

// Tareas
router.post("/tareas", crearTareaDesdeBot);
router.patch("/tareas/:id/completar", completarTareaDesdeBot);

// Gastos
router.post("/gastos", crearGastoDesdeBot);

// Obreros
router.post("/obreros/registrar", registrarObrero);
router.get("/obreros/telefono/:phone", getUserByPhone);


export default router;