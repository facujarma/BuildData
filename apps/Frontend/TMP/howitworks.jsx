// "Cómo funciona" — sticky scroll-driven story.
// 5 stages: WhatsApp audio → IA procesando → Bot confirma → Base de datos → Dashboard.
// Implementation: a tall section (5 viewports) with a sticky 100vh stage.
// Scroll progress drives the active stage index; visuals + copy crossfade.

const { motion: M, useScroll, useTransform, AnimatePresence } = window.Motion;

// ----- Stage visuals --------------------------------------------------------

// 1. WhatsApp inbound — phone with audio bubble
const Stage1 = () => (
  <div className="relative">
    <PhoneMockup width={300} mode="incoming" headerName="Grupo · Obra Belgrano" />
  </div>
);

// 2. IA procesando — abstract analysis card with audio waveform + tags emerging
const Stage2 = () => (
  <div className="w-[420px] rounded-2xl blueprint-bg text-white p-6 shadow-pop relative overflow-hidden">
    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/15 blur-2xl" />
    <div className="flex items-center gap-2 mb-4 relative">
      <div className="relative w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
        <Icon name="sparkle" size={16} className="text-accent" />
        <span className="absolute inset-0 rounded-full border border-accent/40 spin-slow"></span>
      </div>
      <div>
        <div className="text-[11px] tracking-[0.12em] uppercase font-bold text-accent">Análisis IA</div>
        <div className="text-[12px] text-white/70">Transcribiendo y clasificando…</div>
      </div>
    </div>
    {/* Waveform */}
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3 flex items-center gap-2">
      <Icon name="mic" size={14} className="text-white/70" />
      <div className="eq flex items-end h-8 flex-1">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
      </div>
      <span className="text-[10px] text-white/60 tnum">0:14</span>
    </div>
    {/* Transcript */}
    <div className="text-[12px] leading-[18px] text-white/85 mb-3 italic">
      "Llegó la mitad del hierro, falta varilla de 12. También doce bolsas de cemento para la losa."
    </div>
    {/* Extracted tags */}
    <div className="flex flex-wrap gap-[6px]">
      {[
        { l: 'Pedido', t: 'accent' },
        { l: 'Cemento Portland', t: 'white' },
        { l: '12 bolsas', t: 'white' },
        { l: 'Faltante: hierro 12 mm', t: 'critical' },
      ].map((tag) => (
        <span key={tag.l}
          className={`text-[10px] font-bold px-2 py-[3px] rounded-md border ${
            tag.t === 'accent' ? 'bg-accent/20 text-accent border-accent/30'
            : tag.t === 'critical' ? 'bg-critical/15 text-[#FCA5A5] border-critical/40'
            : 'bg-white/8 text-white/85 border-white/20'
          }`}>
          {tag.l}
        </span>
      ))}
    </div>
  </div>
);

// 3. Bot confirma — phone with confirm reply
const Stage3 = () => (
  <PhoneMockup width={300} mode="confirm" />
);

// 4. Base de datos — structured row going into a DB
const Stage4 = () => (
  <div className="w-[460px] bg-white rounded-2xl border border-slate200 shadow-pop overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate200">
      <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
        <Icon name="database" size={15} />
      </div>
      <div>
        <div className="text-[12px] font-bold">pedidos_obra</div>
        <div className="text-[10px] text-slate500">Edificio Belgrano</div>
      </div>
      <span className="ml-auto inline-flex items-center gap-1 bg-success50 text-[#15803D] text-[9px] font-bold tracking-wider uppercase px-2 py-[3px] rounded">
        <span className="w-1.5 h-1.5 rounded-full bg-success" /> Guardado
      </span>
    </div>
    {/* Header row */}
    <div className="grid grid-cols-[60px_1fr_70px_70px] text-[9px] tracking-[0.06em] uppercase text-slate500 font-bold px-4 py-2 border-b border-slate200 bg-slate50">
      <div>ID</div><div>Material</div><div>Cantidad</div><div>Estado</div>
    </div>
    {[
      { id: '0140', m: 'Cemento Portland 50 kg', q: '20 bs', st: 'success', stl: 'OK' },
      { id: '0141', m: 'Hierro Ø12 mm',          q: '2,5 t', st: 'success', stl: 'OK' },
      { id: '0142', m: 'Cemento Portland 50 kg', q: '12 bs', st: 'attention', stl: 'NEW', highlight: true },
    ].map((r) => (
      <div key={r.id}
        style={r.highlight ? { background: '#FFFBEB' } : {}}
        className="grid grid-cols-[60px_1fr_70px_70px] text-[11px] px-4 py-[10px] border-b border-slate100 items-center">
        <div className="font-bold tnum text-slate950">#{r.id}</div>
        <div className="text-slate800">{r.m}</div>
        <div className="font-bold tnum">{r.q}</div>
        <div><Pill tone={r.st}>{r.stl}</Pill></div>
      </div>
    ))}
    <div className="px-4 py-3 flex items-center gap-2 text-[10px] text-slate500">
      <Icon name="clock" size={12} />
      <span>Auto-asignado a pedido <b className="text-slate950">#PED-0142</b> · ingestado de WhatsApp · hace segundos</span>
    </div>
  </div>
);

// 5. Dashboard — small dashboard mockup
const Stage5 = () => (
  <div style={{ transform: 'scale(0.62)', transformOrigin: 'center center' }}>
    <DashboardMockup width={980} compact />
  </div>
);

const STAGES = [
  {
    eyebrow: '01 · WhatsApp',
    title: 'El capataz manda un audio.',
    body: 'En el grupo de obra, el jefe de cuadrilla manda una nota de voz como cualquier otro día. Sin app nueva, sin formularios, sin cambios de hábito.',
    visual: Stage1,
  },
  {
    eyebrow: '02 · IA procesa',
    title: 'La IA escucha, transcribe y clasifica.',
    body: 'Detecta material, cantidad, problemas y urgencia. Convierte un audio desordenado en datos estructurados — al instante.',
    visual: Stage2,
  },
  {
    eyebrow: '03 · El bot confirma',
    title: 'Confirma con el capataz, en castellano.',
    body: 'Antes de guardar nada, el bot devuelve lo que entendió y pide validación con un par de toques. Si hay un error, se corrige ahí mismo.',
    visual: Stage3,
  },
  {
    eyebrow: '04 · Base de datos',
    title: 'Se guarda como dato real, no como mensaje.',
    body: 'El registro entra a la base como un pedido, una alerta o un avance. Trazabilidad completa — quién lo dijo y cuándo.',
    visual: Stage4,
  },
  {
    eyebrow: '05 · Dashboard',
    title: 'El director lo ve, listo para decidir.',
    body: 'En segundos aparece en el dashboard del estudio o la contratista. KPIs, alertas, cronograma y reportes — siempre al día sin pedirle nada a nadie.',
    visual: Stage5,
  },
];

const HowItWorks = () => {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [stage, setStage] = React.useState(0);

  React.useEffect(() => {
    return scrollYProgress.on('change', (v) => {
      // 5 stages, each occupies 1/5 of progress
      const idx = Math.min(STAGES.length - 1, Math.max(0, Math.floor(v * STAGES.length)));
      setStage(idx);
    });
  }, [scrollYProgress]);

  // The progress bar — animated continuously
  const progressX = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section id="how" ref={ref} style={{ height: `${STAGES.length * 100}vh` }} className="relative bg-paper">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-6 grid grid-cols-12 gap-8 w-full">

          {/* Left: copy stack */}
          <div className="col-span-5 flex flex-col justify-center">
            <div className="mb-6">
              <div className="eyebrow text-primary mb-2">Cómo funciona</div>
              <h2 className="text-[36px] leading-[42px] font-extrabold display-tight text-slate950">
                De un audio en WhatsApp <br/>al dashboard,<span className="text-primary"> automático.</span>
              </h2>
            </div>

            <div className="relative pl-6">
              {/* vertical rail */}
              <div className="absolute left-[7px] top-1 bottom-1 w-[2px] bg-slate200 rounded-full" />
              <M.div
                style={{ height: progressX, scaleY: scrollYProgress }}
                className="absolute left-[7px] top-1 w-[2px] bg-primary rounded-full origin-top"
              />

              {STAGES.map((s, i) => {
                const active = i === stage;
                const done = i < stage;
                return (
                  <div key={i} className={`relative pb-6 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-40'}`}>
                    {/* dot */}
                    <div className="absolute -left-[24px] top-[4px] w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: active || done ? '#0F4395' : '#FFFFFF', border: active || done ? '2px solid #0F4395' : '2px solid #CBD5E1' }}>
                      {done && <Icon name="check" size={9} className="text-white" />}
                    </div>
                    <div className="eyebrow text-slate500 mb-1">{s.eyebrow}</div>
                    <h3 className="text-[18px] font-bold leading-snug text-slate950 mb-1">{s.title}</h3>
                    <p className="text-[13px] leading-[20px] text-slate600 max-w-[420px]">{s.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: sticky visual stage */}
          <div className="col-span-7 flex items-center justify-center min-h-[600px] relative">
            {/* ambient circle */}
            <div className="absolute inset-0 hero-mesh opacity-50 pointer-events-none" />
            <div className="relative w-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <M.div key={stage}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 0.96 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}>
                  {React.createElement(STAGES[stage].visual)}
                </M.div>
              </AnimatePresence>
            </div>

            {/* stage counter */}
            <div className="absolute bottom-4 right-4 bg-white border border-slate200 rounded-full shadow-card px-3 py-[6px] flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate950 tnum">{String(stage + 1).padStart(2, '0')}</span>
              <span className="w-[1px] h-3 bg-slate300" />
              <span className="text-[11px] text-slate500 tnum">{String(STAGES.length).padStart(2, '0')}</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

window.HowItWorks = HowItWorks;
