export interface AlertaItem {
  id: string;
  lvl: 'critical' | 'attention' | 'moderate' | 'resolved';
  title: string;
  who: string;
  time: string;
  desc: string;
  actions: string[];
}

export const ALERTS: AlertaItem[] = [
  { id: '1', lvl: 'critical',  title: 'Falla en Grúa Torre 2',                     who: 'J. Méndez',  time: 'hace 12 min', desc: 'Motor principal no responde. Cuadrilla detenida hasta revisión técnica.', actions: ['Asignar técnico', 'Detener tareas'] },
  { id: '2', lvl: 'critical',  title: 'Faltante de hierro 12 mm para columnas',   who: 'L. Benítez', time: 'hace 2 h',    desc: 'No hay material para continuar armado de columnas eje 4–6. Pedido sin aprobar.', actions: ['Aprobar pedido', 'Ver alternativas'] },
  { id: '3', lvl: 'attention', title: 'Demora en entrega de hormigón',             who: 'C. Ríos',    time: 'hace 5 h',    desc: 'Proveedor confirmó retraso de 24 h en próxima entrega.', actions: ['Reprogramar tarea'] },
  { id: '4', lvl: 'attention', title: 'Cuadrilla incompleta',                      who: 'P. Salas',   time: 'ayer',        desc: '2 ausentes sin aviso. Tarea de mampostería pausada.', actions: ['Reasignar'] },
  { id: '5', lvl: 'moderate',  title: 'Sin reporte diario',                        who: 'M. Ortiz',   time: 'ayer',        desc: 'Capataz no envió cierre de jornada. Bot envió recordatorio.', actions: ['Recordar'] },
  { id: '6', lvl: 'resolved',  title: 'Cemento entregado',                         who: 'L. Benítez', time: 'hoy 09:14',   desc: '12 bolsas descargadas y registradas en stock.', actions: [] },
];

export const TONES: Record<string, { tag: string; box: string; ico: string; pillTone: string }> = {
  critical:  { tag: 'CRÍTICO',    box: 'bg-critical-50 border-[#FECACA]',  ico: 'bg-[#FECACA] text-[#B91C1C]', pillTone: 'criticalSolid' },
  attention: { tag: 'IMPORTANTE', box: 'bg-attention-50 border-[#FDE68A]', ico: 'bg-[#FDE68A] text-[#A16207]', pillTone: 'attentionSolid' },
  moderate:  { tag: 'MODERADO',   box: 'bg-white border-slate-200',         ico: 'bg-slate-100 text-slate-700',   pillTone: 'slate' },
  resolved:  { tag: 'RESUELTO',   box: 'bg-success-50 border-[#BBF7D0]',    ico: 'bg-[#BBF7D0] text-[#15803D]', pillTone: 'successSolid' },
};

export const TABS = [
  { id: 'todas',       label: 'Todas',       count: 6 },
  { id: 'criticos',    label: 'Críticos',    count: 2 },
  { id: 'importantes', label: 'Importantes', count: 2 },
  { id: 'moderados',   label: 'Moderados',   count: 1 },
  { id: 'resueltos',   label: 'Resueltos',   count: 1 },
];
