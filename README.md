# BuildData

Monorepo con un **bot de WhatsApp impulsado por IA** para gestión de obras de construcción. Convierte mensajes de texto y notas de voz en consultas SQL listas para ejecutar sobre una base de datos relacional.

---

## Estructura del proyecto

```
BuildData/
├── apps/
│   ├── Backend/           # Placeholder (pendiente de implementar)
│   ├── Frontend/          # Web app con Next.js 16
│   └── WhatsApp-Bot/      # Bot de WhatsApp con IA
├── package.json           # Root workspace config
├── turbo.json             # Turborepo configuration
└── README.md
```

## Stack tecnológico

| Componente       | Tecnología                                     |
|------------------|------------------------------------------------|
| Monorepo         | [Turborepo](https://turbo.build/) + Bun        |
| WhatsApp Bot     | [Baileys](https://baileys.wiki) (WebSocket, sin navegador) |
| IA (texto→SQL)   | Groq API (Llama 3.3 70B)                       |
| IA (voz→texto)   | Groq API (Whisper Large V3 Turbo)              |
| Base de datos    | MongoDB (MongoDB Atlas)                        |
| Backend server   | Express.js v5                                  |
| Frontend         | Next.js 16, React 19, TailwindCSS 4, TypeScript|
| Contenedores     | Docker (oven/bun:1.3.12)                       |

---

## Requisitos previos

- [Bun](https://bun.sh/) >= 1.3.12
- [Node.js](https://nodejs.org/) >= 20
- MongoDB Atlas (o MongoDB local)
- API Key de Groq ([groq.com](https://console.groq.com/))

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd BuildData

# 2. Instalar dependencias de todo el monorepo
bun install

# 3. Configurar variables de entorno
cp apps/WhatsApp-Bot/.env.example apps/WhatsApp-Bot/.env
# Editar .env con tus credenciales
```

---

## Variables de entorno

Archivo: `apps/WhatsApp-Bot/.env`

```env
GROQ_API_KEY=gsk_<tu-api-key>
MONGO_URI=mongodb://<usuario>:<password>@<host>/<db>?ssl=true&...
NODE_ENV=development
API_URL=http://localhost:3001
```

| Variable | Descripción |
|----------|-------------|
| `GROQ_API_KEY` | API key de Groq para LLM y transcripción de audio |
| `MONGO_URI` | URI de conexión a MongoDB (Atlas recomendado) |
| `NODE_ENV` | `development` o `production` |
| `API_URL` | URL del servidor backend externo |

---

## Scripts disponibles

### Ejecutar todos los servicios en paralelo

```bash
bun run dev
```

### Build completo (respeta dependencias entre apps)

```bash
bun run build
```

### Lint de todo el monorepo

```bash
bun run lint
```

### Ejecutar un servicio específico

```bash
# Solo el WhatsApp Bot
npx turbo run dev --filter=whatsapp-bot

# Solo el Frontend
npx turbo run dev --filter=frontend
```

---

## Arquitectura del WhatsApp Bot

```
┌─────────────────────────────────────────────────────────┐
│                    WhatsApp Client                       │
│  (Baileys sobre WebSocket, sin Chromium)                 │
└───────────────────────┬─────────────────────────────────┘
                        │
              ┌─────────┴──────────┐
              │  message.handler   │
              │  (enrutador)       │
              └─────────┬──────────┘
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────────┐
   │  Texto   │  │   Audio  │  │  Comandos    │
   │ (freetext│  │  (voice) │  │  (!ayuda,    │
   │ handler) │  │ handler) │  │  !confirm)   │
   └────┬─────┘  └────┬─────┘  └──────────────┘
        │             │
        │    ┌────────┘
        │    │ Transcripción
        │    ▼ (Whisper via Groq)
        │    Texto transcrito
        │    │
        ▼    ▼
   ┌────────────────────┐
   │   textToSQL()      │
   │ (Llama 3.3 via Groq│
   └────────┬───────────┘
            │
            ▼
   ┌────────────────────┐
   │  pendingQuery.store│
   │ (almacena SQL      │
   │  pendiente)        │
   └────────┬───────────┘
            │
            ▼
   Usuario confirma con !confirm
   → SQL se ejecuta (implementación pendiente)
```

### Flujo de un mensaje de texto

1. Usuario envía un mensaje sin prefijo `!`
2. `message.handler` lo enruta a `freetext.handler`
3. `freetext.handler` llama a `textToSQL()` (Groq / Llama 3.3)
4. Se genera una consulta SQL y se guarda en `pendingQuery.store`
5. El bot responde con la SQL generada y pide confirmación
6. Usuario responde `!confirm` → SQL ejecutada / `!cancel` → descartada

### Flujo de una nota de voz

1. Usuario envía un audio
2. `voice.handler` descarga el archivo
3. `transcription.service` lo envía a Groq Whisper → obtiene texto
4. El texto transcrito se procesa como un mensaje normal (va a `freetext.handler`)

### Persistencia de sesión

- Las sesiones de WhatsApp se almacenan en **MongoDB** (colección `baileys_auth`) vía un auth state propio (`useMongoAuthState`)
- Las credenciales se guardan en cada `creds.update` y las signal keys en cada mensaje
- Permite reiniciar el bot sin re-escanear el QR

---

## Esquema de base de datos

La base de datos gestiona obras de construcción con las siguientes tablas:

| Tabla | Descripción |
|-------|-------------|
| `obras` | Proyectos de construcción con estado, presupuesto y fechas |
| `usuarios` | Personal con roles: admin, capataz, operario, cliente |
| `tareas` | Actividades asociadas a una obra con prioridad y estado |
| `subtareas` | Sub-actividades de una tarea (boolean completada) |
| `materiales` | Inventario de materiales por obra con stock mínimo |
| `gastos` | Registro de gastos por categoría |
| `mensajes` | Comunicaciones entre usuarios (texto, audio, imagen) |
| `alertas` | Notificaciones automáticas (stock bajo, tarea vencida, etc.) |
| `reportes` | Reportes generados (diario, semanal, mensual, personalizado) |

---

## Comandos del bot

| Comando | Descripción |
|---------|-------------|
| `!iniciar` | Te registra en una obra. Uso: `!iniciar [nombre] [obra_id]` |
| `!ayuda` | Muestra la lista de comandos disponibles |
| `!obras` | Muestra las obras en las que formas parte |
| `!invitacion` | Vincula tu WhatsApp a una obra con el link que te compartieron |
| `!cancel` | Cancela la carga de datos pendiente |

> Cualquier mensaje de texto o audio sin el prefijo `!` se interpreta como una operación: el LLM genera endpoint + JSON, el bot lo confirma con una encuesta numerada y lo registra en el Backend (aprobación automática o bandeja de pendientes según la política).

---

## Docker

El WhatsApp Bot puede ejecutarse en contenedor:

```bash
# Build (contexto = carpeta del bot)
docker build -t whatsapp-bot apps/WhatsApp-Bot

# Run
docker run --env-file apps/WhatsApp-Bot/.env whatsapp-bot
```

El Dockerfile incluye:
- Base `oven/bun:1.3.12`
- Solo dependencias de producción (sin Chromium/Puppeteer)

---

## Estado actual del proyecto

| Módulo | Estado |
|--------|--------|
| WhatsApp Bot | ✅ Funcional (QR, texto, voz, comandos) |
| Text-to-SQL (Groq) | ✅ Funcional |
| Voice transcription (Whisper) | ✅ Funcional |
| Session persistence (MongoDB) | ✅ Funcional |
| Express server (keep-alive) | ✅ Funcional (ping/pong) |
| Ejecución real de SQL | ⚠️ Pendiente (hay placeholder en `confirmCommand`) |
| Backend API | 📝 Sin implementar |
| Frontend Web | 📝 Sin implementar (Next.js scaffolding) |

---

## Notas de seguridad

- **Nunca commitear el archivo `.env`** con credenciales reales
- Las claves de Groq y MongoDB Atlas deben mantenerse secretas
- Se recomienda usar `.env.example` con placeholders para compartir
