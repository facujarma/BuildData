"use client";

import { useState, useEffect } from "react";
import { CircleExclamation, Check, Box, Calendar, Sparkles, ArrowRight, Plus } from "@gravity-ui/icons";
import { getActividad } from "@/services/actividadService";
import { consultarChat } from "@/services/chatbotService";
import type { ActivityGroup } from "@/app/[obraId]/dashboard/actividad/data";
import { KIND_ICONS, SUGGESTED_QUESTIONS } from "@/app/[obraId]/dashboard/actividad/data";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import { DAvatar } from "@/components/ui/DAvatar";
import Button from "@/components/ui/Button";
import { DPageHeader } from "@/app/[obraId]/dashboard/_components/DPageHeader";

const KIND_ELEM: Record<string, React.ReactNode> = {
  check: <Check width={14} height={14} />,
  alert: <CircleExclamation width={14} height={14} />,
  calendar: <Calendar width={14} height={14} />,
  package: <Box width={14} height={14} />,
};

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <b key={i}>{part.slice(2, -2)}</b>;
    }
    return part;
  });
}

export function ScreenActividad({ obraId }: { obraId: string }) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ActivityGroup[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    getActividad(obraId).then((data) => {
      setGroups(data.groups);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [obraId]);

  // Responde con el ChatBot AI (pregunta en lenguaje natural → SQL de solo lectura sobre la obra)
  const handleAsk = async (q: string) => {
    if (asking) return;
    setQuestion(q);
    setAsking(true);
    setAnswer("");
    try {
      const r = await consultarChat(q, obraId);
      setAnswer(r.respuesta || "No encontré datos para responder eso.");
    } catch (e) {
      setAnswer(e instanceof Error ? `No pude responder: ${e.message}` : "No pude responder la pregunta.");
    } finally {
      setAsking(false);
    }
  };

  const handleSend = () => {
    if (!question.trim()) return;
    handleAsk(question.trim());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[13px]">
        Cargando actividad…
      </div>
    );
  }

  return (
    <div>
      <DPageHeader
        title="Actividad de la obra"
        right={
          <Button size="sm" icon={<Plus width={16} height={16} />}>
            Nueva actividad
          </Button>
        }
      />

      <div className="grid grid-cols-[2fr_1fr] gap-5 items-start">
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.d}>
              <div className="text-[11px] font-bold text-slate-500 tracking-[0.06em] uppercase mb-3">{g.d}</div>
              <div className="space-y-2">
                {g.items.map((item, idx) => {
                  const ki = KIND_ICONS[item.kind] || KIND_ICONS.avance;
                  return (
                    <DCard key={idx} padding="p-3">
                      <div className="flex items-start gap-3">
                        <DAvatar initials={item.who} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-bold text-slate-900">{item.name}</span>
                            <span className="text-[11px] text-slate-400">{item.role}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[11px] text-slate-400">{item.time}</span>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${ki.tint}`}>
                              {KIND_ELEM[ki.ico] || <Check width={14} height={14} />}
                            </div>
                          </div>
                          <p className="text-[12px] text-slate-700 leading-relaxed">{item.text}</p>
                          {item.tags.length > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {item.tags.map((tag) => (
                                <DPill key={tag} tone={tag === "Crítico" ? "criticalSolid" : tag === "Foto" ? "info" : "slate"}>
                                  {tag}
                                </DPill>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </DCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky top-6">
          <DCard padding="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles width={16} height={16} className="text-primary" />
              <div className="text-[14px] font-bold">Preguntale a tu actividad</div>
            </div>

            <div className="space-y-2 mb-4">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  disabled={asking}
                  className="w-full text-left text-[12px] text-slate-600 bg-slate-50 hover:bg-primary-50 hover:text-primary rounded-lg px-3 py-2 transition-colors leading-snug"
                >
                  {q}
                </button>
              ))}
            </div>

            {asking && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-[12px] text-slate-400 flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Buscando en la actividad de la obra…
              </div>
            )}
            {answer && !asking && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-[12px] text-slate-700 leading-relaxed whitespace-pre-line">
                {renderBold(answer)}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="Escribí tu pregunta…"
                className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-[8px] text-[13px] focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!question.trim() || asking}
                className="w-9 h-9 rounded-md bg-primary hover:bg-primary-700 text-white flex items-center justify-center flex-none transition-colors disabled:bg-slate-200 disabled:text-slate-400"
              >
                <ArrowRight width={16} height={16} />
              </button>
            </div>
          </DCard>
        </div>
      </div>
    </div>
  );
}
