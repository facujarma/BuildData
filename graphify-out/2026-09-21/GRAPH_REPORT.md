# Graph Report - BuildData  (2026-09-21)

## Corpus Check
- 365 files · ~208,102 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .lock 2, .ico 1)

## Summary
- 2062 nodes · 4217 edges · 112 communities (82 shown, 30 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 223 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `792674cb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- live-dashboard.jsx
- ScreenCronograma.tsx
- ScreenRecibos.tsx
- ScreenConfiguracion.tsx
- message.handler routing
- Frontend redesign plan (dashboard + grouped sidebar)
- payments/page.tsx
- package.json
- ScreenPresupuesto.tsx
- dbschema.ts
- landing.ts
- nueva-obra.jsx
- WhatsApp-Bot/package.json
- ObrasHome.tsx
- sqlGuard.service.js
- ScreenPedidos.tsx
- message.handler.ts
- @gravity-ui/icons
- projects/_components/index.ts
- pollConfirmation.service.ts
- HowItWorks.tsx
- bot.js
- ScreenReportes.tsx
- ScreenStock.tsx
- NuevaObraModal.tsx
- settings-page.jsx
- services/alertasService.ts
- react
- actionExecuted.service.ts
- vision.service.ts
- ScreenInbox.tsx
- obras-home.jsx
- compilerOptions
- entityResolution.service.ts
- LiveDashboard.tsx
- app/layout.tsx
- ScreenActividad.tsx
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
- AuthContext.tsx
- app/page.tsx
- client.ts
- compilerOptions
- db.js
- tareasController.js
- NotificationsPanel.tsx
- DAvatar.tsx
- obrasController.js
- Button.tsx
- WorkspaceSidebar.tsx
- dashboardService.ts
- Database schema (obras construction)
- tasks
- Frontend App (Next.js)
- DPill.tsx
- equipoService.ts
- LiveBot.tsx
- taskPct
- SideBar.tsx
- entitySearch.service.js
- rubrosController.js
- DashboardSection.tsx
- projects.api.ts
- howitworks.jsx
- ScreenDashboard
- useStore
- TaskDetail
- materialesController.js
- Ascending bar chart glyph (three white rounded rectangles)
- ProjectsSkeleton.tsx
- phone-input.jsx
- profile-page.jsx
- mongoStore (custom RemoteAuth store)
- logo-buildata.svg (SVG brand logo asset)
- live-bot.jsx
- Backend /bot/* routes (REST API)
- PeriodNav.tsx
- chat-bubble.jsx
- product-tour.jsx
- opencode.json
- probar_busqueda.js
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
1. `react` - 90 edges
2. `@gravity-ui/icons` - 84 edges
3. `Button()` - 29 edges
4. `next` - 28 edges
5. `pool` - 25 edges
6. `useToast()` - 23 edges
7. `useDashboardData()` - 22 edges
8. `guardarEmbedding()` - 20 edges
9. `DPageHeader()` - 19 edges
10. `DAvatar()` - 19 edges

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

## Communities (112 total, 30 thin omitted)

### Community 0 - "live-dashboard.jsx"
Cohesion: 0.02
Nodes (53): ACT_LISTENERS, ACTIVITY_SEED, ActivityStore, ALERT_LISTENERS, ALERTS_SEED, AlertStore, BUDGET, CAT_COLORS (+45 more)

### Community 1 - "ScreenCronograma.tsx"
Cohesion: 0.06
Nodes (64): Props, UploadPhotosModal(), buildGrid(), CalendarView(), DAY_HEADERS, DayInfo, Props, WEEKENDS (+56 more)

### Community 2 - "ScreenRecibos.tsx"
Cohesion: 0.23
Nodes (13): Props, ReceiptModal(), ReceiptModalData, CAT_TO_TONE, ScreenRecibos(), CAT_TINT, CATEGORIES, FILTERS (+5 more)

### Community 3 - "ScreenConfiguracion.tsx"
Cohesion: 0.07
Nodes (26): ObraDefaults, ScreenConfiguracion(), ConfiguracionPlan, INTEGRACIONES_SEED, IntegracionItem, OBRA_SETTINGS, ObraEstado, ObraSettings (+18 more)

### Community 4 - "message.handler routing"
Cohesion: 0.05
Nodes (52): api.service, /bot/pedidoDeCompra endpoint, /bot/retraso endpoint (updates rubros table), /bot/tareas endpoint (crear, rubro_id opcional), PATCH /bot/tareas/:id/completar, buildEndpointDescription(), callEndpoint() (fetch to API_URL, service role key), Per-obra entity catalog (GET /bot/catalogo) (+44 more)

### Community 5 - "Frontend redesign plan (dashboard + grouped sidebar)"
Cohesion: 0.06
Nodes (47): BuildData platform (WhatsApp bot + REST API + Frontend), Blueprint background motif (AI insight banner), ChatBubble (loaded-state AI chatbot), dashboard-empty.jsx (onboarding empty state), DashboardPage (root, tweakable state), Empty (onboarding) vs loaded dashboard states, i18n es/en language switching, LiveDashboard (loaded/empty screens) (+39 more)

### Community 6 - "payments/page.tsx"
Cohesion: 0.07
Nodes (26): FAQ(), FAQItemData, FAQProps, CellValue, CompareCategory, CompareTable(), CompareTableProps, renderCell() (+18 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): dependencies, cors, dotenv, express, groq-sdk, multer, pg, @supabase/supabase-js (+29 more)

### Community 8 - "ScreenPresupuesto.tsx"
Cohesion: 0.06
Nodes (37): GroupTab, GroupTabs(), CostosView(), TABS, Loading(), BudgetAuditEntry, BudgetEditModal(), DraftLine (+29 more)

### Community 9 - "dbschema.ts"
Cohesion: 0.09
Nodes (33): Activity, ActivityEntity, ActivityFeedItem, Alert, AlertCategory, AlertItem, AlertType, BaseEntity (+25 more)

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
Cohesion: 0.13
Nodes (12): ObraCard(), ObraRow(), FILTERS, ObrasHome(), ObraThumb(), CreateObraInput, CreateObraPayload, getObras() (+4 more)

### Community 14 - "sqlGuard.service.js"
Cohesion: 0.08
Nodes (41): consultarChat(), router, auditar(), consultar(), completarJSON(), getCliente(), MODELO_DEFAULT, construirSystemPrompt() (+33 more)

### Community 15 - "ScreenPedidos.tsx"
Cohesion: 0.08
Nodes (49): QuickAddPedido(), QuickAddProveedor(), MaterialesView(), TABS, Loading(), DeliveryData, DeliveryModal(), Props (+41 more)

### Community 16 - "message.handler.ts"
Cohesion: 0.15
Nodes (29): ayudaCommand, buildingsCommand, cancelCommand, Command, commands, getAllCommands(), getCommand(), registerCommand() (+21 more)

### Community 17 - "@gravity-ui/icons"
Cohesion: 0.09
Nodes (17): FieldDef, FormConfig, Props, QUICK_FORMS, QuickAddModal(), Props, SupplierData, SupplierModal() (+9 more)

### Community 18 - "projects/_components/index.ts"
Cohesion: 0.19
Nodes (14): FileIcon(), PALETTES, PickCard(), Step1(), TYPE_ICONS, Step2(), Step4(), Step5() (+6 more)

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
Cohesion: 0.31
Nodes (9): RANGES, ScreenReportes(), SECTION_ICONS, RANGE_LABELS, SECTION_DEFS, SectionDef, SNAPSHOT, getReportesData() (+1 more)

### Community 23 - "ScreenStock.tsx"
Cohesion: 0.22
Nodes (14): DashToast(), useToast(), NewCategoryModal(), ScreenStock(), Props, StockItemModal(), CAT_COLORS, CATEGORIES (+6 more)

### Community 24 - "NuevaObraModal.tsx"
Cohesion: 0.16
Nodes (16): INITIAL_DATA, NuevaObraModal(), validateStep(), Step3(), fmtMoney(), SuccessState(), DEFAULT_RUBROS, MORE_PEOPLE (+8 more)

### Community 25 - "settings-page.jsx"
Cohesion: 0.10
Nodes (4): ALL_PERMS, DEFAULT_ROLES, PERM_GROUPS, SETTINGS_NAV

### Community 26 - "services/alertasService.ts"
Cohesion: 0.08
Nodes (32): ACTIVITY_GROUPS, ActivityGroup, ActivityItem, ANSWERS_DB, KIND_ICONS, SUGGESTED_QUESTIONS, TabDef, AlertaItem (+24 more)

### Community 27 - "react"
Cohesion: 0.09
Nodes (30): ChatBubble(), ChatBubbleProps, SUGGESTED, ContextValue, DashboardDataContext, DashboardDataProvider(), LookupData, noop() (+22 more)

### Community 28 - "actionExecuted.service.ts"
Cohesion: 0.15
Nodes (25): ACTION_META, ActionExecuted, ActionMeta, ActionOutcome, add(), arrayOf(), asRecord(), buildActionExecuted() (+17 more)

### Community 29 - "vision.service.ts"
Cohesion: 0.20
Nodes (8): groq, ComprobanteData, DocumentType, ExtractedDocument, FacturaData, FacturaItem, groq, ref_groq_sdk

### Community 30 - "ScreenInbox.tsx"
Cohesion: 0.10
Nodes (28): HighlightedRaw(), Props, InboxCorrectModal(), Props, Result, TIPOS, confPill(), initialsOf() (+20 more)

### Community 31 - "obras-home.jsx"
Cohesion: 0.11
Nodes (5): FILES, OBRAS, STATUS, WORKSPACE_NAV, WORKSPACE_NAV_BOTTOM

### Community 32 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "entityResolution.service.ts"
Cohesion: 0.10
Nodes (30): actualizarMensajeAcciones(), apiRequest(), AUTH_HEADERS, buscarEntidades(), callEndpoint(), crearMaterial(), getUserByPhone(), MaterialCreado (+22 more)

### Community 35 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): AuthWrapper(), apps_frontend_src_app_globals, ManropeFont, metadata

### Community 36 - "ScreenActividad.tsx"
Cohesion: 0.10
Nodes (16): KIND_ELEM, renderBold(), ScreenActividad(), DPageHeader(), DELTA_COLORS, DStatTile(), TONES, ACT_ICON (+8 more)

### Community 37 - "dashboard-empty.jsx"
Cohesion: 0.12
Nodes (3): EMPTY_SCREENS, obreroLink(), ObrerosInviter()

### Community 38 - "planes-page.jsx"
Cohesion: 0.12
Nodes (5): ButtonStyles(), COMPARE_GROUPS, FAQ_ITEMS, PlanCard(), PLANS

### Community 39 - "next"
Cohesion: 0.09
Nodes (8): nextConfig, BrandLogo(), BrandLogoProps, ConstructionIllustration(), NotifyForm(), UnderConstructionPage(), UnderConstructionPageProps, next

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
Cohesion: 0.10
Nodes (28): ActivityFeed(), Props, BudgetCard(), formatCurrency(), Props, CAT_COLORS, CategoryFormData, CategoryModal() (+20 more)

### Community 47 - "ScreenAlertas.tsx"
Cohesion: 0.18
Nodes (9): AlertaDrawer(), ScreenAlertas(), TabId, TABS, LVL, STATE, Loading(), Props (+1 more)

### Community 48 - "i18n.jsx"
Cohesion: 0.30
Nodes (13): ATTR_ORIGINALS, I18N_DICT, I18N_REGEX, restoreOriginals(), setLanguage(), shouldSkipElement(), startObserver(), stopObserver() (+5 more)

### Community 49 - "AuthContext.tsx"
Cohesion: 0.09
Nodes (19): BrandPanel(), FakeMessageCard(), FakeMessageCardProps, tagStyles, SignInForm(), SignInFormProps, SignUpForm(), SignUpFormProps (+11 more)

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

### Community 57 - "DAvatar.tsx"
Cohesion: 0.16
Nodes (10): BaseItem, buildNavItems(), NavEntry, NavGroup, NavLink, WorkspaceTopbar(), AvatarMenu(), DAvatar() (+2 more)

### Community 58 - "obrasController.js"
Cohesion: 0.42
Nodes (8): buildObra(), crearObra(), deleteObra(), getObra(), getObras(), toggleStarred(), updateObra(), router

### Community 59 - "Button.tsx"
Cohesion: 0.17
Nodes (13): ProgressByTradeCards(), Props, Props, BtnSize, BtnVariant, Button(), ButtonAsButton, ButtonAsLink (+5 more)

### Community 60 - "WorkspaceSidebar.tsx"
Cohesion: 0.20
Nodes (5): NAV_BOTTOM, NAV_ITEMS, SidebarTheme, THEMES, WorkspaceSidebar()

### Community 61 - "dashboardService.ts"
Cohesion: 0.13
Nodes (18): formatDate(), formatRelativeTime(), formatTime(), getDashboard(), TRADE_COLORS, transformDashboard(), ApiActivityFeedItem, ApiAlertItem (+10 more)

### Community 62 - "Database schema (obras construction)"
Cohesion: 0.36
Nodes (10): alertas table (stock bajo, tarea vencida), Database schema (obras construction), gastos table, materiales table (stock mínimo), mensajes table (texto, audio, imagen), obras table, reportes table (diario, semanal, mensual), subtareas table (boolean completada) (+2 more)

### Community 63 - "tasks"
Cohesion: 0.20
Nodes (9): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+1 more)

### Community 64 - "Frontend App (Next.js)"
Cohesion: 0.25
Nodes (9): Frontend App (Next.js), BuildData Logo Mark (SVG), Ascending Bars Motif, BuildData Brand Identity Asset, Color Palette (Blue #0F4395, White, Amber #F59E0B), Frontend assets patterns directory, blueprint.svg (blueprint background pattern), Next.js Logo (next.svg) (+1 more)

### Community 65 - "DPill.tsx"
Cohesion: 0.21
Nodes (10): CriticalAlertsCard(), Props, Props, sortKey(), STATE_MAP, UPCOMING_STATES, UpcomingDeliveriesCard(), DPill() (+2 more)

### Community 66 - "equipoService.ts"
Cohesion: 0.33
Nodes (8): Obrero, Person, ROLES, ApiMiembro, authHeaders(), EquipoData, getEquipo(), initials()

### Community 67 - "LiveBot.tsx"
Cohesion: 0.28
Nodes (6): LiveBot(), Message, QuickReply, Scenario, SCENARIOS, framer-motion

### Community 68 - "taskPct"
Cohesion: 0.38
Nodes (7): ALL_TASKS, DashTareasComplete(), recomputeDerived(), ScreenGantt(), taskPct(), UploadPhotosModal(), useTaskStore()

### Community 69 - "SideBar.tsx"
Cohesion: 0.31
Nodes (4): SideBarBuildName(), SideBarButton(), SideBarSeccion(), SideBarSeccionProps

### Community 72 - "entitySearch.service.js"
Cohesion: 0.16
Nodes (25): buscarEntidad(), aprobarPedido(), crearPedidoWeb(), getPedidos(), rechazarPedido(), resolverProveedor(), router, aVectorLiteral() (+17 more)

### Community 73 - "rubrosController.js"
Cohesion: 0.50
Nodes (6): crearRubro(), deleteRubro(), formatRubro(), getRubros(), updateRubro(), router

### Community 74 - "DashboardSection.tsx"
Cohesion: 0.25
Nodes (4): LiveDashboard(), DASHBOARD_CALLOUTS, DashboardSection(), iconMap

### Community 76 - "projects.api.ts"
Cohesion: 0.25
Nodes (7): ApiFileItem, ApiFilesResponse, ApiObra, ApiObrasResponse, ApiTeamMember, ApiToggleStarredRequest, ApiToggleStarredResponse

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
Cohesion: 0.53
Nodes (4): actualizarMaterial(), crearMaterial(), getMateriales(), router

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

### Community 110 - "probar_busqueda.js"
Cohesion: 0.15
Nodes (8): args, __dirname, args, __dirname, IMPORTANT: keep the reminder string free of backticks and $(...) constructs., ref_fs, ref_path, ref_url

### Community 124 - "useCatStore"
Cohesion: 0.50
Nodes (4): CategoriesManager(), NewOrderModal(), UnitPicker(), useCatStore()

## Ambiguous Edges - Review These
- `message.handler routing` → `confirmCommand (!confirm → SQL ejecutada)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to
- `BuildData platform (WhatsApp bot + REST API + Frontend)` → `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **499 isolated node(s):** `$schema`, `plugin`, `ESTADOS_PROCESAMIENTO`, `ESTADOS_VALIDOS`, `PRIORIDADES_VALIDAS` (+494 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 800 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `message.handler routing` and `confirmCommand (!confirm → SQL ejecutada)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `BuildData platform (WhatsApp bot + REST API + Frontend)` and `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `react` to `ScreenCronograma.tsx`, `ScreenRecibos.tsx`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `ScreenPresupuesto.tsx`, `ObrasHome.tsx`, `ScreenPedidos.tsx`, `@gravity-ui/icons`, `projects/_components/index.ts`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `ScreenStock.tsx`, `NuevaObraModal.tsx`, `ScreenInbox.tsx`, `LiveDashboard.tsx`, `app/layout.tsx`, `ScreenActividad.tsx`, `next`, `Frontend/package.json`, `DashboardContent.tsx`, `ScreenAlertas.tsx`, `AuthContext.tsx`, `NotificationsPanel.tsx`, `DAvatar.tsx`, `Button.tsx`, `DPill.tsx`, `LiveBot.tsx`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **Why does `@gravity-ui/icons` connect `@gravity-ui/icons` to `ScreenCronograma.tsx`, `ScreenRecibos.tsx`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `ScreenPresupuesto.tsx`, `landing.ts`, `ObrasHome.tsx`, `ScreenPedidos.tsx`, `projects/_components/index.ts`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `ScreenStock.tsx`, `NuevaObraModal.tsx`, `react`, `ScreenInbox.tsx`, `LiveDashboard.tsx`, `ScreenActividad.tsx`, `Frontend/package.json`, `DashboardContent.tsx`, `ScreenAlertas.tsx`, `AuthContext.tsx`, `app/page.tsx`, `NotificationsPanel.tsx`, `DAvatar.tsx`, `Button.tsx`, `WorkspaceSidebar.tsx`, `DPill.tsx`, `LiveBot.tsx`, `SideBar.tsx`, `DashboardSection.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `pool` connect `db.js` to `entitySearch.service.js`, `rubrosController.js`, `server.js`, `usuarios.js`, `sqlGuard.service.js`, `materialesController.js`, `bot.js`, `tareasController.js`, `obrasController.js`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `ESTADOS_PROCESAMIENTO` to the rest of the system?**
  _499 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `live-dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.02247191011235955 - nodes in this community are weakly interconnected._