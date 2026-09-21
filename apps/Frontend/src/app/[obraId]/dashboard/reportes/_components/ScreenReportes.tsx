"use client";

import { useState, useEffect } from "react";
import {
  ChartBar,
  FileArrowDown,
  Calendar,
  CircleExclamation,
  Box,
  LayoutHeaderCellsLarge,
  Envelope,
  LayoutSideContent,
  ArrowUpRightFromSquare,
  Check,
  Xmark,
  ArrowRight,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import { DCard } from "@/components/ui/DCard";
import Button from "@/components/ui/Button";
import { getReportesData, type ReportesData } from "@/services/mock/reportesService";
import { SECTION_DEFS, RANGE_LABELS } from "../data";
import { formatDateLong } from "@/lib/format";

const SECTION_ICONS: Record<string, typeof ChartBar> = {
  resumen: ChartBar,
  avance: ArrowUpRightFromSquare,
  presupuesto: FileArrowDown,
  cronograma: Calendar,
  alertas: CircleExclamation,
  pedidos: Box,
  stock: LayoutHeaderCellsLarge,
  recibos: FileArrowDown,
  equipo: LayoutSideContent,
  actividad: Envelope,
};

const RANGES = ["semana", "mes", "trimestre", "total"];

export function ScreenReportes() {
  const [data, setData] = useState<ReportesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("mes");
  const [selected, setSelected] = useState<Set<string>>(new Set(SECTION_DEFS.map((s) => s.id)));
  const [generation, setGeneration] = useState<null | "loading" | "ready">(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReportesData().then((d) => {
      if (!cancelled) {
        setData(d);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-semibold">Cargando…</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const snapshot = data.snapshot;
  const allSelected = selected.size === SECTION_DEFS.length;
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(SECTION_DEFS.map((s) => s.id)));
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = () => {
    if (!someSelected) return;
    setGeneration("loading");
    setTimeout(() => setGeneration("ready"), 1800);
  };

  const handleDownload = () => {
    setGeneration(null);
    setToast("Reporte descargado");
    setTimeout(() => setToast(null), 2400);
  };

  const genDate = formatDateLong(new Date());

  return (
    <>
      <DPageHeader
        title="Reporte de obra"
        right={
          <Button variant="primary" size="sm" icon={<FileArrowDown width={13} height={13} />}>
            Generar reporte
          </Button>
        }
      />

      <div className="grid grid-cols-[1fr_360px] gap-4">
        <div>
          <DCard padding="p-0" className="overflow-hidden">
            <div className="blueprint-bg p-7 text-white">
              <div className="flex items-center gap-2 mb-1">
                <svg width="18" height="18" viewBox="0 0 56 56" fill="none">
                  <rect width="56" height="56" rx="12" fill="#F59E0B" />
                  <rect x="11" y="30" width="9" height="18" rx="2" fill="#FFFFFF" fillOpacity="0.65" />
                  <rect x="23" y="20" width="9" height="28" rx="2" fill="#FFFFFF" />
                  <rect x="35" y="10" width="9" height="38" rx="2" fill="#FFFFFF" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">
                  BuildData
                </span>
              </div>
              <div className="text-[12px] text-white/50 mt-2">
                Reporte de obra · {RANGE_LABELS[range]}
              </div>
              <div className="text-[20px] font-extrabold display-tight mt-1">{snapshot.obra}</div>
              <div className="text-[11px] text-white/60 mt-[2px]">{snapshot.code}</div>
              <div className="text-[10px] text-white/40 mt-1">Generado el {genDate}</div>

              <div className="grid grid-cols-4 gap-4 mt-6">
                <div>
                  <div className="text-[22px] font-extrabold display-tight tnum leading-none">
                    {snapshot.avance}%
                  </div>
                  <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/50 mt-1">
                    Avance
                  </div>
                </div>
                <div>
                  <div className="text-[22px] font-extrabold display-tight tnum leading-none">
                    AR$ {snapshot.ejecutado} M
                  </div>
                  <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/50 mt-1">
                    Ejecutado
                  </div>
                </div>
                <div>
                  <div className="text-[22px] font-extrabold display-tight tnum leading-none">
                    {snapshot.alertas}
                  </div>
                  <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/50 mt-1">
                    Alertas
                  </div>
                </div>
                <div>
                  <div className="text-[22px] font-extrabold display-tight tnum leading-none">
                    {snapshot.equipo}
                  </div>
                  <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/50 mt-1">
                    Equipo
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-1.5">
              {SECTION_DEFS.map((s, i) => {
                const Icon = SECTION_ICONS[s.id] || ChartBar;
                return (
                  <div key={s.id} className="flex items-center gap-3 py-1.5">
                    <span className="w-5 text-right text-[11px] font-bold text-slate-400 tnum flex-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center flex-none">
                      <Icon width={14} height={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-slate-950">{s.label}</div>
                      <div className="text-[10px] text-slate-500">{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DCard>
        </div>

        <div className="space-y-4">
          <DCard padding="p-4">
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">
              Período
            </div>
            <div className="flex gap-1.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-md transition-colors ${
                    range === r
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {r === "semana" ? "Semana" : r === "mes" ? "Mes" : r === "trim" ? "Trimestre" : "Total"}
                </button>
              ))}
            </div>
          </DCard>

          <DCard padding="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500">
                Secciones
              </div>
              <button
                onClick={toggleAll}
                className="text-[10px] font-bold text-primary hover:text-primary-700 transition-colors"
              >
                {allSelected ? "Ninguna" : "Todas"}
              </button>
            </div>
            <div className="space-y-1.5">
              {SECTION_DEFS.map((s) => {
                const checked = selected.has(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex items-center gap-2.5 cursor-pointer py-1"
                  >
                    <div
                      onClick={() => toggle(s.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        checked
                          ? "bg-primary border-primary text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {checked && <Check width={10} height={10} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-800">{s.label}</div>
                      <div className="text-[10px] text-slate-400">{s.sub}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </DCard>

          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              className="justify-center"
              icon={<FileArrowDown width={13} height={13} />}
              disabled={!someSelected}
              onClick={handleGenerate}
            >
              Generar reporte
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="justify-center"
                icon={<Envelope width={13} height={13} />}
              >
                Enviar por email
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-center"
                icon={<ArrowRight width={13} height={13} />}
              >
                Compartir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {generation === "loading" && (
        <>
          <div className="fixed inset-0 z-[55] bg-slate-950/30 backdrop-blur-[2px]" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-big w-full max-w-[340px] animate-modal-pop p-8 text-center">
              <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-[15px] font-bold text-slate-950">Generando reporte…</div>
              <div className="text-[12px] text-slate-500 mt-1">Esto puede tomar unos segundos</div>
            </div>
          </div>
        </>
      )}

      {generation === "ready" && (
        <>
          <div onClick={() => setGeneration(null)} className="fixed inset-0 z-[55] bg-slate-950/30 backdrop-blur-[2px]" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-big w-full max-w-[380px] animate-modal-pop overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-success-50 text-success flex items-center justify-center mx-auto mb-4">
                  <Check width={22} height={22} />
                </div>
                <div className="text-[16px] font-extrabold text-slate-950">Reporte listo</div>
                <div className="text-[12px] text-slate-500 mt-1">
                  {snapshot.obra} · {RANGE_LABELS[range]}
                </div>
                <div className="mt-4 bg-slate-50 rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                  <FileArrowDown width={18} height={18} className="text-primary" />
                  <div className="text-left">
                    <div className="text-[12px] font-bold text-slate-950">reporte-{snapshot.code.toLowerCase()}.pdf</div>
                    <div className="text-[10px] text-slate-500">1.2 MB</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-200 p-3 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 justify-center" onClick={() => setGeneration(null)}>
                  <Xmark width={13} height={13} />
                  Cerrar
                </Button>
                <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={handleDownload}>
                  <FileArrowDown width={13} height={13} />
                  Descargar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop animate-toast-in">
          <Check width={14} height={14} className="text-success" />
          {toast}
        </div>
      )}
    </>
  );
}
