"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Sparkles, Xmark } from "@gravity-ui/icons";
import type { InboxMessage } from "@/types/inbox";

interface Result {
  tipo: string;
  campos: [string, string][];
  note: string;
}

interface Props {
  msg: InboxMessage;
  onClose: () => void;
  onSave: (res: Result) => void;
}

const TIPOS = [
  "Avance de tarea",
  "Avance con foto",
  "Alerta",
  "Pedido de material",
  "Entrega de material",
  "Cierre de jornada",
  "Sin dato accionable",
];

const INPUT_CLS =
  "bg-white border border-slate-200 rounded-md px-3 py-[7px] text-[12px] focus:border-primary focus:outline-none";

export function InboxCorrectModal({ msg, onClose, onSave }: Props) {
  const [fields, setFields] = useState<[string, string][]>(msg.parse?.campos ?? []);
  const [tipo, setTipo] = useState(msg.parse?.tipo ?? "Sin dato accionable");
  const [note, setNote] = useState(msg.note ?? "");
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const addField = () => {
    if (!newKey.trim()) return;
    setFields((p) => [...p, [newKey.trim(), newVal.trim()]]);
    setNewKey("");
    setNewVal("");
  };
  const delField = (i: number) => setFields((p) => p.filter((_, k) => k !== i));
  const setF = (i: number, v: string) =>
    setFields((p) => p.map((f, idx) => (idx === i ? [f[0], v] : f)));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[560px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-950 text-accent flex items-center justify-center">
              <Pencil width={16} height={16} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">Corregir interpretación</div>
              <div className="text-[11px] text-slate-500">{msg.id} · {msg.from ?? msg.to}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center"
          >
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">Mensaje original</div>
            <div className="text-[12px] text-slate-700 italic leading-snug">“{msg.raw}”</div>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Tipo de dato</span>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
            >
              {TIPOS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>

          {fields.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">Campos detectados</div>
              <div className="space-y-2">
                {fields.map(([k, v], i) => (
                  <div key={k + i} className="grid grid-cols-[130px_1fr_28px] gap-2 items-center">
                    <span className="text-[11px] font-bold text-slate-600 truncate">{k}</span>
                    <input value={v} onChange={(e) => setF(i, e.target.value)} className={INPUT_CLS} />
                    <button
                      onClick={() => delField(i)}
                      className="w-7 h-7 rounded-md text-slate-400 hover:text-[#B91C1C] hover:bg-slate-100 flex items-center justify-center"
                      title="Quitar campo"
                    >
                      <Xmark width={12} height={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 border border-dashed border-slate-300 rounded-lg p-2">
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">
                  Agregar un campo propio
                </div>
                <div className="grid grid-cols-[130px_1fr_auto] gap-2">
                  <input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Nombre"
                    onKeyDown={(e) => e.key === "Enter" && addField()}
                    className="bg-white border border-slate-200 rounded-md px-2 py-[7px] text-[12px] focus:border-primary focus:outline-none"
                  />
                  <input
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    placeholder="Valor"
                    onKeyDown={(e) => e.key === "Enter" && addField()}
                    className="bg-white border border-slate-200 rounded-md px-2 py-[7px] text-[12px] focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={addField}
                    disabled={!newKey.trim()}
                    className={`px-3 rounded-md text-[12px] font-bold ${
                      newKey.trim() ? "bg-primary text-white hover:bg-primary-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          )}

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">
              Nota libre <span className="font-normal text-slate-500">— lo que no entra en ningún campo</span>
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ej: el camión rompió el cordón al entrar, avisar al encargado del consorcio."
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[66px]"
            />
          </label>

          {(msg.loose ?? []).length > 0 && (
            <div className="bg-attention-50 border border-[#FDE68A] rounded-lg p-3">
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-[#A16207] mb-2">
                Fragmentos sin capturar
              </div>
              <div className="space-y-2">
                {msg.loose!.map((l, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[11px] text-slate-700 italic leading-snug flex-1">“{l.txt}”</span>
                    <button
                      onClick={() => setNote((p) => (p ? p + " " : "") + l.txt)}
                      className="text-[10px] font-bold text-primary hover:underline flex-none"
                    >
                      A la nota
                    </button>
                    <button
                      onClick={() => {
                        setNewKey("");
                        setNewVal(l.txt);
                      }}
                      className="text-[10px] font-bold text-primary hover:underline flex-none"
                    >
                      A un campo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 bg-primary-50 border border-primary/15 rounded-lg p-3">
            <Sparkles width={12} height={12} className="text-primary mt-[2px] flex-none" />
            <span className="text-[11px] text-slate-700 leading-snug">
              Tus correcciones entrenan al bot: la próxima vez que alguien mande un mensaje parecido, va a interpretarlo mejor.
            </span>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">
            Cancelar
          </button>
          <button
            onClick={() => onSave({ tipo, campos: fields, note })}
            className="inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] bg-primary hover:bg-primary-700 text-white"
          >
            <Check width={14} height={14} /> Guardar y confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
