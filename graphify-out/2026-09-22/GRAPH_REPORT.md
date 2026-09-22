# Graph Report - BuildData  (2026-09-22)

## Corpus Check
- 350 files · ~211,214 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .lock 2, .ico 1)

## Summary
- 2026 nodes · 4367 edges · 115 communities (84 shown, 31 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5173508`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- live-dashboard.jsx
- cronogramaService.ts
- stockService.ts
- ScreenConfiguracion.tsx
- message.handler routing
- Frontend redesign plan (dashboard + grouped sidebar)
- payments/page.tsx
- package.json
- ScreenPresupuesto.tsx
- ScreenCronograma.tsx
- landing.ts
- nueva-obra.jsx
- WhatsApp-Bot/package.json
- ObraCard.tsx
- sqlGuard.service.js
- QuickAddModal.tsx
- message.handler.ts
- useToast
- NuevaObraModal.tsx
- pollConfirmation.service.ts
- HowItWorks.tsx
- bot.js
- ScreenReportes.tsx
- Button.tsx
- proveedoresController.js
- settings-page.jsx
- alertasService.ts
- useDashboardData
- actionExecuted.service.ts
- vision.service.ts
- ScreenInbox.tsx
- obras-home.jsx
- compilerOptions
- entityResolution.service.ts
- LiveDashboard.tsx
- api.service.ts
- @gravity-ui/icons
- dashboard-empty.jsx
- planes-page.jsx
- cronograma/data/index.ts
- pendingQuery.store.ts
- endpointSchema.ts
- server.js
- pedidosController.js
- Frontend/package.json
- dashboard/_components/index.ts
- tweaks-panel.jsx
- ScreenAlertas.tsx
- i18n.jsx
- react
- app/page.tsx
- client.ts
- compilerOptions
- auth.js
- tareasController.js
- NotificationsPanel.tsx
- ObrasHome.tsx
- obrasController.js
- NuevaTareaModal.tsx
- equipoService.ts
- dashboard.api.ts
- Database schema (obras construction)
- tasks
- Frontend App (Next.js)
- format.ts
- WorkspaceSidebar.tsx
- LiveBot.tsx
- taskPct
- ScreenPerfil.tsx
- actividadService.ts
- CompareTable.tsx
- entitySearch.service.js
- rubrosController.js
- DashboardSection.tsx
- Pricing.tsx
- supabaseClient.ts
- howitworks.jsx
- ScreenDashboard
- useStore
- TaskDetail
- ProjectsSkeleton.tsx
- materialesController.js
- cronograma/page.tsx
- perfil/page.tsx
- Ascending bar chart glyph (three white rounded rectangles)
- phone-input.jsx
- profile-page.jsx
- mongoStore (custom RemoteAuth store)
- logo-buildata.svg (SVG brand logo asset)
- live-bot.jsx
- Backend /bot/* routes (REST API)
- chat-bubble.jsx
- product-tour.jsx
- opencode.json
- testConnection.js
- Frontend App (Next.js)
- postcss.config.mjs
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
3. `Button()` - 29 edges
4. `next` - 28 edges
5. `pool` - 26 edges
6. `useToast()` - 23 edges
7. `esMiembroDeObra()` - 22 edges
8. `useDashboardData()` - 22 edges
9. `guardarEmbedding()` - 20 edges
10. `DPageHeader()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `message.handler (enrutador)` --semantically_similar_to--> `message.handler routing`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `pendingQuery.store (almacena SQL pendiente)` --semantically_similar_to--> `pendingQuery.store`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `confirmCommand (!confirm → SQL ejecutada)` --semantically_similar_to--> `sendObraConfirmationText() textual numbered survey`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `textToSQL() (Groq / Llama 3.3)` --semantically_similar_to--> `textToOperation() → {endpoint, method, data, comment}`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `transcription.service (Whisper via Groq)` --semantically_similar_to--> `transcription.service (whisper-large-v3-turbo)`  [INFERRED] [semantically similar]
  README.md → AGENTS.md

## Import Cycles
- 4-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/freetext.handler.ts -> apps/WhatsApp-Bot/src/handlers/clarification.handler.ts -> apps/WhatsApp-Bot/src/client.ts`
- 5-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/voice.handler.ts -> apps/WhatsApp-Bot/src/handlers/freetext.handler.ts -> apps/WhatsApp-Bot/src/handlers/clarification.handler.ts -> apps/WhatsApp-Bot/src/client.ts`

## Hyperedges (group relationships)
- **WhatsApp message routing + LLM operation execution flow** — agents_message_handler, agents_freetext_handler, agents_voice_handler, agents_image_handler, agents_texttooperation, agents_pendingquery_store, agents_executepending [EXTRACTED 1.00]
- **Mock services following the stockService seed+delay+clone pattern** — apps_frontend_tmp_temp_stockservice, apps_frontend_tmp_temp_inbox_service, apps_frontend_tmp_temp_galeria_service, apps_frontend_tmp_temp_notificaciones_service, apps_frontend_tmp_temp_configuracion_service, apps_frontend_tmp_temp_perfil_service, apps_frontend_tmp_temp_rubros_service [INFERRED 0.85]
- **Grouped navigation redesign (8 items, ?v= sub-tabs, legacy redirects)** — apps_frontend_tmp_temp_grouped_nav, apps_frontend_tmp_temp_grouptabs, apps_frontend_tmp_temp_dashsidebar, apps_frontend_tmp_temp_searchparams_v, apps_frontend_tmp_temp_redirects [INFERRED 0.85]

## Communities (115 total, 31 thin omitted)

### Community 0 - "live-dashboard.jsx"
Cohesion: 0.02
Nodes (53): ACT_LISTENERS, ACTIVITY_SEED, ActivityStore, ALERT_LISTENERS, ALERTS_SEED, AlertStore, BUDGET, CAT_COLORS (+45 more)

### Community 1 - "cronogramaService.ts"
Cohesion: 0.18
Nodes (18): Props, UploadPhotosModal(), buildGrid(), ScreenCronograma(), computeTimeline(), startOfDay(), toMonday(), weekIndexOf() (+10 more)

### Community 2 - "stockService.ts"
Cohesion: 0.19
Nodes (22): QuickAddMaterial(), ScreenStock(), Props, CAT_PALETTE, getStatus(), STAT_LABELS, StockItem, accessToken() (+14 more)

### Community 3 - "ScreenConfiguracion.tsx"
Cohesion: 0.08
Nodes (24): ObraDefaults, ScreenConfiguracion(), ConfiguracionPlan, INTEGRACIONES_SEED, IntegracionItem, OBRA_SETTINGS, ObraEstado, ObraSettings (+16 more)

### Community 4 - "message.handler routing"
Cohesion: 0.05
Nodes (52): api.service, /bot/pedidoDeCompra endpoint, /bot/retraso endpoint (updates rubros table), /bot/tareas endpoint (crear, rubro_id opcional), PATCH /bot/tareas/:id/completar, buildEndpointDescription(), callEndpoint() (fetch to API_URL, service role key), Per-obra entity catalog (GET /bot/catalogo) (+44 more)

### Community 5 - "Frontend redesign plan (dashboard + grouped sidebar)"
Cohesion: 0.06
Nodes (47): BuildData platform (WhatsApp bot + REST API + Frontend), Blueprint background motif (AI insight banner), ChatBubble (loaded-state AI chatbot), dashboard-empty.jsx (onboarding empty state), DashboardPage (root, tweakable state), Empty (onboarding) vs loaded dashboard states, i18n es/en language switching, LiveDashboard (loaded/empty screens) (+39 more)

### Community 6 - "payments/page.tsx"
Cohesion: 0.18
Nodes (7): CTA(), Hero(), Pricing(), Stats(), Navbar(), NavbarProps, LogoIcon()

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): dependencies, cors, dotenv, express, groq-sdk, multer, pg, @supabase/supabase-js (+29 more)

### Community 8 - "ScreenPresupuesto.tsx"
Cohesion: 0.15
Nodes (21): BudgetAuditEntry, BudgetEditModal(), DraftLine, Props, Donut(), DonutProps, ASSUMPTIONS, KPI_TONES (+13 more)

### Community 9 - "ScreenCronograma.tsx"
Cohesion: 0.20
Nodes (14): CalendarView(), DAY_HEADERS, DayInfo, Props, WEEKENDS, ListView(), Props, STATE_TONE (+6 more)

### Community 10 - "landing.ts"
Cohesion: 0.14
Nodes (11): BENEFICIOS_ITEMS, BENEFICIOS_STATS, FEATURES, PROBLEMA_ITEMS, PROBLEMA_STATS, TONE_MAP, benefitIconMap, featureIconMap (+3 more)

### Community 11 - "nueva-obra.jsx"
Cohesion: 0.10
Nodes (20): allPerm(), DEFAULT_RUBROS, fmtMoney(), initialsFromName(), isEmail(), makeRoles(), makeRubros(), MORE_PEOPLE (+12 more)

### Community 12 - "WhatsApp-Bot/package.json"
Cohesion: 0.07
Nodes (29): dependencies, axios, dotenv, express, groq-sdk, mongoose, qrcode-terminal, whatsapp-web.js (+21 more)

### Community 13 - "ObraCard.tsx"
Cohesion: 0.20
Nodes (4): ObraRow(), ObraThumb(), Obra, STATUS

### Community 14 - "sqlGuard.service.js"
Cohesion: 0.09
Nodes (39): auditar(), consultar(), completarJSON(), getCliente(), MODELO_DEFAULT, construirSystemPrompt(), narrar(), recortar() (+31 more)

### Community 15 - "QuickAddModal.tsx"
Cohesion: 0.05
Nodes (75): FieldDef, FormConfig, Props, QUICK_FORMS, QuickAddGeneric(), QuickAddPedido(), QuickAddProveedor(), QuickAddRubro() (+67 more)

### Community 16 - "message.handler.ts"
Cohesion: 0.15
Nodes (29): ayudaCommand, buildingsCommand, cancelCommand, Command, commands, getAllCommands(), getCommand(), registerCommand() (+21 more)

### Community 17 - "useToast"
Cohesion: 0.14
Nodes (10): DPageHeader(), DashToast(), useToast(), InviteTeamModal(), InviteTeamModalProps, ScreenEquipo(), Loading(), DAvatar() (+2 more)

### Community 18 - "NuevaObraModal.tsx"
Cohesion: 0.11
Nodes (26): INITIAL_DATA, NuevaObraModal(), validateStep(), PickCard(), Step1(), TYPE_ICONS, Step2(), Step3() (+18 more)

### Community 19 - "pollConfirmation.service.ts"
Cohesion: 0.20
Nodes (22): getClient(), getEntityPending(), getPending(), setEntityPending(), setPending(), applyQuestionAnswer(), resolveOperationEntities(), interpolatePathParams() (+14 more)

### Community 20 - "HowItWorks.tsx"
Cohesion: 0.11
Nodes (6): DashboardMockup(), PhoneMockup(), PhoneMockupProps, LOGOS, HowItWorks(), STAGES

### Community 21 - "bot.js"
Cohesion: 0.11
Nodes (24): actualizarAccionesMensaje(), actualizarStock(), crearMaterialDesdeBot(), crearPedidoDeCompra(), ESTADOS_PROCESAMIENTO, recibirMensaje(), registrarRetraso(), crearGasto() (+16 more)

### Community 22 - "ScreenReportes.tsx"
Cohesion: 0.10
Nodes (21): GroupTab, GroupTabs(), RegistroView(), TABS, VIEWS, ScreenGaleria(), PHOTO_SEED, RUBRO_COLORS (+13 more)

### Community 23 - "Button.tsx"
Cohesion: 0.10
Nodes (26): KIND_ELEM, renderBold(), ScreenActividad(), ActivityGroup, ActivityItem, ANSWERS_DB, KIND_ICONS, SUGGESTED_QUESTIONS (+18 more)

### Community 24 - "proveedoresController.js"
Cohesion: 0.35
Nodes (15): actualizarProveedor(), buscarProveedor(), crearProveedor(), eliminarProveedor(), esViolacionCheck(), esViolacionUnica(), getProveedores(), marcarFavorito() (+7 more)

### Community 25 - "settings-page.jsx"
Cohesion: 0.10
Nodes (4): ALL_PERMS, DEFAULT_ROLES, PERM_GROUPS, SETTINGS_NAV

### Community 26 - "alertasService.ts"
Cohesion: 0.27
Nodes (11): AlertaLvl, AlertasData, ApiAlerta, authHeaders(), createAlert(), getAlertas(), mapAlerta(), mapNivelToSeverity() (+3 more)

### Community 27 - "useDashboardData"
Cohesion: 0.08
Nodes (25): ChatBubble(), ChatBubbleProps, SUGGESTED, ContextValue, DashboardDataContext, DashboardDataProvider(), noop(), RubroInfo (+17 more)

### Community 28 - "actionExecuted.service.ts"
Cohesion: 0.15
Nodes (25): ACTION_META, ActionExecuted, ActionMeta, ActionOutcome, add(), arrayOf(), asRecord(), buildActionExecuted() (+17 more)

### Community 29 - "vision.service.ts"
Cohesion: 0.20
Nodes (8): groq, ComprobanteData, DocumentType, ExtractedDocument, FacturaData, FacturaItem, groq, ref_groq_sdk

### Community 30 - "ScreenInbox.tsx"
Cohesion: 0.10
Nodes (27): HighlightedRaw(), Props, InboxCorrectModal(), Props, Result, TIPOS, confPill(), initialsOf() (+19 more)

### Community 31 - "obras-home.jsx"
Cohesion: 0.11
Nodes (5): FILES, OBRAS, STATUS, WORKSPACE_NAV, WORKSPACE_NAV_BOTTOM

### Community 32 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "entityResolution.service.ts"
Cohesion: 0.16
Nodes (16): CandidatoBusqueda, EntidadCandidata, EntidadResuelta, mapearResultadoBusqueda(), ResultadoBusquedaEntidades, ARRAY_KEYS, ARRAY_ONLY_KEYS, EntityKind (+8 more)

### Community 35 - "api.service.ts"
Cohesion: 0.20
Nodes (14): actualizarMensajeAcciones(), apiRequest(), AUTH_HEADERS, buscarEntidades(), callEndpoint(), crearMaterial(), getUserByPhone(), MaterialCreado (+6 more)

### Community 36 - "@gravity-ui/icons"
Cohesion: 0.12
Nodes (18): DELTA_COLORS, DStatTile(), TONES, CostosView(), TABS, Loading(), Props, ReceiptModal() (+10 more)

### Community 37 - "dashboard-empty.jsx"
Cohesion: 0.12
Nodes (3): EMPTY_SCREENS, obreroLink(), ObrerosInviter()

### Community 38 - "planes-page.jsx"
Cohesion: 0.12
Nodes (5): ButtonStyles(), COMPARE_GROUPS, FAQ_ITEMS, PlanCard(), PLANS

### Community 39 - "cronograma/data/index.ts"
Cohesion: 0.24
Nodes (14): GanttView(), Props, ZoomId, ZOOMS, Props, FALLBACK_RUBRO_COLOR, isoWeek(), RUBRO_COLORS (+6 more)

### Community 40 - "pendingQuery.store.ts"
Cohesion: 0.17
Nodes (21): ask(), buildContenido(), concludeTurn(), handleClarificationReply(), recalcMissing(), tryDeterministicAnswer(), ApiCall, Clarification (+13 more)

### Community 41 - "endpointSchema.ts"
Cohesion: 0.14
Nodes (22): buildEndpointDescription(), buildEndpointIndex(), collectMissingFields(), describeEndpoint(), elementLabel(), EndpointParam, ENDPOINTS, EndpointSchema (+14 more)

### Community 42 - "server.js"
Cohesion: 0.07
Nodes (31): crearActividad(), getActividad(), mapAccion(), crearAlerta(), getAlertas(), resolverAlerta(), verificarInactividad(), consultarChat() (+23 more)

### Community 43 - "pedidosController.js"
Cohesion: 0.35
Nodes (12): aprobarPedido(), cambiarEstadoPedido(), crearPedidoWeb(), entregarPedido(), ESTADOS_EN_CURSO, getPedidos(), noEncontrado(), rechazarPedido() (+4 more)

### Community 44 - "Frontend/package.json"
Cohesion: 0.05
Nodes (41): eslintConfig, dependencies, framer-motion, @gravity-ui/icons, @heroui/react, @heroui/styles, next, qrcode.react (+33 more)

### Community 45 - "dashboard/_components/index.ts"
Cohesion: 0.08
Nodes (40): ActivityFeed(), Props, BudgetCard(), Props, CAT_COLORS, CategoryFormData, CategoryModal(), Props (+32 more)

### Community 47 - "ScreenAlertas.tsx"
Cohesion: 0.20
Nodes (10): AlertaDrawer(), ScreenAlertas(), TabDef, TabId, TABS, AlertaItem, AlertaState, LVL (+2 more)

### Community 48 - "i18n.jsx"
Cohesion: 0.30
Nodes (13): ATTR_ORIGINALS, I18N_DICT, I18N_REGEX, restoreOriginals(), setLanguage(), shouldSkipElement(), startObserver(), stopObserver() (+5 more)

### Community 49 - "react"
Cohesion: 0.05
Nodes (32): nextConfig, AuthWrapper(), apps_frontend_src_app_globals, ManropeFont, metadata, BrandPanel(), FakeMessageCard(), FakeMessageCardProps (+24 more)

### Community 50 - "app/page.tsx"
Cohesion: 0.28
Nodes (4): Beneficios(), CTA(), Hero(), Footer()

### Community 51 - "client.ts"
Cohesion: 0.18
Nodes (13): initClient(), getPhoneNumber(), handleMessage(), isWhitelisted(), mongoStore, Session, sessionSchema, applyWhatsappPatches() (+5 more)

### Community 53 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir, rootDir, skipLibCheck (+4 more)

### Community 54 - "auth.js"
Cohesion: 0.10
Nodes (18): getMe(), login(), logout(), register(), authMiddleware(), router, args, __dirname (+10 more)

### Community 55 - "tareasController.js"
Cohesion: 0.28
Nodes (11): actualizarTarea(), completarTarea(), completarTareaDesdeBot(), crearTarea(), crearTareaDesdeBot(), ESTADOS_VALIDOS, getTareas(), PRIORIDADES_VALIDAS (+3 more)

### Community 56 - "NotificationsPanel.tsx"
Cohesion: 0.29
Nodes (8): NOTIF_SEED, NotifItem, NotifKind, KIND_ICON, KIND_TINT, NotificationsPanel(), getNotificaciones(), NotificacionesData

### Community 57 - "ObrasHome.tsx"
Cohesion: 0.18
Nodes (6): ObraCard(), FILTERS, ObrasHome(), WelcomeHero(), WorkspaceTopbar(), getObras()

### Community 58 - "obrasController.js"
Cohesion: 0.42
Nodes (8): buildObra(), crearObra(), deleteObra(), getObra(), getObras(), toggleStarred(), updateObra(), router

### Community 59 - "NuevaTareaModal.tsx"
Cohesion: 0.42
Nodes (7): NuevaTareaModal(), PRIORIDADES, Props, formatDateLong(), todayISO(), getMiembrosDeObra(), createTask()

### Community 60 - "equipoService.ts"
Cohesion: 0.33
Nodes (8): Obrero, Person, ROLES, ApiMiembro, authHeaders(), EquipoData, getEquipo(), initials()

### Community 61 - "dashboard.api.ts"
Cohesion: 0.18
Nodes (10): ApiActivityFeedItem, ApiAlertItem, ApiBudgetItem, ApiBudgetOverview, ApiDashboardStats, ApiObraInfo, ApiOrderItem, ApiOrderItemDetail (+2 more)

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
Cohesion: 0.25
Nodes (18): capitalize(), formatDate(), formatDateShort(), formatDateTime(), formatDayLabel(), formatDayTime(), formatMessageTime(), formatRelative() (+10 more)

### Community 66 - "WorkspaceSidebar.tsx"
Cohesion: 0.20
Nodes (5): NAV_BOTTOM, NAV_ITEMS, SidebarTheme, THEMES, WorkspaceSidebar()

### Community 67 - "LiveBot.tsx"
Cohesion: 0.24
Nodes (7): LiveBot(), Message, QuickReply, Scenario, SCENARIOS, ChatbotSection(), framer-motion

### Community 68 - "taskPct"
Cohesion: 0.38
Nodes (7): ALL_TASKS, DashTareasComplete(), recomputeDerived(), ScreenGantt(), taskPct(), UploadPhotosModal(), useTaskStore()

### Community 69 - "ScreenPerfil.tsx"
Cohesion: 0.29
Nodes (7): ACT_ICON, ScreenPerfil(), PERFIL_SEED, PerfilActividad, PerfilData, PerfilPermiso, getPerfil()

### Community 70 - "actividadService.ts"
Cohesion: 0.60
Nodes (5): getActividad(), getInitials(), mapAccionToKind(), mapTipoToKind(), transformActividad()

### Community 71 - "CompareTable.tsx"
Cohesion: 0.28
Nodes (7): CellValue, CompareCategory, CompareTable(), CompareTableProps, renderCell(), comparisonCategories, Comparison()

### Community 72 - "entitySearch.service.js"
Cohesion: 0.21
Nodes (20): buscarEntidad(), aVectorLiteral(), ENTIDADES, generarEmbeddings(), guardarEmbedding(), guardarEmbeddings(), modeloEmbeddings(), normalizarTextoEntidad() (+12 more)

### Community 73 - "rubrosController.js"
Cohesion: 0.50
Nodes (6): crearRubro(), deleteRubro(), formatRubro(), getRubros(), updateRubro(), router

### Community 74 - "DashboardSection.tsx"
Cohesion: 0.25
Nodes (4): LiveDashboard(), DASHBOARD_CALLOUTS, DashboardSection(), iconMap

### Community 75 - "Pricing.tsx"
Cohesion: 0.16
Nodes (11): FAQ(), FAQItemData, FAQProps, Feature, PricingCard(), PricingCardProps, PricingToggle(), faqItems (+3 more)

### Community 76 - "supabaseClient.ts"
Cohesion: 0.27
Nodes (6): supabase, CreateObraInput, CreateObraPayload, ChatPeriodo, ChatRespuesta, ChatSubpregunta

### Community 78 - "ScreenDashboard"
Cohesion: 0.25
Nodes (8): catProgress(), LiveDashboard(), ScreenActivity(), ScreenAlerts(), ScreenDashboard(), useActivityStore(), useAlertStore(), useToast()

### Community 79 - "useStore"
Cohesion: 0.20
Nodes (11): applyInboxItem(), ScreenGallery(), ScreenInbox(), ScreenMaterials(), ScreenReceipts(), ScreenRubros(), ScreenStock(), ScreenSuppliers() (+3 more)

### Community 80 - "TaskDetail"
Cohesion: 0.24
Nodes (13): CalendarView(), fmtDate(), fmtDateLong(), GanttView(), ListView(), NuevaTareaModal(), TaskDetail(), taskFrom() (+5 more)

### Community 82 - "materialesController.js"
Cohesion: 0.34
Nodes (16): actualizarMaterial(), ajustarStock(), asegurarCategoria(), crearCategoria(), crearMaterial(), eliminarMaterial(), EXT_POR_MIME, getCategorias() (+8 more)

### Community 85 - "Ascending bar chart glyph (three white rounded rectangles)"
Cohesion: 0.40
Nodes (6): Amber accent #F59E0B (top segment of tallest bar), Ascending bar chart glyph (three white rounded rectangles), BuildData on-dark brand identity (construction data brand), logo-buildata-onDark.svg (BuildData logo for dark backgrounds), Manrope typeface (brand font, extrabold 800), BuildData wordmark (Manrope 800, white, size 26)

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

### Community 124 - "useCatStore"
Cohesion: 0.50
Nodes (4): CategoriesManager(), NewOrderModal(), UnitPicker(), useCatStore()

## Ambiguous Edges - Review These
- `message.handler routing` → `confirmCommand (!confirm → SQL ejecutada)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to
- `BuildData platform (WhatsApp bot + REST API + Frontend)` → `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **467 isolated node(s):** `$schema`, `plugin`, `ESTADOS_PROCESAMIENTO`, `EXT_POR_MIME`, `ESTADOS_EN_CURSO` (+462 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 759 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `message.handler routing` and `confirmCommand (!confirm → SQL ejecutada)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `BuildData platform (WhatsApp bot + REST API + Frontend)` and `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `react` to `cronogramaService.ts`, `ScreenConfiguracion.tsx`, `ScreenPresupuesto.tsx`, `ScreenCronograma.tsx`, `QuickAddModal.tsx`, `useToast`, `NuevaObraModal.tsx`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `Button.tsx`, `useDashboardData`, `ScreenInbox.tsx`, `LiveDashboard.tsx`, `@gravity-ui/icons`, `cronograma/data/index.ts`, `Frontend/package.json`, `dashboard/_components/index.ts`, `ScreenAlertas.tsx`, `NotificationsPanel.tsx`, `ObrasHome.tsx`, `NuevaTareaModal.tsx`, `LiveBot.tsx`, `ScreenPerfil.tsx`, `Pricing.tsx`, `cronograma/page.tsx`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `@gravity-ui/icons` connect `@gravity-ui/icons` to `cronogramaService.ts`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `ScreenPresupuesto.tsx`, `ScreenCronograma.tsx`, `landing.ts`, `QuickAddModal.tsx`, `useToast`, `NuevaObraModal.tsx`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `Button.tsx`, `useDashboardData`, `ScreenInbox.tsx`, `LiveDashboard.tsx`, `cronograma/data/index.ts`, `Frontend/package.json`, `dashboard/_components/index.ts`, `ScreenAlertas.tsx`, `react`, `app/page.tsx`, `NotificationsPanel.tsx`, `ObrasHome.tsx`, `NuevaTareaModal.tsx`, `WorkspaceSidebar.tsx`, `LiveBot.tsx`, `ScreenPerfil.tsx`, `CompareTable.tsx`, `DashboardSection.tsx`, `Pricing.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `pool` connect `server.js` to `entitySearch.service.js`, `rubrosController.js`, `pedidosController.js`, `sqlGuard.service.js`, `materialesController.js`, `bot.js`, `auth.js`, `tareasController.js`, `proveedoresController.js`, `obrasController.js`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `ESTADOS_PROCESAMIENTO` to the rest of the system?**
  _467 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `live-dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.02247191011235955 - nodes in this community are weakly interconnected._