"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Smartphone } from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { DCard } from "@/components/ui/DCard";
import { DAvatar } from "@/components/ui/DAvatar";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import { getEquipo, type EquipoData } from "@/services/equipoService";
import type { Obrero } from "../data";
import { esMismoTelefono } from "../data/telefono";
import { useToast, DashToast } from "../../_components/useToast";
import { InviteTeamModal } from "./InviteTeamModal";

export function ScreenEquipo() {
  const { obraId } = useParams<{ obraId: string }>();
  const [data, setData] = useState<EquipoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Invitaciones creadas en esta sesión: hasta que el obrero abre el link y
  // consume el token no hay fila en miembros_obra, así que GET /obreros/:obra_id
  // todavía no las devuelve. Se muestran como "Pendiente" y desaparecen cuando
  // el refetch ya trae a la persona vinculada. Llevan obraId para no filtrarse
  // entre obras si Next reutiliza la instancia al navegar.
  const [pendientes, setPendientes] = useState<(Obrero & { obraId: string })[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, flash] = useToast();

  const aplicarEquipo = useCallback((equipo: EquipoData) => {
    setData(equipo);
    setError(null);
    setPendientes((prev) =>
      prev.filter((p) => !equipo.obreros.some((o) => esMismoTelefono(o.phone, p.phone))),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    getEquipo(obraId)
      .then((equipo) => {
        if (!cancelled) aplicarEquipo(equipo);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el equipo");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [obraId, aplicarEquipo]);

  const recargar = useCallback(async () => {
    try {
      aplicarEquipo(await getEquipo(obraId));
    } catch {
      setError("No se pudo actualizar la lista");
    }
  }, [obraId, aplicarEquipo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-semibold">Cargando equipo…</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-[13px] text-slate-500">
        {error || "No se pudo cargar el equipo"}
      </div>
    );
  }

  const { people } = data;
  const filas = [...pendientes.filter((p) => p.obraId === obraId), ...data.obreros];

  return (
    <>
      <DPageHeader
        title="Equipo de trabajo"
        subtitle={`${people.length} personas con acceso · ${filas.length} obreros por WhatsApp`}
      />

      {error && (
        <div className="mb-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-[8px] text-[11px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-[11px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">
          Con acceso a la app
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {people.map((p) => (
            <DCard key={p.who} padding="p-4">
              <div className="flex items-center gap-3">
                <DAvatar initials={p.who} size={44} />
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-slate-950 truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-500">{p.role}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-400 tnum">{p.tasks} tareas</span>
                    <span className="text-[10px] text-slate-400 tnum">{p.reports} reportes</span>
                  </div>
                </div>
              </div>
            </DCard>
          ))}
        </div>
      </div>

      <DCard padding="p-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Smartphone width={16} height={16} className="text-slate-500" />
            <div>
              <div className="text-[13px] font-bold text-slate-950">Obreros por WhatsApp</div>
              <div className="text-[11px] text-slate-500">Reportan novedades desde el chat</div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus width={13} height={13} />}
            onClick={() => setInviteOpen(true)}
          >
            Invitar obrero
          </Button>
        </div>
        {filas.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-500">
            No hay obreros invitados todavía
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filas.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                <DAvatar
                  initials={o.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-slate-950 truncate">{o.name}</span>
                    <DPill tone="slate">{o.rol}</DPill>
                  </div>
                  <div className="text-[11px] text-slate-500">{o.phone}</div>
                </div>
                <DPill tone={o.sent ? "success" : "attention"}>
                  {o.sent ? "Vinculado" : "Pendiente"}
                </DPill>
              </div>
            ))}
          </div>
        )}
      </DCard>

      <InviteTeamModal
        open={inviteOpen}
        obraId={obraId}
        onClose={() => setInviteOpen(false)}
        onSave={(creada) => {
          // `link` solo existe si POST /obreros/invitacion respondió 201.
          setPendientes((prev) => [
            ...prev.filter((p) => !esMismoTelefono(p.phone, creada.telefono)),
            {
              id: `pendiente-${creada.link}`,
              name: creada.nombre,
              phone: creada.telefono,
              link: creada.link,
              sent: false,
              rol: creada.rol,
              obraId,
            },
          ]);
          flash(`Invitación creada para ${creada.nombre}`);
          void recargar();
        }}
      />

      <DashToast msg={toast} />
    </>
  );
}
