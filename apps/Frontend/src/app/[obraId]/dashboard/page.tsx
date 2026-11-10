"use client";

import { use, useState, useEffect, useCallback } from "react";
import {
  DashboardContent,
  EmptyDashboardContent,
} from "@/app/[obraId]/dashboard/_components";
import type { DashboardData } from "@/types/dashboard";
import { getDashboard } from "@/services/dashboardService";
import { useDashboardData } from "@/app/[obraId]/dashboard/_components/DashboardDataContext";
import DashboardLoading from "./loading";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = use(params);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const { setRefreshDashboardRef, setObraInfo, setOperacionesPendientes } =
    useDashboardData();

  const refresh = useCallback(async () => {
    if (!obraId) return;
    setLoading(true);
    try {
      const fresh = await getDashboard(obraId);
      setData(fresh);
      setObraInfo(obraId, fresh.obra.name, fresh.stats.avanceTotal);
      setOperacionesPendientes(fresh.stats.operacionesPendientes);
    } finally {
      setLoading(false);
    }
  }, [obraId, setObraInfo, setOperacionesPendientes]);

  useEffect(() => {
    // "Subscribirse" al refresh del dashboard: el contexto guarda la función
    // para que otros componentes (p. ej. la bandeja) puedan pedir una recarga.
    setRefreshDashboardRef(refresh);
    return () => setRefreshDashboardRef(async () => {});
  }, [refresh, setRefreshDashboardRef]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch inicial del dashboard (refresh hace setLoading/setData)
    refresh();
  }, [refresh]);

  if (loading && !data) return <DashboardLoading />;

  if (!data) return <EmptyDashboardContent />;

  return <DashboardContent data={data} />;
}
