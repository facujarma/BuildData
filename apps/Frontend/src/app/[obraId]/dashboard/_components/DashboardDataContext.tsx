"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import type { TaskItem } from "@/types/dashboard";

interface RubroInfo {
  id: string;
  name: string;
}

interface LookupData {
  rubros: RubroInfo[];
  rubroMap: Record<string, string>;
  tasks: TaskItem[];
  workers: string[];
}

interface ContextValue {
  data: LookupData;
  setLookupData: (data: LookupData) => void;
  refreshDashboard: () => Promise<void>;
  setRefreshDashboardRef: (fn: () => Promise<void>) => void;
  obraId: string;
  obraName: string;
  obraProgress: number;
  setObraInfo: (id: string, name: string, progress: number) => void;
  operacionesPendientes: number;
  setOperacionesPendientes: (n: number) => void;
}

const noop = async () => {};

const DashboardDataContext = createContext<ContextValue>({
  data: { rubros: [], rubroMap: {}, tasks: [], workers: [] },
  setLookupData: () => {},
  refreshDashboard: noop,
  setRefreshDashboardRef: () => {},
  obraId: "",
  obraName: "",
  obraProgress: 0,
  setObraInfo: () => {},
  operacionesPendientes: 0,
  setOperacionesPendientes: () => {},
});

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LookupData>({ rubros: [], rubroMap: {}, tasks: [], workers: [] });
  const setLookupData = useCallback((d: LookupData) => setData(d), []);

  const refreshRef = useRef<() => Promise<void>>(noop);
  const refreshDashboard = useCallback(async () => refreshRef.current(), []);
  const setRefreshDashboardRef = useCallback((fn: () => Promise<void>) => {
    refreshRef.current = fn;
  }, []);

  const [obraId, setObraId] = useState("");
  const [obraName, setObraName] = useState("");
  const [obraProgress, setObraProgress] = useState(0);
  const [operacionesPendientes, setOperacionesPendientes] = useState(0);
  const setObraInfo = useCallback((id: string, name: string, progress: number) => {
    setObraId(id);
    setObraName(name);
    setObraProgress(progress);
  }, []);

  return (
    <DashboardDataContext.Provider value={{ data, setLookupData, refreshDashboard, setRefreshDashboardRef, obraId, obraName, obraProgress, setObraInfo, operacionesPendientes, setOperacionesPendientes }}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  return useContext(DashboardDataContext);
}
