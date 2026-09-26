"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  Check,
  Clock,
  Comment,
  Microphone,
  Picture,
  Sparkles,
  TriangleExclamation,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { DStatTile } from "../../_components/DStatTile";
import { DashToast, useToast } from "../../_components/useToast";
import DButton from "@/components/ui/Button";
import { DAvatar } from "@/components/ui/DAvatar";
import {
  aprobarOperacion,
  getInbox,
  rechazarOperacion,
  reintentarOperacion,
} from "@/services/mensajesService";
import type {
  InboxMessage,
  InboxKind,
  Operacion,
  OperacionEstado,
} from "@/types/inbox";

const KIND_META: Record<InboxKind, { ico: ReactNode; label: string; tint: string }> = {
  audio: { ico: <Microphone width={13} height={13} />, label: "Audio", tint: "bg-success-50 text-[#15803D]" },
  photo: { ico: <Picture width={13} height={13} />, label: "Fotos", tint: "bg-info-50 text-[#1D4ED8]" },
  text: { ico: <Comment width={13} height={13} />, label: "Texto", tint: "bg-slate-100 text-slate-700" },
};

const ESTADO_META: Record<OperacionEstado, { label: string; cls: string }> = {
  pendiente: { label: "Por aprobar", cls: "bg-attention-50 text-[#A16207]" },
  ejecutando: { label: "Ejecutando", cls: "bg-info-50 text-[#1D4ED8]" },
  ejecutada: { label: "Ejecutada", cls: "bg-success-50 text-[#15803D]" },
  rechazada: { label: "Rechazada", cls: "bg-slate-100 text-slate-600" },
  error: { label: "Error", cls: "bg-critical-50 text-[#B91C1C]" },
};

type TabId = "pendientes" | "ejecutadas" | "rechazadas" | "errores";

function initialsOf(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").replace(".", "").toUpperCase();
}

function confPill(c: number) {
  if (c >= 0.9) return { t: "Confianza alta", cls: "bg-success-50 text-[#15803D]" };
  if (c >= 0.6) return { t: "Confianza media", cls: "bg-attention-50 text-[#A16207]" };
  return { t: "Confianza baja", cls: "bg-critical-50 text-[#B91C1C]" };
}

function operacionesPendientes(m: InboxMessage): Operacion[] {
  return m.operaciones.filter(
    (o) => o.estado === "pendiente" || o.estado === "ejecutando",
  );
}

function OperacionCard({
  op,
  busy,
  onAprobar,
  onRechazar,
  onReintentar,
}: {
  op: Operacion;
  busy: boolean;
  onAprobar: () => void;
  onRechazar: () => void;
  onReintentar: () => void;
}) {
  const em = ESTADO_META[op.estado];
  const cp = typeof op.confianza === "number" ? confPill(op.confianza) : null;
  const pendiente = op.estado === "pendiente" || op.estado === "ejecutando";

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={`text-[9px] font-bold px-[6px] py-[2px] rounded ${em.cls}`}>
          {em.label.toUpperCase()}
        </span>
        {cp && (
          <span className={`text-[9px] font-bold px-[6px] py-[2px] rounded ${cp.cls}`}>
            {cp.t} · {Math.round((op.confianza ?? 0) * 100)}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[11px] font-bold text-slate-950">{op.tipo}</span>
        <span className="text-[10px] font-bold text-primary bg-primary-50 rounded px-2 py-[2px]">
          {op.destino}
        </span>
      </div>

      {(op.campos ?? []).length > 0 && (
        <div className="space-y-[5px] mb-2">
          {op.campos.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-2 text-[11px]">
              <span className="text-slate-500 truncate">{k}</span>
              <span className="font-semibold text-slate-900 truncate">{v}</span>
            </div>
          ))}
        </div>
      )}

      {op.errorDetalle && (
        <div className="flex items-start gap-2 bg-attention-50 border border-[#FDE68A] rounded p-2 mb-2">
          <TriangleExclamation width={11} height={11} className="text-[#A16207] mt-[2px] flex-none" />
          <span className="text-[10px] text-slate-700 leading-snug">{op.errorDetalle}</span>
        </div>
      )}

      {pendiente && (
        <div className="flex items-center gap-2 flex-wrap">
          <DButton
            variant="primary"
            size="sm"
            icon={<Check width={12} height={12} />}
            disabled={busy}
            onClick={onAprobar}
          >
            {op.estado === "ejecutando" ? "Ejecutando…" : "Aprobar"}
          </DButton>
          <button
            onClick={onRechazar}
            disabled={busy}
            className="text-[11px] font-bold text-slate-500 hover:text-[#B91C1C] px-2 py-[6px] disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}

      {op.estado === "error" && (
        <div className="flex items-center gap-2 flex-wrap">
          <DButton
            variant="primary"
            size="sm"
            icon={<Check width={12} height={12} />}
            disabled={busy}
            onClick={onReintentar}
          >
            Reintentar
          </DButton>
          <button
            onClick={onRechazar}
            disabled={busy}
            className="text-[11px] font-bold text-slate-500 hover:text-[#B91C1C] px-2 py-[6px] disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}

export function ScreenInbox() {
  const { obraId } = useParams<{ obraId: string }>();
  const [items, setItems] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("pendientes");
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [toast, flash] = useToast();

  const load = useCallback(async () => {
    try {
      const d = await getInbox(obraId);
      setItems(d.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    let cancelled = false;
    getInbox(obraId)
      .then((d) => {
        if (!cancelled) setItems(d.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [obraId]);

  const markBusy = (id: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const run = async (id: string, accion: () => Promise<void>, ok: string) => {
    markBusy(id, true);
    try {
      await accion();
      await load();
      flash(ok);
    } catch (error) {
      flash(error instanceof Error ? error.message : "No se pudo completar la acción");
    } finally {
      markBusy(id, false);
    }
  };

  const aprobar = (op: Operacion) =>
    run(op.id, () => aprobarOperacion(op.id), "Operación aprobada y ejecutada");
  const rechazar = (op: Operacion) =>
    run(op.id, () => rechazarOperacion(op.id), "Operación rechazada");
  const reintentar = (op: Operacion) =>
    run(op.id, () => reintentarOperacion(op.id), "Operación reintentada");

  const aprobarAltaConfianza = async () => {
    const pendientes = items
      .flatMap(operacionesPendientes)
      .filter((o) => (o.confianza ?? 0) >= 0.9);
    if (pendientes.length === 0) return;
    for (const op of pendientes) {
      markBusy(op.id, true);
      try {
        await aprobarOperacion(op.id);
      } catch {
        // sigue con el resto
      } finally {
        markBusy(op.id, false);
      }
    }
    await load();
    flash(`Aprobadas ${pendientes.length} operaciones de confianza alta`);
  };

  const porEstado = (state: InboxMessage["state"]) =>
    items.filter((m) => m.state === state);

  const TABS: { id: TabId; label: string; list: InboxMessage[] }[] = [
    { id: "pendientes", label: "Por aprobar", list: porEstado("pending") },
    { id: "ejecutadas", label: "Ejecutadas", list: porEstado("confirmed") },
    { id: "rechazadas", label: "Rechazadas", list: porEstado("discarded") },
    { id: "errores", label: "Con error", list: porEstado("error") },
  ];
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  const totalPendientes = TABS[0].list.reduce(
    (n, m) => n + operacionesPendientes(m).length,
    0,
  );
  const altaConfianza = TABS[0].list
    .flatMap(operacionesPendientes)
    .filter((o) => (o.confianza ?? 0) >= 0.9).length;

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
        subtitle={`${totalPendientes} operaciones esperan tu aprobación · el bot registra pero no ejecuta solo`}
        right={
          <DButton
            variant="primary"
            size="sm"
            icon={<Check width={13} height={13} />}
            disabled={altaConfianza === 0}
            onClick={aprobarAltaConfianza}
          >
            Aprobar confianza alta
          </DButton>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile
          tone="attention"
          label="Por aprobar"
          value={String(totalPendientes)}
          icon={<Clock width={16} height={16} />}
          delta={totalPendientes ? "Requieren revisión" : "Al día"}
          deltaTone={totalPendientes ? "critical" : "success"}
          onClick={() => setTab("pendientes")}
        />
        <DStatTile
          tone="success"
          label="Ejecutadas"
          value={String(TABS[1].list.length)}
          icon={<Check width={16} height={16} />}
          onClick={() => setTab("ejecutadas")}
        />
        <DStatTile
          tone="info"
          label="Rechazadas"
          value={String(TABS[2].list.length)}
          icon={<Comment width={16} height={16} />}
          onClick={() => setTab("rechazadas")}
        />
        <DStatTile
          tone="primary"
          label="Con error"
          value={String(TABS[3].list.length)}
          icon={<TriangleExclamation width={16} height={16} />}
          onClick={() => setTab("errores")}
        />
      </div>

      <div className="flex items-start gap-3 bg-success-50 border border-[#BBF7D0] rounded-lg p-3 mb-4">
        <span className="w-8 h-8 rounded-md bg-[#25D366]/20 text-[#15803D] flex items-center justify-center flex-none">
          <Comment width={15} height={15} />
        </span>
        <div className="text-[12px] text-slate-700 leading-snug flex-1">
          <b className="text-slate-950">El bot registra lo que manda el equipo.</b> Cada operación queda
          acá hasta que la <b>apruebes o rechaces</b>. Las tareas y reportes se guardan solos; los
          pedidos, gastos, stock y retrasos esperan tu revisión.
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
          return (
            <div
              key={m.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-card2 transition-shadow"
            >
              <div className="grid grid-cols-[1fr_1px_1fr] gap-0">
                <div className="p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-none ${km.tint}`}>
                      {km.ico}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 tnum">{m.shortId}</span>
                    <span className="text-[9px] font-bold px-[6px] py-[2px] rounded bg-success-50 text-[#15803D]">
                      RECIBIDO
                    </span>
                    <span className="text-[11px] text-slate-500 ml-auto">{m.time}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <DAvatar initials={initialsOf(m.from)} size={22} />
                    <span className="text-[12px] font-bold text-slate-950">{m.from}</span>
                    <span className="text-[11px] text-slate-500">· {m.role}</span>
                  </div>

                  <div className="text-[12px] text-slate-700 leading-relaxed italic">“{m.raw}”</div>
                </div>

                <div className="bg-slate-100" />

                <div className="p-4 min-w-0 bg-slate-50/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-md bg-slate-950 text-accent flex items-center justify-center flex-none">
                      <Sparkles width={12} height={12} />
                    </span>
                    <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-600">
                      Operaciones
                    </span>
                  </div>

                  {m.operaciones.length === 0 ? (
                    <div className="text-[12px] text-slate-500 italic">
                      Sin operaciones: es una nota guardada.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {m.operaciones.map((op) => (
                        <OperacionCard
                          key={op.id}
                          op={op}
                          busy={busy.has(op.id)}
                          onAprobar={() => aprobar(op)}
                          onRechazar={() => rechazar(op)}
                          onReintentar={() => reintentar(op)}
                        />
                      ))}
                    </div>
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
            {tab === "pendientes" ? "No hay operaciones esperando aprobación." : "Nada por acá."}
          </div>
        )}
      </div>

      <DashToast msg={toast} />
    </>
  );
}
