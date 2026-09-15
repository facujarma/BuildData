// Dashboard EMPTY state — first-time user, no construction site set up yet.
// Each screen has a thoughtful onboarding empty state with a clear next action.
// Reuses DCard / DButton / DPill / DPageHeader from live-dashboard.jsx.

// ---------------------------------------------------------------------------
// Shared building blocks for empty states
// ---------------------------------------------------------------------------

const EmptyHero = ({ icon, eyebrow, title, body, primary, secondary, illustration }) => (
  <div className="grid grid-cols-[1fr_auto] gap-6 items-center bg-white border border-slate200 rounded-xl p-7 shadow-card">
    <div className="max-w-[480px]">
      {eyebrow && (
        <div className="text-[10px] tracking-[0.08em] uppercase font-bold text-primary mb-2">{eyebrow}</div>
      )}
      <div className="flex items-start gap-3 mb-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-none">
            <Icon name={icon} size={18} />
          </div>
        )}
        <div>
          <h2 className="text-[20px] font-extrabold display-tight text-slate950 leading-tight">{title}</h2>
          <p className="text-[13px] text-slate600 leading-snug mt-2">{body}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4 flex-wrap">
        {primary && <DButton variant="primary" size="md" icon={<Icon name="plus" size={14} />}>{primary}</DButton>}
        {secondary && <DButton variant="secondary" size="md">{secondary}</DButton>}
      </div>
    </div>
    {illustration && <div className="flex-none">{illustration}</div>}
  </div>
);

const StepRow = ({ n, title, body, done }) => (
  <div className="flex items-start gap-3 py-3">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] flex-none
      ${done ? 'bg-success text-white' : 'bg-slate100 text-slate600'}`}>
      {done ? <Icon name="check" size={14} /> : n}
    </div>
    <div className="flex-1 min-w-0">
      <div className={`text-[13px] font-bold leading-tight ${done ? 'text-slate500 line-through' : 'text-slate950'}`}>{title}</div>
      <div className="text-[11px] text-slate500 leading-snug mt-[2px]">{body}</div>
    </div>
  </div>
);

// Compact placeholder illustration — abstract construction blueprint icon
const BlueprintIllo = () => (
  <div className="w-[220px] h-[160px] rounded-lg blueprint-bg relative overflow-hidden">
    <svg viewBox="0 0 220 160" className="absolute inset-0 w-full h-full opacity-90">
      {/* building bars */}
      <rect x="40" y="90" width="22" height="50" rx="2" fill="#F59E0B" opacity="0.85"/>
      <rect x="70" y="60" width="22" height="80" rx="2" fill="#ffffff" opacity="0.92"/>
      <rect x="100" y="40" width="22" height="100" rx="2" fill="#0F4395"/>
      <rect x="130" y="70" width="22" height="70" rx="2" fill="#ffffff" opacity="0.7"/>
      <rect x="160" y="50" width="22" height="90" rx="2" fill="#F59E0B" opacity="0.55"/>
      {/* highlight pin */}
      <rect x="100" y="40" width="22" height="14" rx="2" fill="#F59E0B"/>
      {/* crane silhouette */}
      <path d="M30 30 L195 30 M30 30 L30 130 M30 35 L48 30 M30 50 L60 30 M30 65 L72 30" stroke="#ffffff" strokeWidth="1.2" opacity="0.35" strokeLinecap="round"/>
    </svg>
  </div>
);

// ---------------------------------------------------------------------------
// 1) DASHBOARD — empty
// ---------------------------------------------------------------------------

const EmptyDashboard = ({ onComplete, onQuickAdd, onStartTour }) => {
  // Obra, equipo y bot ya quedaron resueltos al crear la obra. Acá el usuario
  // termina de poblar la obra con sus datos reales.
  const STEP_DEFS = [
    { key: 'crono',  title: 'Cargar el cronograma inicial', body: 'Creá las tareas de la obra una por una.',                  cta: 'Cargar tareas' },
    { key: 'stock',  title: 'Cargar stock inicial',         body: 'Registrá los materiales que ya tenés en obra.',           cta: 'Cargar stock' },
    { key: 'pedido', title: 'Generar el primer pedido',     body: 'Pedí material a un proveedor desde el panel.',             cta: 'Crear pedido' },
    { key: 'reporte',title: 'Registrar tu primer reporte',  body: 'Probá enviando un audio o foto al bot.',                  cta: 'Registrar reporte' },
    { key: 'obreros',title: 'Invitar obreros por WhatsApp', body: 'Sumá obreros que reportan por WhatsApp, sin acceso a la app.', cta: 'Invitar obreros' },
  ];
  const [done, setDone] = React.useState({});
  const [active, setActive] = React.useState('crono');
  const [stepModal, setStepModal] = React.useState(null); // which step's flow is open

  // Real data the user enters through the flows
  const [obra, setObra]       = React.useState({ name: 'Mi primera obra', address: '', type: 'Edificio en altura' });
  const [botConnected, setBot] = React.useState(true);
  const [team, setTeam]       = React.useState([]);
  const [tasks, setTasks]     = React.useState([]);
  const [stock, setStock]     = React.useState([]);
  const [pedidos, setPedidos] = React.useState([]);
  const [reports, setReports] = React.useState([]);
  const [obreros, setObreros] = React.useState([]);

  const [skipped, setSkipped] = React.useState({});
  const isResolved = (k) => done[k] || skipped[k];
  const doneCount = STEP_DEFS.filter((s) => done[s.key]).length;
  const resolvedCount = STEP_DEFS.filter((s) => isResolved(s.key)).length;
  const allResolved = resolvedCount === STEP_DEFS.length;
  const pct = Math.round((resolvedCount / STEP_DEFS.length) * 100);

  const goNext = (key) => {
    const idx = STEP_DEFS.findIndex((s) => s.key === key);
    const next = STEP_DEFS.slice(idx + 1).find((s) => !isResolved(s.key));
    if (next) setActive(next.key);
  };
  const completeStep = (key) => {
    setDone((p) => ({ ...p, [key]: true }));
    goNext(key);
    setStepModal(null);
  };
  const skipStep = (key) => {
    setSkipped((p) => ({ ...p, [key]: true }));
    goNext(key);
  };

  const stepState = { obra, setObra, botConnected, setBot, team, setTeam, tasks, setTasks, stock, setStock, pedidos, setPedidos, reports, setReports, obreros, setObreros };

  return (
    <>
      <DPageHeader
        title="¡Tu obra está casi lista!"
        subtitle="El equipo y el bot ya quedaron configurados al crear la obra. Solo faltan estos pasos."
        right={<DButton variant="secondary" size="sm" icon={<Icon name="info" size={13} />} onClick={onStartTour}>Ver tour</DButton>}
      />

      {/* Lo ya resuelto en la creación */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { ico: 'check-circle', label: 'Obra creada' },
          { ico: 'users',        label: 'Equipo invitado' },
          { ico: 'message',      label: 'Bot de WhatsApp conectado' },
        ].map((c) => (
          <div key={c.label} className="inline-flex items-center gap-2 bg-success50 border border-[#BBF7D0] text-[#15803D] text-[11px] font-bold rounded-full px-3 py-[6px]">
            <Icon name={c.ico} size={13} /> {c.label}
          </div>
        ))}
      </div>

      {/* Progress hero */}
      <div className="grid grid-cols-[1fr_auto] gap-6 items-center bg-white border border-slate200 rounded-xl p-6 shadow-card mb-4">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.08em] uppercase font-bold text-primary mb-2">Configuración · {doneCount} de {STEP_DEFS.length}</div>
          <h2 className="text-[20px] font-extrabold display-tight text-slate950 leading-tight">
            {allResolved ? '¡Todo listo! Tu obra está configurada.' : 'Completá los pasos para activar tu panel.'}
          </h2>
          <p className="text-[13px] text-slate600 leading-snug mt-2 max-w-[460px]">
            {allResolved
              ? 'Ya podés ver el dashboard. Lo que saltaste lo podés cargar después desde cada sección.'
              : 'Cargá lo que necesites ahora. Lo que no, lo podés saltar y hacerlo más tarde.'}
          </p>
          <div className="mt-4 h-[8px] bg-slate100 rounded-full overflow-hidden max-w-[420px]">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" style={{ width: pct + '%' }} />
          </div>
          <div className="flex items-center gap-3 mt-5">
            {allResolved ? (
              <DButton variant="primary" size="md" icon={<Icon name="arrow-right" size={14} />} onClick={onComplete}>
                Ver mi dashboard
              </DButton>
            ) : (
              <button onClick={onComplete} className="text-[12px] font-bold text-slate500 hover:text-slate950 transition-colors">
                Saltar todo e ir al dashboard →
              </button>
            )}
          </div>
        </div>
        <BlueprintIllo />
      </div>

      {/* Layout 2 columnas: pasos + panel de ayuda */}
      <div className="grid grid-cols-[1fr_300px] gap-4 mb-4 items-start">
        {/* Step list */}
        <DCard padding="p-0">
          <div data-tour="checklist" className="px-5 py-3 border-b border-slate200 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-bold text-slate950">Lista de configuración</div>
              <div className="text-[11px] text-slate500 mt-[1px]">{doneCount} de {STEP_DEFS.length} pasos completados</div>
            </div>
            {allResolved && <DPill tone="successSolid">Completo</DPill>}
          </div>
          <div className="px-2 py-1 divide-y divide-slate100">
            {STEP_DEFS.map((s, i) => {
              const isDone = !!done[s.key];
              const isSkipped = !!skipped[s.key];
              const isActive = active === s.key && !isDone && !isSkipped;
              return (
                <div key={s.key} className={"flex items-center gap-3 px-3 py-3 rounded-lg transition-colors " + (isActive ? 'bg-primary-50/40' : '')}>
                  <div className={"w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] flex-none " + (isDone ? 'bg-success text-white' : isSkipped ? 'bg-slate100 text-slate400' : isActive ? 'bg-primary text-white' : 'bg-slate100 text-slate600')}>
                    {isDone ? <Icon name="check" size={14} /> : isSkipped ? <Icon name="minus" size={14} /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={"text-[13px] font-bold leading-tight " + (isDone ? 'text-slate500 line-through' : isSkipped ? 'text-slate400' : 'text-slate950')}>{s.title}</div>
                    <div className="text-[11px] text-slate500 leading-snug mt-[2px]">{s.body}</div>
                  </div>
                  {isDone ? (
                    <span className="text-[11px] font-bold text-[#15803D] flex items-center gap-1"><Icon name="check" size={12} /> Listo</span>
                  ) : isSkipped ? (
                    <button onClick={() => { setSkipped((p) => { const n = { ...p }; delete n[s.key]; return n; }); setActive(s.key); }}
                      className="text-[11px] font-bold text-slate400 hover:text-primary transition-colors">Deshacer</button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => skipStep(s.key)} className="text-[11px] font-bold text-slate400 hover:text-slate700 px-2 py-[6px] transition-colors">Saltar</button>
                      <DButton variant={isActive ? 'primary' : 'secondary'} size="sm" onClick={() => setStepModal(s.key)}>{s.cta}</DButton>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-slate200 bg-slate50 flex justify-between items-center">
            <div className="text-[11px] text-slate600">{doneCount} cargado{doneCount === 1 ? '' : 's'} · podés saltar lo que no necesites ahora</div>
            <DButton variant="ghost" size="sm">Hablar con soporte</DButton>
          </div>
        </DCard>

        {/* Helper panel */}
        <div className="space-y-3">
          {/* Buildo tip */}
          <div className="blueprint-bg rounded-xl p-4 text-white relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-md bg-accent/20 text-accent flex items-center justify-center"><Icon name="sparkle" size={14} /></span>
              <span className="text-[13px] font-bold">Buildo te ayuda</span>
            </div>
            <p className="text-[12px] text-white/70 leading-snug">
              Mientras configurás, recordá que tu equipo ya puede empezar a reportar por WhatsApp. Cada audio o foto que manden se va a ordenar solo acá.
            </p>
          </div>

          {/* Qué desbloqueás */}
          <DCard padding="p-0">
            <div className="px-4 py-3 border-b border-slate200 text-[13px] font-bold">Qué vas a ver cuando termines</div>
            <div className="p-2">
              {[
                { ico: 'trending', tint: 'bg-primary-50 text-primary',   t: 'Avance por rubro en vivo' },
                { ico: 'dollar',   tint: 'bg-success50 text-[#15803D]',   t: 'Control de presupuesto' },
                { ico: 'alert',    tint: 'bg-critical50 text-[#B91C1C]',  t: 'Alertas críticas al instante' },
                { ico: 'chart',    tint: 'bg-info50 text-[#1D4ED8]',      t: 'Resumen diario de la IA' },
              ].map((x) => (
                <div key={x.t} className="flex items-center gap-3 px-2 py-[7px]">
                  <span className={"w-7 h-7 rounded-md flex items-center justify-center flex-none " + x.tint}><Icon name={x.ico} size={13} /></span>
                  <span className="text-[12px] font-semibold text-slate700">{x.t}</span>
                </div>
              ))}
            </div>
          </DCard>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3" data-tour="metrics">
        {[
          { label: 'Tareas',     icon: 'calendar',tint: 'bg-primary-50 text-primary',   ready: done.crono,   val: tasks.length },
          { label: 'Stock',      icon: 'box',     tint: 'bg-success50 text-[#15803D]',   ready: done.stock,   val: stock.length },
          { label: 'Pedidos',    icon: 'package', tint: 'bg-attention50 text-[#A16207]', ready: done.pedido,  val: pedidos.length },
          { label: 'Obreros',    icon: 'users',   tint: 'bg-info50 text-[#1D4ED8]',      ready: done.obreros, val: obreros.length },
        ].map((m) => (
          <DCard key={m.label} padding="p-4" className={m.ready ? '' : 'opacity-70'}>
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-3 " + m.tint}>
              <Icon name={m.icon} size={16} />
            </div>
            <div className={"text-[26px] font-extrabold display-tight tnum leading-none " + (m.ready ? 'text-slate950' : 'text-slate300')}>
              {m.ready ? m.val : '—'}
            </div>
            <div className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate600 mt-1">{m.label}</div>
            <div className={"text-[11px] font-semibold mt-2 " + (m.ready ? 'text-[#15803D]' : 'text-slate400')}>
              {m.ready ? 'Cargado' : 'Pendiente'}
            </div>
          </DCard>
        ))}
      </div>

      <OnboardingStepModal stepKey={stepModal} onClose={() => setStepModal(null)} onDone={completeStep} state={stepState} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Onboarding step flows — real data-entry UI per step
// ---------------------------------------------------------------------------

const OnbModalShell = ({ icon, accent, title, sub, onClose, children, footer, wide }) => {
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className={"bg-white w-full rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop max-h-[calc(100vh-48px)] " + (wide ? 'max-w-[620px]' : 'max-w-[480px]')}>
        <div className="px-6 py-4 border-b border-slate200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: accent + '22', color: accent }}>
              <Icon name={icon} size={16} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">{title}</div>
              {sub && <div className="text-[11px] text-slate500">{sub}</div>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center"><Icon name="x" size={16} /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-3 border-t border-slate200 bg-slate50 flex items-center justify-end gap-2 flex-none">{footer}</div>}
      </div>
    </div>
  );
};

const OnbInput = (props) => (
  <input {...props} className={"bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none w-full " + (props.className || '')} />
);
const OnbSelect = ({ children, ...props }) => (
  <select {...props} className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none w-full">{children}</select>
);
const OnbField = ({ label, children }) => (
  <label className="flex flex-col gap-[6px]"><span className="text-[11px] font-bold text-slate700">{label}</span>{children}</label>
);

const OnboardingStepModal = ({ stepKey, onClose, onDone, state }) => {
  if (!stepKey) return null;

  // ── BOT: WhatsApp QR connect ───────────────────────────────────────────
  if (stepKey === 'bot') {
    const [phase, setPhase] = React.useState(state.botConnected ? 'done' : 'qr'); // qr | connecting | done
    const connect = () => {
      setPhase('connecting');
      setTimeout(() => { setPhase('done'); state.setBot(true); }, 1600);
    };
    return (
      <OnbModalShell icon="message" accent="#22C55E" title="Conectar bot de WhatsApp" sub="Escaneá el QR desde el celular del jefe de obra" onClose={onClose}
        footer={phase === 'done'
          ? <DButton variant="primary" size="sm" onClick={() => onDone('bot')}>Listo, continuar</DButton>
          : <DButton variant="secondary" size="sm" onClick={onClose}>Cancelar</DButton>}>
        <div className="flex flex-col items-center text-center">
          {phase !== 'done' ? (
            <>
              <div className="relative w-[180px] h-[180px] rounded-xl border-2 border-slate200 p-3 bg-white mb-4">
                {/* Fake QR */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const x = (i % 10) * 10, y = Math.floor(i / 10) * 10;
                    const on = (i * 37) % 5 < 2 || [0,1,8,9,90,91,98,99,11,18,81,88].includes(i);
                    return on ? <rect key={i} x={x} y={y} width="10" height="10" fill="#131B2E" /> : null;
                  })}
                  <rect x="0" y="0" width="30" height="30" fill="none" stroke="#131B2E" strokeWidth="4" />
                  <rect x="70" y="0" width="30" height="30" fill="none" stroke="#131B2E" strokeWidth="4" />
                  <rect x="0" y="70" width="30" height="30" fill="none" stroke="#131B2E" strokeWidth="4" />
                </svg>
                {phase === 'connecting' && (
                  <div className="absolute inset-0 bg-white/85 rounded-xl flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 border-[3px] border-success border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] font-bold text-slate700">Conectando…</span>
                  </div>
                )}
              </div>
              <p className="text-[12px] text-slate600 leading-snug max-w-[300px] mb-4">
                Abrí WhatsApp → <b>Dispositivos vinculados</b> → <b>Vincular dispositivo</b> y apuntá la cámara al código.
              </p>
              {phase === 'qr' && <DButton variant="primary" size="md" icon={<Icon name="check" size={14} />} onClick={connect}>Simular escaneo</DButton>}
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center mb-4"><Icon name="check" size={30} /></div>
              <h3 className="text-[18px] font-extrabold display-tight">Bot conectado</h3>
              <p className="text-[12px] text-slate600 mt-1 max-w-[300px]">+54 9 11 2034-8821 está listo. Tu equipo ya puede reportar por WhatsApp.</p>
            </>
          )}
        </div>
      </OnbModalShell>
    );
  }

  // ── EQUIPO: invite people, building a list ──────────────────────────────
  if (stepKey === 'equipo') {
    const [name, setName] = React.useState('');
    const [tel, setTel]   = React.useState('');
    const [rol, setRol]   = React.useState('Capataz');
    const add = () => {
      if (!name.trim()) return;
      const init = name.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      state.setTeam((p) => [...p, { id: Date.now(), name: name.trim(), tel, rol, init }]);
      setName(''); setTel('');
    };
    return (
      <OnbModalShell icon="users" accent="#22C55E" title="Invitar al equipo" sub={state.team.length + ' invitados'} onClose={onClose} wide
        footer={<>
          <span className="text-[12px] text-slate500 mr-auto">{state.team.length} persona{state.team.length === 1 ? '' : 's'} agregada{state.team.length === 1 ? '' : 's'}</span>
          <DButton variant="secondary" size="sm" onClick={onClose}>Cancelar</DButton>
          <DButton variant="primary" size="sm" disabled={state.team.length === 0} onClick={() => onDone('equipo')}>Terminar</DButton>
        </>}>
        <div className="grid grid-cols-[1fr_1fr_140px] gap-2 items-end mb-3">
          <OnbField label="Nombre"><OnbInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Marta Robles" onKeyDown={(e) => e.key === 'Enter' && add()} /></OnbField>
          <OnbField label="WhatsApp"><OnbInput value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+54 9 11…" /></OnbField>
          <OnbField label="Rol">
            <OnbSelect value={rol} onChange={(e) => setRol(e.target.value)}>
              {['Director de obra','Capataz','Compras','Arquitecto/a','Cliente / propietario'].map((r) => <option key={r}>{r}</option>)}
            </OnbSelect>
          </OnbField>
        </div>
        <DButton variant="secondary" size="sm" icon={<Icon name="plus" size={13} />} onClick={add} className="mb-4">Agregar a la lista</DButton>

        {state.team.length === 0 ? (
          <div className="text-center text-slate400 text-[12px] py-8 border border-dashed border-slate200 rounded-lg">Todavía no agregaste a nadie.</div>
        ) : (
          <div className="border border-slate200 rounded-lg divide-y divide-slate100">
            {state.team.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-[10px]">
                <DAvatar initials={p.init} size={30} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate950 truncate">{p.name}</div>
                  <div className="text-[11px] text-slate500">{p.rol}{p.tel ? ' · ' + p.tel : ''}</div>
                </div>
                <button onClick={() => state.setTeam((prev) => prev.filter((x) => x.id !== p.id))} className="text-slate400 hover:text-[#B91C1C] p-1"><Icon name="x" size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </OnbModalShell>
    );
  }

  // ── CRONO: add tasks, building a list ───────────────────────────────────
  if (stepKey === 'crono') {
    const [name, setName] = React.useState('');
    const [rubro, setRubro] = React.useState('Hormigón armado');
    const [who, setWho] = React.useState('C. Ríos');
    const add = () => {
      if (!name.trim()) return;
      state.setTasks((p) => [...p, { id: Date.now(), name: name.trim(), rubro, who }]);
      setName('');
    };
    return (
      <OnbModalShell icon="calendar" accent="#0F4395" title="Cargar cronograma" sub={state.tasks.length + ' tareas'} onClose={onClose} wide
        footer={<>
          <span className="text-[12px] text-slate500 mr-auto">{state.tasks.length} tarea{state.tasks.length === 1 ? '' : 's'} cargada{state.tasks.length === 1 ? '' : 's'}</span>
          <DButton variant="secondary" size="sm" onClick={onClose}>Cancelar</DButton>
          <DButton variant="primary" size="sm" disabled={state.tasks.length === 0} onClick={() => onDone('crono')}>Terminar</DButton>
        </>}>
        <div className="grid grid-cols-[1fr_150px_130px] gap-2 items-end mb-3">
          <OnbField label="Tarea"><OnbInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Hormigonado losa +1" onKeyDown={(e) => e.key === 'Enter' && add()} /></OnbField>
          <OnbField label="Rubro"><OnbSelect value={rubro} onChange={(e) => setRubro(e.target.value)}>{['Movimiento de suelos','Hormigón armado','Mampostería','Instalaciones'].map((r) => <option key={r}>{r}</option>)}</OnbSelect></OnbField>
          <OnbField label="Responsable"><OnbSelect value={who} onChange={(e) => setWho(e.target.value)}>{['C. Ríos','L. Benítez','P. Salas','M. Ortiz'].map((r) => <option key={r}>{r}</option>)}</OnbSelect></OnbField>
        </div>
        <DButton variant="secondary" size="sm" icon={<Icon name="plus" size={13} />} onClick={add} className="mb-4">Agregar tarea</DButton>

        {state.tasks.length === 0 ? (
          <div className="text-center text-slate400 text-[12px] py-8 border border-dashed border-slate200 rounded-lg">Sin tareas todavía.</div>
        ) : (
          <div className="border border-slate200 rounded-lg divide-y divide-slate100">
            {state.tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-[10px]">
                <span className="w-7 h-7 rounded-md bg-primary-50 text-primary flex items-center justify-center flex-none"><Icon name="calendar" size={13} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate950 truncate">{t.name}</div>
                  <div className="text-[11px] text-slate500">{t.rubro} · {t.who}</div>
                </div>
                <button onClick={() => state.setTasks((prev) => prev.filter((x) => x.id !== t.id))} className="text-slate400 hover:text-[#B91C1C] p-1"><Icon name="x" size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </OnbModalShell>
    );
  }

  // ── STOCK: add initial materials ────────────────────────────────────────
  if (stepKey === 'stock') {
    const [name, setName] = React.useState('');
    const [cat, setCat]   = React.useState('Áridos y cementos');
    const [qty, setQty]   = React.useState('');
    const [unit, setUnit] = React.useState('bolsas');
    const add = () => {
      if (!name.trim()) return;
      state.setStock((p) => [...p, { id: Date.now(), name: name.trim(), cat, qty: qty || '0', unit }]);
      setName(''); setQty('');
    };
    return (
      <OnbModalShell icon="box" accent="#22C55E" title="Cargar stock inicial" sub={state.stock.length + ' materiales'} onClose={onClose} wide
        footer={<>
          <span className="text-[12px] text-slate500 mr-auto">{state.stock.length} material{state.stock.length === 1 ? '' : 'es'}</span>
          <DButton variant="secondary" size="sm" onClick={onClose}>Cancelar</DButton>
          <DButton variant="primary" size="sm" disabled={state.stock.length === 0} onClick={() => onDone('stock')}>Terminar</DButton>
        </>}>
        <div className="grid grid-cols-[1fr_140px_90px_110px] gap-2 items-end mb-3">
          <OnbField label="Material"><OnbInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cemento Portland 50 kg" onKeyDown={(e) => e.key === 'Enter' && add()} /></OnbField>
          <OnbField label="Categoría"><OnbSelect value={cat} onChange={(e) => setCat(e.target.value)}>{['Áridos y cementos','Hierros','Mampostería','Eléctrico','Sanitario'].map((r) => <option key={r}>{r}</option>)}</OnbSelect></OnbField>
          <OnbField label="Cantidad"><OnbInput value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" /></OnbField>
          <OnbField label="Unidad"><OnbInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="bolsas, m³…" /></OnbField>
        </div>
        <DButton variant="secondary" size="sm" icon={<Icon name="plus" size={13} />} onClick={add} className="mb-4">Agregar material</DButton>
        {state.stock.length === 0 ? (
          <div className="text-center text-slate400 text-[12px] py-8 border border-dashed border-slate200 rounded-lg">Sin materiales todavía.</div>
        ) : (
          <div className="border border-slate200 rounded-lg divide-y divide-slate100">
            {state.stock.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-[10px]">
                <span className="w-7 h-7 rounded-md bg-success50 text-[#15803D] flex items-center justify-center flex-none"><Icon name="box" size={13} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate950 truncate">{m.name}</div>
                  <div className="text-[11px] text-slate500">{m.cat} · {m.qty} {m.unit}</div>
                </div>
                <button onClick={() => state.setStock((prev) => prev.filter((x) => x.id !== m.id))} className="text-slate400 hover:text-[#B91C1C] p-1"><Icon name="x" size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </OnbModalShell>
    );
  }

  // ── PEDIDO: create first order ──────────────────────────────────────────
  if (stepKey === 'pedido') {
    const [mat, setMat]   = React.useState('');
    const [prov, setProv] = React.useState('');
    const [qty, setQty]   = React.useState('');
    const submit = () => {
      if (!mat.trim()) return;
      state.setPedidos((p) => [...p, { id: Date.now(), mat: mat.trim(), prov, qty }]);
      onDone('pedido');
    };
    return (
      <OnbModalShell icon="package" accent="#F59E0B" title="Generar primer pedido" sub="Pedí material a un proveedor" onClose={onClose}
        footer={<>
          <DButton variant="secondary" size="sm" onClick={onClose}>Cancelar</DButton>
          <DButton variant="primary" size="sm" disabled={!mat.trim()} onClick={submit}>Crear pedido</DButton>
        </>}>
        <div className="space-y-4">
          <OnbField label="Material*"><OnbInput value={mat} onChange={(e) => setMat(e.target.value)} placeholder="Ej: Hierro 12 mm · 12 m" /></OnbField>
          <div className="grid grid-cols-2 gap-3">
            <OnbField label="Proveedor"><OnbInput value={prov} onChange={(e) => setProv(e.target.value)} placeholder="Ej: Aceros Norte" /></OnbField>
            <OnbField label="Cantidad"><OnbInput value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Ej: 2,5 t" /></OnbField>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate500 bg-slate50 border border-slate200 rounded-lg p-3">
            <Icon name="message" size={14} className="text-success flex-none" />
            Tip: tu equipo también puede pedir material mandando un audio al bot — "pedí 200 ladrillos a San Pedro".
          </div>
        </div>
      </OnbModalShell>
    );
  }

  // ── REPORTE: register a first report ────────────────────────────────────
  if (stepKey === 'reporte') {
    const [tipo, setTipo] = React.useState('Avance de tarea');
    const [texto, setTexto] = React.useState('');
    const submit = () => {
      if (!texto.trim()) return;
      state.setReports((p) => [...p, { id: Date.now(), tipo, texto: texto.trim() }]);
      onDone('reporte');
    };
    return (
      <OnbModalShell icon="chart" accent="#3B82F6" title="Registrar primer reporte" sub="Probá cómo se carga un avance" onClose={onClose}
        footer={<>
          <DButton variant="secondary" size="sm" onClick={onClose}>Cancelar</DButton>
          <DButton variant="primary" size="sm" disabled={!texto.trim()} onClick={submit}>Registrar</DButton>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <OnbField label="Tipo"><OnbSelect value={tipo} onChange={(e) => setTipo(e.target.value)}>{['Avance de tarea','Foto','Cierre de jornada','Problema'].map((r) => <option key={r}>{r}</option>)}</OnbSelect></OnbField>
          </div>
          <OnbField label="Detalle">
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} placeholder="Ej: Terminamos la losa del piso 1, quedó perfecta. 22 m³."
              className="bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[80px] w-full" />
          </OnbField>
          <div className="flex items-center gap-2 text-[11px] text-slate500 bg-slate50 border border-slate200 rounded-lg p-3">
            <Icon name="message" size={14} className="text-success flex-none" />
            Tip: tu equipo no necesita la app — pueden mandar esto como audio o foto al bot de WhatsApp y lo registramos solo.
          </div>
        </div>
      </OnbModalShell>
    );
  }

  // ── OBREROS: invite workers via individual WhatsApp links ───────────────
  if (stepKey === 'obreros') {
    return (
      <OnbModalShell icon="message" accent="#25D366" title="Invitar obreros por WhatsApp" sub={state.obreros.length + ' invitados'} onClose={onClose} wide
        footer={<>
          <span className="text-[12px] text-slate500 mr-auto">{state.obreros.length} obrero{state.obreros.length === 1 ? '' : 's'}</span>
          <DButton variant="secondary" size="sm" onClick={onClose}>Cancelar</DButton>
          <DButton variant="primary" size="sm" disabled={state.obreros.length === 0} onClick={() => onDone('obreros')}>Terminar</DButton>
        </>}>
        <ObrerosInviter obreros={state.obreros} setObreros={state.setObreros} />
      </OnbModalShell>
    );
  }

  return null;
};

// ── Reusable: invitar obreros con link individual de WhatsApp ──────────────
const obreroLink = (name, phone) => {
  let h = 0; const s = name + '|' + phone + '|' + Date.now();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 'wa.me/buildata/ob-' + h.toString(36).slice(0, 8);
};

const ObrerosInviter = ({ obreros, setObreros }) => {
  const [name, setName]   = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [copied, setCopied] = React.useState(null);
  const canAdd = name.trim().length >= 2 && phone.trim().length >= 6;
  const add = () => {
    if (!canAdd) return;
    setObreros((p) => [...p, { id: Date.now(), name: name.trim(), phone: phone.trim(), link: obreroLink(name.trim(), phone.trim()), sent: false }]);
    setName(''); setPhone('');
  };
  const send = (id) => { setObreros((p) => p.map((o) => o.id === id ? { ...o, sent: true } : o)); setCopied(id + 's'); setTimeout(() => setCopied((c) => c === id + 's' ? null : c), 1600); };
  const copy = (id, link) => { try { navigator.clipboard && navigator.clipboard.writeText('https://' + link); } catch (e) {} setCopied(id + 'c'); setTimeout(() => setCopied((c) => c === id + 'c' ? null : c), 1600); };
  const remove = (id) => setObreros((p) => p.filter((o) => o.id !== id));

  return (
    <>
      {/* Explicación */}
      <div className="flex items-start gap-3 bg-[#25D366]/[0.08] border border-[#25D366]/25 rounded-lg p-3 mb-4">
        <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-none"><Icon name="message" size={13} /></div>
        <div className="text-[12px] text-slate700 leading-snug">
          Los obreros <b>no necesitan cuenta ni la app</b>. Cargás su nombre y teléfono, y BuildData genera un <b>link de WhatsApp único</b> para cada uno. Al abrirlo, quedan vinculados a esta obra y pueden reportar avances, fotos y problemas por chat — todo se ordena solo en el panel.
        </div>
      </div>

      {/* Formulario */}
      <div className="grid grid-cols-[1fr_160px_auto] gap-2 items-end mb-4">
        <OnbField label="Nombre del obrero"><OnbInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ramón Díaz" onKeyDown={(e) => e.key === 'Enter' && add()} /></OnbField>
        <OnbField label="Teléfono"><OnbInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 9 11…" onKeyDown={(e) => e.key === 'Enter' && add()} /></OnbField>
        <DButton variant="primary" size="md" onClick={add} className={!canAdd ? 'opacity-50 pointer-events-none' : ''} icon={<Icon name="plus" size={13} />}>Generar link</DButton>
      </div>

      {obreros.length === 0 ? (
        <div className="text-center text-slate400 text-[12px] py-8 border border-dashed border-slate200 rounded-lg">Todavía no invitaste obreros.</div>
      ) : (
        <div className="border border-slate200 rounded-lg divide-y divide-slate100">
          {obreros.map((o) => (
            <div key={o.id} className="flex items-center gap-3 px-3 py-[10px]">
              <DAvatar initials={o.name.split(' ').map((w) => w[0]).join('').slice(0,2).toUpperCase()} size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-slate950 truncate">{o.name} {o.sent && <span className="text-[10px] font-bold text-[#15803D] bg-success50 rounded px-[5px] py-[1px] align-middle">ENVIADO</span>}</div>
                <div className="text-[11px] text-slate500 truncate">{o.phone}</div>
              </div>
              <button onClick={() => copy(o.id, o.link)} title="Copiar link"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate700 border border-slate200 rounded-md px-2 py-[6px] hover:bg-slate50 flex-none">
                <Icon name={copied === o.id + 'c' ? 'check' : 'edit'} size={11} className={copied === o.id + 'c' ? 'text-[#15803D]' : 'text-slate400'} />
                {copied === o.id + 'c' ? 'Copiado' : 'Copiar'}
              </button>
              <button onClick={() => send(o.id)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#25D366] hover:brightness-95 rounded-md px-3 py-[6px] flex-none">
                <Icon name="message" size={11} /> {copied === o.id + 's' ? 'Enviado' : 'Enviar'}
              </button>
              <button onClick={() => remove(o.id)} className="text-slate400 hover:text-[#B91C1C] p-1 flex-none"><Icon name="x" size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

Object.assign(window, { ObrerosInviter });

// ---------------------------------------------------------------------------
// 2) CRONOGRAMA — empty
// ---------------------------------------------------------------------------

const EmptyGantt = () => (
  <>
    <DPageHeader
      title="Cronograma de tareas"
      subtitle="Todavía no hay tareas cargadas en esta obra."
      right={<DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />}>Nueva tarea</DButton>}
    />

    <EmptyHero
      icon="calendar"
      eyebrow="Cronograma vacío"
      title="Subí tu Gantt o creá las tareas a mano."
      body="Creá las tareas una por una a medida que avanza el proyecto, con su rubro, responsable y fechas."
      primary="Crear primera tarea"
    />

    <div className="grid grid-cols-3 gap-3 mt-4">
      {[
        { title: 'Edificio en altura',     sub: '8 rubros · ~120 tareas · 14 meses', icon: 'chart' },
        { title: 'Vivienda unifamiliar',   sub: '6 rubros · ~60 tareas · 6 meses',   icon: 'grid' },
        { title: 'Refacción / remodelación', sub: '4 rubros · ~30 tareas · 3 meses',  icon: 'package' },
      ].map((t) => (
        <DCard key={t.title} className="hover:border-primary cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-3">
            <Icon name={t.icon} size={16} />
          </div>
          <div className="text-[13px] font-bold text-slate950 mb-1">{t.title}</div>
          <div className="text-[11px] text-slate500 leading-snug">{t.sub}</div>
          <div className="mt-3 text-[11px] font-bold text-primary flex items-center gap-1">
            Usar plantilla <Icon name="arrow-right" size={11} />
          </div>
        </DCard>
      ))}
    </div>

    {/* Ghost gantt grid as preview */}
    <div className="mt-5 border border-dashed border-slate300 rounded-lg p-6 bg-slate50/60 relative overflow-hidden">
      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Vista previa</div>
      <div className="space-y-2 opacity-60">
        {[40, 60, 30, 70, 45].map((w, i) => (
          <div key={i} className="grid grid-cols-[140px_1fr] gap-3 items-center">
            <div className="h-3 bg-slate200 rounded" />
            <div className="h-5 bg-slate200 rounded" style={{ marginLeft: `${i * 8}%`, marginRight: `${100 - w - i * 8}%` }} />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent flex items-end justify-center pb-4 pointer-events-none">
        <span className="text-[11px] text-slate500 font-semibold">Tu cronograma se verá así</span>
      </div>
    </div>
  </>
);

// ---------------------------------------------------------------------------
// 3) ALERTAS — empty
// ---------------------------------------------------------------------------

const EmptyAlerts = () => (
  <>
    <DPageHeader
      title="Problemas y alertas"
      subtitle="No hay alertas activas — todavía."
    />

    <div className="flex gap-1 border-b border-slate200 mb-6 opacity-60">
      {['Todas','Críticos','Importantes','Moderados','Resueltos'].map((t, i) => (
        <div key={t} className={`flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2
          ${i === 0 ? 'text-primary border-primary' : 'text-slate500 border-transparent'}`}>
          {t}
          <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-full bg-slate100 text-slate700">0</span>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
      <DCard padding="p-8" className="text-center">
        <div className="w-14 h-14 rounded-full bg-success50 text-[#15803D] flex items-center justify-center mx-auto mb-4">
          <Icon name="check-circle" size={24} />
        </div>
        <h3 className="text-[18px] font-extrabold display-tight text-slate950">Todo en orden</h3>
        <p className="text-[13px] text-slate600 mt-2 max-w-[400px] mx-auto leading-snug">
          Cuando tu equipo reporte un problema por WhatsApp — un faltante, una falla, un accidente — vas a verlo acá, clasificado por gravedad y con la acción sugerida.
        </p>
        <div className="flex gap-2 justify-center mt-5">
          <DButton variant="primary" size="md" icon={<Icon name="message" size={14} />}>Probar enviando una alerta</DButton>
        </div>
      </DCard>

      <DCard padding="p-0">
        <div className="px-4 py-3 border-b border-slate200 text-[13px] font-bold">Cómo funcionan las alertas</div>
        <div className="p-4 space-y-3 text-[12px] text-slate700 leading-snug">
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded bg-critical50 text-[#B91C1C] flex items-center justify-center flex-none">
              <Icon name="alert" size={12} />
            </div>
            <div><b>Críticas</b> — frenan obra. Falta de material, fallas, accidentes. Notificación inmediata.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded bg-attention50 text-[#A16207] flex items-center justify-center flex-none">
              <Icon name="alert" size={12} />
            </div>
            <div><b>Importantes</b> — demoras y faltantes que se pueden anticipar.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded bg-slate100 text-slate700 flex items-center justify-center flex-none">
              <Icon name="info" size={12} />
            </div>
            <div><b>Moderadas</b> — cosas que conviene saber. Reporte diario incompleto, etc.</div>
          </div>
        </div>
      </DCard>
    </div>
  </>
);

// ---------------------------------------------------------------------------
// 4) PEDIDOS — empty
// ---------------------------------------------------------------------------

const EmptyMaterials = () => (
  <>
    <DPageHeader
      title="Pedidos de materiales"
      subtitle="No hay pedidos cargados en esta obra."
      right={<DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />}>Nuevo pedido</DButton>}
    />

    <div className="grid grid-cols-4 gap-3 mb-4">
      {[
        { label: 'Por aprobar',  icon: 'package', tint: 'bg-attention50 text-[#A16207]' },
        { label: 'En tránsito',  icon: 'truck',   tint: 'bg-info50 text-[#1D4ED8]' },
        { label: 'Demorados',    icon: 'alert',   tint: 'bg-critical50 text-[#B91C1C]' },
        { label: 'Mes en curso', icon: 'check',   tint: 'bg-success50 text-[#15803D]' },
      ].map((m) => (
        <DCard key={m.label} padding="p-4" className="opacity-70">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${m.tint}`}>
            <Icon name={m.icon} size={16} />
          </div>
          <div className="text-[26px] font-extrabold display-tight tnum text-slate300 leading-none">0</div>
          <div className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate600 mt-1">{m.label}</div>
        </DCard>
      ))}
    </div>

    <EmptyHero
      icon="package"
      eyebrow="Compras y proveedores"
      title="Cargá tu primer pedido o conectá tu lista de proveedores."
      body="Una vez que tengas proveedores cargados, tu equipo puede generar pedidos desde WhatsApp con un audio del estilo «pediles 200 ladrillos a Cerámica San Pedro para el martes». BuildData lo convierte en un pedido formal para que vos lo aprobes."
      primary="Crear primer pedido"
    />

    <div className="grid grid-cols-2 gap-3 mt-4">
      <DCard>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-primary-50 text-primary flex items-center justify-center">
            <Icon name="users" size={14} />
          </div>
          <div className="text-[13px] font-bold">Proveedores</div>
        </div>
        <div className="text-[12px] text-slate600 leading-snug mb-3">Cargá tus proveedores habituales — cemento, hierro, áridos, terminaciones — con sus precios y tiempos de entrega típicos.</div>
        <DButton variant="secondary" size="sm">Agregar proveedor</DButton>
      </DCard>
      <DCard>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-accent/20 text-[#B45309] flex items-center justify-center">
            <Icon name="database" size={14} />
          </div>
          <div className="text-[13px] font-bold">Catálogo de materiales</div>
        </div>
        <div className="text-[12px] text-slate600 leading-snug mb-3">Definí los materiales que más usás con sus unidades de medida estándar. Ayuda al bot a entender mejor los pedidos por audio.</div>
        <DButton variant="secondary" size="sm">Configurar catálogo</DButton>
      </DCard>
    </div>
  </>
);

// ---------------------------------------------------------------------------
// 5) REPORTES — empty
// ---------------------------------------------------------------------------

const EmptyReports = () => (
  <>
    <DPageHeader
      title="Reportes de obra"
      subtitle="Acá vas a ver todo lo que el bot capture desde WhatsApp."
      right={<DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />}>Nuevo reporte</DButton>}
    />

    <div className="grid grid-cols-[2fr_1fr] gap-4">
      <div>
        <EmptyHero
          icon="message"
          eyebrow="Sin reportes aún"
          title="Conectá el bot y el equipo empieza a reportar."
          body="No hace falta que nadie aprenda una app nueva — tus capataces siguen usando WhatsApp como siempre. El bot transcribe audios, ordena fotos, clasifica problemas y todo queda registrado acá, buscable y exportable."
          primary="Conectar WhatsApp"
          secondary="Ver demo"
        />

        <div className="mt-5">
          <div className="text-[11px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2">Tipos de reporte que captura</div>
          <DCard padding="p-0">
            {[
              { ico: 'check',    tint: 'bg-success50 text-[#15803D]',    name: 'Avance de tarea',     ex: '"Terminamos la losa del piso 3, quedó perfecta"' },
              { ico: 'photo',    tint: 'bg-info50 text-[#1D4ED8]',       name: 'Fotos georreferenciadas', ex: '4 fotos del armado de columnas' },
              { ico: 'alert',    tint: 'bg-critical50 text-[#B91C1C]',   name: 'Problemas e incidentes',  ex: '"Se rompió el motor de la grúa, no podemos seguir"' },
              { ico: 'package',  tint: 'bg-attention50 text-[#A16207]',  name: 'Pedidos de material',     ex: '"Pedile 200 ladrillos a San Pedro para el martes"' },
              { ico: 'calendar', tint: 'bg-primary-50 text-primary',     name: 'Cierre de jornada',       ex: '"6 personas hoy, sin incidentes, todo en orden"' },
            ].map((k, i, a) => (
              <div key={k.name} className={`grid grid-cols-[40px_1fr] gap-3 p-4 items-center ${i < a.length - 1 ? 'border-b border-slate200' : ''}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.tint}`}>
                  <Icon name={k.ico} size={14} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate950">{k.name}</div>
                  <div className="text-[11px] text-slate500 italic mt-[2px]">{k.ex}</div>
                </div>
              </div>
            ))}
          </DCard>
        </div>
      </div>

      <DCard padding="p-0" className="self-start">
        <div className="px-4 py-3 border-b border-slate200 flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-ink-deep text-accent flex items-center justify-center">
            <Icon name="sparkle" size={13} />
          </span>
          <div className="text-[13px] font-bold">Preguntale a tus reportes</div>
        </div>
        <div className="p-4">
          <div className="text-[12px] text-slate600 leading-snug mb-3">
            Cuando tengas reportes cargados, vas a poder preguntarle a la IA cosas como:
          </div>
          <div className="flex flex-col gap-2">
            {[
              '¿Cuántas horas se trabajaron esta semana?',
              '¿Qué pedidos vencen en los próximos 7 días?',
              'Resumen de problemas críticos del mes',
            ].map((q) => (
              <div key={q} className="text-[12px] text-slate400 bg-slate50 border border-dashed border-slate200 rounded-lg p-3 leading-snug italic">
                {q}
              </div>
            ))}
          </div>
          <div className="mt-4 text-[11px] text-slate500 leading-snug">
            Disponible una vez que el equipo empiece a reportar.
          </div>
        </div>
      </DCard>
    </div>
  </>
);

// ---------------------------------------------------------------------------
// 6) EQUIPO — empty (just you)
// ---------------------------------------------------------------------------

const EmptyTeam = () => (
  <>
    <DPageHeader
      title="Equipo de trabajo"
      subtitle="Sos la única persona en esta obra por ahora."
      right={<DButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />}>Invitar persona</DButton>}
    />

    <EmptyHero
      icon="users"
      eyebrow="1 de 20 personas"
      title="Invitá a tu equipo para que empiecen a reportar."
      body="Mandales un link por WhatsApp y se suman en 30 segundos — solo necesitan su número. Después podés asignarles roles (director, capataz, compras, arquitecto)."
      primary="Invitar por WhatsApp"
      secondary="Copiar link de invitación"
    />

    <div className="grid grid-cols-3 gap-3 mt-4">
      {/* You */}
      <DCard>
        <div className="flex items-center gap-3 mb-3">
          <DAvatar initials="TU" size={44} />
          <div>
            <div className="text-[14px] font-bold leading-tight">Vos</div>
            <div className="text-[11px] text-slate500 mt-[2px]">Administrador · Toda la obra</div>
          </div>
        </div>
        <div className="text-[11px] font-bold text-success bg-success50 rounded px-2 py-1 inline-flex items-center gap-1">
          <Icon name="check" size={11} /> Activo
        </div>
      </DCard>

      {/* Suggested roles to invite */}
      {[
        { role: 'Director de obra',  body: 'Ve todo. Aprueba pedidos y resuelve alertas críticas.' },
        { role: 'Capataz',           body: 'Reporta avances diarios desde WhatsApp.' },
        { role: 'Compras',           body: 'Gestiona pedidos y proveedores.' },
        { role: 'Arquitecto/a',      body: 'Consulta el cronograma y revisa fotos.' },
        { role: 'Cliente / propietario', body: 'Acceso de solo lectura al avance.' },
      ].map((r) => (
        <DCard key={r.role} className="border-dashed">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-slate300 text-slate400 flex items-center justify-center">
              <Icon name="plus" size={16} />
            </div>
            <div>
              <div className="text-[14px] font-bold leading-tight text-slate700">{r.role}</div>
              <div className="text-[11px] text-slate500 mt-[2px]">Sin asignar</div>
            </div>
          </div>
          <div className="text-[11px] text-slate500 leading-snug mb-3">{r.body}</div>
          <DButton variant="ghost" size="sm" icon={<Icon name="plus" size={11} />}>Invitar</DButton>
        </DCard>
      ))}
    </div>
  </>
);

// ---------------------------------------------------------------------------
// Export — same schema as SCREENS in live-dashboard.jsx
// ---------------------------------------------------------------------------

const EMPTY_SCREENS = [
  { id: 'dashboard', label: 'Dashboard',  icon: 'grid',     crumb: 'Dashboard',  Comp: EmptyDashboard },
  { id: 'gantt',     label: 'Cronograma', icon: 'calendar', crumb: 'Cronograma', Comp: EmptyGantt },
  { id: 'alerts',    label: 'Alertas',    icon: 'alert',    crumb: 'Alertas',    Comp: EmptyAlerts },
  { id: 'materials', label: 'Pedidos',    icon: 'package',  crumb: 'Pedidos',    Comp: EmptyMaterials },
  { id: 'activity',  label: 'Actividad',  icon: 'message',  crumb: 'Actividad',  Comp: EmptyReports },
  { id: 'reports',   label: 'Reportes',   icon: 'chart',    crumb: 'Reportes',   Comp: EmptyReports },
  { id: 'team',      label: 'Equipo',     icon: 'users',    crumb: 'Equipo',     Comp: EmptyTeam },
];

Object.assign(window, { EMPTY_SCREENS });
