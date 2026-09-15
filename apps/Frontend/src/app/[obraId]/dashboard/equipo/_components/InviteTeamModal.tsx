"use client";

import { useState, useEffect } from "react";
import { Xmark, Check, ArrowRight, ArrowLeft, Smartphone, Envelope } from "@gravity-ui/icons";
import Button from "@/components/ui/Button";
import { DPill } from "@/components/ui/DPill";
import { ROLES } from "../data";

interface InviteTeamModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: unknown) => void;
}

export function InviteTeamModal({ open, onClose, onSave }: InviteTeamModalProps) {
  const [mode, setMode] = useState<"miembro" | "obrero" | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [phone, setPhone] = useState("");
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMode(null);
      setEmail("");
      setName("");
      setRole(ROLES[0]);
      setPhone("");
      setLink(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  if (!open) return null;

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validPhone = phone.trim().length >= 8;

  const handleGenerateLink = () => {
    const hash = Math.random().toString(36).slice(2, 10);
    setLink(`wa.me/buildata/ob-${hash}`);
  };

  const handleSave = () => {
    if (mode === "miembro") {
      onSave({ mode: "miembro", email, name, role });
    } else {
      onSave({ mode: "obrero", name, phone, link });
    }
    onClose();
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[55] bg-slate-950/40 backdrop-blur-[2px] animate-fade-task" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-big w-full max-w-[460px] animate-modal-pop overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              {mode && (
                <button
                  onClick={() => setMode(null)}
                  className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center"
                >
                  <ArrowLeft width={14} height={14} />
                </button>
              )}
              <h3 className="text-[16px] font-extrabold display-tight text-slate-950">
                {mode === null && "Invitar al equipo"}
                {mode === "miembro" && "Invitar miembro"}
                {mode === "obrero" && "Invitar obrero"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center flex-none"
            >
              <Xmark width={16} height={16} />
            </button>
          </div>

          {mode === null && (
            <div className="p-5 space-y-3">
              <button className="text-left w-full bg-white border border-slate-200 rounded-lg shadow-card p-5 cursor-pointer hover:border-primary hover:shadow-card2 transition-all" onClick={() => setMode("miembro")}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-none">
                    <Envelope width={18} height={18} />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-slate-950">Miembro de BuildData</div>
                    <div className="text-[12px] text-slate-500 mt-1">Acceso completo a la app. Se invita por email.</div>
                  </div>
                  <ArrowRight width={14} height={14} className="text-slate-300 mt-2 flex-none ml-auto" />
                </div>
              </button>
              <button className="text-left w-full bg-white border border-slate-200 rounded-lg shadow-card p-5 cursor-pointer hover:border-primary hover:shadow-card2 transition-all" onClick={() => setMode("obrero")}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success-50 text-success flex items-center justify-center flex-none">
                    <Smartphone width={18} height={18} />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-slate-950">Obrero por WhatsApp</div>
                    <div className="text-[12px] text-slate-500 mt-1">Reporta novedades por chat. No necesita la app.</div>
                  </div>
                  <ArrowRight width={14} height={14} className="text-slate-300 mt-2 flex-none ml-auto" />
                </div>
              </button>
            </div>
          )}

          {mode === "miembro" && (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1.5 block">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre y apellido"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1.5 block">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-950 bg-white focus:outline-none focus:border-primary transition-colors"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
                <Button variant="primary" size="sm" disabled={!validEmail} onClick={handleSave}>
                  <Check width={13} height={13} />
                  Enviar invitación
                </Button>
              </div>
            </div>
          )}

          {mode === "obrero" && (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1.5 block">Nombre *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre y apellido"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1.5 block">Teléfono *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 5555-1234"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="bg-info-50 border border-[#BFDBFE] rounded-lg p-3 flex items-start gap-2">
                <Smartphone width={14} height={14} className="text-[#1D4ED8] mt-[2px] flex-none" />
                <div className="text-[11px] text-slate-700">
                  El obrero recibirá un enlace de WhatsApp. No necesita descargar ninguna aplicación. Con solo abrir el chat podrá reportar novedades de la obra.
                </div>
              </div>
              {!link ? (
                <Button variant="primary" size="sm" disabled={!validPhone} onClick={handleGenerateLink}>
                  Generar link
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1.5 block">Link generado</label>
                    <div className="border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-950 font-mono bg-slate-50 truncate">
                      {link}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" size="sm" onClick={handleSave}>
                      <Smartphone width={13} height={13} />
                      Enviar por WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
