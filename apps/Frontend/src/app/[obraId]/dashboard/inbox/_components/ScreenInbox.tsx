"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Comment,
  Microphone,
  Pencil,
  Picture,
  Sparkles,
  TriangleExclamation,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { DStatTile } from "../../_components/DStatTile";
import { DashToast, useToast } from "../../_components/useToast";
import DButton from "@/components/ui/Button";
import { DAvatar } from "@/components/ui/DAvatar";
import { getInbox } from "@/services/mock/inboxService";
import type { InboxMessage, InboxKind } from "@/types/inbox";
import { HighlightedRaw } from "./HighlightedRaw";
import { InboxCorrectModal } from "./InboxCorrectModal";

const WAVE = [6, 11, 16, 9, 14, 19, 12, 7, 15, 10, 17, 8, 13, 6, 11];

const KIND_META: Record<InboxKind, { ico: ReactNode; label: string; tint: string }> = {
  audio: { ico: <Microphone width={13} height={13} />, label: "Audio", tint: "bg-success-50 text-[#15803D]" },
  photo: { ico: <Picture width={13} height={13} />, label: "Fotos", tint: "bg-info-50 text-[#1D4ED8]" },
  text: { ico: <Comment width={13} height={13} />, label: "Texto", tint: "bg-slate-100 text-slate-700" },
};

type TabId = "pendientes" | "confirmados" | "descartados" | "salientes";

function initialsOf(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").replace(".", "").toUpperCase();
}

function confPill(c: number) {
  if (c >= 0.9) return { t: "Confianza alta", cls: "bg-success-50 text-[#15803D]" };
  if (c >= 0.6) return { t: "Confianza media", cls: "bg-attention-50 text-[#A16207]" };
  return { t: "Confianza baja", cls: "bg-critical-50 text-[#B91C1C]" };
}

export function ScreenInbox() {
  const [items, setItems] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("pendientes");
  const [pick, setPick] = useState<InboxMessage | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [toast, flash] = useToast();

  useEffect(() => {
    getInbox().then((d) => {
      setItems(d.items);
      setLoading(false);
    });
  }, []);

  const patch = (id: string, f: Partial<InboxMessage>) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...f } : x)));

  const confirmItem = (id: string) => {
    const it = items.find((x) => x.id === id);
    patch(id, {
      state: "confirmed",
      by: "J. Méndez",
      at: "hoy " + new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      applied: it?.parse ? [it.parse.destino] : undefined,
    });
    setPick(null);
    setNoteFor(null);
    flash("Dato confirmado y aplicado a la obra");
  };

  const discardItem = (id: string) => {
    patch(id, { state: "discarded" });
    setPick(null);
    flash("Mensaje descartado");
  };

  const confirmHighConfidence = () => {
    setItems((p) =>
      p.map((x) =>
        x.dir === "in" && x.state === "pending" && (x.conf ?? 0) >= 0.9
          ? { ...x, state: "confirmed", by: "J. Méndez" }
          : x,
      ),
    );
    flash("Confirmados los de confianza alta");
  };

  const inbound = items.filter((i) => i.dir === "in");
  const pend = inbound.filter((i) => i.state === "pending");
  const conf = inbound.filter((i) => i.state === "confirmed");
  const disc = inbound.filter((i) => i.state === "discarded");
  const out = items.filter((i) => i.dir === "out");

  const TABS: { id: TabId; label: string; list: InboxMessage[] }[] = [
    { id: "pendientes", label: "Por confirmar", list: pend },
    { id: "confirmados", label: "Confirmados", list: conf },
    { id: "descartados", label: "Descartados", list: disc },
    { id: "salientes", label: "Enviados por el bot", list: out },
  ];
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="mb-5">
          <div className="shimmer h-7 w-52 rounded-md" />
          <div className="shimmer h-4 w-96 rounded-md mt-2" />
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="shimmer h-9 w-9 rounded-lg mb-3" />
              <div className="shimmer h-6 w-14 rounded mb-2" />
              <div className="shimmer h-3 w-24 rounded" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="shimmer h-4 w-1/3 rounded mb-3" />
              <div className="shimmer h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <DPageHeader
        title="Bandeja de WhatsApp"
        subtitle={`${pend.length} mensajes esperan tu confirmación · nada se aplica a la obra sin que lo revises`}
        right={
          <>
            <DButton
              variant="secondary"
              size="sm"
              icon={<Comment width={13} height={13} />}
              onClick={() => flash("Bot conectado · +54 9 11 2034-8821")}
            >
              Estado del bot
            </DButton>
            <DButton
              variant="primary"
              size="sm"
              icon={<Check width={13} height={13} />}
              disabled={pend.length === 0}
              onClick={confirmHighConfidence}
            >
              Confirmar confianza alta
            </DButton>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile
          tone="attention"
          label="Por confirmar"
          value={String(pend.length)}
          icon={<Clock width={16} height={16} />}
          delta={pend.length ? "Requieren revisión" : "Al día"}
          deltaTone={pend.length ? "critical" : "success"}
          onClick={() => setTab("pendientes")}
        />
        <DStatTile
          tone="success"
          label="Confirmados hoy"
          value={String(conf.length)}
          icon={<Check width={16} height={16} />}
          onClick={() => setTab("confirmados")}
        />
        <DStatTile
          tone="info"
          label="Mensajes recibidos"
          value="1.284"
          icon={<Comment width={16} height={16} />}
          delta="Este mes"
        />
        <DStatTile
          tone="primary"
          label="Precisión de la IA"
          value="92"
          suffix="%"
          icon={<Sparkles width={16} height={16} />}
          delta="Sobre lo confirmado"
        />
      </div>

      <div className="flex items-start gap-3 bg-success-50 border border-[#BBF7D0] rounded-lg p-3 mb-4">
        <span className="w-8 h-8 rounded-md bg-[#25D366]/20 text-[#15803D] flex items-center justify-center flex-none">
          <Comment width={15} height={15} />
        </span>
        <div className="text-[12px] text-slate-700 leading-snug flex-1">
          <b className="text-slate-950">Acá ves todo lo que entra y sale del bot.</b> Tu equipo manda audios, fotos o
          texto por WhatsApp; la IA propone cómo cargarlo en la obra y vos <b>confirmás, corregís o descartás</b>. Ningún
          dato se aplica solo.
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 flex-wrap">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors ${
                on ? "text-primary border-primary" : "text-slate-500 border-transparent hover:text-slate-700"
              }`}
            >
              {t.label}
              <span
                className={`text-[10px] font-bold px-[6px] py-[2px] rounded-full ${
                  on ? "bg-primary-50 text-primary" : "bg-slate-100 text-slate-700"
                }`}
              >
                {t.list.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {active.list.map((m) => {
          const km = KIND_META[m.kind];
          const isOut = m.dir === "out";
          const cp = m.conf != null ? confPill(m.conf) : null;

          if (m.state === "confirmed") {
            const open = expanded === m.id;
            const chips = (m.applied || (m.parse ? [m.parse.destino] : [])).filter(Boolean);
            return (
              <div key={m.id} className="relative rounded-lg overflow-hidden border border-[#BBF7D0] bg-gradient-to-r from-success-50 to-white">
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-success" />
                <div className="pl-5 pr-4 py-3 flex items-center gap-3">
                  <div className="relative flex-none">
                    <span className="w-9 h-9 rounded-full bg-success text-white flex items-center justify-center">
                      <Check width={17} height={17} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 tnum">{m.id}</span>
                      <span className="text-[13px] font-bold text-slate-950 truncate">{m.parse?.tipo ?? "Operación"}</span>
                      <span className="text-[9px] font-bold tracking-[0.06em] uppercase bg-success text-white rounded px-[6px] py-[2px]">
                        Aplicado
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-[2px] truncate">
                      {m.from} · confirmado por <b className="text-slate-800">{m.by}</b>
                      {m.at ? " · " + m.at : ""}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-[6px] flex-none">
                    {chips.map((x) => (
                      <span key={x} className="text-[10px] font-bold text-[#15803D] bg-white border border-[#BBF7D0] rounded-full px-[8px] py-[3px]">
                        {x}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setExpanded(open ? null : m.id)}
                    className="w-8 h-8 rounded-md text-slate-500 hover:bg-white flex items-center justify-center flex-none"
                  >
                    {open ? <ChevronUp width={14} height={14} /> : <ChevronDown width={14} height={14} />}
                  </button>
                </div>

                {open && (
                  <div className="border-t border-[#BBF7D0] bg-white px-5 py-4 grid grid-cols-2 gap-5">
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Mensaje original</div>
                      <div className="text-[12px] text-slate-700 leading-relaxed italic">
                        “<HighlightedRaw text={m.raw} mapped={m.mapped} loose={m.loose} />”
                      </div>
                      {m.note && (
                        <div className="mt-3 bg-attention-50 border-l-[3px] border-accent rounded-r px-3 py-2">
                          <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-[#A16207] mb-[2px]">
                            Nota del director
                          </div>
                          <div className="text-[11px] text-slate-700 leading-snug">{m.note}</div>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Datos aplicados</div>
                      <div className="space-y-[5px]">
                        {(m.parse?.campos ?? []).map(([k, v]) => (
                          <div key={k} className="grid grid-cols-[110px_1fr] gap-2 text-[11px]">
                            <span className="text-slate-500 truncate">{k}</span>
                            <span className="font-semibold text-slate-900 truncate">{v}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          patch(m.id, { state: "pending" });
                          flash("Reabierto para revisión");
                        }}
                        className="mt-3 text-[11px] font-bold text-slate-500 hover:text-primary"
                      >
                        Revertir confirmación
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={m.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-card2 transition-shadow">
              <div className="grid grid-cols-[1fr_1px_1fr] gap-0">
                <div className="p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-none ${km.tint}`}>{km.ico}</span>
                    <span className="text-[10px] font-bold text-slate-400 tnum">{m.id}</span>
                    <span
                      className={`text-[9px] font-bold px-[6px] py-[2px] rounded ${
                        isOut ? "bg-primary-50 text-primary" : "bg-success-50 text-[#15803D]"
                      }`}
                    >
                      {isOut ? "ENVIADO" : "RECIBIDO"}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-auto">{m.time}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <DAvatar initials={initialsOf(isOut ? m.to : m.from)} size={22} />
                    <span className="text-[12px] font-bold text-slate-950">{isOut ? "Para " + m.to : m.from}</span>
                    <span className="text-[11px] text-slate-500">· {m.role}</span>
                  </div>

                  {m.kind === "audio" && (
                    <div className="flex items-center gap-2 bg-wabubble rounded-lg px-3 py-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-none">
                        <Microphone width={13} height={13} />
                      </span>
                      <div className="flex-1 flex items-center gap-[2px] h-5">
                        {WAVE.map((h, i) => (
                          <span key={i} style={{ height: h }} className="w-[2px] rounded-full bg-[#075E54]/45" />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-[#075E54] tnum flex-none">{m.dur}</span>
                    </div>
                  )}

                  {m.kind === "photo" && (
                    <div className="flex gap-2 mb-2">
                      {Array.from({ length: Math.min(4, m.photos ?? 0) }).map((_, i) => (
                        <div key={i} className="w-[52px] h-[52px] rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                          <Picture width={16} height={16} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[12px] text-slate-700 leading-relaxed italic">
                    “<HighlightedRaw text={m.raw} mapped={m.mapped} loose={m.loose} />”
                  </div>

                  {!isOut && m.kind === "audio" && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 flex-wrap">
                      <span>Transcripción automática</span>
                      {(m.mapped ?? []).length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-[3px] bg-success-50 border border-[#BBF7D0]" /> capturado
                        </span>
                      )}
                      {(m.loose ?? []).length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-[3px] bg-attention-50 border border-[#FDE68A]" /> sin capturar
                        </span>
                      )}
                    </div>
                  )}

                  {isOut && m.trigger && (
                    <div className="mt-2 inline-flex items-center gap-[6px] text-[10px] font-bold text-primary bg-primary-50 rounded px-2 py-1">
                      <Sparkles width={10} height={10} /> {m.trigger}
                    </div>
                  )}
                </div>

                <div className="bg-slate-100" />

                <div className="p-4 min-w-0 bg-slate-50/40">
                  {isOut ? (
                    <div className="h-full flex flex-col justify-center">
                      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Estado del envío</div>
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#15803D]">
                        <span className="w-6 h-6 rounded-full bg-success-50 flex items-center justify-center">
                          <Check width={12} height={12} />
                        </span>
                        Entregado en WhatsApp
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2 leading-snug">
                        Los mensajes del bot se disparan por reglas de la obra. Configurables en Configuración › Notificaciones.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-950 text-accent flex items-center justify-center flex-none">
                            <Sparkles width={12} height={12} />
                          </span>
                          <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-600">
                            Interpretación de la IA
                          </span>
                        </div>
                        {cp && (
                          <span className={`text-[9px] font-bold px-[6px] py-[3px] rounded flex-none ${cp.cls}`}>
                            {cp.t} · {Math.round((m.conf ?? 0) * 100)}%
                          </span>
                        )}
                      </div>

                      {(m.parse?.campos ?? []).length === 0 ? (
                        <div className="text-[12px] text-slate-500 italic mb-3">{m.parse?.tipo ?? "Sin dato accionable"}</div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-950">{m.parse!.tipo}</span>
                            <ArrowRight width={11} height={11} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-primary bg-primary-50 rounded px-2 py-[2px]">
                              {m.parse!.destino}
                            </span>
                          </div>
                          <div className="space-y-[5px] mb-3">
                            {m.parse!.campos.map(([k, v]) => (
                              <div key={k} className="grid grid-cols-[110px_1fr] gap-2 text-[11px]">
                                <span className="text-slate-500 truncate">{k}</span>
                                <span className="font-semibold text-slate-900 truncate">{v}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {(m.loose ?? []).length > 0 && m.state === "pending" && (
                        <div className="mb-3 border border-[#FDE68A] bg-attention-50 rounded-lg p-2">
                          <div className="flex items-center gap-[6px] mb-2">
                            <TriangleExclamation width={11} height={11} className="text-[#A16207] flex-none" />
                            <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-[#A16207]">
                              Dicho pero no capturado
                            </span>
                          </div>
                          <div className="space-y-2">
                            {m.loose!.map((l, i) => (
                              <div key={i} className="bg-white border border-[#FDE68A] rounded p-2">
                                <div className="text-[11px] text-slate-800 leading-snug italic">“{l.txt}”</div>
                                <div className="text-[10px] text-slate-500 mt-[2px]">{l.why}</div>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() =>
                                      patch(m.id, {
                                        note: ((m.note ? m.note + " " : "") + l.txt).trim(),
                                        loose: m.loose!.filter((_, k) => k !== i),
                                      })
                                    }
                                    className="text-[10px] font-bold text-primary hover:underline"
                                  >
                                    Guardar como nota
                                  </button>
                                  <button onClick={() => setPick(m)} className="text-[10px] font-bold text-primary hover:underline">
                                    Convertir en dato
                                  </button>
                                  <button
                                    onClick={() => patch(m.id, { loose: m.loose!.filter((_, k) => k !== i) })}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 ml-auto"
                                  >
                                    Ignorar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.warn && (
                        <div className="flex items-start gap-2 bg-attention-50 border border-[#FDE68A] rounded p-2 mb-3">
                          <TriangleExclamation width={11} height={11} className="text-[#A16207] mt-[2px] flex-none" />
                          <span className="text-[10px] text-slate-700 leading-snug">{m.warn}</span>
                        </div>
                      )}

                      {m.state === "pending" && (
                        <div className="mb-3">
                          {noteFor === m.id || m.note ? (
                            <div className="border-l-[3px] border-accent bg-attention-50 rounded-r p-2">
                              <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-[#A16207] mb-1">Nota libre</div>
                              <textarea
                                value={m.note ?? ""}
                                onChange={(e) => patch(m.id, { note: e.target.value })}
                                onBlur={() => setNoteFor(null)}
                                autoFocus={noteFor === m.id}
                                rows={2}
                                placeholder="Contexto, aclaraciones o cualquier cosa que no entre en los campos…"
                                className="w-full bg-white border border-[#FDE68A] rounded px-2 py-[6px] text-[11px] text-slate-800 focus:border-accent focus:outline-none resize-y min-h-[44px]"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => setNoteFor(m.id)}
                              className="w-full flex items-center justify-center gap-[6px] text-[11px] font-bold text-slate-500 hover:text-primary border border-dashed border-slate-300 hover:border-primary rounded-lg py-[7px] transition-colors"
                            >
                              <Pencil width={11} height={11} /> Agregar nota libre
                            </button>
                          )}
                        </div>
                      )}

                      {m.state === "pending" ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <DButton variant="primary" size="sm" icon={<Check width={12} height={12} />} onClick={() => confirmItem(m.id)}>
                            Confirmar
                          </DButton>
                          <DButton variant="secondary" size="sm" icon={<Pencil width={12} height={12} />} onClick={() => setPick(m)}>
                            Corregir
                          </DButton>
                          <button onClick={() => discardItem(m.id)} className="text-[11px] font-bold text-slate-500 hover:text-[#B91C1C] px-2 py-[6px]">
                            Descartar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">Descartado · no impactó en la obra</span>
                          <button onClick={() => patch(m.id, { state: "pending" })} className="text-[11px] font-bold text-primary hover:underline">
                            Recuperar
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {active.list.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-[13px] border border-dashed border-slate-200 rounded-lg flex flex-col items-center gap-2">
            <span className="w-12 h-12 rounded-full bg-success-50 text-[#15803D] flex items-center justify-center">
              <Check width={22} height={22} />
            </span>
            {tab === "pendientes" ? "No hay mensajes esperando confirmación." : "Nada por acá."}
          </div>
        )}
      </div>

      {pick && (
        <InboxCorrectModal
          msg={pick}
          onClose={() => setPick(null)}
          onSave={(res) => {
            patch(pick.id, { parse: { ...(pick.parse ?? { tipo: res.tipo, destino: "—", campos: [] }), tipo: res.tipo, campos: res.campos }, note: res.note, loose: [] });
            confirmItem(pick.id);
          }}
        />
      )}

      <DashToast msg={toast} />
    </>
  );
}
