// Punto de entrada del Backend (se levanta con `node apps/Backend/server.js`, puerto 3001).
// Crea la app de Express, registra los middlewares globales y monta cada router bajo su
// prefijo de URL. Todo pedido HTTP de la web o del bot entra por acá.

import express from "express"; // framework web: recibe pedidos HTTP y los rutea
import cors from "cors"; // permite que la web (otro dominio/puerto) llame a esta API
import dotenv from "dotenv"; // lee el .env

import { authMiddleware } from "./middleware/authMiddleware.js"; // valida el login de la web

// Rutas públicas
import authRoutes from "./routes/auth.js"; // login/registro: no pueden exigir estar logueado

// Rutas del bot
import botRoutes from "./routes/bot.js"; // el bot de WhatsApp: se autentica con otra clave (routes/bot.js)

// Rutas protegidas
// Cada import es un router (archivo en routes/) que agrupa las URLs de un módulo
import obrasRoutes from "./routes/obras.js";
import dashboardRoutes from "./routes/dashboard.js";
import tareasRoutes from "./routes/tareas.js";
import alertasRoutes from "./routes/alertas.js";
import rubrosRoutes from "./routes/rubros.js";
import presupuestosRoutes from "./routes/presupuestos.js";
import proveedoresRoutes from "./routes/proveedores.js";
import usuariosRoutes from "./routes/usuarios.js";
import materialesRoutes from "./routes/materiales.js";
import gastosRoutes from "./routes/gastos.js";
import actividadRoutes from "./routes/actividad.js";
import reportesRoutes from "./routes/reportes.js";
import obrerosRoutes from "./routes/obreros.js";
import pedidosRoutes from "./routes/pedidos.js"; // el del recorrido: /pedidos/:id/entregar
import mensajesRoutes from "./routes/mensajes.js";
import operacionesRoutes from "./routes/operaciones.js";
import chatbotRoutes from "./routes/chatbot.js";
<<<<<<< HEAD
import galeriaRoutes from "./routes/galeria.js";
import { verificarInactividad } from "./controllers/alertasController.js";
=======
import { verificarInactividad } from "./controllers/alertasController.js"; // tarea periódica (abajo)
>>>>>>> c7c9fb25eddea16d1f8d3e988f2eeb4535e4e63a

dotenv.config(); // carga el .env en process.env

const app = express(); // la aplicación: a partir de acá se le "enchufan" middlewares y rutas

// Middlewares globales: corren para TODOS los pedidos, en el orden en que se registran
app.use(cors()); // agrega los headers CORS para que el navegador acepte las respuestas
app.use(express.json()); // convierte el body JSON del pedido en un objeto JS (req.body)

// ──────────────────────────────────────────
// Públicas
// ──────────────────────────────────────────

app.use("/auth", authRoutes); // va ANTES del authMiddleware: no exige token

// ──────────────────────────────────────────
// Bot (service_role key)
// ──────────────────────────────────────────

app.use("/bot", botRoutes); // también antes: el bot usa su propio middleware (botAuthMiddleware)

// ──────────────────────────────────────────
// Todo lo demás requiere usuario autenticado
// ──────────────────────────────────────────

// A partir de esta línea, cualquier pedido pasa primero por authMiddleware.
// Si no hay token válido responde 401; si lo hay, deja req.personaId y sigue.
app.use(authMiddleware);

// app.use(prefijo, router): las rutas del router quedan "colgadas" de ese prefijo
// Obras
app.use("/", obrasRoutes);

// Dashboard
app.use("/dashboard", dashboardRoutes);

// Tareas
app.use("/tareas", tareasRoutes);

// Alertas
app.use("/alertas", alertasRoutes);

// Rubros (el router declara paths completos /obras/:obraId/rubros)
app.use("/", rubrosRoutes);

// Presupuestos
app.use("/presupuestos", presupuestosRoutes);

// Proveedores
app.use("/proveedores", proveedoresRoutes);

// Usuarios
app.use("/usuarios", usuariosRoutes);

// Materiales
app.use("/materiales", materialesRoutes);

// Gastos
app.use("/gastos", gastosRoutes);

// Actividad
app.use("/actividad", actividadRoutes);

// Reportes
app.use("/reportes", reportesRoutes);

// Obreros
app.use("/obreros", obrerosRoutes);

// Pedidos (aprobación)
// PATCH /pedidos/123/entregar → routes/pedidos.js recibe "/123/entregar"
app.use("/pedidos", pedidosRoutes);

// Mensajes del bot (bandeja de WhatsApp)
app.use("/mensajes", mensajesRoutes);

// Aprobación/rechazo de operaciones del bot
app.use("/operaciones", operacionesRoutes);

// Galería de obra (fotos en Storage)
app.use("/galeria", galeriaRoutes);

// ChatBot AI (preguntas en lenguaje natural → SQL)
app.use("/chat", chatbotRoutes);

// Health check
// (GET / responde un texto: sirve para ver rápido si la API está viva)
app.get("/", (req, res) => {
  res.send("BuildData API funcionando");
});

const PORT = process.env.PORT || 3001; // puerto: el del .env o 3001 por defecto

// Arranca el servidor: desde acá escucha pedidos HTTP
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

// Sistema de alertas: detección de inactividad. No hay job runner en este Backend
// (Express solo), así que un setInterval alcanza para un solo proceso.
const INACTIVIDAD_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // cada 6 horas
verificarInactividad(); // corre una vez al arrancar
setInterval(verificarInactividad, INACTIVIDAD_CHECK_INTERVAL_MS); // y después cada 6 horas
