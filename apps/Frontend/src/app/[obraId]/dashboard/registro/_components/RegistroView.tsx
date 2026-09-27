"use client";

import type { ComponentType } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ScreenActividad } from "../../actividad/_components/ScreenActividad";
import { ScreenGaleria } from "./ScreenGaleria";
import { ScreenReportes } from "../../reportes/_components/ScreenReportes";

const VIEWS: Record<string, ComponentType<{ obraId: string }>> = {
  actividad: ScreenActividad,
  galeria: ScreenGaleria,
  reportes: ScreenReportes,
};

export function RegistroView() {
  const sp = useSearchParams();
  const params = useParams<{ obraId: string }>();
  const v = sp.get("v") || "actividad";
  const Screen = VIEWS[v] ?? ScreenActividad;

  return <Screen key={v} obraId={params.obraId} />;
}
