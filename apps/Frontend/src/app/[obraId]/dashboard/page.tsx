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
  const { setRefreshDashboardRef, setObraInfo } = useDashboardData();

  const refresh = useCallback(async () => {
    if (!obraId) return;
    setLoading(true);
    try {
      const fresh = await getDashboard(obraId);
      setData(fresh);
      setObraInfo(obraId, fresh.obra.name, fresh.stats.avanceTotal);
    } finally {
      setLoading(false);
    }
  }, [obraId, setObraInfo]);

  useEffect(() => {
    setRefreshDashboardRef(refresh);
    return () => setRefreshDashboardRef(async () => {});
  }, [refresh, setRefreshDashboardRef]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading && !data) return <DashboardLoading />;

  if (!data) return <EmptyDashboardContent />;

  return <DashboardContent data={data} />;
}
