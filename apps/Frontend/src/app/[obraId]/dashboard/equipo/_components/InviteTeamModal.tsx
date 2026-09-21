"use client";

import { useState, useEffect, useCallback } from "react";
import { Xmark, Check, ArrowRight, ChevronRight, Persons, Comment } from "@gravity-ui/icons";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { ROLES } from "../data";

interface InviteTeamModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: unknown) => void;
}

export function InviteTeamModal({ open, onClose, onSave }: InviteTeamModalProps) {
  const [mode, setMode] = useState<"miembro" | "obrero" | null>(null);
  const [m, setM] = useState({ email: "", nombre: "", rol: "Sin asignar" });
  const [o, setO] = useState({ nombre: "", tel: "" });
  const [link, setLink] = useState<string | null>(null);

  const reset = useCallback(() => {
    setMode(null);
    setM({ email: "", nombre: "", rol: "Sin asignar" });
    setO({ nombre: "", tel: "" });
    setLink(null);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, close]);

  if (!open) return null;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim());
  const obreroOk = o.nombre.trim().length >= 2 && o.tel.trim().length >= 6;

  const genLink = () => {
    if (!obreroOk) return;
    let h = 0;
    const s = o.nombre + o.tel + Date.now();
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    setLink("wa.me/buildata/ob-" + h.toString(36).slice(0, 8));
  };

  const saveMiembro = () => {
    onSave({ mode: "miembro", email: m.email.trim(), name: m.nombre.trim(), role: m.rol });
    close();
  };

  const saveObrero = () => {
    onSave({ mode: "obrero", name: o.nombre.trim(), phone: o.tel.trim(), link });
    close();
  };

  return (
    <div onClick={close} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[500px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            {mode && (
              <button
                onClick={() => { setMode(null); setLink(null); }}
                className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <ChevronRight width={15} height={15} className="rotate-180" />
              </button>
            )}
            <div className="w-9 h-9 rounded-md bg-success-50 text-[#15803D] flex items-center justify-center"><Persons width={16} height={16} /></div>
            <div className="text-[15px] font-extrabold display-tight">
              {mode === "miembro" ? "Nuevo miembro" : mode === "obrero" ? "Invitar obrero" : "Invitar al equipo"}
            </div>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center"><Xmark width={16} height={16} /></button>
        </div>

        {!mode && (
          <div className="p-5 space-y-3">
            <button onClick={() => setMode("miembro")} className="w-full text-left border border-slate-200 rounded-lg p-4 hover:border-primary hover:shadow-card2 transition-all flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-none"><Persons width={18} height={18} /></span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold text-slate-950">Miembro de BuildData</span>
                <span className="block text-[12px] text-slate-500">Accede a la app para ver o editar la obra. Se invita por email y <b>ya debe tener una cuenta en BuildData.</b></span>
              </span>
            </button>
            <button onClick={() => setMode("obrero")} className="w-full text-left border border-slate-200 rounded-lg p-4 hover:border-primary hover:shadow-card2 transition-all flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-[#25D366]/15 text-[#15803D] flex items-center justify-center flex-none"><Comment width={18} height={18} /></span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold text-slate-950">Obrero por WhatsApp</span>
                <span className="block text-[12px] text-slate-500">Solo reporta avances por chat, sin cuenta ni app. Link individual.</span>
              </span>
            </button>
          </div>
        )}

        {mode === "miembro" && (
          <>
            <div className="p-6 space-y-4 overflow-y-auto">
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate-700">Email*</span>
                <input
                  value={m.email}
                  onChange={(e) => setM({ ...m, email: e.target.value })}
                  type="email"
                  placeholder="nombre@empresa.com"
                  className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">La persona ya debe tener una cuenta en BuildData con ese email.</span>
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate-700">Nombre</span>
                <input
                  value={m.nombre}
                  onChange={(e) => setM({ ...m, nombre: e.target.value })}
                  placeholder="Ej: Marta Robles"
                  className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate-700">Rol</span>
                <select
                  value={m.rol}
                  onChange={(e) => setM({ ...m, rol: e.target.value })}
                  className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
                >
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <div className="text-[11px] text-slate-500 leading-snug">Le llega una invitación por email con el rol elegido. Si no tiene cuenta, se crea al aceptar.</div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 flex-none">
              <button onClick={close} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
              <button
                onClick={saveMiembro}
                disabled={!emailOk}
                className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${emailOk ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`}
              >
                Enviar invitación <Check width={14} height={14} />
              </button>
            </div>
          </>
        )}

        {mode === "obrero" && (
          <>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-start gap-3 bg-[#25D366]/[0.08] border border-[#25D366]/25 rounded-lg p-3">
                <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-none"><Comment width={13} height={13} /></div>
                <div className="text-[12px] text-slate-700 leading-snug">El obrero no necesita cuenta ni app. Generás su link único de WhatsApp y, al abrirlo, queda vinculado a la obra para reportar por chat.</div>
              </div>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate-700">Nombre del obrero*</span>
                <input
                  value={o.nombre}
                  onChange={(e) => { setO({ ...o, nombre: e.target.value }); setLink(null); }}
                  placeholder="Ej: Ramón Díaz"
                  className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate-700">Teléfono*</span>
                <PhoneInput value={o.tel} onChange={(full) => { setO({ ...o, tel: full }); setLink(null); }} />
              </label>
              {link && (
                <div className="flex items-center gap-2 bg-success-50 border border-[#BBF7D0] rounded-md px-3 py-[8px]">
                  <Comment width={13} height={13} className="text-[#15803D] flex-none" />
                  <code className="flex-1 min-w-0 text-[11px] text-[#15803D] font-semibold truncate">{link}</code>
                  <span className="text-[10px] font-bold text-[#15803D]">link generado</span>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 flex-none">
              <button onClick={close} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
              {link ? (
                <button
                  onClick={saveObrero}
                  className="inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] bg-[#25D366] hover:brightness-95 text-white"
                >
                  <Comment width={14} height={14} /> Enviar por WhatsApp
                </button>
              ) : (
                <button
                  onClick={genLink}
                  disabled={!obreroOk}
                  className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${obreroOk ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`}
                >
                  Generar link <ArrowRight width={14} height={14} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
