interface ActivityItem {
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

export const SUGGESTED_QUESTIONS = [
  '¿Cuántas horas se trabajaron esta semana?',
  '¿Qué pedidos vencen en los próximos 7 días?',
  'Resumen de problemas críticos del mes',
];

export const ANSWERS_DB: Record<string, string> = {
  '¿Cuántas horas se trabajaron esta semana?': 'Se trabajaron **184 hs** esta semana, 12 % menos que la anterior. Caída atribuible a la falla de Grúa Torre 2 (jueves).',
  '¿Qué pedidos vencen en los próximos 7 días?': 'Vencen 4 pedidos: **PED-0140** (Ladrillo, 22 Oct), **PED-0141** (Hierro 12 mm, 18 Oct), **PED-0143** (Arena, 21 Oct) y **PED-0144** (Pintura, 23 Oct). 1 está sin aprobar.',
  'Resumen de problemas críticos del mes': 'Este mes hubo **6 alertas críticas**: 3 por faltantes de material, 2 por fallas técnicas y 1 por accidente leve. Tiempo promedio de resolución: 14 hs.',
};
