// LiveBot — interactive WhatsApp bot demo for the BuildData landing.
// 3 scenarios. User taps a quick reply, the conversation branches.
// Replicates the kit's behaviour but rendered with our PhoneMockup style.

const { motion: bM, AnimatePresence: BAP } = window.Motion;

// ---------------------------------------------------------------------------
// Scenarios (mirrors ui_kits/whatsapp_bot)
// ---------------------------------------------------------------------------
const SCENARIOS = {
  pedido: {
    label: 'Pedido por audio',
    icon: 'mic',
    summary: 'El capataz manda una nota de voz con un pedido de material.',
    initial: [
      { side: 'me', kind: 'audio', dur: '0:14', meta: '14:32 ✓✓' },
      {
        side: 'bot',
        html: 'Anoté de tu audio:<br/>📦 <b>12 bolsas de cemento Portland</b><br/>👤 Reportado por J. Méndez<br/><br/>¿Confirmás?',
        quick: [
          { label: 'Sí, confirmar', next: 'confirmed' },
          { label: 'Corregir cantidad', next: 'correct' },
          { label: 'No es cemento', next: 'cancel' },
        ],
      },
    ],
    branches: {
      confirmed: [
        { side: 'me', text: 'Sí', meta: '14:33 ✓✓' },
        { side: 'bot', html: '<span class="text-success">✅</span> Listo. Lo cargué al pedido <b>#PED-0142</b>.<br/>Quedan <b>3 pedidos pendientes</b> de aprobación hoy.',
          quick: [{ label: 'Ver pendientes' }, { label: 'OK' }] },
      ],
      correct: [
        { side: 'bot', html: '¿Cuántas bolsas llegaron? Respondeme con un número.' },
        { side: 'me', text: '8', meta: '14:33 ✓✓' },
        { side: 'bot', html: '<span class="text-success">✅</span> Corregido. <b>8 bolsas de cemento</b>.<br/>Cargado al pedido <b>#PED-0142</b>.' },
      ],
      cancel: [
        { side: 'bot', html: '🤔 Sin problema, lo descarto. Mandame de nuevo el detalle del material y la cantidad cuando puedas.' },
      ],
    },
  },

  alerta: {
    label: 'Alerta crítica',
    icon: 'alert',
    summary: 'El capataz reporta una falla. El bot detecta urgencia y avisa.',
    initial: [
      { side: 'me', text: 'No anda la grúa torre 2. La cuadrilla está parada.', meta: '12:48 ✓✓' },
      {
        side: 'bot', warn: true,
        html: '⚠️ Detecté una <b>alerta crítica</b>:<br/>🏗️ Falla en Grúa Torre 2<br/>👥 Cuadrilla detenida<br/><br/>¿Disparo aviso al director de obra?',
        quick: [
          { label: 'Sí, avisar', next: 'sent' },
          { label: 'Anotar sin avisar', next: 'silent' },
        ],
      },
    ],
    branches: {
      sent: [
        { side: 'me', text: 'Sí', meta: '12:49 ✓✓' },
        { side: 'bot', html: '🚨 Avisé a <b>J. Méndez (Director)</b>.<br/>La alerta quedó como <b>CRÍTICA</b> en el dashboard.<br/><br/>¿Querés agregar foto o detalle?',
          quick: [{ label: 'Subir foto' }, { label: 'Listo' }] },
      ],
      silent: [
        { side: 'bot', html: '📝 Anotado sin notificar. Queda en el reporte del día. Si cambia algo, avisame.' },
      ],
    },
  },

  error: {
    label: 'Dato faltante',
    icon: 'info',
    summary: 'El mensaje no alcanza para registrar el evento. El bot pregunta.',
    initial: [
      { side: 'me', text: 'Llegó el hierro', meta: '09:12 ✓✓' },
      {
        side: 'bot', err: true,
        html: '❌ Faltan datos para guardar el reporte.<br/><br/>Necesito saber:<br/>• Diámetro del hierro<br/>• Cantidad (en toneladas o varillas)',
        quick: [
          { label: 'Hierro 12 mm · 2,5 t', next: 'fixed' },
          { label: 'Después lo cargo', next: 'later' },
        ],
      },
    ],
    branches: {
      fixed: [
        { side: 'me', text: 'Hierro 12 mm · 2,5 t', meta: '09:14 ✓✓' },
        { side: 'bot', html: '<span class="text-success">✅</span> Perfecto, anoté:<br/>🔩 <b>Hierro 12 mm · 2,5 t</b><br/><br/>Lo asocio al pedido <b>#PED-0141</b>.' },
      ],
      later: [
        { side: 'bot', html: '👍 Sin drama. Cuando tengas los datos, mandame foto del remito y lo armo solo.' },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Message bubble (atomic)
// ---------------------------------------------------------------------------
const Bubble = ({ m }) => {
  if (m.kind === 'audio') {
    return (
      <bM.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="self-end bg-wabubble rounded-md rounded-tr-none px-2 py-[6px] shadow-sm max-w-[80%]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-wa text-white flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div className="flex-1 h-[14px] bg-[repeating-linear-gradient(90deg,#94A3B8_0_2px,transparent_2px_5px)] rounded-sm" />
          <Icon name="mic" size={12} className="text-slate500" />
          <span className="text-[10px] text-[#667781] font-semibold tnum">{m.dur}</span>
        </div>
        <div className="text-[9px] text-[#667781] text-right mt-[2px]">{m.meta}</div>
      </bM.div>
    );
  }

  const isMe = m.side === 'me';
  const boxTone = m.warn ? 'bg-[#FFF8E1] border border-[#FDE68A]'
                : m.err  ? 'bg-[#FFEDED] border border-[#FECACA]'
                : isMe   ? 'bg-wabubble'
                : 'bg-white';
  const align = isMe ? 'self-end rounded-tr-none' : 'self-start rounded-tl-none';

  return (
    <bM.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={`${align} ${boxTone} rounded-md px-[10px] py-[7px] shadow-sm max-w-[85%]`}>
      <div className="text-[12px] leading-[17px] text-slate950" dangerouslySetInnerHTML={{ __html: m.html || m.text }} />
      {m.meta && <div className="text-[9px] text-[#667781] text-right mt-[3px]">{m.meta}</div>}
    </bM.div>
  );
};

// ---------------------------------------------------------------------------
// LiveBot — phone with reactive conversation
// ---------------------------------------------------------------------------
const LiveBot = () => {
  const [scenKey, setScenKey] = React.useState('pedido');
  const [thread, setThread] = React.useState([{ day: 'HOY' }, ...SCENARIOS.pedido.initial]);
  const [quickReplies, setQuickReplies] = React.useState(SCENARIOS.pedido.initial.slice(-1)[0]?.quick || []);
  const [typing, setTyping] = React.useState(false);
  const streamRef = React.useRef(null);

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [thread, typing, quickReplies]);

  const loadScenario = (key) => {
    setScenKey(key);
    setThread([{ day: 'HOY' }, ...SCENARIOS[key].initial]);
    setQuickReplies(SCENARIOS[key].initial.slice(-1)[0]?.quick || []);
    setTyping(false);
  };

  const playBranch = (branchKey) => {
    const branch = SCENARIOS[scenKey].branches[branchKey];
    if (!branch) return;
    setQuickReplies([]);
    let i = 0;
    const tick = () => {
      if (i >= branch.length) {
        setTyping(false);
        // surface quick replies from final message (if any)
        const last = branch[branch.length - 1];
        if (last && last.quick) setQuickReplies(last.quick);
        return;
      }
      const next = branch[i];
      if (next.side === 'bot') {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setThread((t) => [...t, next]);
          i++;
          setTimeout(tick, 350);
        }, 700);
      } else {
        setThread((t) => [...t, next]);
        i++;
        setTimeout(tick, 350);
      }
    };
    tick();
  };

  const handleQuick = (q) => {
    if (q.next) playBranch(q.next);
    else setQuickReplies([]);
  };

  // ---- Render --------------------------------------------------------------
  return (
    <div className="flex gap-8 items-start justify-center flex-wrap">
      {/* Scenario picker */}
      <div className="w-full lg:w-[300px] flex-none">
        <div className="text-[11px] tracking-[0.06em] uppercase font-bold text-accent mb-3">Escenarios</div>
        <div className="flex flex-col gap-2">
          {Object.entries(SCENARIOS).map(([k, s]) => {
            const on = scenKey === k;
            return (
              <button key={k} onClick={() => loadScenario(k)}
                className={`text-left rounded-xl border p-4 transition-all
                  ${on ? 'bg-white text-slate950 border-white shadow-pop' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-none
                    ${on ? 'bg-accent text-slate950' : 'bg-accent/15 text-accent'}`}>
                    <Icon name={s.icon} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[13px] font-bold ${on ? 'text-slate950' : 'text-white'}`}>{s.label}</div>
                    <div className={`text-[11px] leading-snug mt-[2px] ${on ? 'text-slate600' : 'text-white/60'}`}>{s.summary}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-5 text-[11px] text-white/50 leading-snug">
          <Icon name="info" size={12} className="inline align-[-2px] mr-1" />
          Tocá un escenario o respondé con las opciones del bot para ver cómo se ramifica la conversación.
        </div>
      </div>

      {/* Phone */}
      <div className="relative">
        <div className="w-[340px] h-[680px] bg-black rounded-[40px] p-[12px] shadow-big">
          <div className="w-full h-full bg-wabg rounded-[30px] overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="bg-wa text-white pt-8 pb-[10px] px-3 flex items-center gap-2 flex-none">
              <Icon name="chevron-right" size={14} className="rotate-180 opacity-70" />
              <div className="w-9 h-9 rounded-full bg-ink-deep flex items-center justify-center">
                <Icon name="logo-mark" size={20} />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-bold">BuildData · Bot</div>
                <div className="text-[10px] text-white/70">en línea · responde en segundos</div>
              </div>
              <div className="ml-auto flex items-center gap-3 opacity-80">
                <Icon name="phone" size={15} />
                <Icon name="more" size={15} />
              </div>
            </div>

            {/* Stream */}
            <div ref={streamRef} className="flex-1 wa-bg overflow-y-auto p-[10px] flex flex-col gap-[6px] scrollbar-thin">
              <BAP initial={false}>
                {thread.map((m, i) => {
                  if (m.day) return (
                    <div key={`day-${i}`} className="self-center bg-[rgba(225,245,254,.85)] text-[#54656F] text-[10px] font-semibold px-2 py-[3px] rounded">
                      {m.day}
                    </div>
                  );
                  return <Bubble key={`${i}-${m.text || (m.html || '').slice(0, 14) || m.kind}`} m={m} />;
                })}
              </BAP>

              {typing && (
                <div className="self-start bg-white rounded-md rounded-tl-none px-3 py-[8px] shadow-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="sparkle" size={11} className="text-accent" />
                    <span className="typing"><span /><span /><span /></span>
                  </div>
                </div>
              )}

              {quickReplies.length > 0 && (
                <div className="self-start flex flex-wrap gap-[6px] max-w-[88%] mt-1">
                  {quickReplies.map((q, i) => (
                    <button key={q.label} onClick={() => handleQuick(q)}
                      className={`text-[11px] font-bold px-3 py-[7px] rounded-full border transition-colors
                        ${i === 0
                          ? 'bg-primary text-white border-primary hover:bg-primary-700'
                          : 'bg-white text-primary border-slate300 hover:bg-primary-50'}`}>
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="h-12" /> {/* spacer for composer overlay */}
            </div>

            {/* Composer */}
            <div className="absolute bottom-2 left-2 right-2 flex gap-[6px] items-center">
              <div className="flex-1 bg-white rounded-full px-3 py-[7px] text-[12px] text-slate500 flex items-center gap-2">
                <span>😊</span><span>Mensaje</span>
                <Icon name="paperclip" size={13} className="ml-auto" />
              </div>
              <div className="w-[36px] h-[36px] rounded-full bg-wa text-white flex items-center justify-center">
                <Icon name="mic" size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Restart pill below phone */}
        <button onClick={() => loadScenario(scenKey)}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-accent text-slate950 text-[11px] font-extrabold px-4 py-2 rounded-full shadow-pop hover:bg-accent-700 hover:text-white transition-colors">
          Reiniciar conversación
        </button>
      </div>
    </div>
  );
};

window.LiveBot = LiveBot;
