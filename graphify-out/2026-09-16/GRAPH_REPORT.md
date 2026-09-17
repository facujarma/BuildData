# Graph Report - BuildData  (2026-09-16)

## Corpus Check
- 322 files · ~174,797 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .lock 2, .ico 1)

## Summary
- 1797 nodes · 3391 edges · 118 communities (77 shown, 41 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 206 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5adb548`
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
- freetext.handler.ts
- ScreenPedidos.tsx
- message.handler.ts
- ScreenInbox.tsx
- projects/_components/index.ts
- pollConfirmation.service.ts
- HowItWorks.tsx
- bot.js
- ScreenReportes.tsx
- Button.tsx
- NuevaObraModal.tsx
- settings-page.jsx
- ScreenAlertas.tsx
- react
- DPill.tsx
- pendingQuery.store.ts
- MaterialesView.tsx
- obras-home.jsx
- compilerOptions
- api.service.ts
- LiveDashboard.tsx
- Beneficios.tsx
- ScreenPerfil.tsx
- dashboard-empty.jsx
- planes-page.jsx
- perfil/page.tsx
- entityResolution.service.ts
- endpointSchema.ts
- server.js
- db.js
- Frontend/package.json
- DashboardContent.tsx
- tweaks-panel.jsx
- i18n.jsx
- AuthContext.tsx
- app/page.tsx
- compilerOptions
- authController.js
- tareasController.js
- NotificationsPanel.tsx
- dashboardService.ts
- obrasController.js
- DAvatar.tsx
- DashboardDataContext.tsx
- Database schema (obras construction)
- tasks
- Frontend App (Next.js)
- LiveBot.tsx
- SideBar.tsx
- obrerosController.js
- pedidosController.js
- rubrosController.js
- DashboardSection.tsx
- projects.api.ts
- howitworks.jsx
- ScreenDashboard
- useRubroStore
- NuevaTareaModal
- actividadController.js
- materialesController.js
- presupuestosController.js
- proveedoresController.js
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
- server.ts
- opencode.json
- graphify.js
- Frontend App (Next.js)
- eslint.config.mjs
- postcss.config.mjs
- AlertDrawer
- bold
- CategoriesManager
- ApiCall.method union (POST | GET | PATCH)
- Globe SVG Icon
- Vercel Logo SVG (asset public/vercel.svg)
- WhatsApp Bot architecture (message flow diagram)
- Dockerfile (oven/bun:1.3.12, Chrome 146)

## God Nodes (most connected - your core abstractions)
1. `react` - 82 edges
2. `@gravity-ui/icons` - 78 edges
3. `Button()` - 30 edges
4. `useDashboardData()` - 20 edges
5. `pool` - 19 edges
6. `DPill()` - 19 edges
7. `DPageHeader()` - 18 edges
8. `DAvatar()` - 17 edges
9. `useAuth()` - 17 edges
10. `BaseEntity` - 16 edges

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
- None detected.

## Hyperedges (group relationships)
- **WhatsApp message routing + LLM operation execution flow** — agents_message_handler, agents_freetext_handler, agents_voice_handler, agents_image_handler, agents_texttooperation, agents_pendingquery_store, agents_executepending [EXTRACTED 1.00]
- **Mock services following the stockService seed+delay+clone pattern** — apps_frontend_tmp_temp_stockservice, apps_frontend_tmp_temp_inbox_service, apps_frontend_tmp_temp_galeria_service, apps_frontend_tmp_temp_notificaciones_service, apps_frontend_tmp_temp_configuracion_service, apps_frontend_tmp_temp_perfil_service, apps_frontend_tmp_temp_rubros_service [INFERRED 0.85]
- **Grouped navigation redesign (8 items, ?v= sub-tabs, legacy redirects)** — apps_frontend_tmp_temp_grouped_nav, apps_frontend_tmp_temp_grouptabs, apps_frontend_tmp_temp_dashsidebar, apps_frontend_tmp_temp_searchparams_v, apps_frontend_tmp_temp_redirects [INFERRED 0.85]

## Communities (118 total, 41 thin omitted)

### Community 0 - "live-dashboard.jsx"
Cohesion: 0.02
Nodes (43): ACT_LISTENERS, ACTIVITY_SEED, ActivityStore, ALERT_LISTENERS, ALERTS_SEED, AlertStore, ALL_TASKS, BUDGET (+35 more)

### Community 1 - "ScreenCronograma.tsx"
Cohesion: 0.08
Nodes (53): buildGrid(), CalendarView(), DAY_HEADERS, DayInfo, Props, WEEKENDS, GanttView(), Props (+45 more)

### Community 2 - "ScreenRecibos.tsx"
Cohesion: 0.12
Nodes (18): GroupTab, GroupTabs(), CostosView(), TABS, Loading(), Props, ReceiptModal(), ReceiptModalData (+10 more)

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
Cohesion: 0.08
Nodes (23): FAQ(), FAQItemData, FAQProps, CellValue, CompareCategory, CompareTable(), CompareTableProps, renderCell() (+15 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): dependencies, cors, dotenv, express, groq-sdk, multer, pg, @supabase/supabase-js (+29 more)

### Community 8 - "ScreenPresupuesto.tsx"
Cohesion: 0.15
Nodes (22): BudgetAuditEntry, BudgetEditModal(), DraftLine, Props, Donut(), DonutProps, ASSUMPTIONS, KPI_TONES (+14 more)

### Community 9 - "dbschema.ts"
Cohesion: 0.09
Nodes (33): Activity, ActivityEntity, ActivityFeedItem, Alert, AlertCategory, AlertItem, AlertType, BaseEntity (+25 more)

### Community 10 - "landing.ts"
Cohesion: 0.23
Nodes (7): FEATURES, PROBLEMA_ITEMS, PROBLEMA_STATS, TONE_MAP, featureIconMap, iconMap, Problema()

### Community 11 - "nueva-obra.jsx"
Cohesion: 0.10
Nodes (20): allPerm(), DEFAULT_RUBROS, fmtMoney(), initialsFromName(), isEmail(), makeRoles(), makeRubros(), MORE_PEOPLE (+12 more)

### Community 12 - "WhatsApp-Bot/package.json"
Cohesion: 0.07
Nodes (29): dependencies, axios, dotenv, express, groq-sdk, mongoose, qrcode-terminal, whatsapp-web.js (+21 more)

### Community 13 - "ObrasHome.tsx"
Cohesion: 0.12
Nodes (13): ObraCard(), ObraRow(), FILTERS, ObrasHome(), ObraThumb(), WorkspaceTopbar(), CreateObraInput, CreateObraPayload (+5 more)

### Community 14 - "freetext.handler.ts"
Cohesion: 0.28
Nodes (10): handleFreeText(), handleTextMessage(), clearPending(), hasPending(), handleAudio(), groq, transcribeAudio(), MSG (+2 more)

### Community 15 - "ScreenPedidos.tsx"
Cohesion: 0.12
Nodes (36): DeliveryData, DeliveryModal(), Props, NewOrderModal(), Props, NewOrderQuickModal(), Props, OrderDrawer() (+28 more)

### Community 16 - "message.handler.ts"
Cohesion: 0.13
Nodes (19): initClient(), ayudaCommand, buildingsCommand, cancelCommand, Command, commands, getAllCommands(), getCommand() (+11 more)

### Community 17 - "ScreenInbox.tsx"
Cohesion: 0.13
Nodes (14): KIND_ICON, KIND_LABEL, ScreenInbox(), Tab, INBOX_SEED, Loading(), getInbox(), InboxData (+6 more)

### Community 18 - "projects/_components/index.ts"
Cohesion: 0.19
Nodes (14): FileIcon(), PALETTES, PickCard(), Step1(), TYPE_ICONS, Step2(), Step4(), Step5() (+6 more)

### Community 19 - "pollConfirmation.service.ts"
Cohesion: 0.21
Nodes (21): getClient(), clearEntityPending(), getEntityPending(), getPending(), setEntityPending(), setPending(), neededCatalogTipos(), resolveOperationEntities() (+13 more)

### Community 20 - "HowItWorks.tsx"
Cohesion: 0.11
Nodes (7): DashboardMockup(), PhoneMockup(), PhoneMockupProps, LOGOS, Hero(), HowItWorks(), STAGES

### Community 21 - "bot.js"
Cohesion: 0.19
Nodes (16): actualizarStock(), crearMaterialDesdeBot(), crearPedidoDeCompra(), getCatalogo(), mapMessageAccion(), mapMessageTipo(), recibirMensaje(), registrarRetraso() (+8 more)

### Community 22 - "ScreenReportes.tsx"
Cohesion: 0.11
Nodes (19): RegistroView(), TABS, VIEWS, ScreenGaleria(), PHOTO_SEED, RUBRO_COLORS, Loading(), RANGES (+11 more)

### Community 23 - "Button.tsx"
Cohesion: 0.14
Nodes (22): NewCategoryModal(), Props, ScreenStock(), Props, StockItemModal(), CAT_COLORS, CATEGORIES, getStatus() (+14 more)

### Community 24 - "NuevaObraModal.tsx"
Cohesion: 0.16
Nodes (16): INITIAL_DATA, NuevaObraModal(), validateStep(), Step3(), fmtMoney(), SuccessState(), DEFAULT_RUBROS, MORE_PEOPLE (+8 more)

### Community 25 - "settings-page.jsx"
Cohesion: 0.10
Nodes (4): ALL_PERMS, DEFAULT_ROLES, PERM_GROUPS, SETTINGS_NAV

### Community 26 - "ScreenAlertas.tsx"
Cohesion: 0.05
Nodes (56): KIND_ELEM, renderBold(), ScreenActividad(), ACTIVITY_GROUPS, ActivityGroup, ActivityItem, ANSWERS_DB, KIND_ICONS (+48 more)

### Community 27 - "react"
Cohesion: 0.13
Nodes (20): ChatBubble(), SUGGESTED, CRUMB_MAP, DashTopBar(), SUB_MAP, QuickAddContext, QuickAddContextValue, QuickAddProvider() (+12 more)

### Community 28 - "DPill.tsx"
Cohesion: 0.24
Nodes (6): InviteTeamModal(), InviteTeamModalProps, ScreenEquipo(), Loading(), DPill(), MAP

### Community 29 - "pendingQuery.store.ts"
Cohesion: 0.17
Nodes (17): formatComprobante(), formatFactura(), handleImage(), ApiCall, EntityPending, hasEntityPending(), pendingQueries, PendingQuery (+9 more)

### Community 30 - "MaterialesView.tsx"
Cohesion: 0.32
Nodes (3): MaterialesView(), TABS, Loading()

### Community 31 - "obras-home.jsx"
Cohesion: 0.11
Nodes (5): FILES, OBRAS, STATUS, WORKSPACE_NAV, WORKSPACE_NAV_BOTTOM

### Community 32 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "api.service.ts"
Cohesion: 0.17
Nodes (15): loginCommand, apiRequest(), AUTH_HEADERS, callEndpoint(), CatalogoMaterial, CatalogoProveedor, CatalogoRubro, CatalogoTarea (+7 more)

### Community 35 - "Beneficios.tsx"
Cohesion: 0.29
Nodes (4): BENEFICIOS_ITEMS, BENEFICIOS_STATS, Beneficios(), benefitIconMap

### Community 36 - "ScreenPerfil.tsx"
Cohesion: 0.13
Nodes (13): DPageHeader(), DELTA_COLORS, DStatTile(), TONES, EmptyDashboardContent(), ACT_ICON, ScreenPerfil(), PERFIL_SEED (+5 more)

### Community 37 - "dashboard-empty.jsx"
Cohesion: 0.12
Nodes (3): EMPTY_SCREENS, obreroLink(), ObrerosInviter()

### Community 38 - "planes-page.jsx"
Cohesion: 0.12
Nodes (5): ButtonStyles(), COMPARE_GROUPS, FAQ_ITEMS, PlanCard(), PLANS

### Community 40 - "entityResolution.service.ts"
Cohesion: 0.17
Nodes (15): Catalogo, crearMaterial(), applyQuestionAnswer(), ARRAY_KEYS, ARRAY_ONLY_KEYS, catalogList(), ENDPOINT_CATALOG_KINDS, EntityKind (+7 more)

### Community 41 - "endpointSchema.ts"
Cohesion: 0.16
Nodes (14): buildEndpointDescription(), EndpointParam, ENDPOINTS, EndpointSchema, getEndpointSchema(), getUserPhoneFields(), validateApiCall(), ValidationResult (+6 more)

### Community 42 - "server.js"
Cohesion: 0.21
Nodes (10): crearAlerta(), getAlertas(), resolverAlerta(), verificarInactividad(), getDashboard(), router, router, router (+2 more)

### Community 43 - "db.js"
Cohesion: 0.21
Nodes (8): crearReporte(), getReportes(), asignarObra(), crearUsuario(), getEquipo(), pool, router, router

### Community 44 - "Frontend/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, framer-motion, @gravity-ui/icons, @heroui/react, @heroui/styles, next, qrcode.react (+34 more)

### Community 45 - "DashboardContent.tsx"
Cohesion: 0.09
Nodes (30): ActivityFeed(), Props, BudgetCard(), formatCurrency(), Props, CAT_COLORS, CategoryFormData, CategoryModal() (+22 more)

### Community 48 - "i18n.jsx"
Cohesion: 0.30
Nodes (13): ATTR_ORIGINALS, I18N_DICT, I18N_REGEX, restoreOriginals(), setLanguage(), shouldSkipElement(), startObserver(), stopObserver() (+5 more)

### Community 49 - "AuthContext.tsx"
Cohesion: 0.06
Nodes (28): AuthWrapper(), ManropeFont, metadata, BrandPanel(), FakeMessageCard(), FakeMessageCardProps, tagStyles, SignInForm() (+20 more)

### Community 50 - "app/page.tsx"
Cohesion: 0.24
Nodes (6): ChatbotSection(), CTA(), Funcionalidades(), Navbar(), NavbarProps, LogoIcon()

### Community 53 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir, rootDir, skipLibCheck (+4 more)

### Community 54 - "authController.js"
Cohesion: 0.29
Nodes (8): getMe(), login(), logout(), register(), authMiddleware(), router, supabase, supabaseAdmin

### Community 55 - "tareasController.js"
Cohesion: 0.32
Nodes (10): actualizarTarea(), completarTarea(), completarTareaDesdeBot(), crearTarea(), crearTareaDesdeBot(), ESTADOS_VALIDOS, getTareas(), PRIORIDADES_VALIDAS (+2 more)

### Community 56 - "NotificationsPanel.tsx"
Cohesion: 0.29
Nodes (8): NOTIF_SEED, NotifItem, NotifKind, KIND_ICON, KIND_TINT, NotificationsPanel(), getNotificaciones(), NotificacionesData

### Community 57 - "dashboardService.ts"
Cohesion: 0.14
Nodes (16): formatDate(), formatRelativeTime(), formatTime(), TRADE_COLORS, transformDashboard(), ApiActivityFeedItem, ApiAlertItem, ApiBudgetItem (+8 more)

### Community 58 - "obrasController.js"
Cohesion: 0.42
Nodes (8): buildObra(), crearObra(), deleteObra(), getObra(), getObras(), toggleStarred(), updateObra(), router

### Community 60 - "DAvatar.tsx"
Cohesion: 0.16
Nodes (8): NAV_BOTTOM, NAV_ITEMS, SidebarTheme, THEMES, WorkspaceSidebar(), DAvatar(), getInitials(), PALETTE

### Community 61 - "DashboardDataContext.tsx"
Cohesion: 0.11
Nodes (18): Props, ContextValue, DashboardDataContext, DashboardDataProvider(), LookupData, noop(), RubroInfo, useDashboardData() (+10 more)

### Community 62 - "Database schema (obras construction)"
Cohesion: 0.36
Nodes (10): alertas table (stock bajo, tarea vencida), Database schema (obras construction), gastos table, materiales table (stock mínimo), mensajes table (texto, audio, imagen), obras table, reportes table (diario, semanal, mensual), subtareas table (boolean completada) (+2 more)

### Community 63 - "tasks"
Cohesion: 0.20
Nodes (9): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+1 more)

### Community 64 - "Frontend App (Next.js)"
Cohesion: 0.25
Nodes (9): Frontend App (Next.js), BuildData Logo Mark (SVG), Ascending Bars Motif, BuildData Brand Identity Asset, Color Palette (Blue #0F4395, White, Amber #F59E0B), Frontend assets patterns directory, blueprint.svg (blueprint background pattern), Next.js Logo (next.svg) (+1 more)

### Community 67 - "LiveBot.tsx"
Cohesion: 0.28
Nodes (6): LiveBot(), Message, QuickReply, Scenario, SCENARIOS, framer-motion

### Community 69 - "SideBar.tsx"
Cohesion: 0.31
Nodes (4): SideBarBuildName(), SideBarButton(), SideBarSeccion(), SideBarSeccionProps

### Community 71 - "obrerosController.js"
Cohesion: 0.36
Nodes (6): asignarObraObrero(), getObreros(), getUserByPhone(), quitarObreroDeObra(), registrarObrero(), router

### Community 72 - "pedidosController.js"
Cohesion: 0.43
Nodes (6): aprobarPedido(), crearPedidoWeb(), getPedidos(), rechazarPedido(), resolverProveedor(), router

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
Cohesion: 0.29
Nodes (7): catProgress(), ScreenActivity(), ScreenAlerts(), ScreenDashboard(), useActivityStore(), useAlertStore(), useToast()

### Community 79 - "useRubroStore"
Cohesion: 0.29
Nodes (7): DashTareasComplete(), NewOrderModal(), ScreenGallery(), ScreenGantt(), ScreenRubros(), useRubroStore(), useTaskStore()

### Community 80 - "NuevaTareaModal"
Cohesion: 0.43
Nodes (7): fmtDate(), fmtDateLong(), GanttView(), ListView(), NuevaTareaModal(), TaskDetail(), weekDate()

### Community 81 - "actividadController.js"
Cohesion: 0.53
Nodes (4): crearActividad(), getActividad(), mapAccion(), router

### Community 82 - "materialesController.js"
Cohesion: 0.53
Nodes (4): actualizarMaterial(), crearMaterial(), getMateriales(), router

### Community 83 - "presupuestosController.js"
Cohesion: 0.53
Nodes (4): actualizarPresupuesto(), crearPresupuesto(), getPresupuestos(), router

### Community 84 - "proveedoresController.js"
Cohesion: 0.53
Nodes (4): crearProveedor(), getProveedores(), vincularProveedor(), router

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

## Ambiguous Edges - Review These
- `message.handler routing` → `confirmCommand (!confirm → SQL ejecutada)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to
- `BuildData platform (WhatsApp bot + REST API + Frontend)` → `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **457 isolated node(s):** `$schema`, `plugin`, `ESTADOS_VALIDOS`, `PRIORIDADES_VALIDAS`, `app` (+452 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 757 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `message.handler routing` and `confirmCommand (!confirm → SQL ejecutada)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `BuildData platform (WhatsApp bot + REST API + Frontend)` and `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `react` to `ScreenCronograma.tsx`, `ScreenRecibos.tsx`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `ScreenPresupuesto.tsx`, `ObrasHome.tsx`, `ScreenPedidos.tsx`, `ScreenInbox.tsx`, `projects/_components/index.ts`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `Button.tsx`, `NuevaObraModal.tsx`, `ScreenAlertas.tsx`, `DPill.tsx`, `MaterialesView.tsx`, `LiveDashboard.tsx`, `ScreenPerfil.tsx`, `Frontend/package.json`, `DashboardContent.tsx`, `AuthContext.tsx`, `NotificationsPanel.tsx`, `DashboardDataContext.tsx`, `LiveBot.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `@gravity-ui/icons` connect `react` to `ScreenCronograma.tsx`, `ScreenRecibos.tsx`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `ScreenPresupuesto.tsx`, `landing.ts`, `ObrasHome.tsx`, `ScreenPedidos.tsx`, `ScreenInbox.tsx`, `projects/_components/index.ts`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `Button.tsx`, `NuevaObraModal.tsx`, `ScreenAlertas.tsx`, `DPill.tsx`, `MaterialesView.tsx`, `LiveDashboard.tsx`, `Beneficios.tsx`, `ScreenPerfil.tsx`, `Frontend/package.json`, `DashboardContent.tsx`, `AuthContext.tsx`, `app/page.tsx`, `NotificationsPanel.tsx`, `DAvatar.tsx`, `DashboardDataContext.tsx`, `LiveBot.tsx`, `SideBar.tsx`, `DashboardSection.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `ESTADOS_VALIDOS` to the rest of the system?**
  _457 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `live-dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.024390243902439025 - nodes in this community are weakly interconnected._
- **Should `ScreenCronograma.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08065268065268065 - nodes in this community are weakly interconnected._