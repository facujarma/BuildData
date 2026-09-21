"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Xmark, ArrowRight } from "@gravity-ui/icons";
import { consultarChat } from "@/services/chatbotService";

const SUGGESTED = [
  "¿Cómo viene la obra?",
  "¿Cuánto gastamos este mes?",
  "¿Qué materiales están bajo el stock mínimo?",
  "¿Qué tareas tengo que entregar esta semana?",
];

interface ChatBubbleProps {
  obraId: string;
  obraNombre?: string;
}

export function ChatBubble({ obraId, obraNombre }: ChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string; error?: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [unread, setUnread] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [messages, thinking, open]);

  useEffect(() => {
    if (open) {
      const el = inputRef.current;
      if (el) setTimeout(() => el.focus(), 100);
    }
  }, [open]);

  const send = async (text?: string) => {
    const q = (text || input || "").trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setThinking(true);
    try {
      const resultado = await consultarChat(q, obraId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: resultado.respuesta || "No pude obtener respuesta." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ups, hubo un problema al consultar los datos de la obra. Probá de nuevo en un momento.",
          error: true,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const renderContent = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <b key={i}>{part.slice(2, -2)}</b>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  return (
    <>
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            setUnread(false);
          }}
          className="fixed bottom-6 right-6 z-[60] group"
          aria-label="Abrir Buildo"
        >
          <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />
          <span className="relative flex items-center justify-center w-[60px] h-[60px] rounded-full bg-ink-deep border-2 border-accent shadow-pop hover:scale-105 transition-transform">
            <Sparkles width={26} height={26} className="text-accent" />
            {unread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-critical border-2 border-white" />
            )}
          </span>
        </button>
      )}

      {open && (
        <div
          data-no-i18n
          className="fixed bottom-6 right-6 z-[60] w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-48px)] bg-white border border-slate-200 rounded-2xl shadow-big flex flex-col overflow-hidden animate-chat-in"
        >
          {/* Header */}
          <div className="blueprint-bg px-4 py-3 flex items-center gap-3 flex-none">
            <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-none">
              <Sparkles width={16} height={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-white leading-tight">Buildo</div>
              <div className="text-[11px] text-white/60 flex items-center gap-[6px]">
                <span className="w-[6px] h-[6px] rounded-full bg-success" />
                Asistente IA · {obraNombre || "Obra"}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-md text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
              aria-label="Cerrar"
            >
              <Xmark width={14} height={14} />
            </button>
          </div>

          {/* Body */}
          <div ref={endRef} className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50">
            {messages.length === 0 && !thinking && (
              <>
                <div className="bg-white border border-slate-200 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-ink-deep text-accent flex items-center justify-center flex-none">
                      <Sparkles width={12} height={12} />
                    </div>
                    <div className="text-[13px] text-slate-800 leading-snug">
                      Hola 👋 Soy <b>Buildo</b>, tu asistente de obra. Respondo con datos reales de <b>{obraNombre || "esta obra"}</b>: gastos, pedidos, tareas, stock y avance.
                    </div>
                  </div>
                </div>
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2 mt-4">
                  Sugerencias
                </div>
                <div className="flex flex-col gap-2">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[12.5px] text-slate-700 bg-white border border-slate-200 hover:border-primary hover:bg-primary-50 hover:text-primary rounded-lg p-3 leading-snug transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-ink-deep text-accent flex items-center justify-center flex-none mr-2 mt-[2px]">
                    <Sparkles width={12} height={12} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] text-[13px] leading-relaxed px-3 py-[10px] rounded-2xl whitespace-pre-wrap
                    ${m.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : m.error
                        ? "bg-critical-50 text-[#B91C1C] border border-[#FECACA] rounded-bl-md"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"}`}
                >
                  {renderContent(m.content)}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-ink-deep text-accent flex items-center justify-center flex-none mr-2 mt-[2px]">
                  <Sparkles width={12} height={12} />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-[3px]">
                  {[0, 0.18, 0.36].map((d, i) => (
                    <span
                      key={i}
                      className="w-[6px] h-[6px] rounded-full bg-slate-400 dot-pulse"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 bg-white p-3 flex-none">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Preguntale a Buildo…"
                rows={1}
                className="flex-1 bg-transparent border-0 outline-none resize-none text-[13px] text-slate-950 placeholder:text-slate-500 max-h-[120px] py-[6px]"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || thinking}
                className="w-8 h-8 rounded-md bg-primary disabled:bg-slate-300 text-white flex items-center justify-center transition-colors hover:bg-primary-700 disabled:cursor-not-allowed"
              >
                <ArrowRight width={14} height={14} />
              </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 text-center">
              Respuestas generadas por IA. Verificá información crítica.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
