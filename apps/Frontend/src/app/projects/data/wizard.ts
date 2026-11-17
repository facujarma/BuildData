export const TYPES = [
  { id: "edificio", name: "Edificio en altura", icon: "chart", sub: "Estructura y rubros de edificio" },
  { id: "vivienda", name: "Vivienda unifamiliar", icon: "grid", sub: "Obra unifamiliar y sus rubros" },
  { id: "refaccion", name: "Refacción / remodelación", icon: "package", sub: "Remodelación y refacción" },
  { id: "comercial", name: "Comercial / industrial", icon: "truck", sub: "Local, planta o proyecto industrial" },
];

export const DEFAULT_RUBROS: string[] = [
];

export const STEPS = [
  { id: 1, label: "Básicos", sub: "Nombre y tipo" },
  { id: 2, label: "Ubicación", sub: "Dónde está" },
  { id: 3, label: "Equipo", sub: "Quién participa" },
  { id: 4, label: "Cronograma", sub: "Fechas estimadas" },
  { id: 5, label: "Presupuesto", sub: "Total y rubros" },
];
