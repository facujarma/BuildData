"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Xmark,
  Box,
  SquareArticle,
  TriangleExclamation,
  Calendar,
  Picture,
  Persons,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { DStatTile } from "../../_components/DStatTile";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import DButton from "@/components/ui/Button";
import { getPerfil } from "@/services/mock/perfilService";
import type { PerfilData } from "../../perfil/data";

const inputCls = "text-[13px] bg-slate-50 border border-slate-200 rounded-md px-3 py-[7px] focus:outline-none focus:border-primary focus:bg-white transition-colors w-full";

const ACT_ICON: Record<string, React.ReactNode> = {
  check: <Check width={12} height={12} />,
  package: <Box width={12} height={12} />,
  alert: <TriangleExclamation width={12} height={12} />,
  persons: <Persons width={12} height={12} />,
  calendar: <Calendar width={12} height={12} />,
  grid: <Picture width={12} height={12} />,
};

export function ScreenPerfil() {
  const [me, setMe] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPerfil().then((d) => { setMe(d); setLoading(false); });
  }, []);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

  if (loading || !me) {
    return (
      <>
        <div className="mb-5"><div className="shimmer h-7 w-48 rounded-md" /><div className="shimmer h-4 w-72 rounded-md mt-2" /></div>
        <div className="bg-white border border-slate-200 rounded-lg mb-4 overflow-hidden">
          <div className="shimmer h-[120px] w-full" />
          <div className="p-6 space-y-2"><div className="shimmer h-6 w-48 rounded" /><div className="shimmer h-4 w-96 rounded" /></div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white border border-slate-200 rounded-lg p-4"><div className="shimmer h-8 w-8 rounded-lg mb-3" /><div className="shimmer h-6 w-14 rounded mb-1" /><div className="shimmer h-3 w-24 rounded" /></div>)}
        </div>
      </>
    );
  }

  return (
    <>
      <DPageHeader
        title="Mi perfil"
        subtitle="Cómo te ven el resto del equipo y tu información personal."
      />

      {/* Hero */}
      <DCard padding="p-0" className="mb-4 overflow-hidden">
        <div className="blueprint-bg h-[120px] relative">
          <button className="absolute top-3 right-3 text-white/80 bg-white/10 hover:bg-white/20 backdrop-blur text-[11px] font-bold px-3 py-[5px] rounded-md flex items-center gap-1.5">
            <Picture width={12} height={12} /> Cambiar portada
          </button>
        </div>
        <div className="px-6 pb-6 relative">
          <div className="flex items-end gap-4 -mt-12">
            <div className="relative flex-none">
              <div className="w-[96px] h-[96px] rounded-full bg-gradient-to-br from-primary to-accent ring-4 ring-white text-white text-[32px] font-extrabold flex items-center justify-center">
                {me.who}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-card flex items-center justify-center text-slate-600">
                <Picture width={14} height={14} />
              </button>
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[22px] font-extrabold display-tight text-white">{me.first} {me.last}</h2>
                <DPill tone="primary">{me.role.toUpperCase()}</DPill>
              </div>
              <div className="text-[13px] text-slate-500 mt-[2px]">{me.email} · {me.phone}</div>
              <div className="text-[12px] text-slate-600 mt-1">Edificio Belgrano · activo desde {me.since}</div>
            </div>
            <DButton variant="primary" size="md">Editar perfil</DButton>
          </div>
        </div>
      </DCard>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="primary" label="Tareas asignadas" value={String(me.tasks)} icon={<Check width={16} height={16} />} delta="3 vencen esta semana" />
        <DStatTile tone="info" label="Reportes generados" value={String(me.reports)} icon={<SquareArticle width={16} height={16} />} delta="+12 este mes" deltaTone="success" />
        <DStatTile tone="attention" label="Pedidos aprobados" value={String(me.orders)} icon={<Box width={16} height={16} />} />
        <DStatTile tone="success" label="Alertas resueltas" value={String(me.alerts)} icon={<TriangleExclamation width={16} height={16} />} delta="100% del mes" deltaTone="success" />
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-4 items-start">
        <div className="space-y-4">
          <DCard className="p-5">
            <div className="text-[15px] font-bold text-slate-950 mb-1">Información personal</div>
            <div className="text-[11px] text-slate-500 mb-4">Datos visibles para el resto del equipo.</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1"><span className="text-[10px] tracking-wide uppercase font-bold text-slate-500">Nombre</span><input className={inputCls} defaultValue={me.first} /></div>
              <div className="flex flex-col gap-1"><span className="text-[10px] tracking-wide uppercase font-bold text-slate-500">Apellido</span><input className={inputCls} defaultValue={me.last} /></div>
              <div className="flex flex-col gap-1"><span className="text-[10px] tracking-wide uppercase font-bold text-slate-500">Email</span><input className={inputCls} defaultValue={me.email} /></div>
              <div className="flex flex-col gap-1"><span className="text-[10px] tracking-wide uppercase font-bold text-slate-500">Teléfono</span><input className={inputCls} defaultValue={me.phone} /></div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] tracking-wide uppercase font-bold text-slate-500">Cargo</span>
                <select className={inputCls} defaultValue={me.roleKey}>
                  {[["director", "Director de obra"], ["capataz", "Capataz"], ["compras", "Compras"], ["arquitecto", "Arquitecto/a"], ["cliente", "Cliente / propietario"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-[10px] tracking-wide uppercase font-bold text-slate-500">Sobre mí</span>
                <textarea className={`${inputCls} min-h-[70px] resize-y`} defaultValue={me.bio} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <DButton variant="outline" onClick={() => flash()}>Descartar</DButton>
              <DButton onClick={() => flash()}>Guardar cambios</DButton>
            </div>
          </DCard>

          <DCard className="p-5">
            <div className="text-[15px] font-bold text-slate-950 mb-1">Rol y permisos</div>
            <div className="text-[11px] text-slate-500 mb-3">Lo que podés ver y hacer en esta obra.</div>
            <div className="space-y-3">
              {me.perms.map((p) => (
                <div key={p.label} className="flex items-center justify-between gap-3 py-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-none ${p.on ? "bg-success-50 text-[#15803D]" : "bg-slate-100 text-slate-500"}`}>
                      {p.on ? <Check width={12} height={12} /> : <Xmark width={12} height={12} />}
                    </span>
                    <span className="text-[13px] font-semibold text-slate-950">{p.label}</span>
                  </div>
                  <DPill tone="slate">{p.area}</DPill>
                </div>
              ))}
            </div>
          </DCard>
        </div>

        <div className="space-y-4">
          <DCard padding="p-0">
            <div className="px-5 py-3 border-b border-slate-200">
              <div className="text-[13px] font-bold">Actividad reciente</div>
              <div className="text-[11px] text-slate-500 mt-[1px]">Tus últimas acciones en BuildData.</div>
            </div>
            <div className="divide-y divide-slate-100">
              {me.activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-none ${a.tint}`}>
                    {ACT_ICON[a.icon] ?? <Check width={12} height={12} />}
                  </span>
                  <div className="flex-1 min-w-0 text-[12px]">
                    <div className="text-slate-800 leading-snug">{a.text}</div>
                    <div className="text-[10px] text-slate-500 mt-[2px]">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </DCard>

          <DCard padding="p-0">
            <div className="px-5 py-3 border-b border-slate-200">
              <div className="text-[13px] font-bold">Preferencias</div>
            </div>
            <div className="px-5 py-3 space-y-3">
              <PrefRow label="Mostrar mi avatar en reportes" hint="Tus iniciales aparecen junto a tus acciones." on={me.prefs.avatarInReports} onChange={() => {}} />
              <PrefRow label="Modo compacto" hint="Reduce el padding de cards y tablas." on={me.prefs.compact} onChange={() => {}} />
              <PrefRow label="Tono de la interfaz claro" hint="Modo oscuro próximamente." on={me.prefs.lightTone} onChange={() => {}} />
            </div>
          </DCard>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 bg-slate-950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop z-90">
          <Check width={14} height={14} className="text-success" /> Cambios guardados
        </div>
      )}
    </>
  );
}

function PrefRow({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[13px] font-semibold text-slate-950">{label}</div>
        <div className="text-[11px] text-slate-500">{hint}</div>
      </div>
      <button onClick={() => onChange(!on)} aria-pressed={on}
        className={`w-[38px] h-[22px] rounded-full flex items-center px-[3px] transition-colors flex-none ${on ? "bg-primary justify-end" : "bg-slate-200 justify-start"}`}>
        <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}