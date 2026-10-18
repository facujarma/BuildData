export interface ActivityItem {
  who: string;
  name: string;
  role: string;
  time: string;
  kind: string;
  text: string;
  tags: string[];
  severity?: string;
}

export interface ActivityGroup {
  d: string;
  items: ActivityItem[];
}

export const KIND_ICONS: Record<string, { ico: string; tint: string }> = {
  avance:   { ico: 'check',    tint: 'bg-success-50 text-[#15803D]' },
  foto:     { ico: 'photo',    tint: 'bg-info-50 text-[#1D4ED8]' },
  problema: { ico: 'alert',    tint: 'bg-critical-50 text-[#B91C1C]' },
  pedido:   { ico: 'package',  tint: 'bg-attention-50 text-[#A16207]' },
  cierre:   { ico: 'calendar', tint: 'bg-primary-50 text-primary' },
};

// Se responden con el ChatBot AI (POST /chat/consultar) sobre los datos de la obra
export const SUGGESTED_QUESTIONS = [
  '¿Qué se hizo esta semana en la obra?',
  '¿Qué pedidos llegan en los próximos 7 días?',
  'Resumen de problemas críticos del mes',
];
