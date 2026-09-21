"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Picture, CloudArrowUpIn, Magnifier, ChevronDown, Check, Xmark } from "@gravity-ui/icons";
import { getCronograma } from "@/services/cronogramaService";
import { RUBRO_COLORS, TASK_STATE_MAP, FALLBACK_RUBRO_COLOR } from "../cronograma/data";
import type { TaskItem } from "../cronograma/data";

interface Props {
  obraId: string;
  onClose: () => void;
  onDone: (msg: string) => void;
}

export function UploadPhotosModal({ obraId, onClose, onDone }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [task, setTask] = useState("");
  const [note, setNote] = useState("");
  const [drag, setDrag] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskQ, setTaskQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const taskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getCronograma(obraId)
      .then((d) => {
        if (active) setTasks(d.groups.flatMap((g) => g.items));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [obraId]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (taskOpen) setTaskOpen(false); else onClose(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose, taskOpen]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (taskRef.current && !taskRef.current.contains(e.target as Node)) setTaskOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const addFiles = (names: string[]) => {
    setFiles((p) => [...p, ...names.filter(Boolean)]);
  };

  const canSave = files.length > 0;

  const submit = () => {
    if (!canSave) return;
    onDone(`${files.length} ${files.length === 1 ? "foto subida" : "fotos subidas"} a la galería`);
    onClose();
  };

  const grouped = useMemo(() => {
    const filtered = tasks.filter((t) => !taskQ || (t.name + " " + t.rubro).toLowerCase().includes(taskQ.toLowerCase()));
    return filtered.reduce<Record<string, TaskItem[]>>((acc, t) => {
      (acc[t.rubro] = acc[t.rubro] || []).push(t);
      return acc;
    }, {});
  }, [tasks, taskQ]);

  const selected = tasks.find((t) => t.id === task);

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task">
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[520px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-info-50 text-[#1D4ED8] flex items-center justify-center"><Picture width={16} height={16} /></div>
            <div>
              <div className="text-[15px] font-extrabold display-tight">Subir fotos</div>
              <div className="text-[11px] text-slate-500">Quedan asociadas a la tarea, el rubro y la fecha</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center"><Xmark width={16} height={16} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(Array.from(e.target.files || []).map((f) => f.name));
              e.target.value = "";
            }}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              addFiles(Array.from(e.dataTransfer.files).map((f) => f.name));
            }}
            onClick={() => inputRef.current?.click()}
            className={"border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors " + (drag ? "border-primary bg-primary-50/40" : "border-slate-300 hover:border-slate-400")}
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2"><CloudArrowUpIn width={18} height={18} /></div>
            <div className="text-[13px] font-bold text-slate-700">Arrastrá las fotos acá</div>
            <div className="text-[11px] text-slate-500 mt-1">JPG o PNG · o hacé clic para elegir</div>
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-[6px] bg-slate-50 border border-slate-200 rounded-lg pl-2 pr-1 py-[5px]">
                  <Picture width={12} height={12} className="text-slate-500" />
                  <span className="text-[11px] font-semibold text-slate-700 max-w-[140px] truncate">{f}</span>
                  <button onClick={() => setFiles((p) => p.filter((_, k) => k !== i))} className="text-slate-400 hover:text-[#B91C1C] p-1"><Xmark width={11} height={11} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Tarea asociada</span>
            <div className="relative" ref={taskRef}>
              <button
                type="button"
                onClick={() => { setTaskOpen((o) => !o); setTaskQ(""); }}
                className={"w-full flex items-center gap-2 bg-white border rounded-md px-3 py-[9px] text-[13px] text-left transition-colors " + (taskOpen ? "border-primary" : "border-slate-200 hover:border-slate-300")}
              >
                {selected ? (
                  <>
                    <span className="w-2 h-2 rounded-full flex-none" style={{ background: RUBRO_COLORS[selected.rubro] || FALLBACK_RUBRO_COLOR }} />
                    <span className="flex-1 min-w-0 truncate font-semibold text-slate-950">{selected.name}</span>
                    <span className="text-[11px] text-slate-500 flex-none hidden sm:block">{selected.rubro}</span>
                  </>
                ) : (
                  <span className="flex-1 text-slate-500">Sin tarea asignada</span>
                )}
                <ChevronDown width={12} height={12} className={"text-slate-400 flex-none transition-transform " + (taskOpen ? "rotate-180" : "")} />
              </button>

              {taskOpen && (
                <div className="absolute left-0 right-0 top-[44px] z-50 bg-white border border-slate-200 rounded-lg shadow-pop overflow-hidden animate-fade-task">
                  <div className="p-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2 py-[6px] focus-within:border-primary transition-colors">
                      <Magnifier width={13} height={13} className="text-slate-400 flex-none" />
                      <input
                        autoFocus
                        value={taskQ}
                        onChange={(e) => setTaskQ(e.target.value)}
                        placeholder="Buscar tarea…"
                        className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[12px] text-slate-950 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setTask(""); setTaskOpen(false); }}
                      className={"w-full flex items-center gap-2 px-3 py-[8px] text-left hover:bg-slate-50 " + (!task ? "bg-primary-50" : "")}
                    >
                      <span className="w-2 h-2 rounded-full border border-slate-300 flex-none" />
                      <span className="text-[12px] font-semibold text-slate-600">Sin tarea asignada</span>
                    </button>
                    {Object.entries(grouped).map(([rubro, items]) => (
                      <div key={rubro}>
                        <div className="px-3 pt-2 pb-1 text-[9px] tracking-[0.08em] uppercase font-bold text-slate-400 flex items-center gap-[6px] sticky top-0 bg-white">
                          <span className="w-[6px] h-[6px] rounded-full flex-none" style={{ background: RUBRO_COLORS[rubro] || FALLBACK_RUBRO_COLOR }} />
                          {rubro}
                        </div>
                        {items.map((t) => {
                          const st = TASK_STATE_MAP[t.state] || TASK_STATE_MAP.planned;
                          const on = task === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => { setTask(t.id); setTaskOpen(false); }}
                              className={"w-full flex items-center gap-2 px-3 py-[8px] text-left hover:bg-slate-50 " + (on ? "bg-primary-50" : "")}
                            >
                              <span className="w-[6px] h-[6px] rounded-full flex-none" style={{ background: st.dot }} />
                              <span className="flex-1 min-w-0 text-[12px] font-semibold text-slate-900 truncate">{t.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 tnum flex-none">{t.pct}%</span>
                              {on && <Check width={12} height={12} className="text-primary flex-none" />}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                    {Object.keys(grouped).length === 0 && (
                      <div className="px-3 py-6 text-center text-[12px] text-slate-400">Sin resultados</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[11px] font-bold text-slate-700">Nota</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Qué muestran las fotos, observaciones…"
              className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[58px]"
            />
          </label>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 flex-none">
          <button onClick={onClose} className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">Cancelar</button>
          <button
            onClick={submit}
            disabled={!canSave}
            className={"inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " + (canSave ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed")}
          >
            <Check width={14} height={14} /> Subir {files.length > 0 ? files.length : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
