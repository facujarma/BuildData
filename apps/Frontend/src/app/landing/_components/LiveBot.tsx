"use client";

import { useState, useEffect, useRef } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  Microphone,
  CircleExclamation,
  CircleInfo,
  Sparkles,
  ChevronRight,
  Paperclip,
} from "@gravity-ui/icons";

interface Message {
  side?: "me" | "bot";
  kind?: "audio";
  text?: string;
  html?: string;
  dur?: string;
  meta?: string;
  warn?: boolean;
  err?: boolean;
  quick?: QuickReply[];
}

type ThreadItem = Message | { day: string };

interface QuickReply {
  label: string;
  next?: string;
}

interface Scenario {
  label: string;
  icon: string;
  summary: string;
  initial: Message[];
  branches: Record<string, Message[]>;
}

const SCENARIOS: Record<string, Scenario> = {
  pedido: {
    label: "Pedido por audio",
    icon: "mic",
    summary: "El capataz manda una nota de voz con un pedido de material.",
    initial: [
      { side: "me", kind: "audio", dur: "0:14", meta: "14:32 ✓✓" },
      {
        side: "bot",
        html: "Anoté de tu audio:<br/>📦 <b>12 bolsas de cemento Portland</b><br/>👤 Reportado por J. Méndez<br/><br/>¿Confirmás?",
        quick: [
          { label: "Sí, confirmar", next: "confirmed" },
          { label: "Corregir cantidad", next: "correct" },
          { label: "No es cemento", next: "cancel" },
        ],
      },
    ],
    branches: {
      confirmed: [
        { side: "me", text: "Sí", meta: "14:33 ✓✓" },
        { side: "bot", html: '<span class="text-success">✅</span> Listo. Lo cargué al pedido <b>#PED-0142</b>.<br/>Quedan <b>3 pedidos pendientes</b> de aprobación hoy.',
          quick: [{ label: "Ver pendientes" }, { label: "OK" }] },
      ],
      correct: [
        { side: "bot", html: "¿Cuántas bolsas llegaron? Respondeme con un número." },
        { side: "me", text: "8", meta: "14:33 ✓✓" },
        { side: "bot", html: '<span class="text-success">✅</span> Corregido. <b>8 bolsas de cemento</b>.<br/>Cargado al pedido <b>#PED-0142</b>.' },
      ],
      cancel: [
        { side: "bot", html: "🤔 Sin problema, lo descarto. Mandame de nuevo el detalle del material y la cantidad cuando puedas." },
      ],
    },
  },

  alerta: {
    label: "Alerta crítica",
    icon: "alert",
    summary: "El capataz reporta una falla. El bot detecta urgencia y avisa.",
    initial: [
      { side: "me", text: "No anda la grúa torre 2. La cuadrilla está parada.", meta: "12:48 ✓✓" },
      {
        side: "bot", warn: true,
        html: '⚠️ Detecté una <b>alerta crítica</b>:<br/>🏗️ Falla en Grúa Torre 2<br/>👥 Cuadrilla detenida<br/><br/>¿Disparo aviso al director de obra?',
        quick: [
          { label: "Sí, avisar", next: "sent" },
          { label: "Anotar sin avisar", next: "silent" },
        ],
      },
    ],
    branches: {
      sent: [
        { side: "me", text: "Sí", meta: "12:49 ✓✓" },
        { side: "bot", html: '🚨 Avisé a <b>J. Méndez (Director)</b>.<br/>La alerta quedó como <b>CRÍTICA</b> en el dashboard.<br/><br/>¿Querés agregar foto o detalle?',
          quick: [{ label: "Subir foto" }, { label: "Listo" }] },
      ],
      silent: [
        { side: "bot", html: "📝 Anotado sin notificar. Queda en el reporte del día. Si cambia algo, avisame." },
      ],
    },
  },

  error: {
    label: "Dato faltante",
    icon: "info",
    summary: "El mensaje no alcanza para registrar el evento. El bot pregunta.",
    initial: [
      { side: "me", text: "Llegó el hierro", meta: "09:12 ✓✓" },
      {
        side: "bot", err: true,
        html: '❌ Faltan datos para guardar el reporte.<br/><br/>Necesito saber:<br/>• Diámetro del hierro<br/>• Cantidad (en toneladas o varillas)',
        quick: [
          { label: "Hierro 12 mm · 2,5 t", next: "fixed" },
          { label: "Después lo cargo", next: "later" },
        ],
      },
    ],
    branches: {
      fixed: [
        { side: "me", text: "Hierro 12 mm · 2,5 t", meta: "09:14 ✓✓" },
        { side: "bot", html: '<span class="text-success">✅</span> Perfecto, anoté:<br/>🔩 <b>Hierro 12 mm · 2,5 t</b><br/><br/>Lo asocio al pedido <b>#PED-0141</b>.' },
      ],
      later: [
        { side: "bot", html: "👍 Sin drama. Cuando tengas los datos, mandame foto del remito y lo armo solo." },
      ],
    },
  },
};

function Bubble({ m: msg }: { m: Message }) {
  if (msg.kind === "audio") {
    return (
      <m.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="self-end bg-wabubble rounded-md rounded-tr-none px-2 py-[6px] shadow-sm max-w-[80%]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-wa text-white flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div className="flex-1 h-[14px] bg-[repeating-linear-gradient(90deg,#94A3B8_0_2px,transparent_2px_5px)] rounded-sm" />
          <Microphone width={12} height={12} className="text-slate500" />
          <span className="text-[10px] text-[#667781] font-semibold tnum">{msg.dur}</span>
        </div>
        <div className="text-[9px] text-[#667781] text-right mt-[2px]">{msg.meta}</div>
      </m.div>
    );
  }

  const isMe = msg.side === "me";
  const boxTone = msg.warn ? "bg-[#FFF8E1] border border-[#FDE68A]"
                : msg.err  ? "bg-[#FFEDED] border border-[#FECACA]"
                : isMe   ? "bg-wabubble"
                : "bg-white";
  const align = isMe ? "self-end rounded-tr-none" : "self-start rounded-tl-none";

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={`${align} ${boxTone} rounded-md px-[10px] py-[7px] shadow-sm max-w-[85%]`}>
      <div className="text-[12px] leading-[17px] text-slate950" dangerouslySetInnerHTML={{ __html: msg.html || msg.text || "" }} />
      {msg.meta && <div className="text-[9px] text-[#667781] text-right mt-[3px]">{msg.meta}</div>}
    </m.div>
  );
}

export default function LiveBot() {
  const [scenKey, setScenKey] = useState("pedido");
  const [thread, setThread] = useState<ThreadItem[]>([{ day: "HOY" }, ...SCENARIOS.pedido.initial]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(SCENARIOS.pedido.initial.slice(-1)[0]?.quick || []);
  const [typing, setTyping] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [thread, typing, quickReplies]);

  const loadScenario = (key: string) => {
    setScenKey(key);
    setThread([{ day: "HOY" }, ...SCENARIOS[key].initial]);
    setQuickReplies(SCENARIOS[key].initial.slice(-1)[0]?.quick || []);
    setTyping(false);
  };

  const playBranch = (branchKey: string) => {
    const branch = SCENARIOS[scenKey].branches[branchKey];
    if (!branch) return;
    setQuickReplies([]);
    let i = 0;
    const tick = () => {
      if (i >= branch.length) {
        setTyping(false);
        const last = branch[branch.length - 1];
        if (last && last.quick) setQuickReplies(last.quick);
        return;
      }
      const next = branch[i];
      if (next.side === "bot") {
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

  const handleQuick = (q: QuickReply) => {
    if (q.next) playBranch(q.next);
    else setQuickReplies([]);
  };

  return (
    <div className="flex gap-8 items-start justify-center flex-wrap">
      <div className="w-full lg:w-[300px] flex-none">
        <div className="text-[13px] font-bold text-slate950 mb-3">Elegí una situación</div>
        <div className="flex flex-col gap-2">
          {Object.entries(SCENARIOS).map(([k, s]) => {
            const on = scenKey === k;
            const iconMap: Record<string, React.ReactNode> = {
              mic: <Microphone width={16} height={16} />,
              alert: <CircleExclamation width={16} height={16} />,
              info: <CircleInfo width={16} height={16} />,
            };
            return (
              <button key={k} onClick={() => loadScenario(k)}
                className={`text-left rounded-xl border p-4 transition-all
                  ${on ? "bg-white border-primary shadow-card2" : "bg-white border-slate200 hover:border-slate300"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-none
                    ${on ? "bg-primary text-white" : "bg-slate100 text-slate600"}`}>
                    {iconMap[s.icon]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-slate950">{s.label}</div>
                    <div className="text-[12px] leading-snug mt-[2px] text-slate500">{s.summary}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 text-[12px] text-slate500 leading-snug">
          Respondé con los botones del chat para ver cómo sigue la conversación.
        </div>
      </div>

      <div className="relative">
        <div className="w-[340px] h-[680px] bg-slate800 rounded-[40px] p-[10px] shadow-[0_24px_60px_-20px_rgba(15,23,42,.35)]">
          <div className="w-full h-full bg-wabg rounded-[30px] overflow-hidden flex flex-col relative">
            <div className="bg-wa text-white pt-8 pb-[10px] px-3 flex items-center gap-2 flex-none">
              <ChevronRight width={14} height={14} className="rotate-180 opacity-70" />
              <div className="w-9 h-9 rounded-full bg-ink-deep flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 56 56" fill="none">
                  <rect width="56" height="56" rx="12" fill="#0F4395" />
                  <rect x="11" y="30" width="9" height="18" rx="2" fill="#FFFFFF" fillOpacity="0.85" />
                  <rect x="23" y="20" width="9" height="28" rx="2" fill="#FFFFFF" />
                  <rect x="35" y="10" width="9" height="38" rx="2" fill="#F59E0B" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-bold">BuildData · Bot</div>
                <div className="text-[10px] text-white/70">en línea · responde en segundos</div>
              </div>
              <div className="ml-auto flex items-center gap-3 opacity-80">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </div>
            </div>

            <div ref={streamRef} className="flex-1 wa-bg overflow-y-auto p-[10px] flex flex-col gap-[6px] scrollbar-thin">
              <AnimatePresence initial={false}>
                {thread.map((m, i) => {
                  if ("day" in m) return (
                    <div key={`day-${i}`} className="self-center bg-[rgba(225,245,254,.85)] text-[#54656F] text-[10px] font-semibold px-2 py-[3px] rounded">
                      {m.day}
                    </div>
                  );
                  return <Bubble key={`${i}-${m.text || (m.html || "").slice(0, 14) || m.kind}`} m={m} />;
                })}
              </AnimatePresence>

              {typing && (
                <div className="self-start bg-white rounded-md rounded-tl-none px-3 py-[8px] shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles width={11} height={11} className="text-accent" />
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
                          ? "bg-primary text-white border-primary hover:bg-primary-700"
                          : "bg-white text-primary border-slate300 hover:bg-primary-50"}`}>
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="h-12" />
            </div>

            <div className="absolute bottom-2 left-2 right-2 flex gap-[6px] items-center">
              <div className="flex-1 bg-white rounded-full px-3 py-[7px] text-[12px] text-slate500 flex items-center gap-2">
                <span>😊</span><span>Mensaje</span>
                <Paperclip width={13} height={13} className="ml-auto" />
              </div>
              <div className="w-[36px] h-[36px] rounded-full bg-wa text-white flex items-center justify-center">
                <Microphone width={14} height={14} />
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => loadScenario(scenKey)}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-accent text-slate950 text-[11px] font-extrabold px-4 py-2 rounded-full shadow-pop hover:bg-accent-700 hover:text-white transition-colors">
          Reiniciar conversación
        </button>
      </div>
    </div>
  );
}
