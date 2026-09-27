"use client";

import { useSearchParams } from "next/navigation";
import { ScreenPresupuesto } from "../../presupuesto/_components/ScreenPresupuesto";
import { ScreenRecibos } from "../../recibos/_components/ScreenRecibos";

export function CostosView() {
  const sp = useSearchParams();
  const v = sp.get("v") === "recibos" ? "recibos" : "presupuesto";

  return (
    <>
      {v === "recibos" ? <ScreenRecibos key="recibos" /> : <ScreenPresupuesto key="presupuesto" />}
    </>
  );
}
