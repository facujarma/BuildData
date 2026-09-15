"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Microphone,
  Picture,
  PaperPlane,
  Check,
  Xmark,
  ArrowRotateRight,
  TriangleExclamation,
  CircleQuestion,
  ArrowRight,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import DButton from "@/components/ui/Button";
import { getInbox } from "@/services/mock/inboxService";
import type { InboxMessage, InboxKind } from "@/types/inbox";

const KIND_ICON: Record<InboxKind, ReactNode> = {
  audio: <Microphone width={14} height={14} />,
  photo: <Picture width={14} height={14} />,
  text: <CircleQuestion width={14} height={14} />,
};

function StateChip({ state }: { state: InboxMessage["state"] }) {
  const map: Record<InboxMessage["state"], { label: string; cls: string }> = {
    pending: { label: "Por procesar", cls: "bg-attention-50 text-[#A16207]" },
    confirmed: { label: "Procesada", cls: "bg-success-50 text-[#15803D]" },
    discarded: { label: "Descartada", cls: "bg-slate-100 text-slate-500" },
    sent: { label: "Enviada", cls: "bg-info-50 text-info" },
  };
  const c = map[state];
  return <span className={`text-[9px] font-bold px-[6px] py-[1px] rounded-full flex-none ${c.cls}`}>{c.label}</span>;
}

type Tab = "pendientes" | "resueltas" | "todas";

export function ScreenInbox() {
  const [tab, setTab] = useState<Tab>("pendientes");
  const [items, setItems] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getInbox().then((d) => { setItems(d.items); setSel(d.items[0]?.id ?? null); setLoading(false); });
  }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const list = items
    .filter((m) => (tab === "pendientes" ? m.state === "pending" : tab === "resueltas" ? m.state !== "pending" : true))
    .sort((a, b) => (a.state === "pending" ? -1 : b.state === "pending" ? 1 : a.time.localeCompare(b.time)));

  const count = (s: "pending" | "resolved") =>
    items.filter((m) => (s === "pending" ? m.state === "pending" : m.state !== "pending")).length;

  const selected = items.find((m) => m.id === sel) ?? list[0] ?? null;

  const apply = (m: InboxMessage, state: InboxMessage["state"]) => {
    const applied = state === "confirmed" ? m.applied ?? (m.parse ? [`${m.parse.tipo} aplicada a ${m.parse.destino}`] : undefined) : undefined;
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, state, applied } : x)));
    flash(state === "confirmed" ? `Operación aplicada · ${m.id}` : state === "discarded" ? `${m.id} descartado` : `${m.id} reabierto`);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DPageHeader
        title="Bandeja de WhatsApp"
        subtitle={`${items.filter((m) => m.state === "pending").length} mensajes por procesar · la IA los clasifica y arma la operación, vos la confirmás`}
      />

      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-[3px] w-fit mb-4">
        {([["pendientes", `Sin procesar · ${count("pending")}`], ["resueltas", `Resueltas · ${count("resolved")}`], ["todas", `Todas · ${items.length}`]] as [Tab, string][]).map(([t, l]) => {
          const on = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`inline-flex items-center gap-2 text-[12px] font-bold px-[14px] py-[7px] rounded-md transition-colors ${on ? "bg-white text-slate-950 shadow-card" : "text-slate-600 hover:text-slate-950"}`}>
              {l}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex gap-3 flex-1">
          <div className="w-[340px] flex-none space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white border border-slate-200 rounded-lg p-3"><div className="shimmer h-4 w-24 rounded mb-2" /><div className="shimmer h-3 w-full rounded" /></div>)}
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4"><div className="shimmer h-5 w-40 rounded mb-3" /><div className="shimmer h-4 w-full rounded" /></div>
        </div>
      ) : (
        <div className="flex gap-3 flex-1 min-h-0">
          <div className="w-[340px] flex-none overflow-y-auto space-y-2 pr-1 pb-1">
            {list.length === 0 ? (
              <div className="text-center text-slate-500 py-10 text-[13px] border border-dashed border-slate-200 rounded-lg">Nada por acá.</div>
            ) : (
              list.map((m) => {
                const on = selected?.id === m.id;
                return (
                  <button key={m.id} onClick={() => setSel(m.id)}
                    className={`w-full text-left bg-white border rounded-lg p-3 transition-all ${on ? "border-primary ring-1 ring-primary/20" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center ${m.dir === "out" ? "bg-info-50 text-info" : m.kind === "audio" ? "bg-primary-50 text-primary" : m.kind === "photo" ? "bg-success-50 text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>
                        {m.dir === "out" ? <PaperPlane width={12} height={12} /> : KIND_ICON[m.kind]}
                      </span>
                      <span className="text-[12px] font-bold text-slate-950 flex-1 truncate">{m.from ?? m.to}</span>
                      <StateChip state={m.state} />
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 leading-snug">{m.raw}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>{m.id} · {m.role}</span><span>{m.time}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selected && (
            <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected.dir === "out" ? "bg-info-50 text-info" : selected.kind === "audio" ? "bg-primary-50 text-primary" : selected.kind === "photo" ? "bg-success-50 text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>
                  {selected.dir === "out" ? <PaperPlane width={15} height={15} /> : KIND_ICON[selected.kind]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-950">{selected.from ?? `Para ${selected.to}`}</div>
                  <div className="text-[11px] text-slate-500">{selected.role} · {KIND_LABEL[selected.kind]} · {selected.id} · {selected.time}</div>
                </div>
                <StateChip state={selected.state} />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className={`rounded-lg p-3 ${selected.dir === "out" ? "bg-wabg/60 border border-wabg" : "bg-wabubble border border-wabg"} text-[13px] text-slate-800 leading-relaxed`}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{selected.dir === "out" ? "Mensaje saliente" : KIND_LABEL[selected.kind]}</div>
                  {selected.dur && <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><Microphone width={12} height={12} /> {selected.dur}</div>}
                  {selected.photos && <div className="text-[11px] text-slate-500 mb-1">{selected.photos} imágenes</div>}
                  {selected.raw}
                </div>

                {selected.conf !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[5px] rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${selected.conf >= 0.85 ? "bg-success" : selected.conf >= 0.6 ? "bg-accent" : "bg-critical"}`} style={{ width: `${Math.round(selected.conf * 100)}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">{Math.round(selected.conf * 100)}% confianza</span>
                  </div>
                )}

                {selected.warn && (
                  <div className="flex items-start gap-2 bg-attention-50 border border-[#FDE68A] rounded-lg p-2 text-[12px] text-[#92400E]">
                    <TriangleExclamation width={14} height={14} className="flex-none mt-[2px]" />
                    <span>{selected.warn}</span>
                  </div>
                )}

                {selected.parse && selected.parse.tipo !== "Sin dato accionable" && (
                  <div>
                    <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Operación propuesta</div>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 bg-primary-50 px-3 py-2">
                        <span className="text-[12px] font-bold text-primary flex-1">{selected.parse.tipo}</span>
                        <ArrowRight width={13} height={13} className="text-primary-300" />
                        <span className="text-[11px] font-semibold text-primary">{selected.parse.destino}</span>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
                        {selected.parse.campos.map(([k, v]) => (
                          <div key={k} className="px-3 py-2">
                            <div className="text-[10px] tracking-wide uppercase font-bold text-slate-400">{k}</div>
                            <div className="text-[12px] font-semibold text-slate-950">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selected.loose && selected.loose.length > 0 && (
                  <div>
                    <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Fragmentos sueltos</div>
                    <div className="space-y-2">
                      {selected.loose.map((f, i) => (
                        <div key={i} className="border border-slate-200 rounded-lg p-3">
                          <div className="text-[12px] text-slate-700 italic">“{f.txt}”</div>
                          <div className="text-[11px] text-slate-500 mt-1">{f.why}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.applied && selected.applied.length > 0 && (
                  <div className="bg-success-50 border border-[#BBF7D0] rounded-lg p-2 space-y-1">
                    {selected.applied.map((a) => (
                      <div key={a} className="flex items-center gap-2 text-[12px] font-semibold text-[#15803D]">
                        <Check width={13} height={13} /> {a}
                      </div>
                    ))}
                  </div>
                )}

                {selected.by && (
                  <div className="text-[11px] text-slate-400">Procesada por <b className="text-slate-600">{selected.by}</b> · {selected.at}</div>
                )}
              </div>

              <ActionBar m={selected} apply={apply} />
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate-950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop">
          <Check width={14} height={14} className="text-success" /> {toast}
        </div>
      )}
    </div>
  );
}

const KIND_LABEL: Record<InboxKind, string> = {
  audio: "Audio",
  photo: "Fotos",
  text: "Texto",
};

function ActionBar({ m, apply }: { m: InboxMessage; apply: (m: InboxMessage, s: InboxMessage["state"]) => void }) {
  if (m.state === "pending") {
    return (
      <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2 justify-end">
        <DButton variant="outline" icon={<Xmark width={13} height={13} />} onClick={() => apply(m, "discarded")}>Descartar</DButton>
        <DButton icon={<Check width={13} height={13} />} onClick={() => apply(m, "confirmed")}>Confirmar y aplicar</DButton>
      </div>
    );
  }
  if (m.state === "confirmed") {
    return (
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <DButton variant="ghost" icon={<ArrowRotateRight width={13} height={13} />} onClick={() => apply(m, "pending")}>Reabrir</DButton>
        <DButton variant="outline" onClick={() => apply(m, "pending")}>Ver en sección</DButton>
      </div>
    );
  }
  if (m.state === "discarded") {
    return (
      <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2">
        <DButton variant="outline" icon={<ArrowRotateRight width={13} height={13} />} onClick={() => apply(m, "pending")}>Reabrir</DButton>
      </div>
    );
  }
  return (
    <div className="px-4 py-3 border-t border-slate-100">
      <div className="text-[11px] text-slate-500">{m.trigger}</div>
    </div>
  );
}