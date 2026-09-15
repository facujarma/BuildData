"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Picture,
  Calendar,
  Layers,
  Clock,
  Persons,
  Envelope,
  FileArrowDown,
  CloudArrowUpIn,
  Xmark,
  ChevronRight,
  Check,
} from "@gravity-ui/icons";
import { DPageHeader } from "../../_components/DPageHeader";
import DButton from "@/components/ui/Button";
import { DAvatar } from "@/components/ui/DAvatar";
import { getGaleria } from "@/services/mock/galeriaService";
import { RUBRO_COLORS } from "../data";
import type { GalleryPhoto } from "@/types/gallery";

function PhotoThumb({ p, h = 128 }: { p: GalleryPhoto; h?: number }) {
  return (
    <div className="relative w-full overflow-hidden rounded-md" style={{ height: h, background: p.tone + "1f" }}>
      <svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <rect width="200" height="130" fill={p.tone} opacity="0.10" />
        {[...Array(7)].map((_, i) => <line key={"h" + i} x1="0" x2="200" y1={i * 20} y2={i * 20} stroke={p.tone} strokeOpacity="0.13" strokeWidth="1" />)}
        {[...Array(11)].map((_, i) => <line key={"v" + i} x1={i * 20} x2={i * 20} y1="0" y2="130" stroke={p.tone} strokeOpacity="0.13" strokeWidth="1" />)}
        <rect x="46" y="66" width="26" height="46" rx="2" fill={p.tone} opacity="0.55" />
        <rect x="80" y="46" width="26" height="66" rx="2" fill={p.tone} opacity="0.8" />
        <rect x="114" y="32" width="26" height="80" rx="2" fill={p.tone} />
        <rect x="114" y="32" width="26" height="12" rx="2" fill="#F59E0B" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white/70"><Picture width={20} height={20} /></span>
      {p.flag && (
        <span className="absolute top-2 left-2 text-[8px] font-bold tracking-wider uppercase bg-white/90 text-slate-700 rounded px-[5px] py-[2px]">{p.flag}</span>
      )}
      <span className="absolute bottom-2 right-2 text-[9px] font-bold text-white bg-slate-950/55 rounded px-[5px] py-[2px] tnum">{p.time}</span>
    </div>
  );
}

export function ScreenGaleria() {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [group, setGroup] = useState<"fecha" | "tarea">("fecha");
  const [fRubro, setFRubro] = useState("Todos");
  const [pick, setPick] = useState<GalleryPhoto | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  useEffect(() => {
    let cancelled = false;
    getGaleria().then((d) => { if (!cancelled) { setPhotos(d.photos); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const list = photos.filter((p) => fRubro === "Todos" || p.rubro === fRubro);
  const key = (p: GalleryPhoto) => (group === "fecha" ? p.date : p.task);
  const groups = list.reduce<Record<string, GalleryPhoto[]>>((acc, p) => {
    (acc[key(p)] = acc[key(p)] || []).push(p);
    return acc;
  }, {});

  const rubroOpts = ["Todos", ...Object.keys(RUBRO_COLORS)];
  const idx = list.findIndex((p) => pick && p.id === pick.id);
  const go = (d: number) => { const n = idx + d; if (n >= 0 && n < list.length) setPick(list[n]); };

  useEffect(() => {
    if (!pick) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPick(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <div><div className="shimmer h-7 w-48 rounded-md" /><div className="shimmer h-4 w-56 rounded-md mt-2" /></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-0 overflow-hidden"><div className="shimmer h-[128px] w-full" /><div className="p-3"><div className="shimmer h-4 w-24 rounded" /></div></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <DPageHeader
        title="Galería de obra"
        subtitle={`${photos.length} fotos · asociadas a su tarea, rubro, fecha y autor`}
        right={
          <>
            <DButton variant="secondary" size="sm" icon={<FileArrowDown width={13} height={13} />} onClick={() => flash("Exportando galería…")}>Exportar</DButton>
            <DButton variant="primary" size="sm" icon={<CloudArrowUpIn width={13} height={13} />} onClick={() => flash("Subiendo fotos…")}>Subir fotos</DButton>
          </>
        }
      />

      <div className="flex items-start gap-3 bg-info-50 border border-[#BFDBFE] rounded-lg p-3 mb-4">
        <span className="w-8 h-8 rounded-md bg-info text-white flex items-center justify-center flex-none"><Picture width={15} height={15} /></span>
        <div className="text-[12px] text-slate-700 leading-snug flex-1">
          <b className="text-slate-950">Las fotos que el equipo manda por WhatsApp llegan acá etiquetadas.</b> Sirven como evidencia de avance para certificaciones y reclamos: cada una guarda su tarea, fecha, hora y quién la tomó.
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap border-b border-slate-200">
        <div className="flex gap-1 flex-wrap">
          {([["fecha", "Por fecha"], ["tarea", "Por tarea"]] as const).map(([id, l]) => {
            const on = group === id;
            return (
              <button key={id} onClick={() => setGroup(id)}
                className={`flex items-center gap-2 text-[12px] font-bold px-[14px] py-3 -mb-[1px] border-b-2 transition-colors ${on ? "text-primary border-primary" : "text-slate-500 border-transparent hover:text-slate-700"}`}>
                {l}
                <span className={`text-[10px] font-bold px-[6px] py-[2px] rounded-full ${on ? "bg-primary-50 text-primary" : "bg-slate-100 text-slate-700"}`}>
                  {Object.keys(list.reduce<Record<string, number>>((a, p) => { a[id === "fecha" ? p.date : p.task] = 1; return a; }, {})).length}
                </span>
              </button>
            );
          })}
        </div>
        <select value={fRubro} onChange={(e) => setFRubro(e.target.value)}
          className="text-[11px] font-semibold bg-white border border-slate-200 rounded-md px-2 py-[6px] mb-2 focus:outline-none focus:border-primary flex-none">
          {rubroOpts.map((r) => <option key={r} value={r}>{r === "Todos" ? "Todos los rubros" : r}</option>)}
        </select>
      </div>

      {Object.keys(groups).length === 0 ? (
        <div className="text-center text-slate-500 py-12 text-[13px] border border-dashed border-slate-200 rounded-lg">No hay fotos con ese filtro.</div>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(groups).map(([g, ps]) => (
            <div key={g}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center flex-none">
                  {group === "fecha" ? <Calendar width={12} height={12} /> : <Layers width={12} height={12} />}
                </span>
                <span className="text-[11px] tracking-[0.06em] uppercase font-bold text-slate-600">{g}</span>
                <span className="text-[11px] text-slate-400">· {ps.length} foto{ps.length === 1 ? "" : "s"}</span>
                {group === "tarea" && (
                  <span className="text-[10px] font-bold px-[6px] py-[2px] rounded flex items-center gap-[5px]"
                    style={{ background: (RUBRO_COLORS[ps[0].rubro] || "#94A3B8") + "22", color: RUBRO_COLORS[ps[0].rubro] || "#64748B" }}>
                    {ps[0].rubro}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {ps.map((p) => (
                  <button key={p.id} onClick={() => setPick(p)}
                    className="text-left bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-primary hover:shadow-card2 transition-all group">
                    <PhotoThumb p={p} />
                    <div className="p-3">
                      <div className="text-[12px] font-bold text-slate-950 truncate group-hover:text-primary transition-colors">{p.task}</div>
                      <div className="text-[10px] text-slate-500 mt-[2px] flex items-center gap-[6px]">
                        <DAvatar initials={p.who.split(" ").map((w) => w[0]).join("").replace(".", "")} size={16} />
                        {p.who} · {group === "fecha" ? p.time : p.date}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pick && (
        <div onClick={() => setPick(null)} className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-task">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[860px] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop max-h-[calc(100vh-48px)]">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-none">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: pick.tone }} />
                <span className="text-[13px] font-bold text-slate-950 truncate">{pick.task}</span>
                <span className="text-[11px] text-slate-500 flex-none">· {pick.id}</span>
              </div>
              <div className="flex items-center gap-1 flex-none">
                <button onClick={() => go(-1)} disabled={idx <= 0}
                  className={`w-8 h-8 rounded-md flex items-center justify-center ${idx <= 0 ? "text-slate-300" : "text-slate-600 hover:bg-slate-100"}`}><ChevronRight width={14} height={14} className="rotate-180" /></button>
                <span className="text-[11px] text-slate-500 tnum px-1">{idx + 1}/{list.length}</span>
                <button onClick={() => go(1)} disabled={idx >= list.length - 1}
                  className={`w-8 h-8 rounded-md flex items-center justify-center ${idx >= list.length - 1 ? "text-slate-300" : "text-slate-600 hover:bg-slate-100"}`}><ChevronRight width={14} height={14} /></button>
                <button onClick={() => setPick(null)} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center ml-1"><Xmark width={16} height={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_260px] flex-1 min-h-0">
              <div className="bg-slate-100 p-4 flex items-center justify-center min-h-0">
                <div className="w-full max-w-[440px]"><PhotoThumb p={pick} h={300} /></div>
              </div>
              <div className="border-l border-slate-200 p-4 overflow-y-auto">
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-3">Datos de la foto</div>
                <div className="space-y-3">
                  {([
                    ["Tarea", pick.task, <Calendar key="c" width={12} height={12} />],
                    ["Rubro", pick.rubro, <Layers key="l" width={12} height={12} />],
                    ["Fecha", pick.date + " · " + pick.time, <Clock key="t" width={12} height={12} />],
                    ["Tomada por", pick.who, <Persons key="u" width={12} height={12} />],
                    ["Origen", "WhatsApp", <Envelope key="e" width={12} height={12} />],
                  ] as [string, string, ReactNode][]).map(([l, v, ic]) => (
                    <div key={l} className="flex items-start gap-2">
                      <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center flex-none">{ic}</span>
                      <div className="min-w-0">
                        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500">{l}</div>
                        <div className="text-[12px] font-semibold text-slate-950">{v}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {pick.note && (
                  <div className="mt-4">
                    <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-1">Nota</div>
                    <div className="text-[12px] text-slate-700 leading-snug bg-slate-50 border border-slate-200 rounded p-2">{pick.note}</div>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <DButton variant="secondary" size="sm" icon={<Calendar width={12} height={12} />} onClick={() => flash("Abriendo cronograma…")}>Ver tarea</DButton>
                  <DButton variant="secondary" size="sm" icon={<FileArrowDown width={12} height={12} />} onClick={() => flash("Descargando…")}>Descargar</DButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-slate-950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop">
          <Check width={14} height={14} className="text-success" /> {toast}
        </div>
      )}
    </>
  );
}