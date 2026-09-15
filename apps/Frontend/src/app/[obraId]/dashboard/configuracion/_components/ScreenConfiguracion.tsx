"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutHeaderCellsLarge,
  Persons,
  Layers,
  Database,
  Bell,
  CircleDollar,
  Shield,
  TrashBin,
  PlugConnection,
  Key,
  Lock,
  TriangleExclamation,
  CircleInfo,
  Check,
  Xmark,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import DButton from "@/components/ui/Button";
import { getConfiguracion } from "@/services/mock/configuracionService";
import { getRubros } from "@/services/mock/rubrosService";
import type { ObraSettings, IntegracionItem, SesionActiva, ConfiguracionPlan } from "../../configuracion/data";
import { PLAN_FIXTURE } from "../../configuracion/data";
import type { Rubro, CategoriaSeccion } from "../../configuracion/data/rubros";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] tracking-wide uppercase font-bold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "text-[13px] bg-slate-50 border border-slate-200 rounded-md px-3 py-[7px] focus:outline-none focus:border-primary focus:bg-white transition-colors";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on}
      className={`w-[38px] h-[22px] rounded-full flex items-center px-[3px] transition-colors flex-none ${on ? "bg-primary justify-end" : "bg-slate-200 justify-start"}`}>
      <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}

function SettingsCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-slate-950">{title}</h2>
        {hint && <div className="text-[11px] text-slate-500 mt-[2px]">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function ScreenConfiguracion() {
  const [tab, setTab] = useState("obra");
  const [notification, setNotification] = useState<string | null>(null);
  const flash = (m: string) => { setNotification(m); setTimeout(() => setNotification(null), 2000); };

  const [s, setS] = useState<ObraSettings>(ObraDefaults);
  const [integ, setInteg] = useState<IntegracionItem[]>([]);
  const [sessions, setSessions] = useState<SesionActiva[]>([]);
  const [plan, setPlan] = useState<ConfiguracionPlan>(PLAN_FIXTURE);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [cats, setCats] = useState<CategoriaSeccion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getConfiguracion(), getRubros()]).then(([c, r]) => {
      setS(c.obra ?? ObraDefaults); setInteg(c.integraciones); setSessions(c.sesiones); setPlan(c.plan);
      setRubros(r.rubros); setCats(r.categorias); setLoading(false);
    });
  }, []);

  const notifToggles = useState({ crit: true, weekly: true, daily: false, whatsapp: true });

  const NAV: { id: string; label: string; icon: ReactNode }[] = [
    { id: "obra", label: "Obra", icon: <LayoutHeaderCellsLarge width={14} height={14} /> },
    { id: "roles", label: "Roles y permisos", icon: <Persons width={14} height={14} /> },
    { id: "taxonomia", label: "Rubros y categorías", icon: <Layers width={14} height={14} /> },
    { id: "integraciones", label: "Integraciones", icon: <Database width={14} height={14} /> },
    { id: "notificaciones", label: "Notificaciones", icon: <Bell width={14} height={14} /> },
    { id: "plan", label: "Plan y facturación", icon: <CircleDollar width={14} height={14} /> },
    { id: "seguridad", label: "Seguridad", icon: <Shield width={14} height={14} /> },
  ];

  if (loading) {
    return (
      <div>
        <div className="mb-5"><div className="shimmer h-7 w-48 rounded-md" /><div className="shimmer h-4 w-80 rounded-md mt-2" /></div>
        <div className="grid grid-cols-[220px_1fr] gap-6 items-start">
          <div className="bg-white border border-slate-200 rounded-lg p-2 space-y-2">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="shimmer h-9 w-full rounded-md" />)}</div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"><div className="shimmer h-5 w-40 rounded" /><div className="shimmer h-10 w-full rounded" /><div className="shimmer h-10 w-full rounded" /><div className="shimmer h-10 w-2/3 rounded" /></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DPageHeader
        title="Configuración"
        subtitle="Datos de la obra, integraciones y preferencias de tu cuenta."
      />

      <div className="grid grid-cols-[220px_1fr] gap-6 items-start">
        <nav className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col gap-[2px] sticky top-2">
          {NAV.map((x) => {
            const on = tab === x.id;
            return (
              <button key={x.id} onClick={() => setTab(x.id)}
                className={`flex items-center gap-[10px] px-3 py-[8px] rounded-md text-[12px] font-semibold text-left transition-colors ${on ? "bg-primary-50 text-primary" : "text-slate-600 hover:bg-slate-50"}`}>
                <span className={on ? "text-primary" : "text-slate-500"}>{x.icon}</span>
                {x.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-4">
          {tab === "obra" && <SecObra />}
          {tab === "roles" && <SecRoles />}
          {tab === "taxonomia" && <SecTaxonomia />}
          {tab === "integraciones" && <SecIntegraciones />}
          {tab === "notificaciones" && <SecNotifs />}
          {tab === "plan" && <SecPlan />}
          {tab === "seguridad" && <SecSeguridad />}
        </div>
      </div>

      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate-950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop">
          <Check width={14} height={14} className="text-success" /> {notification}
        </div>
      )}
    </>
  );

  function SecObra() {
    return (
      <SettingsCard title="Datos de la obra" hint="La información básica que ven todos los participantes.">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Nombre de la obra"><input className={inputCls} value={s.nombre} onChange={(e) => set({ nombre: e.target.value })} /></Field>
          <Field label="Código interno"><input className={inputCls} value={s.codigo} onChange={(e) => set({ codigo: e.target.value })} /></Field>
          <Field label="Tipo">
            <select className={inputCls} value={s.tipo} onChange={(e) => set({ tipo: e.target.value as ObraSettings["tipo"] })}>
              {[["edificio", "Edificio"], ["vivienda", "Vivienda"], ["refaccion", "Refacción"], ["comercial", "Comercial"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select className={inputCls} value={s.estado} onChange={(e) => set({ estado: e.target.value as ObraSettings["estado"] })}>
              {[["planificacion", "Planificación"], ["en-curso", "En curso"], ["pausada", "Pausada"], ["finalizada", "Finalizada"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Dirección"><input className={inputCls} value={s.direccion} onChange={(e) => set({ direccion: e.target.value })} /></Field>
          <Field label="Localidad"><input className={inputCls} value={s.localidad} onChange={(e) => set({ localidad: e.target.value })} /></Field>
          <Field label="Provincia"><input className={inputCls} value={s.provincia} onChange={(e) => set({ provincia: e.target.value })} /></Field>
          <Field label="Código postal"><input className={inputCls} value={s.cp} onChange={(e) => set({ cp: e.target.value })} /></Field>
          <Field label="Fecha de inicio"><input className={inputCls} type="date" value={s.inicio} onChange={(e) => set({ inicio: e.target.value })} /></Field>
          <Field label="Fecha estimada de fin"><input className={inputCls} type="date" value={s.fin} onChange={(e) => set({ fin: e.target.value })} /></Field>
        </div>
        <Field label="Descripción">
          <textarea className={`${inputCls} min-h-[70px] resize-y`} value={s.descripcion} onChange={(e) => set({ descripcion: e.target.value })} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <DButton variant="outline" onClick={() => flash("Cambios descartados")}>Cancelar</DButton>
          <DButton onClick={() => flash("Obra actualizada")}>Guardar cambios</DButton>
        </div>
      </SettingsCard>
    );
  }

  function set(patch: Partial<ObraSettings>) {
    setS((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function SecRoles() {
    const perms = [
      { area: "Cronograma", list: ["Ver cronograma", "Crear y editar tareas"] },
      { area: "Pedidos", list: ["Ver pedidos", "Crear pedidos", "Aprobar / cancelar pedidos"] },
      { area: "Stock", list: ["Ver stock", "Ajustar y editar stock"] },
      { area: "Recibos", list: ["Ver recibos", "Cargar y editar recibos"] },
      { area: "Presupuesto", list: ["Ver presupuesto y costos", "Editar presupuesto"] },
      { area: "Equipo", list: ["Ver equipo", "Invitar y administrar personas"] },
    ];
    return (
      <SettingsCard title="Roles y permisos" hint="Qué puede hacer cada área de la obra según el rol.">
        <div className="divide-y divide-slate-100">
          {perms.map((p) => (
            <div key={p.area} className="py-3 flex items-start justify-between gap-4">
              <div className="text-[13px] font-bold text-slate-950 w-[120px] flex-none pt-1">{p.area}</div>
              <div className="flex-1 space-y-2">
                {p.list.map((perm) => (
                  <div key={perm} className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-slate-600">{perm}</span>
                    <Toggle on onChange={(v) => flash(`${perm}: ${v ? "activado" : "bloqueado"}`)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <DButton variant="outline" onClick={() => flash("Cambios guardados (demo)")}>Guardar</DButton>
        </div>
      </SettingsCard>
    );
  }

  function SecTaxonomia() {
    return (
      <SettingsCard title="Rubros y categorías" hint="El rubro cruza toda la obra; la categoría clasifica ítems dentro de cada sección.">
        <div className="text-[10px] tracking-wide uppercase font-bold text-slate-400 mb-2">Rubros</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {rubros.map((r) => (
            <span key={r.name} className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-[5px]">
              <span className="w-2 h-2 rounded-full" style={{ background: r.color }} /> {r.name}
            </span>
          ))}
          <button onClick={() => flash("Alta de rubro (demo)")} className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary border border-dashed border-primary-300 rounded-md px-3 py-[5px] hover:bg-primary-50">
            + Agregar
          </button>
        </div>
        <div className="text-[10px] tracking-wide uppercase font-bold text-slate-400 mb-2">Categorías</div>
        <div className="grid grid-cols-2 gap-2">
          {cats.map((c) => (
            <div key={c.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-slate-950">{c.label}</span>
                <span className="text-[10px] text-slate-400">{c.items.length} ítems</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.items.map((it) => (
                  <span key={it.id} className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded px-2 py-[2px]">{it.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>
    );
  }

  function SecIntegraciones() {
    return (
      <SettingsCard title="Integraciones" hint="Conectá BuildData con las herramientas que ya usás.">
        <div className="space-y-2">
          {integ.map((i) => (
            <div key={i.id} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3">
              <span style={{ background: i.logo.bg, color: i.logo.fg }} className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-extrabold flex-none">
                {i.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-slate-950">{i.name}</div>
                <div className="text-[11px] text-slate-500">{i.sub}</div>
              </div>
              {i.status === "connected" ? (
                <DButton size="sm" variant="outline" icon={<PlugConnection width={13} height={13} />} onClick={() => flash(`${i.name} desconectada`)}>Desconectar</DButton>
              ) : i.status === "pending" ? (
                <DButton size="sm" variant="outline" icon={<CircleInfo width={13} height={13} />} onClick={() => flash(`Revisando estado de ${i.name}…`)}>Pendiente</DButton>
              ) : (
                <DButton size="sm" icon={<PlugConnection width={13} height={13} />} onClick={() => flash(`Conectando ${i.name}…`)}>Conectar</DButton>
              )}
            </div>
          ))}
        </div>
      </SettingsCard>
    );
  }

  function SecNotifs() {
    const [n, setN] = notifToggles;
    const rows = [
      { id: "crit", label: "Alertas críticas", hint: "Falta de material, fallas técnicas, accidentes." },
      { id: "weekly", label: "Resumen semanal", hint: "Avance por rubro, pedidos del mes, problemas resueltos." },
      { id: "daily", label: "Resumen diario", hint: "Un punteo de lo que pasó hoy en la obra." },
      { id: "whatsapp", label: "Mensajes por WhatsApp", hint: "Confirmaciones y recordatorios directo al teléfono." },
    ];
    return (
      <SettingsCard title="Notificaciones por email" hint="Elegí qué querés recibir en tu correo.">
        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-semibold text-slate-950">{r.label}</div>
                <div className="text-[11px] text-slate-500">{r.hint}</div>
              </div>
              <Toggle on={!!n[r.id as keyof typeof n]} onChange={(v) => setN({ ...n, [r.id]: v })} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <DButton onClick={() => flash("Preferencias guardadas")}>Guardar</DButton>
        </div>
      </SettingsCard>
    );
  }

  function SecPlan() {
    return (
      <>
        <SettingsCard title="Tu plan">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-none"><CircleDollar width={18} height={18} /></span>
            <div className="flex-1">
              <div className="text-[15px] font-bold text-slate-950">Plan {plan.nombre}</div>
              <div className="text-[12px] text-slate-500">{plan.detalle}</div>
            </div>
            <div className="text-right">
              <div className="text-[16px] font-bold text-slate-950">AR$ {plan.precioMensual.toLocaleString("es-AR")}</div>
              <div className="text-[11px] text-slate-500">por mes</div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <DButton variant="outline" onClick={() => flash("Previsualizando upgrade…")}>Mejorar plan</DButton>
            <DButton onClick={() => flash("Descargando factura .pdf")}>Descargar factura</DButton>
          </div>
        </SettingsCard>

        <SettingsCard title="Método de cobro">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-none">💳</span>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-slate-950">Tarjeta de crédito <span className="text-slate-500 font-normal">· {plan.tarjeta}</span></div>
              <div className="text-[11px] text-slate-500">Vence {plan.tarjetaVence} · próximo cobro {plan.proximoCobro}</div>
            </div>
            <DButton size="sm" variant="outline" onClick={() => flash("Editar método (demo)")}>Editar</DButton>
          </div>
        </SettingsCard>

        <SettingsCard title="Historial">
          <div className="divide-y divide-slate-100">
            {plan.facturas.map((f) => (
              <div key={f.fecha} className="py-2.5 flex items-center gap-3">
                <span className="text-[12px] font-semibold text-slate-600 w-[110px] flex-none">{f.fecha}</span>
                <span className="text-[12px] text-slate-500 flex-1 text-left">{f.concepto}</span>
                <span className="text-[12px] font-bold text-slate-950">{f.monto}</span>
                <DButton size="sm" variant="ghost" onClick={() => flash("Descargando factura…")}>PDF</DButton>
              </div>
            ))}
          </div>
        </SettingsCard>
      </>
    );
  }

  function SecSeguridad() {
    return (
      <>
        <SettingsCard title="Sesiones activas" hint="Cerrá sesiones desde otros dispositivos si sospechás un ingreso no autorizado.">
          <div className="flex flex-col gap-3">
            {sessions.map((se) => (
              <div key={se.device} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-info-50 text-info flex items-center justify-center flex-none"><Shield width={16} height={16} /></span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-slate-950">{se.device} <span className="text-slate-400 font-normal">· {se.browser}</span></div>
                  <div className="text-[11px] text-slate-500">{se.location}</div>
                </div>
                {se.current ? (
                  <span className="text-[10px] font-bold text-success bg-success-50 rounded-full px-[8px] py-[3px]">Sesión actual</span>
                ) : (
                  <DButton size="sm" variant="ghost" icon={<Xmark width={12} height={12} />} onClick={() => flash("Sesión cerrada")}>Cerrar</DButton>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <DButton variant="outline" icon={<Lock width={13} height={13} />} onClick={() => flash("Sesiones remotas cerradas")}>Cerrar otras sesiones</DButton>
          </div>
        </SettingsCard>

        <SettingsCard title="Contraseña">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contraseña actual"><input className={inputCls} type="password" placeholder="••••••••" /></Field>
            <Field label="Nueva contraseña"><input className={inputCls} type="password" placeholder="Mínimo 8 caracteres" /></Field>
          </div>
          <div className="mt-4 flex justify-end">
            <DButton icon={<Key width={13} height={13} />} onClick={() => flash("Contraseña actualizada")}>Actualizar</DButton>
          </div>
        </SettingsCard>

        <SettingsCard title="Zona de riesgo">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-critical-50 text-critical flex items-center justify-center flex-none"><TriangleExclamation width={16} height={16} /></span>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-slate-950">Eliminar la obra</div>
              <div className="text-[11px] text-slate-500">Borra todas las tareas, pedidos, recibos y fotos de esta obra. No se puede deshacer.</div>
            </div>
            <DButton size="sm" variant="danger" icon={<TrashBin width={13} height={13} />} onClick={() => flash("Requiere confirmación (demo)")}>Eliminar</DButton>
          </div>
        </SettingsCard>
      </>
    );
  }
}

const ObraDefaults: ObraSettings = {
  nombre: "Edificio Belgrano", codigo: "OBR-2025-014", tipo: "edificio", estado: "en-curso",
  descripcion: "", direccion: "", localidad: "", provincia: "", cp: "", pais: "ar", inicio: "", fin: "",
};