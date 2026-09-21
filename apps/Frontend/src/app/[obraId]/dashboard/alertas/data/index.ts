export type AlertaLvl = 'critical' | 'attention' | 'moderate';
type AlertaState = 'open' | 'progress' | 'resolved';

export interface AlertaItem {
  id: string;
  lvl: AlertaLvl;
  state: AlertaState;
  cat: string;
  title: string;
  who: string;
  time: string;
  desc: string;
}

export const LVL: Record<
  AlertaLvl,
  { tag: string; pill: string; dot: string; stripe: string; soft: string; softText: string; icoBg: string; icoFg: string }
> = {
  critical:  { tag: 'CRÍTICA',    pill: 'criticalSolid',  dot: '#EF4444', stripe: '#EF4444', soft: 'bg-critical-50',  softText: 'text-[#B91C1C]', icoBg: 'bg-[#FECACA]', icoFg: 'text-[#B91C1C]' },
  attention: { tag: 'IMPORTANTE', pill: 'attentionSolid', dot: '#F59E0B', stripe: '#F59E0B', soft: 'bg-attention-50', softText: 'text-[#A16207]', icoBg: 'bg-[#FDE68A]', icoFg: 'text-[#A16207]' },
  moderate:  { tag: 'MODERADA',   pill: 'slate',          dot: '#64748B', stripe: '#94A3B8', soft: 'bg-slate-50',     softText: 'text-slate-600', icoBg: 'bg-slate-100', icoFg: 'text-slate-700' },
};

export const STATE: Record<AlertaState, { label: string; pill: string }> = {
  open:     { label: 'Sin atender', pill: 'criticalSolid' },
  progress: { label: 'En progreso', pill: 'info' },
  resolved: { label: 'Resuelta',    pill: 'successSolid' },
};

