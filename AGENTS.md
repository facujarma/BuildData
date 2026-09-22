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
| `bun test apps/Backend/services/chatbot/sqlGuard.service.test.js` | Tests del guard SQL del ChatBot AI (sin LLM) |
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
- **Repregunta (clarification loop)**: si a una operación del LLM le faltan campos requeridos (`collectMissingFields` según el schema, incluye subcampos de `items`/`movimientos`), `freetext.handler` guarda una `Clarification` en el store y pregunta el `prompt` del primer campo faltante (definido por campo en `endpointSchema.ts`). `handleFreeText` delega a `clarification.handler` si hay repregunta pendiente (antes de cancelar pendings). Atajo sin LLM: si el campo preguntado (`pendingFieldPath`) es simple (número/booleano/palabra) y la respuesta parsea, `answerParser.service.ts` la escribe directo y se revalida; si no, `completeOperationFromReply` mergea con memoria (mensaje original + ops + últimos 2 intercambios), revalida y repregunta. Recién al completar sigue el flujo normal (`sendOperationConfirmation` → encuesta de obra → resolución de entidades). `!cancel`, una imagen nueva o un comando desconocido con pending cortan el loop
- **Prompt de repregunta acotado**: `completeOperationFromReply` NO manda `ENDPOINTS_DESC` completo; manda `buildEndpointIndex()` (resumen de 1 línea) + `buildEndpointDescription(paths)` solo del/los endpoint(s) en curso (~1.3k chars vs ~3k antes). `textToOperation` sigue usando la descripción completa
- **`executePending()` SÍ ejecuta la API real**: arma el payload (agrega `obra_id`, `telefono`, `mensaje_id`), **interpola params de path** (ej: `:id` → `tarea_id`) vía `services/pathParams.service.ts`, y llama `callEndpoint()` (`api.service.ts`, fetch a `API_URL` con service role key)
- **Comandos registrados**: `!iniciar`, `!ayuda`, `!cancel`, `!obras` — **NO existe `!confirm`**
- **Whitelist de comandos sin verificar obra**: `!iniciar` y `!ayuda` (saltan `getUserObras`)
- **User cache**: `user.service.ts` cachea usuarios 5 min en Map en memoria

## Resolución de entidades (nombres → IDs, sin LLM)

- El bot NO le pide ID al obrero: pide el nombre y lo resuelve contra las entidades de la obra vía `GET /bot/entidades/buscar` (Backend, `entitySearch.service.js`). Ya **no existe el catálogo** (`/bot/catalogo`, `neededCatalogTipos`, `ENDPOINT_CATALOG_KINDS` se eliminaron)
- Backend: exacto normalizado → fuzzy Levenshtein → similitud coseno (pgvector + OpenAI). En `alta`/`baja` devuelve solo candidatos confiables (≥ `UMBRAL_BAJA`); en `ninguna` devuelve igual los parecidos más flojos para la encuesta
- Bot (`entityResolution.service.ts` + `entityMatch.service.ts`): `alta` (umbral + margen) se aplica directo; `baja` y `ninguna` → encuesta con los candidatos; sin candidatos (catálogo vacío) pregunta sin opciones. **La resolución NO auto-crea materiales**; "Ninguno de estos" en materiales sí crea la entidad (elección explícita). El proveedor sin match y sin candidatos se descarta; con candidatos (aunque sean flojos) se encuesta y "Ninguno de estos" lo descarta
- **Tipos de entidad** (`EntityKind`): `material \| proveedor \| rubro \| tarea`. Slots en `entityResolution.service.ts` (revisa el contenedor raíz y los items de `items`/`movimientos`):
  - `material_nombre`/`nombre` → `material_id` (material)
  - `proveedor_nombre` → `proveedor_id` (proveedor)
  - `tarea` → `tarea_id` (**rubro**; endpoint `/bot/retraso` actualiza la tabla `rubros`)
  - `rubro_id` → `rubro_id` (rubro)
  - `tarea_nombre` → `tarea_id` (**tarea real**; endpoint completar)
- En encuesta de **tarea**, "Ninguno de estos" **cancela la operación**
- **El LLM NO genera UUIDs**: los campos-nombre se mandan con NOMBRE (regla del `SYSTEM_PROMPT`); la resolución es pipeline del bot

## Embeddings de entidades (pgvector + OpenAI)

- Migración manual una vez: `apps/Backend/outputs/migracion_embeddings.sql` (habilita `vector` y agrega `embedding vector(1536)`, `embedding_model`, `embedding_updated_at` a `materiales`, `proveedores`, `rubros`, `tareas`). **Sin índice a propósito**: catálogos chicos filtrados por obra; agregar HNSW solo si crece y medido
- `services/embeddings.service.js`: OpenAI `text-embedding-3-small` (configurable con `OPENAI_EMBEDDING_MODEL`), normaliza trim/espacios/minúsculas, lotes de 100, timeout 8s. `guardarEmbedding(s)` es best-effort (no lanza; la fila queda con embedding NULL)
- `services/entitySearch.service.js` + `GET /bot/entidades/buscar`: resolución sin LLM (exacto normalizado → fuzzy Levenshtein → similitud coseno), auto-repara filas con embedding NULL antes de comparar, y si OpenAI falla sigue solo con fuzzy. Devuelve `{ confianza, candidatos }`; umbrales (`UMBRAL_ALTA/BAJA/MARGEN_ALTA`) provisorios a calibrar. Calibración: `cd apps/Backend && node scripts/probar_busqueda.js --tipo=material --obra=<uuid> --nombre="semento"`
- **Regla**: todo write path que cree o cambie el nombre/título de una entidad llama `guardarEmbedding(s)` **después del commit** (nunca dentro de una transacción abierta). Hoy: materiales (`materialesController`, `botController.crearMaterialDesdeBot`, `pedidosController.crearPedidoWeb`), proveedores (`proveedoresController` crear/editar), rubros (`rubrosController` create/update, `obrasController` create obra), tareas (`tareasController` crear, crearTareaDesdeBot, actualizarTarea). Al agregar un write path nuevo, sumarlo
- Backfill/reproceso: `cd apps/Backend && node scripts/backfill_embeddings.js [--tipo=material|proveedor|rubro|tarea|all] [--obra=<uuid>] [--force]`

## ChatBot AI (preguntas en lenguaje natural → SQL → respuesta)

- **Endpoint**: `POST /chat/consultar` (`authMiddleware`, body `{ pregunta, obra_id }`). Valida membresía con `miembros_obra` (403 si no pertenece). **Una obra activa por consulta** (no compara obras)
- **Pipeline** (`services/chatbot/chatbot.service.js`): `planner.service.js` descompone la pregunta en subpreguntas (máx 5, con período/agrupamiento/límite) → `sqlGenerator.service.js` genera un SELECT por subpregunta → `sqlGuard.service.js` valida y ejecuta → `narrator.service.js` redacta la respuesta final. El planner **no escribe SQL**; el SQL generator recibe solo su subpregunta
- **Parámetros del SQL**: `$1` = `obra_id`; `$2`/`$3` = desde/hasta (solo si hay período). El SQL nunca interpola valores
- **Guard + ejecución** (`sqlGuard.service.js`): una sola sentencia `SELECT|WITH`, sin comentarios/DDL/DML/esquemas del sistema, tablas de la whitelist, filtro `obra_id = $1` obligatorio (o `id = $1` para `obras`) y joins de detalle a su padre. Se ejecuta en `BEGIN; SET LOCAL TRANSACTION READ ONLY; statement_timeout=5s; ROLLBACK` con `LIMIT` ≤ 500. La validación es heurística: la barrera dura es la transacción read-only. Tests sin LLM: `bun test apps/Backend/services/chatbot/sqlGuard.service.test.js`
- **`schemaContext.js`** es la fuente de verdad del chatbot: tablas permitidas, columnas reales, glosario y métricas derivadas (ej: disponible = total − ejecutado − comprometido). **Sacado de la DB real (`information_schema`)**, no de `outputs/migracion_final.sql` (desactualizado). Al agregar una tabla/columna relevante, actualizarlo
- **Modelo**: Groq `openai/gpt-oss-120b` con `temperature=0`, `response_format: json_object` y `reasoning_effort: low`. Ojo: es modelo con razonamiento → `max_tokens` holgado o el contenido vuelve vacío
- **Auditoría**: tabla `chat_consultas` (pregunta, plan, SQL, filas, error, ms). Migración manual: `apps/Backend/outputs/migracion_chatbot.sql`
- **CLI de prueba**: `node apps/Backend/scripts/probar_planner.js --pregunta="..."` (solo descomposición) y `node apps/Backend/scripts/probar_chatbot.js --obra=<uuid> --pregunta="..."` (end-to-end). El CLI cae al `GROQ_API_KEY` de `apps/WhatsApp-Bot/.env` si el Backend no lo tiene
- **Frontend**: el componente `ChatBubble` (Buildo, `app/[obraId]/dashboard/_components/ChatBubble.tsx`) está activo en el layout del dashboard y consulta `POST /chat/consultar` vía `services/chatbotService.ts` (JWT de Supabase + `obra_id`). El endpoint **no tiene memoria conversacional**: cada pregunta es independiente (no hay follow-ups tipo "y el mes pasado?")
- Pendiente: rate limit por persona, rol Postgres read-only dedicado, memoria conversacional

## Stock y entrega de pedidos (web)

- Migración manual una vez: `apps/Backend/outputs/migracion_stock_entregas.sql` (`materiales.ubicacion/foto_url/activo`, tabla `categorias_materiales`, columnas de entrega en `pedidos_materiales`, bucket público `materiales`)
- `services/stock.service.js:aplicarMovimientoStock(client, …)` es el único lugar que suma/resta `stock_actual`, inserta en `movimientos_stock` (`entrada`/`salida`) y crea la alerta `stock_bajo`. Lo usan `POST /bot/stock`, `POST /materiales/:id/ajuste`, `PATCH /materiales/:id` (si cambia `stock_actual`) y `PATCH /pedidos/:id/entregar`. Requiere transacción abierta
- **Materiales**: `DELETE /materiales/:id` es soft delete (`activo=false`, por las FK de `pedidos_items`/`movimientos_stock`). Todo lookup de materiales por nombre (bot, `crearPedidoWeb`, `entitySearch`) filtra `activo`. `GET /materiales/:obra_id` y `GET /materiales/:obra_id/categorias` devuelven solo activos; `numeric` llega como string (el frontend hace `Number()`)
- **Foto**: `POST /materiales/:id/foto` recibe la imagen cruda (`Content-Type` image/jpeg|png|webp, máx 5 MB), la sube al bucket `materiales` con la service role key y guarda la URL pública en `foto_url`
- **Pedidos**: `PATCH /pedidos/:id/estado` (`en_camino`|`demorado`) y `PATCH /pedidos/:id/entregar` (estado `entregado` + fecha/lugar/receptor/documento + entrada de stock por cada ítem con material). Ambos exigen estado `aprobado`/`en_camino`/`demorado` (409 si no). `fecha_entrega` sale de `getPedidos` como texto `YYYY-MM-DDTHH:MM` (sin corrimiento de zona horaria)
- `/materiales` y `/pedidos` validan membresía a la obra (`services/obraAccess.service.js`, 403 si no pertenece)

## Proveedores (catálogo global + agenda por obra)

- Migración manual una vez: `apps/Backend/outputs/migracion_proveedores.sql` (`scope`/`obra_id`/`activo`/`empresa_id` y demás columnas en `proveedores`, tabla `proveedores_favoritos`, índices únicos parciales por ámbito reemplazando `proveedores_nombre_unique`)
- Un proveedor es `scope='global'` (`obra_id` NULL, catálogo de toda la empresa) o `scope='obra'` (propio de una obra). El nombre es único por ámbito (`lower(nombre)`), así que un proveedor de obra puede llamarse igual que uno global
- `PATCH /proveedores/:id` nunca cambia `scope`/`obra_id`; eso lo hace únicamente `POST /proveedores/:id/promover` (de obra → global), que rechaza con 409 si ya existe un global con ese nombre
- Favoritos son por persona (`proveedores_favoritos`, PK `persona_id, proveedor_id`), no una propiedad del proveedor: `PATCH /proveedores/:id/favorito`
- `DELETE /proveedores/:id` es soft delete (`activo=false`); todo GET filtra `activo`, igual que `materiales`
- `GET /proveedores` requiere `obra_id` (membresía + ahí se calculan `pedidos_count`/`spent` de esa obra vía `pedidos_materiales`/`pedidos_items`) y acepta `scope=global|obra` (default global) y `q` (busca por nombre/rubro/contacto/descripción)
- `entitySearch` trata `proveedor` igual que `material`: `(obra_id = obra OR obra_id IS NULL) AND activo`
- `pedidos_materiales.proveedor_id` es FK real a `proveedores` (ya lo era antes de esta migración). `POST /pedidos` (web, `pedidosController.crearPedidoWeb`) recibe `proveedor_id` directo — no texto: el frontend elige de un `<select>` (`NewOrderModal`, con alta rápida vía `SupplierModal` si no existe) y el Backend valida que sea un proveedor `activo` accesible desde esa obra (`scope='global'` o `obra_id` de la obra), 400 si no. **`POST /bot/pedidoDeCompra` (WhatsApp-Bot) es un endpoint aparte en `botController.js` y ya recibía `proveedor_id` de antes** — no se tocó nada del bot ni de ese endpoint
- `empresa_id` existe en la tabla (nullable, sin FK) para cuando haya soporte multi-empresa; hoy ningún endpoint lo usa ni lo filtra

## Fuentes de verdad del schema

- `services/endpointSchema.ts` → define endpoints, parámetros requeridos/opcionales y fuentes (`llm`, `obra_poll`, `user_phone`, `auto`; `entity_resolution` ya sin uso), el `prompt` de repregunta de cada campo requerido `llm` y `elementParams` para validar/repreguntar subcampos de arrays (path `items[0].cantidad`). Guard al importar: todo campo requerido `llm` debe tener `prompt` o tira error
- El `SYSTEM_PROMPT` de `llm.service.ts` **inyecta `buildEndpointDescription()`** (deriva de `ENDPOINTS`) → **cambiar el schema alcanza**, no hay prompt que duplicar. Solo cambia el schema si tocás campos, descripciones, prompts o endpoints
- Para endpoints con entidades a resolver, además hay que mapear el campo-nombre en los `SLOTS` de `entityResolution.service.ts` (la búsqueda del Backend es genérica por `EntityKind`)

## Servicios y modelos LLM

| Servicio | Modelo | Notas |
|----------|--------|-------|
| `llm.service` | `openai/gpt-oss-120b` (Groq) | temperature=0, genera endpoint+JSON (`textToOperation`) y completa operaciones en la repregunta (`completeOperationFromReply`) |
| `transcription.service` | `whisper-large-v3-turbo` | escribe tmp en `./tmp/`, limpia en `finally` |
| `vision.service` | `meta-llama/llama-4-scout-17b-16e-instruct` | analiza comprobantes/facturas argentinas vía Groq |

## Variables de entorno

- **WhatsApp-Bot**: `GROQ_API_KEY`, `MONGO_URI`, `NODE_ENV`, `SUPABASE_SERVICE_ROLE_KEY`, `API_URL`
- **Backend**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `OPENAI_API_KEY` (embeddings), `OPENAI_EMBEDDING_MODEL` (opcional, default `text-embedding-3-small`), `GROQ_API_KEY` (ChatBot AI)
- NUNCA comitear `.env`

## Backend — rutas y flujo de tareas

- Rutas `/bot/*` (`routes/bot.js`, auth = service role key): `POST /bot/mensaje`, `GET /bot/entidades/buscar`, `POST /bot/materiales`, `POST /bot/pedidoDeCompra`, `POST /bot/retraso`, `POST /bot/stock`, `POST /bot/tareas`, **`PATCH /bot/tareas/:id/completar`**, `POST /bot/gastos`, `POST /bot/obreros/registrar`, `GET /bot/obreros/telefono/:phone`
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
// 2. agregar slot en SLOTS de entityResolution.service.ts (key nombre → targetKey _id, kind) → la búsqueda por similitud lo resuelve sola
// 3. si el endpoint tiene params de path (ej: :id), el bot los interpola desde <resolved>_id vía pathParams.service.ts
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
