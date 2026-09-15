// AI chatbot widget for the Dashboard — floating bubble bottom-right that
// opens a chat panel. Uses window.claude.complete for real responses, with a
// system prompt that scopes it to BuildData / construction context.

const SUGGESTED = [
  '¿Cuántos pedidos tengo pendientes de aprobar?',
  '¿Qué alertas críticas hay activas?',
  'Resumen del avance de hoy',
  '¿Quién reportó la falla de la grúa?',
];

const SYSTEM = `Te llamás Buildo. Sos el asistente IA de BuildData, una plataforma de gestión de obra que organiza información que llega por WhatsApp.

Contexto de la obra actual del usuario (Edificio Belgrano):
- Avance total: 68%
- Equipo: J. Méndez (director), C. Ríos, P. Salas, L. Benítez, M. Ortiz, A. Gómez
- Alertas activas: 2 críticas — falla en Grúa Torre 2 (P. Salas), faltante hierro 12mm (L. Benítez)
- Pedidos: 7 pendientes, 3 esperan aprobación (PED-0140 ladrillo cerámico marcado urgente)
- Rubros: mampostería 88%, hormigón 62% (retrasado 3 días), eléctricas 46%, sanitarias 58%, terminaciones 24%, carpintería 12%
- Hoy se completaron: hormigonado losa +3, 4 fotos de obra
- Hora: ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}

Respondé en español rioplatense, conciso y útil. Si te piden datos que no tenés, sé honesto. Usá markdown simple (negritas con **) cuando ayude. Nunca inventes números — si no los tenés en el contexto, decilo. Máximo 4 oraciones por respuesta salvo que te pidan un resumen largo.`;

const ChatBubble = () => {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const [unread, setUnread] = React.useState(true);
  const endRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Auto-scroll on new message
  React.useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [messages, thinking, open]);

  // Focus input when opening
  React.useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current.focus(), 100);
    if (open) setUnread(false);
  }, [open]);

  const send = async (text) => {
    const q = (text || input || '').trim();
    if (!q || thinking) return;
    setInput('');
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setThinking(true);
    try {
      const conversation = next.map((m) => ({ role: m.role, content: m.content }));
      const answer = await window.claude.complete({
        system: SYSTEM,
        messages: conversation,
      });
      setMessages([...next, { role: 'assistant', content: answer }]);
    } catch (err) {
      setMessages([...next, {
        role: 'assistant',
        content: 'Ups, hubo un problema al consultar la IA. Probá de nuevo en un momento.',
        error: true,
      }]);
    } finally {
      setThinking(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const renderContent = (text) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <b key={i}>{part.slice(2, -2)}</b>
        : <React.Fragment key={i}>{part}</React.Fragment>
    );

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button onClick={() => setOpen(true)} data-tour="buildo"
          className="fixed bottom-6 right-6 z-[60] group"
          aria-label="Abrir Buildo">
          <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />
          <span className="relative flex items-center justify-center w-[60px] h-[60px] rounded-full bg-ink-deep border-2 border-accent shadow-pop hover:scale-105 transition-transform">
            <Icon name="sparkle" size={26} className="text-accent" />
            {unread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-critical border-2 border-white" />
            )}
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div data-no-i18n className="fixed bottom-6 right-6 z-[60] w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-48px)] bg-white border border-slate200 rounded-2xl shadow-big flex flex-col overflow-hidden animate-chat-in">
          {/* Header */}
          <div className="blueprint-bg px-4 py-3 flex items-center gap-3 flex-none">
            <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-none">
              <Icon name="sparkle" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-white leading-tight">Buildo</div>
              <div className="text-[11px] text-white/60 flex items-center gap-[6px]">
                <span className="w-[6px] h-[6px] rounded-full bg-success" />
                Asistente IA · Edificio Belgrano
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-md text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
              aria-label="Cerrar">
              <Icon name="x" size={14} />
            </button>
          </div>

          {/* Body */}
          <div ref={endRef} className="flex-1 overflow-y-auto px-4 py-4 bg-slate50">
            {messages.length === 0 && !thinking && (
              <>
                <div className="bg-white border border-slate200 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-ink-deep text-accent flex items-center justify-center flex-none">
                      <Icon name="sparkle" size={12} />
                    </div>
                    <div className="text-[13px] text-slate800 leading-snug">
                      Hola Juan 👋 Soy <b>Buildo</b>, tu asistente de obra. Puedo responder sobre el avance, alertas, pedidos y reportes de <b>Edificio Belgrano</b>.
                    </div>
                  </div>
                </div>
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-2 mt-4">Sugerencias</div>
                <div className="flex flex-col gap-2">
                  {SUGGESTED.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="text-left text-[12.5px] text-slate700 bg-white border border-slate200 hover:border-primary hover:bg-primary-50 hover:text-primary rounded-lg p-3 leading-snug transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-ink-deep text-accent flex items-center justify-center flex-none mr-2 mt-[2px]">
                    <Icon name="sparkle" size={12} />
                  </div>
                )}
                <div className={`max-w-[80%] text-[13px] leading-relaxed px-3 py-[10px] rounded-2xl whitespace-pre-wrap
                  ${m.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : m.error
                      ? 'bg-critical50 text-[#B91C1C] border border-[#FECACA] rounded-bl-md'
                      : 'bg-white border border-slate200 text-slate800 rounded-bl-md'}`}>
                  {renderContent(m.content)}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-ink-deep text-accent flex items-center justify-center flex-none mr-2 mt-[2px]">
                  <Icon name="sparkle" size={12} />
                </div>
                <div className="bg-white border border-slate200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-[3px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-slate400 dot-pulse" style={{ animationDelay: '0s' }} />
                  <span className="w-[6px] h-[6px] rounded-full bg-slate400 dot-pulse" style={{ animationDelay: '0.18s' }} />
                  <span className="w-[6px] h-[6px] rounded-full bg-slate400 dot-pulse" style={{ animationDelay: '0.36s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate200 bg-white p-3 flex-none">
            <div className="flex items-end gap-2 bg-slate50 border border-slate200 rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
                placeholder="Preguntale a Buildo…" rows="1"
                className="flex-1 bg-transparent border-0 outline-none resize-none text-[13px] text-slate950 placeholder:text-slate500 max-h-[120px] py-[6px]" />
              <button onClick={() => send()} disabled={!input.trim() || thinking}
                className="w-8 h-8 rounded-md bg-primary disabled:bg-slate300 text-white flex items-center justify-center transition-colors hover:bg-primary-700 disabled:cursor-not-allowed">
                <Icon name="arrow-right" size={14} />
              </button>
            </div>
            <div className="text-[10px] text-slate400 mt-2 text-center">
              Respuestas generadas por IA. Verificá información crítica.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

Object.assign(window, { ChatBubble });
