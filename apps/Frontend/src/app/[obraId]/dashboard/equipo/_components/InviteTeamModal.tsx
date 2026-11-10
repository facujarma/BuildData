"use client";

import { useState, useEffect, useCallback } from "react";
import { Xmark, ArrowRight, Persons, Comment } from "@gravity-ui/icons";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { DPill } from "@/components/ui/DPill";
import { crearInvitacionObrero } from "@/services/equipoService";
import { ROLES, type InvitacionObreroCreada } from "../data";
import { aWaMe } from "../data/telefono";

interface InviteTeamModalProps {
  open: boolean;
  obraId: string;
  onClose: () => void;
  onSave: (data: InvitacionObreroCreada) => void;
}

const BOT_PHONE = (process.env.NEXT_PUBLIC_BOT_PHONE || "").replace(/\D/g, "");

export function InviteTeamModal({ open, obraId, onClose, onSave }: InviteTeamModalProps) {
  const [o, setO] = useState({ nombre: "", tel: "", rol: "Obrero" });
  const [link, setLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setO({ nombre: "", tel: "", rol: "Obrero" });
    setLink(null);
    setGenerating(false);
    setError(null);
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

  const obreroOk = o.nombre.trim().length >= 2 && o.tel.trim().length >= 6;

  const genLink = async () => {
    if (!obreroOk || generating) return;
    if (!BOT_PHONE) {
      setError("Falta configurar NEXT_PUBLIC_BOT_PHONE");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const { token } = await crearInvitacionObrero(obraId, {
        nombre: o.nombre.trim(),
        telefono: o.tel.trim(),
        rol: o.rol,
      });
      const texto = encodeURIComponent(`!invitacion ${token}`);
      setLink(`https://wa.me/${BOT_PHONE}?text=${texto}`);
    } catch (e) {
      // El backend manda el motivo real (ej: 403 solo Director o rol superior
      // al propio); el service lo propaga y acá se muestra tal cual.
      setError(e instanceof Error ? e.message : "No se pudo generar el link");
    } finally {
      setGenerating(false);
    }
  };

  const saveObrero = () => {
    if (!link) return;
    const destino = aWaMe(o.tel);
    window.open(`https://wa.me/${destino}?text=${encodeURIComponent(link)}`, "_blank", "noopener");
    onSave({ nombre: o.nombre.trim(), telefono: o.tel.trim(), rol: o.rol, link });
    close();
  };

  return (
    <div onClick={close} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[500px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-success-50 text-[#15803D] flex items-center justify-center"><Persons width={16} height={16} /></div>
            <div className="text-[15px] font-extrabold display-tight">Invitar obrero</div>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center"><Xmark width={16} height={16} /></button>
        </div>

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
          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Rol en la obra</span>
            <select
              value={o.rol}
              onChange={(e) => { setO({ ...o, rol: e.target.value }); setLink(null); }}
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="text-[10px] text-slate-500">Solo un Director puede invitar, y nunca puede otorgar un rol superior al propio.</span>
          </label>
          {link && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-success-50 border border-[#BBF7D0] rounded-md px-3 py-[8px]">
                <Comment width={13} height={13} className="text-[#15803D] flex-none" />
                <code className="flex-1 min-w-0 text-[11px] text-[#15803D] font-semibold truncate" title={link}>{link}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(link)}
                  className="text-[10px] font-bold text-[#15803D] hover:underline flex-none"
                >
                  Copiar
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-700">
                <span className="font-bold">Rol en la obra:</span>
                <DPill tone="primary">{o.rol}</DPill>
              </div>
              <div className="text-[10px] text-slate-500 leading-snug">
                Link de uso único, válido 7 días. Los datos viajan cifrados y el bot los valida al recibirlo.
              </div>
            </div>
          )}
          {error && (
            <div className="text-[11px] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-[8px]">
              {error}
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
              disabled={!obreroOk || generating}
              className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors ${obreroOk && !generating ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`}
            >
              {generating ? "Generando…" : "Generar link"} <ArrowRight width={14} height={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
