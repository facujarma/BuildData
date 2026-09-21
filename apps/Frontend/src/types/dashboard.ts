export interface DashboardData {
  obra: ObraInfo;
  stats: DashboardStats;
  budget: BudgetOverview;
  budgetBreakdown: BudgetItem[];
  tradeProgress: TradeProgress[];
  activityFeed: ActivityFeedItem[];
  alerts: AlertItem[];
  tasks: TaskItem[];
  orders: OrderItem[];
}


interface ObraInfo {
  name: string;
  lastUpdate: string;
}

interface DashboardStats {
  avanceTotal: number;
  avanceDelta: string;
  alertasCriticas: number;
  alertasDelta: string;
  pedidos: number;
  pedidosPendientes: number;
  tareasCompletadas: number;
  tareasTotal: number;
}

export interface BudgetOverview {
  total: number;
  ejecutado: number;
  disponible: number;
  ejecutadoPct: number;
  comprometidoPct: number;
  librePct: number;
  updatedAt: string;
}

export interface BudgetItem {
  name: string;
  spent: number;
  cap: number;
  over: boolean;
  overPct?: number;
}

export interface TradeProgress {
  id: string;
  name: string;
  pct: number;
  color: string;
}

export interface ActivityFeedItem {
  initials: string;
  name: string;
  action: string;
  tipo?: string;
  texto?: string;
  time: string;
}

export interface AlertItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  tone: "critical" | "attention";
}

export interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  progressPercent: number;
  startDate: string;
  dueDate: string;
}

interface OrderItemDetail {
  materialId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderItem {
  id: string;
  status: string;
  approved: boolean;
  date: string;
  supplierId: string;
  items: OrderItemDetail[];
}
