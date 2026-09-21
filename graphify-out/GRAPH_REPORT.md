# Graph Report - BuildData  (2026-09-21)

## Corpus Check
- 348 files · ~219,179 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .lock 2, .ico 1)

## Summary
- 2087 nodes · 4256 edges · 126 communities (93 shown, 33 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 248 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e05de4a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- live-dashboard.jsx
- ScreenCronograma.tsx
- QuickAddModal.tsx
- ScreenConfiguracion.tsx
- message.handler routing
- Frontend redesign plan (dashboard + grouped sidebar)
- payments/page.tsx
- package.json
- ScreenPresupuesto.tsx
- 1. Lenguaje y contenido
- landing.ts
- nueva-obra.jsx
- WhatsApp-Bot/package.json
- ObrasHome.tsx
- sqlGuard.service.js
- ScreenPedidos.tsx
- message.handler.ts
- SupplierModal.tsx
- NuevaObraModal.tsx
- pollConfirmation.service.ts
- HowItWorks.tsx
- bot.js
- ScreenReportes.tsx
- Button.tsx
- Auditoría de inconsistencias UI/UX — Frontend BuildData
- settings-page.jsx
- alertasService.ts
- dashboard/_components/index.ts
- actionExecuted.service.ts
- vision.service.ts
- mensajesService.ts
- obras-home.jsx
- compilerOptions
- entityResolution.service.ts
- LiveDashboard.tsx
- 2. Sistema visual y componentes
- react
- dashboard-empty.jsx
- planes-page.jsx
- next
- pendingQuery.store.ts
- endpointSchema.ts
- server.js
- usuarios.js
- Frontend/package.json
- DashboardContent.tsx
- tweaks-panel.jsx
- ScreenAlertas.tsx
- i18n.jsx
- Button
- app/page.tsx
- client.ts
- compilerOptions
- db.js
- tareasController.js
- NotificationsPanel.tsx
- 3. Interacción y flujos
- obrasController.js
- NuevaTareaModal.tsx
- UnderConstructionPage.tsx
- dashboard.api.ts
- Database schema (obras construction)
- tasks
- Frontend App (Next.js)
- format.ts
- ScreenProveedores
- LiveBot.tsx
- taskPct
- perfil/data/index.ts
- actividadService.ts
- CompareTable.tsx
- entitySearch.service.js
- rubrosController.js
- DashboardSection.tsx
- Pricing.tsx
- Inconsistencias de diseño UI/UX — BuildData
- howitworks.jsx
- ScreenDashboard
- useStore
- TaskDetail
- 7. Contenido de marketing y planes
- materialesController.js
- 5. Terminología inconsistente · `D-*`
- 6. Accesibilidad desde el diseño
- Ascending bar chart glyph (three white rounded rectangles)
- FAQ.tsx
- galeriaService.ts
- FakeMessageCard.tsx
- phone-input.jsx
- profile-page.jsx
- mongoStore (custom RemoteAuth store)
- logo-buildata.svg (SVG brand logo asset)
- live-bot.jsx
- Backend /bot/* routes (REST API)
- costos/page.tsx
- materiales/page.tsx
- registro/page.tsx
- chat-bubble.jsx
- product-tour.jsx
- Navbar.tsx
- opencode.json
- probar_busqueda.js
- testConnection.js
- Frontend App (Next.js)
- 4. Estructura, navegación y arquitectura de información
- postcss.config.mjs
- alertas/page.tsx
- inbox/page.tsx
- AlertDrawer
- bold
- useCatStore
- ApiCall.method union (POST | GET | PATCH)
- Globe SVG Icon
- Vercel Logo SVG (asset public/vercel.svg)
- WhatsApp Bot architecture (message flow diagram)
- Dockerfile (oven/bun:1.3.12, Chrome 146)

## God Nodes (most connected - your core abstractions)
1. `react` - 87 edges
2. `@gravity-ui/icons` - 82 edges
3. `Button()` - 31 edges
4. `next` - 28 edges
5. `pool` - 25 edges
6. `useToast()` - 23 edges
7. `guardarEmbedding()` - 20 edges
8. `useDashboardData()` - 20 edges
9. `1. Lenguaje y contenido` - 20 edges
10. `DPageHeader()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `7. Consistencia visual y sistema de diseño · `E-*`` --references--> `WInput()`  [INFERRED]
  AUDITORIA_UI_UX_FRONTEND.md → apps/Frontend/TMP/nueva-obra.jsx
- `8. Estados: loading, error, vacío y feedback · `F-*`` --references--> `ScreenEquipo()`  [INFERRED]
  AUDITORIA_UI_UX_FRONTEND.md → apps/Frontend/src/app/[obraId]/dashboard/equipo/_components/ScreenEquipo.tsx
- `7. Consistencia visual y sistema de diseño · `E-*`` --references--> `ScreenReportes()`  [INFERRED]
  AUDITORIA_UI_UX_FRONTEND.md → apps/Frontend/src/app/[obraId]/dashboard/reportes/_components/ScreenReportes.tsx
- `15. Anexo — verificaciones descartadas (para no repetir trabajo)` --references--> `getStatus()`  [INFERRED]
  AUDITORIA_UI_UX_FRONTEND.md → apps/Frontend/src/app/[obraId]/dashboard/stock/data/index.ts
- `6. Navegación y rutas rotas · `C-*`` --references--> `AvatarMenu()`  [INFERRED]
  AUDITORIA_UI_UX_FRONTEND.md → apps/Frontend/src/components/ui/AvatarMenu.tsx

## Import Cycles
- 4-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/freetext.handler.ts -> apps/WhatsApp-Bot/src/handlers/clarification.handler.ts -> apps/WhatsApp-Bot/src/client.ts`
- 5-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/voice.handler.ts -> apps/WhatsApp-Bot/src/handlers/freetext.handler.ts -> apps/WhatsApp-Bot/src/handlers/clarification.handler.ts -> apps/WhatsApp-Bot/src/client.ts`

## Hyperedges (group relationships)
- **WhatsApp message routing + LLM operation execution flow** — agents_message_handler, agents_freetext_handler, agents_voice_handler, agents_image_handler, agents_texttooperation, agents_pendingquery_store, agents_executepending [EXTRACTED 1.00]
- **Mock services following the stockService seed+delay+clone pattern** — apps_frontend_tmp_temp_stockservice, apps_frontend_tmp_temp_inbox_service, apps_frontend_tmp_temp_galeria_service, apps_frontend_tmp_temp_notificaciones_service, apps_frontend_tmp_temp_configuracion_service, apps_frontend_tmp_temp_perfil_service, apps_frontend_tmp_temp_rubros_service [INFERRED 0.85]
- **Grouped navigation redesign (8 items, ?v= sub-tabs, legacy redirects)** — apps_frontend_tmp_temp_grouped_nav, apps_frontend_tmp_temp_grouptabs, apps_frontend_tmp_temp_dashsidebar, apps_frontend_tmp_temp_searchparams_v, apps_frontend_tmp_temp_redirects [INFERRED 0.85]

## Communities (126 total, 33 thin omitted)

### Community 0 - "live-dashboard.jsx"
Cohesion: 0.02
Nodes (53): ACT_LISTENERS, ACTIVITY_SEED, ActivityStore, ALERT_LISTENERS, ALERTS_SEED, AlertStore, BUDGET, CAT_COLORS (+45 more)

### Community 1 - "ScreenCronograma.tsx"
Cohesion: 0.09
Nodes (48): Props, UploadPhotosModal(), buildGrid(), CalendarView(), DAY_HEADERS, DayInfo, Props, WEEKENDS (+40 more)

### Community 2 - "QuickAddModal.tsx"
Cohesion: 0.13
Nodes (13): FieldDef, FormConfig, Props, QUICK_FORMS, QuickAddGeneric(), QuickAddRubro(), QuickAddTarea(), CATEGORIES (+5 more)

### Community 3 - "ScreenConfiguracion.tsx"
Cohesion: 0.07
Nodes (25): ObraDefaults, ScreenConfiguracion(), SecPlan(), ConfiguracionPlan, INTEGRACIONES_SEED, IntegracionItem, OBRA_SETTINGS, ObraEstado (+17 more)

### Community 4 - "message.handler routing"
Cohesion: 0.05
Nodes (52): api.service, /bot/pedidoDeCompra endpoint, /bot/retraso endpoint (updates rubros table), /bot/tareas endpoint (crear, rubro_id opcional), PATCH /bot/tareas/:id/completar, buildEndpointDescription(), callEndpoint() (fetch to API_URL, service role key), Per-obra entity catalog (GET /bot/catalogo) (+44 more)

### Community 5 - "Frontend redesign plan (dashboard + grouped sidebar)"
Cohesion: 0.06
Nodes (47): BuildData platform (WhatsApp bot + REST API + Frontend), Blueprint background motif (AI insight banner), ChatBubble (loaded-state AI chatbot), dashboard-empty.jsx (onboarding empty state), DashboardPage (root, tweakable state), Empty (onboarding) vs loaded dashboard states, i18n es/en language switching, LiveDashboard (loaded/empty screens) (+39 more)

### Community 6 - "payments/page.tsx"
Cohesion: 0.21
Nodes (5): CTA(), Hero(), Pricing(), Stats(), Footer()

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): dependencies, cors, dotenv, express, groq-sdk, multer, pg, @supabase/supabase-js (+29 more)

### Community 8 - "ScreenPresupuesto.tsx"
Cohesion: 0.15
Nodes (21): BudgetAuditEntry, BudgetEditModal(), DraftLine, Props, Donut(), DonutProps, ASSUMPTIONS, KPI_TONES (+13 more)

### Community 9 - "1. Lenguaje y contenido"
Cohesion: 0.10
Nodes (20): 1.10 · Onboarding con mensajes que se contradicen — Alta, 1.11 · "Hace hace" en los tiempos relativos — Baja, 1.12 · Etiquetas internas a la vista — Media, 1.13 · Un pedido rechazado se muestra como "CANCELADO" — Media, 1.14 · Prioridades sin escala visual ni traducción — Media, 1.15 · "Disponible" significa dos cosas distintas — Media, 1.16 · "En tránsito", "En camino" y "EN CAMINO" — Baja, 1.17 · Formatos de moneda múltiples — Alta (+12 more)

### Community 10 - "landing.ts"
Cohesion: 0.21
Nodes (7): BENEFICIOS_ITEMS, BENEFICIOS_STATS, PROBLEMA_ITEMS, PROBLEMA_STATS, benefitIconMap, iconMap, Problema()

### Community 11 - "nueva-obra.jsx"
Cohesion: 0.10
Nodes (20): allPerm(), DEFAULT_RUBROS, fmtMoney(), initialsFromName(), isEmail(), makeRoles(), makeRubros(), MORE_PEOPLE (+12 more)

### Community 12 - "WhatsApp-Bot/package.json"
Cohesion: 0.07
Nodes (29): dependencies, axios, dotenv, express, groq-sdk, mongoose, qrcode-terminal, whatsapp-web.js (+21 more)

### Community 13 - "ObrasHome.tsx"
Cohesion: 0.06
Nodes (22): ObraCard(), ObraRow(), FILTERS, ObrasHome(), ObraThumb(), WelcomeHero(), ProjectsSkeleton(), NAV_BOTTOM (+14 more)

### Community 14 - "sqlGuard.service.js"
Cohesion: 0.08
Nodes (41): consultarChat(), router, auditar(), consultar(), completarJSON(), getCliente(), MODELO_DEFAULT, construirSystemPrompt() (+33 more)

### Community 15 - "ScreenPedidos.tsx"
Cohesion: 0.14
Nodes (29): DeliveryData, DeliveryModal(), Props, NewOrderModal(), Props, OrderDrawer(), Props, STEPS (+21 more)

### Community 16 - "message.handler.ts"
Cohesion: 0.15
Nodes (29): ayudaCommand, buildingsCommand, cancelCommand, Command, commands, getAllCommands(), getCommand(), registerCommand() (+21 more)

### Community 17 - "SupplierModal.tsx"
Cohesion: 0.10
Nodes (18): Props, SupplierData, InviteTeamModal(), InviteTeamModalProps, ScreenEquipo(), Obrero, Person, ROLES (+10 more)

### Community 18 - "NuevaObraModal.tsx"
Cohesion: 0.11
Nodes (26): INITIAL_DATA, NuevaObraModal(), validateStep(), PickCard(), Step1(), TYPE_ICONS, Step2(), Step3() (+18 more)

### Community 19 - "pollConfirmation.service.ts"
Cohesion: 0.20
Nodes (22): getClient(), getEntityPending(), getPending(), setEntityPending(), setPending(), applyQuestionAnswer(), resolveOperationEntities(), interpolatePathParams() (+14 more)

### Community 20 - "HowItWorks.tsx"
Cohesion: 0.11
Nodes (6): DashboardMockup(), PhoneMockup(), PhoneMockupProps, LOGOS, Hero(), STAGES

### Community 21 - "bot.js"
Cohesion: 0.12
Nodes (23): actualizarAccionesMensaje(), actualizarStock(), crearMaterialDesdeBot(), crearPedidoDeCompra(), ESTADOS_PROCESAMIENTO, recibirMensaje(), registrarRetraso(), crearGasto() (+15 more)

### Community 22 - "ScreenReportes.tsx"
Cohesion: 0.33
Nodes (9): RANGES, ScreenReportes(), SECTION_ICONS, RANGE_LABELS, SECTION_DEFS, SectionDef, SNAPSHOT, getReportesData() (+1 more)

### Community 23 - "Button.tsx"
Cohesion: 0.11
Nodes (23): NewCategoryModal(), Props, ScreenStock(), Props, StockItemModal(), CAT_COLORS, CATEGORIES, getStatus() (+15 more)

### Community 24 - "Auditoría de inconsistencias UI/UX — Frontend BuildData"
Cohesion: 0.12
Nodes (16): 10. Formatos de fecha / número / moneda · `H-*`, 11. Accesibilidad · `I-*`, 12. Responsive · `J-*`, 14. Priorización sugerida, 1. Resumen ejecutivo (top 12), 2. Mapa de fuentes de datos (lo que la UI dice vs. lo que realmente hay), 3. Persistencia falsa y datos que "aparecen mágicamente" · `A-*`, 4. Datos mágicos y contadores inventados · `B-*` (+8 more)

### Community 25 - "settings-page.jsx"
Cohesion: 0.10
Nodes (4): ALL_PERMS, DEFAULT_ROLES, PERM_GROUPS, SETTINGS_NAV

### Community 26 - "alertasService.ts"
Cohesion: 0.23
Nodes (11): TabDef, AlertaItem, AlertaLvl, AlertaState, AlertasData, ApiAlerta, createAlert(), mapAlerta() (+3 more)

### Community 27 - "dashboard/_components/index.ts"
Cohesion: 0.07
Nodes (33): ChatBubble(), ChatBubbleProps, SUGGESTED, ContextValue, DashboardDataContext, DashboardDataProvider(), noop(), RubroInfo (+25 more)

### Community 28 - "actionExecuted.service.ts"
Cohesion: 0.15
Nodes (25): ACTION_META, ActionExecuted, ActionMeta, ActionOutcome, add(), arrayOf(), asRecord(), buildActionExecuted() (+17 more)

### Community 29 - "vision.service.ts"
Cohesion: 0.20
Nodes (8): groq, ComprobanteData, DocumentType, ExtractedDocument, FacturaData, FacturaItem, groq, ref_groq_sdk

### Community 30 - "mensajesService.ts"
Cohesion: 0.13
Nodes (20): HighlightedRaw(), Props, InboxCorrectModal(), Props, Result, TIPOS, ActionExecutedRow, getInbox() (+12 more)

### Community 31 - "obras-home.jsx"
Cohesion: 0.11
Nodes (5): FILES, OBRAS, STATUS, WORKSPACE_NAV, WORKSPACE_NAV_BOTTOM

### Community 32 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "entityResolution.service.ts"
Cohesion: 0.10
Nodes (30): actualizarMensajeAcciones(), apiRequest(), AUTH_HEADERS, buscarEntidades(), callEndpoint(), crearMaterial(), getUserByPhone(), MaterialCreado (+22 more)

### Community 35 - "2. Sistema visual y componentes"
Cohesion: 0.12
Nodes (17): 2.10 · Pills y avatares redibujados en la landing y el login — Media, 2.11 · Dos sistemas de aviso que pueden superponerse — Baja, 2.12 · Los errores se muestran con estética de éxito — Alta, 2.13 · El esqueleto de carga no coincide con el contenido real — Baja, 2.14 · Tres formas de indicar que algo está cargando — Media, 2.15 · Identificadores con longitudes distintas y textos cortados — Baja, 2.16 · Colores de estado definidos por duplicado — Media, 2.1 · Los estados se pintan y se nombran distinto según la pantalla — Alta (+9 more)

### Community 36 - "react"
Cohesion: 0.11
Nodes (32): KIND_ELEM, renderBold(), ScreenActividad(), DPageHeader(), DELTA_COLORS, DStatTile(), TONES, STATE_MAP (+24 more)

### Community 37 - "dashboard-empty.jsx"
Cohesion: 0.12
Nodes (3): EMPTY_SCREENS, obreroLink(), ObrerosInviter()

### Community 38 - "planes-page.jsx"
Cohesion: 0.12
Nodes (5): ButtonStyles(), COMPARE_GROUPS, FAQ_ITEMS, PlanCard(), PLANS

### Community 39 - "next"
Cohesion: 0.09
Nodes (10): nextConfig, GroupTab, GroupTabs(), TABS, TABS, TABS, VIEWS, ScreenGaleria() (+2 more)

### Community 40 - "pendingQuery.store.ts"
Cohesion: 0.17
Nodes (21): ask(), buildContenido(), concludeTurn(), handleClarificationReply(), recalcMissing(), tryDeterministicAnswer(), ApiCall, Clarification (+13 more)

### Community 41 - "endpointSchema.ts"
Cohesion: 0.13
Nodes (23): buildEndpointDescription(), buildEndpointIndex(), collectMissingFields(), describeEndpoint(), elementLabel(), EndpointParam, ENDPOINTS, EndpointSchema (+15 more)

### Community 42 - "server.js"
Cohesion: 0.10
Nodes (20): crearAlerta(), getAlertas(), resolverAlerta(), verificarInactividad(), getDashboard(), getMensajes(), actualizarPresupuesto(), crearPresupuesto() (+12 more)

### Community 43 - "usuarios.js"
Cohesion: 0.24
Nodes (8): crearActividad(), getActividad(), mapAccion(), asignarObra(), crearUsuario(), getEquipo(), router, router

### Community 44 - "Frontend/package.json"
Cohesion: 0.05
Nodes (41): eslintConfig, dependencies, framer-motion, @gravity-ui/icons, @heroui/react, @heroui/styles, next, qrcode.react (+33 more)

### Community 45 - "DashboardContent.tsx"
Cohesion: 0.09
Nodes (33): ActivityFeed(), Props, BudgetCard(), Props, CAT_COLORS, CategoryFormData, CategoryModal(), Props (+25 more)

### Community 47 - "ScreenAlertas.tsx"
Cohesion: 0.23
Nodes (11): AlertaDrawer(), ScreenAlertas(), TabId, TABS, LVL, STATE, Props, SideDrawer() (+3 more)

### Community 48 - "i18n.jsx"
Cohesion: 0.30
Nodes (13): ATTR_ORIGINALS, I18N_DICT, I18N_REGEX, restoreOriginals(), setLanguage(), shouldSkipElement(), startObserver(), stopObserver() (+5 more)

### Community 49 - "Button"
Cohesion: 0.11
Nodes (20): AuthWrapper(), apps_frontend_src_app_globals, ManropeFont, metadata, SignInForm(), SignInFormProps, SignUpForm(), SignUpFormProps (+12 more)

### Community 50 - "app/page.tsx"
Cohesion: 0.18
Nodes (8): FEATURES, TONE_MAP, Beneficios(), ChatbotSection(), CTA(), featureIconMap, Funcionalidades(), HowItWorks()

### Community 51 - "client.ts"
Cohesion: 0.18
Nodes (13): initClient(), getPhoneNumber(), handleMessage(), isWhitelisted(), mongoStore, Session, sessionSchema, applyWhatsappPatches() (+5 more)

### Community 53 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir, rootDir, skipLibCheck (+4 more)

### Community 54 - "db.js"
Cohesion: 0.15
Nodes (14): getMe(), login(), logout(), register(), crearReporte(), getReportes(), pool, authMiddleware() (+6 more)

### Community 55 - "tareasController.js"
Cohesion: 0.28
Nodes (11): actualizarTarea(), completarTarea(), completarTareaDesdeBot(), crearTarea(), crearTareaDesdeBot(), ESTADOS_VALIDOS, getTareas(), PRIORIDADES_VALIDAS (+3 more)

### Community 56 - "NotificationsPanel.tsx"
Cohesion: 0.29
Nodes (8): NOTIF_SEED, NotifItem, NotifKind, KIND_ICON, KIND_TINT, NotificationsPanel(), getNotificaciones(), NotificacionesData

### Community 57 - "3. Interacción y flujos"
Cohesion: 0.13
Nodes (15): 3.10 · Estados vacíos ausentes o desparejos — Media, 3.11 · Títulos que prometen un recorte de fecha que no se ve — Media, 3.12 · Subtítulos que prometen más de lo que muestran — Media, 3.13 · Acciones del estado vacío sin flujo definido — Media, 3.14 · Navegación entre vistas que reinicia el contexto — Media, 3.1 · Los modales se comportan distinto entre sí — Alta, 3.2 · Menús desplegables sin cierre por teclado — Media, 3.3 · Acciones destructivas o sensibles sin confirmación — Alta (+7 more)

### Community 58 - "obrasController.js"
Cohesion: 0.42
Nodes (8): buildObra(), crearObra(), deleteObra(), getObra(), getObras(), toggleStarred(), updateObra(), router

### Community 59 - "NuevaTareaModal.tsx"
Cohesion: 0.22
Nodes (12): QuickAddPedido(), NuevaTareaModal(), PRIORIDADES, Props, formatCurrency(), todayISO(), getMiembrosDeObra(), getRubrosDeObra() (+4 more)

### Community 60 - "UnderConstructionPage.tsx"
Cohesion: 0.21
Nodes (6): BrandLogo(), BrandLogoProps, ConstructionIllustration(), NotifyForm(), UnderConstructionPage(), UnderConstructionPageProps

### Community 61 - "dashboard.api.ts"
Cohesion: 0.17
Nodes (11): ApiActivityFeedItem, ApiAlertItem, ApiBudgetItem, ApiBudgetOverview, ApiDashboardResponse, ApiDashboardStats, ApiObraInfo, ApiOrderItem (+3 more)

### Community 62 - "Database schema (obras construction)"
Cohesion: 0.36
Nodes (10): alertas table (stock bajo, tarea vencida), Database schema (obras construction), gastos table, materiales table (stock mínimo), mensajes table (texto, audio, imagen), obras table, reportes table (diario, semanal, mensual), subtareas table (boolean completada) (+2 more)

### Community 63 - "tasks"
Cohesion: 0.20
Nodes (9): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+1 more)

### Community 64 - "Frontend App (Next.js)"
Cohesion: 0.25
Nodes (9): Frontend App (Next.js), BuildData Logo Mark (SVG), Ascending Bars Motif, BuildData Brand Identity Asset, Color Palette (Blue #0F4395, White, Amber #F59E0B), Frontend assets patterns directory, blueprint.svg (blueprint background pattern), Next.js Logo (next.svg) (+1 more)

### Community 65 - "format.ts"
Cohesion: 0.22
Nodes (21): sortKey(), UpcomingDeliveriesCard(), capitalize(), formatDate(), formatDateShort(), formatDateTime(), formatDayLabel(), formatDayTime() (+13 more)

### Community 66 - "ScreenProveedores"
Cohesion: 0.24
Nodes (11): QuickAddProveedor(), ScreenProveedores(), Proveedor, supInitials(), SUPPLIERS_SEED, addProveedor(), getProveedores(), nextProveedorId() (+3 more)

### Community 67 - "LiveBot.tsx"
Cohesion: 0.28
Nodes (6): LiveBot(), Message, QuickReply, Scenario, SCENARIOS, framer-motion

### Community 68 - "taskPct"
Cohesion: 0.38
Nodes (7): ALL_TASKS, DashTareasComplete(), recomputeDerived(), ScreenGantt(), taskPct(), UploadPhotosModal(), useTaskStore()

### Community 69 - "perfil/data/index.ts"
Cohesion: 0.19
Nodes (7): ScreenPerfil(), PERFIL_SEED, PerfilActividad, PerfilData, PerfilPermiso, Loading(), getPerfil()

### Community 70 - "actividadService.ts"
Cohesion: 0.24
Nodes (10): ActivityGroup, ActivityItem, ANSWERS_DB, KIND_ICONS, SUGGESTED_QUESTIONS, getActividad(), getInitials(), mapAccionToKind() (+2 more)

### Community 71 - "CompareTable.tsx"
Cohesion: 0.28
Nodes (7): CellValue, CompareCategory, CompareTable(), CompareTableProps, renderCell(), comparisonCategories, Comparison()

### Community 72 - "entitySearch.service.js"
Cohesion: 0.16
Nodes (25): buscarEntidad(), aprobarPedido(), crearPedidoWeb(), getPedidos(), rechazarPedido(), resolverProveedor(), router, aVectorLiteral() (+17 more)

### Community 73 - "rubrosController.js"
Cohesion: 0.50
Nodes (6): crearRubro(), deleteRubro(), formatRubro(), getRubros(), updateRubro(), router

### Community 74 - "DashboardSection.tsx"
Cohesion: 0.25
Nodes (4): LiveDashboard(), DASHBOARD_CALLOUTS, DashboardSection(), iconMap

### Community 75 - "Pricing.tsx"
Cohesion: 0.31
Nodes (6): PricingCard(), PricingToggle(), pricingCardsMonthly, pricingCardsYearly, WInput(), 7. Consistencia visual y sistema de diseño · `E-*`

### Community 76 - "Inconsistencias de diseño UI/UX — BuildData"
Cohesion: 0.22
Nodes (8): 5.1 · El dashboard no está adaptado a pantallas chicas — Alta, 5.2 · Tablas y listas sin desplazamiento horizontal — Media, 5.3 · Paneles laterales con ancho fijo — Media, 5.4 · La navegación pública no tiene versión móvil — Media, 5. Responsive y adaptación a pantallas, Anexo · Qué quedó fuera de este informe (y por qué), Inconsistencias de diseño UI/UX — BuildData, Resumen: los 10 problemas de diseño más importantes

### Community 78 - "ScreenDashboard"
Cohesion: 0.25
Nodes (8): catProgress(), LiveDashboard(), ScreenActivity(), ScreenAlerts(), ScreenDashboard(), useActivityStore(), useAlertStore(), useToast()

### Community 79 - "useStore"
Cohesion: 0.20
Nodes (11): applyInboxItem(), ScreenGallery(), ScreenInbox(), ScreenMaterials(), ScreenReceipts(), ScreenRubros(), ScreenStock(), ScreenSuppliers() (+3 more)

### Community 80 - "TaskDetail"
Cohesion: 0.24
Nodes (13): CalendarView(), fmtDate(), fmtDateLong(), GanttView(), ListView(), NuevaTareaModal(), TaskDetail(), taskFrom() (+5 more)

### Community 81 - "7. Contenido de marketing y planes"
Cohesion: 0.22
Nodes (9): 7.1 · Precios contradictorios en la misma página — Alta, 7.2 · El ahorro anual no coincide con los precios mostrados — Alta, 7.3 · La FAQ contradice los límites de los planes — Media, 7.4 · Métricas de marketing contradictorias entre páginas — Media, 7.5 · El CTA de prueba tiene cinco variantes — Media, 7.6 · La demo del landing no representa al producto — Media, 7.7 · Datos y testimonios presentados como reales — Media, 7.8 · Copy de "no disponible" inconsistente — Baja (+1 more)

### Community 82 - "materialesController.js"
Cohesion: 0.53
Nodes (4): actualizarMaterial(), crearMaterial(), getMateriales(), router

### Community 83 - "5. Terminología inconsistente · `D-*`"
Cohesion: 0.25
Nodes (8): 5. Terminología inconsistente · `D-*`, D1 · P1 · Rubro vs. categoría vs. tipo (tres conceptos, una palabra), D2 · P1 · Recibo / comprobante / factura / gasto, D3 · P1 · Alerta / crítico / notificación, D4 · P0 · Estados de tarea con distinto label y color según pantalla, D5 · P1 · Estados de pedido: rechazo mostrado como "CANCELADO", D6 · P1 · Prioridades inconsistentes, D7 · P2 · Mezclas menores

### Community 84 - "6. Accesibilidad desde el diseño"
Cohesion: 0.25
Nodes (8): 6.1 · Controles de solo ícono sin nombre — Alta, 6.2 · Formularios sin etiquetas asociadas y errores sueltos — Media, 6.3 · Información comunicada solo por color — Media, 6.4 · Contenido dinámico que no se anuncia — Media, 6.5 · Fotos sin descripción — Baja, 6.6 · Dos títulos principales en la home — Baja, 6.7 · Elementos clickeables que no se pueden usar con teclado — Alta, 6. Accesibilidad desde el diseño

### Community 85 - "Ascending bar chart glyph (three white rounded rectangles)"
Cohesion: 0.40
Nodes (6): Amber accent #F59E0B (top segment of tallest bar), Ascending bar chart glyph (three white rounded rectangles), BuildData on-dark brand identity (construction data brand), logo-buildata-onDark.svg (BuildData logo for dark backgrounds), Manrope typeface (brand font, extrabold 800), BuildData wordmark (Manrope 800, white, size 26)

### Community 86 - "FAQ.tsx"
Cohesion: 0.33
Nodes (5): FAQ(), FAQItemData, FAQProps, faqItems, FAQSection()

### Community 88 - "galeriaService.ts"
Cohesion: 0.52
Nodes (4): PHOTO_SEED, RUBRO_COLORS, GaleriaData, GalleryPhoto

### Community 89 - "FakeMessageCard.tsx"
Cohesion: 0.40
Nodes (4): BrandPanel(), FakeMessageCard(), FakeMessageCardProps, tagStyles

### Community 91 - "profile-page.jsx"
Cohesion: 0.40
Nodes (3): PROFILE_ACTIVITY, PROFILE_PEOPLE, PROFILE_PERMS

### Community 92 - "mongoStore (custom RemoteAuth store)"
Cohesion: 0.67
Nodes (4): mongoStore (session zips in .wwebjs_auth/), mongoStore (custom RemoteAuth store), RemoteAuth (backupSyncIntervalMs 300000), Session persistence via RemoteAuth + MongoDB

### Community 93 - "logo-buildata.svg (SVG brand logo asset)"
Cohesion: 0.67
Nodes (4): logo-buildata.svg (SVG brand logo asset), BuildData brand identity, BuildData wordmark (Manrope font text), Bars mark (3 ascending navy bars w/ orange tip)

### Community 95 - "Backend /bot/* routes (REST API)"
Cohesion: 0.67
Nodes (3): authMiddleware (JWT Supabase auth.getUser), Backend /bot/* routes (REST API), botAuthMiddleware (service role key direct)

### Community 108 - "Navbar.tsx"
Cohesion: 0.40
Nodes (4): Navbar(), NavbarProps, LogoIcon(), 6. Navegación y rutas rotas · `C-*`

### Community 110 - "probar_busqueda.js"
Cohesion: 0.15
Nodes (8): args, __dirname, args, __dirname, IMPORTANT: keep the reminder string free of backticks and $(...) constructs., ref_fs, ref_path, ref_url

### Community 113 - "4. Estructura, navegación y arquitectura de información"
Cohesion: 0.33
Nodes (6): 4.1 · Secciones contenedoras presentadas como ítems planos — Media, 4.2 · Migas de pan y títulos que no coinciden con el menú — Baja, 4.3 · La landing anuncia secciones que no existen y una demo que no representa al producto — Media, 4.4 · "Planes" siempre resaltado en la navegación pública — Baja, 4.5 · Dos accesos idénticos al mismo destino en el navbar — Baja, 4. Estructura, navegación y arquitectura de información

### Community 124 - "useCatStore"
Cohesion: 0.50
Nodes (4): CategoriesManager(), NewOrderModal(), UnitPicker(), useCatStore()

## Ambiguous Edges - Review These
- `message.handler routing` → `confirmCommand (!confirm → SQL ejecutada)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to
- `BuildData platform (WhatsApp bot + REST API + Frontend)` → `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **556 isolated node(s):** `$schema`, `plugin`, `ESTADOS_PROCESAMIENTO`, `ESTADOS_VALIDOS`, `PRIORIDADES_VALIDAS` (+551 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 849 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `message.handler routing` and `confirmCommand (!confirm → SQL ejecutada)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `BuildData platform (WhatsApp bot + REST API + Frontend)` and `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `react` to `ScreenCronograma.tsx`, `QuickAddModal.tsx`, `ScreenConfiguracion.tsx`, `ScreenPresupuesto.tsx`, `ObrasHome.tsx`, `ScreenPedidos.tsx`, `SupplierModal.tsx`, `NuevaObraModal.tsx`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `Button.tsx`, `dashboard/_components/index.ts`, `mensajesService.ts`, `LiveDashboard.tsx`, `next`, `Frontend/package.json`, `DashboardContent.tsx`, `ScreenAlertas.tsx`, `Button`, `NotificationsPanel.tsx`, `NuevaTareaModal.tsx`, `UnderConstructionPage.tsx`, `LiveBot.tsx`, `Pricing.tsx`, `FAQ.tsx`, `FakeMessageCard.tsx`, `costos/page.tsx`, `materiales/page.tsx`, `registro/page.tsx`, `alertas/page.tsx`, `inbox/page.tsx`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `@gravity-ui/icons` connect `react` to `ScreenCronograma.tsx`, `QuickAddModal.tsx`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `ScreenPresupuesto.tsx`, `landing.ts`, `ObrasHome.tsx`, `ScreenPedidos.tsx`, `SupplierModal.tsx`, `NuevaObraModal.tsx`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `Button.tsx`, `dashboard/_components/index.ts`, `mensajesService.ts`, `LiveDashboard.tsx`, `next`, `Frontend/package.json`, `DashboardContent.tsx`, `ScreenAlertas.tsx`, `Button`, `app/page.tsx`, `NotificationsPanel.tsx`, `NuevaTareaModal.tsx`, `LiveBot.tsx`, `CompareTable.tsx`, `DashboardSection.tsx`, `Pricing.tsx`, `FAQ.tsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `pool` connect `db.js` to `entitySearch.service.js`, `rubrosController.js`, `server.js`, `usuarios.js`, `sqlGuard.service.js`, `materialesController.js`, `bot.js`, `tareasController.js`, `obrasController.js`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Button()` (e.g. with `15. Anexo — verificaciones descartadas (para no repetir trabajo)` and `7. Consistencia visual y sistema de diseño · `E-*``) actually correct?**
  _`Button()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugin`, `ESTADOS_PROCESAMIENTO` to the rest of the system?**
  _556 weakly-connected nodes found - possible documentation gaps or missing edges._