# Graph Report - BuildData  (2026-09-16)

## Corpus Check
- 321 files · ~173,887 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .lock 2, .ico 1)

## Summary
- 1796 nodes · 3391 edges · 121 communities (78 shown, 43 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 206 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b556779`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- live-dashboard.jsx
- ScreenCronograma.tsx
- @gravity-ui/icons
- ScreenConfiguracion.tsx
- message.handler routing
- Frontend redesign plan (dashboard + grouped sidebar)
- payments/page.tsx
- package.json
- BudgetEditModal.tsx
- dbschema.ts
- Beneficios.tsx
- nueva-obra.jsx
- WhatsApp-Bot/package.json
- ObrasHome.tsx
- Button.tsx
- ScreenPedidos.tsx
- message.handler.ts
- ScreenInbox.tsx
- projects/_components/index.ts
- pollConfirmation.service.ts
- HowItWorks.tsx
- bot.js
- ScreenGaleria.tsx
- ScreenStock.tsx
- NuevaObraModal.tsx
- settings-page.jsx
- QuickAddModal.tsx
- react
- DPill.tsx
- pendingQuery.store.ts
- costos/page.tsx
- obras-home.jsx
- compilerOptions
- api.service.ts
- LiveDashboard.tsx
- ScreenActividad.tsx
- perfil/data/index.ts
- dashboard-empty.jsx
- planes-page.jsx
- freetext.handler.ts
- entityResolution.service.ts
- endpointSchema.ts
- server.js
- db.js
- Frontend/package.json
- DashboardContent.tsx
- tweaks-panel.jsx
- i18n.jsx
- AuthContext.tsx
- landing.ts
- app/page.tsx
- compilerOptions
- authController.js
- tareasController.js
- NotificationsPanel.tsx
- dashboardService.ts
- obrasController.js
- ScreenReportes.tsx
- WorkspaceSidebar.tsx
- Database schema (obras construction)
- tasks
- Frontend App (Next.js)
- LiveBot.tsx
- SideBar.tsx
- registro/page.tsx
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
- FileIcon.tsx
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
2. `@gravity-ui/icons` - 77 edges
3. `Button()` - 32 edges
4. `useDashboardData()` - 20 edges
5. `pool` - 19 edges
6. `DPill()` - 19 edges
7. `DPageHeader()` - 18 edges
8. `DAvatar()` - 17 edges
9. `DCard()` - 17 edges
10. `useAuth()` - 17 edges

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

## Communities (121 total, 43 thin omitted)

### Community 0 - "live-dashboard.jsx"
Cohesion: 0.02
Nodes (43): ACT_LISTENERS, ACTIVITY_SEED, ActivityStore, ALERT_LISTENERS, ALERTS_SEED, AlertStore, ALL_TASKS, BUDGET (+35 more)

### Community 1 - "ScreenCronograma.tsx"
Cohesion: 0.08
Nodes (53): buildGrid(), CalendarView(), DAY_HEADERS, DayInfo, Props, WEEKENDS, GanttView(), Props (+45 more)

### Community 2 - "@gravity-ui/icons"
Cohesion: 0.14
Nodes (21): DashToast(), useToast(), TABS, ASSUMPTIONS, KPI_TONES, ScreenPresupuesto(), Props, ReceiptModal() (+13 more)

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

### Community 8 - "BudgetEditModal.tsx"
Cohesion: 0.15
Nodes (18): BudgetAuditEntry, BudgetEditModal(), DraftLine, Props, Donut(), DonutProps, ProjectedLine, BUDGET_LINES (+10 more)

### Community 9 - "dbschema.ts"
Cohesion: 0.09
Nodes (33): Activity, ActivityEntity, ActivityFeedItem, Alert, AlertCategory, AlertItem, AlertType, BaseEntity (+25 more)

### Community 10 - "Beneficios.tsx"
Cohesion: 0.29
Nodes (4): BENEFICIOS_ITEMS, BENEFICIOS_STATS, Beneficios(), benefitIconMap

### Community 11 - "nueva-obra.jsx"
Cohesion: 0.10
Nodes (20): allPerm(), DEFAULT_RUBROS, fmtMoney(), initialsFromName(), isEmail(), makeRoles(), makeRubros(), MORE_PEOPLE (+12 more)

### Community 12 - "WhatsApp-Bot/package.json"
Cohesion: 0.07
Nodes (29): dependencies, axios, dotenv, express, groq-sdk, mongoose, qrcode-terminal, whatsapp-web.js (+21 more)

### Community 13 - "ObrasHome.tsx"
Cohesion: 0.12
Nodes (13): ObraCard(), ObraRow(), FILTERS, ObrasHome(), ObraThumb(), WorkspaceTopbar(), CreateObraInput, CreateObraPayload (+5 more)

### Community 14 - "Button.tsx"
Cohesion: 0.12
Nodes (19): AlertaDrawer(), TabId, TABS, AlertaState, LVL, STATE, Props, SideDrawer() (+11 more)

### Community 15 - "ScreenPedidos.tsx"
Cohesion: 0.12
Nodes (33): DeliveryData, DeliveryModal(), Props, NewOrderModal(), Props, OrderDrawer(), Props, STATE (+25 more)

### Community 16 - "message.handler.ts"
Cohesion: 0.13
Nodes (19): initClient(), ayudaCommand, buildingsCommand, cancelCommand, Command, commands, getAllCommands(), getCommand() (+11 more)

### Community 17 - "ScreenInbox.tsx"
Cohesion: 0.13
Nodes (14): KIND_ICON, KIND_LABEL, ScreenInbox(), Tab, INBOX_SEED, Loading(), getInbox(), InboxData (+6 more)

### Community 18 - "projects/_components/index.ts"
Cohesion: 0.23
Nodes (12): PickCard(), Step1(), TYPE_ICONS, Step2(), Step4(), Step5(), fmtMoney(), Step6() (+4 more)

### Community 19 - "pollConfirmation.service.ts"
Cohesion: 0.21
Nodes (21): getClient(), clearEntityPending(), getEntityPending(), getPending(), setEntityPending(), setPending(), neededCatalogTipos(), resolveOperationEntities() (+13 more)

### Community 20 - "HowItWorks.tsx"
Cohesion: 0.11
Nodes (7): DashboardMockup(), PhoneMockup(), PhoneMockupProps, LOGOS, Hero(), HowItWorks(), STAGES

### Community 21 - "bot.js"
Cohesion: 0.19
Nodes (16): actualizarStock(), crearMaterialDesdeBot(), crearPedidoDeCompra(), getCatalogo(), mapMessageAccion(), mapMessageTipo(), recibirMensaje(), registrarRetraso() (+8 more)

### Community 22 - "ScreenGaleria.tsx"
Cohesion: 0.21
Nodes (10): GroupTab, GroupTabs(), TABS, VIEWS, ScreenGaleria(), PHOTO_SEED, RUBRO_COLORS, GaleriaData (+2 more)

### Community 23 - "ScreenStock.tsx"
Cohesion: 0.15
Nodes (16): MaterialesView(), TABS, Loading(), NewCategoryModal(), Props, ScreenStock(), Props, StockItemModal() (+8 more)

### Community 24 - "NuevaObraModal.tsx"
Cohesion: 0.16
Nodes (16): INITIAL_DATA, NuevaObraModal(), validateStep(), Step3(), fmtMoney(), SuccessState(), DEFAULT_RUBROS, MORE_PEOPLE (+8 more)

### Community 25 - "settings-page.jsx"
Cohesion: 0.10
Nodes (4): ALL_PERMS, DEFAULT_ROLES, PERM_GROUPS, SETTINGS_NAV

### Community 26 - "QuickAddModal.tsx"
Cohesion: 0.05
Nodes (47): ACTIVITY_GROUPS, ActivityGroup, ActivityItem, ANSWERS_DB, KIND_ICONS, SUGGESTED_QUESTIONS, ScreenAlertas(), TabDef (+39 more)

### Community 27 - "react"
Cohesion: 0.08
Nodes (32): ChatBubble(), SUGGESTED, ContextValue, DashboardDataContext, DashboardDataProvider(), noop(), RubroInfo, useDashboardData() (+24 more)

### Community 28 - "DPill.tsx"
Cohesion: 0.16
Nodes (11): STATE_TONE, InviteTeamModal(), InviteTeamModalProps, ScreenEquipo(), Loading(), DAvatar(), getInitials(), PALETTE (+3 more)

### Community 29 - "pendingQuery.store.ts"
Cohesion: 0.17
Nodes (17): formatComprobante(), formatFactura(), handleImage(), ApiCall, EntityPending, hasEntityPending(), pendingQueries, PendingQuery (+9 more)

### Community 31 - "obras-home.jsx"
Cohesion: 0.11
Nodes (5): FILES, OBRAS, STATUS, WORKSPACE_NAV, WORKSPACE_NAV_BOTTOM

### Community 32 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "api.service.ts"
Cohesion: 0.17
Nodes (15): loginCommand, apiRequest(), AUTH_HEADERS, callEndpoint(), CatalogoMaterial, CatalogoProveedor, CatalogoRubro, CatalogoTarea (+7 more)

### Community 35 - "ScreenActividad.tsx"
Cohesion: 0.17
Nodes (9): KIND_ELEM, renderBold(), ScreenActividad(), DPageHeader(), DELTA_COLORS, DStatTile(), TONES, ACT_ICON (+1 more)

### Community 36 - "perfil/data/index.ts"
Cohesion: 0.19
Nodes (7): ScreenPerfil(), PERFIL_SEED, PerfilActividad, PerfilData, PerfilPermiso, Loading(), getPerfil()

### Community 37 - "dashboard-empty.jsx"
Cohesion: 0.12
Nodes (3): EMPTY_SCREENS, obreroLink(), ObrerosInviter()

### Community 38 - "planes-page.jsx"
Cohesion: 0.12
Nodes (5): ButtonStyles(), COMPARE_GROUPS, FAQ_ITEMS, PlanCard(), PLANS

### Community 39 - "freetext.handler.ts"
Cohesion: 0.28
Nodes (10): handleFreeText(), handleTextMessage(), clearPending(), hasPending(), handleAudio(), groq, transcribeAudio(), MSG (+2 more)

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
Cohesion: 0.10
Nodes (30): ActivityFeed(), Props, BudgetCard(), formatCurrency(), Props, CAT_COLORS, CategoryFormData, CategoryModal() (+22 more)

### Community 48 - "i18n.jsx"
Cohesion: 0.30
Nodes (13): ATTR_ORIGINALS, I18N_DICT, I18N_REGEX, restoreOriginals(), setLanguage(), shouldSkipElement(), startObserver(), stopObserver() (+5 more)

### Community 49 - "AuthContext.tsx"
Cohesion: 0.06
Nodes (28): AuthWrapper(), ManropeFont, metadata, BrandPanel(), FakeMessageCard(), FakeMessageCardProps, tagStyles, SignInForm() (+20 more)

### Community 50 - "landing.ts"
Cohesion: 0.23
Nodes (7): FEATURES, PROBLEMA_ITEMS, PROBLEMA_STATS, TONE_MAP, featureIconMap, Funcionalidades(), iconMap

### Community 51 - "app/page.tsx"
Cohesion: 0.32
Nodes (3): CTA(), Problema(), Footer()

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
Cohesion: 0.13
Nodes (18): formatDate(), formatRelativeTime(), formatTime(), getDashboard(), TRADE_COLORS, transformDashboard(), ApiActivityFeedItem, ApiAlertItem (+10 more)

### Community 58 - "obrasController.js"
Cohesion: 0.42
Nodes (8): buildObra(), crearObra(), deleteObra(), getObra(), getObras(), toggleStarred(), updateObra(), router

### Community 59 - "ScreenReportes.tsx"
Cohesion: 0.31
Nodes (9): RANGES, ScreenReportes(), SECTION_ICONS, RANGE_LABELS, SECTION_DEFS, SectionDef, SNAPSHOT, getReportesData() (+1 more)

### Community 60 - "WorkspaceSidebar.tsx"
Cohesion: 0.20
Nodes (5): NAV_BOTTOM, NAV_ITEMS, SidebarTheme, THEMES, WorkspaceSidebar()

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
Cohesion: 0.24
Nodes (7): LiveBot(), Message, QuickReply, Scenario, SCENARIOS, ChatbotSection(), framer-motion

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
- **458 isolated node(s):** `$schema`, `plugin`, `ESTADOS_VALIDOS`, `PRIORIDADES_VALIDAS`, `app` (+453 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 759 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `message.handler routing` and `confirmCommand (!confirm → SQL ejecutada)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `BuildData platform (WhatsApp bot + REST API + Frontend)` and `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `react` to `ScreenCronograma.tsx`, `@gravity-ui/icons`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `BudgetEditModal.tsx`, `ObrasHome.tsx`, `Button.tsx`, `ScreenPedidos.tsx`, `ScreenInbox.tsx`, `projects/_components/index.ts`, `HowItWorks.tsx`, `ScreenGaleria.tsx`, `ScreenStock.tsx`, `NuevaObraModal.tsx`, `QuickAddModal.tsx`, `DPill.tsx`, `costos/page.tsx`, `LiveDashboard.tsx`, `ScreenActividad.tsx`, `Frontend/package.json`, `DashboardContent.tsx`, `AuthContext.tsx`, `NotificationsPanel.tsx`, `ScreenReportes.tsx`, `LiveBot.tsx`, `registro/page.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `@gravity-ui/icons` connect `@gravity-ui/icons` to `ScreenCronograma.tsx`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `BudgetEditModal.tsx`, `Beneficios.tsx`, `ObrasHome.tsx`, `Button.tsx`, `ScreenPedidos.tsx`, `ScreenInbox.tsx`, `projects/_components/index.ts`, `HowItWorks.tsx`, `ScreenGaleria.tsx`, `ScreenStock.tsx`, `NuevaObraModal.tsx`, `QuickAddModal.tsx`, `react`, `DPill.tsx`, `LiveDashboard.tsx`, `ScreenActividad.tsx`, `Frontend/package.json`, `DashboardContent.tsx`, `AuthContext.tsx`, `landing.ts`, `app/page.tsx`, `NotificationsPanel.tsx`, `ScreenReportes.tsx`, `WorkspaceSidebar.tsx`, `LiveBot.tsx`, `SideBar.tsx`, `DashboardSection.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `ESTADOS_VALIDOS` to the rest of the system?**
  _458 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `live-dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.024390243902439025 - nodes in this community are weakly interconnected._
- **Should `ScreenCronograma.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07836538461538461 - nodes in this community are weakly interconnected._