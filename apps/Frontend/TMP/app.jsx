// BuildData landing — main composition.
// Hero · Problema · Cómo funciona (in howitworks.jsx) · Funcionalidades ·
// Dashboard · Chatbot · Beneficios · CTA final · Footer.

const { motion: m, useScroll: useScroll2, useTransform: useTransform2 } = window.Motion;

// ---------------------------------------------------------------------------
// Reusable: Section eyebrow
// ---------------------------------------------------------------------------
const Eyebrow = ({ children, tone = 'primary', className = '' }) => {
  const tones = {
    primary: 'text-primary', accent: 'text-accent-700', white: 'text-accent',
  };
  return <div className={`eyebrow ${tones[tone]} ${className}`}>{children}</div>;
};

// ---------------------------------------------------------------------------
// NAV
// ---------------------------------------------------------------------------
const Nav = () => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-white/85 backdrop-blur border-b border-slate200' : 'bg-transparent'}`}>
      <div className="max-w-[1240px] mx-auto px-6 h-[68px] flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <Icon name="logo-mark" size={28} />
          <span className="text-[18px] font-extrabold display-tight">BuildData</span>
        </a>
        <div className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-slate700">
          <a href="#problema" className="hover:text-primary">Problema</a>
          <a href="#how" className="hover:text-primary">Cómo funciona</a>
          <a href="#funcionalidades" className="hover:text-primary">Funcionalidades</a>
          <a href="#dashboard" className="hover:text-primary">Dashboard</a>
          <a href="#chatbot" className="hover:text-primary">IA</a>
        </div>
        <div className="flex items-center gap-2">
          <a href="#cta" className="hidden sm:inline-flex items-center text-[13px] font-bold text-slate700 hover:text-primary px-3 py-2">
            Ingresar
          </a>
          <a href="Planes.html" className="inline-flex items-center gap-1 bg-primary hover:bg-primary-700 text-white text-[13px] font-bold px-4 py-[10px] rounded-md shadow-card">
            Pedir demo <Icon name="arrow-right" size={14} />
          </a>
        </div>
      </div>
    </nav>
  );
};

// ---------------------------------------------------------------------------
// HERO
// ---------------------------------------------------------------------------
const Hero = () => {
  return (
    <section className="relative pt-[120px] pb-[60px] hero-grid overflow-hidden">
      {/* Animated drifting orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="absolute inset-0 hero-mesh pointer-events-none" />

      <div className="relative max-w-[1240px] mx-auto px-6 grid grid-cols-12 gap-8 items-center">
        {/* Left copy */}
        <div className="col-span-12 lg:col-span-6">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur border border-slate200 rounded-full px-3 py-[6px] mb-6 shadow-card animate-fadein">
            <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" />
            <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-slate700">Para constructoras y estudios de arquitectura</span>
          </div>

          <h1 className="text-[clamp(40px,5vw,64px)] leading-[1.04] font-extrabold display-tight text-slate950 mb-5 animate-fadein-1">
            La información de tu obra,<br/>
            <span className="relative">
              <span className="relative z-10">ordenada en un solo lugar.</span>
              <span className="absolute left-0 right-0 bottom-[6px] h-[10px] bg-accent/35 -z-0" />
            </span>
          </h1>

          <p className="text-[18px] leading-[28px] text-slate600 max-w-[540px] mb-7 animate-fadein-2">
            Convertí reportes de <b className="text-slate950">WhatsApp</b> en decisiones claras.
            BuildData escucha los audios, fotos y mensajes que ya manda tu equipo, y los transforma en un dashboard en tiempo real.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-8 animate-fadein-3">
            <a href="Planes.html" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-700 text-white font-bold text-[14px] px-5 py-[12px] rounded-md shadow-pop">
              Probar 14 días gratis <Icon name="arrow-right" size={14} />
            </a>
            <a href="#dashboard" className="inline-flex items-center gap-2 bg-white hover:bg-slate50 text-slate950 border border-slate200 font-bold text-[14px] px-5 py-[12px] rounded-md">
              Ver el producto
            </a>
          </div>

          <div className="flex items-center gap-5 text-[12px] text-slate500 animate-fadein-4">
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={14} className="text-success" /> Sin migrar nada
            </div>
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={14} className="text-success" /> Sin app nueva para los capataces
            </div>
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={14} className="text-success" /> Setup en 1 día
            </div>
          </div>
        </div>

        {/* Right composite: phone + dashboard */}
        <div className="col-span-12 lg:col-span-6 relative h-[560px]">
          <HeroComposite />
        </div>
      </div>

      {/* Logo strip / proof */}
      <div className="relative max-w-[1240px] mx-auto px-6 mt-16">
        <div className="text-center eyebrow text-slate500 mb-5">Usado por equipos de obra que ya no quieren perseguir información</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-4 items-center justify-items-center opacity-60">
          {['ESTUDIO MARCÁ', 'CONSTRUCTORA LARIO', 'GRUPO PARANÁ', 'EDIFICA AR', 'OBRAS DEL SUR'].map((l) => (
            <div key={l} className="text-[13px] font-extrabold tracking-[0.08em] text-slate600 whitespace-nowrap">{l}</div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Hero visual — dashboard tilted in back, phone floating in front, connector lines + floating chips
const HeroComposite = () => {
  return (
    <div className="absolute inset-0">
      {/* Dashboard card, slight perspective tilt */}
      <div
        style={{ transformOrigin: 'left center', transform: 'perspective(1500px) rotateY(-6deg) rotateX(2deg)' }}
        className="absolute top-2 right-0 w-[720px] origin-left animate-fadein">
        <div style={{ transform: 'scale(0.82)', transformOrigin: 'top right' }}>
          <DashboardMockup width={860} compact />
        </div>
      </div>

      {/* Phone — overlapping front-left */}
      <div className="absolute -bottom-6 left-0 z-10 animate-fadein-3">
        <PhoneMockup width={260} mode="confirm" />
      </div>

      {/* Connector line phone → dashboard */}
      <svg className="absolute top-[150px] left-[210px] z-0 pointer-events-none" width="340" height="80" viewBox="0 0 340 80" fill="none">
        <path d="M 0 60 C 80 60 100 10 200 10 L 320 10" stroke="#0F4395" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45" />
        <circle cx="320" cy="10" r="3" fill="#0F4395" />
      </svg>

      {/* Floating chips */}
      <div className="absolute top-2 left-[40%] bg-white rounded-lg border border-slate200 shadow-pop px-3 py-2 z-20 animate-fadein-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent/15 text-accent flex items-center justify-center"><Icon name="sparkle" size={14} /></div>
          <div>
            <div className="text-[10px] tracking-[0.08em] uppercase font-bold text-accent-700">Insight IA</div>
            <div className="text-[11px] font-bold text-slate950">Hormigón con 3 días de demora</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[30px] right-2 bg-white rounded-lg border border-slate200 shadow-pop px-3 py-2 z-20 animate-fadein-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-success50 text-[#15803D] flex items-center justify-center"><Icon name="check" size={14} /></div>
          <div>
            <div className="text-[10px] tracking-[0.08em] uppercase font-bold text-[#15803D]">Pedido guardado</div>
            <div className="text-[11px] font-bold text-slate950">#PED-0142 · Cemento</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PROBLEMA
// ---------------------------------------------------------------------------
const Problema = () => {
  const items = [
    { icon: 'message', t: 'Información dispersa', s: 'Los avances viven en cinco grupos de WhatsApp, dos planillas y un cuaderno.' },
    { icon: 'clock',   t: 'Decisiones tarde',     s: 'Cuando una alerta sube al director, el problema ya pasó hace 3 días.' },
    { icon: 'package', t: 'Pedidos perdidos',     s: '"¿Pidieron el cemento?" "Sí, creo." Faltantes que paran a cuadrillas enteras.' },
    { icon: 'photo',   t: 'Fotos sin contexto',   s: '4.327 imágenes en la galería del jefe. Ninguna asociada a un rubro o tarea.' },
  ];
  return (
    <section id="problema" className="relative py-[120px] bg-slate950 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-50"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.04) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 1px, transparent 1px 40px)' }} />
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-critical/10 blur-3xl" />

      <div className="relative max-w-[1240px] mx-auto px-6">
        <div className="max-w-[760px] mb-16">
          <Eyebrow tone="white" className="text-accent mb-3">El problema</Eyebrow>
          <h2 className="text-[clamp(32px,4vw,52px)] leading-[1.08] font-extrabold display-tight mb-5">
            <span style={{ color: "rgb(255, 255, 255)" }}>En la obra todo pasa.<br/>
            En la oficina, <span className="text-slate400">nadie se entera a tiempo.</span></span>
          </h2>
          <p className="text-[17px] leading-[26px] text-slate300 max-w-[640px]">
            El equipo de obra ya reporta — pero lo hace en audios, fotos y mensajes que se pierden en chats. El director necesita decidir con datos, y termina pidiéndolos uno por uno.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <m.div key={it.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-critical/15 text-[#FCA5A5] flex items-center justify-center mb-3">
                <Icon name={it.icon} size={18} />
              </div>
              <div className="text-[16px] font-bold mb-1">{it.t}</div>
              <div className="text-[13px] leading-[20px] text-slate400">{it.s}</div>
            </m.div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-3 gap-6 border-t border-white/10 pt-10">
          {[
            { n: '3.4 h', l: 'por día perdidas buscando información de obra' },
            { n: '72%',   l: 'de las decisiones se toman con datos de más de 48 hs' },
            { n: '1 de 4', l: 'pedidos llega con error o fuera de tiempo' },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-[44px] font-extrabold display-tight text-accent tnum leading-none mb-2">{s.n}</div>
              <div className="text-[13px] text-slate400 leading-[18px] max-w-[260px]">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// FUNCIONALIDADES
// ---------------------------------------------------------------------------
const Funcionalidades = () => {
  const features = [
    { i: 'mic',      t: 'Audios → datos',          s: 'Transcribe y clasifica notas de voz en pedidos, avances, alertas o faltantes.', tone: 'primary' },
    { i: 'photo',    t: 'Fotos georeferenciadas',  s: 'Cada imagen queda asociada al rubro y la fecha. Buscable por palabra clave.', tone: 'accent' },
    { i: 'alert',    t: 'Alertas inteligentes',    s: 'El bot detecta urgencia y avisa al director sin esperar al parte diario.', tone: 'critical' },
    { i: 'package',  t: 'Pedidos automáticos',     s: 'Identifica materiales y cantidades. Arma el pedido, lo manda a aprobación.', tone: 'success' },
    { i: 'chart',    t: 'KPIs por rubro',          s: 'Avance, costos y desvíos por rubro. Comparados contra el plan.', tone: 'info' },
    { i: 'calendar', t: 'Cronograma vivo',         s: 'El Gantt se actualiza solo con los avances que reportan en obra.', tone: 'primary' },
    { i: 'users',    t: 'Roles y permisos',        s: 'Capataces, directores, proveedores. Cada uno ve lo que le toca.', tone: 'accent' },
    { i: 'download', t: 'Reportes a un clic',      s: 'Informe semanal para el cliente o el inversor, generado solo.', tone: 'success' },
  ];
  const toneMap = {
    primary:  { tint: 'bg-primary-50',  fg: 'text-primary' },
    accent:   { tint: 'bg-accent-50',   fg: 'text-accent-700' },
    critical: { tint: 'bg-critical50',  fg: 'text-critical' },
    success:  { tint: 'bg-success50',   fg: 'text-[#15803D]' },
    info:     { tint: 'bg-info50',      fg: 'text-info' },
  };
  return (
    <section id="funcionalidades" className="py-[120px] bg-paper">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="max-w-[720px] mb-14">
          <Eyebrow className="mb-3">Funcionalidades</Eyebrow>
          <h2 className="text-[clamp(32px,4vw,48px)] leading-[1.08] font-extrabold display-tight mb-4 text-slate950">
            Todo lo que pasa en la obra, <span className="text-primary">organizado solo.</span>
          </h2>
          <p className="text-[17px] leading-[26px] text-slate600 max-w-[600px]">
            Ocho módulos hechos para constructoras: del audio del capataz al reporte para el cliente, sin que nadie copie y pegue.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => {
            const t = toneMap[f.tone];
            return (
              <m.div key={f.t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4 }}
                className="bg-white border border-slate200 rounded-xl p-5 hover:shadow-pop hover:border-slate300 transition-all group">
                <div className={`w-11 h-11 rounded-lg ${t.tint} ${t.fg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon name={f.i} size={20} />
                </div>
                <div className="text-[16px] font-bold mb-1 text-slate950">{f.t}</div>
                <div className="text-[13px] leading-[19px] text-slate600">{f.s}</div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// DASHBOARD SECTION — interactive live dashboard inside a browser frame
// ---------------------------------------------------------------------------
const DashboardSection = () => {
  return (
    <section id="dashboard" className="py-[100px] bg-gradient-to-b from-paper to-primary-50/40 relative overflow-hidden">
      <div className="absolute inset-0 hero-mesh opacity-40 pointer-events-none" />
      <div className="relative max-w-[1320px] mx-auto px-6">
        <div className="max-w-[820px] mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Eyebrow>Dashboard</Eyebrow>
            <span className="inline-flex items-center gap-1 bg-success50 text-[#15803D] text-[10px] font-bold tracking-wider uppercase px-2 py-[3px] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" /> Demo en vivo
            </span>
          </div>
          <h2 className="text-[clamp(32px,4vw,48px)] leading-[1.08] font-extrabold display-tight text-slate950 mb-4">
            Una vista clara de cada obra.<br/>
            <span className="text-primary">Tocá y exploralo.</span>
          </h2>
          <p className="text-[17px] leading-[26px] text-slate600 max-w-[640px]">
            Esto que ves abajo es el producto, funcionando. Navegá entre Dashboard, Cronograma, Alertas, Pedidos, Reportes y Equipo desde la barra lateral.
          </p>
        </div>

        {/* Browser frame */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="relative">
          <div className="absolute inset-x-10 -inset-y-2 bg-primary/20 blur-3xl rounded-full -z-0" />
          <div className="relative bg-slate950 rounded-2xl p-3 shadow-big">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="flex gap-[6px]">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 max-w-[420px] mx-auto bg-slate800 text-slate400 text-[11px] rounded-md px-3 py-[5px] flex items-center gap-2 font-mono">
                <Icon name="shield" size={11} className="text-success" />
                <span>app.buildata.com.ar / belgrano</span>
              </div>
              <div className="text-slate500 text-[11px] hidden md:flex items-center gap-3">
                <Icon name="search" size={12} />
                <Icon name="more" size={12} />
              </div>
            </div>

            <LiveDashboard height={720} />
          </div>

          {/* Floating hint */}
          <div className="absolute -top-3 right-4 md:right-10 bg-white border border-slate200 shadow-pop rounded-full px-3 py-[6px] flex items-center gap-2 z-10">
            <Icon name="sparkle" size={12} className="text-accent" />
            <span className="text-[11px] font-bold text-slate950">Hacé clic en el menú lateral</span>
          </div>
        </m.div>

        {/* Three feature callouts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {[
            { i: 'trending', t: 'Tendencias automáticas',    s: 'Detecta atrasos en rubros antes de que se vuelvan críticos.' },
            { i: 'shield',   t: 'Trazabilidad completa',     s: 'Quién reportó qué, cuándo y desde dónde. Auditable.' },
            { i: 'users',    t: 'Multi-rol, multi-obra',     s: 'Director, jefe de obra, contratista, cliente. Cada uno ve lo suyo.' },
          ].map((c) => (
            <div key={c.t} className="bg-white border border-slate200 rounded-xl p-5 shadow-card">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-3">
                <Icon name={c.i} size={18} />
              </div>
              <div className="text-[15px] font-bold text-slate950 mb-1">{c.t}</div>
              <div className="text-[13px] text-slate600 leading-[20px]">{c.s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// CHATBOT IA SECTION — interactive bot demo with scenario picker
// ---------------------------------------------------------------------------
const ChatbotSection = () => {
  return (
    <section id="chatbot" className="py-[100px] bg-ink-deep text-white relative overflow-hidden">
      <div className="absolute inset-0 blueprint-bg opacity-90" />
      <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute bottom-[5%] left-[5%] w-[400px] h-[400px] rounded-full bg-primary/30 blur-3xl" />

      <div className="relative max-w-[1240px] mx-auto px-6">
        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center gap-3 mb-3">
              <Eyebrow className="text-accent">Chatbot IA</Eyebrow>
              <span className="inline-flex items-center gap-1 bg-accent/15 text-accent text-[10px] font-bold tracking-wider uppercase px-2 py-[3px] rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-accent live-dot" /> Probalo
              </span>
            </div>
            <h2 className="text-[clamp(32px,4vw,48px)] leading-[1.06] font-extrabold display-tight mb-4">
              <span style={{ color: "rgb(255, 255, 255)" }}>Un asistente de obra que habla castellano,<br/>
              <span className="text-accent">no jerga técnica.</span></span>
            </h2>
            <p className="text-[17px] leading-[26px] text-slate300 max-w-[640px]">
              Vive dentro del grupo de WhatsApp que tu equipo ya usa. Elegí un escenario, respondé al bot y mirá cómo se transforma en datos del otro lado.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-5 flex lg:justify-end items-end">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-slate400">
              <div className="flex items-center gap-2"><Icon name="check-circle" size={14} className="text-success" /> Sin entrenamiento</div>
              <div className="flex items-center gap-2"><Icon name="check-circle" size={14} className="text-success" /> Sin app nueva</div>
              <div className="flex items-center gap-2"><Icon name="check-circle" size={14} className="text-success" /> Funciona offline</div>
            </div>
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}>
          <LiveBot />
        </m.div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// BENEFICIOS
// ---------------------------------------------------------------------------
const Beneficios = () => {
  const stats = [
    { n: '12 h', l: 'ahorradas por semana en seguimiento manual' },
    { n: '3×',   l: 'más rápido en detectar problemas críticos' },
    { n: '0',    l: 'apps nuevas para los capataces' },
    { n: '1 día', l: 'de setup hasta tener el primer dashboard' },
  ];
  const benefits = [
    {
      i: 'clock',
      t: 'Decisiones en horas, no en semanas',
      s: 'Tu director deja de perseguir información por WhatsApp. La ve aparecer en el dashboard.',
    },
    {
      i: 'wrench',
      t: 'Sin cambiar de herramienta',
      s: 'El equipo de obra sigue usando WhatsApp. Vos tenés un panel profesional encima.',
    },
    {
      i: 'shield',
      t: 'Trazabilidad para auditorías',
      s: 'Quién reportó qué, cuándo y desde dónde. Listo para el cliente, el banco o la inspección.',
    },
  ];

  return (
    <section className="py-[120px] bg-paper relative">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="max-w-[720px] mb-14">
          <Eyebrow className="mb-3">Beneficios</Eyebrow>
          <h2 className="text-[clamp(32px,4vw,48px)] leading-[1.08] font-extrabold display-tight text-slate950 mb-4">
            Menos planillas. Menos llamadas.<br/>
            <span className="text-primary">Más obras a tiempo.</span>
          </h2>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {stats.map((s) => (
            <m.div key={s.l}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="bg-white border border-slate200 rounded-xl p-6 shadow-card">
              <div className="text-[48px] font-extrabold display-tight text-primary tnum leading-none mb-2">{s.n}</div>
              <div className="text-[13px] text-slate600 leading-[18px]">{s.l}</div>
            </m.div>
          ))}
        </div>

        {/* Three big benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
          {benefits.map((b) => (
            <div key={b.t} className="bg-white border border-slate200 rounded-xl p-7 shadow-card flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-5 shadow-pop">
                <Icon name={b.i} size={20} />
              </div>
              <div className="text-[20px] font-bold text-slate950 mb-2 display-tight">{b.t}</div>
              <div className="text-[14px] text-slate600 leading-[22px]">{b.s}</div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="bg-white border border-slate200 rounded-2xl p-10 shadow-card2 max-w-[900px] mx-auto">
          <div className="text-accent text-[60px] leading-none mb-2 font-serif">"</div>
          <blockquote className="text-[22px] leading-[32px] text-slate800 font-semibold display-tight mb-6">
            Antes pasaba dos horas por la mañana llamando a los jefes de obra para armar el parte. Hoy abro BuildData y ya está. Y lo más raro: a los capataces no les cambió nada.
          </blockquote>
          <div className="flex items-center gap-3">
            <Avatar initials="MR" size={44} />
            <div>
              <div className="text-[13px] font-bold text-slate950">Martín Rivera</div>
              <div className="text-[12px] text-slate500">Director de obra · Constructora Larío</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// CTA FINAL
// ---------------------------------------------------------------------------
const CTAFinal = () => {
  return (
    <section id="cta" className="py-[100px] bg-primary text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-25"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.1) 0 1px, transparent 1px 48px), repeating-linear-gradient(90deg, rgba(255,255,255,.1) 0 1px, transparent 1px 48px)' }} />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />

      <div className="relative max-w-[1240px] mx-auto px-6 text-center">
        <Eyebrow tone="white" className="text-accent mb-4">Empezá hoy</Eyebrow>
        <h2 className="text-[clamp(36px,5vw,64px)] leading-[1.06] font-extrabold display-tight mb-6 max-w-[860px] mx-auto">
          <span style={{ color: "rgb(255, 255, 255)" }}>Ordená la información de tu obra<br/>
          <span className="text-accent">en menos de 24 horas.</span></span>
        </h2>
        <p className="text-[18px] leading-[28px] text-white/80 max-w-[640px] mx-auto mb-10">
          Conectamos tus grupos de WhatsApp, configuramos tu dashboard y entrenamos al equipo. Vos solo recibís el primer reporte ordenado.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <a href="Planes.html" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-700 text-slate950 font-extrabold text-[15px] px-6 py-[14px] rounded-md shadow-pop">
            Probar 14 días gratis <Icon name="arrow-right" size={16} />
          </a>
          <a href="Planes.html" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[15px] px-6 py-[14px] rounded-md backdrop-blur">
            Agendar una demo
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-white/70">
          <div className="flex items-center gap-2"><Icon name="check-circle" size={14} className="text-success" /> Sin tarjeta</div>
          <div className="flex items-center gap-2"><Icon name="check-circle" size={14} className="text-success" /> Cancelás cuando quieras</div>
          <div className="flex items-center gap-2"><Icon name="check-circle" size={14} className="text-success" /> Soporte en español</div>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// FOOTER
// ---------------------------------------------------------------------------
const Footer = () => (
  <footer className="bg-slate950 text-slate400 py-10">
    <div className="max-w-[1240px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Icon name="logo-mark" size={26} />
        <span className="text-white font-extrabold text-[16px]">BuildData</span>
      </div>
      <div className="text-[12px]">© 2025 BuildData. Para constructoras que quieren ver la obra clara.</div>
      <div className="flex items-center gap-5 text-[12px]">
        <a href="#" className="hover:text-white">Producto</a>
        <a href="#" className="hover:text-white">Precios</a>
        <a href="#" className="hover:text-white">Privacidad</a>
        <a href="#" className="hover:text-white">Contacto</a>
      </div>
    </div>
  </footer>
);

// ---------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------
const App = () => (
  <div className="min-h-screen bg-paper">
    <Nav />
    <Hero />
    <Problema />
    <HowItWorks />
    <Funcionalidades />
    <DashboardSection />
    <ChatbotSection />
    <Beneficios />
    <CTAFinal />
    <Footer />
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
