"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  Envelope,
  CircleExclamation,
  Box,
  Car,
  CircleDollar,
  Check,
  Xmark,
} from "@gravity-ui/icons";
import { getNotificaciones } from "@/services/mock/notificacionesService";
import type { NotifItem, NotifKind } from "./data/notificaciones";

const KIND_ICON: Record<NotifKind, ReactNode> = {
  invite: <Envelope width={13} height={13} />,
  critical: <CircleExclamation width={13} height={13} />,
  order: <Box width={13} height={13} />,
  delivery: <Car width={13} height={13} />,
  budget: <CircleDollar width={13} height={13} />,
  activity: <Check width={13} height={13} />,
};

const KIND_TINT: Record<NotifKind, string> = {
  invite: "bg-primary-50 text-primary",
  critical: "bg-critical-50 text-[#B91C1C]",
  order: "bg-attention-50 text-[#A16207]",
  delivery: "bg-info-50 text-[#1D4ED8]",
  budget: "bg-primary-50 text-primary",
  activity: "bg-success-50 text-[#15803D]",
};

export function ItemIcon({ n, size = 34 }: { n: NotifItem; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`rounded-lg ${n.tint || KIND_TINT[n.kind]} flex items-center justify-center flex-none`}
    >
      {KIND_ICON[n.kind]}
    </span>
  );
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNotificaciones().then((d) => { setItems(d.items); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!open) return;
    const k = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", k);
    return () => document.removeEventListener("mousedown", k);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const toggleOpen = () => setOpen((o) => !o);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleOpen}
        className={`w-9 h-9 rounded-md border bg-white flex items-center justify-center relative transition-colors ${
          open ? "border-primary text-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"
        }`}
      >
        <Bell width={15} height={15} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-[3px] rounded-full bg-critical text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[42px] w-[330px] bg-white rounded-xl border border-slate-200 shadow-pop overflow-hidden z-[80] animate-modal-pop">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="text-[13px] font-bold text-slate-950">Notificaciones</div>
            <button
              onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
              disabled={unread === 0}
              className={`text-[10px] font-semibold flex items-center gap-1 ${unread === 0 ? "text-slate-400" : "text-primary hover:text-primary-700"}`}
            >
              <Check width={12} height={12} /> Marcar todas
            </button>
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-start"><div className="shimmer w-[34px] h-[34px] rounded-lg flex-none" /><div className="flex-1 space-y-2"><div className="shimmer h-4 w-3/4 rounded" /><div className="shimmer h-3 w-1/2 rounded" /></div></div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-slate-500">No tenés notificaciones.</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors ${n.read ? "" : "bg-info-50/40"}`}>
                  <ItemIcon n={n} />
                  <div className="flex-1 min-w-0">
                    {n.kind === "invite" ? (
                      <>
                        <div className="text-[13px] leading-snug text-slate-700">
                          <b className="text-slate-950">{n.by}</b> <b className="text-primary">{n.role}</b> {(n.text ?? "").toLowerCase()} <b className="text-slate-950">{n.obra}</b>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, resolved: "accepted" } : x))}
                            className="flex-1 text-[11px] font-bold text-white bg-primary hover:bg-primary-700 rounded-md px-2 py-[5px] flex items-center justify-center gap-1"
                          >
                            <Check width={12} height={12} /> Aceptar
                          </button>
                          <button
                            onClick={() => setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, resolved: "rejected" } : x))}
                            className="flex-1 text-[11px] font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-md px-2 py-[5px] flex items-center justify-center gap-1"
                          >
                            <Xmark width={12} height={12} /> Rechazar
                          </button>
                        </div>
                        {n.resolved && (
                          <div className="mt-2 text-[11px] font-semibold text-success">Invitación {n.resolved === "accepted" ? "aceptada" : "rechazada"} ✅</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-[12px] font-bold text-slate-950 leading-snug">{n.title}</div>
                        <div className="text-[11px] text-slate-500 leading-snug mt-[1px]">{n.text ?? ""}</div>
                      </>
                    )}
                    <div className="text-[10px] text-slate-400 mt-[4px]">{n.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}