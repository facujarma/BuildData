# BuildData — Guía para agentes IA

BuildData: bot WhatsApp + API REST + Frontend Web para gestión de obras de construcción. Monorepo Turborepo + Bun. El usuario envía texto/audio/imagen → LLM genera llamada a API REST (no SQL) → confirmación vía encuesta → ejecución.

## Comandos clave

| Comando | Uso |
|---------|-----|
| `bun run dev` | Turbo: WhatsApp-Bot + Frontend + Backend en paralelo |
| `npx turbo run dev --filter=whatsapp-bot` | Solo bot (Express keep-alive en puerto 3000) |
| `npx turbo run dev --filter=frontend` | Solo frontend (Next.js) |
| `bun --watch src/index.ts` | Modo dev directo del bot (hot reload) |
| `bun test` | Tests con Bun (apps/WhatsApp-Bot) |
| `bun run lint` | Lints solo Frontend (WhatsApp-Bot no tiene lint) |

- **Backend no tiene package.json** → no funciona con `--filter=backend`. Correr manual: `node apps/Backend/server.js` (puerto 3001)
- Sin `.env.example` — crear manualmente en `apps/WhatsApp-Bot/.env` y `apps/Backend/.env`
- Express: bot en puerto 3000, Backend API en puerto 3001
- Existe `bun.lock` y `package-lock.json` — usar `bun install`
- **No hay tests todavía**: `bun test` no encuentra `*.test.ts` en WhatsApp-Bot

## Arquitectura (lo que los nombres no dicen)

- **LLM genera endpoint + JSON body, NO SQL**: `textToOperation()` devuelve `{endpoint, method, data, comment}`, no un `RawOperation` con action/table/data
- **Pending store es union type**: `PendingQuery = operation \| comprobante \| factura`; `ApiCall.method = "POST" | "GET" | "PATCH"` (`pendingQuery.store.ts`)
- **Confirmación es ENCUESTA TEXTUAL NUMERADA, no Poll nativo**: `freetext.handler` y `image.handler` llaman `sendObraConfirmationText()` (lista "¿En qué obra?", respondé con número). Existe `sendObraPoll()` (Poll nativo de WhatsApp) pero **no se llama desde ningún flujo**. `handlePollVote()` sigue conectado en `client.ts` por si se reactiva
- **Ruteo de mensajes** (`message.handler.ts`): texto numérico → `handleEntityTextReply` primero, luego `handleObraTextReply` si hay pending → `!comando` → `handleFreeText`. Audio se transcribe (`voice.handler` setea `message.body`) y cae al MISMO `handleFreeText`. Imagen → comprobante/factura → `sendObraConfirmationText`
- **`executePending()` SÍ ejecuta la API real**: arma el payload (agrega `obra_id`, `telefono`, `mensaje_id`), **interpola params de path** (ej: `:id` → `tarea_id`) vía `services/pathParams.service.ts`, y llama `callEndpoint()` (`api.service.ts`, fetch a `API_URL` con service role key)
- **Comandos registrados**: `!iniciar`, `!ayuda`, `!cancel`, `!obras` — **NO existe `!confirm`**
- **Whitelist de comandos sin verificar obra**: `!iniciar` y `!ayuda` (saltan `getUserObras`)
- **User cache**: `user.service.ts` cachea usuarios 5 min en Map en memoria

## Catálogo de entidades (nombres → IDs)

- El bot NO le pide ID al obrero: pide el nombre y lo resuelve contra un **catálogo por obra** (`GET /bot/catalogo`)
- **Backend acepta `?tipos=materiales,proveedores,rubros,tareas`** (comma-separated) y devuelve solo esas secciones; sin `tipos`, todas. `tareas` es `SELECT id, titulo AS nombre FROM tareas WHERE obra_id=$1`
- **El bot pide solo lo que necesita**: `neededCatalogTipos()` en `entityResolution.service.ts` une las secciones requeridas por todos los ops; definido en `ENDPOINT_CATALOG_KINDS`. **Regla**: al agregar un endpoint que resuelve entidades, mapearlo ahí
- **Endpoint sin mapear** → `null` → el bot pide el catálogo completo (backward-compatible). Hoy solo están mapeados **pedidos y tareas**; el resto (stock, retraso, gastos…) todavía no está pulido

| Endpoint | Kinds | Secciones catálogo |
|----------|-------|--------------------|
| `/bot/pedidoDeCompra` | material, proveedor | `materiales`, `proveedores` |
| `/bot/tareas` (crear) | rubro (`rubro_id` opcional) | `rubros` |
| `/bot/tareas/:id/completar` | tarea | `tareas` |

- **Tipos de entidad** (`EntityKind`): `material \| proveedor \| rubro \| tarea`. Slots en `entityResolution.service.ts`:
  - `material_nombre`/`nombre` → `material_id` (material)
  - `proveedor_nombre` → `proveedor_id` (proveedor)
  - `tarea` → `tarea_id` (**rubro**; endpoint `/bot/retraso` actualiza la tabla `rubros`)
  - `rubro_id` → `rubro_id` (rubro)
  - `tarea_nombre` → `tarea_id` (**tarea real**; endpoint completar)
- **Resolución**: `resolveEntity()` (LLM) decide match `alta` (aplica directo), `baja`/`ninguna` (encuesta al usuario con opciones). En encuesta de **tarea**, "Ninguno de estos" **cancela la operación**; en materiales ya existentes se auto-crea
- **El LLM NO genera UUIDs**: los campos-nombre se mandan con NOMBRE (regla del `SYSTEM_PROMPT`), la resolución es pipeline del bot. **No existe** pipeline `match_tareas` (era una descripción obsoleta del schema)

## Fuentes de verdad del schema

- `services/endpointSchema.ts` → define endpoints, parámetros requeridos/opcionales y fuentes (`llm`, `obra_poll`, `user_phone`, `auto`; `entity_resolution` ya sin uso)
- El `SYSTEM_PROMPT` de `llm.service.ts` **inyecta `buildEndpointDescription()`** (deriva de `ENDPOINTS`) → **cambiar el schema alcanza**, no hay prompt que duplicar. Solo cambia el schema si tocás campos, descripciones o endpoints
- Para endpoints con entidades a resolver, además hay que tocar `ENDPOINT_CATALOG_KINDS` y los `SLOTS` de `entityResolution.service.ts`

## Servicios y modelos LLM

| Servicio | Modelo | Notas |
|----------|--------|-------|
| `llm.service` | `openai/gpt-oss-120b` (Groq) | temperature=0, genera endpoint+JSON y resuelve entidades (`resolveEntity`) |
| `transcription.service` | `whisper-large-v3-turbo` | escribe tmp en `./tmp/`, limpia en `finally` |
| `vision.service` | `meta-llama/llama-4-scout-17b-16e-instruct` | analiza comprobantes/facturas argentinas vía Groq |

## Variables de entorno

- **WhatsApp-Bot**: `GROQ_API_KEY`, `MONGO_URI`, `NODE_ENV`, `SUPABASE_SERVICE_ROLE_KEY`, `API_URL`
- **Backend**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- NUNCA comitear `.env`

## Backend — rutas y flujo de tareas

- Rutas `/bot/*` (`routes/bot.js`, auth = service role key): `POST /bot/mensaje`, `GET /bot/catalogo`, `POST /bot/materiales`, `POST /bot/pedidoDeCompra`, `POST /bot/retraso`, `POST /bot/stock`, `POST /bot/tareas`, **`PATCH /bot/tareas/:id/completar`**, `POST /bot/gastos`, `POST /bot/obreros/registrar`, `GET /bot/obreros/telefono/:phone`
- **`PATCH /bot/tareas/:id/completar`** (`tareasController.js:completarTareaDesdeBot`):
  - `id` en la **URL**; body acepta `{ telefono, completada?, porcentaje_avance?, mensaje_id? }`
  - `completada=false` → **reabre** (estado `pendiente`, limpia `completada_por`/`fecha_completada`, % = 0 o el dado); default → `completada`, % = 100 o el dado
  - Valida `porcentaje_avance` entero 0-100; el obrero se resuelve por `telefono` → `miembro_obra` de la obra de la tarea (403 si no es miembro); marca `mensajes` como `procesado`
- Middlewares de auth: `botAuthMiddleware` (service role key directo) para `/bot/*`, `authMiddleware` (JWT Supabase vía `auth.getUser()`) para el resto

## Patrones de código

```
Archivos:        kebab-case.ts  → *.handler.ts, *.command.ts, *.service.ts, *.store.ts
Variables/func:  camelCase
Interfaces:      PascalCase
Async:           siempre Promise<T>
Stores:          Map en memoria (pendingQuery, userCache con TTL 5 min)
Idioma bot:      español rioplatense, *negrita* WhatsApp, bloques ```, emojis ✅❌⚠️
```

### Registrar comando nuevo

```typescript
// 1. crear archivo .command.ts con interface Command { name, description, execute }
// 2. importar y registerCommand() en message.handler.ts
```

### Registrar handler nuevo

```typescript
// 1. crear .handler.ts exportando async function handleTipo(phone, message)
// 2. agregar case MessageTypes.TIPO en message.handler.ts
```

### Agregar endpoint que resuelve entidades

```typescript
// 1. definir endpoint en endpointSchema.ts (params con source "llm" para los nombres) → el LLM lo ve automáticamente
// 2. agregar slot en SLOTS de entityResolution.service.ts (key nombre → targetKey _id, kind)
// 3. agregar el endpoint a ENDPOINT_CATALOG_KINDS para que el bot pida el catálogo justo (y no todo)
// 4. si el endpoint tiene params de path (ej: :id), el bot los interpola desde <resolved>_id vía pathParams.service.ts
```

## Seguridad y gotchas

- `.env` contiene `GROQ_API_KEY`, `MONGO_URI`, `SUPABASE_SERVICE_ROLE_KEY` — NUNCA comitear
- Dockerfile: build desde raíz del monorepo, solo copia `apps/WhatsApp-Bot/` al container
- `mongoStore.ts` busca session zips en `.wwebjs_auth/`
- `randomDelay(1000, 10000)` entre mensaje y respuesta (anti-detección)
- En producción Puppeteer: `--no-sandbox --disable-setuid-sandbox`
- `getPhoneNumber()` usa `message.getContact().number` (sin @c.us)
- `tsconfig.json` `module: commonjs` (no ESM a pesar de `"type": "module"` en root package.json)
- `tsc --noEmit` en WhatsApp-Bot falla por FALTAS de tipos pre-existentes (`qrcode-terminal`, `express`) — ignorar esos 2 errores
- Los params de path (ej: `/bot/tareas/:id/completar`) se interpolan en el payload con la clave resuelta (`tarea_id`) y se **sacan del body**; el body que llega al backend no debe contener IDs de path

## Apps

| App | Puerto | Stack | Estado |
|------|--------|-------|--------|
| WhatsApp-Bot | 3000 | whatsapp-web.js, Express (keep-alive) | ✅ Funcional |
| Backend | 3001 | Express + Supabase/PostgreSQL (rutas REST `/` + `/bot/*`) | ✅ Implementado |
| Frontend | Next.js default | Next.js 16, React 19, TailwindCSS 4 | 🚧 En desarrollo |