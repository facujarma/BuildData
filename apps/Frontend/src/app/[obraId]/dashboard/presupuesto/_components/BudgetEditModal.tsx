"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleDollar,
  TriangleExclamation,
  Xmark,
} from "@gravity-ui/icons";
import { CURRENCIES, formatMoney, rubroColor, type BudgetLine, type CurrencyKey } from "../data";

export interface BudgetAuditEntry {
  at: string;
  by: string;
  what: string;
  reason: string;
}

interface DraftLine {
  name: string;
  cap: number | "";
  spent: number;
  comp: number;
}

interface Props {
  lines: BudgetLine[];
  cur: CurrencyKey;
  onClose: () => void;
  onCommit: (next: BudgetLine[]) => void;
  onLog: (entry: BudgetAuditEntry) => void;
}

export function BudgetEditModal({ lines, cur, onClose, onCommit, onLog }: Props) {
  const [draft, setDraft] = useState<DraftLine[]>(() => lines.map((l) => ({ ...l })));
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [ack, setAck] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const fmtM = (m: number) => formatMoney(m, cur);

  const setCap = (i: number, v: string) =>
    setDraft((prev) =>
      prev.map((l, idx) =>
        idx === i ? { ...l, cap: v === "" ? "" : Math.max(0, parseFloat(v) || 0) } : l,
      ),
    );

  const oldTotal = lines.reduce((a, l) => a + l.cap, 0);
  const newTotal = draft.reduce((a, l) => a + (parseFloat(String(l.cap)) || 0), 0);
  const delta = newTotal - oldTotal;

  const changes = draft
    .map((l, i) => ({
      name: l.name,
      from: lines[i].cap,
      to: parseFloat(String(l.cap)) || 0,
      spent: l.spent,
      comp: l.comp,
    }))
    .filter((ch) => ch.from !== ch.to);

  const errors = changes.filter((ch) => ch.to < ch.spent);
  const warns = changes.filter((ch) => ch.to >= ch.spent && ch.to < ch.spent + ch.comp);
  const bigDrops = changes.filter((ch) => ch.from > 0 && ch.to < ch.from * 0.75);

  const canReview = changes.length > 0 && errors.length === 0;
  const canCommit = canReview && reason.trim().length >= 10 && ack;

  const commit = () => {
    if (!canCommit) return;
    onCommit(draft.map((l) => ({ ...l, cap: parseFloat(String(l.cap)) || 0 })));
    onLog({
      at:
        new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) +
        " " +
        new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      by: "J. Méndez",
      what:
        changes.length === 1
          ? `Ajustó ${changes[0].name} de ${changes[0].from} M a ${changes[0].to} M`
          : `Ajustó ${changes.length} rubros · total ${delta >= 0 ? "+" : ""}${Math.round(delta)} M`,
      reason: reason.trim(),
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-task"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[640px] max-h-[calc(100vh-48px)] rounded-2xl shadow-big overflow-hidden flex flex-col animate-modal-pop"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-3 flex-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center flex-none">
              <CircleDollar width={16} height={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold display-tight">Editar presupuesto por rubro</div>
              <div className="text-[11px] text-slate-500">
                {step === "edit"
                  ? "Paso 1 de 2 · Ajustá los montos asignados"
                  : "Paso 2 de 2 · Revisá y confirmá los cambios"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center flex-none"
          >
            <Xmark width={16} height={16} />
          </button>
        </div>

        <div className="px-6 py-3 bg-attention-50 border-b border-[#FDE68A] flex items-start gap-2 flex-none">
          <TriangleExclamation width={13} height={13} className="text-[#A16207] mt-[2px] flex-none" />
          <div className="text-[11px] text-slate-700 leading-snug">
            El presupuesto es la referencia de control de costos de la obra. Los cambios impactan en el{" "}
            <b>avance financiero</b>, en las <b>proyecciones de IA</b> y en los <b>reportes al cliente</b>.
            Quedan registrados con autor, fecha y motivo.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === "edit" ? (
            <div className="p-6">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[9px] tracking-[0.06em] uppercase text-slate-500 border-b border-slate-200">
                    <th className="text-left font-bold pb-2">Rubro</th>
                    <th className="text-right font-bold pb-2 w-[80px]">Ejecutado</th>
                    <th className="text-right font-bold pb-2 w-[80px]">Actual</th>
                    <th className="text-right font-bold pb-2 w-[130px]">Nuevo monto</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.map((l, i) => {
                    const to = parseFloat(String(l.cap)) || 0;
                    const belowSpent = to < l.spent;
                    const belowComp = !belowSpent && to < l.spent + l.comp;
                    const changed = lines[i].cap !== to;
                    return (
                      <tr key={l.name} className="border-b border-slate-100">
                        <td className="py-[10px]">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-none"
                              style={{ background: rubroColor(l.name, i) }}
                            />
                            {l.name}
                          </div>
                          {belowSpent && (
                            <div className="text-[10px] font-bold text-[#B91C1C] mt-[2px]">
                              No puede ser menor a lo ya ejecutado ({fmtM(l.spent)})
                            </div>
                          )}
                          {belowComp && (
                            <div className="text-[10px] font-bold text-[#A16207] mt-[2px]">
                              Queda por debajo de lo comprometido en pedidos
                            </div>
                          )}
                        </td>
                        <td className="py-[10px] text-right tnum text-slate-600">{fmtM(l.spent)}</td>
                        <td className="py-[10px] text-right tnum text-slate-500">{fmtM(lines[i].cap)}</td>
                        <td className="py-[10px]">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[11px] text-slate-500">{CURRENCIES[cur].sym}</span>
                            <input
                              type="number"
                              min="0"
                              value={l.cap}
                              onChange={(e) => setCap(i, e.target.value)}
                              className={
                                "w-[74px] bg-white border rounded px-2 py-[5px] text-[12px] tnum text-right focus:outline-none " +
                                (belowSpent
                                  ? "border-critical focus:border-critical"
                                  : changed
                                    ? "border-primary"
                                    : "border-slate-200 focus:border-primary")
                              }
                            />
                            <span className="text-[11px] text-slate-500">M</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-3 font-bold text-slate-950">Total</td>
                    <td />
                    <td className="pt-3 text-right tnum text-slate-500">{fmtM(oldTotal)}</td>
                    <td className="pt-3 text-right">
                      <span className="font-extrabold tnum text-slate-950">{fmtM(newTotal)}</span>
                      {delta !== 0 && (
                        <span
                          className={
                            "ml-2 text-[11px] font-bold " +
                            (delta > 0 ? "text-[#A16207]" : "text-[#1D4ED8]")
                          }
                        >
                          {delta > 0 ? "+" : ""}
                          {Math.round(delta)} M
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {errors.length > 0 && (
                <div className="mt-4 bg-critical-50 border border-[#FECACA] rounded-lg p-3 flex items-start gap-2">
                  <TriangleExclamation width={13} height={13} className="text-[#B91C1C] mt-[2px] flex-none" />
                  <div className="text-[12px] text-[#B91C1C] leading-snug">
                    <b>
                      {errors.length} rubro{errors.length === 1 ? "" : "s"} con monto inválido.
                    </b>{" "}
                    El presupuesto no puede quedar por debajo de lo ya ejecutado.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div>
                <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500 mb-2">
                  Cambios a aplicar · {changes.length}
                </div>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {changes.map((ch, idx) => {
                    const up = ch.to > ch.from;
                    return (
                      <div key={ch.name} className="flex items-center gap-3 px-3 py-[10px]">
                        <span
                          className="w-2 h-2 rounded-full flex-none"
                          style={{ background: rubroColor(ch.name, idx) }}
                        />
                        <div className="flex-1 min-w-0 text-[12px] font-semibold text-slate-900 truncate">
                          {ch.name}
                        </div>
                        <div className="text-[12px] tnum text-slate-500 flex-none">{fmtM(ch.from)}</div>
                        <ArrowRight width={12} height={12} className="text-slate-400 flex-none" />
                        <div className="text-[12px] tnum font-bold text-slate-950 flex-none w-[70px] text-right">
                          {fmtM(ch.to)}
                        </div>
                        <span
                          className={
                            "text-[10px] font-bold px-[6px] py-[2px] rounded flex-none " +
                            (up ? "bg-attention-50 text-[#A16207]" : "bg-info-50 text-[#1D4ED8]")
                          }
                        >
                          {up ? "+" : ""}
                          {Math.round(ch.to - ch.from)} M
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg p-3">
                  <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500">
                    Total anterior
                  </div>
                  <div className="text-[16px] font-extrabold tnum text-slate-950 mt-1">{fmtM(oldTotal)}</div>
                </div>
                <div
                  className={
                    "border rounded-lg p-3 " +
                    (delta > 0
                      ? "border-[#FDE68A] bg-attention-50"
                      : delta < 0
                        ? "border-[#BFDBFE] bg-info-50"
                        : "border-slate-200")
                  }
                >
                  <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate-500">
                    Total nuevo
                  </div>
                  <div className="text-[16px] font-extrabold tnum text-slate-950 mt-1">
                    {fmtM(newTotal)}
                    {delta !== 0 && (
                      <span
                        className={
                          "ml-2 text-[11px] font-bold " +
                          (delta > 0 ? "text-[#A16207]" : "text-[#1D4ED8]")
                        }
                      >
                        {delta > 0 ? "+" : ""}
                        {Math.round(delta)} M
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {(warns.length > 0 || bigDrops.length > 0) && (
                <div className="bg-attention-50 border border-[#FDE68A] rounded-lg p-3 space-y-1">
                  {warns.map((w) => (
                    <div
                      key={"w" + w.name}
                      className="text-[11px] text-slate-700 leading-snug flex items-start gap-2"
                    >
                      <TriangleExclamation width={12} height={12} className="text-[#A16207] mt-[2px] flex-none" />
                      <span>
                        <b>{w.name}</b> queda por debajo de lo comprometido en pedidos ({fmtM(w.spent + w.comp)}).
                      </span>
                    </div>
                  ))}
                  {bigDrops.map((d) => (
                    <div
                      key={"d" + d.name}
                      className="text-[11px] text-slate-700 leading-snug flex items-start gap-2"
                    >
                      <TriangleExclamation width={12} height={12} className="text-[#A16207] mt-[2px] flex-none" />
                      <span>
                        <b>{d.name}</b> se reduce más del 25%. Verificá que el rubro pueda ejecutarse con ese monto.
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex flex-col gap-[6px]">
                <span className="text-[11px] font-bold text-slate-700">
                  Motivo del ajuste*{" "}
                  <span className="font-normal text-slate-500">
                    (mínimo 10 caracteres · queda en el historial)
                  </span>
                </span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Ej: Aumento del precio del hierro confirmado por Aceros Norte el 20/08."
                  className="bg-white border border-slate-200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none resize-y min-h-[60px]"
                />
              </label>

              <label className="flex items-start gap-2 text-[12px] text-slate-700 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="w-4 h-4 mt-[2px] rounded border-slate-300 accent-primary flex-none"
                />
                <span>
                  Confirmo que estos montos fueron validados y entiendo que se actualizan las proyecciones y los
                  reportes de la obra.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-none">
          <button
            onClick={step === "review" ? () => setStep("edit") : onClose}
            className="text-[12px] font-bold text-slate-600 hover:text-slate-950 px-3 py-[8px]"
          >
            {step === "review" ? "← Volver a editar" : "Cancelar"}
          </button>
          <div className="flex items-center gap-2">
            {step === "edit" ? (
              <>
                <span className="text-[11px] text-slate-500">
                  {changes.length === 0
                    ? "Sin cambios"
                    : changes.length + " cambio" + (changes.length === 1 ? "" : "s")}
                </span>
                <button
                  onClick={() => canReview && setStep("review")}
                  disabled={!canReview}
                  className={
                    "inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " +
                    (canReview
                      ? "bg-primary hover:bg-primary-700 text-white"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed")
                  }
                >
                  Revisar cambios <ArrowRight width={14} height={14} />
                </button>
              </>
            ) : (
              <button
                onClick={commit}
                disabled={!canCommit}
                className={
                  "inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors " +
                  (canCommit
                    ? "bg-primary hover:bg-primary-700 text-white"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed")
                }
              >
                <Check width={14} height={14} /> Confirmar y guardar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
