// ProductTour — guided coachmark overlay for the Dashboard.
// Spotlights real UI elements (via [data-tour] anchors), shows a tooltip card
// with explanation, Siguiente/Anterior/Saltar controls + progress.
// Steps whose target isn't found are skipped automatically.

const TOUR_STEPS = [
  {
    target: null, // centered welcome
    title: 'Bienvenido a BuildData 👷',
    body: 'Te muestro en 1 minuto cómo está organizado tu panel de obra. Podés saltarlo cuando quieras.',
    emoji: '🏗️',
  },
  {
    target: '[data-tour="sidebar"]',
    place: 'right',
    title: 'Tu obra, por secciones',
    body: 'Desde acá navegás todo: cronograma, alertas, pedidos, stock, recibos, presupuesto, actividad y equipo. Cada sección es una parte de la obra.',
  },
  {
    target: '[data-tour="new"]',
    place: 'bottom',
    title: 'Cargá cualquier cosa, rápido',
    body: 'El botón "Nuevo" te deja crear una tarea, un pedido, una alerta o registrar actividad sin entrar a cada sección.',
  },
  {
    target: '[data-tour="search"]',
    place: 'bottom',
    title: 'Buscá en toda la obra',
    body: 'Encontrá tareas, pedidos o personas al instante. Más adelante también vas a poder preguntarle a Buildo, la IA.',
  },
  {
    target: '[data-tour="bell"]',
    place: 'bottom',
    title: 'Notificaciones',
    body: 'Acá llegan los avisos importantes: invitaciones, alertas críticas, pedidos por aprobar y entregas.',
  },
  {
    target: '[data-tour="metrics"]',
    place: 'bottom',
    title: 'El estado de un vistazo',
    body: 'Las tarjetas resumen el avance, las alertas, los pedidos y las tareas del día. Tocá cualquiera para ver el detalle.',
  },
  {
    target: '[data-tour="checklist"]',
    place: 'top',
    title: 'Terminá de configurar tu obra',
    body: 'Estos pasos te ayudan a poblar la obra con datos reales: cronograma, pedidos y tu primer reporte. Los que no necesites, los podés saltar.',
  },
  {
    target: '[data-tour="buildo"]',
    place: 'left',
    title: 'Buildo, tu asistente IA',
    body: 'Preguntale lo que quieras sobre la obra. Conoce el avance, las alertas, los pedidos y el equipo.',
  },
  {
    target: null,
    title: '¡Listo para empezar! 🚀',
    body: 'Eso es todo. Recordá que tu equipo reporta por WhatsApp y acá ves todo ordenado. Podés volver a ver este tour desde Ayuda.',
    emoji: '✅',
  },
];

const ProductTour = ({ open, onClose, steps = TOUR_STEPS }) => {
  const [i, setI] = React.useState(0);
  const [rect, setRect] = React.useState(null);
  const [, force] = React.useState(0);

  // Resolve the visible steps (skip any whose target doesn't exist)
  const visibleSteps = React.useMemo(() => {
    if (!open) return steps;
    return steps.filter((s) => !s.target || document.querySelector(s.target));
  }, [open, steps]);

  React.useEffect(() => { if (open) setI(0); }, [open]);

  const step = visibleSteps[i];

  // Measure target element
  React.useEffect(() => {
    if (!open || !step) return;
    const measure = () => {
      if (!step.target) { setRect(null); return; }
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    measure();
    const t = setTimeout(measure, 120);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [open, step, i]);

  React.useEffect(() => {
    if (!open) return;
    const k = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  if (!open || !step) return null;

  const last = i === visibleSteps.length - 1;
  const next = () => { if (last) onClose(); else setI((n) => Math.min(visibleSteps.length - 1, n + 1)); };
  const prev = () => setI((n) => Math.max(0, n - 1));

  const pad = 8;
  const spot = rect ? {
    left: rect.left - pad, top: rect.top - pad,
    width: rect.width + pad * 2, height: rect.height + pad * 2,
  } : null;

  // Tooltip position
  const TW = 320, TH = 196, GAP = 14;
  let tip;
  if (!spot) {
    tip = { left: (window.innerWidth - TW) / 2, top: (window.innerHeight - TH) / 2, arrow: null };
  } else {
    const place = step.place || 'bottom';
    if (place === 'right')  tip = { left: spot.left + spot.width + GAP, top: Math.max(16, spot.top), arrow: 'left' };
    else if (place === 'left')   tip = { left: spot.left - TW - GAP, top: Math.max(16, spot.top), arrow: 'right' };
    else if (place === 'top')    tip = { left: Math.min(spot.left, window.innerWidth - TW - 16), top: spot.top - TH - GAP, arrow: 'bottom' };
    else                          tip = { left: Math.min(spot.left, window.innerWidth - TW - 16), top: spot.top + spot.height + GAP, arrow: 'top' };
    // clamp
    tip.left = Math.max(16, Math.min(tip.left, window.innerWidth - TW - 16));
    tip.top = Math.max(16, Math.min(tip.top, window.innerHeight - TH - 16));
  }

  return (
    <div className="fixed inset-0 z-[200]" style={{ animation: 'tourFade .2s ease-out' }}>
      {/* Dim layer with spotlight cutout via box-shadow */}
      {spot ? (
        <div onClick={onClose} style={{
          position: 'fixed', left: spot.left, top: spot.top, width: spot.width, height: spot.height,
          borderRadius: 12, boxShadow: '0 0 0 9999px rgba(15,23,42,0.66)',
          border: '2px solid #F59E0B', transition: 'all .28s cubic-bezier(.16,1,.3,1)', pointerEvents: 'auto',
        }} />
      ) : (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.66)' }} />
      )}

      {/* Tooltip card */}
      <div style={{
        position: 'fixed', left: tip.left, top: tip.top, width: TW,
        background: '#fff', borderRadius: 16, boxShadow: '0 24px 60px -12px rgba(15,23,42,.5)',
        padding: 20, animation: 'tourPop .26s cubic-bezier(.16,1,.3,1)',
      }}>
        {step.emoji && <div style={{ fontSize: 30, marginBottom: 6 }}>{step.emoji}</div>}
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: 6 }}>{step.title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: '#475569' }}>{step.body}</div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginTop: 16, marginBottom: 14 }}>
          {visibleSteps.map((_, n) => (
            <span key={n} style={{
              height: 5, borderRadius: 999, flex: n === i ? '0 0 20px' : '0 0 5px',
              background: n === i ? '#0F4395' : n < i ? '#94A3B8' : '#E2E8F0', transition: 'all .2s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', background: 'none', border: 0, cursor: 'pointer', padding: 0 }}>
            Saltar tour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {i > 0 && (
              <button onClick={prev} style={{ fontSize: 13, fontWeight: 700, color: '#334155', background: '#fff', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
                Anterior
              </button>
            )}
            <button onClick={next} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#0F4395', border: '1px solid #0F4395', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
              {last ? 'Empezar' : `Siguiente (${i + 1}/${visibleSteps.length})`}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tourFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tourPop { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};

Object.assign(window, { ProductTour });
