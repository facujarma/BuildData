"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Persons, Xmark } from "@gravity-ui/icons";
import { DAvatar } from "@/components/ui/DAvatar";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import { vincularCuentaWeb } from "@/services/equipoService";
import type { Obrero, Person } from "../data";

interface VincularCuentaModalProps {
  open: boolean;
  obraId: string;
  /** Persona que reporta por WhatsApp: destino del merge. */
  obrero: Obrero | null;
  /** Personas con cuenta web (`auth_user_id`): candidatas a origen. */
  personas: Person[];
  onClose: () => void;
  /** Solo se llama si el backend confirmó la vinculación. */
  onLinked: () => void;
}

export function VincularCuentaModal({
  open,
  obraId,
  obrero,
  personas,
  onClose,
  onLinked,
}: VincularCuentaModalProps) {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setSeleccion(null);
    setVinculando(false);
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      // Mientras el POST está en curso no se cierra: el resultado tiene que
      // verse en la pantalla (el padre hace flash + recargar al confirmar).
      if (e.key === "Escape" && !vinculando) close();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, vinculando, close]);

  if (!open || !obrero) return null;

  const confirmar = async () => {
    if (!seleccion || vinculando) return;
    setVinculando(true);
    setError(null);
    try {
      await vincularCuentaWeb(obraId, {
        personaDestinoId: obrero.id,
        personaOrigenId: seleccion,
      });
      onLinked();
      close();
    } catch (e) {
      // El backend manda el motivo real (403 por rol/obra, 409 teléfono en uso,
      // 503 migración pendiente): se muestra textual, sin inventar nada.
      setError(e instanceof Error ? e.message : "No se pudo vincular la cuenta");
    } finally {
      setVinculando(false);
    }
  };

  const candidata = personas.find((p) => p.id === seleccion) ?? null;

  return (
    <div
      onClick={() => {
        if (!vinculando) close();
      }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[500px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center">
              <Persons width={16} height={16} />
            </div>
            <div className="text-[15px] font-extrabold display-tight">Vincular cuenta web</div>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={close}
            disabled={vinculando}
            className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center disabled:opacity-40"
          >
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-start gap-3 bg-primary-50 border border-primary/25 rounded-lg p-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-none">
              <Persons width={13} height={13} />
            </div>
            <div className="text-[12px] text-slate-700 leading-snug">
              Unificá esta cuenta web con la persona que ya reporta por WhatsApp. Se conserva el
              rol más alto y se migran historial, tareas y membresías.
            </div>
          </div>

          <div className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-3">
            <DAvatar initials={obrero.name.split(" ").map((w) => w[0]).join("").slice(0, 2)} size={36} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-slate-950 truncate">{obrero.name}</div>
              <div className="text-[11px] text-slate-500">{obrero.phone || "Sin teléfono"}</div>
            </div>
            <div className="flex items-center gap-2">
              <DPill tone="slate">{obrero.rol}</DPill>
              <DPill tone="info">WhatsApp</DPill>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-700 mb-2">
              Cuenta web que se unifica en esta persona
            </div>
            {personas.length === 0 ? (
              <div className="text-[12px] text-slate-500 border border-dashed border-slate-300 rounded-lg px-3 py-4 text-center">
                No hay cuentas web para vincular.
              </div>
            ) : (
              <div className="space-y-2">
                {personas.map((p) => {
                  const activa = p.id === seleccion;
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                        activa
                          ? "border-primary bg-primary-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="persona-origen"
                        value={p.id}
                        checked={activa}
                        onChange={() => setSeleccion(p.id)}
                        disabled={vinculando}
                        className="accent-primary flex-none"
                      />
                      <DAvatar initials={p.who} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-slate-950 truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {p.email || "Sin email"}
                        </div>
                      </div>
                      <DPill tone="slate">{p.role}</DPill>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {candidata && (
            <div className="text-[11px] text-slate-500 leading-snug">
              <span className="font-bold text-slate-700">{obrero.name}</span> va a conservar el
              teléfono, el historial y el rol más alto; la cuenta web duplicada
              (<span className="font-bold text-slate-700">{candidata.name}</span>) se elimina.
            </div>
          )}

          {error && (
            <div className="text-[11px] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-[8px]">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 flex-none">
          <Button variant="secondary" size="sm" onClick={close} disabled={vinculando}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={confirmar}
            disabled={!seleccion || vinculando || personas.length === 0}
            icon={<ArrowRight width={13} height={13} />}
          >
            {vinculando ? "Vinculando…" : "Vincular cuenta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
