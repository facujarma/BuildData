"use client";

import { useEffect, useState } from "react";
import { NewOrderModal } from "./NewOrderModal";
import { createPedido, getObreros } from "@/services/pedidosService";
import { getRubrosDeObra } from "@/services/cronogramaService";
import { useDashboardData } from "@/app/[obraId]/dashboard/_components/DashboardDataContext";
import type { NewPedidoPayload, ObreroLite } from "@/services/pedidosService";

interface Props {
  obraId: string;
  onClose: () => void;
  onDone: (msg: string) => void;
}

export function NewOrderQuickModal({ obraId, onClose, onDone }: Props) {
  const { refreshDashboard } = useDashboardData();
  const [members, setMembers] = useState<ObreroLite[]>([]);
  const [rubros, setRubros] = useState<string[]>([]);

  useEffect(() => {
    getObreros(obraId).then(setMembers).catch(() => {});
    getRubrosDeObra(obraId)
      .then((r) => setRubros(r.map((x) => x.nombre)))
      .catch(() => {});
  }, [obraId]);

  const submit = async (payload: NewPedidoPayload) => {
    await createPedido(obraId, payload);
    refreshDashboard().catch(() => {});
    onDone("Pedido creado");
    onClose();
  };

  return <NewOrderModal onClose={onClose} onSubmit={submit} members={members} rubros={rubros} />;
}