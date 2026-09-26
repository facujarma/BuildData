# Graph Report - BuildData  (2026-09-23)

## Corpus Check
- 353 files · ~212,837 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .lock 2, .ico 1)

## Summary
- 2028 nodes · 4373 edges · 112 communities (82 shown, 30 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f292b8f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- live-dashboard.jsx
- ScreenProveedores.tsx
- ScreenStock.tsx
- ScreenConfiguracion.tsx
- message.handler routing
- Frontend redesign plan (dashboard + grouped sidebar)
- DPill.tsx
- package.json
- ScreenPresupuesto.tsx
- pedidosService.ts
- @gravity-ui/icons
- nueva-obra.jsx
- WhatsApp-Bot/package.json
- ObrasHome.tsx
- sqlGuard.service.js
- ScreenPedidos.tsx
- message.handler.ts
- next
- NuevaObraModal.tsx
- payments/page.tsx
- HowItWorks.tsx
- bot.js
- ScreenActividad.tsx
- QuickAddModal.tsx
- proveedoresController.js
- settings-page.jsx
- ScreenAlertas.tsx
- DashTopBar.tsx
- actionExecuted.service.ts
- vision.service.ts
- ScreenInbox.tsx
- obras-home.jsx
- compilerOptions
- entityResolution.service.ts
- LiveDashboard.tsx
- api.service.ts
- ScreenRecibos.tsx
- dashboard-empty.jsx
- planes-page.jsx
- format.ts
- pendingQuery.store.ts
- endpointSchema.ts
- server.js
- pollConfirmation.service.ts
- Frontend/package.json
- dashboard/_components/index.ts
- tweaks-panel.jsx
- DAvatar.tsx
- i18n.jsx
- react
- SupplierModal.tsx
- client.ts
- compilerOptions
- db.js
- AuthContext.tsx
- NotificationsPanel.tsx
- DashSidebar.tsx
- obrasController.js
- CompareTable.tsx
- Button.tsx
- dashboard.api.ts
- Database schema (obras construction)
- tasks
- Frontend App (Next.js)
- dashboardService.ts
- obrerosController.js
- usuarios.js
- taskPct
- ScreenPerfil.tsx
- ProjectsSkeleton.tsx
- ObraWelcome.tsx
- entitySearch.service.js
- UnderConstructionPage.tsx
- Pricing.tsx
- dashboard/layout.tsx
- howitworks.jsx
- ScreenDashboard
- useStore
- TaskDetail
- MaterialesView.tsx
- materialesController.js
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
- 3-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/services/pollConfirmation.service.ts -> apps/WhatsApp-Bot/src/client.ts`
- 4-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/freetext.handler.ts -> apps/WhatsApp-Bot/src/handlers/clarification.handler.ts -> apps/WhatsApp-Bot/src/client.ts`
- 4-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/freetext.handler.ts -> apps/WhatsApp-Bot/src/services/pollConfirmation.service.ts -> apps/WhatsApp-Bot/src/client.ts`
- 4-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/image.handler.ts -> apps/WhatsApp-Bot/src/services/pollConfirmation.service.ts -> apps/WhatsApp-Bot/src/client.ts`
- 5-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/voice.handler.ts -> apps/WhatsApp-Bot/src/handlers/freetext.handler.ts -> apps/WhatsApp-Bot/src/handlers/clarification.handler.ts -> apps/WhatsApp-Bot/src/client.ts`
- 5-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/freetext.handler.ts -> apps/WhatsApp-Bot/src/handlers/clarification.handler.ts -> apps/WhatsApp-Bot/src/services/pollConfirmation.service.ts -> apps/WhatsApp-Bot/src/client.ts`
- 5-file cycle: `apps/WhatsApp-Bot/src/client.ts -> apps/WhatsApp-Bot/src/handlers/message.handler.ts -> apps/WhatsApp-Bot/src/handlers/voice.handler.ts -> apps/WhatsApp-Bot/src/handlers/freetext.handler.ts -> apps/WhatsApp-Bot/src/services/pollConfirmation.service.ts -> apps/WhatsApp-Bot/src/client.ts`

## Hyperedges (group relationships)
- **WhatsApp message routing + LLM operation execution flow** — agents_message_handler, agents_freetext_handler, agents_voice_handler, agents_image_handler, agents_texttooperation, agents_pendingquery_store, agents_executepending [EXTRACTED 1.00]
- **Mock services following the stockService seed+delay+clone pattern** — apps_frontend_tmp_temp_stockservice, apps_frontend_tmp_temp_inbox_service, apps_frontend_tmp_temp_galeria_service, apps_frontend_tmp_temp_notificaciones_service, apps_frontend_tmp_temp_configuracion_service, apps_frontend_tmp_temp_perfil_service, apps_frontend_tmp_temp_rubros_service [INFERRED 0.85]
- **Grouped navigation redesign (8 items, ?v= sub-tabs, legacy redirects)** — apps_frontend_tmp_temp_grouped_nav, apps_frontend_tmp_temp_grouptabs, apps_frontend_tmp_temp_dashsidebar, apps_frontend_tmp_temp_searchparams_v, apps_frontend_tmp_temp_redirects [INFERRED 0.85]

## Communities (112 total, 30 thin omitted)

### Community 0 - "live-dashboard.jsx"
Cohesion: 0.02
Nodes (53): ACT_LISTENERS, ACTIVITY_SEED, ActivityStore, ALERT_LISTENERS, ALERTS_SEED, AlertStore, BUDGET, CAT_COLORS (+45 more)

### Community 1 - "ScreenProveedores.tsx"
Cohesion: 0.31
Nodes (15): SupplierData, ScreenProveedores(), supInitials(), authHeaders(), createProveedor(), deleteProveedor(), getProveedores(), mapRawToProveedor() (+7 more)

### Community 2 - "ScreenStock.tsx"
Cohesion: 0.17
Nodes (26): QuickAddMaterial(), NewCategoryModal(), Props, ScreenStock(), Props, StockItemModal(), CAT_PALETTE, catColor() (+18 more)

### Community 3 - "ScreenConfiguracion.tsx"
Cohesion: 0.07
Nodes (26): ObraDefaults, ScreenConfiguracion(), SecPlan(), ConfiguracionPlan, INTEGRACIONES_SEED, IntegracionItem, OBRA_SETTINGS, ObraEstado (+18 more)

### Community 4 - "message.handler routing"
Cohesion: 0.05
Nodes (52): api.service, /bot/pedidoDeCompra endpoint, /bot/retraso endpoint (updates rubros table), /bot/tareas endpoint (crear, rubro_id opcional), PATCH /bot/tareas/:id/completar, buildEndpointDescription(), callEndpoint() (fetch to API_URL, service role key), Per-obra entity catalog (GET /bot/catalogo) (+44 more)

### Community 5 - "Frontend redesign plan (dashboard + grouped sidebar)"
Cohesion: 0.06
Nodes (47): BuildData platform (WhatsApp bot + REST API + Frontend), Blueprint background motif (AI insight banner), ChatBubble (loaded-state AI chatbot), dashboard-empty.jsx (onboarding empty state), DashboardPage (root, tweakable state), Empty (onboarding) vs loaded dashboard states, i18n es/en language switching, LiveDashboard (loaded/empty screens) (+39 more)

### Community 6 - "DPill.tsx"
Cohesion: 0.11
Nodes (15): CriticalAlertsCard(), Props, DELTA_COLORS, TONES, EmptyDashboardContent(), Props, sortKey(), STATE_MAP (+7 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): dependencies, cors, dotenv, express, groq-sdk, multer, pg, @supabase/supabase-js (+29 more)

### Community 8 - "ScreenPresupuesto.tsx"
Cohesion: 0.11
Nodes (24): CostosView(), TABS, Loading(), BudgetAuditEntry, BudgetEditModal(), DraftLine, Props, Donut() (+16 more)

### Community 9 - "pedidosService.ts"
Cohesion: 0.26
Nodes (17): ScreenPedidos(), aprobarPedido(), authHeaders(), cambiarEstadoPedido(), createPedido(), EntregaPayload, entregarPedido(), ESTADO_DB_UI (+9 more)

### Community 10 - "@gravity-ui/icons"
Cohesion: 0.10
Nodes (21): LiveBot(), Message, QuickReply, Scenario, SCENARIOS, BENEFICIOS_ITEMS, BENEFICIOS_STATS, FEATURES (+13 more)

### Community 11 - "nueva-obra.jsx"
Cohesion: 0.10
Nodes (20): allPerm(), DEFAULT_RUBROS, fmtMoney(), initialsFromName(), isEmail(), makeRoles(), makeRubros(), MORE_PEOPLE (+12 more)

### Community 12 - "WhatsApp-Bot/package.json"
Cohesion: 0.07
Nodes (29): dependencies, axios, dotenv, express, groq-sdk, mongoose, qrcode-terminal, whatsapp-web.js (+21 more)

### Community 13 - "ObrasHome.tsx"
Cohesion: 0.14
Nodes (11): ObraCard(), ObraRow(), FILTERS, ObrasHome(), ObraThumb(), CreateObraInput, CreateObraPayload, getObras() (+3 more)

### Community 14 - "sqlGuard.service.js"
Cohesion: 0.09
Nodes (39): auditar(), consultar(), completarJSON(), getCliente(), MODELO_DEFAULT, construirSystemPrompt(), narrar(), recortar() (+31 more)

### Community 15 - "ScreenPedidos.tsx"
Cohesion: 0.17
Nodes (18): DeliveryData, DeliveryModal(), Props, MaterialOption, NewOrderModal(), Props, RubroOption, OrderDrawer() (+10 more)

### Community 16 - "message.handler.ts"
Cohesion: 0.19
Nodes (25): cancelCommand, getCommand(), handleFreeText(), formatComprobante(), formatFactura(), handleImage(), getPhoneNumber(), handleMessage() (+17 more)

### Community 18 - "NuevaObraModal.tsx"
Cohesion: 0.11
Nodes (26): INITIAL_DATA, NuevaObraModal(), validateStep(), PickCard(), Step1(), TYPE_ICONS, Step2(), Step3() (+18 more)

### Community 19 - "payments/page.tsx"
Cohesion: 0.16
Nodes (7): CTA(), Hero(), Stats(), Footer(), Navbar(), NavbarProps, LogoIcon()

### Community 20 - "HowItWorks.tsx"
Cohesion: 0.11
Nodes (7): DashboardMockup(), PhoneMockup(), PhoneMockupProps, LOGOS, Hero(), HowItWorks(), STAGES

### Community 21 - "bot.js"
Cohesion: 0.11
Nodes (29): actualizarAccionesMensaje(), actualizarStock(), crearPedidoDeCompra(), ESTADOS_PROCESAMIENTO, recibirMensaje(), registrarRetraso(), TIPOS_STOCK, crearGasto() (+21 more)

### Community 22 - "ScreenActividad.tsx"
Cohesion: 0.08
Nodes (32): KIND_ELEM, renderBold(), ScreenActividad(), ActivityGroup, ActivityItem, ANSWERS_DB, KIND_ICONS, SUGGESTED_QUESTIONS (+24 more)

### Community 23 - "QuickAddModal.tsx"
Cohesion: 0.19
Nodes (12): useDashboardData(), FieldDef, FormConfig, Props, QUICK_FORMS, QuickAddGeneric(), QuickAddPedido(), QuickAddProveedor() (+4 more)

### Community 24 - "proveedoresController.js"
Cohesion: 0.38
Nodes (14): actualizarProveedor(), buscarProveedor(), crearProveedor(), eliminarProveedor(), esViolacionCheck(), esViolacionUnica(), getProveedores(), marcarFavorito() (+6 more)

### Community 25 - "settings-page.jsx"
Cohesion: 0.10
Nodes (4): ALL_PERMS, DEFAULT_ROLES, PERM_GROUPS, SETTINGS_NAV

### Community 26 - "ScreenAlertas.tsx"
Cohesion: 0.13
Nodes (22): AlertaDrawer(), ScreenAlertas(), TabDef, TabId, TABS, AlertaItem, AlertaLvl, AlertaState (+14 more)

### Community 27 - "DashTopBar.tsx"
Cohesion: 0.18
Nodes (9): CRUMB_MAP, DashTopBar(), SUB_MAP, Props, QUICK_ADD_GROUPS, QuickAddItem, QuickAddMenu(), WorkspaceTopbar() (+1 more)

### Community 28 - "actionExecuted.service.ts"
Cohesion: 0.15
Nodes (24): ACTION_META, ActionExecuted, ActionMeta, ActionOutcome, add(), arrayOf(), asRecord(), buildActionExecuted() (+16 more)

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
Cohesion: 0.15
Nodes (18): displayPath(), CandidatoBusqueda, EntidadCandidata, EntidadResuelta, mapearResultadoBusqueda(), ResultadoBusquedaEntidades, applyQuestionAnswer(), ARRAY_KEYS (+10 more)

### Community 34 - "LiveDashboard.tsx"
Cohesion: 0.08
Nodes (5): LiveDashboard(), SCREENS, DASHBOARD_CALLOUTS, DashboardSection(), iconMap

### Community 35 - "api.service.ts"
Cohesion: 0.14
Nodes (19): ayudaCommand, buildingsCommand, Command, commands, getAllCommands(), registerCommand(), loginCommand, actualizarMensajeAcciones() (+11 more)

### Community 36 - "ScreenRecibos.tsx"
Cohesion: 0.09
Nodes (26): DPageHeader(), DashToast(), useToast(), InviteTeamModal(), InviteTeamModalProps, ScreenEquipo(), Obrero, Person (+18 more)

### Community 37 - "dashboard-empty.jsx"
Cohesion: 0.12
Nodes (3): EMPTY_SCREENS, obreroLink(), ObrerosInviter()

### Community 38 - "planes-page.jsx"
Cohesion: 0.12
Nodes (5): ButtonStyles(), COMPARE_GROUPS, FAQ_ITEMS, PlanCard(), PLANS

### Community 39 - "format.ts"
Cohesion: 0.07
Nodes (69): Props, UploadPhotosModal(), buildGrid(), CalendarView(), DAY_HEADERS, DayInfo, Props, WEEKENDS (+61 more)

### Community 40 - "pendingQuery.store.ts"
Cohesion: 0.16
Nodes (21): ask(), buildContenido(), concludeTurn(), handleClarificationReply(), recalcMissing(), tryDeterministicAnswer(), Clarification, clarifications (+13 more)

### Community 41 - "endpointSchema.ts"
Cohesion: 0.13
Nodes (23): ApiCall, buildEndpointDescription(), buildEndpointIndex(), collectMissingFields(), describeEndpoint(), elementLabel(), EndpointParam, ENDPOINTS (+15 more)

### Community 42 - "server.js"
Cohesion: 0.08
Nodes (29): crearActividad(), getActividad(), mapAccion(), crearAlerta(), getAlertas(), resolverAlerta(), verificarInactividad(), consultarChat() (+21 more)

### Community 43 - "pollConfirmation.service.ts"
Cohesion: 0.23
Nodes (18): getClient(), getEntityPending(), getPending(), setEntityPending(), setPending(), interpolatePathParams(), entityKindLabel(), entityKindPlural() (+10 more)

### Community 44 - "Frontend/package.json"
Cohesion: 0.05
Nodes (41): eslintConfig, dependencies, framer-motion, @gravity-ui/icons, @heroui/react, @heroui/styles, next, qrcode.react (+33 more)

### Community 45 - "dashboard/_components/index.ts"
Cohesion: 0.09
Nodes (36): ActivityFeed(), Props, BudgetCard(), Props, CAT_COLORS, CategoryFormData, CategoryModal(), Props (+28 more)

### Community 47 - "DAvatar.tsx"
Cohesion: 0.16
Nodes (8): NAV_BOTTOM, NAV_ITEMS, SidebarTheme, THEMES, WorkspaceSidebar(), DAvatar(), getInitials(), PALETTE

### Community 48 - "i18n.jsx"
Cohesion: 0.30
Nodes (13): ATTR_ORIGINALS, I18N_DICT, I18N_REGEX, restoreOriginals(), setLanguage(), shouldSkipElement(), startObserver(), stopObserver() (+5 more)

### Community 49 - "react"
Cohesion: 0.17
Nodes (13): BrandPanel(), FakeMessageCard(), FakeMessageCardProps, tagStyles, SignInForm(), SignInFormProps, SignUpForm(), SignUpFormProps (+5 more)

### Community 50 - "SupplierModal.tsx"
Cohesion: 0.22
Nodes (6): Props, SupplierModal(), FLAG_SVG, PHONE_COUNTRIES, PhoneInput(), Props

### Community 51 - "client.ts"
Cohesion: 0.22
Nodes (10): initClient(), mongoStore, Session, sessionSchema, applyWhatsappPatches(), backfillSerializedId(), describeError(), RawMessageId (+2 more)

### Community 53 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir, rootDir, skipLibCheck (+4 more)

### Community 54 - "db.js"
Cohesion: 0.10
Nodes (18): getMe(), login(), logout(), register(), authMiddleware(), router, args, __dirname (+10 more)

### Community 55 - "AuthContext.tsx"
Cohesion: 0.21
Nodes (9): AuthWrapper(), apps_frontend_src_app_globals, ManropeFont, metadata, AuthContext, AuthContextType, AuthProvider(), getProfile() (+1 more)

### Community 56 - "NotificationsPanel.tsx"
Cohesion: 0.29
Nodes (8): NOTIF_SEED, NotifItem, NotifKind, KIND_ICON, KIND_TINT, NotificationsPanel(), getNotificaciones(), NotificacionesData

### Community 57 - "DashSidebar.tsx"
Cohesion: 0.25
Nodes (6): BaseItem, buildNavItems(), DashSidebar(), NavEntry, NavGroup, NavLink

### Community 58 - "obrasController.js"
Cohesion: 0.42
Nodes (8): buildObra(), crearObra(), deleteObra(), getObra(), getObras(), toggleStarred(), updateObra(), router

### Community 59 - "CompareTable.tsx"
Cohesion: 0.28
Nodes (7): CellValue, CompareCategory, CompareTable(), CompareTableProps, renderCell(), comparisonCategories, Comparison()

### Community 60 - "Button.tsx"
Cohesion: 0.28
Nodes (8): BtnSize, BtnVariant, ButtonAsButton, ButtonAsLink, ButtonBase, ButtonProps, SIZE_STYLES, VARIANT_STYLES

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

### Community 65 - "dashboardService.ts"
Cohesion: 0.23
Nodes (9): Props, DashboardLoading(), DashboardPage(), formatRelative(), getDashboard(), TRADE_COLORS, transformDashboard(), DashboardData (+1 more)

### Community 66 - "obrerosController.js"
Cohesion: 0.36
Nodes (6): asignarObraObrero(), getObreros(), getUserByPhone(), quitarObreroDeObra(), registrarObrero(), router

### Community 67 - "usuarios.js"
Cohesion: 0.53
Nodes (4): asignarObra(), crearUsuario(), getEquipo(), router

### Community 68 - "taskPct"
Cohesion: 0.38
Nodes (7): ALL_TASKS, DashTareasComplete(), recomputeDerived(), ScreenGantt(), taskPct(), UploadPhotosModal(), useTaskStore()

### Community 69 - "ScreenPerfil.tsx"
Cohesion: 0.19
Nodes (8): ACT_ICON, ScreenPerfil(), PERFIL_SEED, PerfilActividad, PerfilData, PerfilPermiso, Loading(), getPerfil()

### Community 72 - "entitySearch.service.js"
Cohesion: 0.16
Nodes (25): buscarEntidad(), crearRubro(), deleteRubro(), formatRubro(), getRubros(), updateRubro(), router, aVectorLiteral() (+17 more)

### Community 73 - "UnderConstructionPage.tsx"
Cohesion: 0.16
Nodes (7): ProtectedRoute(), BrandLogo(), BrandLogoProps, ConstructionIllustration(), NotifyForm(), UnderConstructionPage(), UnderConstructionPageProps

### Community 75 - "Pricing.tsx"
Cohesion: 0.15
Nodes (12): FAQ(), FAQItemData, FAQProps, Feature, PricingCard(), PricingCardProps, PricingToggle(), faqItems (+4 more)

### Community 76 - "dashboard/layout.tsx"
Cohesion: 0.16
Nodes (11): ChatBubble(), ChatBubbleProps, SUGGESTED, QuickAddModal(), LayoutInner(), supabase, consultarChat(), getObra() (+3 more)

### Community 78 - "ScreenDashboard"
Cohesion: 0.25
Nodes (8): catProgress(), LiveDashboard(), ScreenActivity(), ScreenAlerts(), ScreenDashboard(), useActivityStore(), useAlertStore(), useToast()

### Community 79 - "useStore"
Cohesion: 0.20
Nodes (11): applyInboxItem(), ScreenGallery(), ScreenInbox(), ScreenMaterials(), ScreenReceipts(), ScreenRubros(), ScreenStock(), ScreenSuppliers() (+3 more)

### Community 80 - "TaskDetail"
Cohesion: 0.24
Nodes (13): CalendarView(), fmtDate(), fmtDateLong(), GanttView(), ListView(), NuevaTareaModal(), TaskDetail(), taskFrom() (+5 more)

### Community 81 - "MaterialesView.tsx"
Cohesion: 0.24
Nodes (5): GroupTab, GroupTabs(), MaterialesView(), TABS, Loading()

### Community 82 - "materialesController.js"
Cohesion: 0.17
Nodes (29): actualizarMaterial(), ajustarStock(), asegurarCategoria(), crearCategoria(), crearMaterial(), eliminarMaterial(), EXT_POR_MIME, getCategorias() (+21 more)

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
- **467 isolated node(s):** `$schema`, `plugin`, `ESTADOS_PROCESAMIENTO`, `TIPOS_STOCK`, `EXT_POR_MIME` (+462 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 759 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `message.handler routing` and `confirmCommand (!confirm → SQL ejecutada)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `BuildData platform (WhatsApp bot + REST API + Frontend)` and `Technology stack (Turborepo+Bun, Groq, MongoDB, Express, Next.js)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `react` to `ScreenProveedores.tsx`, `ScreenStock.tsx`, `ScreenConfiguracion.tsx`, `DPill.tsx`, `ScreenPresupuesto.tsx`, `@gravity-ui/icons`, `ObrasHome.tsx`, `ScreenPedidos.tsx`, `NuevaObraModal.tsx`, `HowItWorks.tsx`, `ScreenActividad.tsx`, `QuickAddModal.tsx`, `ScreenAlertas.tsx`, `DashTopBar.tsx`, `ScreenInbox.tsx`, `LiveDashboard.tsx`, `ScreenRecibos.tsx`, `format.ts`, `Frontend/package.json`, `dashboard/_components/index.ts`, `SupplierModal.tsx`, `AuthContext.tsx`, `NotificationsPanel.tsx`, `DashSidebar.tsx`, `Button.tsx`, `dashboardService.ts`, `ScreenPerfil.tsx`, `UnderConstructionPage.tsx`, `Pricing.tsx`, `dashboard/layout.tsx`, `MaterialesView.tsx`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `@gravity-ui/icons` connect `@gravity-ui/icons` to `ScreenProveedores.tsx`, `ScreenStock.tsx`, `ScreenConfiguracion.tsx`, `DPill.tsx`, `ScreenPresupuesto.tsx`, `ObrasHome.tsx`, `ScreenPedidos.tsx`, `NuevaObraModal.tsx`, `payments/page.tsx`, `HowItWorks.tsx`, `ScreenActividad.tsx`, `QuickAddModal.tsx`, `ScreenAlertas.tsx`, `DashTopBar.tsx`, `ScreenInbox.tsx`, `LiveDashboard.tsx`, `ScreenRecibos.tsx`, `format.ts`, `Frontend/package.json`, `dashboard/_components/index.ts`, `DAvatar.tsx`, `react`, `SupplierModal.tsx`, `NotificationsPanel.tsx`, `DashSidebar.tsx`, `CompareTable.tsx`, `ScreenPerfil.tsx`, `Pricing.tsx`, `dashboard/layout.tsx`, `MaterialesView.tsx`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `pool` connect `server.js` to `obrerosController.js`, `usuarios.js`, `entitySearch.service.js`, `sqlGuard.service.js`, `materialesController.js`, `bot.js`, `db.js`, `proveedoresController.js`, `obrasController.js`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `ESTADOS_PROCESAMIENTO` to the rest of the system?**
  _467 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `live-dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.02247191011235955 - nodes in this community are weakly interconnected._