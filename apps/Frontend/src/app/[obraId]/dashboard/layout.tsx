"use client";

import { use, useState, useEffect, type ReactNode } from "react";
import { DashSidebar } from "@/app/[obraId]/dashboard/_components/DashSidebar";
import { DashTopBar } from "@/app/[obraId]/dashboard/_components/DashTopBar";
import { DashboardDataProvider, useDashboardData } from "@/app/[obraId]/dashboard/_components/DashboardDataContext";
import { QuickAddProvider } from "@/app/[obraId]/dashboard/_components/QuickAddContext";
import { QuickAddModal } from "@/app/[obraId]/dashboard/_components/QuickAddModal";
import { NuevaTareaModal } from "@/app/[obraId]/dashboard/cronograma/_components/NuevaTareaModal";
import { NewOrderQuickModal } from "@/app/[obraId]/dashboard/pedidos/_components/NewOrderQuickModal";
import { ChatBubble } from "@/app/[obraId]/dashboard/_components/ChatBubble";
import { useToast, DashToast } from "@/app/[obraId]/dashboard/_components/useToast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = use(params);

  return (
    <ProtectedRoute>
      <DashboardDataProvider>
      <QuickAddProvider>
        <LayoutInner obraId={obraId}>
          {children}
        </LayoutInner>
      </QuickAddProvider>
      </DashboardDataProvider>
    </ProtectedRoute>
  );
}

function LayoutInner({ children, obraId }: { children: ReactNode; obraId: string }) {
  const [quickAdd, setQuickAdd] = useState<string | null>(null);
  const [toast, flash] = useToast();
  const { setObraInfo, refreshDashboard } = useDashboardData();

  useEffect(() => {
    setObraInfo(obraId, "", 0);
  }, [obraId, setObraInfo]);

  return (
    <>
      <div className="flex h-screen bg-paper">
        <DashSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <DashTopBar onQuickAdd={setQuickAdd} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-[1100px] mx-auto">{children}</div>
          </main>
        </div>
      </div>

      {quickAdd === "tarea" ? (
        <NuevaTareaModal
          open
          obraId={obraId}
          onClose={() => setQuickAdd(null)}
          onCreate={() => { setQuickAdd(null); refreshDashboard().catch(() => {}); }}
        />
      ) : quickAdd === "pedido" ? (
        <NewOrderQuickModal
          obraId={obraId}
          onClose={() => setQuickAdd(null)}
          onDone={flash}
        />
      ) : (
        <QuickAddModal kind={quickAdd} obraId={obraId} onClose={() => setQuickAdd(null)} onDone={flash} />
      )}
      <DashToast msg={toast} />
      {/* <ChatBubble /> */}
    </>
  );
}
