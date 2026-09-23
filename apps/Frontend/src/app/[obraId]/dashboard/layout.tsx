"use client";

import { use, useState, useEffect, type ReactNode } from "react";
import { DashSidebar } from "@/app/[obraId]/dashboard/_components/DashSidebar";
import { DashTopBar } from "@/app/[obraId]/dashboard/_components/DashTopBar";
import { DashboardDataProvider, useDashboardData } from "@/app/[obraId]/dashboard/_components/DashboardDataContext";
import { QuickAddModal } from "@/app/[obraId]/dashboard/_components/QuickAddModal";
import { ChatBubble } from "@/app/[obraId]/dashboard/_components/ChatBubble";
import { useToast, DashToast } from "@/app/[obraId]/dashboard/_components/useToast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { getObra } from "@/services/projectsService";

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
        <LayoutInner obraId={obraId}>
          {children}
        </LayoutInner>
      </DashboardDataProvider>
    </ProtectedRoute>
  );
}

function LayoutInner({ children, obraId }: { children: ReactNode; obraId: string }) {
  const [quickAdd, setQuickAdd] = useState<string | null>(null);
  const [toast, flash] = useToast();
  const { setObraInfo, obraName } = useDashboardData();

  useEffect(() => {
    let cancelled = false;
    setObraInfo(obraId, "", 0);
    getObra(obraId)
      .then((obra) => {
        if (!cancelled) setObraInfo(obra.id, obra.name, obra.progress);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
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

      <QuickAddModal kind={quickAdd} obraId={obraId} onClose={() => setQuickAdd(null)} onDone={flash} />
      <DashToast msg={toast} />
      <ChatBubble obraId={obraId} obraNombre={obraName} />
    </>
  );
}
