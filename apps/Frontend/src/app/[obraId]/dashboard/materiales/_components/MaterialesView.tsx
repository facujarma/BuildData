"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Cubes3, Car } from "@gravity-ui/icons";
import { GroupTabs } from "../../_components/GroupTabs";
import { ScreenPedidos } from "../../pedidos/_components/ScreenPedidos";
import { ScreenStock } from "../../stock/_components/ScreenStock";
import { ScreenProveedores } from "../../proveedores/_components/ScreenProveedores";

const TABS = [
  { id: "pedidos", label: "Pedidos", icon: <Box width={13} height={13} /> },
  { id: "stock", label: "Stock", icon: <Cubes3 width={13} height={13} /> },
  { id: "proveedores", label: "Proveedores", icon: <Car width={13} height={13} /> },
];

export function MaterialesView() {
  const sp = useSearchParams();
  const raw = sp.get("v");
  const v = raw === "stock" ? "stock" : raw === "proveedores" ? "proveedores" : "pedidos";
  const router = useRouter();
  const params = useParams<{ obraId: string }>();
  const base = `/${params.obraId}/dashboard/materiales`;

  return (
    <>
      <GroupTabs
        tabs={TABS}
        value={v}
        onSelect={(id) => router.replace(`${base}?v=${id}`)}
      />
      {v === "pedidos" ? <ScreenPedidos key="pedidos" /> : v === "stock" ? <ScreenStock key="stock" /> : <ScreenProveedores key="proveedores" />}
    </>
  );
}