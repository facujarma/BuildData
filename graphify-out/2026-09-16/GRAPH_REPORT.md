# Graph Report - BuildData  (2026-09-16)

## Corpus Check
- 322 files · ~174,299 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .lock 2, .ico 1)

## Summary
- 1799 nodes · 3396 edges · 124 communities (82 shown, 42 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 206 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ace5f07a`
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
- Button.tsx
- ScreenPedidos.tsx
- message.handler.ts
- ScreenInbox.tsx
- projects/_components/index.ts
- pollConfirmation.service.ts
- HowItWorks.tsx
- bot.js
- ScreenReportes.tsx
- ScreenStock.tsx
- NuevaObraModal.tsx
- settings-page.jsx
- ScreenAlertas.tsx
- dashboard/_components/index.ts
- Button
- pendingQuery.store.ts
- ScreenActividad.tsx
- obras-home.jsx
- compilerOptions
- api.service.ts
- LiveDashboard.tsx
- DPageHeader
- ScreenPerfil.tsx
- dashboard-empty.jsx
- planes-page.jsx
- DashboardContent.tsx
- entityResolution.service.ts
- freetext.handler.ts
- server.js
- db.js
- Frontend/package.json
- dashboard.ts
- tweaks-panel.jsx
- dashboardService.ts
- i18n.jsx
- react
- app/page.tsx
- AuthContext.tsx
- compilerOptions
- authController.js
- tareasController.js
- NotificationsPanel.tsx
- dashboard.api.ts
- obrasController.js
- DAvatar.tsx
- WorkspaceSidebar.tsx
- DashSidebar.tsx
- Database schema (obras construction)
- tasks
- Frontend App (Next.js)
- UnderConstructionPage.tsx
- client.ts
- LiveBot.tsx
- construction/page.tsx
- @gravity-ui/icons
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

## Communities (124 total, 42 thin omitted)

### Community 0 - "live-dashboard.jsx"
Cohesion: 0.02
Nodes (43): ACT_LISTENERS, ACTIVITY_SEED, ActivityStore, ALERT_LISTENERS, ALERTS_SEED, AlertStore, ALL_TASKS, BUDGET (+35 more)

### Community 1 - "ScreenCronograma.tsx"
Cohesion: 0.08
Nodes (55): buildGrid(), CalendarView(), DAY_HEADERS, DayInfo, Props, WEEKENDS, GanttView(), Props (+47 more)

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
Cohesion: 0.11
Nodes (25): CostosView(), TABS, Loading(), BudgetAuditEntry, BudgetEditModal(), DraftLine, Props, Donut() (+17 more)

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
Nodes (28): dependencies, axios, dotenv, express, groq-sdk, mongoose, qrcode-terminal, whatsapp-web.js (+20 more)

### Community 13 - "ObrasHome.tsx"
Cohesion: 0.13
Nodes (12): ObraCard(), ObraRow(), FILTERS, ObrasHome(), ObraThumb(), CreateObraInput, CreateObraPayload, getObras() (+4 more)

### Community 14 - "Button.tsx"
Cohesion: 0.28
Nodes (8): BtnSize, BtnVariant, ButtonAsButton, ButtonAsLink, ButtonBase, ButtonProps, SIZE_STYLES, VARIANT_STYLES

### Community 15 - "ScreenPedidos.tsx"
Cohesion: 0.11
Nodes (36): DeliveryData, DeliveryModal(), Props, NewOrderModal(), Props, NewOrderQuickModal(), Props, OrderDrawer() (+28 more)

### Community 16 - "message.handler.ts"
Cohesion: 0.19
Nodes (16): ayudaCommand, buildingsCommand, cancelCommand, Command, commands, getAllCommands(), getCommand(), registerCommand() (+8 more)

### Community 17 - "ScreenInbox.tsx"
Cohesion: 0.13
Nodes (14): KIND_ICON, KIND_LABEL, ScreenInbox(), Tab, INBOX_SEED, Loading(), getInbox(), InboxData (+6 more)

### Community 18 - "projects/_components/index.ts"
Cohesion: 0.19
Nodes (15): FileIcon(), PALETTES, PickCard(), Step1(), TYPE_ICONS, Step2(), Step4(), Step5() (+7 more)

### Community 19 - "pollConfirmation.service.ts"
Cohesion: 0.21
Nodes (22): getClient(), clearPending(), getEntityPending(), getPending(), setEntityPending(), setPending(), applyQuestionAnswer(), neededCatalogTipos() (+14 more)

### Community 20 - "HowItWorks.tsx"
Cohesion: 0.11
Nodes (6): DashboardMockup(), PhoneMockup(), PhoneMockupProps, LOGOS, Hero(), STAGES

### Community 21 - "bot.js"
Cohesion: 0.19
Nodes (16): actualizarStock(), crearMaterialDesdeBot(), crearPedidoDeCompra(), getCatalogo(), mapMessageAccion(), mapMessageTipo(), recibirMensaje(), registrarRetraso() (+8 more)

### Community 22 - "ScreenReportes.tsx"
Cohesion: 0.08
Nodes (24): GroupTab, GroupTabs(), MaterialesView(), TABS, Loading(), RegistroView(), TABS, VIEWS (+16 more)

### Community 23 - "ScreenStock.tsx"
Cohesion: 0.20
Nodes (15): DashToast(), useToast(), NewCategoryModal(), Props, ScreenStock(), Props, StockItemModal(), CAT_COLORS (+7 more)

### Community 24 - "NuevaObraModal.tsx"
Cohesion: 0.17
Nodes (15): INITIAL_DATA, NuevaObraModal(), validateStep(), Step3(), fmtMoney(), SuccessState(), DEFAULT_RUBROS, MORE_PEOPLE (+7 more)

### Community 25 - "settings-page.jsx"
Cohesion: 0.10
Nodes (4): ALL_PERMS, DEFAULT_ROLES, PERM_GROUPS, SETTINGS_NAV

### Community 26 - "ScreenAlertas.tsx"
Cohesion: 0.09
Nodes (31): AlertaDrawer(), ScreenAlertas(), TabDef, TabId, TABS, AlertaItem, AlertaLvl, AlertaState (+23 more)

### Community 27 - "dashboard/_components/index.ts"
Cohesion: 0.11
Nodes (22): Props, ChatBubble(), SUGGESTED, ContextValue, DashboardDataContext, DashboardDataProvider(), LookupData, noop() (+14 more)

### Community 28 - "Button"
Cohesion: 0.14
Nodes (16): InviteTeamModal(), InviteTeamModalProps, ScreenEquipo(), Obrero, Person, ROLES, Loading(), Button() (+8 more)

### Community 29 - "pendingQuery.store.ts"
Cohesion: 0.18
Nodes (17): formatComprobante(), formatFactura(), handleImage(), clearEntityPending(), EntityPending, hasEntityPending(), pendingQueries, PendingQuery (+9 more)

### Community 30 - "ScreenActividad.tsx"
Cohesion: 0.18
Nodes (16): KIND_ELEM, renderBold(), ScreenActividad(), ACTIVITY_GROUPS, ActivityGroup, ActivityItem, ANSWERS_DB, KIND_ICONS (+8 more)

### Community 31 - "obras-home.jsx"
Cohesion: 0.11
Nodes (5): FILES, OBRAS, STATUS, WORKSPACE_NAV, WORKSPACE_NAV_BOTTOM

### Community 32 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "api.service.ts"
Cohesion: 0.16
Nodes (16): loginCommand, apiRequest(), AUTH_HEADERS, callEndpoint(), CatalogoMaterial, CatalogoProveedor, CatalogoRubro, CatalogoTarea (+8 more)

### Community 36 - "ScreenPerfil.tsx"
Cohesion: 0.19
Nodes (8): ACT_ICON, ScreenPerfil(), PERFIL_SEED, PerfilActividad, PerfilData, PerfilPermiso, Loading(), getPerfil()

### Community 37 - "dashboard-empty.jsx"
Cohesion: 0.12
Nodes (3): EMPTY_SCREENS, obreroLink(), ObrerosInviter()

### Community 38 - "planes-page.jsx"
Cohesion: 0.12
Nodes (5): ButtonStyles(), COMPARE_GROUPS, FAQ_ITEMS, PlanCard(), PLANS

### Community 39 - "DashboardContent.tsx"
Cohesion: 0.17
Nodes (12): CAT_COLORS, CategoryFormData, CategoryModal(), STATE_MAP, DashboardAttention(), Props, catProgress(), DashboardContent() (+4 more)

### Community 40 - "entityResolution.service.ts"
Cohesion: 0.17
Nodes (14): ApiCall, Catalogo, ARRAY_KEYS, ARRAY_ONLY_KEYS, catalogList(), ENDPOINT_CATALOG_KINDS, EntityKind, isId() (+6 more)

### Community 41 - "freetext.handler.ts"
Cohesion: 0.12
Nodes (21): handleFreeText(), handleAudio(), buildEndpointDescription(), EndpointParam, ENDPOINTS, EndpointSchema, getEndpointSchema(), getUserPhoneFields() (+13 more)

### Community 42 - "server.js"
Cohesion: 0.21
Nodes (10): crearAlerta(), getAlertas(), resolverAlerta(), verificarInactividad(), getDashboard(), router, router, router (+2 more)

### Community 43 - "db.js"
Cohesion: 0.21
Nodes (8): crearReporte(), getReportes(), asignarObra(), crearUsuario(), getEquipo(), pool, router, router

### Community 44 - "Frontend/package.json"
Cohesion: 0.04
Nodes (41): nextConfig, dependencies, framer-motion, @gravity-ui/icons, @heroui/react, @heroui/styles, next, qrcode.react (+33 more)

### Community 45 - "dashboard.ts"
Cohesion: 0.12
Nodes (21): ActivityFeed(), Props, BudgetCard(), formatCurrency(), Props, CriticalAlertsCard(), Props, DELTA_COLORS (+13 more)

### Community 47 - "dashboardService.ts"
Cohesion: 0.21
Nodes (11): Props, DashboardLoading(), DashboardPage(), formatDate(), formatRelativeTime(), formatTime(), getDashboard(), TRADE_COLORS (+3 more)

### Community 48 - "i18n.jsx"
Cohesion: 0.30
Nodes (13): ATTR_ORIGINALS, I18N_DICT, I18N_REGEX, restoreOriginals(), setLanguage(), shouldSkipElement(), startObserver(), stopObserver() (+5 more)

### Community 49 - "react"
Cohesion: 0.16
Nodes (12): BrandPanel(), FakeMessageCard(), FakeMessageCardProps, tagStyles, SignInForm(), SignInFormProps, SignUpForm(), SignUpFormProps (+4 more)

### Community 50 - "app/page.tsx"
Cohesion: 0.18
Nodes (8): FEATURES, TONE_MAP, Beneficios(), ChatbotSection(), CTA(), featureIconMap, Funcionalidades(), HowItWorks()

### Community 51 - "AuthContext.tsx"
Cohesion: 0.23
Nodes (8): AuthWrapper(), ManropeFont, metadata, AuthContext, AuthContextType, AuthProvider(), getProfile(), registerUser()

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

### Community 57 - "dashboard.api.ts"
Cohesion: 0.17
Nodes (11): ApiActivityFeedItem, ApiAlertItem, ApiBudgetItem, ApiBudgetOverview, ApiDashboardResponse, ApiDashboardStats, ApiObraInfo, ApiOrderItem (+3 more)

### Community 58 - "obrasController.js"
Cohesion: 0.42
Nodes (8): buildObra(), crearObra(), deleteObra(), getObra(), getObras(), toggleStarred(), updateObra(), router

### Community 59 - "DAvatar.tsx"
Cohesion: 0.26
Nodes (6): WelcomeHero(), AvatarMenu(), DAvatar(), getInitials(), PALETTE, useAuth()

### Community 60 - "WorkspaceSidebar.tsx"
Cohesion: 0.20
Nodes (5): NAV_BOTTOM, NAV_ITEMS, SidebarTheme, THEMES, WorkspaceSidebar()

### Community 61 - "DashSidebar.tsx"
Cohesion: 0.25
Nodes (6): BaseItem, buildNavItems(), DashSidebar(), NavEntry, NavGroup, NavLink

### Community 62 - "Database schema (obras construction)"
Cohesion: 0.36
Nodes (10): alertas table (stock bajo, tarea vencida), Database schema (obras construction), gastos table, materiales table (stock mínimo), mensajes table (texto, audio, imagen), obras table, reportes table (diario, semanal, mensual), subtareas table (boolean completada) (+2 more)

### Community 63 - "tasks"
Cohesion: 0.20
Nodes (9): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+1 more)

### Community 64 - "Frontend App (Next.js)"
Cohesion: 0.25
Nodes (9): Frontend App (Next.js), BuildData Logo Mark (SVG), Ascending Bars Motif, BuildData Brand Identity Asset, Color Palette (Blue #0F4395, White, Amber #F59E0B), Frontend assets patterns directory, blueprint.svg (blueprint background pattern), Next.js Logo (next.svg) (+1 more)

### Community 65 - "UnderConstructionPage.tsx"
Cohesion: 0.31
Nodes (5): BrandLogo(), BrandLogoProps, ConstructionIllustration(), NotifyForm(), UnderConstructionPageProps

### Community 66 - "client.ts"
Cohesion: 0.31
Nodes (6): initClient(), mongoStore, Session, sessionSchema, mongoose, qrcode-terminal

### Community 67 - "LiveBot.tsx"
Cohesion: 0.28
Nodes (6): LiveBot(), Message, QuickReply, Scenario, SCENARIOS, framer-motion

### Community 69 - "@gravity-ui/icons"
Cohesion: 0.23
Nodes (6): WorkspaceTopbar(), SideBarBuildName(), SideBarButton(), SideBarSeccion(), SideBarSeccionProps, @gravity-ui/icons

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
- **459 isolated node(s):** `$schema`, `plugin`, `ESTADOS_VALIDOS`, `PRIORIDADES_VALIDAS`, `app` (+454 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 760 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `message.handler routing` and `confirmCommand (!confirm → SQL ejecutada)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `BuildData platform (WhatsApp bot + REST API + Frontend)` and `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `react` to `ScreenCronograma.tsx`, `ScreenRecibos.tsx`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `ScreenPresupuesto.tsx`, `ObrasHome.tsx`, `Button.tsx`, `ScreenPedidos.tsx`, `ScreenInbox.tsx`, `projects/_components/index.ts`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `ScreenStock.tsx`, `NuevaObraModal.tsx`, `ScreenAlertas.tsx`, `dashboard/_components/index.ts`, `Button`, `ScreenActividad.tsx`, `LiveDashboard.tsx`, `DPageHeader`, `ScreenPerfil.tsx`, `DashboardContent.tsx`, `Frontend/package.json`, `dashboard.ts`, `dashboardService.ts`, `AuthContext.tsx`, `NotificationsPanel.tsx`, `DAvatar.tsx`, `DashSidebar.tsx`, `UnderConstructionPage.tsx`, `LiveBot.tsx`, `construction/page.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `@gravity-ui/icons` connect `@gravity-ui/icons` to `ScreenCronograma.tsx`, `ScreenRecibos.tsx`, `ScreenConfiguracion.tsx`, `payments/page.tsx`, `ScreenPresupuesto.tsx`, `landing.ts`, `ObrasHome.tsx`, `ScreenPedidos.tsx`, `ScreenInbox.tsx`, `projects/_components/index.ts`, `HowItWorks.tsx`, `ScreenReportes.tsx`, `ScreenStock.tsx`, `NuevaObraModal.tsx`, `ScreenAlertas.tsx`, `dashboard/_components/index.ts`, `Button`, `ScreenActividad.tsx`, `LiveDashboard.tsx`, `DPageHeader`, `ScreenPerfil.tsx`, `DashboardContent.tsx`, `Frontend/package.json`, `dashboard.ts`, `react`, `app/page.tsx`, `NotificationsPanel.tsx`, `DAvatar.tsx`, `WorkspaceSidebar.tsx`, `DashSidebar.tsx`, `LiveBot.tsx`, `DashboardSection.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `ESTADOS_VALIDOS` to the rest of the system?**
  _459 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `live-dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.024390243902439025 - nodes in this community are weakly interconnected._
- **Should `ScreenCronograma.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07536231884057971 - nodes in this community are weakly interconnected._