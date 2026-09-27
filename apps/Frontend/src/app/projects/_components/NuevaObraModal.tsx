"use client";

import { useEffect, useState } from "react";
import { Xmark, ArrowRight, CircleExclamation, CircleInfo } from "@gravity-ui/icons";
import { Step1 } from "./Step1";
import { Step2 } from "./Step2";
import { Step3 } from "./Step3";
import { Step4 } from "./Step4";
import { Step5 } from "./Step5";
import { Step6 } from "./Step6";
import { SuccessState } from "./SuccessState";
import { DEFAULT_RUBROS, STEPS } from "@/app/projects/data/wizard";
import { createObra } from "@/services/projectsService";

const totalSteps = STEPS.length;

const makeRubros = () =>
  DEFAULT_RUBROS.map((name, i) => ({ id: "r" + i + "-" + Date.now(), name, amount: "" }));

const validateStep = (step: number, data: any): Record<string, string> => {
  const e: Record<string, string> = {};
  if (step === 1) {
    if (!data.name.trim()) e.name = "El nombre de la obra es obligatorio";
    else if (data.name.trim().length < 2) e.name = "El nombre debe tener al menos 2 caracteres";
    if (!data.type) e.type = "Seleccioná un tipo de obra";
  }
  if (step === 2) {
    if (!data.address.trim()) e.address = "La dirección es obligatoria";
  }
  if (step === 3) {
    return e;
  }
  if (step === 4) {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      e.endDate = "La fecha de fin no puede ser anterior al inicio";
    }
  }
  if (step === 5) {
    if (!data.client.name.trim()) e.clientName = "El nombre del cliente es obligatorio";
    if (data.client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.client.email)) {
      e.clientEmail = "El email no es válido";
    }
    if (data.client.phone && data.client.phone.replace(/[\s\-\(\)]/g, "").length < 8) {
      e.clientPhone = "El teléfono parece incompleto";
    }
  }
  if (step === 6) {
    const total = Number(data.budgetTotal) || 0;
    if (total <= 0) e.budgetTotal = "El presupuesto total debe ser mayor a cero";
    const hasNamedRubro = (data.rubros || []).some((r: any) => r.name.trim());
    if (!hasNamedRubro) e.rubros = "Agregá al menos un rubro con nombre";
    const sum = (data.rubros || []).reduce((a: number, r: any) => a + (Number(r.amount) || 0), 0);
    if (sum > total) e.budgetOver = "La suma de rubros supera el presupuesto total";
  }
  return e;
};

const INITIAL_DATA = {
  name: "",
  code: "",
  status: "planificacion",
  type: "",
  address: "",
  city: "",
  province: "",
  zip: "",
  country: "ar",
  team: [],
  teamRoles: {} as Record<string, string>,
  startDate: "",
  endDate: "",
  client: { name: "", contact: "", cuit: "", email: "", phone: "", notes: "" },
  budgetTotal: "",
  rubros: makeRubros(),
};

export function NuevaObraModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setStep(1); setData(INITIAL_DATA); setError(""); setErrors({}); setCreatedId(null); }
  }, [open]);

  const setDataAndClear = (d: any) => { setData(d); setErrors({}); };

  const handleNext = () => {
    const v = validateStep(step, data);
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setErrors({});
    if (step === totalSteps) handleCreate();
    else setStep(step + 1);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const mapped = {
        nombre: data.name,
        codigo: data.code,
        tipo: data.type,
        status: data.status,
        plantilla: "plantilla",
        direccion: data.address,
        ciudad: data.city,
        provincia: data.province,
        zip: data.zip,
        pais: data.country,
        inicio: data.startDate,
        fin: data.endDate,
        team: [],
        waConnect: false,
        presupuestoTotal: Number(data.budgetTotal) || 0,
        rubros: (data.rubros || [])
          .filter((r) => r.name.trim())
          .map((r) => ({ nombre: r.name.trim(), presupuesto: Number(r.amount) || 0 })),
        clientName: data.client.name,
        clientContact: data.client.contact,
        clientCuit: data.client.cuit,
        clientEmail: data.client.email,
        clientPhone: data.client.phone,
        clientNotes: data.client.notes,
      };
      const created = await createObra(mapped);
      setCreatedId(created?.id ? String(created.id) : null);
      setStep(step + 1);
    } catch (e: any) {
      setError(e.message || "Error al crear obra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  const budgetTotal = Number(data.budgetTotal) || 0;
  const budgetSum = (data.rubros || []).reduce((a: number, r: any) => a + (Number(r.amount) || 0), 0);

  const canNext = (() => {
    if (step === 1) return !!(data.name.trim() && data.type);
    if (step === 2) return !!data.address.trim();
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return !!(data.client.name.trim());
    if (step === 6) {
      const hasNamedRubro = (data.rubros || []).some((r) => r.name.trim());
      return budgetTotal > 0 && hasNamedRubro && budgetSum <= budgetTotal;
    }
    return false;
  })();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-[900px] max-h-[calc(100vh-32px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-in" onClick={(e) => e.stopPropagation()}>

        {step > totalSteps ? (
          <SuccessState data={data} obraId={createdId} onClose={onClose} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div>
                  <div className="text-[15px] font-extrabold display-tight">Crear nueva obra</div>
                  <div className="text-[11px] text-slate-500">Paso {step} de {totalSteps} · {STEPS[step - 1].label}</div>
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center">
                <Xmark width={16} height={16} />
              </button>
            </div>

            {/* Body with vertical rail */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left rail */}
              <div className="w-[220px] bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-1 flex-none">
                {STEPS.map((s) => {
                  const isDone = s.id < step;
                  const isCurrent = s.id === step;
                  return (
                    <button key={s.id} type="button" onClick={() => isDone && setStep(s.id)}
                      className={`flex items-start gap-3 px-3 py-[10px] rounded-md text-left transition-colors
                        ${isCurrent ? "bg-white shadow-card border border-slate-200" : "border border-transparent"}
                        ${isDone ? "hover:bg-white cursor-pointer" : !isCurrent ? "opacity-60 cursor-default" : ""}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-none
                        ${isDone ? "bg-success text-white" : isCurrent ? "bg-primary text-white" : "bg-slate-200 text-slate-600"}`}>
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : s.id}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-[12px] font-bold leading-tight ${isCurrent ? "text-slate-950" : "text-slate-700"}`}>{s.label}</div>
                        <div className="text-[10px] text-slate-500 leading-snug mt-[1px]">{s.sub}</div>
                      </div>
                    </button>
                  );
                })}

                <div className="mt-auto pt-3">
                  <div className="bg-white border border-slate-200 rounded-md p-3 text-[11px] text-slate-600 leading-snug">
                    <div className="flex items-center gap-1 font-bold text-slate-950 mb-1">
                      <CircleInfo width={12} height={12} className="text-primary" /> Podés editar todo después.
                    </div>
                    Ningún paso es definitivo. Cambiás equipo, fechas o cronograma cuando quieras.
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {step === 1 && <Step1 data={data} setData={setDataAndClear} errors={errors} />}
                {step === 2 && <Step2 data={data} setData={setDataAndClear} errors={errors} />}
                {step === 3 && <Step3 />}
                {step === 4 && <Step4 data={data} setData={setDataAndClear} errors={errors} />}
                {step === 5 && <Step5 data={data} setData={setDataAndClear} errors={errors} />}
                {step === 6 && <Step6 data={data} setData={setDataAndClear} errors={errors} />}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-3 flex items-center justify-between bg-slate-50 flex-none">
              <button onClick={onClose}
                className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]">
                Cancelar
              </button>
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button onClick={() => setStep(step - 1)}
                    className="text-[13px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md px-4 py-[9px]">
                    Atrás
                  </button>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-critical">
                    <CircleExclamation width={14} height={14} />
                    {error}
                  </div>
                )}
                <button onClick={handleNext} disabled={!canNext || loading}
                  className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors
                    ${canNext && !loading ? "bg-primary hover:bg-primary-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`}>
                  {loading ? "Creando..." : step === totalSteps ? <>Crear obra <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></> : <>Siguiente <ArrowRight width={14} height={14} /></>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
