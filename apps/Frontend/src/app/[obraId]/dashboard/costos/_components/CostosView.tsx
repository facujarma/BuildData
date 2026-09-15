"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChartBar, Receipt } from "@gravity-ui/icons";
import { GroupTabs } from "../../_components/GroupTabs";
import { ScreenPresupuesto } from "../../presupuesto/_components/ScreenPresupuesto";
import { ScreenRecibos } from "../../recibos/_components/ScreenRecibos";

const TABS = [
  { id: "presupuesto", label: "Presupuesto", icon: <ChartBar width={13} height={13} /> },
  { id: "recibos", label: "Comprobantes", icon: <Receipt width={13} height={13} /> },
];

export function CostosView() {
  const sp = useSearchParams();
  const v = sp.get("v") === "recibos" ? "recibos" : "presupuesto";
  const router = useRouter();
  const params = useParams<{ obraId: string }>();
  const base = `/${params.obraId}/dashboard/costos`;

  return (
    <>
      <GroupTabs
        tabs={TABS}
        value={v}
        onSelect={(id) => router.replace(`${base}?v=${id}`)}
      />
      {v === "recibos" ? <ScreenRecibos key="recibos" /> : <ScreenPresupuesto key="presupuesto" />}
    </>
  );
}