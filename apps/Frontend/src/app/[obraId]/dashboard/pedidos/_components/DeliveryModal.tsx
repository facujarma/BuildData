"use client";

import { useState } from "react";
import { Check, Xmark } from "@gravity-ui/icons";
import type { PedidoItem } from "../data";
import { todayISO } from "@/lib/format";

interface DeliveryData {
  date: string;
  time: string;
  loc: string;
  receiver: string;
  doc: string;
}

interface Props {
  order: PedidoItem;
  onClose: () => void;
  onSave: (delivery: DeliveryData) => void;
}

export function DeliveryModal({ order, onClose, onSave }: Props) {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [loc, setLoc] = useState("");
  const [receiver, setReceiver] = useState("");
  const [doc, setDoc] = useState("");

  const canSave = loc.trim() && receiver.trim();

  const submit = () => {
    if (!canSave) return;
    onSave({ date: date || today, time, loc: loc.trim(), receiver: receiver.trim(), doc: doc.trim() });
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[480px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-success-50 text-[#15803D] flex items-center justify-center">
              <Check width={16} height={16} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">Registrar entrega</div>
              <div className="text-[11px] text-slate-500">{order.id.slice(0, 8)} · {order.mat}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center">
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Fecha de recepción</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
              <span className="text-[10px] text-slate-400">Vacío = hoy</span>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Hora</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>
          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Lugar de entrega*</span>
            <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Ej: Depósito A · acceso lateral"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Recibido por*</span>
              <input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Nombre y apellido"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-bold text-slate-700">Documento</span>
              <input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="DNI 28.114.502"
                className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
            </label>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
          <button onClick={submit} disabled={!canSave}
            className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${
              canSave ? "bg-success hover:bg-[#15803D] text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}>
            Confirmar entrega <Check width={14} height={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
