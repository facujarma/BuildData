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
- **Tests**: `bun test` corre los unitarios de WhatsApp-Bot (hoy: `endpointSchema.test.ts` — validación/repregunta/descripciones — y `answerParser.service.test.ts` — atajo determinista). `tsconfig.json` excluye `*.test.ts` para que `tsc` no necesite `bun:test`. Del Backend: `bun test apps/Backend/services/embeddings.service.test.js`

## Arquitectura (lo que los nombres no dicen)

- **LLM genera endpoint + JSON body, NO SQL**: `textToOperation()` devuelve `{endpoint, method, data, comment}`, no un `RawOperation` con action/table/data
- **Pending store es union type**: `PendingQuery = operation \| comprobante \| factura`; `ApiCall.method = "POST" | "GET" | "PATCH"` (`pendingQuery.store.ts`)
- **Confirmación es ENCUESTA TEXTUAL NUMERADA, no Poll nativo**: `freetext.handler` y `image.handler` llaman `sendObraConfirmationText()` (lista "¿En qué obra?", respondé con número). Existe `sendObraPoll()` (Poll nativo de WhatsApp) pero **no se llama desde ningún flujo**. `handlePollVote()` sigue conectado en `client.ts` por si se reactiva
- **Ruteo de mensajes** (`message.handler.ts`): texto numérico → `handleEntityTextReply` primero, luego `handleObraTextReply` si hay pending → `!comando` → `handleFreeText`. Audio se transcribe (`voice.handler` setea `message.body`) y cae al MISMO `handleFreeText`. Imagen → comprobante/factura → `sendObraConfirmationText`
- **Repregunta (clarification loop)**: si a una operación del LLM le faltan campos requeridos (`collectMissingFields` según el schema, incluye subcampos de `items`/`movimientos`), `freetext.handler` guarda una `Clarification` en el store y pregunta el `prompt` del primer campo faltante (definido por campo en `endpointSchema.ts`). `handleFreeText` delega a `clarification.handler` si hay repregunta pendiente (antes de cancelar pendings). Atajo sin LLM: si el campo preguntado (`pendingFieldPath`) es simple (número/booleano/palabra) y la respuesta parsea, `answerParser.service.ts` la escribe directo y se revalida; si no, `completeOperationFromReply` mergea con memoria (mensaje original + ops + últimos 2 intercambios), revalida y repregunta. Recién al completar sigue el flujo normal (`sendOperationConfirmation` → encuesta de obra → resolveEntity). `!cancel`, una imagen nueva o un comando desconocido con pending cortan el loop
- **Prompt de repregunta acotado**: `completeOperationFromReply` NO manda `ENDPOINTS_DESC` completo; manda `buildEndpointIndex()` (resumen de 1 línea) + `buildEndpointDescription(paths)` solo del/los endpoint(s) en curso (~1.3k chars vs ~3k antes). `textToOperation` sigue usando la descripción completa
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
- **Motor de resolución** (`ENTITY_RESOLVER`): `llm` (default) usa `resolveEntity` con catálogo; `embeddings` llama a `GET /bot/entidades/buscar` (sin tokens de LLM) y cae a LLM si la búsqueda falla. `entityMatch.service.ts` mapea alta → aplica; baja y ninguna → encuesta con los candidatos más parecidos (aunque sean flojos). **La resolución NO auto-crea materiales**: sin match se pregunta; solo con catálogo vacío la pregunta no tiene opciones. El proveedor sin match se descarta; "Ninguno de estos" en materiales sí crea la entidad (elección explícita del usuario)
- **El LLM NO genera UUIDs**: los campos-nombre se mandan con NOMBRE (regla del `SYSTEM_PROMPT`), la resolución es pipeline del bot. **No existe** pipeline `match_tareas` (era una descripción obsoleta del schema)

## Embeddings de entidades (pgvector + OpenAI)

- Migración manual una vez: `apps/Backend/outputs/migracion_embeddings.sql` (habilita `vector` y agrega `embedding vector(1536)`, `embedding_model`, `embedding_updated_at` a `materiales`, `proveedores`, `rubros`, `tareas`). **Sin índice a propósito**: catálogos chicos filtrados por obra; agregar HNSW solo si crece y medido
- `services/embeddings.service.js`: OpenAI `text-embedding-3-small` (configurable con `OPENAI_EMBEDDING_MODEL`), normaliza trim/espacios/minúsculas, lotes de 100, timeout 8s. `guardarEmbedding(s)` es best-effort (no lanza; la fila queda con embedding NULL)
- `services/entitySearch.service.js` + `GET /bot/entidades/buscar`: resolución sin LLM (exacto normalizado → fuzzy Levenshtein → similitud coseno), auto-repara filas con embedding NULL antes de comparar, y si OpenAI falla sigue solo con fuzzy. Devuelve `{ confianza, candidatos }`; umbrales (`UMBRAL_ALTA/BAJA/MARGEN_ALTA`) provisorios a calibrar. Calibración: `cd apps/Backend && node scripts/probar_busqueda.js --tipo=material --obra=<uuid> --nombre="semento"`
- **Regla**: todo write path que cree o cambie el nombre/título de una entidad llama `guardarEmbedding(s)` **después del commit** (nunca dentro de una transacción abierta). Hoy: materiales (`materialesController`, `botController.crearMaterialDesdeBot`, `pedidosController.crearPedidoWeb`), proveedores (`proveedoresController`, `pedidosController.resolverProveedor`), rubros (`rubrosController` create/update, `obrasController` create obra), tareas (`tareasController` crear, crearTareaDesdeBot, actualizarTarea). Al agregar un write path nuevo, sumarlo
- Backfill/reproceso: `cd apps/Backend && node scripts/backfill_embeddings.js [--tipo=material|proveedor|rubro|tarea|all] [--obra=<uuid>] [--force]`

## Fuentes de verdad del schema

- `services/endpointSchema.ts` → define endpoints, parámetros requeridos/opcionales y fuentes (`llm`, `obra_poll`, `user_phone`, `auto`; `entity_resolution` ya sin uso), el `prompt` de repregunta de cada campo requerido `llm` y `elementParams` para validar/repreguntar subcampos de arrays (path `items[0].cantidad`). Guard al importar: todo campo requerido `llm` debe tener `prompt` o tira error
- El `SYSTEM_PROMPT` de `llm.service.ts` **inyecta `buildEndpointDescription()`** (deriva de `ENDPOINTS`) → **cambiar el schema alcanza**, no hay prompt que duplicar. Solo cambia el schema si tocás campos, descripciones, prompts o endpoints
- Para endpoints con entidades a resolver, además hay que tocar `ENDPOINT_CATALOG_KINDS` y los `SLOTS` de `entityResolution.service.ts`

## Servicios y modelos LLM

| Servicio | Modelo | Notas |
|----------|--------|-------|
| `llm.service` | `openai/gpt-oss-120b` (Groq) | temperature=0, genera endpoint+JSON, resuelve entidades (`resolveEntity`) y completa operaciones en la repregunta (`completeOperationFromReply`) |
| `transcription.service` | `whisper-large-v3-turbo` | escribe tmp en `./tmp/`, limpia en `finally` |
| `vision.service` | `meta-llama/llama-4-scout-17b-16e-instruct` | analiza comprobantes/facturas argentinas vía Groq |

## Variables de entorno

- **WhatsApp-Bot**: `GROQ_API_KEY`, `MONGO_URI`, `NODE_ENV`, `SUPABASE_SERVICE_ROLE_KEY`, `API_URL`, `ENTITY_RESOLVER` (opcional, default `llm`; `embeddings` = resolver por similitud sin LLM)
- **Backend**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `OPENAI_API_KEY` (embeddings), `OPENAI_EMBEDDING_MODEL` (opcional, default `text-embedding-3-small`)
- NUNCA comitear `.env`

## Backend — rutas y flujo de tareas

- Rutas `/bot/*` (`routes/bot.js`, auth = service role key): `POST /bot/mensaje`, `GET /bot/catalogo`, `GET /bot/entidades/buscar`, `POST /bot/materiales`, `POST /bot/pedidoDeCompra`, `POST /bot/retraso`, `POST /bot/stock`, `POST /bot/tareas`, **`PATCH /bot/tareas/:id/completar`**, `POST /bot/gastos`, `POST /bot/obreros/registrar`, `GET /bot/obreros/telefono/:phone`
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
// 1. definir endpoint en endpointSchema.ts (params con source "llm" para los nombres, con "prompt" de repregunta y "elementParams" si es un array) → el LLM y el loop de repregunta lo ven automáticamente
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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
