"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { CircleExclamation, Check, Plus } from "@gravity-ui/icons";
import { getAlertas } from "@/services/alertasService";
import type { AlertaItem } from "@/app/[obraId]/dashboard/alertas/data";
import { TABS, TONES } from "@/app/[obraId]/dashboard/alertas/data";
import { DCard } from "@/components/ui/DCard";
import { DPill } from "@/components/ui/DPill";
import Button from "@/components/ui/Button";
import { DPageHeader } from "@/app/[obraId]/dashboard/_components/DPageHeader";

const TAB_TO_LVL: Record<string, string | undefined> = {
  criticos: "critical",
  importantes: "attention",
  moderados: "moderate",
  resueltos: "resolved",
};

export function ScreenAlertas() {
  const { obraId } = useParams<{ obraId: string }>();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertaItem[]>([]);
  const [activeTab, setActiveTab] = useState("todas");

  useEffect(() => {
    let cancelled = false;
    getAlertas(obraId)
      .then((data) => {
        if (!cancelled) {
          setAlerts(data.alerts);
        }
      })
      .catch((error) => {
        console.error("Error cargando alertas:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [obraId]);

  const tabCounts = useMemo(() => ({
    todas: alerts.length,
    criticos: alerts.filter((a) => a.lvl === "critical").length,
    importantes: alerts.filter((a) => a.lvl === "attention").length,
    moderados: alerts.filter((a) => a.lvl === "moderate").length,
    resueltos: alerts.filter((a) => a.lvl === "resolved").length,
  }), [alerts]);

  const filteredAlerts = useMemo(() => {
    const lvl = TAB_TO_LVL[activeTab];
    if (!lvl) return alerts;
    return alerts.filter((a) => a.lvl === lvl);
  }, [alerts, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[13px]">
        Cargando alertas…
      </div>
    );
  }

  return (
    <div>
      <DPageHeader
        title="Problemas y alertas"
        right={
          <Button size="sm" icon={<Plus width={16} height={16} />}>
            Reportar problema
          </Button>
        }
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-bold transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] px-1.5 py-[2px] rounded-full font-bold ${
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tabCounts[tab.id as keyof typeof tabCounts]}
            </span>
          </button>
        ))}
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-[13px]">
          No hay alertas {activeTab !== "todas" ? "en esta categoría" : ""}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((a) => {
            const t = TONES[a.lvl];
            return (
              <DCard key={a.id} padding="p-4" className={`border ${t.box}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-none ${t.ico}`}>
                    {a.lvl === "resolved" ? (
                      <Check width={16} height={16} />
                    ) : (
                      <CircleExclamation width={16} height={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-bold text-slate-950">{a.title}</h3>
                      <DPill tone={t.pillTone as "slate"}>{t.tag}</DPill>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                      <span>{a.who}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{a.time}</span>
                    </div>
                    <p className="text-[12px] text-slate-700 leading-relaxed mb-3">{a.desc}</p>
                    {a.actions.length > 0 && (
                      <div className="flex gap-2">
                        {a.actions.map((act, i) => (
                          <button
                            key={i}
                            className="text-[11px] font-bold text-primary hover:text-primary-700 px-2.5 py-1 rounded-md bg-primary-50 hover:bg-primary-100 transition-colors"
                          >
                            {act}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
