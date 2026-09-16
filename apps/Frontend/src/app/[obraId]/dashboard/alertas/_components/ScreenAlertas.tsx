"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Check, CircleExclamation, Clock } from "@gravity-ui/icons";
import { getAlertas, resolverAlerta } from "@/services/alertasService";
import type { AlertaItem } from "@/app/[obraId]/dashboard/alertas/data";
import { LVL, STATE } from "@/app/[obraId]/dashboard/alertas/data";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import { DPageHeader } from "@/app/[obraId]/dashboard/_components/DPageHeader";
import { DStatTile } from "@/app/[obraId]/dashboard/_components/DStatTile";
import { QuickAddModal } from "@/app/[obraId]/dashboard/_components/QuickAddModal";
import { DashToast, useToast } from "@/app/[obraId]/dashboard/_components/useToast";
import { AlertaDrawer } from "./AlertaDrawer";

type TabId = "activas" | "criticas" | "importantes" | "moderadas" | "todas";

interface TabDef {
  id: TabId;
  label: string;
  match: (a: AlertaItem) => boolean;
}

const TABS: TabDef[] = [
  { id: "activas",     label: "Activas",     match: (a) => a.state !== "resolved" },
  { id: "criticas",    label: "Críticas",    match: (a) => a.state !== "resolved" && a.lvl === "critical" },
  { id: "importantes", label: "Importantes", match: (a) => a.state !== "resolved" && a.lvl === "attention" },
  { id: "moderadas",   label: "Moderadas",   match: (a) => a.state !== "resolved" && a.lvl === "moderate" },
  { id: "todas",       label: "Todas",       match: () => true },
];

export function ScreenAlertas() {
  const { obraId } = useParams<{ obraId: string }>();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertaItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("activas");
  const [pick, setPick] = useState<AlertaItem | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, flash] = useToast();

  useEffect(() => {
    let cancelled = false;
    getAlertas(obraId)
      .then((data) => {
        if (!cancelled) setAlerts(data.alerts);
      })
      .catch((error) => {
        console.error("Error cargando alertas:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [obraId, refreshKey]);

  const counts = useMemo(() => {
    const active = alerts.filter((a) => a.state !== "resolved");
    return {
      activas: active.length,
      criticas: active.filter((a) => a.lvl === "critical").length,
      importantes: active.filter((a) => a.lvl === "attention").length,
      moderadas: active.filter((a) => a.lvl === "moderate").length,
    };
  }, [alerts]);

  const list = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab) || TABS[0];
    return alerts.filter(tab.match);
  }, [alerts, activeTab]);

  const handleResolve = useCallback(
    async (id: string) => {
      try {
        await resolverAlerta(id);
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        setPick((c) => (c && c.id === id ? null : c));
        flash("Alerta resuelta");
      } catch (e) {
        flash(e instanceof Error ? e.message : "No se pudo resolver la alerta");
      }
    },
    [flash],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-semibold">Cargando alertas…</span>
        </div>
      </div>
    );
  }

  const openCount = counts.activas;
  const critCount = counts.criticas;

  return (
    <>
      <DPageHeader
        title="Alertas de obra"
        subtitle={`${openCount} sin atender · ${critCount} crítica${critCount === 1 ? "" : "s"} activa${critCount === 1 ? "" : "s"}`}
        right={
          <Button
            variant="danger"
            size="sm"
            icon={<CircleExclamation width={13} height={13} />}
            onClick={() => setReportOpen(true)}
          >
            Reportar alerta
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile
          tone="critical"
          label="Sin atender"
          value={String(counts.activas)}
          icon={<CircleExclamation width={16} height={16} />}
          delta={counts.activas ? "Requieren acción" : "Todo atendido"}
          deltaTone={counts.activas ? "critical" : "success"}
          onClick={() => setActiveTab("activas")}
        />
        <DStatTile
          tone="critical"
          label="Críticas"
          value={String(counts.criticas)}
          icon={<CircleExclamation width={16} height={16} />}
          onClick={() => setActiveTab("criticas")}
        />
        <DStatTile
          tone="attention"
          label="Importantes"
          value={String(counts.importantes)}
          icon={<Clock width={16} height={16} />}
          onClick={() => setActiveTab("importantes")}
        />
        <DStatTile
          tone="success"
          label="Moderadas"
          value={String(counts.moderadas)}
          icon={<Check width={16} height={16} />}
          onClick={() => setActiveTab("moderadas")}
        />
      </div>

      {openCount > 0 && (
        <div className="flex items-start gap-3 bg-critical-50 border border-[#FECACA] rounded-lg p-3 mb-4">
          <span className="w-8 h-8 rounded-md bg-[#FECACA] text-[#B91C1C] flex items-center justify-center flex-none">
            <CircleExclamation width={15} height={15} />
          </span>
          <div className="text-[12px] text-slate-700 leading-snug flex-1">
            <b className="text-[#B91C1C]">Las alertas son problemas e incidentes de la obra</b> que frenan o ponen en
            riesgo el avance — fallas de equipo, faltantes de material, temas de seguridad o personal. Resolvelas
            cuando estén atendidas.
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-200 mb-4 flex-wrap">
        {TABS.map((t) => {
          const on = activeTab === t.id;
          const count = alerts.filter(t.match).length;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors ${
                on ? "text-primary border-primary" : "text-slate-500 border-transparent hover:text-slate-700"
              }`}
            >
              {t.label}
              <span
                className={`text-[10px] font-bold px-[6px] py-[2px] rounded-full ${
                  on ? "bg-primary-50 text-primary" : "bg-slate-100 text-slate-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {list.map((a) => {
          const lv = LVL[a.lvl];
          const st = STATE[a.state];
          return (
            <div
              key={a.id}
              className="relative border rounded-lg overflow-hidden bg-white border-slate-200 hover:shadow-card2 transition-shadow"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ background: lv.stripe }} />
              <div className="pl-5 pr-4 py-4 grid grid-cols-[40px_1fr_auto] gap-3 items-start">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lv.icoBg} ${lv.icoFg}`}>
                  <CircleExclamation width={16} height={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 tnum">#{a.id.slice(0, 8)}</span>
                    <DPill tone={lv.pill as "slate"}>{lv.tag}</DPill>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded px-[6px] py-[2px]">
                      {a.cat}
                    </span>
                  </div>
                  <button
                    onClick={() => setPick(a)}
                    className="text-[15px] font-bold text-slate-950 leading-tight text-left hover:text-primary transition-colors block"
                  >
                    {a.title}
                  </button>
                  <div className="text-[11px] text-slate-500 mt-[3px]">
                    Reportado por {a.who} · {a.time}
                  </div>
                  <div className="text-[12px] text-slate-700 leading-snug mt-2">{a.desc}</div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-none">
                  <DPill tone={st.pill as "slate"}>{st.label}</DPill>
                </div>
              </div>
              <div className="border-t border-slate-100 px-5 py-2 flex items-center gap-2 flex-wrap bg-slate-50/50">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Check width={12} height={12} />}
                  onClick={() => handleResolve(a.id)}
                >
                  Resolver
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPick(a)}>
                  Ver detalle
                </Button>
              </div>
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-[13px] border border-dashed border-slate-200 rounded-lg flex flex-col items-center gap-2">
            <span className="w-12 h-12 rounded-full bg-success-50 text-[#15803D] flex items-center justify-center">
              <Check width={22} height={22} />
            </span>
            No hay alertas en esta vista.
          </div>
        )}
      </div>

      {pick && <AlertaDrawer alert={pick} onClose={() => setPick(null)} onResolve={handleResolve} />}

      <QuickAddModal
        kind={reportOpen ? "critico" : null}
        obraId={obraId}
        onClose={() => setReportOpen(false)}
        onDone={(msg) => {
          flash(msg);
          setRefreshKey((k) => k + 1);
        }}
      />

      <DashToast msg={toast} />
    </>
  );
}
