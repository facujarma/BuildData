"use client";

import type { ComponentType } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Clock, Picture, ChartLine } from "@gravity-ui/icons";
import { GroupTabs } from "../../_components/GroupTabs";
import { ScreenActividad } from "../../actividad/_components/ScreenActividad";
import { ScreenGaleria } from "./ScreenGaleria";
import { ScreenReportes } from "../../reportes/_components/ScreenReportes";

const TABS = [
  { id: "actividad", label: "Actividad", icon: <Clock width={13} height={13} /> },
  { id: "galeria", label: "Galería", icon: <Picture width={13} height={13} /> },
  { id: "reportes", label: "Reportes", icon: <ChartLine width={13} height={13} /> },
];

const VIEWS: Record<string, ComponentType<{ obraId: string }>> = {
  actividad: ScreenActividad,
  galeria: ScreenGaleria,
  reportes: ScreenReportes,
};

export function RegistroView() {
  const sp = useSearchParams();
  const v = sp.get("v") || "actividad";
  const router = useRouter();
  const params = useParams<{ obraId: string }>();
  const obraId = params.obraId;
  const base = `/${obraId}/dashboard/registro`;
  const Screen = VIEWS[v] ?? ScreenActividad;

  return (
    <>
      <GroupTabs
        tabs={TABS}
        value={v}
        onSelect={(id) => router.replace(`${base}?v=${id}`)}
      />
      <Screen key={v} obraId={obraId} />
    </>
  );
}