"use client";

import { useSearchParams } from "next/navigation";
import { ScreenPedidos } from "../../pedidos/_components/ScreenPedidos";
import { ScreenStock } from "../../stock/_components/ScreenStock";
import { ScreenProveedores } from "../../proveedores/_components/ScreenProveedores";

export function MaterialesView() {
  const sp = useSearchParams();
  const raw = sp.get("v");
  const v = raw === "stock" ? "stock" : raw === "proveedores" ? "proveedores" : "pedidos";

  return (
    <>
      {v === "pedidos" ? <ScreenPedidos key="pedidos" /> : v === "stock" ? <ScreenStock key="stock" /> : <ScreenProveedores key="proveedores" />}
    </>
  );
}
