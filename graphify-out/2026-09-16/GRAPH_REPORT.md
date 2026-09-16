# Graph Report - BuildData  (2026-09-15)

## Corpus Check
- 330 files · ~170,747 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .lock 2, .ico 1)

## Summary
- 1776 nodes · 3323 edges · 130 communities (87 shown, 43 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 206 edges (avg confidence: 0.86)
- Token cost: 13,777 input · 18,190 output

## Community Hubs (Navigation)
- Dashboard Store + Mock Seeds
- Cronograma Screens
- Recibos/Reportes/Galería Screens
- Configuración + DPageHeader
- Bot Entity Resolution Pipeline
- Frontend Redesign Mockups
- Landing Pricing Section
- Bot Package Manifest
- Presupuesto/Perfil Screens
- Backend dbschema Entities
- Dashboard Shell + QuickAdd
- Onboarding Obra Wizard
- WhatsApp-Bot Dependencies
- Obras Home + Projects
- Alertas Screens + Service
- Pedidos Screens + Service
- Message Routing Core
- Inbox Screens + Service
- Nueva Obra Wizard Steps
- Bot Poll + Obra Confirmation
- Landing Hero + Mockups
- Backend Bot Routes + Controller
- Auth Nav + Sidebar (obrador)
- Stock Screens + StockModal
- Nueva Obra Modal Wizard
- Settings Permissions Mockup
- Actividad Screens + Service
- Dashboard Content + Categories
- Equipo Screens + Service
- Pending Store + Image/Vision
- Auth SignIn/SignUp Forms
- Obras Home JSX Mockup
- Root tsconfig Compiler
- API Service + Login Command
- LiveDashboard Sidebar Shell
- DCard + KPI Cards
- Order Drawer + Delivery
- Dashboard Empty States
- Plans Page Mockup
- Free Text / Voice Handlers
- Entity Resolution Service
- Endpoint Schema + LLM Service
- Backend Alerts/Dashboard Routes
- Backend DB Pool + Usuarios
- Frontend Package Manifest
- Backend Dashboard Cards + Feed
- Tweaks Panel Mockup
- Frontend Dashboard Service
- i18n Translation Engine
- Under Construction Landing
- Landing Problems/Benefits
- Landing Features + CTA
- WhatsApp-Bot tsconfig
- Backend Auth Middleware
- Backend Tareas + Bot Completar
- Notificaciones Screens
- Frontend Dashboard API Types
- Backend Obras Controller
- Frontend UI Dependencies
- Workspace Sidebar
- Frontend Auth Context
- Database Schema Docs
- Turbo Pipeline Config
- Brand Assets + Palette
- Frontend App Layout + Auth
- Frontend Dev Dependencies
- Landing LiveBot Chat
- Dashboard Data Context
- SideBar Components
- Button Variants
- Backend Obreros Controller
- Backend Pedidos Controller
- Backend Rubros Controller
- Landing Dashboard Section
- Materiales View + Loading
- Frontend Projects API Types
- Landing How It Works
- Dashboard Screens Store Hooks
- Task/Rubro Stores + Modal
- Nueva Tarea Modal + Gantt Views
- Backend Actividad Controller
- Backend Materiales Controller
- Backend Presupuestos Controller
- Backend Proveedores Controller
- Logo On-Dark Brand Assets
- Projects Loading Skeleton
- Package Scripts
- Equipo Page Loading
- Phone Input Component
- Profile Page Mockup
- Mongo Session Store
- BuildData Logo Branding
- LiveBot JSX Component
- Backend Auth Middlewares
- File Icon Component
- Period Navigation
- Search Bar Component
- Chat Bubble Mockup
- Product Tour Mockup
- Bot Express Server
- Opencode Plugin Config
- Graphify Plugin
- Frontend + File Icon
- ESLint Config
- PostCSS Config
- Alert Drawer
- Person Drawer
- Categories Manager
- ApiCall Method Union
- Globe Icon
- Vercel Logo
- Bot Architecture Diagram
- Docker Container Config

## God Nodes (most connected - your core abstractions)
1. `react` - 81 edges
2. `@gravity-ui/icons` - 75 edges
3. `Button()` - 31 edges
4. `useDashboardData()` - 20 edges
5. `pool` - 19 edges
6. `DPageHeader()` - 18 edges
7. `DCard()` - 18 edges
8. `DPill()` - 18 edges
9. `DAvatar()` - 17 edges
10. `useAuth()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `BuildData (README overview)` --semantically_similar_to--> `BuildData platform (WhatsApp bot + REST API + Frontend)`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `textToSQL() (Groq / Llama 3.3)` --semantically_similar_to--> `textToOperation() → {endpoint, method, data, comment}`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `pendingQuery.store (almacena SQL pendiente)` --semantically_similar_to--> `pendingQuery.store`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `confirmCommand (!confirm → SQL ejecutada)` --semantically_similar_to--> `sendObraConfirmationText() textual numbered survey`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `message.handler (enrutador)` --semantically_similar_to--> `message.handler routing`  [INFERRED] [semantically similar]
  README.md → AGENTS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **WhatsApp message routing + LLM operation execution flow** — agents_message_handler, agents_freetext_handler, agents_voice_handler, agents_image_handler, agents_texttooperation, agents_pendingquery_store, agents_executepending [EXTRACTED 1.00]
- **Mock services following the stockService seed+delay+clone pattern** — apps_frontend_tmp_temp_stockservice, apps_frontend_tmp_temp_inbox_service, apps_frontend_tmp_temp_galeria_service, apps_frontend_tmp_temp_notificaciones_service, apps_frontend_tmp_temp_configuracion_service, apps_frontend_tmp_temp_perfil_service, apps_frontend_tmp_temp_rubros_service [INFERRED 0.85]
- **Grouped navigation redesign (8 items, ?v= sub-tabs, legacy redirects)** — apps_frontend_tmp_temp_grouped_nav, apps_frontend_tmp_temp_grouptabs, apps_frontend_tmp_temp_dashsidebar, apps_frontend_tmp_temp_searchparams_v, apps_frontend_tmp_temp_redirects [INFERRED 0.85]

## Communities (130 total, 43 thin omitted)

### Community 0 - "Dashboard Store + Mock Seeds"
Cohesion: 0.02
Nodes (43): ACT_LISTENERS, ACTIVITY_SEED, ActivityStore, ALERT_LISTENERS, ALERTS_SEED, AlertStore, ALL_TASKS, BUDGET (+35 more)

### Community 1 - "Cronograma Screens"
Cohesion: 0.08
Nodes (55): buildGrid(), CalendarView(), DAY_HEADERS, DayInfo, Props, WEEKENDS, GanttView(), Props (+47 more)

### Community 2 - "Recibos/Reportes/Galería Screens"
Cohesion: 0.06
Nodes (37): GroupTab, GroupTabs(), CostosView(), TABS, Loading(), Props, ReceiptModal(), ReceiptModalData (+29 more)

### Community 3 - "Configuración + DPageHeader"
Cohesion: 0.07
Nodes (27): DPageHeader(), ObraDefaults, ScreenConfiguracion(), ConfiguracionPlan, INTEGRACIONES_SEED, IntegracionItem, OBRA_SETTINGS, ObraEstado (+19 more)

### Community 4 - "Bot Entity Resolution Pipeline"
Cohesion: 0.05
Nodes (52): api.service, /bot/pedidoDeCompra endpoint, /bot/retraso endpoint (updates rubros table), /bot/tareas endpoint (crear, rubro_id opcional), PATCH /bot/tareas/:id/completar, buildEndpointDescription(), callEndpoint() (fetch to API_URL, service role key), Per-obra entity catalog (GET /bot/catalogo) (+44 more)

### Community 5 - "Frontend Redesign Mockups"
Cohesion: 0.06
Nodes (47): BuildData platform (WhatsApp bot + REST API + Frontend), Blueprint background motif (AI insight banner), ChatBubble (loaded-state AI chatbot), dashboard-empty.jsx (onboarding empty state), DashboardPage (root, tweakable state), Empty (onboarding) vs loaded dashboard states, i18n es/en language switching, LiveDashboard (loaded/empty screens) (+39 more)

### Community 6 - "Landing Pricing Section"
Cohesion: 0.07
Nodes (26): FAQ(), FAQItemData, FAQProps, CellValue, CompareCategory, CompareTable(), CompareTableProps, renderCell() (+18 more)

### Community 7 - "Bot Package Manifest"
Cohesion: 0.05
Nodes (37): dependencies, cors, dotenv, express, groq-sdk, multer, pg, @supabase/supabase-js (+29 more)

### Community 8 - "Presupuesto/Perfil Screens"
Cohesion: 0.10
Nodes (22): DStatTile(), ACT_ICON, ScreenPerfil(), PERFIL_SEED, PerfilActividad, PerfilData, PerfilPermiso, Loading() (+14 more)

### Community 9 - "Backend dbschema Entities"
Cohesion: 0.09
Nodes (33): Activity, ActivityEntity, ActivityFeedItem, Alert, AlertCategory, AlertItem, AlertType, BaseEntity (+25 more)

### Community 10 - "Dashboard Shell + QuickAdd"
Cohesion: 0.11
Nodes (20): ChatBubble(), SUGGESTED, useDashboardData(), CRUMB_MAP, DashTopBar(), SUB_MAP, Props, QUICK_ADD_TYPES (+12 more)

### Community 11 - "Onboarding Obra Wizard"
Cohesion: 0.10
Nodes (20): allPerm(), DEFAULT_RUBROS, fmtMoney(), initialsFromName(), isEmail(), makeRoles(), makeRubros(), MORE_PEOPLE (+12 more)

### Community 12 - "WhatsApp-Bot Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, axios, dotenv, express, groq-sdk, mongoose, qrcode-terminal, whatsapp-web.js (+21 more)

### Community 13 - "Obras Home + Projects"
Cohesion: 0.12
Nodes (13): ObraCard(), ObraRow(), FILTERS, ObrasHome(), ObraThumb(), WorkspaceTopbar(), CreateObraInput, CreateObraPayload (+5 more)

### Community 14 - "Alertas Screens + Service"
Cohesion: 0.14
Nodes (16): ScreenAlertas(), TAB_TO_LVL, AlertaItem, ALERTS, TABS, TONES, Loading(), AlertasData (+8 more)

### Community 15 - "Pedidos Screens + Service"
Cohesion: 0.22
Nodes (21): NewOrderModal(), Props, NewOrderQuickModal(), Props, ScreenPedidos(), fmtCurrency(), aprobarPedido(), authHeaders() (+13 more)

### Community 16 - "Message Routing Core"
Cohesion: 0.13
Nodes (19): initClient(), ayudaCommand, buildingsCommand, cancelCommand, Command, commands, getAllCommands(), getCommand() (+11 more)

### Community 17 - "Inbox Screens + Service"
Cohesion: 0.13
Nodes (14): KIND_ICON, KIND_LABEL, ScreenInbox(), Tab, INBOX_SEED, Loading(), getInbox(), InboxData (+6 more)

### Community 18 - "Nueva Obra Wizard Steps"
Cohesion: 0.23
Nodes (12): PickCard(), Step1(), TYPE_ICONS, Step2(), Step4(), Step5(), fmtMoney(), Step6() (+4 more)

### Community 19 - "Bot Poll + Obra Confirmation"
Cohesion: 0.21
Nodes (21): getClient(), clearEntityPending(), getEntityPending(), getPending(), setEntityPending(), setPending(), neededCatalogTipos(), resolveOperationEntities() (+13 more)

### Community 20 - "Landing Hero + Mockups"
Cohesion: 0.11
Nodes (6): DashboardMockup(), PhoneMockup(), PhoneMockupProps, LOGOS, Hero(), STAGES

### Community 21 - "Backend Bot Routes + Controller"
Cohesion: 0.19
Nodes (16): actualizarStock(), crearMaterialDesdeBot(), crearPedidoDeCompra(), getCatalogo(), mapMessageAccion(), mapMessageTipo(), recibirMensaje(), registrarRetraso() (+8 more)

### Community 22 - "Auth Nav + Sidebar (obrador)"
Cohesion: 0.14
Nodes (12): BaseItem, buildNavItems(), DashSidebar(), NavEntry, NavGroup, NavLink, WelcomeHero(), AvatarMenu() (+4 more)

### Community 23 - "Stock Screens + StockModal"
Cohesion: 0.22
Nodes (15): NewCategoryModal(), Props, ScreenStock(), Props, StockItemModal(), CAT_COLORS, CATEGORIES, getStatus() (+7 more)

### Community 24 - "Nueva Obra Modal Wizard"
Cohesion: 0.16
Nodes (16): INITIAL_DATA, NuevaObraModal(), validateStep(), Step3(), fmtMoney(), SuccessState(), DEFAULT_RUBROS, MORE_PEOPLE (+8 more)

### Community 25 - "Settings Permissions Mockup"
Cohesion: 0.10
Nodes (4): ALL_PERMS, DEFAULT_ROLES, PERM_GROUPS, SETTINGS_NAV

### Community 26 - "Actividad Screens + Service"
Cohesion: 0.18
Nodes (16): KIND_ELEM, renderBold(), ScreenActividad(), ACTIVITY_GROUPS, ActivityGroup, ActivityItem, ANSWERS_DB, KIND_ICONS (+8 more)

### Community 27 - "Dashboard Content + Categories"
Cohesion: 0.17
Nodes (15): CAT_COLORS, CategoryFormData, CategoryModal(), STATE_MAP, catProgress(), DashboardContent(), formatCurrency(), STATE_MAP (+7 more)

### Community 28 - "Equipo Screens + Service"
Cohesion: 0.19
Nodes (14): InviteTeamModal(), InviteTeamModalProps, ScreenEquipo(), Obrero, Person, ROLES, DPill(), MAP (+6 more)

### Community 29 - "Pending Store + Image/Vision"
Cohesion: 0.17
Nodes (17): formatComprobante(), formatFactura(), handleImage(), ApiCall, EntityPending, hasEntityPending(), pendingQueries, PendingQuery (+9 more)

### Community 30 - "Auth SignIn/SignUp Forms"
Cohesion: 0.15
Nodes (11): BrandPanel(), FakeMessageCard(), FakeMessageCardProps, tagStyles, SignInForm(), SignInFormProps, SignUpForm(), SignUpFormProps (+3 more)

### Community 31 - "Obras Home JSX Mockup"
Cohesion: 0.11
Nodes (5): FILES, OBRAS, STATUS, WORKSPACE_NAV, WORKSPACE_NAV_BOTTOM

### Community 32 - "Root tsconfig Compiler"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "API Service + Login Command"
Cohesion: 0.17
Nodes (15): loginCommand, apiRequest(), AUTH_HEADERS, callEndpoint(), CatalogoMaterial, CatalogoProveedor, CatalogoRubro, CatalogoTarea (+7 more)

### Community 35 - "DCard + KPI Cards"
Cohesion: 0.15
Nodes (10): CriticalAlertsCard(), Props, DELTA_COLORS, TONES, EmptyDashboardContent(), ProgressByTradeCards(), Props, DCard() (+2 more)

### Community 36 - "Order Drawer + Delivery"
Cohesion: 0.14
Nodes (14): DeliveryData, DeliveryModal(), Props, OrderDrawer(), Props, STATE, STEP_ICONS, STEP_LABELS (+6 more)

### Community 37 - "Dashboard Empty States"
Cohesion: 0.12
Nodes (3): EMPTY_SCREENS, obreroLink(), ObrerosInviter()

### Community 38 - "Plans Page Mockup"
Cohesion: 0.12
Nodes (5): ButtonStyles(), COMPARE_GROUPS, FAQ_ITEMS, PlanCard(), PLANS

### Community 39 - "Free Text / Voice Handlers"
Cohesion: 0.28
Nodes (10): handleFreeText(), handleTextMessage(), clearPending(), hasPending(), handleAudio(), groq, transcribeAudio(), MSG (+2 more)

### Community 40 - "Entity Resolution Service"
Cohesion: 0.17
Nodes (15): Catalogo, crearMaterial(), applyQuestionAnswer(), ARRAY_KEYS, ARRAY_ONLY_KEYS, catalogList(), ENDPOINT_CATALOG_KINDS, EntityKind (+7 more)

### Community 41 - "Endpoint Schema + LLM Service"
Cohesion: 0.16
Nodes (14): buildEndpointDescription(), EndpointParam, ENDPOINTS, EndpointSchema, getEndpointSchema(), getUserPhoneFields(), validateApiCall(), ValidationResult (+6 more)

### Community 42 - "Backend Alerts/Dashboard Routes"
Cohesion: 0.21
Nodes (10): crearAlerta(), getAlertas(), resolverAlerta(), verificarInactividad(), getDashboard(), router, router, router (+2 more)

### Community 43 - "Backend DB Pool + Usuarios"
Cohesion: 0.21
Nodes (8): crearReporte(), getReportes(), asignarObra(), crearUsuario(), getEquipo(), pool, router, router

### Community 44 - "Frontend Package Manifest"
Cohesion: 0.13
Nodes (14): @supabase/supabase-js, @types/node, typescript, name, private, version, eslint, eslint-config-next (+6 more)

### Community 45 - "Backend Dashboard Cards + Feed"
Cohesion: 0.20
Nodes (12): ActivityFeed(), Props, BudgetCard(), formatCurrency(), Props, ActivityFeedItem, BudgetItem, BudgetOverview (+4 more)

### Community 47 - "Frontend Dashboard Service"
Cohesion: 0.23
Nodes (10): Props, DashboardLoading(), DashboardPage(), formatDate(), formatRelativeTime(), formatTime(), getDashboard(), TRADE_COLORS (+2 more)

### Community 48 - "i18n Translation Engine"
Cohesion: 0.30
Nodes (13): ATTR_ORIGINALS, I18N_DICT, I18N_REGEX, restoreOriginals(), setLanguage(), shouldSkipElement(), startObserver(), stopObserver() (+5 more)

### Community 49 - "Under Construction Landing"
Cohesion: 0.21
Nodes (6): BrandLogo(), BrandLogoProps, ConstructionIllustration(), NotifyForm(), UnderConstructionPage(), UnderConstructionPageProps

### Community 50 - "Landing Problems/Benefits"
Cohesion: 0.21
Nodes (7): BENEFICIOS_ITEMS, BENEFICIOS_STATS, PROBLEMA_ITEMS, PROBLEMA_STATS, benefitIconMap, iconMap, Problema()

### Community 51 - "Landing Features + CTA"
Cohesion: 0.18
Nodes (8): FEATURES, TONE_MAP, Beneficios(), ChatbotSection(), CTA(), featureIconMap, Funcionalidades(), HowItWorks()

### Community 53 - "WhatsApp-Bot tsconfig"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir, rootDir, skipLibCheck (+4 more)

### Community 54 - "Backend Auth Middleware"
Cohesion: 0.29
Nodes (8): getMe(), login(), logout(), register(), authMiddleware(), router, supabase, supabaseAdmin

### Community 55 - "Backend Tareas + Bot Completar"
Cohesion: 0.32
Nodes (10): actualizarTarea(), completarTarea(), completarTareaDesdeBot(), crearTarea(), crearTareaDesdeBot(), ESTADOS_VALIDOS, getTareas(), PRIORIDADES_VALIDAS (+2 more)

### Community 56 - "Notificaciones Screens"
Cohesion: 0.29
Nodes (8): NOTIF_SEED, NotifItem, NotifKind, KIND_ICON, KIND_TINT, NotificationsPanel(), getNotificaciones(), NotificacionesData

### Community 57 - "Frontend Dashboard API Types"
Cohesion: 0.17
Nodes (11): ApiActivityFeedItem, ApiAlertItem, ApiBudgetItem, ApiBudgetOverview, ApiDashboardResponse, ApiDashboardStats, ApiObraInfo, ApiOrderItem (+3 more)

### Community 58 - "Backend Obras Controller"
Cohesion: 0.42
Nodes (8): buildObra(), crearObra(), deleteObra(), getObra(), getObras(), toggleStarred(), updateObra(), router

### Community 59 - "Frontend UI Dependencies"
Cohesion: 0.20
Nodes (10): dependencies, framer-motion, @gravity-ui/icons, @heroui/react, @heroui/styles, next, qrcode.react, react (+2 more)

### Community 60 - "Workspace Sidebar"
Cohesion: 0.20
Nodes (5): NAV_BOTTOM, NAV_ITEMS, SidebarTheme, THEMES, WorkspaceSidebar()

### Community 61 - "Frontend Auth Context"
Cohesion: 0.33
Nodes (6): AuthContext, AuthContextType, AuthProvider(), supabase, getProfile(), registerUser()

### Community 62 - "Database Schema Docs"
Cohesion: 0.36
Nodes (10): alertas table (stock bajo, tarea vencida), Database schema (obras construction), gastos table, materiales table (stock mínimo), mensajes table (texto, audio, imagen), obras table, reportes table (diario, semanal, mensual), subtareas table (boolean completada) (+2 more)

### Community 63 - "Turbo Pipeline Config"
Cohesion: 0.20
Nodes (9): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+1 more)

### Community 64 - "Brand Assets + Palette"
Cohesion: 0.25
Nodes (9): Frontend App (Next.js), BuildData Logo Mark (SVG), Ascending Bars Motif, BuildData Brand Identity Asset, Color Palette (Blue #0F4395, White, Amber #F59E0B), Frontend assets patterns directory, blueprint.svg (blueprint background pattern), Next.js Logo (next.svg) (+1 more)

### Community 65 - "Frontend App Layout + Auth"
Cohesion: 0.25
Nodes (5): nextConfig, AuthWrapper(), ManropeFont, metadata, next

### Community 66 - "Frontend Dev Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 67 - "Landing LiveBot Chat"
Cohesion: 0.28
Nodes (6): LiveBot(), Message, QuickReply, Scenario, SCENARIOS, framer-motion

### Community 68 - "Dashboard Data Context"
Cohesion: 0.28
Nodes (8): Props, ContextValue, DashboardDataContext, DashboardDataProvider(), LookupData, noop(), RubroInfo, TaskItem

### Community 69 - "SideBar Components"
Cohesion: 0.31
Nodes (4): SideBarBuildName(), SideBarButton(), SideBarSeccion(), SideBarSeccionProps

### Community 70 - "Button Variants"
Cohesion: 0.28
Nodes (8): BtnSize, BtnVariant, ButtonAsButton, ButtonAsLink, ButtonBase, ButtonProps, SIZE_STYLES, VARIANT_STYLES

### Community 71 - "Backend Obreros Controller"
Cohesion: 0.36
Nodes (6): asignarObraObrero(), getObreros(), getUserByPhone(), quitarObreroDeObra(), registrarObrero(), router

### Community 72 - "Backend Pedidos Controller"
Cohesion: 0.43
Nodes (6): aprobarPedido(), crearPedidoWeb(), getPedidos(), rechazarPedido(), resolverProveedor(), router

### Community 73 - "Backend Rubros Controller"
Cohesion: 0.50
Nodes (6): crearRubro(), deleteRubro(), formatRubro(), getRubros(), updateRubro(), router

### Community 74 - "Landing Dashboard Section"
Cohesion: 0.25
Nodes (4): LiveDashboard(), DASHBOARD_CALLOUTS, DashboardSection(), iconMap

### Community 75 - "Materiales View + Loading"
Cohesion: 0.32
Nodes (3): MaterialesView(), TABS, Loading()

### Community 76 - "Frontend Projects API Types"
Cohesion: 0.25
Nodes (7): ApiFileItem, ApiFilesResponse, ApiObra, ApiObrasResponse, ApiTeamMember, ApiToggleStarredRequest, ApiToggleStarredResponse

### Community 78 - "Dashboard Screens Store Hooks"
Cohesion: 0.29
Nodes (7): catProgress(), ScreenActivity(), ScreenAlerts(), ScreenDashboard(), useActivityStore(), useAlertStore(), useToast()

### Community 79 - "Task/Rubro Stores + Modal"
Cohesion: 0.29
Nodes (7): DashTareasComplete(), NewOrderModal(), ScreenGallery(), ScreenGantt(), ScreenRubros(), useRubroStore(), useTaskStore()

### Community 80 - "Nueva Tarea Modal + Gantt Views"
Cohesion: 0.43
Nodes (7): fmtDate(), fmtDateLong(), GanttView(), ListView(), NuevaTareaModal(), TaskDetail(), weekDate()

### Community 81 - "Backend Actividad Controller"
Cohesion: 0.53
Nodes (4): crearActividad(), getActividad(), mapAccion(), router

### Community 82 - "Backend Materiales Controller"
Cohesion: 0.53
Nodes (4): actualizarMaterial(), crearMaterial(), getMateriales(), router

### Community 83 - "Backend Presupuestos Controller"
Cohesion: 0.53
Nodes (4): actualizarPresupuesto(), crearPresupuesto(), getPresupuestos(), router

### Community 84 - "Backend Proveedores Controller"
Cohesion: 0.53
Nodes (4): crearProveedor(), getProveedores(), vincularProveedor(), router

### Community 85 - "Logo On-Dark Brand Assets"
Cohesion: 0.40
Nodes (6): Amber accent #F59E0B (top segment of tallest bar), Ascending bar chart glyph (three white rounded rectangles), BuildData on-dark brand identity (construction data brand), logo-buildata-onDark.svg (BuildData logo for dark backgrounds), Manrope typeface (brand font, extrabold 800), BuildData wordmark (Manrope 800, white, size 26)

### Community 88 - "Package Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 91 - "Profile Page Mockup"
Cohesion: 0.40
Nodes (3): PROFILE_ACTIVITY, PROFILE_PEOPLE, PROFILE_PERMS

### Community 92 - "Mongo Session Store"
Cohesion: 0.67
Nodes (4): mongoStore (session zips in .wwebjs_auth/), mongoStore (custom RemoteAuth store), RemoteAuth (backupSyncIntervalMs 300000), Session persistence via RemoteAuth + MongoDB

### Community 93 - "BuildData Logo Branding"
Cohesion: 0.67
Nodes (4): logo-buildata.svg (SVG brand logo asset), BuildData brand identity, BuildData wordmark (Manrope font text), Bars mark (3 ascending navy bars w/ orange tip)

### Community 95 - "Backend Auth Middlewares"
Cohesion: 0.67
Nodes (3): authMiddleware (JWT Supabase auth.getUser), Backend /bot/* routes (REST API), botAuthMiddleware (service role key direct)

## Ambiguous Edges - Review These
- `BuildData platform (WhatsApp bot + REST API + Frontend)` → `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `message.handler routing` → `confirmCommand (!confirm → SQL ejecutada)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **453 isolated node(s):** `$schema`, `plugin`, `ESTADOS_VALIDOS`, `PRIORIDADES_VALIDAS`, `app` (+448 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 753 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `BuildData platform (WhatsApp bot + REST API + Frontend)` and `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `message.handler routing` and `confirmCommand (!confirm → SQL ejecutada)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `Dashboard Shell + QuickAdd` to `Cronograma Screens`, `Recibos/Reportes/Galería Screens`, `Configuración + DPageHeader`, `Landing Pricing Section`, `Presupuesto/Perfil Screens`, `Obras Home + Projects`, `Alertas Screens + Service`, `Pedidos Screens + Service`, `Inbox Screens + Service`, `Nueva Obra Wizard Steps`, `Landing Hero + Mockups`, `Auth Nav + Sidebar (obrador)`, `Stock Screens + StockModal`, `Nueva Obra Modal Wizard`, `Actividad Screens + Service`, `Dashboard Content + Categories`, `Equipo Screens + Service`, `Auth SignIn/SignUp Forms`, `LiveDashboard Sidebar Shell`, `DCard + KPI Cards`, `Order Drawer + Delivery`, `Frontend Package Manifest`, `Frontend Dashboard Service`, `Under Construction Landing`, `Notificaciones Screens`, `Frontend Auth Context`, `Frontend App Layout + Auth`, `Landing LiveBot Chat`, `Dashboard Data Context`, `Button Variants`, `Materiales View + Loading`, `Equipo Page Loading`, `Search Bar Component`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `@gravity-ui/icons` connect `Stock Screens + StockModal` to `Cronograma Screens`, `Recibos/Reportes/Galería Screens`, `Configuración + DPageHeader`, `Landing Pricing Section`, `Presupuesto/Perfil Screens`, `Dashboard Shell + QuickAdd`, `Obras Home + Projects`, `Alertas Screens + Service`, `Pedidos Screens + Service`, `Inbox Screens + Service`, `Nueva Obra Wizard Steps`, `Landing Hero + Mockups`, `Auth Nav + Sidebar (obrador)`, `Nueva Obra Modal Wizard`, `Actividad Screens + Service`, `Dashboard Content + Categories`, `Equipo Screens + Service`, `Auth SignIn/SignUp Forms`, `LiveDashboard Sidebar Shell`, `DCard + KPI Cards`, `Order Drawer + Delivery`, `Frontend Package Manifest`, `Backend Dashboard Cards + Feed`, `Landing Problems/Benefits`, `Landing Features + CTA`, `Notificaciones Screens`, `Workspace Sidebar`, `Landing LiveBot Chat`, `SideBar Components`, `Landing Dashboard Section`, `Materiales View + Loading`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Frontend UI Dependencies` to `Frontend Package Manifest`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `ESTADOS_VALIDOS` to the rest of the system?**
  _453 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Store + Mock Seeds` be split into smaller, more focused modules?**
  _Cohesion score 0.024390243902439025 - nodes in this community are weakly interconnected._