import type { ReactNode } from "react";

export type PillTone =
  | "critical" | "attention" | "success" | "info" | "primary" | "slate"
  | "inkSolid" | "criticalSolid" | "successSolid" | "attentionSolid";

const MAP: Record<PillTone, string> = {
  critical:       "bg-critical-50 text-[#B91C1C]",
  attention:      "bg-attention-50 text-[#A16207]",
  success:        "bg-success-50 text-[#15803D]",
  info:           "bg-info-50 text-[#1D4ED8]",
  primary:        "bg-primary-50 text-primary",
  slate:          "bg-slate-100 text-slate-700",
  inkSolid:       "bg-slate-950 text-white",
  criticalSolid:  "bg-critical text-white",
  successSolid:   "bg-success text-white",
  attentionSolid: "bg-attention text-slate-950",
};

export function DPill({ tone = "slate", children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-[3px] rounded text-[10px] font-bold tracking-[0.05em] uppercase whitespace-nowrap ${MAP[tone]}`}>
      {children}
    </span>
  );
}
