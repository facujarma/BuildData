// Dashboard mockup + WhatsApp mockup — pure JSX, no images.
// Designed to look polished at multiple scales (used in hero composite,
// hero collage, the dedicated dashboard section, and as the final stage
// in the scroll-driven "Cómo funciona" story).

const { motion } = window.Motion || {};

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------
const Pill = ({ tone = 'success', children }) => {
  const map = {
    success:   { bg: '#F0FDF4', fg: '#15803D' },
    critical:  { bg: '#FEF2F2', fg: '#B91C1C' },
    attention: { bg: '#FFFBEB', fg: '#A16207' },
    info:      { bg: '#EFF6FF', fg: '#1D4ED8' },
    primary:   { bg: '#EFF4FC', fg: '#0B3275' },
    neutral:   { bg: '#F1F5F9', fg: '#334155' },
  }[tone];
  return (
    <span style={{ background: map.bg, color: map.fg }}
      className="inline-flex items-center px-2 py-[3px] rounded text-[10px] font-bold tracking-[0.06em] uppercase">
      {children}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Tiny avatar
// ---------------------------------------------------------------------------
const Avatar = ({ initials, size = 28, tone = 'primary' }) => {
  const tones = {
    primary: '#0F4395', accent: '#B45309', critical: '#B91C1C',
    success: '#15803D', info: '#1D4ED8', slate: '#334155',
  };
  return (
    <div style={{ width: size, height: size, background: '#EFF4FC', color: tones[tone], fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center font-bold flex-none">
      {initials}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stat card (used on dashboard mockup)
// ---------------------------------------------------------------------------
const StatTile = ({ tone, label, value, suffix, delta, icon }) => {
  const tones = {
    primary:   { tint: '#EFF4FC', fg: '#0F4395' },
    critical:  { tint: '#FEF2F2', fg: '#B91C1C' },
    attention: { tint: '#FFFBEB', fg: '#A16207' },
    success:   { tint: '#F0FDF4', fg: '#15803D' },
  }[tone];
  return (
    <div className="bg-white rounded-lg border border-slate200 p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div style={{ background: tones.tint, color: tones.fg }} className="w-9 h-9 rounded-lg flex items-center justify-center">
          <Icon name={icon} size={16} />
        </div>
        {delta && <span className="text-[10px] font-bold text-slate500 tnum">{delta}</span>}
      </div>
      <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-slate600 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <div className="text-[28px] font-extrabold display-tight tnum text-slate950 leading-none">{value}</div>
        {suffix && <div className="text-base font-bold text-slate500">{suffix}</div>}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dashboard mockup — fixed inner width; can be scaled by parent via transform
// ---------------------------------------------------------------------------
const DashboardMockup = ({ width = 980, compact = false }) => {
  return (
    <div style={{ width }} className="bg-paper rounded-xl border border-slate200 shadow-card2 overflow-hidden">
      {/* App chrome */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-[180px] bg-white border-r border-slate200 px-3 py-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 px-2 mb-3">
            <Icon name="logo-mark" size={22} />
            <span className="font-extrabold text-[15px]">BuildData</span>
          </div>
          {[
            { i: 'chart', l: 'Dashboard', a: true },
            { i: 'calendar', l: 'Cronograma' },
            { i: 'alert', l: 'Alertas', badge: '2' },
            { i: 'package', l: 'Pedidos' },
            { i: 'message', l: 'Reportes' },
            { i: 'users', l: 'Equipo' },
          ].map((it) => (
            <div key={it.l}
              className={`flex items-center gap-2 px-2 py-[7px] rounded-md text-[12px] font-semibold ${it.a ? 'bg-primary-50 text-primary' : 'text-slate700'}`}>
              <Icon name={it.i} size={14} />
              <span className="flex-1">{it.l}</span>
              {it.badge && <span className="bg-critical text-white text-[9px] px-[5px] py-[1px] rounded-full font-bold">{it.badge}</span>}
            </div>
          ))}
          <div className="mt-auto pt-3 border-t border-slate200 mt-4">
            <div className="flex items-center gap-2 px-2">
              <Avatar initials="JM" size={26} />
              <div>
                <div className="text-[11px] font-bold leading-tight">J. Méndez</div>
                <div className="text-[10px] text-slate500 leading-tight">Director de obra</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Topbar */}
          <div className="h-[44px] bg-white/80 border-b border-slate200 backdrop-blur flex items-center px-4 gap-3">
            <div className="flex-1 flex items-center gap-2 bg-slate50 rounded-md px-2 py-[6px] border border-slate200">
              <Icon name="search" size={14} className="text-slate400" />
              <span className="text-[11px] text-slate500">Buscar obra, pedido, persona…</span>
            </div>
            <Icon name="bell" size={16} className="text-slate600" />
            <span className="w-2 h-2 rounded-full bg-success live-dot" />
          </div>

          {/* Page header */}
          <div className="px-5 pt-4 pb-3 flex items-end justify-between">
            <div>
              <div className="text-[18px] font-bold leading-none mb-1">Edificio Belgrano</div>
              <div className="text-[11px] text-slate500">Actualizado hace 12 min</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase bg-success50 text-[#15803D] px-2 py-1 rounded">
                <span className="w-1.5 h-1.5 bg-success rounded-full" /> En curso
              </span>
              <button className="bg-primary text-white text-[11px] font-bold px-3 py-[7px] rounded-md flex items-center gap-1">
                <Icon name="plus" size={12} /> Nuevo reporte
              </button>
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-4 gap-2 px-5 mb-3">
            <StatTile tone="primary"   label="Avance"     value="68" suffix="%" icon="chart"   delta="+4%" />
            <StatTile tone="critical"  label="Críticas"   value="2"             icon="alert"   delta="+1 hoy" />
            <StatTile tone="attention" label="Pedidos"    value="7"             icon="package" delta="3 a aprobar" />
            <StatTile tone="success"   label="Tareas"     value="9/12"          icon="check"   delta="75%" />
          </div>

          {/* Two columns: progress + alerts */}
          <div className="grid grid-cols-[1.7fr_1fr] gap-2 px-5 pb-3">
            <div className="bg-white rounded-lg border border-slate200 shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate200 flex items-center justify-between">
                <div className="text-[13px] font-bold">Avance por rubro</div>
                <div className="flex bg-slate100 rounded-md p-[2px] gap-[2px]">
                  {['Sem', 'Mes', 'Total'].map((l, i) => (
                    <span key={l} className={`text-[10px] font-bold px-2 py-[3px] rounded ${i === 2 ? 'bg-white text-slate950 shadow-card' : 'text-slate500'}`}>{l}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 space-y-[10px]">
                {[
                  { name: 'Mampostería',   pct: 88, tone: '#22C55E' },
                  { name: 'Hormigón armado', pct: 62, tone: '#0F4395' },
                  { name: 'Inst. eléctricas', pct: 46, tone: '#3B82F6' },
                  { name: 'Inst. sanitarias', pct: 58, tone: '#3B82F6' },
                  { name: 'Terminaciones', pct: 24, tone: '#F59E0B' },
                ].map((r) => (
                  <div key={r.name} className="grid grid-cols-[120px_1fr_36px] gap-3 items-center">
                    <div className="text-[11px] font-semibold text-slate800">{r.name}</div>
                    <div className="bg-slate100 h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${r.pct}%`, background: r.tone }} className="h-full rounded-full" />
                    </div>
                    <div className="text-[11px] font-bold text-right tnum">{r.pct}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate200 shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate200 flex items-center justify-between">
                <div className="text-[13px] font-bold">Críticos activos</div>
                <span className="bg-critical text-white text-[10px] font-bold px-2 py-[2px] rounded">2</span>
              </div>
              <div className="divide-y divide-slate200">
                {[
                  { t: 'Falla en Grúa Torre 2', s: 'J. Méndez · hace 12 min', tone: 'critical' },
                  { t: 'Faltante: hierro 12 mm', s: 'Pedido sin aprobar · 2 h', tone: 'critical' },
                  { t: 'Demora en hormigón',   s: 'Hace 3 días',               tone: 'attention' },
                ].map((a, i) => (
                  <div key={i} className="px-3 py-[10px] flex items-start gap-2">
                    <div style={{ background: a.tone === 'critical' ? '#FEF2F2' : '#FFFBEB', color: a.tone === 'critical' ? '#B91C1C' : '#A16207' }}
                      className="w-7 h-7 rounded-md flex items-center justify-center flex-none">
                      <Icon name="alert" size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold leading-tight">{a.t}</div>
                      <div className="text-[10px] text-slate500 mt-[2px]">{a.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!compact && (
            /* AI insight banner */
            <div className="px-5 pb-5">
              <div className="blueprint-bg rounded-lg p-4 text-white relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-[9px] font-bold tracking-wider uppercase px-2 py-[3px] rounded">
                    <Icon name="sparkle" size={10} /> Análisis IA
                  </span>
                  <span className="text-[10px] text-white/60">hace 8 min</span>
                </div>
                <div className="text-[14px] font-bold leading-snug mb-1">El rubro hormigón armado se está retrasando 3 días respecto al cronograma.</div>
                <div className="text-[11px] text-white/70 leading-snug">Si no se acelera esta semana, las terminaciones se mueven al 28 Oct.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// WhatsApp phone mockup
// ---------------------------------------------------------------------------
// `mode` controls which conversation state is visible:
//   'incoming'   — voice note just arrived (no bot reply yet)
//   'processing' — bot is "typing" (analizando audio)
//   'confirm'    — bot replied with structured fields + quick-reply buttons
//   'saved'      — user confirmed; bot acknowledged and saved
const PhoneMockup = ({ width = 320, mode = 'confirm', headerName = 'BuildData · Bot' }) => {
  const scale = width / 320;
  return (
    <div style={{ width, height: 640 * scale }} className="relative">
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div className="w-[320px] h-[640px] bg-black rounded-[36px] p-[10px] shadow-big">
          <div className="w-full h-full bg-wabg rounded-[28px] overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="bg-wa text-white pt-7 pb-[10px] px-3 flex items-center gap-2 flex-none">
              <Icon name="chevron-right" size={14} className="rotate-180 opacity-70" />
              <div className="w-9 h-9 rounded-full bg-ink-deep flex items-center justify-center">
                <Icon name="logo-mark" size={20} />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-bold">{headerName}</div>
                <div className="text-[10px] text-white/70">en línea · responde en segundos</div>
              </div>
              <div className="ml-auto flex items-center gap-3 opacity-80">
                <Icon name="phone" size={15} />
                <Icon name="more" size={15} />
              </div>
            </div>

            {/* Stream */}
            <div className="flex-1 wa-bg p-[10px] overflow-hidden flex flex-col gap-[6px]">
              <div className="self-center bg-[rgba(225,245,254,.85)] text-[#54656F] text-[10px] font-semibold px-2 py-[3px] rounded">
                HOY
              </div>

              {/* Inbound voice note (always present) */}
              <div className="self-end bg-wabubble rounded-md rounded-tr-none px-2 py-[6px] shadow-sm max-w-[78%]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-wa text-white flex items-center justify-center">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <div className="flex-1 h-3 bg-[repeating-linear-gradient(90deg,#94A3B8_0_2px,transparent_2px_5px)] rounded-sm" />
                  <Icon name="mic" size={11} className="text-slate500" />
                  <span className="text-[9px] text-[#667781] font-semibold">0:14</span>
                </div>
                <div className="text-[8.5px] text-[#667781] text-right mt-[2px]">14:32 ✓✓</div>
              </div>

              {mode === 'processing' && (
                <div className="self-start bg-white rounded-md rounded-tl-none px-2 py-[7px] shadow-sm max-w-[78%]">
                  <div className="flex items-center gap-2">
                    <Icon name="sparkle" size={11} className="text-accent" />
                    <span className="text-[11px] font-semibold text-slate700">Analizando audio</span>
                    <span className="typing"><span /><span /><span /></span>
                  </div>
                </div>
              )}

              {(mode === 'confirm' || mode === 'saved') && (
                <div className="self-start bg-white rounded-md rounded-tl-none px-[10px] py-[8px] shadow-sm max-w-[82%]">
                  <div className="text-[11px] leading-[15px] text-slate950">
                    Anoté de tu audio:<br/>
                    <span className="inline-flex items-center gap-1 mt-[3px]"><Icon name="package" size={10} className="text-primary"/> <b>12 bolsas de cemento Portland</b></span><br/>
                    
                    <span className="inline-flex items-center gap-1"><span className="w-2.5 text-center">👤</span>Reportado por J. Méndez</span>
                  </div>
                  {mode === 'confirm' && (
                    <div className="text-[10.5px] text-slate700 mt-[6px]">¿Confirmás?</div>
                  )}
                  <div className="text-[8.5px] text-[#667781] text-right mt-[4px]">14:32</div>
                </div>
              )}

              {mode === 'confirm' && (
                <div className="self-start flex flex-wrap gap-[5px] max-w-[82%]">
                  {['Sí, confirmar', 'Corregir cantidad', 'No es cemento'].map((l, i) => (
                    <button key={l}
                      className={`text-[10px] font-bold px-[10px] py-[6px] rounded-full border ${i === 0 ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-slate300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'saved' && (
                <>
                  <div className="self-end bg-wabubble rounded-md rounded-tr-none px-2 py-[5px] shadow-sm">
                    <div className="text-[11px]">Sí</div>
                    <div className="text-[8.5px] text-[#667781] text-right">14:33 ✓✓</div>
                  </div>
                  <div className="self-start bg-white rounded-md rounded-tl-none px-[10px] py-[7px] shadow-sm max-w-[82%]">
                    <div className="text-[11px] leading-[15px]">
                      <span className="text-success">✅</span> Listo. Lo cargué al pedido <b>#PED-0142</b>.<br/>
                      Quedan <b>3 pedidos</b> pendientes de aprobación hoy.
                    </div>
                    <div className="text-[8.5px] text-[#667781] text-right mt-[3px]">14:33</div>
                  </div>
                </>
              )}
            </div>

            {/* Composer */}
            <div className="absolute bottom-[6px] left-[6px] right-[6px] flex gap-[5px] items-center">
              <div className="flex-1 bg-white rounded-full px-3 py-[6px] text-[11px] text-slate500 flex items-center gap-2">
                <span>😊</span><span>Mensaje</span>
              </div>
              <div className="w-[34px] h-[34px] rounded-full bg-wa text-white flex items-center justify-center">
                <Icon name="mic" size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Pill, Avatar, StatTile, DashboardMockup, PhoneMockup });
