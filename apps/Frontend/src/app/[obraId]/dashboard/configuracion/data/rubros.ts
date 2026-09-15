export interface Rubro {
  name: string;
  color: string;
  desc: string;
  budgetM: number;
  spentM: number;
  tasksDone: number;
  tasksTotal: number;
}

export interface RubroCategoria {
  id: string;
  name: string;
  itemCount: number;
}

export interface CategoriaSeccion {
  id: string;
  label: string;
  items: RubroCategoria[];
}

export const CAT_COLORS = [
  "#0F4395", "#1D4ED8", "#3B82F6", "#22C55E",
  "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6",
];

export const RUBROS_SEED: Rubro[] = [
  { name: "Movimiento de suelos", color: "#94A3B8", desc: "Excavaciones, relleno y nivelación del terreno.", budgetM: 18, spentM: 15, tasksDone: 6, tasksTotal: 6 },
  { name: "Hormigón armado", color: "#0F4395", desc: "Estructura de hormigón: columnas, losas y vigas.", budgetM: 46, spentM: 42, tasksDone: 9, tasksTotal: 14 },
  { name: "Mampostería", color: "#22C55E", desc: "Muros, tabiquería y revoques.", budgetM: 24, spentM: 25, tasksDone: 5, tasksTotal: 7 },
  { name: "Instalaciones", color: "#3B82F6", desc: "Eléctricas, sanitarias y de gas.", budgetM: 30, spentM: 18, tasksDone: 4, tasksTotal: 9 },
];

export const CATEGORIES_SEED: CategoriaSeccion[] = [
  { id: "stock", label: "Stock", items: [ { id: "c-st1", name: "Cemento", itemCount: 3 }, { id: "c-st2", name: "Hierros", itemCount: 5 }, { id: "c-st3", name: "Maderas", itemCount: 2 } ] },
  { id: "gastos", label: "Gastos", items: [ { id: "c-ga1", name: "Herramientas", itemCount: 6 }, { id: "c-ga2", name: "Alquileres", itemCount: 2 }, { id: "c-ga3", name: "Combustible", itemCount: 1 } ] },
  { id: "alertas", label: "Alertas", items: [ { id: "c-al1", name: "Seguridad", itemCount: 4 }, { id: "c-al2", name: "Calidad", itemCount: 2 } ] },
  { id: "tareas", label: "Tareas", items: [ { id: "c-ta1", name: "Movimiento de suelos", itemCount: 6 }, { id: "c-ta2", name: "Hormigón armado", itemCount: 14 } ] },
];