export interface ReciboItem {
  id: string;
  concept: string;
  prov: string;
  cat: string;
  date: string;
  amount: number;
  status: string;
  file: string;
}

export const RECEIPTS: ReciboItem[] = [
  { id: 'r1', concept: 'Cemento × 120 bolsas',  prov: 'Cementos del Plata', cat: 'Materiales',  date: '2026-05-15', amount: 480000,  status: 'pagado',     file: 'recibo-0142.pdf' },
  { id: 'r2', concept: 'Hierro 12 mm × 2,5 t',   prov: 'Aceros Norte',       cat: 'Materiales',  date: '2026-05-12', amount: 1250000, status: 'pendiente',  file: 'factura-A-883.pdf' },
  { id: 'r3', concept: 'Alquiler grúa torre',    prov: 'GruasSur SRL',       cat: 'Equipos',     date: '2026-05-10', amount: 890000,  status: 'pagado',     file: 'recibo-grua-05.pdf' },
  { id: 'r4', concept: 'Jornales cuadrilla S19', prov: 'Nómina interna',     cat: 'Mano de obra', date: '2026-05-08', amount: 1640000, status: 'pagado',     file: 'liquidacion-s19.pdf' },
  { id: 'r5', concept: 'Flete áridos',           prov: 'Transportes Río',    cat: 'Logística',   date: '2026-05-06', amount: 220000,  status: 'pendiente',  file: 'remito-3920.pdf' },
  { id: 'r6', concept: 'Pintura látex × 40 L',   prov: 'Pinturas Capital',   cat: 'Materiales',  date: '2026-05-03', amount: 145000,  status: 'pagado',     file: 'recibo-0138.pdf' },
];

export const CATEGORIES = ['Materiales', 'Mano de obra', 'Equipos', 'Logística', 'Servicios'];

export const FILTERS = ['Todos', 'Pendientes', ...CATEGORIES];

