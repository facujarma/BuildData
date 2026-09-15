// LiveDashboard — interactive embedded dashboard for the BuildData landing.
// 6 screens: Dashboard, Cronograma, Alertas, Pedidos, Reportes, Equipo.
// Sidebar with active accent. Tabs and tab-like filters are live.

// ============================================================================
// Small Tailwind-flavoured primitives, scoped to the dashboard.
// ============================================================================

const DPill = ({ tone = 'slate', children }) => {
  const map = {
    critical:       'bg-critical50 text-[#B91C1C]',
    attention:      'bg-attention50 text-[#A16207]',
    success:        'bg-success50 text-[#15803D]',
    info:           'bg-info50 text-[#1D4ED8]',
    primary:        'bg-primary-50 text-primary',
    slate:          'bg-slate100 text-slate700',
    inkSolid:       'bg-slate950 text-white',
    criticalSolid:  'bg-critical text-white',
    successSolid:   'bg-success text-white',
    attentionSolid: 'bg-attention text-slate950',
  };
  return (
    <span className={`inline-flex items-center px-2 py-[3px] rounded text-[10px] font-bold tracking-[0.05em] uppercase whitespace-nowrap ${map[tone] || map.slate}`}>
      {children}
    </span>
  );
};

const DAvatar = ({ initials, size = 32 }) => {
  const palette = {
    JM: 'from-primary to-info', CR: 'from-info to-[#22C55E]',
    PS: 'from-[#F59E0B] to-[#EF4444]', LB: 'from-primary to-[#22C55E]',
    MO: 'from-[#EF4444] to-[#F59E0B]', AG: 'from-info to-primary',
    MR: 'from-primary to-accent',
  };
  const grad = palette[initials] || 'from-primary to-info';
  return (
    <div style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={`rounded-full bg-gradient-to-br ${grad} text-white font-bold flex items-center justify-center flex-none`}>
      {initials}
    </div>
  );
};

const DCard = ({ children, className = '', padding = 'p-5' }) => (
  <div className={`bg-white border border-slate200 rounded-lg shadow-card ${padding} ${className}`}>{children}</div>
);

const DButton = ({ variant = 'primary', size = 'md', icon, children, onClick, className = '', disabled = false }) => {
  const variants = {
    primary:   'bg-primary hover:bg-primary-700 text-white border-primary',
    secondary: 'bg-white hover:bg-slate50 text-slate700 border-slate300',
    ghost:     'bg-transparent hover:bg-slate100 text-primary border-transparent',
    danger:    'bg-critical hover:bg-[#B91C1C] text-white border-critical',
    accent:    'bg-accent hover:bg-accent-700 text-slate950 border-accent',
  };
  const sizes = { sm: 'text-[12px] px-3 py-[6px]', md: 'text-[13px] px-4 py-[8px]' };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-[6px] font-bold rounded-md border transition-colors ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}>
      {icon}{children}
    </button>
  );
};

const DStatTile = ({ tone, label, value, suffix, icon, delta, deltaTone = 'slate', onClick }) => {
  const tones = {
    primary:   { tint: 'bg-primary-50',  fg: 'text-primary' },
    critical:  { tint: 'bg-critical50',  fg: 'text-[#B91C1C]' },
    attention: { tint: 'bg-attention50', fg: 'text-[#A16207]' },
    success:   { tint: 'bg-success50',   fg: 'text-[#15803D]' },
    info:      { tint: 'bg-info50',      fg: 'text-[#1D4ED8]' },
  };
  const dColor = { success: 'text-[#15803D]', critical: 'text-[#B91C1C]', slate: 'text-slate500' };
  return (
    <DCard padding="p-4" className={onClick ? 'cursor-pointer hover:shadow-card2 hover:border-slate300 transition-all group' : ''}>
      <div onClick={onClick} className="contents">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones[tone].tint} ${tones[tone].fg}`}>
            <Icon name={icon} size={16} />
          </div>
          {onClick && <Icon name="chevron-right" size={14} className="text-slate300 group-hover:text-slate500 transition-colors" />}
        </div>
        <div className="flex items-baseline gap-1">
          <div className="text-[26px] font-extrabold display-tight tnum text-slate950 leading-none">{value}</div>
          {suffix && <div className="text-base font-bold text-slate500">{suffix}</div>}
        </div>
        <div className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate600 mt-1">{label}</div>
        {delta && <div className={`text-[11px] font-semibold mt-2 ${dColor[deltaTone] || dColor.slate}`}>{delta}</div>}
      </div>
    </DCard>
  );
};

const DPageHeader = ({ title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-4 mb-5">
    <div>
      <h1 className="text-[22px] font-bold display-tight text-slate950 leading-tight">{title}</h1>
      {subtitle && <div className="text-[13px] text-slate500 mt-[2px]">{subtitle}</div>}
    </div>
    {right && <div className="flex items-center gap-2 flex-none">{right}</div>}
  </div>
);

// ============================================================================
// Screen: DASHBOARD
// ============================================================================

// ============================================================================
// Screen: DASHBOARD  (interactive)
// ============================================================================

// ── Toast ───────────────────────────────────────────────────────────────
const useToast = () => {
  const [msg, setMsg] = React.useState(null);
  const ref = React.useRef(null);
  const flash = (m) => {
    setMsg(m);
    clearTimeout(ref.current);
    ref.current = setTimeout(() => setMsg(null), 2400);
  };
  return [msg, flash];
};

const DashToast = ({ msg }) => {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
      <Icon name="check" size={14} className="text-success" />
      {msg}
    </div>
  );
};

// ── Right-side drawer shell ───────────────────────────────────────────────
const SideDrawer = ({ open, title, subtitle, accent, onClose, children, footer }) => {
  React.useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[55] bg-slate950/40 backdrop-blur-[2px] animate-fade-task" />
      <aside className="fixed right-0 top-0 bottom-0 z-[60] w-[440px] max-w-[calc(100vw-32px)] bg-white border-l border-slate200 shadow-big flex flex-col animate-slide-task overflow-hidden">
        <div className="px-5 py-4 border-b border-slate200 flex items-start justify-between gap-3 flex-none">
          <div className="min-w-0 flex-1">
            {accent
              ? <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full flex-none" style={{ background: accent }} /><span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate600 truncate">{subtitle}</span></div>
              : subtitle && <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-1">{subtitle}</div>}
            <h3 className="text-[18px] font-extrabold display-tight text-slate950 leading-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center flex-none"><Icon name="x" size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-slate200 p-3 flex items-center gap-2 flex-none">{footer}</div>}
      </aside>
    </>
  );
};

// ── Category helpers ──────────────────────────────────────────────────────
const CAT_COLORS = ['#0F4395', '#22C55E', '#3B82F6', '#F59E0B', '#94A3B8', '#8B5CF6', '#EF4444', '#14B8A6'];

const catProgress = (cat) => {
  if (!cat.taskIds.length) return 0;
  const sum = cat.taskIds.reduce((a, id) => a + (TASK_BY_ID[id] ? TASK_BY_ID[id].pct : 0), 0);
  return Math.round(sum / cat.taskIds.length);
};

const initials = (who) => who.split(' ').map((w) => w[0]).join('').replace('.', '');

// ── Create / edit category modal ──────────────────────────────────────────
const CategoryModal = ({ open, initial, onClose, onSave, onManage }) => {
  const [name, setName]       = React.useState('');
  const [color, setColor]     = React.useState(CAT_COLORS[0]);
  const [desc, setDesc]       = React.useState('');
  const [taskIds, setTaskIds] = React.useState([]);

  React.useEffect(() => {
    if (open) {
      setName(initial ? initial.name : '');
      setColor(initial ? initial.color : CAT_COLORS[0]);
      setDesc(initial ? (initial.desc || '') : '');
      setTaskIds(initial ? [...(initial.taskIds || [])] : []);
    }
  }, [open, initial]);

  React.useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (id) => setTaskIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const preview = taskIds.length ? Math.round(taskIds.reduce((a, id) => a + (TASK_BY_ID[id] ? TASK_BY_ID[id].pct : 0), 0) / taskIds.length) : 0;
  const canSave = name.trim().length >= 2;

  const byRubro = {};
  ALL_TASKS.forEach((t) => { (byRubro[t.rubro] = byRubro[t.rubro] || []).push(t); });

  const submit = () => {
    if (!canSave) return;
    const payload = { id: initial ? initial.id : 'cat-' + Date.now().toString(36), name: name.trim(), color, desc: desc.trim(), taskIds };
    // Toda creación/edición de rubro queda registrada en el store central.
    if (initial && initial.name && initial.name !== payload.name) RubroStore.remove(initial.name);
    if (RubroStore.find(payload.name)) RubroStore.update(payload.name, { color, desc: payload.desc });
    else RubroStore.add({ name: payload.name, color, desc: payload.desc, budget: 0 });
    onSave(payload);
    onClose();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[560px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: color + '22', color }}>
              <Icon name="chart" size={16} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">{initial ? 'Editar rubro' : 'Nuevo rubro'}</div>
              <div className="text-[11px] text-slate500">El progreso se calcula con las tareas que adjuntes</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">Nombre*</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Terminaciones, Fachada, Pintura…"
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>

          <div>
            <div className="text-[11px] font-bold text-slate700 mb-2">Color</div>
            <div className="flex gap-2 flex-wrap">
              {CAT_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={"w-7 h-7 rounded-full transition-transform " + (color === c ? 'ring-2 ring-offset-2 ring-slate400 scale-110' : 'hover:scale-105')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">Descripción</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              placeholder="Qué trabajos incluye este rubro. Ej: losas, columnas y vigas de hormigón."
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[58px]" />
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate700">Tareas del cronograma</span>
              <span className="text-[11px] text-slate500">{taskIds.length} seleccionada{taskIds.length === 1 ? '' : 's'}</span>
            </div>
            <div className="border border-slate200 rounded-lg max-h-[240px] overflow-y-auto divide-y divide-slate100">
              {Object.entries(byRubro).map(([rubro, tasks]) => (
                <div key={rubro}>
                  <div className="px-3 py-[6px] bg-slate50 text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 sticky top-0">{rubro}</div>
                  {tasks.map((t) => {
                    const on = taskIds.includes(t.id);
                    const st = TASK_STATE_MAP[t.state];
                    return (
                      <button key={t.id} type="button" onClick={() => toggle(t.id)}
                        className="w-full flex items-center gap-3 px-3 py-[9px] hover:bg-slate50 text-left">
                        <span className={"w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center flex-none " + (on ? 'bg-primary border-primary text-white' : 'border-slate300 bg-white')}>
                          {on && <Icon name="check" size={11} />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="text-[12px] font-semibold text-slate900 block truncate">{t.name}</span>
                          <span className="text-[10px] text-slate500">{t.who}</span>
                        </span>
                        <span className="flex items-center gap-1 flex-none">
                          <span className="w-[6px] h-[6px] rounded-full" style={{ background: st.dot }} />
                          <span className="text-[11px] font-bold tnum text-slate600 w-[34px] text-right">{t.pct}%</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-between flex-none">
          <div className="text-[12px] text-slate600">
            Progreso calculado: <b className="text-slate950 tnum">{preview}%</b>
            {onManage && <button type="button" onClick={() => { onClose(); onManage(); }} className="ml-3 text-[11px] font-bold text-primary hover:underline">Administrar rubros →</button>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
            <button onClick={submit} disabled={!canSave}
              className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (canSave ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed')}>
              {initial ? 'Guardar' : 'Crear categoría'} <Icon name="check" size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Budget dataset (millones AR$) ─────────────────────────────────────────
const BUDGET = {
  total: 124, ejec: 81, comp: 15,
  lines: [
    { name: 'Hormigón armado',  cap: 52, spent: 38, comp: 6 },
    { name: 'Mampostería',      cap: 20, spent: 21, comp: 0 },
    { name: 'Instalaciones',    cap: 24, spent: 9,  comp: 5 },
    { name: 'Terminaciones',    cap: 18, spent: 6,  comp: 2 },
    { name: 'Movimiento de suelos', cap: 10, spent: 7, comp: 2 },
  ],
};

const SEED_CATEGORIES = [
  { id: 'cat-mov',  name: 'Movimiento de suelos', color: '#94A3B8', taskIds: ['mov-01', 'mov-02'] },
  { id: 'cat-horm', name: 'Hormigón armado',      color: '#0F4395', taskIds: ['horm-01', 'horm-02', 'horm-03', 'horm-04'] },
  { id: 'cat-mamp', name: 'Mampostería',          color: '#22C55E', taskIds: ['mamp-01', 'mamp-02'] },
  { id: 'cat-inst', name: 'Instalaciones',        color: '#3B82F6', taskIds: ['inst-01', 'inst-02'] },
];

// ── Alertas: fuente única compartida por el dashboard y la pantalla Alertas ──
const ALERTS_SEED = [
  { id: 'AL-061', lvl: 'critical',  cat: 'Equipos',    title: 'Falla en Grúa Torre 2',                  who: 'P. Salas',      time: 'hace 12 min', state: 'open',     assignee: null,         desc: 'Motor principal no responde. Cuadrilla detenida hasta revisión técnica. Posible falla eléctrica en el variador.', impact: 'Frena el hormigonado de losa +3.', link: { type: 'tarea', label: 'Hormigonado losa +3' } },
  { id: 'AL-060', lvl: 'critical',  cat: 'Materiales', title: 'Faltante de hierro 12 mm para columnas', who: 'L. Benítez',    time: 'hace 2 h',    state: 'open',     assignee: null,         desc: 'No hay material para continuar armado de columnas eje 4–6. El pedido PED-0141 todavía no fue aprobado.',        impact: 'Bloquea columnas eje 4-6.',       link: { type: 'pedido', label: 'PED-0141 · Hierro 12 mm' } },
  { id: 'AL-059', lvl: 'attention', cat: 'Logística',  title: 'Demora en entrega de hormigón',          who: 'C. Ríos',       time: 'hace 5 h',    state: 'progress', assignee: 'J. Méndez',  desc: 'El proveedor confirmó un retraso de 24 h en la próxima entrega de hormigón elaborado.',                        impact: 'Reprogramar colado del jueves.',  link: null },
  { id: 'AL-058', lvl: 'attention', cat: 'Personal',   title: 'Cuadrilla incompleta',                   who: 'P. Salas',      time: 'ayer 16:20',  state: 'progress', assignee: 'P. Salas',   desc: '2 operarios ausentes sin aviso. La tarea de mampostería quedó pausada por falta de personal.',                 impact: 'Tabiquería interior pausada.',    link: null },
  { id: 'AL-057', lvl: 'moderate',  cat: 'Reportes',   title: 'Sin reporte diario de cierre',            who: 'Bot BuildData', time: 'ayer 19:05',  state: 'open',     assignee: null,         desc: 'El capataz no envió el cierre de jornada. El bot ya envió un recordatorio automático por WhatsApp.',           impact: 'Sin registro de avance de ayer.', link: null },
  { id: 'AL-056', lvl: 'critical',  cat: 'Seguridad',  title: 'Andamio sin protección perimetral',       who: 'A. Gómez',      time: 'hace 1 día',  state: 'resolved', assignee: 'P. Salas',   desc: 'Se detectó un andamio en nivel +2 sin baranda. Se colocó protección y se capacitó a la cuadrilla.',            impact: 'Riesgo de caída — resuelto.',     link: null, resolvedNote: 'Baranda colocada y verificada por H&S.' },
  { id: 'AL-055', lvl: 'moderate',  cat: 'Materiales', title: 'Cemento entregado y registrado',          who: 'L. Benítez',    time: 'hoy 09:14',   state: 'resolved', assignee: 'L. Benítez', desc: '12 bolsas de cemento descargadas y cargadas al stock del depósito.',                                            impact: 'Stock actualizado.',              link: { type: 'pedido', label: 'PED-0142 · Cemento' }, resolvedNote: 'Stock actualizado automáticamente.' },
];

const ALERT_LISTENERS = new Set();
const AlertStore = {
  items: ALERTS_SEED.map((a) => ({ ...a })),
  get() { return AlertStore.items; },
  active() { return AlertStore.items.filter((a) => a.state !== 'resolved'); },
  emit() { ALERT_LISTENERS.forEach((fn) => fn()); },
  patch(id, fields) { AlertStore.items = AlertStore.items.map((a) => a.id === id ? { ...a, ...fields } : a); AlertStore.emit(); },
  add(a) { AlertStore.items = [{ ...a }, ...AlertStore.items]; AlertStore.emit(); },
};
const useAlertStore = () => {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const fn = () => force((n) => n + 1);
    ALERT_LISTENERS.add(fn);
    return () => ALERT_LISTENERS.delete(fn);
  }, []);
  return AlertStore;
};

// ── Actividad: fuente única del feed (dashboard, Actividad y perfil) ────────
const ACTIVITY_SEED = [
  { id: 'ac-9', who: 'JM', kind: 'tarea',   day: 'Hoy',    time: '08:42', text: 'marcó completada **Hormigonado losa +3**',        tags: ['Hormigón'] },
  { id: 'ac-8', who: 'LB', kind: 'pedido',  day: 'Hoy',    time: '09:15', text: 'aprobó el pedido **PED-0142 · Cemento**',          tags: ['PED-0142', 'Compras'] },
  { id: 'ac-7', who: 'CR', kind: 'foto',    day: 'Hoy',    time: '10:15', text: 'subió **4 fotos** del armado de columnas',         tags: ['Foto'] },
  { id: 'ac-6', who: 'LB', kind: 'stock',   day: 'Hoy',    time: '13:20', text: 'cargó **120 bolsas** de cemento al stock',         tags: ['Stock'] },
  { id: 'ac-5', who: 'PS', kind: 'alerta',  day: 'Hoy',    time: '12:48', text: 'reportó **Falla en Grúa Torre 2**',                tags: ['Crítico'], severity: 'critical' },
  { id: 'ac-4', who: 'JM', kind: 'equipo',  day: 'Ayer',   time: '16:02', text: 'invitó a **M. Ortiz** como Capataz',               tags: ['Equipo'] },
  { id: 'ac-3', who: 'MO', kind: 'cierre',  day: 'Ayer',   time: '18:05', text: 'envió el **cierre de jornada** — 6 personas, 0 incidentes', tags: ['Cierre'] },
  { id: 'ac-2', who: 'AG', kind: 'alerta',  day: 'Ayer',   time: '11:30', text: 'resolvió **Andamio sin protección**',              tags: ['Seguridad'] },
  { id: 'ac-1', who: 'LB', kind: 'recibo',  day: '18 Ago', time: '14:44', text: 'cargó el comprobante de **Aceros Norte**',         tags: ['Recibo'] },
];
const ACT_LISTENERS = new Set();
const ActivityStore = {
  items: ACTIVITY_SEED.map((a) => ({ ...a })),
  get() { return ActivityStore.items; },
  byDay() {
    const out = [];
    ActivityStore.items.forEach((it) => {
      let g = out.find((x) => x.d === it.day);
      if (!g) { g = { d: it.day, items: [] }; out.push(g); }
      g.items.push(it);
    });
    return out;
  },
  forPerson(who) { return ActivityStore.items.filter((a) => a.who === who); },
  emit() { ACT_LISTENERS.forEach((fn) => fn()); },
  add(a) { ActivityStore.items = [{ id: 'ac-' + Date.now().toString(36), day: 'Hoy', ...a }, ...ActivityStore.items]; ActivityStore.emit(); },
};
const useActivityStore = () => {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const fn = () => force((n) => n + 1);
    ACT_LISTENERS.add(fn);
    return () => ACT_LISTENERS.delete(fn);
  }, []);
  return ActivityStore;
};


// Dashboard widget: list in-progress / late tasks and let the user mark them
// complete right from the dashboard (synced via TaskStore).
const DashTareasComplete = ({ flash }) => {
  const store = useTaskStore();
  const tasks = store.get().flatMap((g) => g.items.map((t) => ({ ...t, rubro: g.rubro })));
  const done = tasks.filter((t) => t.state === 'done').length;
  const pending = tasks.filter((t) => t.state !== 'done');
  const pct = Math.round((done / tasks.length) * 100);

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between text-[12px] mb-1">
          <span className="font-semibold text-slate700">{done} de {tasks.length} completadas</span>
          <span className="font-bold tnum">{pct}%</span>
        </div>
        <div className="bg-slate100 h-[8px] rounded-full overflow-hidden"><div style={{ width: pct + '%' }} className="h-full bg-success rounded-full transition-all" /></div>
      </div>
      {pending.length === 0 ? (
        <div className="text-center text-[#15803D] text-[13px] py-8 font-bold flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-full bg-success50 flex items-center justify-center"><Icon name="check" size={22} /></span>
          ¡Todas las tareas completadas!
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(pending.reduce((acc, t) => { (acc[t.rubro] = acc[t.rubro] || []).push(t); return acc; }, {})).map(([rubro, items]) => (
            <div key={rubro}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: RUBRO_COLORS[rubro] || '#94A3B8' }} />
                <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate600">{rubro}</span>
                <span className="text-[10px] text-slate400">· {items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((t) => {
                  const st = TASK_STATE_MAP[t.state];
                  return (
                    <div key={t.id} className="flex items-center gap-3 border border-slate200 rounded-lg p-3">
                      <span className="w-2 h-2 rounded-full flex-none" style={{ background: st.dot }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-slate950 truncate">{t.name}</div>
                        <div className="text-[10px] text-slate500">{t.who} · {t.pct}%</div>
                      </div>
                      <button onClick={() => { store.markComplete(t.id); flash && flash('Tarea completada'); }}
                        className="text-[11px] font-bold text-[#15803D] bg-success50 hover:bg-success/20 rounded-md px-2 py-[6px] flex items-center gap-1 flex-none transition-colors">
                        <Icon name="check" size={12} /> Completar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const ScreenDashboard = ({ onNav }) => {
  const [toast, flash] = useToast();
  const alertStore = useAlertStore();
  const activityStore = useActivityStore();
  const [categories, setCategories] = React.useState(SEED_CATEGORIES);
  const [drawer, setDrawer]   = React.useState(null); // {kind, catId?}
  const [catModal, setCatModal] = React.useState(null); // null | { initial }

  const totalAvance = categories.length
    ? Math.round(categories.reduce((a, c) => a + catProgress(c), 0) / categories.length)
    : 0;

  const saveCategory = (cat) => {
    setCategories((prev) => prev.find((c) => c.id === cat.id) ? prev.map((c) => c.id === cat.id ? cat : c) : [...prev, cat]);
    flash(catModal && catModal.initial ? 'Categoría actualizada' : 'Categoría creada');
  };
  const removeCategory = (id) => { setCategories((prev) => prev.filter((c) => c.id !== id)); setDrawer(null); flash('Categoría eliminada'); };

  const drawerCat = drawer && drawer.kind === 'rubro' ? categories.find((c) => c.id === drawer.catId) : null;

  return (
    <>
      <DPageHeader
        title="Dashboard"
        subtitle="Edificio Belgrano · actualizado hace 12 min"
        right={
          <>
            <DButton variant="secondary" size="sm" icon={<Icon name="download" size={13} />} onClick={() => flash('Exportando dashboard a PDF…')}>Exportar</DButton>
            <DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => onNav('reports')}>Nuevo reporte</DButton>
          </>
        }
      />

      {/* ── 1 · REQUIERE TU ATENCIÓN ─────────────────────────────────── */}
      {(() => {
        const openAlerts = alertStore.get().filter((a) => a.state === 'open');
        const critOpen   = openAlerts.filter((a) => a.lvl === 'critical').length;
        const actions = [
          { n: 3, label: 'mensajes por confirmar', sub: 'La IA ya los interpretó — revisá antes de aplicar', ico: 'message', to: 'inbox',
            tone: 'bg-white border-slate200', badge: 'bg-primary text-white', cta: 'Revisar' },
          { n: 3, label: 'pedidos por aprobar',    sub: 'PED-0140 está marcado urgente', ico: 'package', to: 'materials',
            tone: 'bg-attention50 border-[#FDE68A]', badge: 'bg-accent text-slate950', cta: 'Aprobar' },
          { n: openAlerts.length, label: 'alertas sin atender', sub: critOpen + ' crítica' + (critOpen === 1 ? '' : 's') + ' frenando trabajo', ico: 'alert', to: 'alerts',
            tone: 'bg-critical50 border-[#FECACA]', badge: 'bg-critical text-white', cta: 'Ver' },
        ].filter((a) => a.n > 0);

        return (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] tracking-[0.08em] uppercase font-bold text-slate600">Requiere tu atención</span>
              <span className="text-[10px] font-bold text-white bg-critical rounded-full px-[7px] py-[2px] tnum">{actions.reduce((a, x) => a + x.n, 0)}</span>
            </div>
            {actions.length === 0 ? (
              <div className="flex items-center gap-3 bg-success50 border border-[#BBF7D0] rounded-lg p-4">
                <span className="w-9 h-9 rounded-full bg-success text-white flex items-center justify-center flex-none"><Icon name="check" size={17} /></span>
                <div className="text-[13px] font-bold text-[#15803D]">Todo al día. No hay nada esperando tu decisión.</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {actions.map((a) => (
                  <button key={a.label} onClick={() => onNav(a.to)}
                    className={"text-left border rounded-lg p-4 hover:shadow-card2 transition-all group " + a.tone}>
                    <div className="flex items-start gap-3">
                      <span className={"w-9 h-9 rounded-lg flex items-center justify-center flex-none font-extrabold text-[15px] tnum " + a.badge}>{a.n}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-slate950 leading-tight">{a.label}</div>
                        <div className="text-[11px] text-slate600 leading-snug mt-[3px]">{a.sub}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate950/[0.07] flex items-center gap-1 text-[11px] font-bold text-primary">
                      {a.cta} <Icon name="arrow-right" size={11} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 3 · ESTADO GENERAL (contexto) ────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] tracking-[0.08em] uppercase font-bold text-slate600">Estado general</span>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="primary"   label="Avance total"     value={totalAvance} suffix="%" icon="chart"   delta="+4% esta semana" deltaTone="success" onClick={() => setDrawer({ kind: 'avance' })} />
        <DStatTile tone="critical"  label="Alertas críticas" value="2"             icon="alert"   delta="+1 hoy" deltaTone="critical" onClick={() => setDrawer({ kind: 'alerts' })} />
        <DStatTile tone="attention" label="Pedidos"          value="7"             icon="package" delta="3 por aprobar" onClick={() => setDrawer({ kind: 'pedidos' })} />
        <DStatTile tone="success"   label="Tareas hoy"       value="9/12"          icon="check"   delta="Marcá completadas" deltaTone="success" onClick={() => setDrawer({ kind: 'tareas' })} />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-3 mb-4">
        {/* Avance por rubro — solo lectura; la administración vive en Rubros */}
        <DCard padding="p-0">
          <div className="px-5 py-3 border-b border-slate200 flex items-center justify-between gap-2">
            <div>
              <div className="text-[14px] font-bold text-slate950">Avance por rubro</div>
              <div className="text-[11px] text-slate500 mt-[1px]">Calculado con las tareas de cada rubro</div>
            </div>
            <button onClick={() => onNav('rubros')} className="text-[11px] font-bold text-primary hover:underline flex-none">Administrar →</button>
          </div>
          <div className="p-3">
            {categories.length === 0 && (
              <div className="text-center text-slate500 text-[12px] py-8 border border-dashed border-slate200 rounded-lg m-2">
                No hay categorías. Creá una y adjuntá tareas del cronograma.
              </div>
            )}
            {categories.map((c) => {
              const pct = catProgress(c);
              return (
                <button key={c.id} onClick={() => setDrawer({ kind: 'rubro', catId: c.id })}
                  className="w-full grid grid-cols-[170px_1fr_44px] gap-3 items-center px-2 py-2 rounded-md hover:bg-slate50 transition-colors text-left group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-none" style={{ background: c.color }} />
                    <span className="text-[12px] font-semibold text-slate800 truncate group-hover:text-primary transition-colors">{c.name}</span>
                  </div>
                  <div className="bg-slate100 h-[8px] rounded-full overflow-hidden">
                    <div style={{ width: pct + '%', background: c.color }} className="h-full rounded-full transition-all" />
                  </div>
                  <div className="text-[12px] font-bold text-right tnum">{pct}%</div>
                </button>
              );
            })}
          </div>
        </DCard>

        {/* Críticos activos */}
        <DCard padding="p-0">
          <div className="px-5 py-3 border-b border-slate200 flex items-center justify-between">
            <div className="text-[14px] font-bold">Críticos activos</div>
            <DPill tone="criticalSolid">{alertStore.active().filter((a) => a.lvl === 'critical').length}</DPill>
          </div>
          <div className="divide-y divide-slate200">
            {alertStore.active().slice(0, 3).map((a, i) => (
              <button key={a.id} onClick={() => onNav('alerts')} className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate50 transition-colors text-left">
                <div className={"w-8 h-8 rounded-md flex items-center justify-center flex-none " + (a.lvl === 'critical' ? 'bg-critical50 text-[#B91C1C]' : 'bg-attention50 text-[#A16207]')}>
                  <Icon name="alert" size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold leading-tight">{a.title}</div>
                  <div className="text-[10px] text-slate500 mt-[2px]">{a.who} · {a.time}</div>
                </div>
                <Icon name="chevron-right" size={13} className="text-slate300 mt-1" />
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-slate200">
            <DButton variant="secondary" size="sm" className="w-full justify-center" onClick={() => onNav('alerts')}>Ver todas las alertas</DButton>
          </div>
        </DCard>
      </div>

      {/* Budget banner + activity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="blueprint-bg rounded-lg p-5 text-white relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-[9px] font-bold tracking-wider uppercase px-2 py-[3px] rounded">
              <Icon name="chart" size={10} /> Presupuesto
            </span>
            <span className="text-[10px] text-white/60">actualizado hoy</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/55">Total</div>
              <div className="text-[18px] font-extrabold display-tight tnum text-white leading-tight">AR$ 124 M</div>
            </div>
            <div>
              <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/55">Ejecutado</div>
              <div className="text-[18px] font-extrabold display-tight tnum text-white leading-tight">AR$ 81 M</div>
              <div className="text-[10px] font-semibold text-white/60">65 %</div>
            </div>
            <div>
              <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/55">Disponible</div>
              <div className="text-[18px] font-extrabold display-tight tnum text-accent leading-tight">AR$ 43 M</div>
              <div className="text-[10px] font-semibold text-accent/80">35 %</div>
            </div>
          </div>

          <div className="mb-2">
            <div className="h-[10px] w-full rounded-full overflow-hidden flex bg-white/10">
              <div style={{ width: '65%' }} className="h-full bg-accent" />
              <div style={{ width: '12%' }} className="h-full bg-accent/55" />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-white/65">
              <span className="inline-flex items-center gap-[6px]"><span className="w-2 h-2 rounded-full bg-accent" /> Ejecutado 65 %</span>
              <span className="inline-flex items-center gap-[6px]"><span className="w-2 h-2 rounded-full bg-accent/55" /> Comprometido 12 %</span>
              <span className="inline-flex items-center gap-[6px]"><span className="w-2 h-2 rounded-full bg-white/15" /> Libre 23 %</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 space-y-[6px] mb-4">
            {BUDGET.lines.slice(0, 3).map((r) => {
              const over = r.spent > r.cap;
              return (
                <div key={r.name} className="grid grid-cols-[1fr_auto] items-center text-[11px]">
                  <div className="text-white/85 truncate">{r.name}</div>
                  <div className="tnum font-semibold">
                    <span className={over ? 'text-critical' : 'text-white'}>AR$ {r.spent} M</span>
                    <span className="text-white/45"> / {r.cap} M</span>
                    {over && <span className="ml-2 text-[9px] font-bold tracking-wider text-critical bg-critical/20 px-[5px] py-[1px] rounded">+{Math.round((r.spent / r.cap - 1) * 100)} %</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mt-auto">
            <DButton variant="accent" size="sm" onClick={() => onNav && onNav('budget')}>Ver presupuesto</DButton>
            <DButton variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => flash('Exportando presupuesto a XLSX…')}>Exportar</DButton>
          </div>
        </div>

        <DCard padding="p-0">
          <div className="px-5 py-3 border-b border-slate200">
            <div className="text-[14px] font-bold">Avances de hoy</div>
          </div>
          <div className="divide-y divide-slate200">
            {activityStore.get().filter((a) => a.day === 'Hoy').map((a) => {
              const person = TEAM_PEOPLE.find((p) => p.who === a.who);
              return (
                <button key={a.id} onClick={() => onNav('activity')} className="w-full px-4 py-[10px] flex items-center gap-3 hover:bg-slate50 transition-colors text-left">
                  <DAvatar initials={a.who} size={30} />
                  <div className="flex-1 min-w-0 text-[12px] leading-snug text-slate700">
                    <b className="font-bold text-slate950">{person ? person.name : a.who}</b>{' '}
                    <span dangerouslySetInnerHTML={{ __html: a.text.replace(/\*\*(.+?)\*\*/g, '<b class="text-slate950">$1</b>') }} />
                  </div>
                  <div className="text-[10px] text-slate500 tnum flex-none">{a.time}</div>
                </button>
              );
            })}
          </div>
        </DCard>
      </div>

      {/* ── Detail drawers ─────────────────────────────────────── */}
      <SideDrawer open={drawer && drawer.kind === 'avance'} title="Avance total de la obra" subtitle="Resumen por categoría"
        onClose={() => setDrawer(null)}
        footer={<DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); onNav('gantt'); }}>Ver cronograma</DButton>}>
        <div className="flex items-baseline gap-2 mb-4">
          <div className="text-[40px] font-extrabold display-tight tnum text-slate950 leading-none">{totalAvance}%</div>
          <div className="text-[12px] text-slate500">promedio de {categories.length} categorías</div>
        </div>
        <div className="space-y-3">
          {categories.map((c) => {
            const pct = catProgress(c);
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="font-semibold text-slate800 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.name}</span>
                  <span className="font-bold tnum">{pct}%</span>
                </div>
                <div className="bg-slate100 h-[7px] rounded-full overflow-hidden">
                  <div style={{ width: pct + '%', background: c.color }} className="h-full rounded-full" />
                </div>
                <div className="text-[10px] text-slate500 mt-1">{c.taskIds.length} tarea{c.taskIds.length === 1 ? '' : 's'} adjunta{c.taskIds.length === 1 ? '' : 's'}</div>
              </div>
            );
          })}
        </div>
      </SideDrawer>

      <SideDrawer open={drawer && drawer.kind === 'alerts'} title="Alertas activas" subtitle="Críticas e importantes"
        onClose={() => setDrawer(null)}
        footer={<DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); onNav('alerts'); }}>Ir a Alertas</DButton>}>
        {/* Summary chips */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { l: 'Críticas',    v: alertStore.active().filter((a) => a.lvl === 'critical').length, t: 'text-[#B91C1C]' },
            { l: 'Importantes', v: alertStore.active().filter((a) => a.lvl === 'attention').length, t: 'text-[#A16207]' },
            { l: 'Moderadas',   v: alertStore.active().filter((a) => a.lvl === 'moderate').length, t: 'text-slate600' },
            { l: 'En progreso', v: alertStore.active().filter((a) => a.state === 'progress').length, t: 'text-[#1D4ED8]' },
          ].map((m) => (
            <div key={m.l} className="border border-slate200 rounded-lg p-3">
              <div className={"text-[22px] font-extrabold tnum leading-none " + m.t}>{m.v}</div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mt-1">{m.l}</div>
            </div>
          ))}
        </div>
        {/* Grouped by category */}
        <div className="space-y-4">
          {Object.entries(alertStore.active().reduce((acc, a) => { (acc[a.cat] = acc[a.cat] || []).push(a); return acc; }, {})).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate600">{cat}</span>
                <span className="text-[10px] text-slate400">· {items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((a) => {
                  const crit = a.lvl === 'critical';
                  const mod = a.lvl === 'moderate';
                  return (
                    <div key={a.id} className={"border rounded-lg p-3 " + (crit ? 'bg-critical50 border-[#FECACA]' : mod ? 'bg-slate50 border-slate200' : 'bg-attention50 border-[#FDE68A]')}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-bold text-slate400 tnum">{a.id}</span>
                        <DPill tone={crit ? 'criticalSolid' : mod ? 'slate' : 'attentionSolid'}>{crit ? 'CRÍTICA' : mod ? 'MODERADA' : 'IMPORTANTE'}</DPill>
                        {a.state === 'progress' && <DPill tone="info">EN PROGRESO</DPill>}
                      </div>
                      <div className="text-[13px] font-bold text-slate950 leading-tight">{a.title}</div>
                      <div className="flex items-start gap-1 text-[11px] text-slate700 mt-1">
                        <Icon name="alert" size={11} className={"mt-[1px] flex-none " + (crit ? 'text-[#B91C1C]' : mod ? 'text-slate500' : 'text-[#A16207]')} />
                        <span>{a.impact}</span>
                      </div>
                      <div className="text-[10px] text-slate500 mt-[3px]">Reportó {a.who} · hace {a.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SideDrawer>

      <SideDrawer open={drawer && drawer.kind === 'pedidos'} title="Pedidos de materiales" subtitle="7 pendientes"
        onClose={() => setDrawer(null)}
        footer={<DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); onNav('materials'); }}>Ir a Pedidos</DButton>}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[{ l: 'Por aprobar', v: '3', t: 'text-[#A16207]' }, { l: 'En tránsito', v: '4', t: 'text-[#1D4ED8]' }, { l: 'Demorados', v: '1', t: 'text-[#B91C1C]' }, { l: 'Mes en curso', v: '14', t: 'text-[#15803D]' }].map((m) => (
            <div key={m.l} className="border border-slate200 rounded-lg p-3">
              <div className={"text-[22px] font-extrabold tnum " + m.t}>{m.v}</div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mt-1">{m.l}</div>
            </div>
          ))}
        </div>
        <div className="text-[12px] text-slate600 leading-snug">Hay <b className="text-slate950">3 pedidos</b> esperando tu aprobación. El más urgente es <b>PED-0140</b> (ladrillo cerámico).</div>
      </SideDrawer>

      <SideDrawer open={drawer && drawer.kind === 'tareas'} title="Tareas en curso" subtitle="Marcá completadas las que ya terminaron"
        onClose={() => setDrawer(null)}
        footer={<DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); onNav('gantt'); }}>Ver cronograma</DButton>}>
        <DashTareasComplete flash={flash} />
      </SideDrawer>

      {/* Budget breakdown */}
      <SideDrawer open={drawer && drawer.kind === 'budget'} title="Desglose de presupuesto" subtitle="Edificio Belgrano"
        onClose={() => setDrawer(null)}
        footer={<DButton variant="primary" size="sm" className="flex-1 justify-center" icon={<Icon name="download" size={13} />} onClick={() => flash('Exportando presupuesto a XLSX…')}>Exportar XLSX</DButton>}>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[{ l: 'Total', v: BUDGET.total }, { l: 'Ejecutado', v: BUDGET.ejec }, { l: 'Disponible', v: BUDGET.total - BUDGET.ejec - BUDGET.comp }].map((m) => (
            <div key={m.l} className="border border-slate200 rounded-lg p-3">
              <div className="text-[18px] font-extrabold tnum text-slate950 leading-tight">AR$ {m.v} M</div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mt-1">{m.l}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Por rubro</div>
        <div className="space-y-3">
          {BUDGET.lines.map((r) => {
            const over = r.spent > r.cap;
            const used = Math.min(100, Math.round((r.spent / r.cap) * 100));
            const compPct = Math.min(100 - used, Math.round((r.comp / r.cap) * 100));
            return (
              <div key={r.name} className="border border-slate200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-slate950">{r.name}</span>
                  {over
                    ? <DPill tone="criticalSolid">+{Math.round((r.spent / r.cap - 1) * 100)}%</DPill>
                    : <span className="text-[11px] font-bold text-slate500 tnum">{used}%</span>}
                </div>
                <div className="h-[8px] rounded-full overflow-hidden flex bg-slate100">
                  <div style={{ width: used + '%' }} className={over ? 'h-full bg-critical' : 'h-full bg-primary'} />
                  <div style={{ width: compPct + '%' }} className="h-full bg-primary/40" />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate600 tnum">
                  <span>Ejecutado <b className={over ? 'text-[#B91C1C]' : 'text-slate950'}>AR$ {r.spent} M</b></span>
                  <span className="text-slate400">Presupuesto AR$ {r.cap} M</span>
                </div>
              </div>
            );
          })}
        </div>
      </SideDrawer>

      {/* Category detail */}
      <SideDrawer open={!!drawerCat} title={drawerCat ? drawerCat.name : ''} subtitle="Categoría de avance" accent={drawerCat ? drawerCat.color : null}
        onClose={() => setDrawer(null)}
        footer={drawerCat && (
          <>
            <DButton variant="secondary" size="sm" onClick={() => { setCatModal({ initial: drawerCat }); }}>Editar</DButton>
            <DButton variant="secondary" size="sm" className="text-[#B91C1C]" onClick={() => removeCategory(drawerCat.id)}>Quitar</DButton>
            <DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setDrawer(null); onNav('gantt'); }}>Cronograma</DButton>
          </>
        )}>
        {drawerCat && (
          <>
            <div className="flex items-baseline gap-2 mb-4">
              <div className="text-[40px] font-extrabold display-tight tnum text-slate950 leading-none">{catProgress(drawerCat)}%</div>
              <div className="text-[12px] text-slate500">promedio de {drawerCat.taskIds.length} tarea{drawerCat.taskIds.length === 1 ? '' : 's'}</div>
            </div>
            <div className="bg-slate100 h-[8px] rounded-full overflow-hidden mb-5">
              <div style={{ width: catProgress(drawerCat) + '%', background: drawerCat.color }} className="h-full rounded-full" />
            </div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Tareas adjuntas</div>
            {drawerCat.taskIds.length === 0 && (
              <div className="text-center text-slate500 text-[12px] py-6 border border-dashed border-slate200 rounded-lg">
                Sin tareas. Editá la categoría para adjuntar.
              </div>
            )}
            <div className="space-y-2">
              {drawerCat.taskIds.map((id) => {
                const t = TASK_BY_ID[id];
                if (!t) return null;
                const st = TASK_STATE_MAP[t.state];
                return (
                  <div key={id} className="border border-slate200 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[12px] font-bold text-slate950 truncate">{t.name}</span>
                      <DPill tone={t.state === 'late' ? 'criticalSolid' : t.state === 'done' ? 'success' : t.state === 'progress' ? 'primary' : 'info'}>{st.label}</DPill>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate100 h-[6px] rounded-full overflow-hidden">
                        <div style={{ width: t.pct + '%', background: st.dot }} className="h-full rounded-full" />
                      </div>
                      <span className="text-[11px] font-bold tnum w-[34px] text-right">{t.pct}%</span>
                    </div>
                    <div className="text-[10px] text-slate500 mt-2">{t.who}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SideDrawer>

      <CategoryModal open={!!catModal} initial={catModal ? catModal.initial : null}
        onClose={() => setCatModal(null)} onSave={saveCategory} />

      <DashToast msg={toast} />
    </>
  );
};


// ============================================================================
// Screen: CRONOGRAMA (Gantt / Lista / Calendario)
// ============================================================================

// Shared task data + helpers ------------------------------------------------
const TASK_STATE_MAP = {
  done:     { bg: '#22C55E', fg: '#fff',     label: 'Completado',  tint: 'bg-success50 text-[#15803D]',  dot: '#22C55E' },
  progress: { bg: '#0F4395', fg: '#fff',     label: 'En curso',    tint: 'bg-primary-50 text-primary',   dot: '#0F4395' },
  late:     { bg: '#EF4444', fg: '#fff',     label: 'Retraso',     tint: 'bg-critical50 text-[#B91C1C]', dot: '#EF4444' },
  planned:  { bg: '#EFF6FF', fg: '#1D4ED8',  label: 'Programado',  border: '#3B82F6', tint: 'bg-info50 text-[#1D4ED8]', dot: '#3B82F6' },
};

// ── Rubros: la taxonomía transversal de la obra ─────────────────────────────
// Un rubro agrupa tareas, presupuesto, pedidos y stock. Se administran desde
// la sección "Rubros"; los "+ nuevo rubro" de los formularios escriben acá.
const RUBROS_SEED = [
  { name: 'Movimiento de suelos', color: '#94A3B8', desc: 'Excavación, nivelación, cimentaciones y retiro de suelo.' },
  { name: 'Hormigón armado',      color: '#0F4395', desc: 'Losas, columnas, vigas y todo trabajo de estructura de hormigón.' },
  { name: 'Mampostería',          color: '#22C55E', desc: 'Tabiquería, cierres exteriores y revoques.' },
  { name: 'Instalaciones',        color: '#3B82F6', desc: 'Tendido eléctrico, sanitarios, gas y climatización.' },
];

// Proxy retro-compatible: RUBRO_COLORS[nombre] sigue funcionando en todo el código.
const RUBRO_COLORS = {};
const RUBRO_LISTENERS = new Set();
const RubroStore = {
  items: RUBROS_SEED.map((r) => ({ ...r })),
  get() { return RubroStore.items; },
  names() { return RubroStore.items.map((r) => r.name); },
  find(name) { return RubroStore.items.find((r) => r.name === name); },
  sync() {
    Object.keys(RUBRO_COLORS).forEach((k) => { delete RUBRO_COLORS[k]; });
    RubroStore.items.forEach((r) => { RUBRO_COLORS[r.name] = r.color; });
    RUBRO_LISTENERS.forEach((fn) => fn());
  },
  add(r) {
    if (!r || !r.name || RubroStore.find(r.name)) return;
    RubroStore.items = [...RubroStore.items, { color: '#8B5CF6', desc: '', ...r }];
    RubroStore.sync();
  },
  update(name, patch) {
    RubroStore.items = RubroStore.items.map((r) => r.name === name ? { ...r, ...patch } : r);
    RubroStore.sync();
  },
  remove(name) {
    RubroStore.items = RubroStore.items.filter((r) => r.name !== name);
    RubroStore.sync();
  },
};
RubroStore.sync();
const useRubroStore = () => {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const fn = () => force((n) => n + 1);
    RUBRO_LISTENERS.add(fn);
    return () => RUBRO_LISTENERS.delete(fn);
  }, []);
  return RubroStore;
};

// Week range: S8 → S37 (30 weeks). Today anchor at S20 (week index 12).
// Working with week indices keeps math simple; dates derive from GANTT_START.
const WEEK_START_IDX = 8;   // displayed week number for column 0
const WEEK_COUNT     = 30;  // total weeks rendered
const TODAY_WEEK     = 20;  // current "today" anchor (S20 + Wed)
const TODAY_COL      = (TODAY_WEEK - WEEK_START_IDX) + 0.4; // 0-indexed column with mid-week offset

// Anchor real-world dates so columns make sense in tooltips / detail drawer.
// Mon for S15 was Apr 7 2025; so S8 is Feb 17 2025. We shift GANTT_START so
// weekDate(0) = Feb 17 2025 (Monday).
const GANTT_START = new Date(2025, 1, 17); // Mon Feb 17, 2025 = S8
const weekDate = (weekIdx, dayOffset = 0) => {
  const d = new Date(GANTT_START);
  d.setDate(d.getDate() + weekIdx * 7 + dayOffset);
  return d;
};
const fmtDate = (d) => d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
const fmtDateLong = (d) => d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

// Initial task data — original tasks were placed against S15. Re-anchor to
// the new column system (S15 = column 7 in the new range).
const TASK_OFFSET = 7; // shift original start indices forward by 7 cols
const INITIAL_GROUPS = [
  { rubro: 'Movimiento de suelos', items: [
    { id: 'mov-01', name: 'Excavación general',     who: 'C. Ríos',    start: 0 + TASK_OFFSET, span: 2, state: 'done',     pct: 100, desc: 'Retiro de 2.400 m³ de tierra del solar. Movimiento concluido sin imprevistos.', cost: 'AR$ 4,2 M', deps: [] },
    { id: 'mov-02', name: 'Cimentación pilotes',    who: 'C. Ríos',    start: 1 + TASK_OFFSET, span: 3, state: 'done',     pct: 100, desc: '48 pilotes de hormigón armado, profundidad 12 m. Ensayos PIT aprobados.',     cost: 'AR$ 9,1 M', deps: ['mov-01'] },
  ]},
  { rubro: 'Hormigón armado', items: [
    { id: 'horm-01', name: 'Hormigonado losa +1',   who: 'L. Benítez', start: 2 + TASK_OFFSET, span: 3, state: 'done',     pct: 100, desc: 'Losa nivel +1, 22 m³ de hormigón H21. Probetas con resistencia 26 MPa.',       cost: 'AR$ 6,8 M', deps: ['mov-02'] },
    { id: 'horm-02', name: 'Hormigonado losa +2',   who: 'L. Benítez', start: 3 + TASK_OFFSET, span: 3, state: 'done',     pct: 100, desc: 'Losa nivel +2, 24 m³ H21. Curado completado sin fisuras.',                       cost: 'AR$ 7,3 M', deps: ['horm-01'] },
    { id: 'horm-03', name: 'Hormigonado losa +3',   who: 'L. Benítez', start: 4 + TASK_OFFSET, span: 4, state: 'progress', pct: 62,  desc: 'En curso · 28 m³ planeados, 17 m³ vertidos. Próximo paño previsto para el viernes.', cost: 'AR$ 8,1 M', deps: ['horm-02'] },
    { id: 'horm-04', name: 'Columnas eje 4-6',      who: 'L. Benítez', start: 5 + TASK_OFFSET, span: 3, state: 'late',     pct: 30,  desc: 'Retrasada 3 días por faltante de hierro 12 mm. Pedido PED-0141 sin aprobar.',     cost: 'AR$ 4,5 M', deps: ['horm-03'] },
  ]},
  { rubro: 'Mampostería', items: [
    { id: 'mamp-01', name: 'Tabiquería interior',   who: 'P. Salas',   start: 6 + TASK_OFFSET, span: 4, state: 'planned',  pct: 0,   desc: 'Tabiques 12 cm en ladrillo hueco. 1.200 m² previstos en 6 semanas.',              cost: 'AR$ 12,4 M', deps: ['horm-04'] },
    { id: 'mamp-02', name: 'Cierres exteriores',    who: 'P. Salas',   start: 7 + TASK_OFFSET, span: 4, state: 'planned',  pct: 0,   desc: 'Muros perimetrales 20 cm con aislación. Termina con revoque grueso exterior.',     cost: 'AR$ 9,9 M', deps: ['mamp-01'] },
  ]},
  { rubro: 'Instalaciones', items: [
    { id: 'inst-01', name: 'Tendido eléctrico',     who: 'M. Ortiz',   start: 7 + TASK_OFFSET, span: 5, state: 'planned',  pct: 0,   desc: 'Cañería corrugada, cableado por sectores, tablero general en planta baja.',        cost: 'AR$ 11,2 M', deps: ['mamp-01'] },
    { id: 'inst-02', name: 'Sanitarios',            who: 'M. Ortiz',   start: 8 + TASK_OFFSET, span: 4, state: 'planned',  pct: 0,   desc: 'Provisión de agua fría/caliente, desagües, ventilaciones. Termotanques en azotea.', cost: 'AR$ 8,6 M', deps: ['mamp-01'] },
  ]},
];

// Flat list of every task — used by list + calendar views.
// Live tasks state lives in ScreenGantt; ALL_TASKS / TASK_BY_ID are derived
// from GANTT_GROUPS for the initial render but the screen uses state for adds.
let GANTT_GROUPS = INITIAL_GROUPS;
let ALL_TASKS = GANTT_GROUPS.flatMap((g) => g.items.map((t) => ({ ...t, rubro: g.rubro })));
let TASK_BY_ID = Object.fromEntries(ALL_TASKS.map((t) => [t.id, t]));

// Rebuild the derived collections whenever the group state changes.
const recomputeDerived = (groups) => {
  ALL_TASKS  = groups.flatMap((g) => g.items.map((t) => ({ ...t, rubro: g.rubro })));
  TASK_BY_ID = Object.fromEntries(ALL_TASKS.map((t) => [t.id, t]));
};

// ── Shared task store ──────────────────────────────────────────────────────
// Lets the Cronograma and the Dashboard read/mutate the same task list and
// stay in sync even though they are separate screen components.
const TASK_LISTENERS = new Set();
const TaskStore = {
  groups: INITIAL_GROUPS,
  get() { return TaskStore.groups; },
  set(next) {
    TaskStore.groups = next;
    GANTT_GROUPS = next;
    recomputeDerived(next);
    TASK_LISTENERS.forEach((fn) => fn());
  },
  markComplete(id, by = 'J. Méndez') {
    const when = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    TaskStore.set(TaskStore.groups.map((g) => ({
      ...g,
      items: g.items.map((t) => t.id === id ? { ...t, state: 'done', pct: 100, completedBy: by, completedOn: when } : t),
    })));
  },
  reopen(id) {
    TaskStore.set(TaskStore.groups.map((g) => ({
      ...g,
      items: g.items.map((t) => t.id === id ? { ...t, state: 'progress', pct: t.pct >= 100 ? 60 : t.pct, completedBy: undefined, completedOn: undefined } : t),
    })));
  },
  addTask(task) {
    TaskStore.set(TaskStore.groups.map((g) =>
      g.rubro === task.rubro ? { ...g, items: [...g.items, task] } : g));
  },
};
// Hook: subscribe a component to task-store changes.
const useTaskStore = () => {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const fn = () => force((n) => n + 1);
    TASK_LISTENERS.add(fn);
    return () => TASK_LISTENERS.delete(fn);
  }, []);
  return TaskStore;
};

// ──────────────────────────────────────────────────────────────────────────
// Gantt view — horizontal scroll, sticky task column, zoom + today jump
// ──────────────────────────────────────────────────────────────────────────

const GanttView = ({ groups, onPick }) => {
  const scrollerRef = React.useRef(null);
  // 'comfortable' (90px/week) → fits ~7 weeks · 'normal' (72px) → ~9 · 'compact' (56px) → ~12
  const [zoom, setZoom] = React.useState('normal');
  const weekWidth = { compact: 56, normal: 72, comfortable: 96 }[zoom];

  const weekNumbers = Array.from({ length: WEEK_COUNT }, (_, i) => WEEK_START_IDX + i);
  const totalWidth = WEEK_COUNT * weekWidth;

  // Scroll to today on mount + on zoom change.
  const scrollToToday = React.useCallback(() => {
    if (!scrollerRef.current) return;
    const targetX = TODAY_COL * weekWidth - scrollerRef.current.clientWidth / 2 + 130;
    scrollerRef.current.scrollTo({ left: Math.max(0, targetX), behavior: 'smooth' });
  }, [weekWidth]);

  React.useEffect(() => { scrollToToday(); }, [scrollToToday]);

  const monthSpans = React.useMemo(() => {
    // Group weeks by month for a top header band.
    const out = [];
    let last = null;
    weekNumbers.forEach((_, i) => {
      const d = weekDate(i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString('es-AR', { month: 'long', year: '2-digit' });
      if (!last || last.key !== key) {
        last = { key, label, span: 1 };
        out.push(last);
      } else {
        last.span += 1;
      }
    });
    return out;
  }, []);

  return (
    <DCard padding="p-0" className="overflow-hidden">
      {/* Top toolbar: nav + zoom */}
      <div className="px-3 py-2 border-b border-slate200 bg-slate50 flex items-center gap-2 flex-wrap">
        <button onClick={() => scrollerRef.current && scrollerRef.current.scrollBy({ left: -weekWidth * 4, behavior: 'smooth' })}
          className="w-7 h-7 rounded-md hover:bg-slate200 text-slate600 flex items-center justify-center" title="Atrás">
          <Icon name="chevron-right" size={13} className="rotate-180" />
        </button>
        <button onClick={scrollToToday}
          className="text-[11px] font-bold px-3 py-[5px] rounded-md bg-white border border-slate200 hover:border-primary text-slate700">
          Hoy
        </button>
        <button onClick={() => scrollerRef.current && scrollerRef.current.scrollBy({ left: weekWidth * 4, behavior: 'smooth' })}
          className="w-7 h-7 rounded-md hover:bg-slate200 text-slate600 flex items-center justify-center" title="Adelante">
          <Icon name="chevron-right" size={13} />
        </button>

        <div className="text-[11px] text-slate500 ml-2 flex-1 truncate">
          {fmtDate(weekDate(0))} → {fmtDate(weekDate(WEEK_COUNT - 1, 4))} · {WEEK_COUNT} semanas
        </div>

        <div className="flex bg-white border border-slate200 rounded-md p-[2px] gap-[2px]">
          {[
            { id: 'compact',     label: 'Compacto' },
            { id: 'normal',      label: 'Normal' },
            { id: 'comfortable', label: 'Amplio' },
          ].map((z) => (
            <button key={z.id} onClick={() => setZoom(z.id)}
              className={`text-[10px] font-bold px-[8px] py-[4px] rounded transition-colors
                ${zoom === z.id ? 'bg-slate950 text-white' : 'text-slate600 hover:text-slate950'}`}>
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable area: task column is sticky to the left */}
      <div ref={scrollerRef} className="overflow-auto" style={{ maxHeight: '60vh' }}>
        <div className="relative" style={{ width: 260 + totalWidth }}>

          {/* Month band */}
          <div className="flex bg-slate50 border-b border-slate200 relative z-40" style={{ paddingLeft: 260 }}>
            {monthSpans.map((m, idx) => (
              <div key={idx} style={{ width: m.span * weekWidth }}
                className="px-2 py-1 text-[10px] tracking-[0.06em] uppercase font-bold text-slate600 border-l border-slate200 capitalize truncate">
                {m.label}
              </div>
            ))}
          </div>

          {/* Week header */}
          <div className="flex bg-slate50 border-b border-slate200 sticky top-0 z-40">
            <div style={{ width: 260 }} className="px-4 py-[10px] text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 bg-slate50 sticky left-0 z-50 border-r border-slate200">
              Tarea
            </div>
            {weekNumbers.map((wn, i) => {
              const isToday = i === Math.floor(TODAY_COL);
              return (
                <div key={i} style={{ width: weekWidth }}
                  className={`px-1 py-[10px] text-[10px] font-bold text-center border-l border-slate200
                    ${isToday ? 'bg-accent/10 text-accent-700' : 'text-slate500'}`}>
                  <div className="leading-tight">S{wn}</div>
                  <div className="text-[9px] font-medium text-slate400">{fmtDate(weekDate(i))}</div>
                </div>
              );
            })}
          </div>

          {/* Body */}
          {groups.map((g) => (
            <div key={g.rubro}>
              <div className="flex bg-slate100/70 border-b border-slate200 sticky left-0 z-30" style={{ width: 260 + totalWidth }}>
                <div style={{ width: 260 }} className="px-4 py-[8px] flex items-center gap-2 bg-slate100/95 sticky left-0 z-30 border-r border-slate200">
                  <span className="w-2 h-2 rounded-full" style={{ background: RUBRO_COLORS[g.rubro] }} />
                  <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate700">{g.rubro}</span>
                  <span className="text-[10px] text-slate500">· {g.items.length}</span>
                </div>
              </div>
              {g.items.map((t) => {
                const s = TASK_STATE_MAP[t.state];
                return (
                  <div key={t.id}
                    className="flex items-center border-b border-slate200 last:border-b-0 min-h-[48px] hover:bg-slate50/60 cursor-pointer transition-colors group"
                    onClick={() => onPick(t.id)}>
                    {/* Sticky task name */}
                    <div style={{ width: 260 }} className="px-4 py-2 sticky left-0 z-30 bg-white border-r border-slate200 group-hover:bg-slate50/80 transition-colors">
                      <div className="text-[12px] font-semibold text-slate950 leading-tight group-hover:text-primary transition-colors truncate">{t.name}</div>
                      <div className="text-[10px] text-slate500 mt-[1px] flex items-center gap-1">
                        <span className="inline-block w-[5px] h-[5px] rounded-full" style={{ background: s.dot }} />
                        {t.who}
                      </div>
                    </div>
                    {/* Track */}
                    <div className="relative h-[48px]" style={{ width: totalWidth }}>
                      {/* Week separators */}
                      <div className="absolute inset-0 flex">
                        {weekNumbers.map((_, i) => (
                          <div key={i} style={{ width: weekWidth }}
                            className={`border-l ${i === Math.floor(TODAY_COL) ? 'bg-accent/[0.06]' : ''} border-dashed border-slate100`} />
                        ))}
                      </div>
                      {/* Today line */}
                      <div className="absolute top-0 bottom-0 w-px bg-accent/70 pointer-events-none z-[5]"
                        style={{ left: TODAY_COL * weekWidth }} />

                      {/* Bar */}
                      <div style={{
                        left: t.start * weekWidth,
                        width: t.span * weekWidth - 6,
                        background: s.bg, color: s.fg, border: s.border ? `1px solid ${s.border}` : 0,
                      }} className="absolute top-1/2 -translate-y-1/2 ml-[3px] h-[24px] rounded px-2 flex items-center text-[10px] font-bold gap-[6px] overflow-hidden whitespace-nowrap shadow-card hover:shadow-pop transition-shadow z-10">
                        {(t.state === 'progress' || t.state === 'late') && t.pct > 0 && (
                          <div className="absolute inset-y-0 left-0 bg-white/25" style={{ width: `${t.pct}%` }} />
                        )}
                        <span className="relative z-10 truncate">
                          {t.name}{t.pct != null && t.state !== 'done' && t.state !== 'planned' ? ` · ${t.pct}%` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </DCard>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// List view
// ──────────────────────────────────────────────────────────────────────────

const ListView = ({ tasks, onPick }) => (
  <DCard padding="p-0" className="overflow-hidden">
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_140px_90px_90px_90px] gap-2 px-5 py-3 bg-slate50 border-b border-slate200 text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">
      <div>Tarea</div>
      <div>Rubro</div>
      <div>Responsable</div>
      <div>Inicio</div>
      <div>Fin</div>
      <div className="text-right">Estado</div>
    </div>
    {tasks.map((t, i) => {
      const s = TASK_STATE_MAP[t.state];
      return (
        <div key={t.id}
          className={`grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_140px_90px_90px_90px] gap-2 px-5 py-3 items-center hover:bg-slate50 cursor-pointer transition-colors
            ${i < tasks.length - 1 ? 'border-b border-slate100' : ''}`}
          onClick={() => onPick(t.id)}>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-slate950 truncate">{t.name}</div>
            <div className="text-[11px] text-slate500 truncate mt-[1px]">
              {t.state !== 'planned' && t.state !== 'done' ? `${t.pct}% completado` : t.rubro}
            </div>
            <div className="mt-2 h-[3px] bg-slate100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: s.dot }} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate700 min-w-0">
            <span className="w-2 h-2 rounded-full flex-none" style={{ background: RUBRO_COLORS[t.rubro] }} />
            <span className="truncate">{t.rubro}</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] min-w-0">
            <DAvatar initials={t.who.split(' ').map((w) => w[0]).join('').replace('.', '')} size={22} />
            <span className="text-slate700 truncate">{t.who}</span>
          </div>
          <div className="text-[12px] text-slate700 tnum truncate">{fmtDate(weekDate(t.start))}</div>
          <div className="text-[12px] text-slate700 tnum truncate">{fmtDate(weekDate(t.start + t.span, -1))}</div>
          <div className="flex justify-end"><DPill tone={t.state === 'late' ? 'criticalSolid' : t.state === 'done' ? 'success' : t.state === 'progress' ? 'primary' : 'info'}>{s.label}</DPill></div>
        </div>
      );
    })}
  </DCard>
);

// ──────────────────────────────────────────────────────────────────────────
// Calendar view (month grid) — overlays tasks active in each week
// ──────────────────────────────────────────────────────────────────────────

const CalendarView = ({ tasks, onPick }) => {
  // 5 weeks of "May 2025" (sample month visible in this view)
  const monthStart = new Date(2025, 4, 5); // Mon May 5, 2025
  // S19 falls at week index 11 in the new range (S8..S37).
  const startWeek = 11;
  const weekdays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  // For each day grid cell, find tasks that include it.
  const tasksByWeek = [];
  for (let w = 0; w < 5; w++) {
    const calWeek = startWeek + w;
    tasksByWeek.push(
      tasks.filter((t) => calWeek >= t.start && calWeek < t.start + t.span)
    );
  }

  return (
    <DCard padding="p-0" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-slate200 flex items-center justify-between">
        <div className="text-[14px] font-bold">Mayo 2025</div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-md hover:bg-slate100 text-slate600 flex items-center justify-center"><Icon name="chevron-right" size={12} className="rotate-180" /></button>
          <button className="text-[11px] font-bold px-2 py-1 rounded-md hover:bg-slate100 text-slate600">Hoy</button>
          <button className="w-7 h-7 rounded-md hover:bg-slate100 text-slate600 flex items-center justify-center"><Icon name="chevron-right" size={12} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate200">
        {weekdays.map((w, i) => (
          <div key={w} className={`px-3 py-2 text-[10px] tracking-[0.06em] uppercase font-bold ${i > 4 ? 'text-slate400 bg-slate50' : 'text-slate600'}`}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-5" style={{ gridAutoRows: '120px' }}>
        {Array.from({ length: 35 }, (_, idx) => {
          const w = Math.floor(idx / 7);
          const dow = idx % 7;
          const dayNum = monthStart.getDate() + idx; // simplified
          const isWeekend = dow > 4;
          const isToday = idx === 18; // visual "today" anchor
          const dayTasks = !isWeekend ? tasksByWeek[w].slice(0, 3) : []; // show first 3
          const overflow = !isWeekend ? Math.max(0, tasksByWeek[w].length - 3) : 0;

          return (
            <div key={idx}
              className={`border-r border-b border-slate100 last:border-r-0 p-2 flex flex-col overflow-hidden
                ${isWeekend ? 'bg-slate50/60' : 'bg-white'}
                ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                ${w === 4 ? 'border-b-0' : ''}`}>
              <div className={`text-[11px] font-bold mb-1 flex items-center gap-1 ${isToday ? 'text-primary' : 'text-slate600'}`}>
                {isToday ? <span className="w-5 h-5 rounded-full bg-primary text-white inline-flex items-center justify-center text-[10px]">{dayNum}</span> : dayNum}
              </div>
              <div className="flex flex-col gap-[3px]">
                {dayTasks.map((t) => {
                  const s = TASK_STATE_MAP[t.state];
                  return (
                    <button key={t.id}
                      onClick={(e) => { e.stopPropagation(); onPick(t.id); }}
                      style={{ background: s.bg + (t.state === 'planned' ? '' : ''), color: s.fg, borderLeft: `3px solid ${s.dot}` }}
                      className="text-left text-[9.5px] font-bold px-[6px] py-[2px] rounded-sm truncate hover:opacity-80 transition-opacity"
                      title={t.name}>
                      {t.name}
                    </button>
                  );
                })}
                {overflow > 0 && <div className="text-[9px] font-bold text-slate500">+{overflow} más</div>}
              </div>
            </div>
          );
        })}
      </div>
    </DCard>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Task detail panel
// ──────────────────────────────────────────────────────────────────────────

const TaskDetail = ({ taskId, onClose, onComplete, onReopen }) => {
  if (!taskId) return null;
  const t = TASK_BY_ID[taskId];
  if (!t) return null;
  const s = TASK_STATE_MAP[t.state];
  const startDate = weekDate(t.start);
  const endDate   = weekDate(t.start + t.span, -1);
  const dep = (t.deps || []).map((d) => TASK_BY_ID[d]).filter(Boolean);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-[55] bg-slate950/40 backdrop-blur-[2px] animate-fade-task" />
      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 z-[60] w-[420px] max-w-[calc(100vw-32px)] bg-white border-l border-slate200 shadow-big flex flex-col animate-slide-task overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate200 flex items-start justify-between gap-3 flex-none">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: RUBRO_COLORS[t.rubro] }} />
              <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate600 truncate">{t.rubro}</span>
            </div>
            <h3 className="text-[18px] font-extrabold display-tight text-slate950 leading-tight">{t.name}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center flex-none">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Status + progress */}
        <div className="px-5 py-4 bg-slate50 border-b border-slate200">
          <div className="flex items-center justify-between mb-3">
            <DPill tone={t.state === 'late' ? 'criticalSolid' : t.state === 'done' ? 'successSolid' : t.state === 'progress' ? 'primary' : 'info'}>{s.label}</DPill>
            <div className="text-[20px] font-extrabold tnum display-tight">{t.pct}%</div>
          </div>
          <div className="h-[8px] bg-slate200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${t.pct}%`, background: s.dot }} />
          </div>
          {t.state === 'late' && (
            <div className="mt-3 flex items-start gap-2 bg-critical50 text-[#B91C1C] text-[11px] rounded p-2">
              <Icon name="alert" size={12} className="mt-[1px] flex-none" />
              <span><b>Retraso de 3 días</b> · faltante de hierro 12 mm bloquea avance.</span>
            </div>
          )}
          {t.state === 'done' && t.completedBy && (
            <div className="mt-3 flex items-center gap-2 bg-success50 text-[#15803D] text-[11px] rounded p-2">
              <Icon name="check" size={12} className="flex-none" />
              <span>Marcada como completada por <b>{t.completedBy}</b>{t.completedOn ? ` el ${t.completedOn}` : ''}.</span>
            </div>
          )}
        </div>

        {/* Content scroll area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Descripción</div>
            <p className="text-[13px] text-slate700 leading-relaxed">{t.desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-1">Inicio</div>
              <div className="text-[12px] font-semibold text-slate950">{fmtDateLong(startDate)}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-1">Fin estimado</div>
              <div className="text-[12px] font-semibold text-slate950">{fmtDateLong(endDate)}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-1">Duración</div>
              <div className="text-[12px] font-semibold text-slate950">{t.span} semanas</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-1">Costo</div>
              <div className="text-[12px] font-semibold text-slate950 tnum">{t.cost}</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Responsable</div>
            <div className="flex items-center gap-3 p-3 border border-slate200 rounded-lg">
              <DAvatar initials={t.who.split(' ').map((w) => w[0]).join('').replace('.', '')} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold">{t.who}</div>
                <div className="text-[11px] text-slate500">{t.rubro}</div>
              </div>
              <button className="text-[11px] font-bold text-primary hover:underline">Mensaje</button>
            </div>
          </div>

          {dep.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Depende de</div>
              <div className="space-y-2">
                {dep.map((d) => {
                  const ds = TASK_STATE_MAP[d.state];
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-3 border border-slate200 rounded-lg">
                      <span className="w-2 h-2 rounded-full flex-none" style={{ background: ds.dot }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold truncate">{d.name}</div>
                        <div className="text-[11px] text-slate500">{ds.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent updates */}
          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Últimas actualizaciones</div>
            <div className="space-y-3">
              {[
                { who: t.who.split(' ').map((w) => w[0]).join('').replace('.', ''), text: 'Reporte de avance enviado por WhatsApp', when: 'hace 2 h' },
                { who: 'JM',  text: 'Tarea revisada por dirección', when: 'ayer' },
              ].map((u, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]">
                  <DAvatar initials={u.who} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate700 leading-snug">{u.text}</div>
                    <div className="text-[10px] text-slate500">{u.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate200 p-3 flex items-center gap-2 flex-none">
          {t.state === 'done' ? (
            <>
              <div className="flex-1 flex items-center gap-2 text-[12px] font-bold text-[#15803D]">
                <span className="w-6 h-6 rounded-full bg-success50 flex items-center justify-center flex-none"><Icon name="check" size={13} /></span>
                <span className="min-w-0">
                  Completada
                  {t.completedBy && <span className="block text-[10px] font-semibold text-slate500">por {t.completedBy}{t.completedOn ? ` · ${t.completedOn}` : ''}</span>}
                </span>
              </div>
              <DButton variant="secondary" size="sm" onClick={() => onReopen && onReopen(t.id)}>Reabrir</DButton>
            </>
          ) : (
            <>
              <DButton variant="secondary" size="sm">Editar</DButton>
              <DButton variant="primary" size="sm" className="flex-1 justify-center" icon={<Icon name="check" size={14} />} onClick={() => onComplete && onComplete(t.id)}>Marcar completada</DButton>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// New task modal
// ──────────────────────────────────────────────────────────────────────────

const NuevaTareaModal = ({ open, onClose, onCreate, defaultRubro, onManageRubros }) => {
  const PEOPLE = ['C. Ríos', 'L. Benítez', 'P. Salas', 'M. Ortiz', 'A. Gómez'];
  const rubroStore = useRubroStore();
  const rubros = rubroStore.names();
  const [rubroModal, setRubroModal] = React.useState(false);

  const [data, setData] = React.useState({
    name: '', rubro: defaultRubro || rubros[0] || '', who: PEOPLE[0],
    state: 'planned', cost: '',
    startWeek: TODAY_WEEK + 1, span: 2,
    desc: '',
  });
  const [created, setCreated] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCreated(false);
      setData((d) => ({ ...d, rubro: defaultRubro || d.rubro }));
    }
  }, [open, defaultRubro]);

  React.useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  if (!open) return null;

  const canCreate = data.name.trim().length >= 3 && data.span >= 1;
  const startIdx = data.startWeek - WEEK_START_IDX;
  const startDate = weekDate(startIdx);
  const endDate   = weekDate(startIdx + data.span, -1);

  const submit = () => {
    if (!canCreate) return;
    const id = 'tk-' + Date.now().toString(36);
    onCreate({
      id,
      name: data.name.trim(),
      who: data.who,
      start: startIdx,
      span: data.span,
      state: data.state,
      pct: data.state === 'done' ? 100 : data.state === 'progress' ? 25 : 0,
      desc: data.desc.trim() || 'Sin descripción — se completará después.',
      cost: data.cost.trim() || 'A definir',
      deps: [],
      rubro: data.rubro,
    });
    setCreated(true);
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[640px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        {created ? (
          <div className="px-8 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-success text-white flex items-center justify-center mx-auto mb-4">
              <Icon name="check" size={26} />
            </div>
            <h3 className="text-[22px] font-extrabold display-tight leading-tight mb-2">Tarea creada</h3>
            <p className="text-[13px] text-slate600 mb-1">
              <b className="text-slate950">{data.name}</b> · {data.rubro}
            </p>
            <p className="text-[12px] text-slate500 mb-6">
              {fmtDateLong(startDate)} → {fmtDateLong(endDate)}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={onClose}
                className="text-[13px] font-bold bg-white border border-slate300 hover:bg-slate50 text-slate700 rounded-md px-4 py-[9px]">
                Cerrar
              </button>
              <button onClick={() => { setData({ ...data, name: '' }); setCreated(false); }}
                className="text-[13px] font-bold bg-primary hover:bg-primary-700 text-white rounded-md px-4 py-[9px]">
                Crear otra
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center">
                  <Icon name="plus" size={16} />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold display-tight">Nueva tarea</div>
                  <div className="text-[11px] text-slate500">Se agrega al cronograma · podés editarla después</div>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center">
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate700">Nombre*</span>
                <input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="Ej: Hormigonado losa +4"
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate700">Rubro</span>
                    <button type="button" onClick={() => setRubroModal(true)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]">
                      <Icon name="plus" size={10} /> Nuevo rubro
                    </button>
                  </div>
                  <select value={data.rubro} onChange={(e) => setData({ ...data, rubro: e.target.value })}
                    className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                    {rubros.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate700">Responsable</span>
                  <select value={data.who} onChange={(e) => setData({ ...data, who: e.target.value })}
                    className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                    {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate700">Semana de inicio</span>
                  <input type="number" min={WEEK_START_IDX} max={WEEK_START_IDX + WEEK_COUNT - 1}
                    value={data.startWeek}
                    onChange={(e) => setData({ ...data, startWeek: Math.max(WEEK_START_IDX, Math.min(WEEK_START_IDX + WEEK_COUNT - 1, parseInt(e.target.value) || WEEK_START_IDX)) })}
                    className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
                </label>
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate700">Duración (semanas)</span>
                  <input type="number" min={1} max={20} value={data.span}
                    onChange={(e) => setData({ ...data, span: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
                    className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
                </label>
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate700">Estado</span>
                  <select value={data.state} onChange={(e) => setData({ ...data, state: e.target.value })}
                    className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                    <option value="planned">Programado</option>
                    <option value="progress">En curso</option>
                    <option value="done">Completado</option>
                    <option value="late">Retraso</option>
                  </select>
                </label>
              </div>

              {/* Date preview */}
              <div className="bg-slate50 border border-slate200 rounded-md px-3 py-2 flex items-center justify-between text-[11px]">
                <span className="text-slate500">Rango</span>
                <span className="font-semibold text-slate950">
                  {fmtDate(startDate)} → {fmtDate(endDate)} <span className="text-slate500">· {data.span} sem.</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-bold text-slate700">Costo estimado</span>
                  <input value={data.cost} onChange={(e) => setData({ ...data, cost: e.target.value })}
                    placeholder="Ej: AR$ 5,4 M"
                    className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
                </label>
              </div>

              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate700">Descripción</span>
                <textarea value={data.desc} onChange={(e) => setData({ ...data, desc: e.target.value })}
                  placeholder="Detalle del trabajo, cantidades, observaciones…"
                  rows={3}
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[72px]" />
              </label>
            </div>

            <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-between">
              <button onClick={onClose}
                className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">
                Cancelar
              </button>
              <button onClick={submit} disabled={!canCreate}
                className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors
                  ${canCreate ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed'}`}>
                Crear tarea <Icon name="check" size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {rubroModal && (
        <CategoryModal
          open={true}
          initial={null}
          onManage={onManageRubros}
          onClose={() => setRubroModal(false)}
          onSave={(cat) => {
            setData((d) => ({ ...d, rubro: cat.name }));
            setRubroModal(false);
          }}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Screen
// ──────────────────────────────────────────────────────────────────────────

const ScreenGantt = ({ onNav }) => {
  const [view, setView] = React.useState('gantt');
  const [pick, setPick] = React.useState(null);
  const store = useTaskStore();
  const groups = store.get();
  const [newTaskOpen, setNewTaskOpen] = React.useState(false);

  // Derived task list — single source of truth for List + Calendar.
  const flatTasks = groups.flatMap((g) => g.items.map((t) => ({ ...t, rubro: g.rubro })));

  const addTask = (task) => store.addTask(task);

  const total = flatTasks.length;
  const done  = flatTasks.filter((t) => t.state === 'done').length;
  const prog  = flatTasks.filter((t) => t.state === 'progress').length;
  const late  = flatTasks.filter((t) => t.state === 'late').length;

  return (
    <>
      <DPageHeader
        title="Cronograma de tareas"
        subtitle={`${total} tareas en 4 rubros · ${done} completadas · ${prog} en curso · ${late} en retraso`}
        right={
          <>
            <DButton variant="secondary" size="sm" icon={<Icon name="download" size={13} />}>Exportar</DButton>
            <DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => setNewTaskOpen(true)}>Nueva tarea</DButton>
          </>
        }
      />

      {/* Toolbar: legend + view switcher */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-4 flex-wrap">
          {Object.entries(TASK_STATE_MAP).map(([k, v]) => (
            <div key={k} className="flex items-center gap-[6px] text-[11px] font-semibold text-slate600">
              <span style={{ background: v.bg, border: v.border ? `1px solid ${v.border}` : 0 }} className="w-3 h-3 rounded-sm inline-block" />
              {v.label}
            </div>
          ))}
        </div>

        <div className="flex bg-slate100 rounded-md p-[2px] gap-[2px]">
          {[
            { id: 'gantt',    label: 'Gantt',    icon: 'chart' },
            { id: 'list',     label: 'Lista',    icon: 'grid' },
            { id: 'calendar', label: 'Calendario', icon: 'calendar' },
          ].map((v) => {
            const on = view === v.id;
            return (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`text-[11px] font-bold px-[10px] py-[5px] rounded inline-flex items-center gap-[6px] transition-colors
                  ${on ? 'bg-white text-slate950 shadow-card' : 'text-slate600 hover:text-slate950'}`}>
                <Icon name={v.icon} size={12} />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {view === 'gantt'    && <GanttView    groups={groups}     onPick={setPick} />}
      {view === 'list'     && <ListView     tasks={flatTasks}   onPick={setPick} />}
      {view === 'calendar' && <CalendarView tasks={flatTasks}   onPick={setPick} />}

      <TaskDetail taskId={pick} onClose={() => setPick(null)} onComplete={(id) => store.markComplete(id)} onReopen={(id) => store.reopen(id)} />
      <NuevaTareaModal open={newTaskOpen} onClose={() => setNewTaskOpen(false)} onCreate={addTask} onManageRubros={() => onNav && onNav('rubros')} />
    </>
  );
};

// ============================================================================
// Screen: ALERTAS
// ============================================================================

const ScreenAlerts = ({ onQuickAdd }) => {
  const store = useAlertStore();
  const alerts = store.get();
  const [tab, setTab] = React.useState('activas');
  const [pick, setPick] = React.useState(null);
  const [assignFor, setAssignFor] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const LVL = {
    critical:  { tag: 'CRÍTICA',    pill: 'criticalSolid',  dot: '#EF4444', stripe: '#EF4444', soft: 'bg-critical50',  softText: 'text-[#B91C1C]', icoBg: 'bg-[#FECACA]', icoFg: 'text-[#B91C1C]' },
    attention: { tag: 'IMPORTANTE', pill: 'attentionSolid', dot: '#F59E0B', stripe: '#F59E0B', soft: 'bg-attention50', softText: 'text-[#A16207]', icoBg: 'bg-[#FDE68A]', icoFg: 'text-[#A16207]' },
    moderate:  { tag: 'MODERADA',   pill: 'slate',          dot: '#64748B', stripe: '#94A3B8', soft: 'bg-slate50',     softText: 'text-slate600',  icoBg: 'bg-slate100', icoFg: 'text-slate700' },
  };
  const STATE = {
    open:     { label: 'Sin atender', pill: 'criticalSolid', icon: 'alert' },
    progress: { label: 'En progreso', pill: 'info',          icon: 'clock' },
    resolved: { label: 'Resuelta',    pill: 'successSolid',  icon: 'check' },
  };

  const openCount  = alerts.filter((a) => a.state === 'open').length;
  const critCount  = alerts.filter((a) => a.state !== 'resolved' && a.lvl === 'critical').length;
  const progCount  = alerts.filter((a) => a.state === 'progress').length;
  const resCount   = alerts.filter((a) => a.state === 'resolved').length;

  const tabs = [
    { id: 'activas',   label: 'Activas',    match: (a) => a.state !== 'resolved' },
    { id: 'criticas',  label: 'Críticas',   match: (a) => a.state !== 'resolved' && a.lvl === 'critical' },
    { id: 'progreso',  label: 'En progreso',match: (a) => a.state === 'progress' },
    { id: 'resueltas', label: 'Resueltas',  match: (a) => a.state === 'resolved' },
    { id: 'todas',     label: 'Todas',      match: () => true },
  ];
  const active = tabs.find((t) => t.id === tab) || tabs[0];
  const list = alerts.filter(active.match);

  // Mutations
  const patch = (id, fields) => store.patch(id, fields);
  const resolveAlert = (id) => {
    const a = alerts.find((x) => x.id === id);
    patch(id, { state: 'resolved', resolvedNote: 'Marcada como resuelta manualmente.' });
    if (a) ActivityStore.add({ who: 'JM', kind: 'alerta', time: 'ahora', text: 'resolvió **' + a.title + '**', tags: [a.cat] });
    flash('Alerta resuelta'); setPick((c) => c && c.id === id ? { ...c, state: 'resolved' } : c);
  };
  const reopenAlert  = (id) => { patch(id, { state: 'open' }); flash('Alerta reabierta'); setPick((c) => c && c.id === id ? { ...c, state: 'open' } : c); };
  const startAlert   = (id) => { patch(id, { state: 'progress' }); flash('Alerta en progreso'); setPick((c) => c && c.id === id ? { ...c, state: 'progress' } : c); };
  const assignAlert  = (id, person) => { patch(id, { assignee: person, state: 'progress' }); flash(`Asignada a ${person}`); setPick((c) => c && c.id === id ? { ...c, assignee: person, state: 'progress' } : c); setAssignFor(null); };

  return (
    <>
      <DPageHeader
        title="Alertas de obra"
        subtitle={`${openCount} sin atender · ${critCount} crítica${critCount === 1 ? '' : 's'} activa${critCount === 1 ? '' : 's'}`}
        right={<DButton variant="danger" size="sm" icon={<Icon name="alert" size={13} />} onClick={() => onQuickAdd && onQuickAdd('critico')}>Reportar alerta</DButton>}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="critical"  label="Sin atender"  value={openCount} icon="alert"  delta={openCount ? 'Requieren acción' : 'Todo atendido'} deltaTone={openCount ? 'critical' : 'success'} onClick={() => setTab('activas')} />
        <DStatTile tone="critical"  label="Críticas"     value={critCount} icon="alert"  onClick={() => setTab('criticas')} />
        <DStatTile tone="info"      label="En progreso"  value={progCount} icon="clock"  onClick={() => setTab('progreso')} />
        <DStatTile tone="success"   label="Resueltas"    value={resCount}  icon="check"  delta="Este mes" onClick={() => setTab('resueltas')} />
      </div>

      {/* What is this? helper banner */}
      {openCount > 0 && (
        <div className="flex items-start gap-3 bg-critical50 border border-[#FECACA] rounded-lg p-3 mb-4">
          <span className="w-8 h-8 rounded-md bg-[#FECACA] text-[#B91C1C] flex items-center justify-center flex-none"><Icon name="alert" size={15} /></span>
          <div className="text-[12px] text-slate700 leading-snug flex-1">
            <b className="text-[#B91C1C]">Las alertas son problemas e incidentes de la obra</b> que frenan o ponen en riesgo el avance — fallas de equipo, faltantes de material, temas de seguridad o personal. Resolvelas o asignáselas a alguien del equipo.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate200 mb-4 flex-wrap">
        {tabs.map((t) => {
          const on = tab === t.id;
          const count = alerts.filter(t.match).length;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors
                ${on ? 'text-primary border-primary' : 'text-slate500 border-transparent hover:text-slate700'}`}>
              {t.label}
              <span className={`text-[10px] font-bold px-[6px] py-[2px] rounded-full ${on ? 'bg-primary-50 text-primary' : 'bg-slate100 text-slate700'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Alert cards */}
      <div className="flex flex-col gap-3">
        {list.map((a) => {
          const lv = LVL[a.lvl];
          const st = STATE[a.state];
          const resolved = a.state === 'resolved';
          return (
            <div key={a.id}
              className={`relative border rounded-lg overflow-hidden bg-white border-slate200 hover:shadow-card2 transition-shadow ${resolved ? 'opacity-[0.85]' : ''}`}>
              {/* Left severity stripe */}
              <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ background: lv.stripe }} />
              <div className="pl-5 pr-4 py-4 grid grid-cols-[40px_1fr_auto] gap-3 items-start">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${resolved ? 'bg-success50 text-[#15803D]' : `${lv.icoBg} ${lv.icoFg}`}`}>
                  <Icon name={resolved ? 'check' : 'alert'} size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate400 tnum">{a.id}</span>
                    <DPill tone={lv.pill}>{lv.tag}</DPill>
                    <span className="text-[10px] font-bold text-slate500 bg-slate100 rounded px-[6px] py-[2px]">{a.cat}</span>
                  </div>
                  <button onClick={() => setPick(a)} className="text-[15px] font-bold text-slate950 leading-tight text-left hover:text-primary transition-colors block">{a.title}</button>
                  <div className="text-[11px] text-slate500 mt-[3px] flex items-center gap-[6px] flex-wrap">
                    <span>Reportado por {a.who} · {a.time}</span>
                    {a.assignee && <><span className="text-slate300">·</span><span className="inline-flex items-center gap-1"><DAvatar initials={a.assignee.split(' ').map((w) => w[0]).join('').replace('.', '')} size={16} /> {a.assignee}</span></>}
                  </div>
                  <div className="text-[12px] text-slate700 leading-snug mt-2">{a.desc}</div>
                  {a.link && (
                    <div className="mt-2 inline-flex items-center gap-[6px] text-[11px] font-bold text-primary bg-primary-50 rounded-md px-2 py-1">
                      <Icon name={a.link.type === 'pedido' ? 'package' : 'calendar'} size={11} /> {a.link.label}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-none">
                  <DPill tone={st.pill}>{st.label}</DPill>
                </div>
              </div>
              {/* Action bar */}
              <div className="border-t border-slate100 px-5 py-2 flex items-center gap-2 flex-wrap bg-slate50/50">
                {!resolved ? (
                  <>
                    <DButton variant="primary" size="sm" icon={<Icon name="check" size={12} />} onClick={() => resolveAlert(a.id)}>Resolver</DButton>
                    {a.state === 'open' && <DButton variant="secondary" size="sm" onClick={() => startAlert(a.id)}>Tomar</DButton>}
                    <DButton variant="secondary" size="sm" icon={<Icon name="users" size={12} />} onClick={() => setAssignFor(a)}>{a.assignee ? 'Reasignar' : 'Asignar'}</DButton>
                    <DButton variant="ghost" size="sm" onClick={() => setPick(a)}>Ver detalle</DButton>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-bold text-[#15803D] flex items-center gap-1"><Icon name="check" size={12} /> Resuelta{a.assignee ? ` por ${a.assignee}` : ''}</span>
                    <div className="flex-1" />
                    <DButton variant="secondary" size="sm" onClick={() => reopenAlert(a.id)}>Reabrir</DButton>
                    <DButton variant="ghost" size="sm" onClick={() => setPick(a)}>Ver detalle</DButton>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="text-center text-slate500 py-12 text-[13px] border border-dashed border-slate200 rounded-lg flex flex-col items-center gap-2">
            <span className="w-12 h-12 rounded-full bg-success50 text-[#15803D] flex items-center justify-center"><Icon name="check" size={22} /></span>
            No hay alertas en esta vista.
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {pick && <AlertDrawer alert={pick} LVL={LVL} STATE={STATE} onClose={() => setPick(null)}
        onResolve={resolveAlert} onReopen={reopenAlert} onStart={startAlert} onAssign={() => setAssignFor(pick)} />}

      {/* Assign modal */}
      {assignFor && <AssignModal alert={assignFor} onClose={() => setAssignFor(null)} onAssign={(p) => assignAlert(assignFor.id, p)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

const AssignModal = ({ alert, onClose, onAssign }) => {
  const PEOPLE = [
    { name: 'J. Méndez',  role: 'Director de obra' },
    { name: 'C. Ríos',    role: 'Capataz' },
    { name: 'P. Salas',   role: 'Capataz' },
    { name: 'L. Benítez', role: 'Compras' },
    { name: 'M. Ortiz',   role: 'Capataz' },
    { name: 'A. Gómez',   role: 'Arquitecta' },
  ];
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[420px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center"><Icon name="users" size={16} /></div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">Asignar alerta</div>
              <div className="text-[11px] text-slate500 truncate max-w-[280px]">{alert.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>
        <div className="p-3 max-h-[360px] overflow-y-auto">
          {PEOPLE.map((p) => {
            const init = p.name.split(' ').map((w) => w[0]).join('').replace('.', '');
            const cur = alert.assignee === p.name;
            return (
              <button key={p.name} onClick={() => onAssign(p.name)}
                className={`w-full flex items-center gap-3 px-3 py-[10px] rounded-lg hover:bg-slate50 text-left ${cur ? 'bg-primary-50' : ''}`}>
                <DAvatar initials={init} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate950">{p.name}</div>
                  <div className="text-[11px] text-slate500">{p.role}</div>
                </div>
                {cur ? <span className="text-[10px] font-bold text-primary">Actual</span> : <Icon name="chevron-right" size={14} className="text-slate300" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AlertDrawer = ({ alert, LVL, STATE, onClose, onResolve, onReopen, onStart, onAssign }) => {
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const lv = LVL[alert.lvl];
  const st = STATE[alert.state];
  const resolved = alert.state === 'resolved';
  const initials = (n) => n.split(' ').map((w) => w[0]).join('').replace('.', '');

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[55] bg-slate950/40 backdrop-blur-[2px] animate-fade-task" />
      <aside className="fixed right-0 top-0 bottom-0 z-[60] w-[440px] max-w-[calc(100vw-32px)] bg-white border-l border-slate200 shadow-big flex flex-col animate-slide-task overflow-hidden">
        <div className="px-5 py-4 border-b border-slate200 flex items-start justify-between gap-3 flex-none">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold text-slate400 tnum">{alert.id}</span>
              <DPill tone={lv.pill}>{lv.tag}</DPill>
              <span className="text-[10px] font-bold text-slate500 bg-slate100 rounded px-[6px] py-[2px]">{alert.cat}</span>
            </div>
            <h3 className="text-[18px] font-extrabold display-tight text-slate950 leading-tight">{alert.title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center flex-none"><Icon name="x" size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Status banner */}
          <div className={`px-5 py-4 border-b border-slate200 flex items-center justify-between ${resolved ? 'bg-success50' : lv.soft}`}>
            <DPill tone={st.pill}>{st.label}</DPill>
            <div className="text-[11px] text-slate600">Reportado {alert.time}</div>
          </div>

          {/* Timeline */}
          <div className="px-5 py-4 border-b border-slate200">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Seguimiento</div>
            <div className="space-y-0">
              {[
                { on: true, label: 'Reportada', sub: `${alert.who} · ${alert.time}`, ic: 'alert' },
                { on: alert.state !== 'open', label: 'En progreso', sub: alert.assignee ? `Asignada a ${alert.assignee}` : 'Tomada por el equipo', ic: 'clock' },
                { on: resolved, label: 'Resuelta', sub: resolved ? (alert.resolvedNote || 'Cerrada') : 'Pendiente', ic: 'check' },
              ].map((s, i, arr) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-none ${s.on ? 'bg-success text-white' : 'bg-slate200 text-slate500'}`}><Icon name={s.on ? 'check' : s.ic} size={11} /></span>
                    {i < arr.length - 1 && <span className={`w-[2px] h-7 ${arr[i + 1].on ? 'bg-success' : 'bg-slate200'}`} />}
                  </div>
                  <div className={`pb-3 ${s.on ? '' : 'opacity-60'}`}>
                    <div className="text-[12px] font-bold text-slate950 leading-tight">{s.label}</div>
                    <div className="text-[11px] text-slate500">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-4 border-b border-slate200">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Descripción</div>
            <p className="text-[13px] text-slate700 leading-relaxed">{alert.desc}</p>
            <div className="mt-3 flex items-start gap-2 text-[12px] text-slate700 bg-slate50 border border-slate200 rounded-lg p-3">
              <Icon name="info" size={13} className="text-slate400 mt-[1px] flex-none" />
              <span><b>Impacto:</b> {alert.impact}</span>
            </div>
            {alert.link && (
              <a className="mt-3 flex items-center gap-2 border border-slate200 rounded-lg p-3 hover:border-primary cursor-pointer">
                <span className="w-8 h-8 rounded-md bg-primary-50 text-primary flex items-center justify-center flex-none"><Icon name={alert.link.type === 'pedido' ? 'package' : 'calendar'} size={14} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">{alert.link.type === 'pedido' ? 'Pedido relacionado' : 'Tarea relacionada'}</div>
                  <div className="text-[12px] font-bold text-slate950 truncate">{alert.link.label}</div>
                </div>
                <Icon name="arrow-right" size={14} className="text-slate400" />
              </a>
            )}
          </div>

          {/* Assignment */}
          <div className="px-5 py-4">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Responsable</div>
            {alert.assignee ? (
              <div className="flex items-center gap-3 border border-slate200 rounded-lg p-3">
                <DAvatar initials={initials(alert.assignee)} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold">{alert.assignee}</div>
                  <div className="text-[11px] text-slate500">Trabajando en la alerta</div>
                </div>
                {!resolved && <button onClick={onAssign} className="text-[11px] font-bold text-primary hover:underline">Cambiar</button>}
              </div>
            ) : (
              <button onClick={onAssign} className="w-full flex items-center gap-3 border border-dashed border-slate300 rounded-lg p-3 hover:border-primary text-left">
                <span className="w-9 h-9 rounded-full border-2 border-dashed border-slate300 text-slate400 flex items-center justify-center"><Icon name="plus" size={15} /></span>
                <span className="text-[12px] font-bold text-slate600">Asignar a alguien del equipo</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate200 p-3 flex items-center gap-2 flex-none">
          {!resolved ? (
            <>
              {alert.state === 'open' && <DButton variant="secondary" size="sm" onClick={() => onStart(alert.id)}>Tomar</DButton>}
              <DButton variant="secondary" size="sm" onClick={onAssign}>Asignar</DButton>
              <DButton variant="primary" size="sm" className="flex-1 justify-center" icon={<Icon name="check" size={14} />} onClick={() => onResolve(alert.id)}>Resolver alerta</DButton>
            </>
          ) : (
            <>
              <div className="flex-1 flex items-center gap-2 text-[12px] font-bold text-[#15803D]"><span className="w-6 h-6 rounded-full bg-success50 flex items-center justify-center flex-none"><Icon name="check" size={13} /></span> Resuelta</div>
              <DButton variant="secondary" size="sm" onClick={() => onReopen(alert.id)}>Reabrir</DButton>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

// ============================================================================
// Screen: PEDIDOS (Materials)
// ============================================================================

const ScreenMaterials = ({ onNav }) => {
  const SEED = [
    { id: 'PED-0142', mat: 'Cemento Portland · 50 kg',  qty: '120 bolsas', prov: 'Cementos del Plata', cat: 'Áridos y cementos', date: '15 Jun', ordered: '08 Jun', state: 'delivered',  total: 920000, unit: 'AR$ 7.667', who: 'L. Benítez', urgent: false, note: 'Entrega completa. Descargado en Depósito A.', delivery: { date: '15 Jun 2026 · 09:40', loc: 'Depósito A · acceso lateral', receiver: 'C. Ríos', doc: 'DNI 28.114.502' } },
    { id: 'PED-0141', mat: 'Hierro 12 mm · 12 m',       qty: '2,5 t',     prov: 'Aceros Norte',        cat: 'Hierros',           date: '18 Jun', ordered: '10 Jun', state: 'transit',    total: 1250000, unit: 'AR$ 500.000/t', who: 'L. Benítez', urgent: false, note: 'Despachado. Llega en 2 días.' },
    { id: 'PED-0140', mat: 'Ladrillo cerámico 18×18',   qty: '8.000 u',   prov: 'Cerámica San Pedro',  cat: 'Mampostería',       date: '22 Jun', ordered: '11 Jun', state: 'pending',    total: 920000, unit: 'AR$ 115/u', who: 'P. Salas', urgent: true, note: 'Bloquea inicio de tabiquería. Necesita aprobación hoy.' },
    { id: 'PED-0139', mat: 'Arena fina',                 qty: '15 m³',    prov: 'Áridos Río',           cat: 'Áridos y cementos', date: '13 Jun', ordered: '05 Jun', state: 'late',       total: 315000, unit: 'AR$ 21.000/m³', who: 'C. Ríos', urgent: true, note: 'Entrega prevista para el 11 Jun no llegó. Proveedor confirmó retraso de 24-48 h; nueva fecha estimada 13 Jun.' },
    { id: 'PED-0138', mat: 'Pintura látex blanco',      qty: '40 L',     prov: 'Pinturas Capital',     cat: 'Terminaciones',     date: '02 Jul', ordered: '09 Jun', state: 'approved',   total: 145000, unit: 'AR$ 3.625/L', who: 'M. Ortiz', urgent: false, note: 'Aprobado. Pendiente de despacho del proveedor.' },
    { id: 'PED-0137', mat: 'Cable subterráneo 3×6 mm',  qty: '200 m',    prov: 'Eléctrica Plaza',      cat: 'Eléctrico',         date: '08 Jul', ordered: '07 Jun', state: 'draft',      total: 380000, unit: 'AR$ 1.900/m', who: 'M. Ortiz', urgent: false, note: 'Borrador — falta confirmar metraje final.' },
  ];
  const [orders, setOrders] = React.useState(SEED);
  const [filter, setFilter] = React.useState('Todos');
  const [pick, setPick]     = React.useState(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [toast, setToast]   = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const STATE = {
    delivered: { tone: 'successSolid',   label: 'ENTREGADO',   dot: '#22C55E', icon: 'check',   step: 4 },
    transit:   { tone: 'info',           label: 'EN CAMINO',   dot: '#3B82F6', icon: 'truck',   step: 3 },
    approved:  { tone: 'primary',        label: 'APROBADO',    dot: '#0F4395', icon: 'check',   step: 2 },
    pending:   { tone: 'attentionSolid', label: 'POR APROBAR', dot: '#F59E0B', icon: 'clock',   step: 1 },
    late:      { tone: 'criticalSolid',  label: 'DEMORADO',    dot: '#EF4444', icon: 'alert',   step: 3 },
    draft:     { tone: 'slate',          label: 'BORRADOR',    dot: '#94A3B8', icon: 'edit',    step: 0 },
    cancelled: { tone: 'slate',          label: 'CANCELADO',   dot: '#94A3B8', icon: 'x',       step: 0 },
  };
  const fmt = (n) => 'AR$ ' + (Number(n) || 0).toLocaleString('es-AR');

  const filters = [
    { id: 'Todos',      fn: () => true },
    { id: 'Por aprobar',fn: (o) => o.state === 'pending' },
    { id: 'En camino',  fn: (o) => o.state === 'transit' },
    { id: 'Demorados',  fn: (o) => o.state === 'late' },
    { id: 'Entregados', fn: (o) => o.state === 'delivered' },
    { id: 'Cancelados', fn: (o) => o.state === 'cancelled' },
  ];
  const activeFilter = filters.find((f) => f.id === filter) || filters[0];
  const list = orders.filter(activeFilter.fn);

  const pendCount  = orders.filter((o) => o.state === 'pending').length;
  const transCount = orders.filter((o) => o.state === 'transit').length;
  const lateCount  = orders.filter((o) => o.state === 'late').length;
  const monthSum   = orders.reduce((a, o) => a + o.total, 0);

  const approve = (id) => { setOrders((p) => p.map((o) => o.id === id ? { ...o, state: 'approved', note: 'Aprobado. Pendiente de despacho.' } : o)); flash('Pedido aprobado'); setPick((cur) => cur && cur.id === id ? { ...cur, state: 'approved' } : cur); };
  const cancelOrder = (id) => { setOrders((p) => p.map((o) => o.id === id ? { ...o, state: 'cancelled', urgent: false, note: 'Pedido cancelado.' } : o)); flash('Pedido cancelado'); setPick(null); };
  const [deliverFor, setDeliverFor] = React.useState(null); // order pending a delivery record
  const markDelivered = (id, delivery) => {
    setOrders((p) => p.map((o) => o.id === id ? { ...o, state: 'delivered', urgent: false, delivery, note: 'Entrega registrada.' } : o));
    flash('Entrega registrada');
    setPick(null); setDeliverFor(null);
  };
  const addOrder = (d) => { setOrders((p) => [d, ...p]); flash('Pedido creado'); setNewOpen(false); };

  return (
    <>
      <DPageHeader
        title="Pedidos de materiales"
        subtitle={`${orders.length} pedidos · ${pendCount} esperan tu aprobación`}
        right={<DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => setNewOpen(true)}>Nuevo pedido</DButton>}
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="attention" label="Por aprobar"  value={pendCount}  icon="clock"   delta={pendCount ? 'Requieren acción' : 'Al día'} deltaTone={pendCount ? 'critical' : 'success'} onClick={() => setFilter('Por aprobar')} />
        <DStatTile tone="info"      label="En tránsito"  value={transCount} icon="truck"   onClick={() => setFilter('En camino')} />
        <DStatTile tone="critical"  label="Demorados"    value={lateCount}  icon="alert"   onClick={() => setFilter('Demorados')} />
        <DStatTile tone="success"   label="Total del mes" value={fmt(monthSum).replace('AR$ ', '')} suffix="AR$" icon="dollar" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-slate200 mb-4 flex-wrap">
        {filters.map((f) => {
          const on = filter === f.id;
          const n = orders.filter(f.fn).length;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors
                ${on ? 'text-primary border-primary' : 'text-slate500 border-transparent hover:text-slate700'}`}>
              {f.id}
              <span className={`text-[10px] font-bold px-[6px] py-[2px] rounded-full ${on ? 'bg-primary-50 text-primary' : 'bg-slate100 text-slate700'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* Order cards */}
      <div className="grid grid-cols-2 gap-3">
        {list.map((o) => {
          const s = STATE[o.state];
          return (
            <button key={o.id} onClick={() => setPick(o)}
              className="text-left bg-white border border-slate200 rounded-lg overflow-hidden hover:border-primary hover:shadow-card2 transition-all group flex flex-col self-start w-full">
              {/* Top color strip by state */}
              <div className="h-[3px] w-full" style={{ background: s.dot }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-[2px]">
                      <span className="text-[10px] font-bold text-slate400 tnum">{o.id}</span>
                      {o.urgent && <DPill tone="criticalSolid">URGENTE</DPill>}
                    </div>
                    <div className="text-[15px] font-extrabold text-slate950 leading-tight group-hover:text-primary transition-colors">{o.mat}</div>
                  </div>
                  <span className="flex-none self-start"><DPill tone={s.tone}>{s.label}</DPill></span>
                </div>

                <div className="flex items-center gap-2 text-[12px] text-slate600 mb-3">
                  <Icon name="truck" size={13} className="text-slate400" />
                  <span className="truncate">{o.prov}</span>
                  <span className="text-slate300">·</span>
                  <span className="text-slate500">{o.cat}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate100">
                  <div>
                    <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate400">Cantidad</div>
                    <div className="text-[13px] font-bold text-slate950 tnum">{o.qty}</div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate400">Llegada</div>
                    <div className="text-[13px] font-bold text-slate950">{o.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate400">Total</div>
                    <div className="text-[13px] font-extrabold text-slate950 tnum">{fmt(o.total)}</div>
                  </div>
                </div>

                {o.state === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate100" onClick={(e) => e.stopPropagation()}>
                    <DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => approve(o.id)}>Aprobar</DButton>
                    <DButton variant="secondary" size="sm" onClick={() => setPick(o)}>Ver</DButton>
                  </div>
                )}
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <div className="col-span-2 text-center text-slate500 py-12 text-[13px] border border-dashed border-slate200 rounded-lg">No hay pedidos en este filtro.</div>
        )}
      </div>

      {/* Detail drawer */}
      {pick && <OrderDrawer order={pick} STATE={STATE} fmt={fmt} onClose={() => setPick(null)} onApprove={approve} onCancel={cancelOrder} onDeliver={(id) => setDeliverFor(orders.find((o) => o.id === id))} />}
      {/* New order modal */}
      {newOpen && <NewOrderModal STATE={STATE} fmt={fmt} onClose={() => setNewOpen(false)} onSave={addOrder} count={orders.length} onManageRubros={() => onNav && onNav('rubros')} />}
      {/* Delivery reception modal */}
      {deliverFor && <DeliveryModal order={deliverFor} onClose={() => setDeliverFor(null)} onSave={(del) => markDelivered(deliverFor.id, del)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

// Delivery reception modal — records when/where/who received an order
const DeliveryModal = ({ order, onClose, onSave }) => {
  const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  const [d, setD] = React.useState({ date: '', time: '', loc: '', receiver: '', doc: '' });
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  const canSave = d.loc.trim() && d.receiver.trim();
  const submit = () => {
    if (!canSave) return;
    const dateLabel = d.date
      ? new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) + (d.time ? ' · ' + d.time : '')
      : today + (d.time ? ' · ' + d.time : '');
    onSave({ date: dateLabel, loc: d.loc.trim(), receiver: d.receiver.trim(), doc: d.doc.trim() || '—' });
  };
  return (
    <div onClick={onClose} className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[480px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-success50 text-[#15803D] flex items-center justify-center"><Icon name="check" size={16} /></div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">Registrar entrega</div>
              <div className="text-[11px] text-slate500">{order.id} · {order.mat}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Fecha de recepción</span>
              <input type="date" value={d.date} onChange={(e) => set({ date: e.target.value })}
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
              <span className="text-[10px] text-slate400">Vacío = hoy ({today})</span>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Hora</span>
              <input type="time" value={d.time} onChange={(e) => set({ time: e.target.value })}
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>
          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">Lugar de entrega*</span>
            <input value={d.loc} onChange={(e) => set({ loc: e.target.value })} placeholder="Ej: Depósito A · acceso lateral"
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Recibido por*</span>
              <input value={d.receiver} onChange={(e) => set({ receiver: e.target.value })} placeholder="Nombre y apellido"
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Documento</span>
              <input value={d.doc} onChange={(e) => set({ doc: e.target.value })} placeholder="DNI 28.114.502"
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>
        </div>
        <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave}
            className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${canSave ? 'bg-success hover:bg-[#15803D] text-white' : 'bg-slate200 text-slate500 cursor-not-allowed'}`}>
            Confirmar entrega <Icon name="check" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Order detail drawer with status timeline
const OrderDrawer = ({ order, STATE, fmt, onClose, onApprove, onCancel, onDeliver }) => {
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const s = STATE[order.state];
  const STEPS = [
    { key: 'draft',    label: 'Creado',     n: 0 },
    { key: 'pending',  label: 'Por aprobar', n: 1 },
    { key: 'approved', label: 'Aprobado',   n: 2 },
    { key: 'transit',  label: 'En camino',  n: 3 },
    { key: 'delivered',label: 'Entregado',  n: 4 },
  ];
  const curStep = order.state === 'late' ? 3 : s.step;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[55] bg-slate950/40 backdrop-blur-[2px] animate-fade-task" />
      <aside className="fixed right-0 top-0 bottom-0 z-[60] w-[440px] max-w-[calc(100vw-32px)] bg-white border-l border-slate200 shadow-big flex flex-col animate-slide-task overflow-hidden">
        <div className="px-5 py-4 border-b border-slate200 flex items-start justify-between gap-3 flex-none">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 tnum">{order.id}</span>
              {order.urgent && <DPill tone="criticalSolid">URGENTE</DPill>}
            </div>
            <h3 className="text-[18px] font-extrabold display-tight text-slate950 leading-tight">{order.mat}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center flex-none"><Icon name="x" size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Status + total banner */}
          <div className="px-5 py-4 bg-slate50 border-b border-slate200 flex items-center justify-between">
            <DPill tone={s.tone}>{s.label}</DPill>
            <div className="text-right">
              <div className="text-[20px] font-extrabold tnum text-slate950 leading-none">{fmt(order.total)}</div>
              <div className="text-[10px] text-slate500 mt-[2px]">{order.unit}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-5 py-4 border-b border-slate200">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Estado del pedido</div>
            <div className="space-y-0">
              {STEPS.map((st, i) => {
                const reached = st.n <= curStep;
                const isLateHere = order.state === 'late' && st.key === 'transit';
                return (
                  <div key={st.key} className="flex items-center gap-3 relative">
                    <div className="flex flex-col items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-none text-[10px] font-bold
                        ${isLateHere ? 'bg-critical text-white' : reached ? 'bg-success text-white' : 'bg-slate200 text-slate500'}`}>
                        {reached ? <Icon name={isLateHere ? 'alert' : 'check'} size={11} /> : st.n + 1}
                      </span>
                      {i < STEPS.length - 1 && <span className={`w-[2px] h-6 ${st.n < curStep ? 'bg-success' : 'bg-slate200'}`} />}
                    </div>
                    <div className={`text-[12px] font-semibold pb-3 ${reached ? 'text-slate950' : 'text-slate400'}`}>
                      {st.label}
                      {isLateHere && <span className="text-[#B91C1C] font-bold"> · demorado</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details grid */}
          <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-slate200">
            {[
              ['Proveedor', order.prov],
              ['Rubro', order.cat],
              ['Cantidad', order.qty],
              ['Precio unitario', order.unit],
              ['Pedido el', order.ordered],
              ['Llegada estimada', order.date],
              ['Solicitado por', order.who],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-1">{l}</div>
                <div className="text-[12px] font-semibold text-slate950">{v}</div>
              </div>
            ))}
          </div>

          {/* Delivery record (shown once delivered) */}
          {order.state === 'delivered' && order.delivery && (
            <div className="px-5 py-4 border-b border-slate200">
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-[#15803D] mb-2 flex items-center gap-1">
                <Icon name="check" size={12} /> Recepción confirmada
              </div>
              <div className="bg-success50 border border-[#BBF7D0] rounded-lg p-3 space-y-2">
                {[
                  ['Fecha y hora', order.delivery.date, 'clock'],
                  ['Lugar de entrega', order.delivery.loc, 'box'],
                  ['Recibido por', order.delivery.receiver, 'users'],
                  ['Documento', order.delivery.doc, 'receipt'],
                ].map(([l, v, ic]) => (
                  <div key={l} className="flex items-start gap-2">
                    <Icon name={ic} size={13} className="text-[#15803D] mt-[1px] flex-none" />
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-[0.04em] uppercase font-bold text-[#15803D]/70">{l}</div>
                      <div className="text-[12px] font-semibold text-slate900">{v}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {order.note && (
            <div className="px-5 py-4">
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Observaciones</div>
              <div className={`text-[12px] leading-snug rounded-lg p-3 ${order.state === 'late' || order.urgent ? 'bg-critical50 text-[#B91C1C]' : 'bg-slate50 text-slate700'}`}>{order.note}</div>
            </div>
          )}
        </div>

        <div className="border-t border-slate200 p-3 flex items-center gap-2 flex-none">
          {order.state === 'pending' ? (
            <>
              <DButton variant="secondary" size="sm" className="text-[#B91C1C]" onClick={() => onCancel(order.id)}>Cancelar pedido</DButton>
              <DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => onApprove(order.id)}>Aprobar pedido</DButton>
            </>
          ) : order.state === 'cancelled' || order.state === 'delivered' ? (
            <DButton variant="secondary" size="sm" className="flex-1 justify-center" icon={<Icon name="download" size={13} />}>Comprobante</DButton>
          ) : (
            <>
              <DButton variant="secondary" size="sm" className="text-[#B91C1C]" onClick={() => onCancel(order.id)}>Cancelar</DButton>
              <DButton variant="primary" size="sm" className="flex-1 justify-center" icon={<Icon name="check" size={13} />} onClick={() => onDeliver(order.id)}>Registrar entrega</DButton>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

const NewOrderModal = ({ STATE, fmt, onClose, onSave, count, onManageRubros }) => {
  const rubroStore = useRubroStore();
  const cats = rubroStore.names();
  const [d, setD] = React.useState({ mat: '', prov: '', cat: rubroStore.names()[0] || '', qty: '', unit: 'bolsas', total: '', date: '', who: 'L. Benítez', urgent: false });
  const [addingCat, setAddingCat] = React.useState(false);
  const [newCat, setNewCat] = React.useState('');
  const [units, setUnits] = React.useState(['bolsas', 'u', 'm³', 'm', 'm²', 'kg', 't', 'L', 'barras', 'cajas', 'rollos', 'global']);
  const [addingUnit, setAddingUnit] = React.useState(false);
  const [newUnit, setNewUnit] = React.useState('');
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  const canSave = d.mat.trim() && Number(d.total) > 0;
  const people = ['L. Benítez', 'C. Ríos', 'P. Salas', 'M. Ortiz'];
  const confirmCat = () => {
    const v = newCat.trim();
    if (v) { if (!cats.includes(v)) setCats((p) => [...p, v]); set({ cat: v }); }
    setAddingCat(false); setNewCat('');
  };
  const confirmUnit = () => {
    const v = newUnit.trim();
    if (v) { if (!units.includes(v)) setUnits((p) => [...p, v]); set({ unit: v }); }
    setAddingUnit(false); setNewUnit('');
  };
  const submit = () => {
    if (!canSave) return;
    const qtyLabel = d.qty.trim() ? `${d.qty.trim()} ${d.unit}` : '—';
    onSave({
      id: 'PED-' + String(143 + count).padStart(4, '0'),
      mat: d.mat.trim(), prov: d.prov.trim() || 'Sin proveedor', cat: d.cat,
      qty: qtyLabel, total: Number(d.total),
      unit: '—',
      date: d.date ? new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '—',
      ordered: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      state: 'pending', who: d.who, urgent: d.urgent,
      note: d.urgent ? 'Marcado como urgente al crear.' : 'Pedido nuevo, pendiente de aprobación.',
    });
  };
  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[520px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center"><Icon name="package" size={16} /></div>
            <div className="text-[15px] font-extrabold display-tight">Nuevo pedido</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">Material*</span>
            <input value={d.mat} onChange={(e) => set({ mat: e.target.value })} placeholder="Ej: Cemento Portland · 50 kg"
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Proveedor</span>
              <input value={d.prov} onChange={(e) => set({ prov: e.target.value })} placeholder="Ej: Cementos del Plata"
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate700">Rubro</span>
                <button type="button" onClick={() => setAddingCat(true)}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]"><Icon name="plus" size={10} /> Nuevo rubro</button>
              </div>
              <select value={d.cat} onChange={(e) => set({ cat: e.target.value })}
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate700">Cantidad</span>
                {!addingUnit && (
                  <button type="button" onClick={() => { setAddingUnit(true); setNewUnit(''); }}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]"><Icon name="plus" size={10} /> Unidad</button>
                )}
              </div>
              <div className="flex gap-2">
                <input type="number" min="0" value={d.qty} onChange={(e) => set({ qty: e.target.value })} placeholder="0"
                  className="w-[90px] bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
                {addingUnit ? (
                  <div className="flex gap-1 flex-1 min-w-0">
                    <input autoFocus value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmUnit(); else if (e.key === 'Escape') setAddingUnit(false); }}
                      placeholder="Nueva unidad"
                      className="flex-1 min-w-0 bg-white border border-primary rounded-md px-2 py-[9px] text-[13px] focus:outline-none" />
                    <button type="button" onClick={confirmUnit} className="px-2 rounded-md bg-primary text-white flex items-center justify-center"><Icon name="check" size={14} /></button>
                    <button type="button" onClick={() => setAddingUnit(false)} className="px-2 rounded-md border border-slate200 text-slate500 flex items-center justify-center"><Icon name="x" size={14} /></button>
                  </div>
                ) : (
                  <select value={d.unit} onChange={(e) => set({ unit: e.target.value })}
                    className="flex-1 min-w-0 bg-white border border-slate200 rounded-md px-2 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                    {units.map((u) => <option key={u}>{u}</option>)}
                  </select>
                )}
              </div>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Total (AR$)*</span>
              <input type="number" min="0" value={d.total} onChange={(e) => set({ total: e.target.value })} placeholder="0"
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Llegada estimada</span>
              <input type="date" value={d.date} onChange={(e) => set({ date: e.target.value })}
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>
          {/* Urgent toggle */}
          <button type="button" onClick={() => set({ urgent: !d.urgent })}
            className={`w-full flex items-center gap-3 rounded-lg border px-3 py-[10px] transition-colors text-left
              ${d.urgent ? 'bg-critical50 border-[#FECACA]' : 'bg-white border-slate200 hover:border-slate300'}`}>
            <span className={`w-9 h-[22px] rounded-full p-[2px] flex-none transition-colors ${d.urgent ? 'bg-critical' : 'bg-slate300'}`}>
              <span className={`block w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${d.urgent ? 'translate-x-[16px]' : 'translate-x-0'}`} />
            </span>
            <span className="flex-1 min-w-0">
              <span className={`block text-[13px] font-bold ${d.urgent ? 'text-[#B91C1C]' : 'text-slate950'}`}>Pedido urgente</span>
              <span className="block text-[11px] text-slate500">Se prioriza y notifica al director de obra.</span>
            </span>
            {d.urgent && <Icon name="alert" size={16} className="text-[#B91C1C]" />}
          </button>
        </div>
        <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave}
            className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${canSave ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed'}`}>
            Crear pedido <Icon name="check" size={14} />
          </button>
        </div>
      </div>
      {addingCat && <CategoryModal open={true} initial={null} onClose={() => setAddingCat(false)} onManage={onManageRubros}
        onSave={(cat) => { set({ cat: cat.name }); setAddingCat(false); }} />}
    </div>
  );
};

// ============================================================================
// Screen: REPORTES
// ============================================================================

const ScreenActivity = ({ onQuickAdd }) => {
  const actStore = useActivityStore();
  const groups = actStore.byDay();
  const kindIcon = {
    tarea:    { ico: 'check',    tint: 'bg-success50 text-[#15803D]' },
    stock:    { ico: 'box',      tint: 'bg-success50 text-[#15803D]' },
    equipo:   { ico: 'users',    tint: 'bg-success50 text-[#15803D]' },
    recibo:   { ico: 'receipt',  tint: 'bg-attention50 text-[#A16207]' },
    avance:   { ico: 'check',    tint: 'bg-success50 text-[#15803D]' },
    foto:     { ico: 'photo',    tint: 'bg-info50 text-[#1D4ED8]' },
    problema: { ico: 'alert',    tint: 'bg-critical50 text-[#B91C1C]' },
    pedido:   { ico: 'package',  tint: 'bg-attention50 text-[#A16207]' },
    cierre:   { ico: 'calendar', tint: 'bg-primary-50 text-primary' },
  };
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState(null);
  const suggested = [
    '¿Cuántas horas se trabajaron esta semana?',
    '¿Qué pedidos vencen en los próximos 7 días?',
    'Resumen de problemas críticos del mes',
  ];
  const answersDB = {
    '¿Cuántas horas se trabajaron esta semana?': 'Se trabajaron **184 hs** esta semana, 12% menos que la anterior. Caída atribuible a la falla de Grúa Torre 2 (jueves).',
    '¿Qué pedidos vencen en los próximos 7 días?': 'Vencen 4 pedidos: **PED-0140** (Ladrillo, 22 Oct), **PED-0141** (Hierro 12 mm, 18 Oct), **PED-0143** (Arena, 21 Oct) y **PED-0144** (Pintura, 23 Oct). 1 está sin aprobar.',
    'Resumen de problemas críticos del mes': 'Este mes hubo **6 alertas críticas**: 3 por faltantes de material, 2 por fallas técnicas y 1 por accidente leve. Tiempo promedio de resolución: 14 hs.',
  };
  const ask = (q) => { setQuestion(q); setAnswer(answersDB[q] || 'Analizando reportes…'); };

  return (
    <>
      <DPageHeader
        title="Actividad de la obra"
        subtitle="Todo lo que el bot capturó desde WhatsApp, en un solo lugar."
        right={
          <>
            <DButton variant="secondary" size="sm" icon={<Icon name="download" size={13} />}>Exportar PDF</DButton>
            <DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => onQuickAdd && onQuickAdd('reporte')}>Nueva actividad</DButton>
          </>
        }
      />

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.d}>
              <div className="text-[11px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">{g.d}</div>
              <DCard padding="p-0">
                {g.items.map((r, i) => {
                  const k = kindIcon[r.kind] || kindIcon.avance;
                  const person = TEAM_PEOPLE.find((p) => p.who === r.who) || { name: r.who, role: '' };
                  return (
                    <div key={i} className={`grid grid-cols-[40px_1fr_24px] gap-3 p-4 items-start ${i < g.items.length - 1 ? 'border-b border-slate200' : ''}`}>
                      <DAvatar initials={r.who} size={36} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <b className="text-[13px] text-slate950">{person.name}</b>
                          <span className="text-[10px] text-slate500">{person.role ? person.role + ' · ' : ''}{r.time}</span>
                          <span className={`w-5 h-5 rounded inline-flex items-center justify-center ${k.tint}`}>
                            <Icon name={k.ico} size={11} />
                          </span>
                        </div>
                        <div className="text-[12px] text-slate700 leading-snug mb-2"
                          dangerouslySetInnerHTML={{ __html: r.text.replace(/\*\*(.+?)\*\*/g, '<b class="text-slate950">$1</b>') }} />
                        <div className="flex gap-[6px] flex-wrap">
                          {(r.tags || []).map((t) => (
                            <DPill key={t} tone={r.severity === 'critical' && t === 'Crítico' ? 'criticalSolid' : 'slate'}>{t}</DPill>
                          ))}
                        </div>
                      </div>
                      <button className="text-slate500"><Icon name="more" size={14} /></button>
                    </div>
                  );
                })}
              </DCard>
            </div>
          ))}
        </div>

        <DCard padding="p-0" className="self-start">
          <div className="px-4 py-3 border-b border-slate200 flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-ink-deep text-accent flex items-center justify-center">
              <Icon name="sparkle" size={13} />
            </span>
            <div className="text-[13px] font-bold">Preguntale a tu actividad</div>
          </div>
          <div className="p-4">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Sugeridas</div>
            <div className="flex flex-col gap-2">
              {suggested.map((q) => (
                <button key={q} onClick={() => ask(q)}
                  className="text-left text-[12px] text-slate700 bg-slate50 hover:bg-primary-50 hover:text-primary border border-slate200 rounded-lg p-3 leading-snug transition-colors">
                  {q}
                </button>
              ))}
            </div>

            {answer && (
              <div className="mt-3 bg-ink-deep text-white rounded-lg p-3 relative overflow-hidden">
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-accent mb-1">Respuesta IA</div>
                <div className="text-[12px] leading-snug"
                  dangerouslySetInnerHTML={{ __html: answer.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') }} />
              </div>
            )}
          </div>
          <div className="p-3 border-t border-slate200 flex gap-2 items-center">
            <input value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escribí tu pregunta..."
              className="flex-1 text-[12px] bg-white border border-slate300 rounded-md px-3 py-[7px] outline-none focus:border-primary" />
            <DButton variant="primary" size="sm" icon={<Icon name="arrow-right" size={13} />} onClick={() => ask(question)} />
          </div>
        </DCard>
      </div>
    </>
  );
};

// ============================================================================
// Screen: EQUIPO
// ============================================================================

// ── Data ────────────────────────────────────────────────────────────────────
const TEAM_PEOPLE = [
  { who: 'JM', name: 'J. Méndez',  full: 'Juan Méndez',      role: 'Director de obra', email: 'juan.mendez@constructora-norte.com.ar', phone: '+54 11 5234 8821', since: 'Mar 2025', status: 'online',  last: 'ahora',        tasks: 14, done: 11, reports: 38, alerts: 6, orders: 22 },
  { who: 'CR', name: 'C. Ríos',    full: 'Carlos Ríos',      role: 'Capataz',          email: 'carlos.rios@constructora-norte.com.ar',  phone: '+54 11 4487 1120', since: 'Mar 2025', last: 'hace 12 min',  status: 'online',  tasks: 7,  done: 5,  reports: 22, alerts: 3, orders: 2 },
  { who: 'PS', name: 'P. Salas',   full: 'Pablo Salas',      role: 'Capataz',          email: 'pablo.salas@constructora-norte.com.ar',  phone: '+54 11 6690 4471', since: 'Abr 2025', last: 'hace 2 h',     status: 'away',    tasks: 9,  done: 4,  reports: 31, alerts: 5, orders: 1 },
  { who: 'LB', name: 'L. Benítez', full: 'Lucía Benítez',    role: 'Compras',          email: 'lucia.benitez@constructora-norte.com.ar',phone: '+54 11 3312 7765', since: 'Mar 2025', last: 'hace 40 min',  status: 'online',  tasks: 4,  done: 4,  reports: 18, alerts: 1, orders: 19 },
  { who: 'MO', name: 'M. Ortiz',   full: 'Marcos Ortiz',     role: 'Capataz',          email: 'marcos.ortiz@constructora-norte.com.ar', phone: '+54 11 2245 9083', since: 'May 2025', last: 'ayer 18:05',   status: 'offline', tasks: 6,  done: 2,  reports: 12, alerts: 2, orders: 0 },
  { who: 'AG', name: 'A. Gómez',   full: 'Ana Gómez',        role: 'Arquitecta',       email: 'ana.gomez@estudioag.com.ar',             phone: '+54 11 7781 3390', since: 'Mar 2025', last: 'hace 5 h',     status: 'away',    tasks: 3,  done: 3,  reports: 9,  alerts: 1, orders: 0 },
];

const TEAM_ROLES_DEF = [
  { name: 'Director de obra', locked: true,  color: '#0F4395', desc: 'Acceso total. Aprueba pedidos, gestiona el equipo y la configuración.',
    perms: { cronograma: [1,1], pedidos: [1,1], stock: [1,1], recibos: [1,1], presupuesto: [1,1], alertas: [1,1], equipo: [1,1], config: [1,1] } },
  { name: 'Capataz', locked: false, color: '#22C55E', desc: 'Opera en obra: reporta avances, resuelve alertas y ajusta stock.',
    perms: { cronograma: [1,1], pedidos: [1,0], stock: [1,1], recibos: [0,0], presupuesto: [0,0], alertas: [1,1], equipo: [1,0], config: [0,0] } },
  { name: 'Compras', locked: false, color: '#F59E0B', desc: 'Gestiona pedidos, proveedores y comprobantes de gasto.',
    perms: { cronograma: [1,0], pedidos: [1,1], stock: [1,1], recibos: [1,1], presupuesto: [1,0], alertas: [1,0], equipo: [1,0], config: [0,0] } },
  { name: 'Arquitecta', locked: false, color: '#3B82F6', desc: 'Consulta avance, planos y fotos. No modifica datos operativos.',
    perms: { cronograma: [1,0], pedidos: [1,0], stock: [1,0], recibos: [0,0], presupuesto: [1,0], alertas: [1,0], equipo: [1,0], config: [0,0] } },
  { name: 'Cliente / propietario', locked: false, color: '#94A3B8', desc: 'Solo lectura del avance y del presupuesto.',
    perms: { cronograma: [1,0], pedidos: [0,0], stock: [0,0], recibos: [0,0], presupuesto: [1,0], alertas: [0,0], equipo: [0,0], config: [0,0] } },
];

const TEAM_AREAS = [
  { id: 'cronograma', label: 'Cronograma' }, { id: 'pedidos', label: 'Pedidos' },
  { id: 'stock', label: 'Stock' },           { id: 'recibos', label: 'Recibos' },
  { id: 'presupuesto', label: 'Presupuesto' },{ id: 'alertas', label: 'Alertas' },
  { id: 'equipo', label: 'Equipo' },         { id: 'config', label: 'Configuración' },
];

const TEAM_LOG = [
  { d: 'Hoy',   items: [
    { who: 'JM', kind: 'tarea',   text: 'marcó completada **Hormigonado losa +3**', time: '08:42' },
    { who: 'LB', kind: 'pedido',  text: 'aprobó el pedido **PED-0142 · Cemento**',  time: '09:15' },
    { who: 'CR', kind: 'foto',    text: 'subió **4 fotos** del armado de columnas',  time: '10:15' },
    { who: 'PS', kind: 'alerta',  text: 'reportó **Falla en Grúa Torre 2**',         time: '12:48' },
    { who: 'LB', kind: 'stock',   text: 'cargó **120 bolsas** de cemento al stock',  time: '13:20' },
  ]},
  { d: 'Ayer',  items: [
    { who: 'JM', kind: 'equipo',  text: 'invitó a **M. Ortiz** como Capataz',        time: '16:02' },
    { who: 'MO', kind: 'reporte', text: 'envió el cierre de jornada',                time: '18:05' },
    { who: 'AG', kind: 'alerta',  text: 'resolvió **Andamio sin protección**',       time: '11:30' },
  ]},
  { d: '18 Ago', items: [
    { who: 'JM', kind: 'rol',     text: 'cambió el rol de **A. Gómez** a Arquitecta', time: '09:10' },
    { who: 'LB', kind: 'recibo',  text: 'cargó el comprobante **Aceros Norte**',      time: '14:44' },
  ]},
];

const LOG_KIND = {
  tarea:   { ico: 'calendar', tint: 'bg-primary-50 text-primary' },
  pedido:  { ico: 'package',  tint: 'bg-attention50 text-[#A16207]' },
  foto:    { ico: 'grid',     tint: 'bg-info50 text-[#1D4ED8]' },
  alerta:  { ico: 'alert',    tint: 'bg-critical50 text-[#B91C1C]' },
  stock:   { ico: 'box',      tint: 'bg-success50 text-[#15803D]' },
  reporte: { ico: 'chart',    tint: 'bg-info50 text-[#1D4ED8]' },
  equipo:  { ico: 'users',    tint: 'bg-success50 text-[#15803D]' },
  rol:     { ico: 'check-circle', tint: 'bg-slate100 text-slate700' },
  recibo:  { ico: 'receipt',  tint: 'bg-attention50 text-[#A16207]' },
};

const STATUS_DOT = { online: '#22C55E', away: '#F59E0B', offline: '#CBD5E1' };
const STATUS_LBL = { online: 'En línea', away: 'Ausente', offline: 'Desconectado' };
const bold = (s) => ({ __html: s.replace(/\*\*(.+?)\*\*/g, '<b class="text-slate950">$1</b>') });

// ── Screen ──────────────────────────────────────────────────────────────────
const ScreenTeam = ({ onNav }) => {
  const [rawTab, setTab] = React.useState('personas');
  // Fail-safe: si el tab no existe (p. ej. removido), cae a Personas.
  const tab = ['personas', 'obreros', 'roles'].includes(rawTab) ? rawTab : 'personas';
  const [pick, setPick] = React.useState(null);
  const [roleOpen, setRoleOpen] = React.useState(null);
  const [obrerosOpen, setObrerosOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };
  const [obreros, setObreros] = React.useState([
    { id: 1, name: 'Ramón Díaz',    phone: '+54 11 5567 2034', link: 'wa.me/buildata/ob-9f2a1c4d', sent: true },
    { id: 2, name: 'Luis Paniagua', phone: '+54 11 4421 8890', link: 'wa.me/buildata/ob-3b7e0a92', sent: true },
    { id: 3, name: 'Óscar Rivas',   phone: '+54 11 3390 5512', link: 'wa.me/buildata/ob-c41d7fe0', sent: false },
  ]);

  const online = TEAM_PEOPLE.filter((p) => p.status === 'online').length;
  const totalTasks = TEAM_PEOPLE.reduce((a, p) => a + p.tasks, 0);
  const totalReports = TEAM_PEOPLE.reduce((a, p) => a + p.reports, 0);

  const TABS = [
    { id: 'personas',  label: 'Personas',  n: TEAM_PEOPLE.length },
    { id: 'obreros',   label: 'Obreros',   n: obreros.length },
    { id: 'roles',     label: 'Roles',     n: TEAM_ROLES_DEF.length },
  ];

  return (
    <>
      <DPageHeader
        title="Equipo de trabajo"
        subtitle={"" + TEAM_PEOPLE.length + " personas con acceso · " + obreros.length + " obreros por WhatsApp · " + online + " en línea"}
        right={
          <>
            <DButton variant="secondary" size="sm" icon={<Icon name="message" size={13} />} onClick={() => setObrerosOpen(true)}>Invitar obrero</DButton>
            <DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => flash('Invitación por email enviada')}>Invitar por email</DButton>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="primary" label="Con acceso"      value={TEAM_PEOPLE.length} icon="users"   delta={online + " en línea"} deltaTone="success" onClick={() => setTab('personas')} />
        <DStatTile tone="success" label="Obreros WhatsApp" value={obreros.length}    icon="message" delta={obreros.filter((o) => o.sent).length + " vinculados"} onClick={() => setTab('obreros')} />
        <DStatTile tone="info"    label="Tareas asignadas" value={totalTasks}        icon="calendar" onClick={() => onNav && onNav('gantt')} />
        <DStatTile tone="attention" label="Reportes"       value={totalReports}      icon="chart"   delta="Este mes" onClick={() => onNav && onNav('activity')} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate200 mb-4 flex-wrap">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={"flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors " + (on ? 'text-primary border-primary' : 'text-slate500 border-transparent hover:text-slate700')}>
              {t.label}
              <span className={"text-[10px] font-bold px-[6px] py-[2px] rounded-full " + (on ? 'bg-primary-50 text-primary' : 'bg-slate100 text-slate700')}>{t.n}</span>
            </button>
          );
        })}
      </div>

      {/* ── PERSONAS ── */}
      {tab === 'personas' && (
        <div className="grid grid-cols-3 gap-3">
          {TEAM_PEOPLE.map((p) => {
            const rd = TEAM_ROLES_DEF.find((r) => r.name === p.role) || TEAM_ROLES_DEF[1];
            const pctDone = Math.round((p.done / p.tasks) * 100);
            return (
              <button key={p.who} onClick={() => setPick(p)}
                className="text-left bg-white border border-slate200 rounded-lg overflow-hidden hover:border-primary hover:shadow-card2 transition-all group flex flex-col self-start w-full">
                <div className="h-[3px] w-full" style={{ background: rd.color }} />
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative flex-none">
                      <DAvatar initials={p.who} size={44} />
                      <span className="absolute -bottom-[1px] -right-[1px] w-[13px] h-[13px] rounded-full border-2 border-white" style={{ background: STATUS_DOT[p.status] }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold leading-tight text-slate950 group-hover:text-primary transition-colors truncate">{p.full}</div>
                      <div className="text-[11px] font-bold mt-[3px] inline-flex items-center gap-[5px]" style={{ color: rd.color }}>
                        <span className="w-[6px] h-[6px] rounded-full" style={{ background: rd.color }} />{p.role}
                      </div>
                      <div className="text-[10px] text-slate400 mt-[2px]">Activo {p.last}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold tracking-[0.06em] uppercase text-slate500">Tareas</span>
                      <span className="font-bold tnum text-slate700">{p.done}/{p.tasks}</span>
                    </div>
                    <div className="h-[5px] bg-slate100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: pctDone + '%', background: rd.color }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate100">
                    {[['Reportes', p.reports], ['Alertas', p.alerts], ['Pedidos', p.orders]].map(([l, v]) => (
                      <div key={l}>
                        <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate400">{l}</div>
                        <div className="text-[15px] font-extrabold tnum text-slate950 leading-tight">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── OBREROS ── */}
      {tab === 'obreros' && (
        <DCard padding="p-0">
          <div className="px-5 py-3 border-b border-slate200 flex items-center justify-between gap-3">
            <div>
              <div className="text-[14px] font-bold flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-[#25D366]/15 text-[#15803D] flex items-center justify-center"><Icon name="message" size={12} /></span>
                Obreros por WhatsApp
              </div>
              <div className="text-[11px] text-slate500 mt-[2px]">Reportan avances por chat, sin cuenta ni acceso a la app.</div>
            </div>
            <DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => setObrerosOpen(true)}>Invitar obrero</DButton>
          </div>
          {obreros.length === 0 ? (
            <div className="text-center text-slate500 text-[13px] py-10">Todavía no invitaste obreros.</div>
          ) : (
            <div className="divide-y divide-slate100">
              {obreros.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <DAvatar initials={o.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate950 truncate">{o.name}</div>
                    <div className="text-[11px] text-slate500">{o.phone}</div>
                  </div>
                  <button onClick={() => flash('Link copiado')} className="text-[11px] font-bold text-primary hover:underline hidden sm:block">Copiar link</button>
                  <DPill tone={o.sent ? 'successSolid' : 'attentionSolid'}>{o.sent ? 'Vinculado' : 'Pendiente'}</DPill>
                </div>
              ))}
            </div>
          )}
        </DCard>
      )}

      {/* ── ROLES ── */}
      {tab === 'roles' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-primary-50 border border-primary/15 rounded-lg p-3">
            <span className="w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center flex-none"><Icon name="users" size={15} /></span>
            <div className="text-[12px] text-slate700 leading-snug flex-1">
              Cada rol define qué puede <b className="text-slate950">ver</b> y <b className="text-slate950">editar</b> en la obra. Los cambios se aplican a todas las personas con ese rol.
            </div>
            <DButton variant="secondary" size="sm" icon={<Icon name="plus" size={12} />} onClick={() => flash('Abrí Configuración › Roles para crear uno nuevo')}>Nuevo rol</DButton>
          </div>

          {TEAM_ROLES_DEF.map((r) => {
            const holders = TEAM_PEOPLE.filter((p) => p.role === r.name);
            const open = roleOpen === r.name;
            const edits = TEAM_AREAS.filter((a) => r.perms[a.id][1]).length;
            const views = TEAM_AREAS.filter((a) => r.perms[a.id][0]).length;
            return (
              <div key={r.name} className="bg-white border border-slate200 rounded-lg overflow-hidden">
                <button onClick={() => setRoleOpen(open ? null : r.name)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate50 text-left">
                  <span className="w-9 h-9 rounded-md flex items-center justify-center flex-none" style={{ background: r.color + '22', color: r.color }}><Icon name="users" size={15} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate950 flex items-center gap-2">
                      {r.name}
                      {r.locked && <span className="text-[9px] font-bold text-slate500 bg-slate100 rounded px-[5px] py-[1px]">FIJO</span>}
                    </div>
                    <div className="text-[11px] text-slate500 truncate">{r.desc}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-none">
                    <div className="flex -space-x-2">
                      {holders.slice(0, 3).map((h) => <div key={h.who} className="ring-2 ring-white rounded-full"><DAvatar initials={h.who} size={22} /></div>)}
                      {holders.length === 0 && <span className="text-[10px] text-slate400 font-semibold">Sin asignar</span>}
                    </div>
                    <span className="hidden sm:flex items-center gap-1 flex-none">
                      <span className="text-[9px] font-bold px-[6px] py-[3px] rounded bg-info50 text-[#1D4ED8] tnum">{views} ve</span>
                      <span className="text-[9px] font-bold px-[6px] py-[3px] rounded bg-success50 text-[#15803D] tnum">{edits} edita</span>
                    </span>
                    <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} className="text-slate400" />
                  </div>
                </button>
                {open && (
                  <div className="border-t border-slate200 bg-slate50/60">
                    {/* Leyenda */}
                    <div className="flex items-center gap-4 px-4 pt-3 pb-2 flex-wrap">
                      <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Permisos por área</span>
                      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate500">
                        <span className="inline-flex items-center gap-[5px]"><span className="w-[14px] h-[14px] rounded bg-info50 text-[#1D4ED8] inline-flex items-center justify-center"><Icon name="check" size={9} /></span>Puede ver</span>
                        <span className="inline-flex items-center gap-[5px]"><span className="w-[14px] h-[14px] rounded bg-success50 text-[#15803D] inline-flex items-center justify-center"><Icon name="check" size={9} /></span>Puede editar</span>
                        <span className="inline-flex items-center gap-[5px]"><span className="w-[14px] h-[14px] rounded bg-slate200 text-slate400 inline-flex items-center justify-center"><Icon name="x" size={9} /></span>Sin acceso</span>
                      </div>
                    </div>

                    {/* Tabla de permisos */}
                    <div className="px-4 pb-4">
                      <div className="bg-white border border-slate200 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[1fr_84px_84px] items-center px-3 py-2 bg-slate50 border-b border-slate200">
                          <span className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate500">Área</span>
                          <span className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate500 text-center">Ver</span>
                          <span className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate500 text-center">Editar</span>
                        </div>
                        {TEAM_AREAS.map((a, i) => {
                          const [v, e] = r.perms[a.id];
                          const Cell = ({ on, tone }) => (
                            <div className="flex justify-center">
                              <span className={"w-[22px] h-[22px] rounded-md inline-flex items-center justify-center " +
                                (on ? (tone === 'view' ? 'bg-info50 text-[#1D4ED8]' : 'bg-success50 text-[#15803D]') : 'bg-slate100 text-slate300')}>
                                <Icon name={on ? 'check' : 'x'} size={12} />
                              </span>
                            </div>
                          );
                          return (
                            <div key={a.id}
                              className={"grid grid-cols-[1fr_84px_84px] items-center px-3 py-[9px] " +
                                (i < TEAM_AREAS.length - 1 ? 'border-b border-slate100 ' : '') +
                                (!v && !e ? 'opacity-55' : '')}>
                              <span className="text-[12px] font-semibold text-slate800 truncate">{a.label}</span>
                              <Cell on={v} tone="view" />
                              <Cell on={e} tone="edit" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Personas con este rol + acceso a edición */}
                    <div className="px-4 pb-4 flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 flex-none">Con este rol</span>
                        {holders.length === 0 ? (
                          <span className="text-[11px] text-slate400 italic">Nadie asignado</span>
                        ) : (
                          <div className="flex items-center gap-[6px] flex-wrap">
                            {holders.map((h) => (
                              <span key={h.who} className="inline-flex items-center gap-[6px] bg-white border border-slate200 rounded-full pl-[3px] pr-2 py-[3px]">
                                <DAvatar initials={h.who} size={18} />
                                <span className="text-[11px] font-semibold text-slate700">{h.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {!r.locked && (
                        <DButton variant="secondary" size="sm" icon={<Icon name="edit" size={12} />} onClick={() => flash('Abrí Configuración › Roles para editar permisos')}>Editar permisos</DButton>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {/* ── Person drawer ── */}
      {pick && <PersonDrawer person={pick} onClose={() => setPick(null)} flash={flash} />}

      {/* ── Obreros modal ── */}
      {obrerosOpen && (
        <div onClick={() => setObrerosOpen(false)} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[620px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
            <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between flex-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#25D366]/15 text-[#15803D] flex items-center justify-center"><Icon name="message" size={16} /></div>
                <div className="text-[15px] font-extrabold display-tight">Invitar obreros por WhatsApp</div>
              </div>
              <button onClick={() => setObrerosOpen(false)} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {window.ObrerosInviter && <window.ObrerosInviter obreros={obreros} setObreros={setObreros} />}
            </div>
            <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex justify-end flex-none">
              <DButton variant="primary" size="sm" onClick={() => setObrerosOpen(false)}>Listo</DButton>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

// ── Person profile drawer ───────────────────────────────────────────────────
const PersonDrawer = ({ person: p, onClose, flash }) => {
  const [tab, setTab] = React.useState('perfil');
  const [msgOpen, setMsgOpen] = React.useState(false);
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const rd = TEAM_ROLES_DEF.find((r) => r.name === p.role) || TEAM_ROLES_DEF[1];
  const myLog = ActivityStore.forPerson(p.who).map((i) => ({ ...i, d: i.day }));

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[55] bg-slate950/40 backdrop-blur-[2px] animate-fade-task" />
      <aside className="fixed right-0 top-0 bottom-0 z-[60] w-[440px] max-w-[calc(100vw-32px)] bg-white border-l border-slate200 shadow-big flex flex-col animate-slide-task overflow-hidden">
        {/* Header */}
        <div className="blueprint-bg px-5 pt-5 pb-6 text-white relative flex-none">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"><Icon name="x" size={16} /></button>
          <div className="flex items-center gap-3">
            <div className="relative flex-none">
              <div className="w-[56px] h-[56px] rounded-full ring-2 ring-white/25 overflow-hidden"><DAvatar initials={p.who} size={56} /></div>
              <span className="absolute bottom-0 right-0 w-[15px] h-[15px] rounded-full border-2 border-[#131B2E]" style={{ background: STATUS_DOT[p.status] }} />
            </div>
            <div className="min-w-0">
              <div className="text-[18px] font-extrabold display-tight leading-tight text-white">{p.full}</div>
              <div className="text-[11px] font-bold mt-1 inline-flex items-center gap-[6px] px-2 py-[3px] rounded-full text-white" style={{ background: rd.color + '55' }}>
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: rd.color }} />{p.role}
              </div>
              <div className="text-[11px] text-white/55 mt-[6px]">{STATUS_LBL[p.status]} · activo {p.last}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate200 flex-none">
          {[['perfil', 'Perfil'], ['permisos', 'Permisos'], ['historial', 'Historial']].map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)}
              className={"flex-1 text-[12px] font-bold py-3 border-b-2 transition-colors " + (tab === id ? 'text-primary border-primary' : 'text-slate500 border-transparent hover:text-slate700')}>{l}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'perfil' && (
            <>
              <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate200">
                {[['Tareas', p.done + '/' + p.tasks], ['Reportes', p.reports], ['Alertas', p.alerts]].map(([l, v]) => (
                  <div key={l} className="border border-slate200 rounded-lg p-3">
                    <div className="text-[18px] font-extrabold tnum text-slate950 leading-none">{v}</div>
                    <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate500 mt-1">{l}</div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Contacto</div>
                {[['Email', p.email, 'message'], ['Teléfono', p.phone, 'message'], ['En la obra desde', p.since, 'calendar']].map(([l, v, ic]) => (
                  <div key={l} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-md bg-slate100 text-slate600 flex items-center justify-center flex-none"><Icon name={ic} size={13} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">{l}</div>
                      <div className="text-[12px] font-semibold text-slate950 truncate">{v}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'permisos' && (
            <div className="p-5">
              <div className="flex items-start gap-2 bg-slate50 border border-slate200 rounded-lg p-3 mb-4 text-[12px] text-slate700 leading-snug">
                <Icon name="info" size={13} className="text-slate400 mt-[1px] flex-none" />
                <span>Estos permisos vienen del rol <b className="text-slate950">{p.role}</b>. Cambialos desde Configuración › Roles.</span>
              </div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[9px] tracking-[0.06em] uppercase text-slate500 border-b border-slate200">
                    <th className="text-left font-bold pb-2">Área</th>
                    <th className="font-bold pb-2 w-[54px] text-center">Ver</th>
                    <th className="font-bold pb-2 w-[54px] text-center">Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {TEAM_AREAS.map((a) => {
                    const [v, e] = rd.perms[a.id];
                    const Dot = ({ on }) => (
                      <span className={"inline-flex w-5 h-5 rounded-full items-center justify-center " + (on ? 'bg-success50 text-[#15803D]' : 'bg-slate100 text-slate300')}>
                        <Icon name={on ? 'check' : 'x'} size={11} />
                      </span>
                    );
                    return (
                      <tr key={a.id} className="border-b border-slate100">
                        <td className="py-[9px] font-semibold text-slate800">{a.label}</td>
                        <td className="py-[9px] text-center"><Dot on={v} /></td>
                        <td className="py-[9px] text-center"><Dot on={e} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'historial' && (
            <div className="p-5">
              {myLog.length === 0 ? (
                <div className="text-center text-slate500 text-[13px] py-10">Sin actividad registrada.</div>
              ) : (
                <div className="space-y-0">
                  {myLog.map((it, i) => {
                    const k = LOG_KIND[it.kind] || LOG_KIND.rol;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <span className={"w-7 h-7 rounded-full flex items-center justify-center flex-none " + k.tint}><Icon name={k.ico} size={12} /></span>
                          {i < myLog.length - 1 && <span className="w-[2px] h-8 bg-slate200" />}
                        </div>
                        <div className="pb-4 min-w-0">
                          <div className="text-[12px] text-slate700 leading-snug" dangerouslySetInnerHTML={bold(it.text)} />
                          <div className="text-[10px] text-slate500 mt-[2px]">{it.d} · {it.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate200 p-3 flex flex-col gap-2 flex-none">
          <a href={`Perfil.html?p=${encodeURIComponent(p.who)}`}
            className="w-full inline-flex items-center justify-center gap-2 font-bold rounded-md border transition-colors bg-primary hover:bg-primary-700 text-white border-primary text-[13px] px-4 py-[9px]">
            <Icon name="users" size={14} /> Ver perfil completo
          </a>
          <div className="flex items-center gap-2">
            <DButton variant="secondary" size="sm" icon={<Icon name="message" size={13} />} onClick={() => setMsgOpen(true)}>Mensaje</DButton>
            <DButton variant="secondary" size="sm" onClick={() => flash('Abrí Configuración › Roles')}>Cambiar rol</DButton>
            <div className="flex-1" />
            <DButton variant="secondary" size="sm" className="text-[#B91C1C]" onClick={() => flash('Acceso removido')}>Quitar</DButton>
          </div>
        </div>
      </aside>

      {msgOpen && <MessageComposer person={p} onClose={() => setMsgOpen(false)} onSent={(t) => { setMsgOpen(false); flash(t); }} />}
    </>
  );
};

// ── Composer de mensaje por WhatsApp ────────────────────────────────────────
const MessageComposer = ({ person: p, onClose, onSent }) => {
  const QUICK = [
    { label: 'Pedir estado de avance', text: 'Hola ' + p.full.split(' ')[0] + ', ¿me pasás el estado de avance de tus tareas de hoy?' },
    { label: 'Recordar cierre de jornada', text: 'Hola ' + p.full.split(' ')[0] + ', no olvides mandar el cierre de jornada antes de irte.' },
    { label: 'Consultar por una alerta', text: 'Hola ' + p.full.split(' ')[0] + ', ¿cómo viene la alerta que reportaste? ¿Necesitás algo?' },
  ];
  const [text, setText] = React.useState('');
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const can = text.trim().length > 0;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[460px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        {/* Header estilo WhatsApp */}
        <div className="px-5 py-4 flex items-center gap-3 flex-none" style={{ background: '#075E54' }}>
          <DAvatar initials={p.who} size={38} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-white truncate">{p.full}</div>
            <div className="text-[11px] text-white/60 flex items-center gap-[6px]">
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: STATUS_DOT[p.status] }} />
              {p.phone}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center flex-none"><Icon name="x" size={16} /></button>
        </div>

        <div className="p-5">
          <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Mensajes rápidos</div>
          <div className="flex flex-col gap-2 mb-4">
            {QUICK.map((q) => (
              <button key={q.label} onClick={() => setText(q.text)}
                className="text-left text-[12px] text-slate700 bg-slate50 border border-slate200 hover:border-primary hover:bg-primary-50 hover:text-primary rounded-lg px-3 py-[9px] leading-snug transition-colors">
                {q.label}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">Mensaje</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus
              placeholder={'Escribile a ' + p.full.split(' ')[0] + '…'}
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[80px]" />
          </label>

          {/* Preview de burbuja */}
          {can && (
            <div className="mt-3 rounded-lg p-3" style={{ background: '#ECE5DD' }}>
              <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Vista previa</div>
              <div className="flex justify-end">
                <div className="max-w-[85%] text-[12px] text-slate800 leading-snug rounded-lg rounded-br-sm px-3 py-2 shadow-card" style={{ background: '#DCF8C6' }}>
                  {text}
                  <div className="text-[9px] text-slate500 text-right mt-1">
                    {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-3 text-[11px] text-slate500 leading-snug">
            <Icon name="info" size={12} className="text-slate400 mt-[1px] flex-none" />
            Se envía por el bot de BuildData al WhatsApp de {p.full.split(' ')[0]} y queda registrado en la actividad de la obra.
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate200 bg-slate50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
          <button onClick={() => can && onSent('Mensaje enviado a ' + p.full.split(' ')[0])} disabled={!can}
            className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (can ? 'text-white' : 'bg-slate200 text-slate500 cursor-not-allowed')}
            style={can ? { background: '#25D366' } : undefined}>
            <Icon name="message" size={14} /> Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Sidebar + Topbar + Shell
// ============================================================================

// ============================================================================
// Screen: STOCK / MATERIALES (inventory)
// ============================================================================

const ScreenStock = () => {
  const SEED = [
    { id: 's1', name: 'Cemento Portland 50 kg', cat: 'Áridos y cementos', unit: 'bolsas', qty: 84,  min: 40,  loc: 'Depósito A', photo: '' },
    { id: 's2', name: 'Arena fina',             cat: 'Áridos y cementos', unit: 'm³',     qty: 12,  min: 8,   loc: 'Playa', photo: '' },
    { id: 's3', name: 'Hierro 12 mm × 12 m',    cat: 'Hierros',           unit: 'barras', qty: 18,  min: 60,  loc: 'Depósito B', photo: '' },
    { id: 's4', name: 'Hierro 8 mm × 12 m',     cat: 'Hierros',           unit: 'barras', qty: 120, min: 50,  loc: 'Depósito B', photo: '' },
    { id: 's5', name: 'Ladrillo cerámico 18×18',cat: 'Mampostería',       unit: 'u',      qty: 3200,min: 2000,loc: 'Playa', photo: '' },
    { id: 's6', name: 'Cal hidratada 25 kg',    cat: 'Mampostería',       unit: 'bolsas', qty: 26,  min: 30,  loc: 'Depósito A', photo: '' },
    { id: 's7', name: 'Cable 3×6 mm',           cat: 'Eléctrico',         unit: 'm',      qty: 240, min: 100, loc: 'Pañol', photo: '' },
    { id: 's8', name: 'Caño PVC 110 mm',        cat: 'Sanitario',         unit: 'u',      qty: 14,  min: 20,  loc: 'Pañol', photo: '' },
  ];
  const [items, setItems]   = React.useState(SEED);
  const [cats, setCats]     = React.useState(['Áridos y cementos', 'Hierros', 'Mampostería', 'Eléctrico', 'Sanitario']);
  const [filter, setFilter] = React.useState('Todos');
  const [view, setView]     = React.useState('grid'); // grid | list
  const [editItem, setEditItem] = React.useState(null);   // item being edited (or {} for new)
  const [catModal, setCatModal] = React.useState(false);
  const [toast, setToast]   = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const status = (it) => it.qty <= 0 ? 'out' : it.qty < it.min ? 'low' : 'ok';
  const STAT = {
    ok:  { label: 'OK',      tone: 'success',        dot: '#22C55E' },
    low: { label: 'BAJO',    tone: 'attentionSolid', dot: '#F59E0B' },
    out: { label: 'SIN STOCK', tone: 'criticalSolid', dot: '#EF4444' },
  };
  // Color accent per category for the photo placeholder
  const CAT_COLOR = { 'Áridos y cementos': '#94A3B8', 'Hierros': '#0F4395', 'Mampostería': '#22C55E', 'Eléctrico': '#F59E0B', 'Sanitario': '#3B82F6' };
  const catColor = (c) => CAT_COLOR[c] || '#8B5CF6';

  const low = items.filter((i) => status(i) === 'low').length;
  const out = items.filter((i) => status(i) === 'out').length;
  const filters = ['Todos', ...cats];
  const list = items.filter((i) => filter === 'Todos' || i.cat === filter);

  const adjust = (id, delta) => setItems((p) => p.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i));
  const saveItem = (data) => {
    if (data.id) setItems((p) => p.map((i) => i.id === data.id ? data : i));
    else setItems((p) => [...p, { ...data, id: 'i-' + Date.now() }]);
    flash(data.id ? 'Material actualizado' : 'Material agregado');
    setEditItem(null);
  };
  const delItem = (id) => { setItems((p) => p.filter((i) => i.id !== id)); setEditItem(null); flash('Material eliminado'); };
  const addCat = (name) => { if (name && !cats.includes(name)) { setCats((p) => [...p, name]); flash('Categoría creada'); } setCatModal(false); };

  // Photo thumbnail (image or generated placeholder)
  const Thumb = ({ it, size }) => (
    it.photo
      ? <img src={it.photo} alt={it.name} style={{ width: size, height: size }} className="rounded-lg object-cover flex-none border border-slate200" />
      : <div style={{ width: size, height: size, background: catColor(it.cat) + '1A', color: catColor(it.cat) }} className="rounded-lg flex items-center justify-center flex-none border border-slate200">
          <Icon name="box" size={Math.round(size * 0.42)} />
        </div>
  );

  return (
    <>
      <DPageHeader
        title="Stock de materiales"
        subtitle={`${items.length} materiales · ${low} bajo mínimo · ${out} sin stock`}
        right={
          <>
            <DButton variant="secondary" size="sm" icon={<Icon name="layers" size={13} />} onClick={() => setCatModal(true)}>Nueva categoría</DButton>
            <DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => setEditItem({ name: '', cat: cats[0], unit: 'u', qty: 0, min: 0, loc: '', photo: '' })}>Agregar material</DButton>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="primary"   label="Materiales"   value={items.length} icon="box" />
        <DStatTile tone="success"   label="En nivel"     value={items.filter((i) => status(i) === 'ok').length} icon="check" />
        <DStatTile tone="attention" label="Bajo mínimo"  value={low} icon="alert" onClick={() => setFilter('Todos')} />
        <DStatTile tone="critical"  label="Sin stock"    value={out} icon="package" />
      </div>

      {/* Toolbar: filter tabs + view toggle */}
      <div className="flex items-end gap-3 mb-4 border-b border-slate200">
        <div className="flex gap-1 flex-1 min-w-0 overflow-x-auto">
          {filters.map((f) => {
            const on = filter === f;
            const n = f === 'Todos' ? items.length : items.filter((i) => i.cat === f).length;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors whitespace-nowrap flex-none
                  ${on ? 'text-primary border-primary' : 'text-slate500 border-transparent hover:text-slate700'}`}>
                {f}
                <span className={`text-[10px] font-bold px-[6px] py-[2px] rounded-full ${on ? 'bg-primary-50 text-primary' : 'bg-slate100 text-slate700'}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <div className="flex bg-slate100 rounded-md p-[2px] flex-none mb-2">
          <button onClick={() => setView('grid')} className={`p-[6px] rounded ${view === 'grid' ? 'bg-white shadow-card text-slate950' : 'text-slate500'}`}><Icon name="grid" size={14} /></button>
          <button onClick={() => setView('list')} className={`p-[6px] rounded ${view === 'list' ? 'bg-white shadow-card text-slate950' : 'text-slate500'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((it) => {
            const st = STAT[status(it)];
            const pctMin = it.min > 0 ? Math.min(100, Math.round((it.qty / it.min) * 100)) : 100;
            return (
              <div key={it.id} className="bg-white border border-slate200 rounded-lg overflow-hidden hover:shadow-card2 hover:border-slate300 transition-all group">
                <div className="p-4 flex gap-3">
                  <Thumb it={it} size={64} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[14px] font-extrabold text-slate950 leading-tight truncate">{it.name}</div>
                      <button onClick={() => setEditItem(it)} className="text-slate400 hover:text-primary p-1 -mt-1 -mr-1 flex-none"><Icon name="edit" size={14} /></button>
                    </div>
                    <div className="text-[11px] text-slate500 mt-[2px] flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1"><span className="w-[6px] h-[6px] rounded-full" style={{ background: catColor(it.cat) }} />{it.cat}</span>
                    </div>
                    <div className="text-[11px] text-slate500 mt-[2px]">{it.loc || 'Sin ubicación'}</div>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  {/* Stock bar */}
                  <div className="flex items-end justify-between mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[20px] font-extrabold tnum text-slate950 leading-none">{it.qty}</span>
                      <span className="text-[11px] text-slate500">{it.unit}</span>
                    </div>
                    <DPill tone={st.tone}>{st.label}</DPill>
                  </div>
                  <div className="h-[5px] bg-slate100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: pctMin + '%', background: st.dot }} />
                  </div>
                  <div className="text-[10px] text-slate400 mt-1">mínimo {it.min} {it.unit}</div>
                </div>
                <div className="px-4 py-2 border-t border-slate100 flex items-center gap-2">
                  <button onClick={() => adjust(it.id, -1)} className="w-7 h-7 rounded-md border border-slate200 hover:bg-slate100 text-slate600 flex items-center justify-center"><Icon name="minus" size={13} /></button>
                  <button onClick={() => adjust(it.id, +1)} className="w-7 h-7 rounded-md border border-slate200 hover:bg-slate100 text-slate600 flex items-center justify-center"><Icon name="plus" size={13} /></button>
                  <button onClick={() => setEditItem(it)} className="ml-auto text-[11px] font-bold text-primary hover:underline">Editar</button>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="col-span-2 xl:col-span-3 text-center text-slate500 py-12 text-[13px] border border-dashed border-slate200 rounded-lg">No hay materiales en esta categoría.</div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <DCard padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-slate50">
                  {['Material','Categoría','Ubicación','Disponible','Estado','Ajustar',''].map((h) => (
                    <th key={h} className="text-[9px] tracking-[0.06em] uppercase text-slate500 text-left font-bold px-4 py-[10px] border-b border-slate200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((it, i) => {
                  const st = STAT[status(it)];
                  return (
                    <tr key={it.id} className={i < list.length - 1 ? 'border-b border-slate200' : ''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb it={it} size={38} />
                          <div>
                            <div className="font-bold text-slate950">{it.name}</div>
                            <div className="text-[10px] text-slate500">mínimo {it.min} {it.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate600">{it.cat}</td>
                      <td className="px-4 py-3 text-slate600">{it.loc || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-[15px] tnum text-slate950">{it.qty}</span>
                        <span className="text-slate500"> {it.unit}</span>
                      </td>
                      <td className="px-4 py-3"><DPill tone={st.tone}>{st.label}</DPill></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => adjust(it.id, -1)} className="w-7 h-7 rounded-md border border-slate200 hover:bg-slate100 text-slate600 flex items-center justify-center"><Icon name="minus" size={13} /></button>
                          <button onClick={() => adjust(it.id, +1)} className="w-7 h-7 rounded-md border border-slate200 hover:bg-slate100 text-slate600 flex items-center justify-center"><Icon name="plus" size={13} /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditItem(it)} className="text-slate500 hover:text-primary p-1"><Icon name="edit" size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate500 py-10 text-[13px]">No hay materiales en esta categoría.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </DCard>
      )}

      {/* Edit / add material modal */}
      {editItem && <StockItemModal item={editItem} cats={cats} catColor={catColor} onClose={() => setEditItem(null)} onSave={saveItem} onDelete={delItem} />}
      {/* New category modal */}
      {catModal && <NewCategoryModal onClose={() => setCatModal(false)} onSave={addCat} existing={cats} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

const StockItemModal = ({ item, cats, catColor, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState({ ...item });
  const fileRef = React.useRef(null);
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  const canSave = (d.name || '').trim().length >= 2;
  const isNew = !d.id;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[480px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center"><Icon name="box" size={16} /></div>
            <div className="text-[15px] font-extrabold display-tight">{isNew ? 'Agregar material' : 'Editar material'}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Photo uploader */}
          <div className="flex items-center gap-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = (ev) => set({ photo: ev.target.result });
                reader.readAsDataURL(f);
              }} />
            <div className="relative flex-none">
              {d.photo
                ? <img src={d.photo} alt="" className="w-20 h-20 rounded-lg object-cover border border-slate200" />
                : <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate300 flex items-center justify-center"
                    style={{ background: (catColor ? catColor(d.cat) : '#0F4395') + '12', color: catColor ? catColor(d.cat) : '#0F4395' }}>
                    <Icon name="box" size={26} />
                  </div>}
              {d.photo && (
                <button onClick={() => set({ photo: '' })}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate200 shadow-card text-slate500 hover:text-[#B91C1C] flex items-center justify-center"><Icon name="x" size={12} /></button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-slate800 mb-1">Foto del material</div>
              <div className="text-[11px] text-slate500 leading-snug mb-2">Subí una imagen para identificarlo más rápido en el inventario.</div>
              <DButton variant="secondary" size="sm" icon={<Icon name="upload" size={13} />} onClick={() => fileRef.current && fileRef.current.click()}>
                {d.photo ? 'Cambiar foto' : 'Subir foto'}
              </DButton>
            </div>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">Nombre*</span>
            <input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej: Cemento Portland 50 kg"
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate700">Categoría</span>
                {onAddCat && <button type="button" onClick={onAddCat} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]"><Icon name="plus" size={10} /> Nueva</button>}
              </div>
              <select value={d.cat} onChange={(e) => set({ cat: e.target.value })}
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Unidad</span>
              <input value={d.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="bolsas, m³, u…"
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Cantidad</span>
              <input type="number" min="0" value={d.qty} onChange={(e) => set({ qty: Math.max(0, parseInt(e.target.value) || 0) })}
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Mínimo</span>
              <input type="number" min="0" value={d.min} onChange={(e) => set({ min: Math.max(0, parseInt(e.target.value) || 0) })}
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Ubicación</span>
              <input value={d.loc} onChange={(e) => set({ loc: e.target.value })} placeholder="Depósito A"
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>
        </div>
        <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-between">
          {!isNew
            ? <button onClick={() => onDelete(d.id)} className="text-[12px] font-bold text-[#B91C1C] hover:underline flex items-center gap-1"><Icon name="trash" size={13} /> Eliminar</button>
            : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
            <button onClick={() => canSave && onSave(d)} disabled={!canSave}
              className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${canSave ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed'}`}>
              Guardar <Icon name="check" size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewCategoryModal = ({ onClose, onSave, existing, title = 'Nueva categoría', label = 'Nombre de la categoría*', placeholder = 'Ej: Pinturas y revestimientos', dupMsg = 'Esa categoría ya existe.' }) => {
  const [name, setName] = React.useState('');
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const dup = existing.includes(name.trim());
  const canSave = name.trim().length >= 2 && !dup;
  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[400px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center"><Icon name="layers" size={16} /></div>
            <div className="text-[15px] font-extrabold display-tight">{title}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>
        <div className="p-6">
          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">{label}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder={placeholder}
              onKeyDown={(e) => e.key === 'Enter' && canSave && onSave(name.trim())}
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            {dup && <span className="text-[11px] text-[#B91C1C]">{dupMsg}</span>}
          </label>
        </div>
        <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
          <button onClick={() => canSave && onSave(name.trim())} disabled={!canSave}
            className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${canSave ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed'}`}>
            Crear <Icon name="check" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Screen: RECIBOS (receipts)
// ============================================================================

const ScreenReceipts = () => {
  const SEED = [
    { id: 'r1', concept: 'Cemento × 120 bolsas',  prov: 'Cementos del Plata', cat: 'Materiales',  date: '15 May', amount: 480000,  status: 'pagado',     file: 'recibo-0142.pdf' },
    { id: 'r2', concept: 'Hierro 12 mm × 2,5 t',   prov: 'Aceros Norte',       cat: 'Materiales',  date: '12 May', amount: 1250000, status: 'pendiente',  file: 'factura-A-883.pdf' },
    { id: 'r3', concept: 'Alquiler grúa torre',    prov: 'GruasSur SRL',       cat: 'Equipos',     date: '10 May', amount: 890000,  status: 'pagado',     file: 'recibo-grua-05.pdf' },
    { id: 'r4', concept: 'Jornales cuadrilla S19', prov: 'Nómina interna',     cat: 'Mano de obra', date: '08 May', amount: 1640000, status: 'pagado',     file: 'liquidacion-s19.pdf' },
    { id: 'r5', concept: 'Flete áridos',           prov: 'Transportes Río',    cat: 'Logística',   date: '06 May', amount: 220000,  status: 'pendiente',  file: 'remito-3920.pdf' },
    { id: 'r6', concept: 'Pintura látex × 40 L',   prov: 'Pinturas Capital',   cat: 'Materiales',  date: '03 May', amount: 145000,  status: 'pagado',     file: 'recibo-0138.pdf' },
  ];
  const [receipts, setReceipts] = React.useState(SEED);
  const [filter, setFilter] = React.useState('Todos');
  const [addOpen, setAddOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const [cats, setCats] = React.useState(['Materiales', 'Mano de obra', 'Equipos', 'Logística', 'Servicios']);
  const [catModal, setCatModal] = React.useState(false);
  const addCat = (name) => { if (name && !cats.includes(name)) { setCats((p) => [...p, name]); flash('Categoría creada'); } setCatModal(false); };
  const filters = ['Todos', 'Pendientes', ...cats];
  const fmt = (n) => 'AR$ ' + (Number(n) || 0).toLocaleString('es-AR');

  const list = receipts.filter((r) =>
    filter === 'Todos' ? true : filter === 'Pendientes' ? r.status === 'pendiente' : r.cat === filter);

  const totalMonth   = receipts.reduce((a, r) => a + r.amount, 0);
  const pendingCount = receipts.filter((r) => r.status === 'pendiente').length;
  const pendingSum   = receipts.filter((r) => r.status === 'pendiente').reduce((a, r) => a + r.amount, 0);

  const addReceipt = (d) => {
    setReceipts((p) => [{ ...d, id: 'r-' + Date.now() }, ...p]);
    flash('Recibo cargado');
    setAddOpen(false);
  };
  const togglePaid = (id) => setReceipts((p) => p.map((r) => r.id === id ? { ...r, status: r.status === 'pagado' ? 'pendiente' : 'pagado' } : r));

  const CAT_TINT = {
    'Materiales':   'bg-primary-50 text-primary',
    'Mano de obra': 'bg-success50 text-[#15803D]',
    'Equipos':      'bg-info50 text-[#1D4ED8]',
    'Logística':    'bg-attention50 text-[#A16207]',
    'Servicios':    'bg-slate100 text-slate700',
  };

  return (
    <>
      <DPageHeader
        title="Recibos y comprobantes"
        subtitle={`${receipts.length} comprobantes · ${pendingCount} pendientes de pago`}
        right={
          <>
            <DButton variant="secondary" size="sm" icon={<Icon name="layers" size={13} />} onClick={() => setCatModal(true)}>Nueva categoría</DButton>
            <DButton variant="primary" size="sm" icon={<Icon name="upload" size={13} />} onClick={() => setAddOpen(true)}>Cargar recibo</DButton>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <DStatTile tone="primary"   label="Total del mes"     value={fmt(totalMonth).replace('AR$ ', '')} suffix="AR$" icon="dollar" />
        <DStatTile tone="attention" label="Pendiente de pago" value={fmt(pendingSum).replace('AR$ ', '')} suffix="AR$" icon="receipt" delta={`${pendingCount} comprobantes`} />
        <DStatTile tone="success"   label="Pagados"           value={receipts.filter((r) => r.status === 'pagado').length} icon="check" />
      </div>

      <DCard padding="p-0" className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate200 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[14px] font-bold">Comprobantes</div>
          <div className="flex gap-1 flex-wrap">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[11px] font-bold px-3 py-[6px] rounded-full border transition-colors
                  ${filter === f ? 'bg-primary-50 text-primary border-primary' : 'bg-white text-slate600 border-slate200 hover:border-slate300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate50">
                {['Comprobante','Proveedor','Categoría','Fecha','Monto','Estado',''].map((h) => (
                  <th key={h} className="text-[9px] tracking-[0.06em] uppercase text-slate500 text-left font-bold px-4 py-[10px] border-b border-slate200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={r.id} className={i < list.length - 1 ? 'border-b border-slate200' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-9 rounded bg-critical50 text-[#B91C1C] text-[8px] font-extrabold flex items-center justify-center flex-none">PDF</span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate950">{r.concept}</div>
                        <div className="text-[10px] text-slate500 truncate">{r.file}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate600">{r.prov}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-[3px] rounded text-[10px] font-bold ${CAT_TINT[r.cat] || 'bg-slate100 text-slate700'}`}>{r.cat}</span>
                  </td>
                  <td className="px-4 py-3 text-slate600">{r.date}</td>
                  <td className="px-4 py-3 font-extrabold tnum text-slate950">{fmt(r.amount)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePaid(r.id)}>
                      <DPill tone={r.status === 'pagado' ? 'successSolid' : 'attentionSolid'}>{r.status === 'pagado' ? 'PAGADO' : 'PENDIENTE'}</DPill>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-slate500 hover:text-primary p-1" title="Descargar"><Icon name="download" size={14} /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate500 py-10 text-[13px]">No hay comprobantes en este filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </DCard>

      {addOpen && <ReceiptModal cats={cats} onClose={() => setAddOpen(false)} onSave={addReceipt} onAddCat={() => setCatModal(true)} />}
      {catModal && <NewCategoryModal onClose={() => setCatModal(false)} onSave={addCat} existing={cats}
        title="Nueva categoría de gasto" label="Nombre de la categoría*" placeholder="Ej: Alquiler de equipos" />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

const ReceiptModal = ({ cats, onClose, onSave, onAddCat }) => {
  const [d, setD] = React.useState({ concept: '', prov: '', cat: cats[0], date: '', amount: '', status: 'pendiente', file: '' });
  const [dragOver, setDragOver] = React.useState(false);
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  const canSave = d.concept.trim() && (Number(d.amount) > 0);
  const submit = () => {
    if (!canSave) return;
    onSave({
      ...d,
      amount: Number(d.amount),
      date: d.date ? new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      file: d.file || 'comprobante.pdf',
    });
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[500px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center"><Icon name="receipt" size={16} /></div>
            <div className="text-[15px] font-extrabold display-tight">Cargar recibo</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); set({ file: (e.dataTransfer.files[0] && e.dataTransfer.files[0].name) || 'comprobante.pdf' }); }}
            className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${dragOver ? 'border-primary bg-primary-50/40' : 'border-slate300 hover:border-slate400'}`}
            onClick={() => set({ file: 'comprobante-' + Math.floor(Math.random() * 9000 + 1000) + '.pdf' })}>
            <div className="w-10 h-10 rounded-full bg-slate100 text-slate500 flex items-center justify-center mx-auto mb-2"><Icon name="upload" size={18} /></div>
            {d.file
              ? <div className="text-[13px] font-bold text-primary flex items-center justify-center gap-2"><Icon name="receipt" size={13} /> {d.file}</div>
              : <><div className="text-[13px] font-bold text-slate700">Arrastrá el comprobante acá</div><div className="text-[11px] text-slate500 mt-1">PDF, JPG o PNG · o hacé clic para elegir</div></>}
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">Concepto*</span>
            <input value={d.concept} onChange={(e) => set({ concept: e.target.value })} placeholder="Ej: Cemento × 120 bolsas"
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Proveedor</span>
              <input value={d.prov} onChange={(e) => set({ prov: e.target.value })} placeholder="Ej: Cementos del Plata"
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate700">Categoría</span>
                {onAddCat && <button type="button" onClick={onAddCat} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]"><Icon name="plus" size={10} /> Nueva</button>}
              </div>
              <select value={d.cat} onChange={(e) => set({ cat: e.target.value })}
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Monto (AR$)*</span>
              <input type="number" min="0" value={d.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0"
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate700">Fecha</span>
              <input type="date" value={d.date} onChange={(e) => set({ date: e.target.value })}
                className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-[12px] text-slate700 cursor-pointer">
            <input type="checkbox" checked={d.status === 'pagado'} onChange={(e) => set({ status: e.target.checked ? 'pagado' : 'pendiente' })} className="w-4 h-4 rounded border-slate300 accent-primary" />
            Marcar como ya pagado
          </label>
        </div>
        <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave}
            className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${canSave ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed'}`}>
            Cargar recibo <Icon name="check" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Screen: REPORTES (general project report — composable + downloadable)
// ============================================================================

const ScreenReports = () => {
  const [sections, setSections] = React.useState({
    resumen: true, avance: true, presupuesto: true, cronograma: true,
    alertas: true, pedidos: true, stock: true, recibos: true, equipo: true, actividad: false,
  });
  const [range, setRange]   = React.useState('mes');
  const [gen, setGen]       = React.useState(null);   // null | 'loading' | 'ready'
  const [toast, setToast]   = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const SECTION_DEFS = [
    { id: 'resumen',    label: 'Resumen ejecutivo',   sub: 'Estado general y KPIs de la obra',         icon: 'chart' },
    { id: 'avance',     label: 'Avance por rubro',    sub: 'Progreso de cada categoría',               icon: 'trending' },
    { id: 'presupuesto',label: 'Presupuesto',         sub: 'Ejecutado, comprometido y disponible',     icon: 'dollar' },
    { id: 'cronograma', label: 'Cronograma',          sub: 'Tareas completas, en curso y atrasadas',   icon: 'calendar' },
    { id: 'alertas',    label: 'Alertas e incidentes',sub: 'Problemas críticos del período',           icon: 'alert' },
    { id: 'pedidos',    label: 'Pedidos de material', sub: 'Compras y entregas',                       icon: 'package' },
    { id: 'stock',      label: 'Stock de materiales', sub: 'Inventario y niveles bajos',               icon: 'box' },
    { id: 'recibos',    label: 'Recibos y gastos',    sub: 'Comprobantes y pagos',                     icon: 'receipt' },
    { id: 'equipo',     label: 'Equipo',              sub: 'Personas y productividad',                 icon: 'users' },
    { id: 'actividad',  label: 'Bitácora de actividad',sub: 'Detalle día a día (extenso)',             icon: 'message' },
  ];

  const toggle = (id) => setSections((p) => ({ ...p, [id]: !p[id] }));
  const count = Object.values(sections).filter(Boolean).length;

  const RANGE_LABEL = { semana: 'Última semana', mes: 'Último mes', trim: 'Último trimestre', total: 'Toda la obra' };

  const generate = () => {
    setGen('loading');
    setTimeout(() => setGen('ready'), 1500);
  };

  // Live snapshot data shown in the preview
  const SNAP = {
    obra: 'Edificio Belgrano', code: 'OBR-2025-014',
    avance: 68, presupuestoTotal: 124, ejecutado: 81,
    tareas: { total: 10, done: 4, prog: 1, late: 1 },
    alertas: 2, pedidos: 7, stockLow: 2, recibosPend: 2, equipo: 6,
  };

  return (
    <>
      <DPageHeader
        title="Reporte de obra"
        subtitle="Generá un informe completo con toda la información de la obra hasta hoy."
        right={
          <DButton variant="primary" size="sm" icon={<Icon name="download" size={13} />} onClick={generate}>
            Generar reporte
          </DButton>
        }
      />

      <div className="grid grid-cols-[1fr_360px] gap-4 items-start">
        {/* LEFT — live preview of the report */}
        <DCard padding="p-0" className="overflow-hidden">
          {/* Cover */}
          <div className="blueprint-bg text-white px-7 py-7 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <Icon name="logo-mark" size={26} />
              <span className="font-extrabold text-[15px]">BuildData</span>
            </div>
            <div className="text-[10px] tracking-[0.14em] uppercase font-bold text-accent mb-2">Reporte de obra · {RANGE_LABEL[range]}</div>
            <div className="text-[26px] font-extrabold display-tight leading-tight">{SNAP.obra}</div>
            <div className="text-[12px] text-white/60 mt-1">{SNAP.code} · generado el {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div className="grid grid-cols-4 gap-4 mt-6">
              {[
                { l: 'Avance', v: SNAP.avance + '%' },
                { l: 'Ejecutado', v: SNAP.ejecutado + '/' + SNAP.presupuestoTotal + ' M' },
                { l: 'Alertas', v: SNAP.alertas },
                { l: 'Equipo', v: SNAP.equipo },
              ].map((m) => (
                <div key={m.l}>
                  <div className="text-[20px] font-extrabold tnum leading-none">{m.v}</div>
                  <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/55 mt-1">{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Included sections preview */}
          <div className="p-5">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Contenido del reporte · {count} secciones</div>
            <div className="space-y-3">
              {SECTION_DEFS.filter((s) => sections[s.id]).map((s, i) => (
                <div key={s.id} className="flex items-start gap-3 pb-3 border-b border-slate100 last:border-b-0">
                  <span className="w-7 h-7 rounded-md bg-slate100 text-slate600 flex items-center justify-center flex-none text-[10px] font-bold tnum">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate950">{s.label}</div>
                    <div className="text-[11px] text-slate500">{s.sub}</div>
                  </div>
                  <Icon name={s.icon} size={15} className="text-slate400 mt-1" />
                </div>
              ))}
              {count === 0 && <div className="text-center text-slate500 text-[12px] py-6">Seleccioná al menos una sección.</div>}
            </div>
          </div>
        </DCard>

        {/* RIGHT — builder controls */}
        <div className="flex flex-col gap-4">
          <DCard padding="p-0">
            <div className="px-4 py-3 border-b border-slate200 text-[13px] font-bold">Período</div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {Object.entries(RANGE_LABEL).map(([k, v]) => (
                <button key={k} onClick={() => setRange(k)}
                  className={`text-[12px] font-bold px-3 py-[8px] rounded-md border transition-colors text-left
                    ${range === k ? 'bg-primary-50 text-primary border-primary' : 'bg-white text-slate600 border-slate200 hover:border-slate300'}`}>
                  {v}
                </button>
              ))}
            </div>
          </DCard>

          <DCard padding="p-0">
            <div className="px-4 py-3 border-b border-slate200 flex items-center justify-between">
              <div className="text-[13px] font-bold">Secciones a incluir</div>
              <button onClick={() => setSections((p) => { const all = Object.values(p).every(Boolean); return Object.fromEntries(Object.keys(p).map((k) => [k, !all])); })}
                className="text-[11px] font-bold text-primary hover:underline">
                {Object.values(sections).every(Boolean) ? 'Ninguna' : 'Todas'}
              </button>
            </div>
            <div className="divide-y divide-slate100 max-h-[320px] overflow-y-auto">
              {SECTION_DEFS.map((s) => (
                <button key={s.id} onClick={() => toggle(s.id)} className="w-full flex items-center gap-3 px-4 py-[10px] hover:bg-slate50 text-left">
                  <span className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center flex-none ${sections[s.id] ? 'bg-primary border-primary text-white' : 'border-slate300 bg-white'}`}>
                    {sections[s.id] && <Icon name="check" size={11} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] font-bold text-slate950">{s.label}</span>
                    <span className="block text-[10px] text-slate500 truncate">{s.sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-slate200 bg-slate50">
              <DButton variant="primary" size="md" className="w-full justify-center" icon={<Icon name="download" size={14} />} onClick={generate} disabled={count === 0}>
                Generar y descargar
              </DButton>
              <div className="flex gap-2 mt-2">
                <DButton variant="secondary" size="sm" className="flex-1 justify-center" onClick={() => flash('Reporte enviado por email')}>Enviar por email</DButton>
                <DButton variant="secondary" size="sm" className="flex-1 justify-center" onClick={() => flash('Link de reporte copiado')}>Compartir link</DButton>
              </div>
            </div>
          </DCard>
        </div>
      </div>

      {/* Generation modal */}
      {gen && (
        <div onClick={() => gen === 'ready' && setGen(null)} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[420px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
            {gen === 'loading' ? (
              <div className="px-8 py-10 text-center">
                <div className="w-12 h-12 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-[16px] font-extrabold display-tight">Generando reporte…</h3>
                <p className="text-[12px] text-slate500 mt-1">Reuniendo {count} secciones de {SNAP.obra}.</p>
              </div>
            ) : (
              <>
                <div className="px-8 py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center mx-auto mb-4"><Icon name="check" size={30} /></div>
                  <h3 className="text-[18px] font-extrabold display-tight">Tu reporte está listo</h3>
                  <p className="text-[12px] text-slate600 mt-1 max-w-[300px] mx-auto">
                    <b>Reporte_{SNAP.code}_{range}.pdf</b> · {count} secciones · {RANGE_LABEL[range]}
                  </p>
                  <div className="bg-slate50 border border-slate200 rounded-lg p-3 mt-4 flex items-center gap-3 text-left">
                    <span className="w-9 h-11 rounded bg-critical50 text-[#B91C1C] text-[9px] font-extrabold flex items-center justify-center flex-none">PDF</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-slate950 truncate">Reporte_{SNAP.code}_{range}.pdf</div>
                      <div className="text-[10px] text-slate500">~{(count * 0.4 + 0.6).toFixed(1)} MB · {count + 1} páginas</div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-end gap-2">
                  <button onClick={() => setGen(null)} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cerrar</button>
                  <button onClick={() => { setGen(null); flash('Descargando reporte…'); }} className="inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] bg-primary hover:bg-primary-700 text-white">
                    <Icon name="download" size={14} /> Descargar PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

// ============================================================================
// Screen: PRESUPUESTO (budget — donuts, currency, AI predictions, editable)
// ============================================================================

// Donut ring like the reference image. value 0..100.
const Donut = ({ value, size = 140, stroke = 14, color = '#0F4395', track = '#E2E8F0', label, sub, labelColor = '#0F172A' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div style={{ width: size, height: size }} className="relative flex-none">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[26px] font-extrabold display-tight tnum leading-none" style={{ color: labelColor }}>{label}</div>
        {sub && <div className="text-[10px] font-bold tracking-[0.04em] uppercase text-slate500 mt-1">{sub}</div>}
      </div>
    </div>
  );
};

// ── Modal profesional de edición de presupuesto ─────────────────────────────
// Recaudos: revisión previa de cambios, validación contra lo ya ejecutado,
// motivo obligatorio, confirmación en dos pasos y registro de auditoría.
const BudgetEditModal = ({ lines, cur, CUR, onClose, onCommit, onLog }) => {
  const c = CUR[cur];
  const [draft, setDraft] = React.useState(lines.map((l) => ({ ...l })));
  const [reason, setReason] = React.useState('');
  const [step, setStep] = React.useState('edit'); // edit | review
  const [ack, setAck] = React.useState(false);

  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const setCap = (i, v) => setDraft((p) => p.map((l, idx) => idx === i ? { ...l, cap: v === '' ? '' : Math.max(0, parseFloat(v) || 0) } : l));

  const oldTotal = lines.reduce((a, l) => a + l.cap, 0);
  const newTotal = draft.reduce((a, l) => a + (parseFloat(l.cap) || 0), 0);
  const delta = newTotal - oldTotal;

  // Cambios y validaciones
  const changes = draft.map((l, i) => ({
    name: l.name,
    from: lines[i].cap,
    to: parseFloat(l.cap) || 0,
    spent: l.spent,
    comp: l.comp,
  })).filter((ch) => ch.from !== ch.to);

  const errors = changes.filter((ch) => ch.to < ch.spent);
  const warns  = changes.filter((ch) => ch.to >= ch.spent && ch.to < ch.spent + ch.comp);
  const bigDrops = changes.filter((ch) => ch.from > 0 && ch.to < ch.from * 0.75);

  const canReview = changes.length > 0 && errors.length === 0;
  const canCommit = canReview && reason.trim().length >= 10 && ack;

  const fmtM = (m) => c.sym + ' ' + (cur === 'ARS' ? Math.round(m) : (m * 1e6 * c.rate / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 2 })) + ' M';

  const commit = () => {
    if (!canCommit) return;
    onCommit(draft.map((l) => ({ ...l, cap: parseFloat(l.cap) || 0 })));
    onLog({
      at: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      by: 'J. Méndez',
      what: changes.length === 1
        ? 'Ajustó ' + changes[0].name + ' de ' + changes[0].from + ' M a ' + changes[0].to + ' M'
        : 'Ajustó ' + changes.length + ' rubros · total ' + (delta >= 0 ? '+' : '') + Math.round(delta) + ' M',
      reason: reason.trim(),
    });
    onClose();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[640px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate200 flex items-start justify-between gap-3 flex-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center flex-none"><Icon name="dollar" size={16} /></div>
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold display-tight">Editar presupuesto por rubro</div>
              <div className="text-[11px] text-slate500">
                {step === 'edit' ? 'Paso 1 de 2 · Ajustá los montos asignados' : 'Paso 2 de 2 · Revisá y confirmá los cambios'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center flex-none"><Icon name="x" size={16} /></button>
        </div>

        {/* Advertencia general */}
        <div className="px-6 py-3 bg-attention50 border-b border-[#FDE68A] flex items-start gap-2 flex-none">
          <Icon name="alert" size={13} className="text-[#A16207] mt-[2px] flex-none" />
          <div className="text-[11px] text-slate700 leading-snug">
            El presupuesto es la referencia de control de costos de la obra. Los cambios impactan en el <b>avance financiero</b>, en las <b>proyecciones de IA</b> y en los <b>reportes al cliente</b>. Quedan registrados con autor, fecha y motivo.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 'edit' ? (
            <div className="p-6">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[9px] tracking-[0.06em] uppercase text-slate500 border-b border-slate200">
                    <th className="text-left font-bold pb-2">Rubro</th>
                    <th className="text-right font-bold pb-2 w-[80px]">Ejecutado</th>
                    <th className="text-right font-bold pb-2 w-[80px]">Actual</th>
                    <th className="text-right font-bold pb-2 w-[130px]">Nuevo monto</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.map((l, i) => {
                    const to = parseFloat(l.cap) || 0;
                    const belowSpent = to < l.spent;
                    const belowComp = !belowSpent && to < l.spent + l.comp;
                    const changed = lines[i].cap !== to;
                    return (
                      <tr key={l.name} className="border-b border-slate100">
                        <td className="py-[10px]">
                          <div className="font-semibold text-slate900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-none" style={{ background: RUBRO_COLORS[l.name] || '#94A3B8' }} />
                            {l.name}
                          </div>
                          {belowSpent && <div className="text-[10px] font-bold text-[#B91C1C] mt-[2px]">No puede ser menor a lo ya ejecutado ({fmtM(l.spent)})</div>}
                          {belowComp && <div className="text-[10px] font-bold text-[#A16207] mt-[2px]">Queda por debajo de lo comprometido en pedidos</div>}
                        </td>
                        <td className="py-[10px] text-right tnum text-slate600">{fmtM(l.spent)}</td>
                        <td className="py-[10px] text-right tnum text-slate500">{fmtM(lines[i].cap)}</td>
                        <td className="py-[10px]">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[11px] text-slate500">{c.sym}</span>
                            <input type="number" min="0" value={l.cap} onChange={(e) => setCap(i, e.target.value)}
                              className={"w-[74px] bg-white border rounded px-2 py-[5px] text-[12px] tnum text-right focus:outline-none " +
                                (belowSpent ? 'border-critical focus:border-critical' : changed ? 'border-primary' : 'border-slate200 focus:border-primary')} />
                            <span className="text-[11px] text-slate500">M</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-3 font-bold text-slate950">Total</td>
                    <td></td>
                    <td className="pt-3 text-right tnum text-slate500">{fmtM(oldTotal)}</td>
                    <td className="pt-3 text-right">
                      <span className="font-extrabold tnum text-slate950">{fmtM(newTotal)}</span>
                      {delta !== 0 && (
                        <span className={"ml-2 text-[11px] font-bold " + (delta > 0 ? 'text-[#A16207]' : 'text-[#1D4ED8]')}>
                          {delta > 0 ? '+' : ''}{Math.round(delta)} M
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {errors.length > 0 && (
                <div className="mt-4 bg-critical50 border border-[#FECACA] rounded-lg p-3 flex items-start gap-2">
                  <Icon name="alert" size={13} className="text-[#B91C1C] mt-[2px] flex-none" />
                  <div className="text-[12px] text-[#B91C1C] leading-snug">
                    <b>{errors.length} rubro{errors.length === 1 ? '' : 's'} con monto inválido.</b> El presupuesto no puede quedar por debajo de lo ya ejecutado.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Resumen de cambios */}
              <div>
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Cambios a aplicar · {changes.length}</div>
                <div className="border border-slate200 rounded-lg divide-y divide-slate100">
                  {changes.map((ch) => {
                    const up = ch.to > ch.from;
                    return (
                      <div key={ch.name} className="flex items-center gap-3 px-3 py-[10px]">
                        <span className="w-2 h-2 rounded-full flex-none" style={{ background: RUBRO_COLORS[ch.name] || '#94A3B8' }} />
                        <div className="flex-1 min-w-0 text-[12px] font-semibold text-slate900 truncate">{ch.name}</div>
                        <div className="text-[12px] tnum text-slate500 flex-none">{fmtM(ch.from)}</div>
                        <Icon name="arrow-right" size={12} className="text-slate400 flex-none" />
                        <div className="text-[12px] tnum font-bold text-slate950 flex-none w-[70px] text-right">{fmtM(ch.to)}</div>
                        <span className={"text-[10px] font-bold px-[6px] py-[2px] rounded flex-none " + (up ? 'bg-attention50 text-[#A16207]' : 'bg-info50 text-[#1D4ED8]')}>
                          {up ? '+' : ''}{Math.round(ch.to - ch.from)} M
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Impacto */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate200 rounded-lg p-3">
                  <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Total anterior</div>
                  <div className="text-[16px] font-extrabold tnum text-slate950 mt-1">{fmtM(oldTotal)}</div>
                </div>
                <div className={"border rounded-lg p-3 " + (delta > 0 ? 'border-[#FDE68A] bg-attention50' : delta < 0 ? 'border-[#BFDBFE] bg-info50' : 'border-slate200')}>
                  <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Total nuevo</div>
                  <div className="text-[16px] font-extrabold tnum text-slate950 mt-1">
                    {fmtM(newTotal)}
                    {delta !== 0 && <span className={"ml-2 text-[11px] font-bold " + (delta > 0 ? 'text-[#A16207]' : 'text-[#1D4ED8]')}>{delta > 0 ? '+' : ''}{Math.round(delta)} M</span>}
                  </div>
                </div>
              </div>

              {(warns.length > 0 || bigDrops.length > 0) && (
                <div className="bg-attention50 border border-[#FDE68A] rounded-lg p-3 space-y-1">
                  {warns.map((w) => (
                    <div key={'w' + w.name} className="text-[11px] text-slate700 leading-snug flex items-start gap-2">
                      <Icon name="alert" size={12} className="text-[#A16207] mt-[2px] flex-none" />
                      <span><b>{w.name}</b> queda por debajo de lo comprometido en pedidos ({fmtM(w.spent + w.comp)}).</span>
                    </div>
                  ))}
                  {bigDrops.map((d) => (
                    <div key={'d' + d.name} className="text-[11px] text-slate700 leading-snug flex items-start gap-2">
                      <Icon name="alert" size={12} className="text-[#A16207] mt-[2px] flex-none" />
                      <span><b>{d.name}</b> se reduce más del 25%. Verificá que el rubro pueda ejecutarse con ese monto.</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Motivo obligatorio */}
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate700">Motivo del ajuste* <span className="font-normal text-slate500">(mínimo 10 caracteres · queda en el historial)</span></span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                  placeholder="Ej: Aumento del precio del hierro confirmado por Aceros Norte el 20/08."
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[60px]" />
              </label>

              <label className="flex items-start gap-2 text-[12px] text-slate700 cursor-pointer bg-slate50 border border-slate200 rounded-lg p-3">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="w-4 h-4 mt-[2px] rounded border-slate300 accent-primary flex-none" />
                <span>Confirmo que estos montos fueron validados y entiendo que se actualizan las proyecciones y los reportes de la obra.</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-between gap-2 flex-none">
          <button onClick={step === 'review' ? () => setStep('edit') : onClose}
            className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">
            {step === 'review' ? '← Volver a editar' : 'Cancelar'}
          </button>
          <div className="flex items-center gap-2">
            {step === 'edit' ? (
              <>
                <span className="text-[11px] text-slate500">{changes.length === 0 ? 'Sin cambios' : changes.length + ' cambio' + (changes.length === 1 ? '' : 's')}</span>
                <button onClick={() => canReview && setStep('review')} disabled={!canReview}
                  className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (canReview ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed')}>
                  Revisar cambios <Icon name="arrow-right" size={14} />
                </button>
              </>
            ) : (
              <button onClick={commit} disabled={!canCommit}
                className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (canCommit ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed')}>
                <Icon name="check" size={14} /> Confirmar y guardar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScreenBudget = () => {
  // Base data is in millones AR$ (single source — reuses BUDGET).
  const [lines, setLines] = React.useState(BUDGET.lines.map((l) => ({ ...l })));
  const [cur, setCur] = React.useState('ARS');
  const [editOpen, setEditOpen] = React.useState(false);
  const [auditLog, setAuditLog] = React.useState([
    { at: '12 Ago 14:20', by: 'J. Méndez', what: 'Ajustó Hormigón armado de 48 M a 52 M', reason: 'Aumento de precio del hierro' },
  ]);
  const [toast, setToast] = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2400); };

  const CUR = {
    ARS: { sym: 'AR$', rate: 1,        dec: 0 },
    USD: { sym: 'US$', rate: 1/1050,   dec: 2 },  // ~1 USD = 1050 AR$
    EUR: { sym: '€',   rate: 1/1140,   dec: 2 },
  };
  const c = CUR[cur];
  // value is in millones AR$ → convert + format
  const fmt = (mAr) => {
    const v = mAr * 1e6 * c.rate;
    if (cur === 'ARS') return c.sym + ' ' + Math.round(mAr) + ' M';
    return c.sym + ' ' + (v/1e6).toLocaleString('es-AR', { maximumFractionDigits: 2 }) + ' M';
  };

  const total = lines.reduce((a, l) => a + l.cap, 0);
  const spent = lines.reduce((a, l) => a + l.spent, 0);
  const comp  = lines.reduce((a, l) => a + l.comp, 0);
  const avail = total - spent - comp;
  const pctSpent = Math.round((spent / total) * 100);
  const pctComp  = Math.round((comp / total) * 100);

  // ── AI prediction model (deterministic, derived from the data) ──
  // Projected final = spent + committed + (remaining work scaled by a small overrun factor per rubro).
  const proj = lines.map((l) => {
    const used = l.spent + l.comp;
    const remainingCap = Math.max(0, l.cap - used);
    const over = l.spent > l.cap;
    // rubros already over budget project a larger overrun
    const factor = over ? 1.18 : l.spent / Math.max(1, l.cap) > 0.85 ? 1.06 : 1.0;
    const projected = used + remainingCap * factor + (over ? (l.spent - l.cap) * 0.4 : 0);
    return { ...l, projected: Math.round(projected * 10) / 10, over, deviation: Math.round((projected - l.cap) * 10) / 10 };
  });
  const projTotal = Math.round(proj.reduce((a, l) => a + l.projected, 0));
  const projDev = projTotal - total;
  const projDevPct = Math.round((projDev / total) * 100);
  const riskRubros = proj.filter((l) => l.deviation > 0.5).sort((a, b) => b.deviation - a.deviation);

  // ── Escenarios ──────────────────────────────────────────────────────────
  // Deliberadamente se muestra un RANGO y no un número único: la proyección
  // depende de supuestos que pueden cambiar. El objetivo es alertar, no
  // prometer un resultado.
  const advance = pctSpent;                       // % de avance financiero
  const band = advance < 40 ? 0.12 : advance < 70 ? 0.08 : 0.05; // menos avance ⇒ más incertidumbre
  const low  = Math.round(projTotal * (1 - band));
  const high = Math.round(projTotal * (1 + band));
  const confLabel = advance < 40 ? 'Baja' : advance < 70 ? 'Media' : 'Alta';
  const confTone  = advance < 40 ? 'bg-critical50 text-[#B91C1C]' : advance < 70 ? 'bg-attention50 text-[#A16207]' : 'bg-success50 text-[#15803D]';
  const [showMethod, setShowMethod] = React.useState(false);
  const ASSUMPTIONS = [
    'Los precios unitarios se mantienen como en los últimos comprobantes cargados.',
    'El ritmo de ejecución de cada rubro sigue la tendencia de las últimas 4 semanas.',
    'Los pedidos aprobados y no entregados se ejecutan por su monto actual.',
    'No se incorporan trabajos adicionales ni cambios de proyecto.',
  ];

  // Forecast: when each rubro's spend is expected to spike (simple month mapping by current usage)
  const FORECAST = [
    { month: 'Jun', label: 'Este mes', items: ['Hormigón armado cierra compra de hierro'], amount: 14 },
    { month: 'Jul', label: 'Próximo', items: ['Pico de mampostería + inicio instalaciones'], amount: 22 },
    { month: 'Ago', label: 'En 2 meses', items: ['Terminaciones arranca (mayor desembolso)'], amount: 28 },
  ];


  return (
    <>
      <DPageHeader
        title="Presupuesto"
        subtitle="Una sola vista del dinero de la obra: ejecutado, comprometido, disponible y estimación de cierre."
        right={
          <>
            {/* Currency switch */}
            <div className="flex bg-slate100 rounded-md p-[2px] gap-[2px]">
              {Object.keys(CUR).map((k) => (
                <button key={k} onClick={() => setCur(k)}
                  className={`text-[11px] font-bold px-[10px] py-[5px] rounded inline-flex items-center gap-1 transition-colors
                    ${cur === k ? 'bg-white text-slate950 shadow-card' : 'text-slate600 hover:text-slate950'}`}>
                  {CUR[k].sym}
                </button>
              ))}
            </div>
            <DButton variant="secondary" size="sm" icon={<Icon name="edit" size={13} />} onClick={() => setEditOpen(true)}>Editar montos</DButton>
            <DButton variant="secondary" size="sm" icon={<Icon name="download" size={13} />}>Exportar</DButton>
          </>
        }
      />

      {/* Top: big donut + KPI tiles */}
      <div className="grid grid-cols-[260px_1fr] gap-3 mb-4">
        <DCard className="flex flex-col items-center justify-center text-center">
          <Donut value={pctSpent} size={150} stroke={15} color="#0F4395" label={pctSpent + '%'} sub="Ejecutado" />
          <div className="text-[12px] text-slate600 mt-3 leading-snug">
            <b className="text-slate950">{fmt(spent)}</b> de <b className="text-slate950">{fmt(total)}</b>
          </div>
        </DCard>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Presupuesto total', val: fmt(total), tone: 'primary',   icon: 'dollar', foot: lines.length + ' rubros' },
            { label: 'Ejecutado',         val: fmt(spent), tone: 'info',      icon: 'trending', foot: pctSpent + '% del total' },
            { label: 'Comprometido',      val: fmt(comp),  tone: 'attention', icon: 'clock',  foot: pctComp + '% en pedidos/órdenes' },
            { label: 'Disponible',        val: fmt(avail), tone: avail < 0 ? 'critical' : 'success', icon: 'check', foot: avail < 0 ? 'Sobregiro' : Math.round((avail/total)*100) + '% libre' },
          ].map((m) => (
            <DCard key={m.label} padding="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                  ${m.tone === 'primary' ? 'bg-primary-50 text-primary' : m.tone === 'info' ? 'bg-info50 text-[#1D4ED8]' : m.tone === 'attention' ? 'bg-attention50 text-[#A16207]' : m.tone === 'critical' ? 'bg-critical50 text-[#B91C1C]' : 'bg-success50 text-[#15803D]'}`}>
                  <Icon name={m.icon} size={16} />
                </div>
              </div>
              <div className="text-[22px] font-extrabold display-tight tnum text-slate950 leading-none">{m.val}</div>
              <div className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate600 mt-1">{m.label}</div>
              <div className="text-[11px] text-slate500 mt-1">{m.foot}</div>
            </DCard>
          ))}
        </div>
      </div>

      {/* AI prediction banner */}
      <div className="blueprint-bg rounded-lg p-5 text-white mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-[9px] font-bold tracking-wider uppercase px-2 py-[3px] rounded">
            <Icon name="sparkle" size={10} /> Predicción IA
          </span>
          <span className="text-[10px] text-white/60">en base a ritmo de gasto y pedidos</span>
        </div>
        <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
          <div className="flex flex-col items-center">
            <Donut value={Math.min(100, Math.round((projTotal/total)*100))} size={130} stroke={13}
              color={projDev > 0 ? '#F59E0B' : '#22C55E'} track="rgba(255,255,255,0.14)" labelColor="#ffffff"
              label={(projDev >= 0 ? '+' : '') + projDevPct + '%'} sub="vs presupuesto" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[9px] font-bold tracking-[0.08em] uppercase bg-white/10 text-white/70 rounded px-2 py-[3px]">Estimación · no es una garantía</span>
              <span className={"text-[9px] font-bold tracking-[0.06em] uppercase rounded px-2 py-[3px] " + confTone}>Confianza {confLabel}</span>
            </div>
            <div className="text-[15px] font-bold leading-snug mb-1">
              Cierre estimado entre <span className="text-accent">{fmt(low)}</span> y <span className="text-accent">{fmt(high)}</span>
            </div>
            <div className="text-[12px] text-white/70 leading-snug mb-3">
              {projDev > 0
                ? `Si se mantiene el ritmo y los precios actuales, la obra podría cerrar por encima del presupuesto. Escenario más probable: ${fmt(projTotal)} (${projDevPct > 0 ? '+' : ''}${projDevPct}%). ${riskRubros.length} rubro${riskRubros.length === 1 ? '' : 's'} explican la mayor parte del desvío.`
                : 'Si se mantiene el ritmo y los precios actuales, la obra cerraría dentro del presupuesto.'}
            </div>
            <div className="flex flex-wrap gap-2">
              {riskRubros.slice(0, 3).map((r) => (
                <span key={r.name} className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-[5px] text-[11px] font-semibold">
                  <span className="w-[6px] h-[6px] rounded-full bg-critical" /> {r.name} <span className="text-critical">+{fmt(r.deviation)}</span>
                </span>
              ))}
            </div>

            <button onClick={() => setShowMethod((v) => !v)}
              className="mt-3 inline-flex items-center gap-[6px] text-[11px] font-bold text-white/70 hover:text-white">
              <Icon name="info" size={11} /> {showMethod ? 'Ocultar' : 'Ver'} en qué se basa esta estimación
              <Icon name={showMethod ? 'chevron-up' : 'chevron-down'} size={11} />
            </button>

            {showMethod && (
              <div className="mt-3 bg-white/[0.06] border border-white/10 rounded-lg p-3">
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-white/55 mb-2">Supuestos del cálculo</div>
                <ul className="space-y-[6px] mb-3">
                  {ASSUMPTIONS.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-[11px] text-white/75 leading-snug">
                      <span className="w-[4px] h-[4px] rounded-full bg-accent mt-[6px] flex-none" />{a}
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] text-white/60 leading-snug border-t border-white/10 pt-2">
                  Se calcula con los datos cargados en la obra ({pctSpent}% de avance financiero). A menor avance, mayor incertidumbre — por eso se muestra un rango y no un valor único. <b className="text-white/80">No reemplaza el criterio profesional ni constituye una garantía de resultado.</b>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-3">
        {/* Per-rubro breakdown (editable) */}
        <DCard padding="p-0">
          <div className="px-5 py-3 border-b border-slate200 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-bold text-slate950">Detalle por rubro</div>
              <div className="text-[11px] text-slate500 mt-[1px]">Ejecutado y comprometido contra lo presupuestado</div>
            </div>
          </div>
          <div className="p-3 space-y-1">
            {proj.map((r, i) => {
              const used = r.spent + r.comp;
              const usedPct = Math.min(100, Math.round((r.spent / r.cap) * 100));
              const compPct = Math.min(100 - usedPct, Math.round((r.comp / r.cap) * 100));
              return (
                <div key={r.name} className="px-2 py-2 rounded-md hover:bg-slate50/60">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-[12px] font-bold text-slate800 truncate">{r.name}</div>
                    <div className="flex items-center gap-2 flex-none">
                      {r.over && <DPill tone="criticalSolid">+{Math.round((r.spent/r.cap - 1)*100)}%</DPill>}
                      <div className="text-[12px] tnum font-semibold text-slate600">{fmt(r.spent)} <span className="text-slate400">/ {fmt(r.cap)}</span></div>
                    </div>
                  </div>
                  <div className="h-[8px] rounded-full overflow-hidden flex bg-slate100">
                    <div style={{ width: usedPct + '%' }} className={r.over ? 'h-full bg-critical' : 'h-full bg-primary'} />
                    <div style={{ width: compPct + '%' }} className="h-full bg-primary/40" />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate500">
                    <span className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"/>Ejecutado</span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/40"/>Comprometido</span>
                    </span>
                    <span title="Estimación al cierre según ritmo y precios actuales">Cierre estimado: <b className={r.deviation > 0.5 ? 'text-[#B91C1C]' : 'text-slate700'}>{fmt(r.projected)}</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </DCard>

        {/* Forecast timeline + composition */}
        <div className="flex flex-col gap-3">
          <DCard padding="p-0">
            <div className="px-5 py-3 border-b border-slate200">
              <div className="text-[14px] font-bold text-slate950">Cuándo va a subir el gasto</div>
              <div className="text-[11px] text-slate500 mt-[1px]">Picos de desembolso previstos por IA</div>
            </div>
            <div className="p-4">
              <div className="relative pl-5 border-l-2 border-slate200 space-y-4">
                {FORECAST.map((f, i) => (
                  <div key={f.month} className="relative">
                    <span className={`absolute -left-[26px] top-[2px] w-3 h-3 rounded-full border-2 ${i === 0 ? 'bg-accent border-accent' : 'bg-white border-slate300'}`} />
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[12px] font-bold text-slate950">{f.month} <span className="text-slate400 font-semibold">· {f.label}</span></div>
                      <div className="text-[12px] font-extrabold tnum text-slate950">~{fmt(f.amount)}</div>
                    </div>
                    {f.items.map((it) => <div key={it} className="text-[11px] text-slate500 leading-snug mt-[2px]">{it}</div>)}
                  </div>
                ))}
              </div>
            </div>
          </DCard>

          <DCard padding="p-0">
            <div className="px-5 py-3 border-b border-slate200">
              <div className="text-[14px] font-bold text-slate950">Composición</div>
            </div>
            <div className="p-4 space-y-2">
              {lines.map((l) => {
                const share = Math.round((l.cap / total) * 100);
                return (
                  <div key={l.name} className="flex items-center gap-2">
                    <div className="text-[11px] text-slate700 w-[120px] truncate flex-none">{l.name}</div>
                    <div className="flex-1 bg-slate100 h-[6px] rounded-full overflow-hidden">
                      <div style={{ width: share + '%' }} className="h-full bg-primary rounded-full" />
                    </div>
                    <div className="text-[11px] font-bold tnum w-[34px] text-right">{share}%</div>
                  </div>
                );
              })}
            </div>
          </DCard>
        </div>
      </div>

      {/* Historial de ajustes del presupuesto */}
      <DCard padding="p-0" className="mt-4">
        <div className="px-5 py-3 border-b border-slate200 flex items-center justify-between gap-3">
          <div>
            <div className="text-[14px] font-bold text-slate950">Historial de ajustes</div>
            <div className="text-[11px] text-slate500 mt-[1px]">Cada cambio de presupuesto queda registrado con autor y motivo</div>
          </div>
          <span className="text-[10px] font-bold text-slate500 bg-slate100 rounded-full px-2 py-[3px] tnum flex-none">{auditLog.length}</span>
        </div>
        {auditLog.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12px] text-slate400">Todavía no se ajustó el presupuesto.</div>
        ) : (
          <div className="divide-y divide-slate100">
            {auditLog.map((a, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <span className="w-8 h-8 rounded-md bg-primary-50 text-primary flex items-center justify-center flex-none"><Icon name="edit" size={13} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-slate800 leading-snug"><b className="text-slate950">{a.by}</b> · {a.what}</div>
                  <div className="text-[11px] text-slate600 leading-snug mt-[3px] italic">“{a.reason}”</div>
                </div>
                <div className="text-[10px] text-slate500 tnum flex-none">{a.at}</div>
              </div>
            ))}
          </div>
        )}
      </DCard>

      {editOpen && (
        <BudgetEditModal lines={lines} cur={cur} CUR={CUR}
          onClose={() => setEditOpen(false)}
          onCommit={(next) => { setLines(next); flash('Presupuesto actualizado'); }}
          onLog={(entry) => setAuditLog((p) => [entry, ...p])} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

// ── Categorías por sección ──────────────────────────────────────────────────
// A diferencia de los rubros (transversales a toda la obra), las categorías
// clasifican DENTRO de una sección. Viven acá para poder administrarlas.
const CAT_GROUPS_SEED = {
  stock:   { label: 'Stock de materiales', icon: 'box',     tint: 'bg-success50 text-[#15803D]',   desc: 'Agrupan los materiales del inventario.',        items: ['Áridos y cementos', 'Hierros', 'Mampostería', 'Eléctrico', 'Sanitario'] },
  recibos: { label: 'Recibos y gastos',    icon: 'receipt', tint: 'bg-attention50 text-[#A16207]', desc: 'Clasifican en qué se gastó el dinero.',         items: ['Materiales', 'Mano de obra', 'Equipos', 'Logística', 'Servicios'] },
  alertas: { label: 'Alertas',             icon: 'alert',   tint: 'bg-critical50 text-[#B91C1C]',  desc: 'Tipifican el origen del problema reportado.',   items: ['Equipos', 'Materiales', 'Seguridad', 'Personal', 'Logística', 'Reportes'] },
  archivos:{ label: 'Archivos',            icon: 'database',tint: 'bg-info50 text-[#1D4ED8]',      desc: 'Ordenan los documentos de la obra.',            items: ['Planos y documentos', 'Planillas y cálculos', 'Contratos y textos', 'Fotos de obra'] },
};
const CAT_LISTENERS = new Set();
const CatStore = {
  groups: JSON.parse(JSON.stringify(CAT_GROUPS_SEED)),
  get(k) { return CatStore.groups[k].items; },
  all() { return CatStore.groups; },
  emit() { CAT_LISTENERS.forEach((fn) => fn()); },
  add(k, name) {
    const v = (name || '').trim(); if (!v || CatStore.groups[k].items.includes(v)) return;
    CatStore.groups[k].items = [...CatStore.groups[k].items, v]; CatStore.emit();
  },
  rename(k, oldName, name) {
    const v = (name || '').trim(); if (!v) return;
    CatStore.groups[k].items = CatStore.groups[k].items.map((x) => x === oldName ? v : x); CatStore.emit();
  },
  remove(k, name) {
    CatStore.groups[k].items = CatStore.groups[k].items.filter((x) => x !== name); CatStore.emit();
  },
};
const useCatStore = () => {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const fn = () => force((n) => n + 1);
    CAT_LISTENERS.add(fn);
    return () => CAT_LISTENERS.delete(fn);
  }, []);
  return CatStore;
};

// ── Administrador de categorías por sección ─────────────────────────────────
const CategoriesManager = () => {
  const cs = useCatStore();
  const groups = cs.all();
  const [adding, setAdding]   = React.useState(null);   // group key
  const [draft, setDraft]     = React.useState('');
  const [editing, setEditing] = React.useState(null);   // { k, name }
  const [editDraft, setEditDraft] = React.useState('');
  const [confirm, setConfirm] = React.useState(null);   // { k, name }
  const [toast, setToast]     = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const commitAdd = (k) => { const v = draft.trim(); if (v) { cs.add(k, v); flash('Categoría creada'); } setAdding(null); setDraft(''); };
  const commitEdit = () => { const v = editDraft.trim(); if (v && editing) { cs.rename(editing.k, editing.name, v); flash('Categoría renombrada'); } setEditing(null); };
  const doRemove = () => { if (confirm) { cs.remove(confirm.k, confirm.name); flash('Categoría eliminada'); } setConfirm(null); };

  return (
    <>
      <div className="flex items-start gap-3 bg-slate50 border border-slate200 rounded-lg p-3 mb-4">
        <span className="w-8 h-8 rounded-md bg-slate200 text-slate700 flex items-center justify-center flex-none"><Icon name="layers" size={15} /></span>
        <div className="text-[12px] text-slate700 leading-snug flex-1">
          <b className="text-slate950">Las categorías clasifican dentro de una sección</b> — a diferencia de los rubros, que cruzan toda la obra. Acá podés crear, renombrar o eliminar las categorías de cada sección.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(groups).map(([k, g]) => (
          <DCard key={k} padding="p-0" className="self-start">
            <div className="px-4 py-3 border-b border-slate200 flex items-center gap-3">
              <span className={"w-9 h-9 rounded-md flex items-center justify-center flex-none " + g.tint}><Icon name={g.icon} size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-slate950">{g.label}</div>
                <div className="text-[11px] text-slate500 leading-snug">{g.desc}</div>
              </div>
              <span className="text-[10px] font-bold text-slate500 bg-slate100 rounded-full px-2 py-[3px] flex-none tnum">{g.items.length}</span>
            </div>

            <div className="divide-y divide-slate100">
              {g.items.map((c) => {
                const isEditing = editing && editing.k === k && editing.name === c;
                return (
                  <div key={c} className="flex items-center gap-2 px-4 py-[9px] group">
                    {isEditing ? (
                      <>
                        <input autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                          className="flex-1 min-w-0 bg-white border border-primary rounded-md px-2 py-[6px] text-[12px] focus:outline-none" />
                        <button onClick={commitEdit} className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center flex-none"><Icon name="check" size={12} /></button>
                        <button onClick={() => setEditing(null)} className="w-7 h-7 rounded-md text-slate500 hover:bg-slate100 flex items-center justify-center flex-none"><Icon name="x" size={12} /></button>
                      </>
                    ) : (
                      <>
                        <span className="w-[6px] h-[6px] rounded-full bg-slate300 flex-none" />
                        <span className="flex-1 min-w-0 text-[12px] font-semibold text-slate800 truncate">{c}</span>
                        <button onClick={() => { setEditing({ k, name: c }); setEditDraft(c); }}
                          className="text-slate400 hover:text-primary p-1 flex-none opacity-0 group-hover:opacity-100 transition-opacity" title="Renombrar"><Icon name="edit" size={12} /></button>
                        <button onClick={() => setConfirm({ k, name: c })}
                          className="text-slate400 hover:text-[#B91C1C] p-1 flex-none opacity-0 group-hover:opacity-100 transition-opacity" title="Eliminar"><Icon name="trash" size={12} /></button>
                      </>
                    )}
                  </div>
                );
              })}
              {g.items.length === 0 && <div className="px-4 py-6 text-center text-[12px] text-slate400">Sin categorías.</div>}
            </div>

            <div className="p-3 border-t border-slate200 bg-slate50">
              {adding === k ? (
                <div className="flex gap-2">
                  <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitAdd(k); if (e.key === 'Escape') { setAdding(null); setDraft(''); } }}
                    placeholder="Nombre de la categoría"
                    className="flex-1 min-w-0 bg-white border border-primary rounded-md px-3 py-[7px] text-[12px] focus:outline-none" />
                  <button onClick={() => commitAdd(k)} className="px-3 rounded-md bg-primary text-white text-[12px] font-bold">Crear</button>
                  <button onClick={() => { setAdding(null); setDraft(''); }} className="px-2 text-slate500 hover:text-slate950"><Icon name="x" size={14} /></button>
                </div>
              ) : (
                <button onClick={() => { setAdding(k); setDraft(''); }}
                  className="w-full flex items-center justify-center gap-2 text-[12px] font-bold text-primary py-[6px] rounded-md hover:bg-primary-50 transition-colors">
                  <Icon name="plus" size={12} /> Nueva categoría
                </button>
              )}
            </div>
          </DCard>
        ))}
      </div>

      {confirm && (
        <div onClick={() => setConfirm(null)} className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[400px] rounded-2xl shadow-big overflow-hidden animate-modal-pop">
            <div className="px-6 py-5">
              <div className="w-11 h-11 rounded-full bg-critical50 text-[#B91C1C] flex items-center justify-center mb-3"><Icon name="alert" size={20} /></div>
              <h3 className="text-[17px] font-extrabold display-tight text-slate950">Eliminar “{confirm.name}”</h3>
              <p className="text-[13px] text-slate600 mt-2 leading-snug">
                Se quita de <b className="text-slate950">{groups[confirm.k].label}</b>. Los registros que la usaban quedan sin categoría asignada.
              </p>
            </div>
            <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
              <button onClick={doRemove} className="inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] bg-critical hover:bg-[#B91C1C] text-white"><Icon name="trash" size={13} /> Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

// ============================================================================
// Screen: RUBROS — administración central de la taxonomía de la obra
// ============================================================================

const ScreenRubros = ({ onNav }) => {
  const [mainTab, setMainTab] = React.useState('rubros');
  const store = useRubroStore();
  useTaskStore(); // re-render cuando cambian tareas/progresos
  const rubros = store.get();

  const [modal, setModal]   = React.useState(null); // { initial }
  const [pick, setPick]     = React.useState(null);
  const [confirm, setConfirm] = React.useState(null);
  const [toast, setToast]   = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  // Todo lo que cuelga de un rubro
  // Presupuesto y ejecutado salen SIEMPRE de BUDGET.lines (fuente única
  // compartida con la sección Presupuesto), no de un campo propio del rubro.
  const usage = (name) => {
    const tasks = ALL_TASKS.filter((t) => t.rubro === name);
    const done  = tasks.filter((t) => t.state === 'done').length;
    const pct   = tasks.length ? Math.round(tasks.reduce((a, t) => a + t.pct, 0) / tasks.length) : 0;
    const line  = BUDGET.lines.find((l) => l.name === name);
    return { tasks, done, pct, spent: line ? line.spent : 0, cap: line ? line.cap : 0 };
  };

  const totalBudget = BUDGET.lines.reduce((a, l) => a + l.cap, 0);
  const avgPct = rubros.length ? Math.round(rubros.reduce((a, r) => a + usage(r.name).pct, 0) / rubros.length) : 0;
  const overBudget = rubros.filter((r) => { const u = usage(r.name); return u.cap > 0 && u.spent > u.cap; }).length;
  const noDesc = rubros.filter((r) => !r.desc).length;

  const save = (payload) => {
    const exists = store.find(payload.name);
    if (modal && modal.initial && modal.initial.name !== payload.name) store.remove(modal.initial.name);
    if (exists) store.update(payload.name, { color: payload.color, desc: payload.desc });
    else store.add({ name: payload.name, color: payload.color, desc: payload.desc, budget: 0 });
    flash(modal && modal.initial ? 'Rubro actualizado' : 'Rubro creado');
    setModal(null);
  };
  const doRemove = (name) => { store.remove(name); setConfirm(null); setPick(null); flash('Rubro eliminado'); };

  return (
    <>
      <DPageHeader
        title="Rubros y categorías"
        subtitle="Cómo se clasifica la información de tu obra"
        right={mainTab === 'rubros'
          ? <DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => setModal({ initial: null })}>Nuevo rubro</DButton>
          : null}
      />

      <div className="flex gap-1 border-b border-slate200 mb-4 flex-wrap">
        {[
          { id: 'rubros',      label: 'Rubros',     n: rubros.length },
          { id: 'categorias',  label: 'Categorías', n: Object.values(CatStore.all()).reduce((a, g) => a + g.items.length, 0) },
        ].map((t) => {
          const on = mainTab === t.id;
          return (
            <button key={t.id} onClick={() => setMainTab(t.id)}
              className={"flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors " + (on ? 'text-primary border-primary' : 'text-slate500 border-transparent hover:text-slate700')}>
              {t.label}
              <span className={"text-[10px] font-bold px-[6px] py-[2px] rounded-full " + (on ? 'bg-primary-50 text-primary' : 'bg-slate100 text-slate700')}>{t.n}</span>
            </button>
          );
        })}
      </div>

      {mainTab === 'categorias' && <CategoriesManager />}
      {mainTab === 'rubros' && <>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="primary"   label="Rubros"            value={rubros.length} icon="layers" />
        <DStatTile tone="info"      label="Avance promedio"   value={avgPct} suffix="%" icon="chart" onClick={() => onNav && onNav('gantt')} />
        <DStatTile tone="success"   label="Presupuesto"       value={totalBudget} suffix="M" icon="dollar" onClick={() => onNav && onNav('presupuesto')} />
        <DStatTile tone="critical"  label="Sobre presupuesto" value={overBudget} icon="alert" delta={overBudget ? 'Revisar costos' : 'Todo en rango'} deltaTone={overBudget ? 'critical' : 'success'} />
      </div>

      <div className="flex items-start gap-3 bg-primary-50 border border-primary/15 rounded-lg p-3 mb-4">
        <span className="w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center flex-none"><Icon name="layers" size={15} /></span>
        <div className="text-[12px] text-slate700 leading-snug flex-1">
          <b className="text-slate950">Un rubro es una categoría de trabajo de la obra.</b> Todo lo que cargues —tareas, pedidos, materiales y presupuesto— se agrupa por rubro. Editalos o eliminalos acá; los cambios se reflejan en todas las secciones.
          {noDesc > 0 && <span className="block mt-1 text-[#A16207]">{noDesc} rubro{noDesc === 1 ? '' : 's'} sin descripción.</span>}
        </div>
      </div>

      {rubros.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-slate200 rounded-lg flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-slate100 text-slate400 flex items-center justify-center"><Icon name="layers" size={22} /></span>
          <div className="text-[13px] text-slate500">Todavía no hay rubros en esta obra.</div>
          <DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => setModal({ initial: null })}>Crear el primero</DButton>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rubros.map((r) => {
            const u = usage(r.name);
            const over = u.cap > 0 && u.spent > u.cap;
            const used = u.cap > 0 ? Math.min(100, Math.round((u.spent / u.cap) * 100)) : 0;
            return (
              <div key={r.name} className="bg-white border border-slate200 rounded-lg overflow-hidden hover:border-primary hover:shadow-card2 transition-all flex flex-col self-start">
                <div className="h-[3px] w-full" style={{ background: r.color }} />
                <button onClick={() => setPick(r.name)} className="text-left p-4 w-full">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="w-9 h-9 rounded-md flex items-center justify-center flex-none" style={{ background: r.color + '22', color: r.color }}><Icon name="layers" size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold text-slate950 leading-tight">{r.name}</div>
                      <div className="text-[11px] text-slate500 leading-snug mt-[3px]">{r.desc || <span className="italic text-slate400">Sin descripción</span>}</div>
                    </div>
                    {over && <DPill tone="criticalSolid">+{Math.round((u.spent / u.cap - 1) * 100)}%</DPill>}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold tracking-[0.06em] uppercase text-slate500">Avance</span>
                      <span className="font-bold tnum text-slate700">{u.pct}%</span>
                    </div>
                    <div className="h-[6px] bg-slate100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: u.pct + '%', background: r.color }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate100">
                    <div>
                      <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate400">Tareas</div>
                      <div className="text-[15px] font-extrabold tnum text-slate950 leading-tight">{u.done}/{u.tasks.length}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate400">Presupuesto</div>
                      <div className="text-[15px] font-extrabold tnum text-slate950 leading-tight">{u.cap}M</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-slate400">Ejecutado</div>
                      <div className={"text-[15px] font-extrabold tnum leading-tight " + (over ? 'text-[#B91C1C]' : 'text-slate950')}>{u.spent}M</div>
                    </div>
                  </div>
                  {u.cap > 0 && (
                    <div className="h-[4px] bg-slate100 rounded-full overflow-hidden mt-2">
                      <div className={"h-full rounded-full " + (over ? 'bg-critical' : 'bg-primary')} style={{ width: used + '%' }} />
                    </div>
                  )}
                </button>
                <div className="border-t border-slate100 px-4 py-2 flex items-center gap-2 bg-slate50/50">
                  <DButton variant="secondary" size="sm" icon={<Icon name="edit" size={12} />} onClick={() => setModal({ initial: r })}>Editar</DButton>
                  <DButton variant="ghost" size="sm" onClick={() => setPick(r.name)}>Ver detalle</DButton>
                  <div className="flex-1" />
                  <button onClick={() => setConfirm(r)} className="text-slate400 hover:text-[#B91C1C] p-1" title="Eliminar rubro"><Icon name="trash" size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </>}

      {/* Detalle */}
      {mainTab === 'rubros' && pick && (() => {
        const r = store.find(pick); if (!r) return null;
        const u = usage(r.name);
        return (
          <>
            <div onClick={() => setPick(null)} className="fixed inset-0 z-[55] bg-slate950/40 backdrop-blur-[2px] animate-fade-task" />
            <aside className="fixed right-0 top-0 bottom-0 z-[60] w-[440px] max-w-[calc(100vw-32px)] bg-white border-l border-slate200 shadow-big flex flex-col animate-slide-task overflow-hidden">
              <div className="px-5 py-4 border-b border-slate200 flex items-start justify-between gap-3 flex-none">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full flex-none" style={{ background: r.color }} />
                    <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate600">Rubro</span>
                  </div>
                  <h3 className="text-[18px] font-extrabold display-tight text-slate950 leading-tight">{r.name}</h3>
                </div>
                <button onClick={() => setPick(null)} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center flex-none"><Icon name="x" size={16} /></button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-4 bg-slate50 border-b border-slate200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Avance del rubro</span>
                    <span className="text-[20px] font-extrabold tnum">{u.pct}%</span>
                  </div>
                  <div className="h-[8px] bg-slate200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: u.pct + '%', background: r.color }} />
                  </div>
                </div>

                <div className="px-5 py-4 border-b border-slate200">
                  <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Descripción</div>
                  <p className="text-[13px] text-slate700 leading-relaxed">{r.desc || <span className="italic text-slate400">Sin descripción. Editá el rubro para agregarla.</span>}</p>
                </div>

                <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-slate200">
                  {[['Presupuesto', u.cap + ' M'], ['Ejecutado', u.spent + ' M'], ['Tareas', u.done + '/' + u.tasks.length]].map(([l, v]) => (
                    <div key={l}>
                      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-1">{l}</div>
                      <div className="text-[13px] font-bold text-slate950 tnum">{v}</div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Tareas de este rubro</div>
                    <button onClick={() => { setPick(null); onNav && onNav('gantt'); }} className="text-[11px] font-bold text-primary hover:underline">Ver cronograma →</button>
                  </div>
                  {u.tasks.length === 0 ? (
                    <div className="text-center text-slate500 text-[12px] py-6 border border-dashed border-slate200 rounded-lg">Todavía no hay tareas en este rubro.</div>
                  ) : (
                    <div className="space-y-2">
                      {u.tasks.map((t) => {
                        const st = TASK_STATE_MAP[t.state];
                        return (
                          <div key={t.id} className="border border-slate200 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[12px] font-bold text-slate950 truncate">{t.name}</span>
                              <DPill tone={t.state === 'late' ? 'criticalSolid' : t.state === 'done' ? 'success' : t.state === 'progress' ? 'primary' : 'info'}>{st.label}</DPill>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate100 h-[6px] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: t.pct + '%', background: st.dot }} />
                              </div>
                              <span className="text-[11px] font-bold tnum w-[34px] text-right">{t.pct}%</span>
                            </div>
                            <div className="text-[10px] text-slate500 mt-2">{t.who}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate200 p-3 flex items-center gap-2 flex-none">
                <DButton variant="secondary" size="sm" icon={<Icon name="edit" size={13} />} onClick={() => { setModal({ initial: r }); setPick(null); }}>Editar</DButton>
                <DButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setPick(null); onNav && onNav('presupuesto'); }}>Ver presupuesto</DButton>
                <button onClick={() => setConfirm(r)} className="text-slate400 hover:text-[#B91C1C] p-2" title="Eliminar"><Icon name="trash" size={14} /></button>
              </div>
            </aside>
          </>
        );
      })()}

      {/* Confirmar borrado */}
      {confirm && (() => {
        const u = usage(confirm.name);
        return (
          <div onClick={() => setConfirm(null)} className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
            <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[420px] rounded-2xl shadow-big overflow-hidden animate-modal-pop">
              <div className="px-6 py-5">
                <div className="w-11 h-11 rounded-full bg-critical50 text-[#B91C1C] flex items-center justify-center mb-3"><Icon name="alert" size={20} /></div>
                <h3 className="text-[17px] font-extrabold display-tight text-slate950">Eliminar “{confirm.name}”</h3>
                {u.tasks.length > 0 ? (
                  <p className="text-[13px] text-slate600 mt-2 leading-snug">
                    Este rubro tiene <b className="text-slate950">{u.tasks.length} tarea{u.tasks.length === 1 ? '' : 's'}</b> asociada{u.tasks.length === 1 ? '' : 's'} y <b className="text-slate950">{u.cap} M</b> de presupuesto. Las tareas van a quedar sin rubro asignado.
                  </p>
                ) : (
                  <p className="text-[13px] text-slate600 mt-2 leading-snug">No tiene tareas asociadas. Se puede eliminar sin impacto.</p>
                )}
              </div>
              <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex justify-end gap-2">
                <button onClick={() => setConfirm(null)} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
                <button onClick={() => doRemove(confirm.name)} className="inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] bg-critical hover:bg-[#B91C1C] text-white"><Icon name="trash" size={13} /> Eliminar rubro</button>
              </div>
            </div>
          </div>
        );
      })()}

      <CategoryModal open={!!modal} initial={modal ? modal.initial : null} onClose={() => setModal(null)} onSave={save} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

// ============================================================================
// Screen: BANDEJA — lo que entra y sale por WhatsApp + confirmación de la IA
// ============================================================================
// Es el núcleo del producto: cada mensaje crudo del equipo se muestra junto a
// la interpretación de la IA, y el usuario CONFIRMA, CORRIGE o DESCARTA antes
// de que el dato impacte en la obra. Nada entra automático sin revisión.

const INBOX_SEED = [
  {
    id: 'IN-2214', dir: 'in', kind: 'audio', from: 'C. Ríos', role: 'Capataz', time: 'hace 4 min',
    dur: '0:18',
    raw: 'Che, llegaron ciento veinte bolsas de cemento, las bajamos en el depósito grande. Faltan las doce que quedaron en la fábrica. Ojo que el camión rompió un pedazo del cordón al entrar.',
    conf: 0.94, state: 'pending', note: '',
    // Tramos de la transcripción que SÍ se mapearon a un campo estructurado.
    mapped: ['ciento veinte bolsas de cemento', 'depósito grande', 'doce que quedaron en la fábrica'],
    // Lo que la IA entendió que es información pero no encaja en ningún campo.
    loose: [{ txt: 'el camión rompió un pedazo del cordón al entrar', why: 'Posible incidente — no corresponde a esta entrega' }],
    parse: { tipo: 'Entrega de material', destino: 'Pedidos + Stock', campos: [
      ['Pedido', 'PED-0142 · Cemento Portland'], ['Cantidad recibida', '120 bolsas'],
      ['Pendiente', '12 bolsas'], ['Lugar', 'Depósito grande'], ['Recibió', 'C. Ríos'],
    ]},
  },
  {
    id: 'IN-2213', dir: 'in', kind: 'audio', from: 'P. Salas', role: 'Capataz', time: 'hace 22 min',
    dur: '0:31',
    raw: 'Se cortó la luz en el sector de arriba y no podemos seguir con el tendido. Va a haber que llamar al electricista, no sé si vamos a llegar con lo de hoy. Igual aproveché y mandé a los pibes a limpiar la planta baja.',
    conf: 0.71, state: 'pending', note: '',
    mapped: ['Se cortó la luz', 'no podemos seguir con el tendido', 'llamar al electricista'],
    loose: [{ txt: 'mandé a los pibes a limpiar la planta baja', why: 'Trabajo realizado sin tarea asociada' }],
    parse: { tipo: 'Alerta', destino: 'Alertas', campos: [
      ['Nivel sugerido', 'Importante'], ['Categoría', 'Equipos'],
      ['Tarea afectada', 'Tendido eléctrico'], ['Acción sugerida', 'Asignar electricista'],
    ]},
    warn: 'Confianza media: el audio tiene ruido de fondo. Verificá el nivel de la alerta.',
  },
  {
    id: 'IN-2212', dir: 'in', kind: 'photo', from: 'C. Ríos', role: 'Capataz', time: 'hace 1 h',
    raw: '4 fotos · armado de columnas eje 4-6', photos: 4,
    conf: 0.88, state: 'pending', note: '', mapped: [], loose: [],
    parse: { tipo: 'Avance con foto', destino: 'Galería + Cronograma', campos: [
      ['Tarea', 'Columnas eje 4-6'], ['Avance detectado', '35%'], ['Fotos', '4 imágenes'],
    ]},
  },
  {
    id: 'IN-2211', dir: 'in', kind: 'text', from: 'L. Benítez', role: 'Compras', time: 'hace 2 h',
    raw: 'Pedile 200 ladrillos huecos del 18 a San Pedro para el martes que viene',
    conf: 0.96, state: 'confirmed', by: 'J. Méndez', at: 'hoy 11:04', note: 'Confirmado con el proveedor por teléfono.',
    mapped: ['200 ladrillos huecos del 18', 'San Pedro', 'martes que viene'], loose: [],
    parse: { tipo: 'Pedido de material', destino: 'Pedidos', campos: [
      ['Material', 'Ladrillo hueco 18×18'], ['Cantidad', '200 u'],
      ['Proveedor', 'Cerámica San Pedro'], ['Llegada', 'martes'],
    ]},
    applied: ['PED-0143 creado en Pedidos'],
  },
  {
    id: 'IN-2210', dir: 'in', kind: 'audio', from: 'M. Ortiz', role: 'Capataz', time: 'ayer 18:40',
    dur: '0:09', raw: 'Nada, todo bien por acá, mañana seguimos.',
    conf: 0.42, state: 'discarded', note: '', mapped: [], loose: [],
    parse: { tipo: 'Sin dato accionable', destino: '—', campos: [] },
    warn: 'La IA no encontró información estructurable en este mensaje.',
  },
  {
    id: 'OUT-881', dir: 'out', kind: 'text', to: 'M. Ortiz', role: 'Capataz', time: 'ayer 19:05',
    raw: 'Hola Marcos, no registramos el cierre de jornada de hoy. ¿Podés mandarlo cuando puedas?',
    trigger: 'Recordatorio automático · sin reporte a las 19:00', state: 'sent',
  },
  {
    id: 'OUT-880', dir: 'out', kind: 'text', to: 'L. Benítez', role: 'Compras', time: 'ayer 17:32',
    raw: 'El pedido PED-0142 (Cemento · 120 bolsas) fue aprobado por J. Méndez.',
    trigger: 'Notificación · pedido aprobado', state: 'sent',
  },
];

// Resalta en la transcripción qué se capturó (verde) y qué quedó suelto (ámbar),
// para que el usuario vea de un vistazo si se está perdiendo información.
const HighlightedRaw = ({ text, mapped = [], loose = [] }) => {
  const marks = [
    ...mapped.map((t) => ({ t, kind: 'ok' })),
    ...loose.map((l) => ({ t: l.txt, kind: 'loose' })),
  ].filter((m) => m.t && text.includes(m.t));
  if (marks.length === 0) return <span>{text}</span>;

  const ranges = marks.map((m) => ({ ...m, i: text.indexOf(m.t) })).sort((a, b) => a.i - b.i);
  const out = []; let cur = 0;
  ranges.forEach((r, k) => {
    if (r.i < cur) return;
    if (r.i > cur) out.push(<span key={'p' + k}>{text.slice(cur, r.i)}</span>);
    out.push(
      <mark key={'m' + k} className={r.kind === 'ok'
        ? 'bg-success50 text-[#15803D] rounded px-[2px] not-italic font-semibold'
        : 'bg-attention50 text-[#A16207] rounded px-[2px] not-italic font-semibold underline decoration-dotted underline-offset-2'}>
        {r.t}
      </mark>
    );
    cur = r.i + r.t.length;
  });
  if (cur < text.length) out.push(<span key="tail">{text.slice(cur)}</span>);
  return <>{out}</>;
};

const KIND_META = {
  audio: { ico: 'mic',     label: 'Audio', tint: 'bg-success50 text-[#15803D]' },
  photo: { ico: 'photo',   label: 'Fotos', tint: 'bg-info50 text-[#1D4ED8]' },
  text:  { ico: 'message', label: 'Texto', tint: 'bg-slate100 text-slate700' },
};

const ScreenInbox = ({ onNav }) => {
  const [items, setItems] = React.useState(INBOX_SEED);
  const [tab, setTab] = React.useState('pendientes');
  const [pick, setPick] = React.useState(null);
  const [expanded, setExpanded] = React.useState(null);
  const [noteFor, setNoteFor] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const patch = (id, f) => setItems((p) => p.map((x) => x.id === id ? { ...x, ...f } : x));
  const confirmItem = (id) => {
    const it = items.find((x) => x.id === id);
    patch(id, { state: 'confirmed', by: 'J. Méndez', at: 'hoy ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      applied: it && it.parse ? [it.parse.destino] : undefined });
    setPick(null); setNoteFor(null);
    flash('Dato confirmado y aplicado a la obra');
  };
  const discardItem = (id) => { patch(id, { state: 'discarded' }); setPick(null); flash('Mensaje descartado'); };

  const inbound = items.filter((i) => i.dir === 'in');
  const pend = inbound.filter((i) => i.state === 'pending');
  const conf = inbound.filter((i) => i.state === 'confirmed');
  const disc = inbound.filter((i) => i.state === 'discarded');
  const out  = items.filter((i) => i.dir === 'out');

  const TABS = [
    { id: 'pendientes', label: 'Por confirmar', list: pend },
    { id: 'confirmados',label: 'Confirmados',   list: conf },
    { id: 'descartados',label: 'Descartados',   list: disc },
    { id: 'salientes',  label: 'Enviados por el bot', list: out },
  ];
  const active = TABS.find((t) => t.id === tab) || TABS[0];

  const confPill = (c) =>
    c >= 0.9 ? { t: 'Confianza alta', cls: 'bg-success50 text-[#15803D]' }
    : c >= 0.6 ? { t: 'Confianza media', cls: 'bg-attention50 text-[#A16207]' }
    : { t: 'Confianza baja', cls: 'bg-critical50 text-[#B91C1C]' };

  return (
    <>
      <DPageHeader
        title="Bandeja de WhatsApp"
        subtitle={pend.length + ' mensajes esperan tu confirmación · nada se aplica a la obra sin que lo revises'}
        right={
          <>
            <DButton variant="secondary" size="sm" icon={<Icon name="message" size={13} />} onClick={() => flash('Bot conectado · +54 9 11 2034-8821')}>Estado del bot</DButton>
            <DButton variant="primary" size="sm" icon={<Icon name="check" size={13} />} disabled={pend.length === 0}
              onClick={() => { setItems((p) => p.map((x) => x.dir === 'in' && x.state === 'pending' && x.conf >= 0.9 ? { ...x, state: 'confirmed', by: 'J. Méndez' } : x)); flash('Confirmados los de confianza alta'); }}>
              Confirmar confianza alta
            </DButton>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="attention" label="Por confirmar" value={pend.length} icon="clock" delta={pend.length ? 'Requieren revisión' : 'Al día'} deltaTone={pend.length ? 'critical' : 'success'} onClick={() => setTab('pendientes')} />
        <DStatTile tone="success"   label="Confirmados hoy" value={conf.length} icon="check" onClick={() => setTab('confirmados')} />
        <DStatTile tone="info"      label="Mensajes recibidos" value="1.284" icon="message" delta="Este mes" />
        <DStatTile tone="primary"   label="Precisión de la IA" value="92" suffix="%" icon="sparkle" delta="Sobre lo confirmado" />
      </div>

      <div className="flex items-start gap-3 bg-success50 border border-[#BBF7D0] rounded-lg p-3 mb-4">
        <span className="w-8 h-8 rounded-md bg-[#25D366]/20 text-[#15803D] flex items-center justify-center flex-none"><Icon name="message" size={15} /></span>
        <div className="text-[12px] text-slate700 leading-snug flex-1">
          <b className="text-slate950">Acá ves todo lo que entra y sale del bot.</b> Tu equipo manda audios, fotos o texto por WhatsApp; la IA propone cómo cargarlo en la obra y vos <b>confirmás, corregís o descartás</b>. Ningún dato se aplica solo.
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate200 mb-4 flex-wrap">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={"flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors " + (on ? 'text-primary border-primary' : 'text-slate500 border-transparent hover:text-slate700')}>
              {t.label}
              <span className={"text-[10px] font-bold px-[6px] py-[2px] rounded-full " + (on ? 'bg-primary-50 text-primary' : 'bg-slate100 text-slate700')}>{t.list.length}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {active.list.map((m) => {
          const km = KIND_META[m.kind];
          const isOut = m.dir === 'out';
          const cp = m.conf != null ? confPill(m.conf) : null;

          // ── CONFIRMADO: ficha sellada, compacta y claramente "cerrada" ──
          if (m.state === 'confirmed') {
            const open = expanded === m.id;
            return (
              <div key={m.id} className="relative rounded-lg overflow-hidden border border-[#BBF7D0] bg-gradient-to-r from-success50 to-white">
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-success" />
                <div className="pl-5 pr-4 py-3 flex items-center gap-3">
                  {/* Sello */}
                  <div className="relative flex-none">
                    <span className="w-9 h-9 rounded-full bg-success text-white flex items-center justify-center"><Icon name="check" size={17} /></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate400 tnum">{m.id}</span>
                      <span className="text-[13px] font-bold text-slate950 truncate">{m.parse.tipo}</span>
                      <span className="text-[9px] font-bold tracking-[0.06em] uppercase bg-success text-white rounded px-[6px] py-[2px]">Aplicado</span>
                    </div>
                    <div className="text-[11px] text-slate600 mt-[2px] truncate">
                      {m.from} · confirmado por <b className="text-slate800">{m.by}</b>{m.at ? ' · ' + m.at : ''}
                    </div>
                  </div>
                  {/* Dónde impactó */}
                  <div className="hidden sm:flex items-center gap-[6px] flex-none">
                    {(m.applied || [m.parse.destino]).map((x) => (
                      <span key={x} className="text-[10px] font-bold text-[#15803D] bg-white border border-[#BBF7D0] rounded-full px-[8px] py-[3px]">{x}</span>
                    ))}
                  </div>
                  <button onClick={() => setExpanded(open ? null : m.id)}
                    className="w-8 h-8 rounded-md text-slate500 hover:bg-white flex items-center justify-center flex-none">
                    <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} />
                  </button>
                </div>

                {open && (
                  <div className="border-t border-[#BBF7D0] bg-white px-5 py-4 grid grid-cols-2 gap-5">
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Mensaje original</div>
                      <div className="text-[12px] text-slate700 leading-relaxed italic">
                        “<HighlightedRaw text={m.raw} mapped={m.mapped} loose={m.loose} />”
                      </div>
                      {m.note && (
                        <div className="mt-3 bg-attention50 border-l-[3px] border-accent rounded-r px-3 py-2">
                          <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-[#A16207] mb-[2px]">Nota del director</div>
                          <div className="text-[11px] text-slate700 leading-snug">{m.note}</div>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Datos aplicados</div>
                      <div className="space-y-[5px]">
                        {m.parse.campos.map(([k, v]) => (
                          <div key={k} className="grid grid-cols-[110px_1fr] gap-2 text-[11px]">
                            <span className="text-slate500 truncate">{k}</span>
                            <span className="font-semibold text-slate900 truncate">{v}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => { patch(m.id, { state: 'pending' }); flash('Reabierto para revisión'); }}
                        className="mt-3 text-[11px] font-bold text-slate500 hover:text-primary">Revertir confirmación</button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // ── PENDIENTE / DESCARTADO / SALIENTE ──
          return (
            <div key={m.id} className="bg-white border border-slate200 rounded-lg overflow-hidden hover:shadow-card2 transition-shadow">
              <div className="grid grid-cols-[1fr_1px_1fr] gap-0">
                {/* Izquierda: mensaje crudo */}
                <div className="p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={"w-7 h-7 rounded-md flex items-center justify-center flex-none " + km.tint}><Icon name={km.ico} size={13} /></span>
                    <span className="text-[10px] font-bold text-slate400 tnum">{m.id}</span>
                    <span className={"text-[9px] font-bold px-[6px] py-[2px] rounded " + (isOut ? 'bg-primary-50 text-primary' : 'bg-success50 text-[#15803D]')}>
                      {isOut ? 'ENVIADO' : 'RECIBIDO'}
                    </span>
                    <span className="text-[11px] text-slate500 ml-auto">{m.time}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <DAvatar initials={(isOut ? m.to : m.from).split(' ').map((w) => w[0]).join('').replace('.', '')} size={22} />
                    <span className="text-[12px] font-bold text-slate950">{isOut ? 'Para ' + m.to : m.from}</span>
                    <span className="text-[11px] text-slate500">· {m.role}</span>
                  </div>

                  {m.kind === 'audio' && (
                    <div className="flex items-center gap-2 bg-[#DCF8C6] rounded-lg px-3 py-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-none"><Icon name="mic" size={13} /></span>
                      <div className="flex-1 flex items-center gap-[2px] h-5">
                        {[6,11,16,9,14,19,12,7,15,10,17,8,13,6,11].map((h, i) => (
                          <span key={i} style={{ height: h }} className="w-[2px] rounded-full bg-[#075E54]/45" />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-[#075E54] tnum flex-none">{m.dur}</span>
                    </div>
                  )}

                  {m.kind === 'photo' && (
                    <div className="flex gap-2 mb-2">
                      {Array.from({ length: Math.min(4, m.photos) }).map((_, i) => (
                        <div key={i} className="w-[52px] h-[52px] rounded-md bg-slate100 border border-slate200 flex items-center justify-center text-slate400"><Icon name="photo" size={16} /></div>
                      ))}
                    </div>
                  )}

                  <div className="text-[12px] text-slate700 leading-relaxed italic">
                    “<HighlightedRaw text={m.raw} mapped={m.mapped} loose={m.loose} />”
                  </div>

                  {!isOut && m.kind === 'audio' && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate400 flex-wrap">
                      <span>Transcripción automática</span>
                      {(m.mapped || []).length > 0 && <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-[3px] bg-success50 border border-[#BBF7D0]" /> capturado</span>}
                      {(m.loose || []).length > 0 && <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-[3px] bg-attention50 border border-[#FDE68A]" /> sin capturar</span>}
                    </div>
                  )}

                  {isOut && m.trigger && (
                    <div className="mt-2 inline-flex items-center gap-[6px] text-[10px] font-bold text-primary bg-primary-50 rounded px-2 py-1">
                      <Icon name="sparkle" size={10} /> {m.trigger}
                    </div>
                  )}
                </div>

                <div className="bg-slate100" />

                {/* Derecha: interpretación de la IA */}
                <div className="p-4 min-w-0 bg-slate50/40">
                  {isOut ? (
                    <div className="h-full flex flex-col justify-center">
                      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Estado del envío</div>
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#15803D]">
                        <span className="w-6 h-6 rounded-full bg-success50 flex items-center justify-center"><Icon name="check" size={12} /></span>
                        Entregado en WhatsApp
                      </div>
                      <div className="text-[11px] text-slate500 mt-2 leading-snug">Los mensajes del bot se disparan por reglas de la obra. Configurables en Configuración › Notificaciones.</div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-ink-deep text-accent flex items-center justify-center flex-none"><Icon name="sparkle" size={12} /></span>
                          <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate600">Interpretación de la IA</span>
                        </div>
                        {cp && <span className={"text-[9px] font-bold px-[6px] py-[3px] rounded flex-none " + cp.cls}>{cp.t} · {Math.round(m.conf * 100)}%</span>}
                      </div>

                      {m.parse.campos.length === 0 ? (
                        <div className="text-[12px] text-slate500 italic mb-3">{m.parse.tipo}</div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[11px] font-bold text-slate950">{m.parse.tipo}</span>
                            <Icon name="arrow-right" size={11} className="text-slate400" />
                            <span className="text-[10px] font-bold text-primary bg-primary-50 rounded px-2 py-[2px]">{m.parse.destino}</span>
                          </div>
                          <div className="space-y-[5px] mb-3">
                            {m.parse.campos.map(([k, v]) => (
                              <div key={k} className="grid grid-cols-[110px_1fr] gap-2 text-[11px]">
                                <span className="text-slate500 truncate">{k}</span>
                                <span className="font-semibold text-slate900 truncate">{v}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* ── Datos sueltos: lo que no entra en ningún campo ── */}
                      {(m.loose || []).length > 0 && m.state === 'pending' && (
                        <div className="mb-3 border border-[#FDE68A] bg-attention50 rounded-lg p-2">
                          <div className="flex items-center gap-[6px] mb-2">
                            <Icon name="alert" size={11} className="text-[#A16207] flex-none" />
                            <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-[#A16207]">Dicho pero no capturado</span>
                          </div>
                          <div className="space-y-2">
                            {m.loose.map((l, i) => (
                              <div key={i} className="bg-white border border-[#FDE68A] rounded p-2">
                                <div className="text-[11px] text-slate800 leading-snug italic">“{l.txt}”</div>
                                <div className="text-[10px] text-slate500 mt-[2px]">{l.why}</div>
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => { patch(m.id, { note: ((m.note ? m.note + ' ' : '') + l.txt).trim(), loose: m.loose.filter((_, k) => k !== i) }); flash('Agregado a la nota'); }}
                                    className="text-[10px] font-bold text-primary hover:underline">Guardar como nota</button>
                                  <button onClick={() => { setPick(m); }} className="text-[10px] font-bold text-primary hover:underline">Convertir en dato</button>
                                  <button onClick={() => patch(m.id, { loose: m.loose.filter((_, k) => k !== i) })}
                                    className="text-[10px] font-bold text-slate400 hover:text-slate600 ml-auto">Ignorar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.warn && (
                        <div className="flex items-start gap-2 bg-attention50 border border-[#FDE68A] rounded p-2 mb-3">
                          <Icon name="alert" size={11} className="text-[#A16207] mt-[2px] flex-none" />
                          <span className="text-[10px] text-slate700 leading-snug">{m.warn}</span>
                        </div>
                      )}

                      {/* ── Nota libre ── */}
                      {m.state === 'pending' && (
                        <div className="mb-3">
                          {noteFor === m.id || m.note ? (
                            <div className="border-l-[3px] border-accent bg-attention50 rounded-r p-2">
                              <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-[#A16207] mb-1">Nota libre</div>
                              <textarea value={m.note} onChange={(e) => patch(m.id, { note: e.target.value })}
                                onBlur={() => setNoteFor(null)} autoFocus={noteFor === m.id} rows={2}
                                placeholder="Contexto, aclaraciones o cualquier cosa que no entre en los campos…"
                                className="w-full bg-white border border-[#FDE68A] rounded px-2 py-[6px] text-[11px] text-slate800 focus:border-accent focus:outline-none resize-y min-h-[44px]" />
                            </div>
                          ) : (
                            <button onClick={() => setNoteFor(m.id)}
                              className="w-full flex items-center justify-center gap-[6px] text-[11px] font-bold text-slate500 hover:text-primary border border-dashed border-slate300 hover:border-primary rounded-lg py-[7px] transition-colors">
                              <Icon name="edit" size={11} /> Agregar nota libre
                            </button>
                          )}
                        </div>
                      )}

                      {m.state === 'pending' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <DButton variant="primary" size="sm" icon={<Icon name="check" size={12} />} onClick={() => confirmItem(m.id)}>Confirmar</DButton>
                          <DButton variant="secondary" size="sm" icon={<Icon name="edit" size={12} />} onClick={() => setPick(m)}>Corregir</DButton>
                          <button onClick={() => discardItem(m.id)} className="text-[11px] font-bold text-slate500 hover:text-[#B91C1C] px-2 py-[6px]">Descartar</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate500">Descartado · no impactó en la obra</span>
                          <button onClick={() => patch(m.id, { state: 'pending' })} className="text-[11px] font-bold text-primary hover:underline">Recuperar</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {active.list.length === 0 && (
          <div className="text-center text-slate500 py-12 text-[13px] border border-dashed border-slate200 rounded-lg flex flex-col items-center gap-2">
            <span className="w-12 h-12 rounded-full bg-success50 text-[#15803D] flex items-center justify-center"><Icon name="check" size={22} /></span>
            {tab === 'pendientes' ? 'No hay mensajes esperando confirmación.' : 'Nada por acá.'}
          </div>
        )}
      </div>

      {pick && <InboxCorrectModal msg={pick} onClose={() => setPick(null)}
        onSave={(res) => {
          patch(pick.id, { parse: { ...pick.parse, tipo: res.tipo, campos: res.campos }, note: res.note, loose: [] });
          confirmItem(pick.id);
        }} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

// Corregir la interpretación antes de confirmar
const InboxCorrectModal = ({ msg, onClose, onSave }) => {
  const [fields, setFields] = React.useState(msg.parse.campos.map(([k, v]) => [k, v]));
  const [tipo, setTipo] = React.useState(msg.parse.tipo);
  const [note, setNote] = React.useState(msg.note || '');
  const [newKey, setNewKey] = React.useState('');
  const [newVal, setNewVal] = React.useState('');
  const addField = () => {
    if (!newKey.trim()) return;
    setFields((p) => [...p, [newKey.trim(), newVal.trim()]]);
    setNewKey(''); setNewVal('');
  };
  const delField = (i) => setFields((p) => p.filter((_, k) => k !== i));
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const setF = (i, v) => setFields((p) => p.map((f, idx) => idx === i ? [f[0], v] : f));

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[560px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-ink-deep text-accent flex items-center justify-center"><Icon name="edit" size={16} /></div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">Corregir interpretación</div>
              <div className="text-[11px] text-slate500">{msg.id} · {msg.from}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-slate50 border border-slate200 rounded-lg p-3">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-1">Mensaje original</div>
            <div className="text-[12px] text-slate700 italic leading-snug">“{msg.raw}”</div>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">Tipo de dato</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
              {['Avance de tarea', 'Avance con foto', 'Alerta', 'Pedido de material', 'Entrega de material', 'Cierre de jornada', 'Sin dato accionable'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>

          {fields.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Campos detectados</div>
              <div className="space-y-2">
                {fields.map(([k, v], i) => (
                  <div key={k + i} className="grid grid-cols-[130px_1fr_28px] gap-2 items-center">
                    <span className="text-[11px] font-bold text-slate600 truncate">{k}</span>
                    <input value={v} onChange={(e) => setF(i, e.target.value)}
                      className="bg-white border border-slate200 rounded-md px-3 py-[7px] text-[12px] focus:border-primary focus:outline-none" />
                    <button onClick={() => delField(i)} className="w-7 h-7 rounded-md text-slate400 hover:text-[#B91C1C] hover:bg-slate100 flex items-center justify-center" title="Quitar campo"><Icon name="x" size={12} /></button>
                  </div>
                ))}
              </div>

              {/* Campo propio: para datos que la IA no contempló */}
              <div className="mt-3 border border-dashed border-slate300 rounded-lg p-2">
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Agregar un campo propio</div>
                <div className="grid grid-cols-[130px_1fr_auto] gap-2">
                  <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Nombre"
                    onKeyDown={(e) => e.key === 'Enter' && addField()}
                    className="bg-white border border-slate200 rounded-md px-2 py-[7px] text-[12px] focus:border-primary focus:outline-none" />
                  <input value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder="Valor"
                    onKeyDown={(e) => e.key === 'Enter' && addField()}
                    className="bg-white border border-slate200 rounded-md px-2 py-[7px] text-[12px] focus:border-primary focus:outline-none" />
                  <button onClick={addField} disabled={!newKey.trim()}
                    className={"px-3 rounded-md text-[12px] font-bold " + (newKey.trim() ? 'bg-primary text-white hover:bg-primary-700' : 'bg-slate200 text-slate400 cursor-not-allowed')}>Agregar</button>
                </div>
              </div>
            </div>
          )}

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate700">Nota libre <span className="font-normal text-slate500">— lo que no entra en ningún campo</span></span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="Ej: el camión rompió el cordón al entrar, avisar al encargado del consorcio."
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[66px]" />
          </label>

          {(msg.loose || []).length > 0 && (
            <div className="bg-attention50 border border-[#FDE68A] rounded-lg p-3">
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-[#A16207] mb-2">Fragmentos sin capturar</div>
              <div className="space-y-2">
                {msg.loose.map((l, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[11px] text-slate700 italic leading-snug flex-1">“{l.txt}”</span>
                    <button onClick={() => setNote((p) => (p ? p + ' ' : '') + l.txt)}
                      className="text-[10px] font-bold text-primary hover:underline flex-none">A la nota</button>
                    <button onClick={() => { setNewKey(''); setNewVal(l.txt); }}
                      className="text-[10px] font-bold text-primary hover:underline flex-none">A un campo</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 bg-primary-50 border border-primary/15 rounded-lg p-3">
            <Icon name="sparkle" size={12} className="text-primary mt-[2px] flex-none" />
            <span className="text-[11px] text-slate700 leading-snug">Tus correcciones entrenan al bot: la próxima vez que alguien mande un mensaje parecido, va a interpretarlo mejor.</span>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
          <button onClick={() => onSave({ tipo, campos: fields, note })} className="inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] bg-primary hover:bg-primary-700 text-white">
            <Icon name="check" size={14} /> Guardar y confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Screen: GALERÍA — documentación fotográfica por tarea y por fecha
// ============================================================================
// Las fotos que llegan por WhatsApp quedan asociadas a la tarea, el rubro, la
// fecha y quién las tomó. Es la evidencia que después alimenta certificaciones
// y reclamos.

const PHOTO_SEED = [
  { id: 'F-341', task: 'Columnas eje 4-6',     rubro: 'Hormigón armado', who: 'C. Ríos',    date: 'Hoy',    time: '10:15', tone: '#0F4395', note: 'Armado de columnas antes del colado.' },
  { id: 'F-340', task: 'Columnas eje 4-6',     rubro: 'Hormigón armado', who: 'C. Ríos',    date: 'Hoy',    time: '10:14', tone: '#0F4395', note: 'Detalle de estribos.' },
  { id: 'F-339', task: 'Columnas eje 4-6',     rubro: 'Hormigón armado', who: 'C. Ríos',    date: 'Hoy',    time: '10:13', tone: '#0F4395', note: '' },
  { id: 'F-338', task: 'Columnas eje 4-6',     rubro: 'Hormigón armado', who: 'C. Ríos',    date: 'Hoy',    time: '10:12', tone: '#0F4395', note: '' },
  { id: 'F-337', task: 'Hormigonado losa +3',  rubro: 'Hormigón armado', who: 'L. Benítez', date: 'Hoy',    time: '08:42', tone: '#0F4395', note: 'Losa terminada, 28 m³.' },
  { id: 'F-336', task: 'Tabiquería interior',  rubro: 'Mampostería',     who: 'P. Salas',   date: 'Ayer',   time: '16:20', tone: '#22C55E', note: 'Avance de tabiques planta 2.' },
  { id: 'F-335', task: 'Tabiquería interior',  rubro: 'Mampostería',     who: 'P. Salas',   date: 'Ayer',   time: '16:18', tone: '#22C55E', note: '' },
  { id: 'F-334', task: 'Andamio perimetral',   rubro: 'Mampostería',     who: 'A. Gómez',   date: 'Ayer',   time: '11:30', tone: '#22C55E', note: 'Baranda colocada — alerta AL-056 resuelta.', flag: 'Evidencia de alerta' },
  { id: 'F-333', task: 'Tendido eléctrico',    rubro: 'Instalaciones',   who: 'M. Ortiz',   date: '18 Ago', time: '14:05', tone: '#3B82F6', note: 'Cañería corrugada en losa.' },
  { id: 'F-332', task: 'Hormigonado losa +3',  rubro: 'Hormigón armado', who: 'L. Benítez', date: '18 Ago', time: '09:10', tone: '#0F4395', note: 'Encofrado listo.' },
  { id: 'F-331', task: 'Excavación general',   rubro: 'Movimiento de suelos', who: 'C. Ríos', date: '12 Ago', time: '07:50', tone: '#94A3B8', note: 'Cota de fondo alcanzada.' },
  { id: 'F-330', task: 'Cimentación pilotes',  rubro: 'Movimiento de suelos', who: 'C. Ríos', date: '12 Ago', time: '07:45', tone: '#94A3B8', note: 'Ensayo PIT aprobado.', flag: 'Documentación técnica' },
];

// Miniatura sintética: no hay fotos reales, así que se representa con un
// bloque de obra estilizado por rubro (placeholder consistente y legible).
const PhotoThumb = ({ p, h = 128 }) => (
  <div className="relative w-full overflow-hidden rounded-md" style={{ height: h, background: p.tone + '1f' }}>
    <svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <rect width="200" height="130" fill={p.tone} opacity="0.10" />
      {[...Array(7)].map((_, i) => <line key={'h' + i} x1="0" x2="200" y1={i * 20} y2={i * 20} stroke={p.tone} strokeOpacity="0.13" strokeWidth="1" />)}
      {[...Array(11)].map((_, i) => <line key={'v' + i} x1={i * 20} x2={i * 20} y1="0" y2="130" stroke={p.tone} strokeOpacity="0.13" strokeWidth="1" />)}
      <rect x="46"  y="66" width="26" height="46" rx="2" fill={p.tone} opacity="0.55" />
      <rect x="80"  y="46" width="26" height="66" rx="2" fill={p.tone} opacity="0.8" />
      <rect x="114" y="32" width="26" height="80" rx="2" fill={p.tone} />
      <rect x="114" y="32" width="26" height="12" rx="2" fill="#F59E0B" />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-white/70"><Icon name="photo" size={20} /></span>
    {p.flag && (
      <span className="absolute top-2 left-2 text-[8px] font-bold tracking-wider uppercase bg-white/90 text-slate700 rounded px-[5px] py-[2px]">{p.flag}</span>
    )}
    <span className="absolute bottom-2 right-2 text-[9px] font-bold text-white bg-slate950/55 rounded px-[5px] py-[2px] tnum">{p.time}</span>
  </div>
);

const ScreenGallery = ({ onNav }) => {
  const rubroStore = useRubroStore();
  const [group, setGroup] = React.useState('fecha'); // fecha | tarea
  const [fRubro, setFRubro] = React.useState('Todos');
  const [pick, setPick] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const list = PHOTO_SEED.filter((p) => fRubro === 'Todos' || p.rubro === fRubro);
  const key = (p) => group === 'fecha' ? p.date : p.task;
  const groups = list.reduce((acc, p) => { (acc[key(p)] = acc[key(p)] || []).push(p); return acc; }, {});

  const rubroOpts = ['Todos', ...rubroStore.names()];
  const idx = list.findIndex((p) => pick && p.id === pick.id);
  const go = (d) => { const n = idx + d; if (n >= 0 && n < list.length) setPick(list[n]); };

  React.useEffect(() => {
    if (!pick) return;
    const k = (e) => {
      if (e.key === 'Escape') setPick(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  return (
    <>
      <DPageHeader
        title="Galería de obra"
        subtitle={PHOTO_SEED.length + ' fotos · asociadas a su tarea, rubro, fecha y autor'}
        right={
          <>
            <DButton variant="secondary" size="sm" icon={<Icon name="download" size={13} />} onClick={() => flash('Exportando galería…')}>Exportar</DButton>
            <DButton variant="primary" size="sm" icon={<Icon name="upload" size={13} />} onClick={() => flash('Subiendo fotos…')}>Subir fotos</DButton>
          </>
        }
      />

      <div className="flex items-start gap-3 bg-info50 border border-[#BFDBFE] rounded-lg p-3 mb-4">
        <span className="w-8 h-8 rounded-md bg-info text-white flex items-center justify-center flex-none"><Icon name="photo" size={15} /></span>
        <div className="text-[12px] text-slate700 leading-snug flex-1">
          <b className="text-slate950">Las fotos que el equipo manda por WhatsApp llegan acá etiquetadas.</b> Sirven como evidencia de avance para certificaciones y reclamos: cada una guarda su tarea, fecha, hora y quién la tomó.
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap border-b border-slate200">
        <div className="flex gap-1 flex-wrap">
          {[['fecha', 'Por fecha'], ['tarea', 'Por tarea']].map(([id, l]) => {
            const on = group === id;
            return (
              <button key={id} onClick={() => setGroup(id)}
                className={"flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors " + (on ? 'text-primary border-primary' : 'text-slate500 border-transparent hover:text-slate700')}>
                {l}
                <span className={"text-[10px] font-bold px-[6px] py-[2px] rounded-full " + (on ? 'bg-primary-50 text-primary' : 'bg-slate100 text-slate700')}>
                  {Object.keys(list.reduce((a, p) => { a[id === 'fecha' ? p.date : p.task] = 1; return a; }, {})).length}
                </span>
              </button>
            );
          })}
        </div>
        <select value={fRubro} onChange={(e) => setFRubro(e.target.value)}
          className="text-[11px] font-semibold bg-white border border-slate200 rounded-md px-2 py-[6px] mb-2 focus:outline-none focus:border-primary flex-none">
          {rubroOpts.map((r) => <option key={r} value={r}>{r === 'Todos' ? 'Todos los rubros' : r}</option>)}
        </select>
      </div>

      {Object.keys(groups).length === 0 ? (
        <div className="text-center text-slate500 py-12 text-[13px] border border-dashed border-slate200 rounded-lg">No hay fotos con ese filtro.</div>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(groups).map(([g, photos]) => (
            <div key={g}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-md bg-slate100 text-slate600 flex items-center justify-center flex-none">
                  <Icon name={group === 'fecha' ? 'calendar' : 'layers'} size={12} />
                </span>
                <span className="text-[11px] tracking-[0.06em] uppercase font-bold text-slate600">{g}</span>
                <span className="text-[11px] text-slate400">· {photos.length} foto{photos.length === 1 ? '' : 's'}</span>
                {group === 'tarea' && (
                  <span className="text-[10px] font-bold px-[6px] py-[2px] rounded flex items-center gap-[5px]"
                    style={{ background: (RUBRO_COLORS[photos[0].rubro] || '#94A3B8') + '22', color: RUBRO_COLORS[photos[0].rubro] || '#64748B' }}>
                    {photos[0].rubro}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {photos.map((p) => (
                  <button key={p.id} onClick={() => setPick(p)}
                    className="text-left bg-white border border-slate200 rounded-lg overflow-hidden hover:border-primary hover:shadow-card2 transition-all group">
                    <PhotoThumb p={p} />
                    <div className="p-3">
                      <div className="text-[12px] font-bold text-slate950 truncate group-hover:text-primary transition-colors">{p.task}</div>
                      <div className="text-[10px] text-slate500 mt-[2px] flex items-center gap-[6px]">
                        <DAvatar initials={p.who.split(' ').map((w) => w[0]).join('').replace('.', '')} size={16} />
                        {p.who} · {group === 'fecha' ? p.time : p.date}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {pick && (
        <div onClick={() => setPick(null)} className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate950/80 backdrop-blur-sm animate-fade-task">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[860px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop max-h-[calc(100vh-48px)]">
            <div className="px-5 py-3 border-b border-slate200 flex items-center justify-between gap-3 flex-none">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: pick.tone }} />
                <span className="text-[13px] font-bold text-slate950 truncate">{pick.task}</span>
                <span className="text-[11px] text-slate500 flex-none">· {pick.id}</span>
              </div>
              <div className="flex items-center gap-1 flex-none">
                <button onClick={() => go(-1)} disabled={idx <= 0}
                  className={"w-8 h-8 rounded-md flex items-center justify-center " + (idx <= 0 ? 'text-slate300' : 'text-slate600 hover:bg-slate100')}><Icon name="chevron-right" size={14} className="rotate-180" /></button>
                <span className="text-[11px] text-slate500 tnum px-1">{idx + 1}/{list.length}</span>
                <button onClick={() => go(1)} disabled={idx >= list.length - 1}
                  className={"w-8 h-8 rounded-md flex items-center justify-center " + (idx >= list.length - 1 ? 'text-slate300' : 'text-slate600 hover:bg-slate100')}><Icon name="chevron-right" size={14} /></button>
                <button onClick={() => setPick(null)} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center ml-1"><Icon name="x" size={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_260px] flex-1 min-h-0">
              <div className="bg-slate100 p-4 flex items-center justify-center min-h-0">
                <div className="w-full max-w-[440px]"><PhotoThumb p={pick} h={300} /></div>
              </div>
              <div className="border-l border-slate200 p-4 overflow-y-auto">
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Datos de la foto</div>
                <div className="space-y-3">
                  {[
                    ['Tarea', pick.task, 'calendar'],
                    ['Rubro', pick.rubro, 'layers'],
                    ['Fecha', pick.date + ' · ' + pick.time, 'clock'],
                    ['Tomada por', pick.who, 'users'],
                    ['Origen', 'WhatsApp', 'message'],
                  ].map(([l, v, ic]) => (
                    <div key={l} className="flex items-start gap-2">
                      <span className="w-7 h-7 rounded-md bg-slate100 text-slate600 flex items-center justify-center flex-none"><Icon name={ic} size={12} /></span>
                      <div className="min-w-0">
                        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">{l}</div>
                        <div className="text-[12px] font-semibold text-slate950">{v}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {pick.note && (
                  <div className="mt-4">
                    <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-1">Nota</div>
                    <div className="text-[12px] text-slate700 leading-snug bg-slate50 border border-slate200 rounded p-2">{pick.note}</div>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <DButton variant="secondary" size="sm" icon={<Icon name="calendar" size={12} />} onClick={() => { setPick(null); onNav && onNav('gantt'); }}>Ver tarea</DButton>
                  <DButton variant="secondary" size="sm" icon={<Icon name="download" size={12} />} onClick={() => flash('Descargando…')}>Descargar</DButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

// ── Agrupador de secciones ──────────────────────────────────────────────────
// Varias pantallas responden a la misma pregunta del usuario (¿tengo material?
// ¿cuánto gasté?). Se agrupan bajo un solo ítem de menú con un conmutador
// arriba, en vez de ocupar tres lugares distintos en el sidebar.
const makeGroupScreen = (subs) => {
  const Group = (props) => {
    const [sub, setSub] = React.useState(subs[0].id);
    const active = subs.find((x) => x.id === sub) || subs[0];
    return (
      <>
        <div className="flex items-center gap-1 bg-slate100 rounded-lg p-[3px] mb-5 w-fit">
          {subs.map((x) => {
            const on = sub === x.id;
            return (
              <button key={x.id} onClick={() => setSub(x.id)}
                className={"inline-flex items-center gap-2 text-[12px] font-bold px-[14px] py-[7px] rounded-md transition-colors " +
                  (on ? 'bg-white text-slate950 shadow-card' : 'text-slate600 hover:text-slate950')}>
                <Icon name={x.icon} size={13} className={on ? 'text-primary' : 'text-slate400'} />
                {x.label}
                {x.badge && <span className={"text-[9px] font-bold px-[5px] py-[1px] rounded-full " + (on ? 'bg-primary-50 text-primary' : 'bg-slate200 text-slate600')}>{x.badge}</span>}
              </button>
            );
          })}
        </div>
        <active.Comp {...props} />
      </>
    );
  };
  return Group;
};

const ScreenMateriales = makeGroupScreen([
  { id: 'pedidos', label: 'Pedidos', icon: 'package', badge: 7, Comp: ScreenMaterials },
  { id: 'stock',   label: 'Stock',   icon: 'box',                Comp: ScreenStock },
]);

const ScreenCostos = makeGroupScreen([
  { id: 'presupuesto', label: 'Presupuesto', icon: 'dollar',  Comp: ScreenBudget },
  { id: 'recibos',     label: 'Comprobantes', icon: 'receipt', Comp: ScreenReceipts },
]);

const ScreenRegistro = makeGroupScreen([
  { id: 'actividad', label: 'Actividad', icon: 'message', Comp: ScreenActivity },
  { id: 'galeria',   label: 'Galería',   icon: 'photo',   Comp: ScreenGallery },
  { id: 'reportes',  label: 'Reportes',  icon: 'chart',   Comp: ScreenReports },
]);

const SCREENS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: 'grid',     crumb: 'Dashboard',  Comp: ScreenDashboard },
  { id: 'inbox',      label: 'Bandeja',    icon: 'message',  crumb: 'Bandeja',    Comp: ScreenInbox, badge: 3 },
  { id: 'gantt',      label: 'Cronograma', icon: 'calendar', crumb: 'Cronograma', Comp: ScreenGantt },
  { id: 'materiales', label: 'Materiales', icon: 'package',  crumb: 'Materiales', Comp: ScreenMateriales, badge: 7 },
  { id: 'costos',     label: 'Costos',     icon: 'dollar',   crumb: 'Costos',     Comp: ScreenCostos },
  { id: 'alerts',     label: 'Alertas',    icon: 'alert',    crumb: 'Alertas',    Comp: ScreenAlerts, badge: 2 },
  { id: 'registro',   label: 'Registro',   icon: 'photo',    crumb: 'Registro',   Comp: ScreenRegistro },
  { id: 'team',       label: 'Equipo',     icon: 'users',    crumb: 'Equipo',     Comp: ScreenTeam },
];

// Rutas que ya no están en el sidebar pero siguen siendo navegables por deep-link
// (los onNav('rubros'), onNav('materials'), etc. del resto de la app).
// Sidebar previo al colapso: 13 ítems planos, sin agrupar. Se conserva para
// poder comparar ambas arquitecturas de navegación desde el panel de Tweaks.
const SCREENS_FLAT = [
  { id: 'dashboard',  label: 'Dashboard',  icon: 'grid',     crumb: 'Dashboard',  Comp: ScreenDashboard },
  { id: 'inbox',      label: 'Bandeja',    icon: 'message',  crumb: 'Bandeja',    Comp: ScreenInbox, badge: 3 },
  { id: 'gantt',      label: 'Cronograma', icon: 'calendar', crumb: 'Cronograma', Comp: ScreenGantt },
  { id: 'rubros',     label: 'Rubros',     icon: 'layers',   crumb: 'Rubros',     Comp: ScreenRubros },
  { id: 'alerts',     label: 'Alertas',    icon: 'alert',    crumb: 'Alertas',    Comp: ScreenAlerts, badge: 2 },
  { id: 'materials',  label: 'Pedidos',    icon: 'package',  crumb: 'Pedidos',    Comp: ScreenMaterials, badge: 7 },
  { id: 'stock',      label: 'Stock',      icon: 'box',      crumb: 'Stock',      Comp: ScreenStock },
  { id: 'receipts',   label: 'Recibos',    icon: 'receipt',  crumb: 'Recibos',    Comp: ScreenReceipts },
  { id: 'budget',     label: 'Presupuesto',icon: 'dollar',   crumb: 'Presupuesto',Comp: ScreenBudget },
  { id: 'gallery',    label: 'Galería',    icon: 'photo',    crumb: 'Galería',    Comp: ScreenGallery },
  { id: 'activity',   label: 'Actividad',  icon: 'message',  crumb: 'Actividad',  Comp: ScreenActivity },
  { id: 'reports',    label: 'Reportes',   icon: 'chart',    crumb: 'Reportes',   Comp: ScreenReports },
  { id: 'team',       label: 'Equipo',     icon: 'users',    crumb: 'Equipo',     Comp: ScreenTeam },
];

const ROUTE_ALIASES = {
  materials:   'materiales',
  stock:       'materiales',
  budget:      'costos',
  receipts:    'costos',
  activity:    'registro',
  gallery:     'registro',
  reports:     'registro',
  rubros:      'rubros',
};
const EXTRA_SCREENS = [
  { id: 'rubros', label: 'Rubros', icon: 'layers', crumb: 'Rubros', Comp: ScreenRubros, hidden: true },
];

const DashSidebar = ({ current, onNav, items = SCREENS, projectLabel = 'Edificio Belgrano', projectSub = '68% completa', userInitials = 'JM', userName = 'J. Méndez', userRole = 'Director de obra' }) => (
  <aside className="w-[220px] bg-ink-deep text-white flex flex-col flex-none">
    <div className="px-4 py-4 flex items-center gap-[10px]">
      <Icon name="logo-mark" size={28} />
      <div className="font-extrabold text-[16px] display-tight">BuildData</div>
    </div>

    <div className="px-3 pb-3">
      <div className="bg-white/[0.06] rounded-lg px-3 py-[10px]">
        <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/50">Obra activa</div>
        <div className="text-[13px] font-bold mt-[2px]">{projectLabel}</div>
        {projectSub && <div className="text-[11px] text-white/60 mt-[1px]">{projectSub}</div>}
      </div>
    </div>

    <nav data-tour="sidebar" className="px-3 flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
      {items.map((s) => {
        const on = current === s.id;
        return (
          <button key={s.id} data-tour={s.id === 'gantt' ? 'nav-gantt' : s.id === 'presupuesto' ? 'nav-presupuesto' : undefined} onClick={() => onNav(s.id)}
            className={`relative flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left transition-colors
              ${on ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}>
            {on && <span className="absolute -left-3 top-[8px] bottom-[8px] w-[3px] bg-accent rounded" />}
            <span className={on ? 'text-accent' : 'text-white/55'}>
              <Icon name={s.icon} size={16} />
            </span>
            <span className="flex-1">{s.label}</span>
            {s.badge && (
              <span className={`text-[9px] font-bold px-[6px] py-[1.5px] rounded-full
                ${s.id === 'alerts' ? 'bg-critical text-white' : 'bg-white/20 text-white'}`}>{s.badge}</span>
            )}
          </button>
        );
      })}
    </nav>

    <div className="px-3 pb-2 pt-1 flex flex-col gap-1">
      <a href="Configuracion.html"
        className="flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors">
        <span className="text-white/55"><Icon name="grid" size={16} /></span>
        <span className="flex-1">Configuración</span>
      </a>
      <button
        className="flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors">
        <span className="text-white/55"><Icon name="info" size={16} /></span>
        <span className="flex-1">Ayuda y soporte</span>
      </button>
    </div>

    <div className="border-t border-white/10 p-3 flex items-center gap-[10px]">
      <DAvatar initials={userInitials} size={30} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold">{userName}</div>
        <div className="text-[10px] text-white/55">{userRole}</div>
      </div>
    </div>
  </aside>
);

// ── Quick-add: dropdown menu + per-kind modal ──────────────────────────────
const QUICK_ADD_TYPES = [
  { kind: 'tarea',    label: 'Tarea',         sub: 'Sumá una tarea al cronograma', icon: 'calendar', tint: 'bg-primary-50 text-primary' },
  { kind: 'critico',  label: 'Crítico / alerta', sub: 'Reportá un problema en obra', icon: 'alert',  tint: 'bg-critical50 text-[#B91C1C]' },
  { kind: 'pedido',   label: 'Pedido',        sub: 'Pedí material a un proveedor',  icon: 'package',  tint: 'bg-attention50 text-[#A16207]' },
  { kind: 'reporte',  label: 'Actividad',     sub: 'Registrá un avance manual',     icon: 'chart',    tint: 'bg-info50 text-[#1D4ED8]' },
  { kind: 'equipo',   label: 'Invitar equipo', sub: 'Sumá un miembro u obrero',     icon: 'users',    tint: 'bg-success50 text-[#15803D]' },
];

const QuickAddMenu = ({ onPick }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-[6px] font-bold rounded-md border transition-colors bg-primary hover:bg-primary-700 text-white border-primary text-[13px] px-4 py-[8px]">
        <Icon name="plus" size={13} /> Nuevo
        <Icon name="chevron-down" size={12} className={"transition-transform " + (open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute right-0 top-[42px] w-[268px] bg-white border border-slate200 rounded-lg shadow-pop overflow-hidden z-50 animate-fade-task">
          <div className="px-4 py-2 text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 border-b border-slate100">Agregar rápido</div>
          {QUICK_ADD_TYPES.map((t) => (
            <button key={t.kind} onClick={() => { setOpen(false); onPick(t.kind); }}
              className="w-full flex items-center gap-3 px-3 py-[10px] hover:bg-slate50 text-left transition-colors">
              <span className={"w-8 h-8 rounded-md flex items-center justify-center flex-none " + t.tint}><Icon name={t.icon} size={15} /></span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold text-slate950">{t.label}</span>
                <span className="block text-[11px] text-slate500 truncate">{t.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Field configs per kind
const QUICK_FORMS = {
  tarea: {
    title: 'Nueva tarea', icon: 'calendar', accent: '#0F4395', done: (d) => `Tarea “${d.nombre}” agregada al cronograma`,
    fields: [
      { id: 'nombre', label: 'Nombre de la tarea', type: 'text', placeholder: 'Ej: Hormigonado losa +4', required: true },
      { id: 'rubro',  label: 'Rubro', type: 'select', addable: true, options: ['Movimiento de suelos', 'Hormigón armado', 'Mampostería', 'Instalaciones'] },
      { id: 'who',    label: 'Responsable', type: 'select', options: ['C. Ríos', 'L. Benítez', 'P. Salas', 'M. Ortiz', 'A. Gómez'] },
      { id: 'desc',   label: 'Descripción breve', type: 'textarea', placeholder: 'Qué hay que hacer, cantidades, observaciones…' },
    ],
  },
  critico: {
    title: 'Reportar crítico', icon: 'alert', accent: '#EF4444', done: (d) => `Alerta “${d.titulo}” reportada`,
    fields: [
      { id: 'titulo', label: 'Título del problema', type: 'text', placeholder: 'Ej: Falla en Grúa Torre 2', required: true },
      { id: 'nivel',  label: 'Nivel', type: 'select', options: ['Crítico', 'Importante', 'Moderado'] },
      { id: 'cat',    label: 'Categoría', type: 'select', addable: true, addPlaceholder: 'Nombre de la categoría', options: ['Equipos', 'Materiales', 'Seguridad', 'Personal', 'Logística', 'Reportes'] },
      { id: 'desc',   label: 'Descripción', type: 'textarea', placeholder: 'Detalle de lo que pasó…' },
    ],
  },
  pedido: {
    title: 'Nuevo pedido', icon: 'package', accent: '#F59E0B', done: (d) => `Pedido de “${d.material}” creado`,
    fields: [
      { id: 'material', label: 'Material', type: 'text', placeholder: 'Ej: Cemento Portland 50 kg', required: true },
      { id: 'cantidad', label: 'Cantidad', type: 'text', placeholder: 'Ej: 120 bolsas' },
      { id: 'prov',     label: 'Proveedor', type: 'text', placeholder: 'Ej: Cementos del Plata' },
      { id: 'fecha',    label: 'Fecha de llegada', type: 'date' },
    ],
  },
  reporte: {
    title: 'Nueva actividad', icon: 'chart', accent: '#3B82F6', done: () => 'Actividad registrada',
    fields: [
      { id: 'tipo', label: 'Tipo', type: 'select', options: ['Avance de tarea', 'Foto', 'Cierre de jornada', 'Problema'] },
      { id: 'texto', label: 'Detalle', type: 'textarea', placeholder: 'Qué se hizo, cantidades, observaciones…', required: true },
    ],
  },
  persona: {
    title: 'Invitar persona', icon: 'users', accent: '#22C55E', done: (d) => `Invitación enviada a ${d.nombre || 'la persona'}`,
    fields: [
      { id: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Marta Robles', required: true },
      { id: 'tel',    label: 'WhatsApp', type: 'phone' },
      { id: 'rol',    label: 'Rol', type: 'select', options: ['Director de obra', 'Capataz', 'Compras', 'Arquitecto/a', 'Cliente / propietario'] },
    ],
  },
};

// Invitar equipo: elegir miembro de BuildData (acceso a la app) u obrero (WhatsApp).
const InviteTeamModal = ({ onClose, onDone }) => {
  const [mode, setMode] = React.useState(null); // null | 'miembro' | 'obrero'
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  // Miembro de BuildData
  const [m, setM] = React.useState({ email: '', nombre: '', rol: 'Sin asignar' });
  const ROLES = ['Sin asignar', 'Director de obra', 'Capataz', 'Compras', 'Arquitecto/a', 'Ingeniero/a', 'Seguridad e higiene', 'Cliente / propietario'];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim());

  // Obrero
  const [o, setO] = React.useState({ nombre: '', tel: '' });
  const [link, setLink] = React.useState(null);
  const obreroOk = o.nombre.trim().length >= 2 && o.tel.trim().length >= 6;
  const genLink = () => {
    if (!obreroOk) return;
    let h = 0; const s = o.nombre + o.tel + Date.now();
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    setLink('wa.me/buildata/ob-' + h.toString(36).slice(0, 8));
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[500px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            {mode && <button onClick={() => { setMode(null); setLink(null); }} className="w-7 h-7 rounded-md hover:bg-slate100 text-slate500 flex items-center justify-center"><Icon name="chevron-right" size={15} className="rotate-180" /></button>}
            <div className="w-9 h-9 rounded-md bg-success50 text-[#15803D] flex items-center justify-center"><Icon name="users" size={16} /></div>
            <div className="text-[15px] font-extrabold display-tight">
              {mode === 'miembro' ? 'Nuevo miembro' : mode === 'obrero' ? 'Invitar obrero' : 'Invitar al equipo'}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>

        {!mode && (
          <div className="p-5 space-y-3">
            <button onClick={() => setMode('miembro')} className="w-full text-left border border-slate200 rounded-lg p-4 hover:border-primary hover:shadow-card2 transition-all flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-none"><Icon name="users" size={18} /></span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold text-slate950">Miembro de BuildData</span>
                <span className="block text-[12px] text-slate500">Accede a la app para ver o editar la obra. Se invita por email y <b>ya debe tener una cuenta en BuildData.</b></span>
              </span>
            </button>
            <button onClick={() => setMode('obrero')} className="w-full text-left border border-slate200 rounded-lg p-4 hover:border-primary hover:shadow-card2 transition-all flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-[#25D366]/15 text-[#15803D] flex items-center justify-center flex-none"><Icon name="message" size={18} /></span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold text-slate950">Obrero por WhatsApp</span>
                <span className="block text-[12px] text-slate500">Solo reporta avances por chat, sin cuenta ni app. Link individual.</span>
              </span>
            </button>
          </div>
        )}

        {mode === 'miembro' && (
          <>
            <div className="p-6 space-y-4 overflow-y-auto">
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate700">Email*</span>
                <input value={m.email} onChange={(e) => setM({ ...m, email: e.target.value })} type="email" placeholder="nombre@empresa.com"
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
                <span className="text-[10px] text-slate500">La persona ya debe tener una cuenta en BuildData con ese email.</span>
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate700">Nombre</span>
                <input value={m.nombre} onChange={(e) => setM({ ...m, nombre: e.target.value })} placeholder="Ej: Marta Robles"
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate700">Rol</span>
                <select value={m.rol} onChange={(e) => setM({ ...m, rol: e.target.value })}
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <div className="text-[11px] text-slate500 leading-snug">Le llega una invitación por email con el rol elegido. Si no tiene cuenta, se crea al aceptar.</div>
            </div>
            <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex justify-end gap-2 flex-none">
              <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
              <button onClick={() => { onDone(`Invitación enviada a ${m.nombre.trim() || m.email}`); onClose(); }} disabled={!emailOk}
                className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${emailOk ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed'}`}>
                Enviar invitación <Icon name="check" size={14} />
              </button>
            </div>
          </>
        )}

        {mode === 'obrero' && (
          <>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-start gap-3 bg-[#25D366]/[0.08] border border-[#25D366]/25 rounded-lg p-3">
                <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-none"><Icon name="message" size={13} /></div>
                <div className="text-[12px] text-slate700 leading-snug">El obrero no necesita cuenta ni app. Generás su link único de WhatsApp y, al abrirlo, queda vinculado a la obra para reportar por chat.</div>
              </div>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate700">Nombre del obrero*</span>
                <input value={o.nombre} onChange={(e) => { setO({ ...o, nombre: e.target.value }); setLink(null); }} placeholder="Ej: Ramón Díaz"
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate700">Teléfono*</span>
                <PhoneInput value={o.tel} onChange={(full) => { setO({ ...o, tel: full }); setLink(null); }} />
              </label>
              {link && (
                <div className="flex items-center gap-2 bg-success50 border border-[#BBF7D0] rounded-md px-3 py-[8px]">
                  <Icon name="message" size={13} className="text-[#15803D] flex-none" />
                  <code className="flex-1 min-w-0 text-[11px] text-[#15803D] font-semibold truncate">{link}</code>
                  <span className="text-[10px] font-bold text-[#15803D]">link generado</span>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex justify-end gap-2 flex-none">
              <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
              {link ? (
                <button onClick={() => { onDone(`Obrero ${o.nombre.trim()} invitado por WhatsApp`); onClose(); }}
                  className="inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] bg-[#25D366] hover:brightness-95 text-white">
                  <Icon name="message" size={14} /> Enviar por WhatsApp
                </button>
              ) : (
                <button onClick={genLink} disabled={!obreroOk}
                  className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${obreroOk ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed'}`}>
                  Generar link <Icon name="arrow-right" size={14} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const QuickAddModal = ({ kind, onClose, onDone }) => {
  // "Invitar equipo" → chooser entre nuevo miembro (acceso app) u obrero (WhatsApp).
  if (kind === 'equipo') {
    return <InviteTeamModal onClose={onClose} onDone={onDone} />;
  }
  // "Tarea" reuses the full Cronograma modal so both flows are identical.
  if (kind === 'tarea') {
    return (
      <NuevaTareaModal
        open={true}
        onClose={onClose}
        onCreate={(t) => { onDone(`Tarea “${t.name}” agregada al cronograma`); onClose(); }}
      />
    );
  }
  // "Pedido" reuses the full Pedidos modal so both flows are identical.
  if (kind === 'pedido') {
    return (
      <NewOrderModal
        count={0}
        onClose={onClose}
        onSave={(o) => { onDone(`Pedido “${o.mat}” creado`); onClose(); }}
      />
    );
  }
  const cfg = kind ? QUICK_FORMS[kind] : null;
  const [data, setData] = React.useState({});
  const [extraOpts, setExtraOpts] = React.useState({}); // fieldId -> [added options]
  const [adding, setAdding] = React.useState(null);      // fieldId currently adding to
  const [addVal, setAddVal] = React.useState('');
  React.useEffect(() => { setData({}); setExtraOpts({}); setAdding(null); }, [kind]);
  React.useEffect(() => {
    if (!kind) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [kind, onClose]);
  if (!cfg) return null;

  const required = cfg.fields.filter((f) => f.required).map((f) => f.id);
  const canSave = required.every((id) => (data[id] || '').trim());

  const set = (id, v) => setData((p) => ({ ...p, [id]: v }));
  const submit = () => { if (!canSave) return; onDone(cfg.done(data)); onClose(); };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[520px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: cfg.accent + '22', color: cfg.accent }}>
              <Icon name={cfg.icon} size={16} />
            </div>
            <div className="text-[15px] font-extrabold display-tight">{cfg.title}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {cfg.fields.map((f) => {
            const opts = [...(f.options || []), ...(extraOpts[f.id] || [])];
            const commitAdd = () => {
              const v = addVal.trim();
              if (v) { if (!opts.includes(v)) setExtraOpts((p) => ({ ...p, [f.id]: [...(p[f.id] || []), v] })); set(f.id, v); }
              setAdding(null); setAddVal('');
            };
            return (
            <label key={f.id} className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate700">{f.label}{f.required && '*'}</span>
                {f.addable && adding !== f.id && (
                  <button type="button" onClick={() => { setAdding(f.id); setAddVal(''); }}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-[3px]"><Icon name="plus" size={10} /> Nuevo</button>
                )}
              </div>
              {f.addable && adding === f.id ? (
                <div className="flex gap-1">
                  <input autoFocus value={addVal} onChange={(e) => setAddVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitAdd(); else if (e.key === 'Escape') setAdding(null); }}
                    placeholder={f.addPlaceholder || 'Nombre del rubro'}
                    className="flex-1 min-w-0 bg-white border border-primary rounded-md px-3 py-[9px] text-[13px] focus:outline-none" />
                  <button type="button" onClick={commitAdd} className="px-3 rounded-md bg-primary text-white flex items-center justify-center"><Icon name="check" size={14} /></button>
                  <button type="button" onClick={() => setAdding(null)} className="px-2 rounded-md border border-slate200 text-slate500 flex items-center justify-center"><Icon name="x" size={14} /></button>
                </div>
              ) : f.type === 'phone' ? (
                <PhoneInput value={data[f.id] || ''} onChange={(full) => set(f.id, full)} />
              ) : f.type === 'select' ? (
                <select value={data[f.id] || opts[0]} onChange={(e) => set(f.id, e.target.value)}
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none">
                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea value={data[f.id] || ''} onChange={(e) => set(f.id, e.target.value)} placeholder={f.placeholder} rows={3}
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[72px]" />
              ) : (
                <input type={f.type} value={data[f.id] || ''} onChange={(e) => set(f.id, e.target.value)} placeholder={f.placeholder}
                  className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
              )}
            </label>
            );
          })}
        </div>
        <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave}
            className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (canSave ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed')}>
            Crear <Icon name="check" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DashTopBar = ({ crumb, userInitials = 'JM', onQuickAdd }) => {
  const [openNotifs, setOpenNotifs] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpenNotifs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
  <header className="h-[52px] px-5 border-b border-slate200 bg-white/85 backdrop-blur flex items-center gap-3 flex-none">
    <div className="text-[12px] text-slate500 whitespace-nowrap flex-none">
      Obra Belgrano <span className="mx-2 text-slate300">/</span>
      <b className="text-slate950">{crumb}</b>
    </div>
    <div className="flex-1" />
    <div className="hidden xl:flex flex-none items-center gap-2 w-[260px] bg-slate50 border border-slate200 rounded-md px-3 py-[6px] text-[12px] text-slate500 whitespace-nowrap overflow-hidden" data-tour="search">
      <Icon name="search" size={14} />
      <span className="min-w-0 truncate">Buscar tareas, pedidos, personas…</span>
      <span className="ml-auto flex-none bg-white border border-slate200 text-[10px] font-bold px-[5px] py-[1px] rounded">⌘K</span>
    </div>
    <div data-tour="new"><QuickAddMenu onPick={onQuickAdd} /></div>
    <div className="relative" ref={ref}>
      <button data-tour="bell" onClick={() => setOpenNotifs((o) => !o)}
        className={`w-9 h-9 rounded-md border flex items-center justify-center relative transition-colors ${openNotifs ? 'border-primary bg-primary-50 text-primary' : 'border-slate200 bg-white text-slate600 hover:bg-slate50'}`}>
        <Icon name="bell" size={15} />
        <span className="absolute top-[6px] right-[6px] w-2 h-2 rounded-full bg-critical border-2 border-white" />
      </button>
      {openNotifs && <NotificationsPanel onClose={() => setOpenNotifs(false)} />}
    </div>
    <DAvatar initials={userInitials} size={32} />
  </header>
  );
};

// ── Notifications panel ────────────────────────────────────────────────────
const NOTIF_SEED = [
  { id: 'n1', kind: 'invite', read: false, time: 'hace 5 min',
    obra: 'Torre Rivadavia', by: 'M. Sosa', role: 'Capataz',
    text: 'te invitó a sumarte a la obra' },
  { id: 'n2', kind: 'critical', read: false, time: 'hace 12 min', icon: 'alert',
    tint: 'bg-critical50 text-[#B91C1C]', title: 'Alerta crítica',
    text: 'Falla en Grúa Torre 2 · Edificio Belgrano' },
  { id: 'n3', kind: 'order', read: false, time: 'hace 1 h', icon: 'package',
    tint: 'bg-attention50 text-[#A16207]', title: 'Pedido por aprobar',
    text: 'PED-0140 · Ladrillo cerámico espera tu aprobación' },
  { id: 'n4', kind: 'delivery', read: true, time: 'hace 3 h', icon: 'truck',
    tint: 'bg-info50 text-[#1D4ED8]', title: 'Entrega registrada',
    text: 'Cemento × 120 bolsas recibido por C. Ríos' },
  { id: 'n5', kind: 'budget', read: true, time: 'ayer', icon: 'dollar',
    tint: 'bg-primary-50 text-primary', title: 'Aviso de presupuesto',
    text: 'Mampostería superó su tope en 5%' },
  { id: 'n6', kind: 'activity', read: true, time: 'ayer', icon: 'check',
    tint: 'bg-success50 text-[#15803D]', title: 'Tarea completada',
    text: 'L. Benítez marcó “Hormigonado losa +3”' },
];

const NotificationsPanel = ({ onClose }) => {
  const [items, setItems] = React.useState(NOTIF_SEED);
  const [toast, setToast] = React.useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2000); };
  const unread = items.filter((n) => !n.read).length;

  const resolveInvite = (id, accepted) => {
    setItems((p) => p.map((n) => n.id === id ? { ...n, read: true, resolved: accepted ? 'accepted' : 'rejected' } : n));
    flash(accepted ? 'Te uniste a la obra' : 'Invitación rechazada');
  };
  const markAll = () => setItems((p) => p.map((n) => ({ ...n, read: true })));

  return (
    <>
      <div className="absolute right-0 top-[42px] w-[360px] max-w-[calc(100vw-32px)] bg-white border border-slate200 rounded-xl shadow-pop overflow-hidden z-[70] animate-fade-task">
        <div className="px-4 py-3 border-b border-slate200 flex items-center justify-between">
          <div className="text-[13px] font-bold text-slate950">Notificaciones {unread > 0 && <span className="ml-1 text-[10px] font-bold text-white bg-critical rounded-full px-[6px] py-[1px] align-middle">{unread}</span>}</div>
          <button onClick={markAll} className="text-[11px] font-bold text-primary hover:underline">Marcar todo leído</button>
        </div>
        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate100">
          {items.map((n) => (
            <div key={n.id} className={`px-4 py-3 flex gap-3 ${n.read ? '' : 'bg-primary-50/30'}`}>
              {n.kind === 'invite' ? (
                <>
                  <div className="w-8 h-8 rounded-md bg-primary-50 text-primary flex items-center justify-center flex-none"><Icon name="users" size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] leading-snug text-slate800">
                      <b className="text-slate950">{n.by}</b> {n.text} <b className="text-slate950">{n.obra}</b> como <b className="text-primary">{n.role}</b>.
                    </div>
                    <div className="text-[10px] text-slate500 mt-[2px]">{n.time}</div>
                    {!n.resolved ? (
                      <div className="flex gap-2 mt-2">
                        <DButton variant="primary" size="sm" onClick={() => resolveInvite(n.id, true)}>Aceptar</DButton>
                        <DButton variant="secondary" size="sm" onClick={() => resolveInvite(n.id, false)}>Rechazar</DButton>
                      </div>
                    ) : (
                      <div className={`text-[11px] font-bold mt-2 inline-flex items-center gap-1 ${n.resolved === 'accepted' ? 'text-[#15803D]' : 'text-slate500'}`}>
                        <Icon name={n.resolved === 'accepted' ? 'check' : 'x'} size={12} /> {n.resolved === 'accepted' ? 'Aceptada' : 'Rechazada'}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-none ${n.tint}`}><Icon name={n.icon} size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-slate950">{n.title}</div>
                    <div className="text-[11px] text-slate600 leading-snug">{n.text}</div>
                    <div className="text-[10px] text-slate500 mt-[2px]">{n.time}</div>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-none mt-1" />}
                </>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-slate200 bg-slate50 text-center">
          <button className="text-[11px] font-bold text-primary hover:underline">Ver todas</button>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
};

const LiveDashboard = ({ height = 720, initial = 'dashboard', screens, projectLabel, projectSub, userInitials = 'JM', userName = 'J. Méndez', userRole = 'Director de obra', onComplete, navVariant = 'grouped' }) => {
  const flat = navVariant === 'flat';
  const base = flat ? SCREENS_FLAT : SCREENS;
  const list = screens || base;
  // Todas las pantallas navegables = las del sidebar + las ocultas (deep-link).
  const allScreens = screens ? screens : (flat ? SCREENS_FLAT : [...SCREENS, ...EXTRA_SCREENS]);
  const [route, setRoute] = React.useState(initial);
  // En la versión agrupada se traducen los ids antiguos a los nuevos grupos.
  const nav = (id) => setRoute(flat ? id : ((typeof ROUTE_ALIASES !== 'undefined' && ROUTE_ALIASES[id]) || id));
  const [quickAdd, setQuickAdd] = React.useState(null);
  const [tourOpen, setTourOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const toastRef = React.useRef(null);
  const flash = (m) => { setToast(m); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(null), 2600); };
  const s = allScreens.find((x) => x.id === route) || list[0];
  const contentRef = React.useRef(null);

  // scroll to top on route change
  React.useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [route]);

  return (
    <div style={{ height }} className="flex bg-paper rounded-lg overflow-hidden border border-slate200 shadow-big">
      <DashSidebar current={route} onNav={nav} items={list} projectLabel={projectLabel} projectSub={projectSub} userInitials={userInitials} userName={userName} userRole={userRole} />
      <div className="flex-1 min-w-0 flex flex-col">
        <DashTopBar crumb={s.crumb} userInitials={userInitials} onQuickAdd={setQuickAdd} />
        <main ref={contentRef} className="flex-1 overflow-y-auto bg-paper">
          <div className="p-6 max-w-[1100px] mx-auto">
            <s.Comp onNav={nav} onComplete={onComplete} onQuickAdd={setQuickAdd} onStartTour={() => setTourOpen(true)} />
          </div>
        </main>
      </div>

      <QuickAddModal kind={quickAdd} onClose={() => setQuickAdd(null)} onDone={flash} />
      <ProductTour open={tourOpen} onClose={() => setTourOpen(false)} />
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Icon name="check" size={14} className="text-success" />
          {toast}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { LiveDashboard, DCard, DButton, DPill, DAvatar, DPageHeader, DStatTile, DashSidebar, DashTopBar, SCREENS });
