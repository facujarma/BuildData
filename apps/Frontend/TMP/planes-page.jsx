// PlanesPage — pricing screen for BuildData.
// Three tiers + enterprise. Monthly/annual toggle with savings highlight.
// Feature comparison table, social proof, FAQ, final CTA.

// ---------------------------------------------------------------------------
// Plans data
// ---------------------------------------------------------------------------
// Prices are in AR$ (monthly). Annual rate = ~20% off (×10 months / year).

const PLANS = [
  {
    id: 'inicio',
    name: 'Inicio',
    tagline: 'Para probar BuildData o para una sola obra chica.',
    priceMonthly: 0,
    priceAnnual: 0,
    isTrial: true,
    trialDays: 14,
    cta: 'Empezar gratis',
    ctaVariant: 'secondary',
    href: 'Login.html',
    perfect: 'Profesionales independientes que arrancan con BuildData.',
    features: [
      { text: '1 obra activa',                         on: true },
      { text: 'Hasta 5 personas en el equipo',          on: true },
      { text: 'Bot de WhatsApp con 100 mensajes/mes',   on: true },
      { text: 'Cronograma y alertas básicas',           on: true },
      { text: 'Almacenamiento 1 GB',                    on: true },
      { text: 'Análisis IA y resúmenes diarios',        on: false },
      { text: 'Reportes exportables (PDF/XLSX)',        on: false },
      { text: 'Integraciones con ERP',                  on: false },
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    tagline: 'Lo más elegido — para constructoras pequeñas y medianas.',
    priceMonthly: 89000,
    priceAnnual: 71000,
    cta: 'Probar 14 días gratis',
    ctaVariant: 'primary',
    href: 'Login.html',
    popular: true,
    perfect: 'Constructoras con 2 a 5 obras simultáneas.',
    features: [
      { text: 'Hasta 3 obras activas',                       on: true, strong: true },
      { text: 'Hasta 20 personas por obra',                  on: true, strong: true },
      { text: 'Bot de WhatsApp con mensajes ilimitados',     on: true },
      { text: 'Cronograma, alertas y pedidos completos',     on: true },
      { text: 'Análisis IA y resúmenes diarios',             on: true, strong: true },
      { text: 'Reportes exportables (PDF/XLSX)',             on: true },
      { text: 'Almacenamiento 20 GB',                        on: true },
      { text: 'Soporte prioritario por WhatsApp',            on: true },
      { text: 'Integraciones con ERP (Tango, SAP)',          on: false },
    ],
  },
  {
    id: 'empresa',
    name: 'Empresa',
    tagline: 'Para constructoras que gestionan muchas obras a la vez.',
    priceMonthly: 189000,
    priceAnnual: 151000,
    cta: 'Probar 14 días gratis',
    ctaVariant: 'secondary',
    href: 'Login.html',
    perfect: 'Constructoras con 6+ obras o gerencias multi-proyecto.',
    features: [
      { text: 'Obras ilimitadas',                            on: true, strong: true },
      { text: 'Equipos ilimitados',                          on: true, strong: true },
      { text: 'Bot de WhatsApp con mensajes ilimitados',     on: true },
      { text: 'Todo lo del plan Profesional',                on: true },
      { text: 'Integraciones con ERP (Tango, SAP, custom)',  on: true, strong: true },
      { text: 'Dashboard consolidado multi-obra',            on: true, strong: true },
      { text: 'Almacenamiento 200 GB',                       on: true },
      { text: 'Manager de cuenta dedicado',                  on: true },
      { text: 'Onboarding con tu equipo',                    on: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Feature matrix for comparison table
// ---------------------------------------------------------------------------

const COMPARE_GROUPS = [
  {
    title: 'Equipo y obras',
    rows: [
      { feat: 'Obras simultáneas',                vals: ['1',           '3',           'Ilimitadas'] },
      { feat: 'Personas por obra',                vals: ['5',           '20',          'Ilimitadas'] },
      { feat: 'Roles personalizados',             vals: ['—',           '✓',           '✓'] },
    ],
  },
  {
    title: 'Bot de WhatsApp',
    rows: [
      { feat: 'Mensajes al mes',                   vals: ['100',         'Ilimitados', 'Ilimitados'] },
      { feat: 'Transcripción de audios',           vals: ['✓',           '✓',           '✓'] },
      { feat: 'Clasificación automática por IA',   vals: ['Básica',      'Completa',   'Completa + custom'] },
      { feat: 'Múltiples números de WhatsApp',     vals: ['—',           '—',           '✓'] },
    ],
  },
  {
    title: 'Análisis e IA',
    rows: [
      { feat: 'Resumen diario por IA',             vals: ['—',           '✓',           '✓'] },
      { feat: 'Predicción de retrasos',            vals: ['—',           '✓',           '✓'] },
      { feat: 'Consultas en lenguaje natural',     vals: ['—',           '✓',           '✓'] },
      { feat: 'Modelos entrenados con tus datos',  vals: ['—',           '—',           '✓'] },
    ],
  },
  {
    title: 'Reportes y exportación',
    rows: [
      { feat: 'Reportes en pantalla',              vals: ['✓',           '✓',           '✓'] },
      { feat: 'Exportar PDF / XLSX',               vals: ['—',           '✓',           '✓'] },
      { feat: 'Reportes programados por email',    vals: ['—',           '✓',           '✓'] },
      { feat: 'API y webhooks',                    vals: ['—',           '—',           '✓'] },
    ],
  },
  {
    title: 'Integraciones',
    rows: [
      { feat: 'Slack / Microsoft Teams',           vals: ['—',           '✓',           '✓'] },
      { feat: 'ERP (Tango, SAP, etc.)',            vals: ['—',           '—',           '✓'] },
      { feat: 'Integraciones a medida',            vals: ['—',           '—',           '✓'] },
    ],
  },
  {
    title: 'Soporte',
    rows: [
      { feat: 'Centro de ayuda',                   vals: ['✓',           '✓',           '✓'] },
      { feat: 'Soporte por email',                 vals: ['48 hs',       '24 hs',       '4 hs'] },
      { feat: 'Soporte por WhatsApp',              vals: ['—',           '✓',           '✓'] },
      { feat: 'Manager de cuenta dedicado',        vals: ['—',           '—',           '✓'] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

const Header = () => (
  <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-slate200">
    <div className="max-w-[1240px] mx-auto px-6 h-[68px] flex items-center justify-between">
      <a href="Landing.html" className="flex items-center gap-2">
        <Icon name="logo-mark" size={28} />
        <span className="text-[18px] font-extrabold display-tight">BuildData</span>
      </a>
      <nav className="hidden md:flex items-center gap-6 text-[13px] font-semibold text-slate600">
        <a href="Landing.html" className="hover:text-primary">Producto</a>
        <a href="Planes.html" className="text-primary">Planes</a>
        <a href="Landing.html#casos" className="hover:text-primary">Casos</a>
        <a href="Landing.html#contacto" className="hover:text-primary">Contacto</a>
      </nav>
      <div className="flex items-center gap-2">
        <a href="Login.html" className="text-[13px] font-bold text-slate700 hover:text-primary px-3 py-2">Iniciar sesión</a>
        <a href="Login.html" className="text-[13px] font-bold bg-primary hover:bg-primary-700 text-white rounded-md px-4 py-[8px] transition-colors">
          Probar gratis
        </a>
      </div>
    </div>
  </header>
);

const FAQ_ITEMS = [
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí. Subir de plan es instantáneo y solo pagás la diferencia prorrateada hasta el próximo ciclo. Bajar de plan se aplica al inicio del siguiente período. Cancelar también lo podés hacer cuando quieras desde Configuración.',
  },
  {
    q: '¿Qué pasa cuando termina la prueba gratis de 14 días?',
    a: 'No pedimos tarjeta para empezar. Cuando se cumplen los 14 días, podés elegir el plan que mejor te quede, o seguir gratis con el plan Inicio (1 obra, 5 personas) si te alcanza. Si no hacés nada, tu cuenta queda en modo solo-lectura y tus datos se preservan por 90 días.',
  },
  {
    q: '¿Cobran por persona del equipo?',
    a: 'No. Cobramos por la suscripción de la cuenta. Cada plan tiene un cupo de personas por obra, pero podés invitar a capataces, compras, arquitectos y clientes sin pagar extra por cada uno.',
  },
  {
    q: '¿Cómo funciona la facturación anual?',
    a: 'Pagás 12 meses por adelantado y obtenés 2 meses gratis (equivalente a un 20% de descuento). Emitimos factura A o B según tu condición fiscal en Argentina, Uruguay, Chile y México.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Todos los datos viajan cifrados (TLS 1.3) y se guardan en servidores con cifrado en reposo. Hacemos backups diarios. En el plan Empresa podés alojar tus datos en una región específica y exportar todo en cualquier momento.',
  },
  {
    q: '¿Tienen descuentos para estudios chicos o cooperativas?',
    a: 'Sí. Si tu estudio tiene menos de 3 personas o sos una cooperativa de trabajo, escribinos a hola@buildata.app y te damos un 30% adicional sobre el precio anual.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatARS = (n) => {
  if (n === 0) return 'Gratis';
  return 'AR$ ' + n.toLocaleString('es-AR');
};

const ButtonStyles = (variant) => {
  const v = {
    primary:   'bg-primary hover:bg-primary-700 text-white border-primary',
    secondary: 'bg-white hover:bg-slate50 text-slate700 border-slate300',
    dark:      'bg-accent hover:bg-accent-700 text-slate950 border-accent',
    ghost:     'bg-transparent hover:bg-slate100 text-primary border-transparent',
  };
  return v[variant] || v.primary;
};

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

const Hero = ({ annual, setAnnual }) => (
  <section className="hero-grid relative">
    <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-10 text-center">
      <div className="inline-flex items-center gap-2 bg-primary-50 text-primary border border-primary/15 rounded-full px-3 py-[5px] text-[10px] tracking-[0.12em] uppercase font-bold mb-5">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.3 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
        Sin tarjeta · cancelás cuando quieras
      </div>
      <h1 className="text-[clamp(36px,5vw,56px)] leading-[1.05] font-extrabold display-tight max-w-[820px] mx-auto">
        Un plan para cada tipo de obra.<br/>
        <span className="text-primary">Sin sorpresas, sin contratos largos.</span>
      </h1>
      <p className="text-[16px] text-slate600 leading-relaxed max-w-[640px] mx-auto mt-5">
        Probá gratis durante 14 días. Cuando estés convencido elegís el plan que más se ajuste a tu volumen de obra — y lo cambiás cuando crezcas.
      </p>

      {/* Annual toggle */}
      <div className="inline-flex items-center gap-3 mt-9 bg-white border border-slate200 rounded-full p-[3px] shadow-card">
        <button onClick={() => setAnnual(false)}
          className={`text-[12px] font-bold px-5 py-[8px] rounded-full transition-colors ${!annual ? 'bg-primary text-white' : 'text-slate600 hover:text-slate950'}`}>
          Mensual
        </button>
        <button onClick={() => setAnnual(true)}
          className={`text-[12px] font-bold px-5 py-[8px] rounded-full transition-colors flex items-center gap-2 ${annual ? 'bg-primary text-white' : 'text-slate600 hover:text-slate950'}`}>
          Anual
          <span className={`text-[9px] font-bold px-[6px] py-[2px] rounded-full tracking-wider ${annual ? 'bg-accent text-slate950' : 'bg-success50 text-[#15803D]'}`}>
            −20%
          </span>
        </button>
      </div>
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// Plan cards
// ---------------------------------------------------------------------------

const PlanCard = ({ plan, annual }) => {
  const isPopular = plan.popular;
  const price = annual ? plan.priceAnnual : plan.priceMonthly;
  const cardCls = isPopular
    ? 'blueprint-bg text-white border-transparent ring-2 ring-accent shadow-pop scale-[1.02]'
    : 'bg-white text-slate950 border-slate200 shadow-card';
  const dim = isPopular ? 'text-white/65' : 'text-slate500';

  return (
    <div className={`relative rounded-2xl border p-7 flex flex-col ${cardCls}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-slate950 text-[10px] tracking-[0.12em] uppercase font-extrabold px-3 py-[5px] rounded-full shadow-card">
          ★ Más elegido
        </div>
      )}

      <div className="text-[12px] font-bold tracking-[0.06em] uppercase mb-1" style={{ color: isPopular ? '#F59E0B' : '#0F4395' }}>
        {plan.name}
      </div>
      <h3 className={`text-[20px] font-extrabold display-tight leading-tight ${isPopular ? 'text-white' : 'text-slate950'}`}>
        {plan.tagline}
      </h3>

      <div className="mt-6 mb-2">
        {plan.isTrial ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className={`text-[44px] font-extrabold display-tight tnum ${isPopular ? 'text-white' : 'text-slate950'}`}>Gratis</span>
            </div>
            <div className={`text-[12px] ${dim}`}>14 días sin tarjeta · luego AR$ 0 / mes</div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className={`text-[44px] font-extrabold display-tight tnum ${isPopular ? 'text-white' : 'text-slate950'}`}>
                AR$ {price.toLocaleString('es-AR')}
              </span>
              <span className={`text-[14px] font-semibold ${dim}`}>/ mes</span>
            </div>
            <div className={`text-[12px] ${dim}`}>
              {annual
                ? <>Facturado anualmente · ahorrás AR$ {((plan.priceMonthly - plan.priceAnnual) * 12).toLocaleString('es-AR')} al año</>
                : <>Facturado mensualmente · sin permanencia</>}
            </div>
          </>
        )}
      </div>

      <div className={`text-[12px] mt-2 ${dim} leading-snug min-h-[36px]`}>
        <b className={isPopular ? 'text-white' : 'text-slate700'}>Ideal para:</b> {plan.perfect}
      </div>

      <a href={plan.href}
        className={`mt-5 inline-flex items-center justify-center gap-2 font-bold rounded-md px-4 py-[11px] text-[13px] border transition-colors
          ${isPopular ? ButtonStyles('dark') : ButtonStyles(plan.ctaVariant)}`}>
        {plan.cta} <Icon name="arrow-right" size={14} />
      </a>

      <div className={`text-[10px] tracking-[0.06em] uppercase font-bold mt-7 mb-3 ${dim}`}>
        Incluye
      </div>
      <ul className="flex flex-col gap-2 flex-1">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2">
            <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-none mt-[1px]
              ${f.on
                ? isPopular ? 'bg-accent text-slate950' : 'bg-success50 text-[#15803D]'
                : isPopular ? 'bg-white/10 text-white/40' : 'bg-slate100 text-slate400'}`}>
              <Icon name={f.on ? 'check' : 'x'} size={11} />
            </span>
            <span className={`text-[12.5px] leading-snug
              ${f.on
                ? (f.strong ? (isPopular ? 'text-white font-bold' : 'text-slate950 font-bold') : (isPopular ? 'text-white/85' : 'text-slate700'))
                : (isPopular ? 'text-white/40 line-through' : 'text-slate400 line-through')}`}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const EnterpriseCard = () => (
  <div className="bg-paper border-2 border-dashed border-slate300 rounded-2xl p-7 grid grid-cols-1 lg:grid-cols-[2fr_1fr_auto] gap-6 items-center mt-6">
    <div>
      <div className="text-[12px] font-bold tracking-[0.06em] uppercase text-accent-700 mb-1">Enterprise</div>
      <h3 className="text-[22px] font-extrabold display-tight leading-tight">
        ¿Sos una desarrolladora grande o un grupo constructor?
      </h3>
      <p className="text-[13px] text-slate600 leading-relaxed mt-2 max-w-[520px]">
        Armamos un plan a medida con SSO, residencia de datos, integraciones específicas y SLAs definidos por contrato. Onboarding asistido por nuestro equipo.
      </p>
    </div>
    <div className="text-[13px] text-slate700 leading-relaxed">
      <ul className="space-y-2">
        {['SSO con tu Active Directory','Residencia de datos en AR/UY/CL','SLA del 99.95 %','Onboarding y capacitación','Soporte 24/7'].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Icon name="check" size={12} className="text-success" /> {t}
          </li>
        ))}
      </ul>
    </div>
    <a href="mailto:enterprise@buildata.app"
      className="inline-flex items-center justify-center gap-2 bg-slate950 hover:bg-ink-deep text-white font-bold rounded-md px-5 py-[12px] text-[13px] transition-colors whitespace-nowrap">
      Hablar con ventas <Icon name="arrow-right" size={14} />
    </a>
  </div>
);

// ---------------------------------------------------------------------------
// Compare table
// ---------------------------------------------------------------------------

const CompareTable = () => (
  <section className="max-w-[1100px] mx-auto px-6 py-16">
    <div className="text-center mb-10">
      <div className="text-[10px] tracking-[0.18em] uppercase font-bold text-primary mb-2">Comparación detallada</div>
      <h2 className="text-[28px] font-extrabold display-tight">Todo lo que incluye cada plan</h2>
    </div>

    <div className="bg-white border border-slate200 rounded-xl overflow-hidden shadow-card">
      {/* Header */}
      <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] bg-slate50 border-b border-slate200">
        <div className="px-5 py-4 text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Funcionalidades</div>
        {PLANS.map((p) => (
          <div key={p.id} className={`px-5 py-4 text-center ${p.popular ? 'bg-primary text-white' : ''}`}>
            <div className={`text-[14px] font-extrabold ${p.popular ? 'text-white' : 'text-slate950'}`}>{p.name}</div>
            <div className={`text-[11px] mt-[2px] ${p.popular ? 'text-white/70' : 'text-slate500'}`}>
              {p.isTrial ? 'Gratis · 14 días' : `AR$ ${p.priceMonthly.toLocaleString('es-AR')} / mes`}
            </div>
          </div>
        ))}
      </div>

      {/* Groups */}
      {COMPARE_GROUPS.map((g) => (
        <React.Fragment key={g.title}>
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] bg-slate100/60 border-b border-slate200">
            <div className="px-5 py-2 text-[10px] tracking-[0.06em] uppercase font-bold text-slate700">{g.title}</div>
            <div /><div /><div />
          </div>
          {g.rows.map((r, i) => (
            <div key={r.feat} className={`grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center
              ${i < g.rows.length - 1 ? 'border-b border-slate100' : ''}
              ${i % 2 === 0 ? '' : ''}`}>
              <div className="px-5 py-3 text-[13px] text-slate700">{r.feat}</div>
              {r.vals.map((v, j) => (
                <div key={j} className={`px-5 py-3 text-center text-[13px] font-semibold
                  ${PLANS[j].popular ? 'bg-primary/[0.03]' : ''}`}>
                  {v === '✓'
                    ? <span className="inline-flex w-6 h-6 rounded-full bg-success50 text-[#15803D] items-center justify-center"><Icon name="check" size={12}/></span>
                    : v === '—'
                      ? <span className="text-slate300 text-[15px]">—</span>
                      : <span className="text-slate950">{v}</span>}
                </div>
              ))}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>

    <div className="text-center mt-6 text-[12px] text-slate500">
      ¿No estás seguro cuál te conviene? <a href="mailto:hola@buildata.app" className="text-primary font-bold hover:underline">Hablá con nosotros</a> y te ayudamos a elegir.
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// Social proof strip
// ---------------------------------------------------------------------------

const SocialProof = () => (
  <section className="bg-white border-y border-slate200">
    <div className="max-w-[1100px] mx-auto px-6 py-12 text-center">
      <div className="text-[10px] tracking-[0.18em] uppercase font-bold text-slate500 mb-6">
        Más de 120 constructoras ya usan BuildData
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[860px] mx-auto">
        {[
          { v: '120+',  l: 'constructoras' },
          { v: '14 K',  l: 'reportes / mes' },
          { v: '92 %',  l: 'transcripciones correctas' },
          { v: '4 h',   l: 'ahorradas por día' },
        ].map((s) => (
          <div key={s.l}>
            <div className="text-[32px] font-extrabold display-tight tnum text-slate950">{s.v}</div>
            <div className="text-[11px] tracking-[0.06em] uppercase font-bold text-slate500 mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQItem = ({ q, a, open, onClick }) => (
  <div className={`border-b border-slate200 transition-colors ${open ? 'bg-white' : 'hover:bg-white'}`}>
    <button onClick={onClick} className="w-full flex items-center justify-between gap-4 text-left px-5 py-5">
      <span className="text-[15px] font-bold text-slate950">{q}</span>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-none transition-transform
        ${open ? 'bg-primary text-white rotate-180' : 'bg-slate100 text-slate600'}`}>
        <Icon name="chevron-down" size={14} />
      </span>
    </button>
    {open && (
      <div className="px-5 pb-5 text-[13.5px] text-slate600 leading-relaxed max-w-[820px]">{a}</div>
    )}
  </div>
);

const FAQ = () => {
  const [open, setOpen] = React.useState(0);
  return (
    <section className="max-w-[860px] mx-auto px-6 py-20">
      <div className="text-center mb-10">
        <div className="text-[10px] tracking-[0.18em] uppercase font-bold text-primary mb-2">Preguntas frecuentes</div>
        <h2 className="text-[28px] font-extrabold display-tight">Lo que más nos preguntan</h2>
      </div>
      <div className="bg-paper border border-slate200 rounded-xl overflow-hidden">
        {FAQ_ITEMS.map((it, i) => (
          <FAQItem key={i} {...it} open={open === i} onClick={() => setOpen(open === i ? -1 : i)} />
        ))}
      </div>
      <div className="text-center mt-6 text-[13px] text-slate500">
        ¿Otra duda? Escribinos a <a href="mailto:hola@buildata.app" className="text-primary font-bold hover:underline">hola@buildata.app</a>.
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

const FinalCTA = () => (
  <section className="blueprint-bg relative overflow-hidden">
    <div className="max-w-[1100px] mx-auto px-6 py-20 text-center text-white relative z-10">
      <h2 className="text-[clamp(28px,4vw,44px)] leading-[1.1] font-extrabold display-tight mb-4 max-w-[760px] mx-auto">
        <span style={{ color: "rgb(255, 255, 255)" }}>Probá BuildData en tu obra.</span><br/>
        <span className="text-accent">En 24 horas tu información va a estar ordenada.</span>
      </h2>
      <p className="text-[15px] text-white/70 max-w-[540px] mx-auto leading-relaxed mb-8">
        Sin tarjeta de crédito. Sin contratos largos. Sin instalaciones complicadas.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <a href="Login.html" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-700 text-slate950 font-bold rounded-md px-6 py-[12px] text-[14px] transition-colors">
          Empezar 14 días gratis <Icon name="arrow-right" size={15} />
        </a>
        <a href="mailto:hola@buildata.app" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-md px-6 py-[12px] text-[14px] transition-colors">
          Agendar una demo
        </a>
      </div>
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

const Footer = () => (
  <footer className="bg-ink-deep text-white">
    <div className="max-w-[1240px] mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Icon name="logo-mark" size={26} />
        <span className="font-extrabold text-[16px]">BuildData</span>
      </div>
      <div className="text-[12px] text-white/55">© 2026 BuildData · La información de tu obra, ordenada en un solo lugar.</div>
      <div className="flex gap-6 text-[12px] font-semibold text-white/70">
        <a href="Landing.html" className="hover:text-accent">Producto</a>
        <a href="Planes.html" className="hover:text-accent">Planes</a>
        <a href="mailto:hola@buildata.app" className="hover:text-accent">Contacto</a>
      </div>
    </div>
  </footer>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PlanesPage = () => {
  const [annual, setAnnual] = React.useState(true);

  return (
    <div data-screen-label="Planes">
      <Header />
      <Hero annual={annual} setAnnual={setAnnual} />

      <section className="max-w-[1240px] mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((p) => <PlanCard key={p.id} plan={p} annual={annual} />)}
        </div>
        <EnterpriseCard />
        <div className="flex items-center justify-center gap-6 mt-8 text-[12px] text-slate500 flex-wrap">
          <span className="inline-flex items-center gap-1"><Icon name="check" size={12} className="text-success" /> Sin tarjeta para empezar</span>
          <span className="inline-flex items-center gap-1"><Icon name="check" size={12} className="text-success" /> Cancelás cuando quieras</span>
          <span className="inline-flex items-center gap-1"><Icon name="check" size={12} className="text-success" /> Migración asistida sin costo</span>
        </div>
      </section>

      <SocialProof />
      <CompareTable />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

Object.assign(window, { PlanesPage });
