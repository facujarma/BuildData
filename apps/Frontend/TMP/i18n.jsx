// Lightweight i18n for BuildData. Walks the rendered DOM and swaps Spanish
// text nodes for English using a dictionary + regex rules. A MutationObserver
// keeps translations in sync across React re-renders.
//
// Two-way:
//   setLanguage('en') → translates ES→EN, remembers originals
//   setLanguage('es') → restores originals from memory + cancels observer
//
// Tries (in order): exact dict match → regex rules → leave untouched.
// Also translates placeholder/aria-label/title attributes.

const I18N_DICT = {
  // Sidebar (workspace + dashboard)
  'Obra activa':                    'Active project',
  'Edificio Belgrano':              'Belgrano Building',
  'Mi primera obra':                'My first project',
  'Configuración pendiente':        'Setup pending',
  'Dashboard':                      'Dashboard',
  'Cronograma':                     'Schedule',
  'Alertas':                        'Alerts',
  'Pedidos':                        'Orders',
  'Reportes':                       'Reports',
  'Presupuesto':                    'Budget',
  'Actividad':                      'Activity',
  'Actividad de la obra':           'Project activity',
  'Reporte de obra':                'Project report',
  'Generar reporte':                'Generate report',
  'Generar y descargar':            'Generate & download',
  'Secciones a incluir':            'Sections to include',
  'Período':                        'Period',
  'Equipo':                         'Team',
  'Configuración':                  'Settings',
  'Ayuda y soporte':                'Help & support',
  'J. Méndez':                      'J. Méndez',
  'Director de obra':               'Project director',
  'Administrador':                  'Administrator',
  'Vos':                            'You',
  'Volver al sitio':                'Back to site',
  'Mis obras':                      'My projects',

  // Topbar
  'Obra Belgrano':                  'Belgrano Project',
  'Buscar tareas, pedidos, personas…': 'Search tasks, orders, people…',
  'Nuevo':                          'New',
  'Obra cargada · datos reales':    'Loaded project · real data',
  'Obra vacía · onboarding':        'Empty project · onboarding',

  // ─── DASHBOARD SCREEN ─────────────────────────────────────────────────
  'Edificio Belgrano · actualizado hace 12 min':
    'Belgrano Building · updated 12 min ago',
  'Exportar':                       'Export',
  'Nuevo reporte':                  'New report',

  // Stat tiles
  'Avance total':                   'Total progress',
  'Alertas críticas':               'Critical alerts',
  'Tareas hoy':                     'Tasks today',
  '+4% esta semana':                '+4% this week',
  '+1 hoy':                         '+1 today',
  '3 por aprobar':                  '3 to approve',
  '75% completadas':                '75% completed',

  // Avance por rubro
  'Avance por rubro':               'Progress by trade',
  'Comparado con presupuesto inicial': 'Compared to initial budget',
  'Semana':                         'Week',
  'Mes':                            'Month',
  'Trimestre':                      'Quarter',
  'Total':                          'Total',
  'Mampostería':                    'Masonry',
  'Hormigón armado':                'Reinforced concrete',
  'Instalaciones eléctricas':       'Electrical installations',
  'Instalaciones sanitarias':       'Plumbing',
  'Terminaciones':                  'Finishes',
  'Carpintería':                    'Carpentry',
  'Movimiento de suelos':           'Earthwork',
  'Instalaciones':                  'Installations',

  // Críticos
  'Críticos activos':               'Active criticals',
  'Falla en Grúa Torre 2':          'Tower Crane 2 failure',
  'Faltante: hierro 12 mm':         'Missing: 12 mm rebar',
  'Pedido sin aprobar':             'Unapproved order',
  'Demora en hormigón':             'Concrete delay',
  'Hace 3 días':                    '3 days ago',
  'Ver todas las alertas':          'View all alerts',

  // AI banner
  'Análisis IA':                    'AI analysis',
  'El rubro hormigón armado se está retrasando 3 días respecto al cronograma.':
    'Reinforced concrete is running 3 days behind schedule.',
  'Ver análisis completo':          'View full analysis',
  'Asignar a director':             'Assign to director',

  // Activity feed
  'Avances de hoy':                 "Today's progress",
  'Marcó completada Hormigonado losa +3': 'Marked Slab +3 concrete pour as complete',
  'Subió 4 fotos de obra':          'Uploaded 4 site photos',
  'Pedido de cemento aprobado':     'Cement order approved',
  'Reportó falla en Grúa Torre 2':  'Reported failure on Tower Crane 2',

  // ─── CRONOGRAMA ───────────────────────────────────────────────────────
  'Cronograma de tareas':           'Task schedule',
  'Vista general · 12 semanas · 4 rubros': 'Overview · 12 weeks · 4 trades',
  'Nueva tarea':                    'New task',
  'Tarea':                          'Task',
  'Completado':                     'Completed',
  'En curso':                       'In progress',
  'Retraso':                        'Delayed',
  'Programado':                     'Scheduled',
  'Excavación general':             'General excavation',
  'Cimentación pilotes':            'Pile foundations',
  'Hormigonado losa +1':            'Slab +1 concrete pour',
  'Hormigonado losa +2':            'Slab +2 concrete pour',
  'Hormigonado losa +3':            'Slab +3 concrete pour',
  'Columnas eje 4-6':               'Columns axis 4-6',
  'Tabiquería interior':            'Interior partitions',
  'Cierres exteriores':             'Exterior enclosures',
  'Tendido eléctrico':              'Electrical wiring',
  'Sanitarios':                     'Plumbing',
  'C. Ríos':                        'C. Ríos',
  'L. Benítez':                     'L. Benítez',
  'P. Salas':                       'P. Salas',
  'M. Ortiz':                       'M. Ortiz',
  'A. Gómez':                       'A. Gómez',

  // ─── ALERTAS ──────────────────────────────────────────────────────────
  'Problemas y alertas':            'Problems & alerts',
  'Hay 2 alertas críticas pendientes.': 'There are 2 critical alerts pending.',
  'Reportar problema':              'Report problem',
  'Todas':                          'All',
  'Críticos':                       'Critical',
  'Importantes':                    'Important',
  'Moderados':                      'Moderate',
  'Resueltos':                      'Resolved',
  'CRÍTICO':                        'CRITICAL',
  'IMPORTANTE':                     'IMPORTANT',
  'MODERADO':                       'MODERATE',
  'RESUELTO':                       'RESOLVED',

  // ─── PEDIDOS ──────────────────────────────────────────────────────────
  'Pedidos de materiales':          'Material orders',
  '7 pedidos pendientes · 3 esperan tu aprobación.': '7 pending orders · 3 awaiting your approval.',
  'Filtros':                        'Filters',
  'Nuevo pedido':                   'New order',
  'Por aprobar':                    'To approve',
  'En tránsito':                    'In transit',
  'Demorados':                      'Delayed',
  'Mes en curso':                   'Current month',
  'Listado de pedidos':             'Order list',
  'Pendientes':                     'Pending',
  'En camino':                      'In transit',
  'Pedido':                         'Order',
  'Material':                       'Material',
  'Proveedor':                      'Supplier',
  'Cantidad':                       'Quantity',
  'Llegada':                        'Arrival',
  'Estado':                         'Status',
  'ENTREGADO':                      'DELIVERED',
  'EN CAMINO':                      'IN TRANSIT',
  'POR APROBAR':                    'TO APPROVE',
  'DEMORADO':                       'DELAYED',
  'APROBADO':                       'APPROVED',
  'BORRADOR':                       'DRAFT',
  'URGENTE':                        'URGENT',
  'Aprobar':                        'Approve',

  // ─── REPORTES ─────────────────────────────────────────────────────────
  'Reportes de obra':               'Project reports',
  'Todo lo que el bot capturó desde WhatsApp, en un solo lugar.':
    'Everything the bot captured from WhatsApp, in one place.',
  'Exportar PDF':                   'Export PDF',
  'Hoy':                            'Today',
  'Ayer':                           'Yesterday',
  'Capataz':                        'Foreman',
  'Compras':                        'Purchasing',
  'Arquitecta':                     'Architect',
  'Arquitecto/a':                   'Architect',
  'Preguntale a tus reportes':      'Ask your reports',
  'Sugeridas':                      'Suggested',
  'Respuesta IA':                   'AI Response',
  'Escribí tu pregunta...':         'Type your question...',

  // ─── EQUIPO ───────────────────────────────────────────────────────────
  'Equipo de trabajo':              'Work team',
  '6 personas activas en Edificio Belgrano.': '6 active people in Belgrano Building.',
  'Toda la obra':                   'Full project',
  'Tareas':                         'Tasks',
  'Reportes':                       'Reports',

  // ─── EMPTY STATES ─────────────────────────────────────────────────────
  '¡Bienvenido a BuildData!':       'Welcome to BuildData!',
  'Empecemos a configurar tu primera obra.': "Let's set up your first project.",
  'Ver tour':                       'View tour',
  'Tu obra todavía no tiene datos.': "Your project doesn't have data yet.",
  'Conectar bot de WhatsApp':       'Connect WhatsApp bot',
  'Paso 1 de 5':                    'Step 1 of 5',
  'Lista de configuración':         'Setup checklist',
  'Sin datos aún':                  'No data yet',
  'Crear tu primera obra':          'Create your first project',
  'Conectar el bot de WhatsApp':    'Connect the WhatsApp bot',
  'Invitar al equipo':              'Invite the team',
  'Cargar el cronograma inicial':   'Load initial schedule',
  'Registrar tu primer reporte':    'Register your first report',
  '¿Necesitás ayuda con la configuración?': 'Need help with setup?',
  'Hablar con soporte':             'Talk to support',
  'Cuando tengas datos…':           'When you have data…',
  'Todo en orden':                  "Everything's in order",
  'Probar enviando una alerta':     'Try sending an alert',
  'Cómo funcionan las alertas':     'How alerts work',
  'Vista previa':                   'Preview',
  'Tu cronograma se verá así':      'Your schedule will look like this',
  'Edificio en altura':             'High-rise building',
  'Vivienda unifamiliar':           'Single-family home',
  'Refacción / remodelación':       'Renovation / remodel',
  'Comercial / industrial':         'Commercial / industrial',
  'Usar plantilla':                 'Use template',
  'Crear primer pedido':            'Create first order',
  'Agregar proveedor':              'Add supplier',
  'Configurar catálogo':            'Configure catalog',
  'Proveedores':                    'Suppliers',
  'Catálogo de materiales':         'Material catalog',
  'Conectar WhatsApp':              'Connect WhatsApp',
  'Ver demo':                       'View demo',
  'Tipos de reporte que captura':   'Report types it captures',
  'Avance de tarea':                'Task progress',
  'Fotos georreferenciadas':        'Geo-tagged photos',
  'Problemas e incidentes':         'Problems & incidents',
  'Pedidos de material':            'Material orders',
  'Cierre de jornada':              'Day-end report',
  'Invitar persona':                'Invite person',
  '1 de 20 personas':               '1 of 20 people',
  'Invitar por WhatsApp':           'Invite via WhatsApp',
  'Copiar link de invitación':      'Copy invitation link',
  'Activo':                         'Active',
  'Sin asignar':                    'Unassigned',
  'Invitar':                        'Invite',
  'Cliente / propietario':          'Client / owner',

  // ─── BUILDO ──────────────────────────────────────────────────────────
  'Buildo':                         'Buildo',
  'Asistente IA · Edificio Belgrano': 'AI Assistant · Belgrano Building',
  'Sugerencias':                    'Suggestions',
  'Preguntale a Buildo…':           'Ask Buildo…',
  'Respuestas generadas por IA. Verificá información crítica.':
    'AI-generated responses. Verify critical information.',
  '¿Cuántos pedidos tengo pendientes de aprobar?': 'How many orders are awaiting my approval?',
  '¿Qué alertas críticas hay activas?':           'What critical alerts are active?',
  'Resumen del avance de hoy':                    "Summary of today's progress",
  '¿Quién reportó la falla de la grúa?':          'Who reported the crane failure?',
};

// Regex rules — applied AFTER exact-match lookup fails. Capture groups are
// preserved. Order matters: more specific first.
const I18N_REGEX = [
  // Time expressions
  [/hace (\d+) min/g,       '$1 min ago'],
  [/hace (\d+) h(?!\w)/g,   '$1 h ago'],
  [/hace (\d+) hs/g,        '$1 hrs ago'],
  [/hace (\d+) días/g,      '$1 days ago'],
  [/hace (\d+) día(?!s)/g,  '$1 day ago'],
  // Generic words
  [/\bayer\b/g,             'yesterday'],
  [/\bhoy\b/g,              'today'],
  [/\bAyer\b/g,             'Yesterday'],
  [/\bHoy\b/g,              'Today'],
  [/\bactualizado\b/g,      'updated'],
  [/Edificio Belgrano/g,    'Belgrano Building'],
  [/\baprobar\b/g,          'approve'],
  [/\bcompletada(s)?\b/g,   'completed'],
  [/\bcompletadas?\b/g,     'completed'],
];

// ─── Engine ───────────────────────────────────────────────────────────────

let CURRENT_LANG = 'es';
const TEXT_ORIGINALS = new Map();   // text node → original Spanish
const ATTR_ORIGINALS = new Map();   // element → { attrName: originalValue }

function translateString(s) {
  if (!s) return s;
  const trimmed = s.trim();
  if (!trimmed) return s;

  // Exact match (preserves leading/trailing whitespace)
  if (Object.prototype.hasOwnProperty.call(I18N_DICT, trimmed)) {
    const lead = s.match(/^\s*/)[0];
    const trail = s.match(/\s*$/)[0];
    return lead + I18N_DICT[trimmed] + trail;
  }

  // Regex pass
  let out = s;
  let changed = false;
  for (const [re, repl] of I18N_REGEX) {
    const next = out.replace(re, repl);
    if (next !== out) { out = next; changed = true; }
  }
  return changed ? out : s;
}

function shouldSkipElement(el) {
  if (!el || el.nodeType !== 1) return false;
  const tag = el.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return true;
  // Skip Buildo chat messages (user/AI generated content)
  if (el.closest && el.closest('[data-no-i18n]')) return true;
  return false;
}

function translateTextNode(node) {
  if (node.nodeType !== 3) return;
  if (shouldSkipElement(node.parentElement)) return;
  const orig = node.nodeValue;
  const translated = translateString(orig);
  if (translated !== orig) {
    if (!TEXT_ORIGINALS.has(node)) TEXT_ORIGINALS.set(node, orig);
    node.nodeValue = translated;
  }
}

function translateAttrs(el) {
  if (shouldSkipElement(el)) return;
  for (const attr of ['placeholder', 'aria-label', 'title']) {
    if (!el.hasAttribute || !el.hasAttribute(attr)) continue;
    const v = el.getAttribute(attr);
    const translated = translateString(v);
    if (translated !== v) {
      const map = ATTR_ORIGINALS.get(el) || {};
      if (!(attr in map)) map[attr] = v;
      ATTR_ORIGINALS.set(el, map);
      el.setAttribute(attr, translated);
    }
  }
}

function walkAndTranslate(root) {
  if (!root) return;
  if (root.nodeType === 3) { translateTextNode(root); return; }
  if (root.nodeType !== 1) return;
  if (shouldSkipElement(root)) return;
  translateAttrs(root);
  // Walk children
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (n) => {
        if (n.nodeType === 3) return NodeFilter.FILTER_ACCEPT;
        if (shouldSkipElement(n)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeType === 3) translateTextNode(n);
    else if (n.nodeType === 1) translateAttrs(n);
  }
}

function restoreOriginals() {
  for (const [node, orig] of TEXT_ORIGINALS) {
    try { node.nodeValue = orig; } catch (e) { /* node detached */ }
  }
  TEXT_ORIGINALS.clear();
  for (const [el, attrs] of ATTR_ORIGINALS) {
    for (const [a, v] of Object.entries(attrs)) {
      try { el.setAttribute(a, v); } catch (e) {}
    }
  }
  ATTR_ORIGINALS.clear();
}

let observer = null;
function startObserver() {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    if (CURRENT_LANG !== 'en') return;
    for (const m of mutations) {
      for (const node of m.addedNodes) walkAndTranslate(node);
      if (m.type === 'characterData') translateTextNode(m.target);
      if (m.type === 'attributes' && m.target.nodeType === 1) translateAttrs(m.target);
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['placeholder', 'aria-label', 'title'],
  });
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
}

function setLanguage(lang) {
  if (lang === CURRENT_LANG) return;
  if (lang === 'en') {
    CURRENT_LANG = 'en';
    walkAndTranslate(document.body);
    startObserver();
  } else {
    CURRENT_LANG = 'es';
    stopObserver();
    restoreOriginals();
  }
}

Object.assign(window, { setLanguage, I18N_DICT });
