export interface SectionDef {
  id: string;
  label: string;
  sub: string;
  icon: string;
}

export const SECTION_DEFS: SectionDef[] = [
  { id: 'resumen',    label: 'Resumen ejecutivo',   sub: 'Estado general y KPIs de la obra',         icon: 'chart' },
  { id: 'avance',     label: 'Avance por rubro',    sub: 'Progreso de cada categoría',               icon: 'trending' },
  { id: 'presupuesto',label: 'Presupuesto',         sub: 'Ejecutado, comprometido y disponible',     icon: 'dollar' },
  { id: 'cronograma', label: 'Cronograma',          sub: 'Tareas completas, en curso y atrasadas',   icon: 'calendar' },
  { id: 'alertas',    label: 'Alertas e incidentes',sub: 'Problemas críticos del período',           icon: 'alert' },
  { id: 'pedidos',    label: 'Pedidos de material', sub: 'Compras y entregas',                       icon: 'package' },
  { id: 'stock',      label: 'Stock de materiales', sub: 'Inventario y niveles bajos',               icon: 'box' },
  { id: 'recibos',    label: 'Recibos y gastos',    sub: 'Comprobantes y pagos',                     icon: 'receipt' },
  { id: 'equipo',     label: 'Equipo',              sub: 'Personas y productividad',                 icon: 'users' },
  { id: 'actividad',  label: 'Bitácora de actividad',sub: 'Detalle día a día (extenso)',             icon: 'message' },
];

export const RANGES = ['semana', 'mes', 'trimestre', 'total'] as const;
export type Rango = (typeof RANGES)[number];

export const RANGE_LABELS: Record<string, string> = {
  semana: 'Última semana',
  mes: 'Último mes',
  trimestre: 'Último trimestre',
  total: 'Toda la obra',
};
