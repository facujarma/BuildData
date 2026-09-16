export type AlertaLvl = 'critical' | 'attention' | 'moderate';
export type AlertaState = 'open' | 'progress' | 'resolved';

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

export const ALERTS: AlertaItem[] = [
  { id: 'AL-061', lvl: 'critical',  state: 'open',     cat: 'Equipos',    title: 'Falla en Grúa Torre 2',                   who: 'P. Salas',   time: 'hace 12 min', desc: 'Motor principal no responde. Cuadrilla detenida hasta revisión técnica.' },
  { id: 'AL-060', lvl: 'critical',  state: 'open',     cat: 'Materiales', title: 'Faltante de hierro 12 mm para columnas',  who: 'L. Benítez', time: 'hace 2 h',    desc: 'No hay material para continuar armado de columnas eje 4–6. Pedido sin aprobar.' },
  { id: 'AL-059', lvl: 'attention', state: 'open',     cat: 'Logística',  title: 'Demora en entrega de hormigón',           who: 'C. Ríos',    time: 'hace 5 h',    desc: 'Proveedor confirmó retraso de 24 h en próxima entrega.' },
  { id: 'AL-058', lvl: 'attention', state: 'open',     cat: 'Personal',   title: 'Cuadrilla incompleta',                    who: 'P. Salas',   time: 'ayer',        desc: '2 ausentes sin aviso. Tarea de mampostería pausada.' },
  { id: 'AL-057', lvl: 'moderate',  state: 'open',     cat: 'Reportes',   title: 'Sin reporte diario',                      who: 'M. Ortiz',   time: 'ayer',        desc: 'Capataz no envió cierre de jornada. Bot envió recordatorio.' },
  { id: 'AL-056', lvl: 'moderate',  state: 'resolved', cat: 'Materiales', title: 'Cemento entregado',                       who: 'L. Benítez', time: 'hoy 09:14',   desc: '12 bolsas descargadas y registradas en stock.' },
];
