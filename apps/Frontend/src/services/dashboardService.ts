import { supabase } from "@/lib/supabaseClient";
import type { ApiDashboardResponse } from "@/types/dashboard.api";
import type { DashboardData, TaskItem, OrderItem } from "@/types/dashboard";
import { formatRelative, formatRelativeDay, formatTime } from "@/lib/format";

const TRADE_COLORS: Record<string, string> = {
  "Mampostería":                "#22C55E",
  "Hormigón armado":            "#0F4395",
  "Instalaciones eléctricas":   "#3B82F6",
  "Instalaciones sanitarias":   "#3B82F6",
  "Terminaciones":              "#F59E0B",
  "Carpintería":                "#94A3B8",
};
const TRADE_COLOR_FALLBACK = "#64748B";

// ─── Transformación API → UI ──────────────────────────────────────────────────

function transformDashboard(api: ApiDashboardResponse): DashboardData {
  return {
    obra: {
      name:       api.obra.name,
      lastUpdate: formatRelative(api.obra.lastUpdate),
    },

    stats: {
      avanceTotal:       api.stats.avanceTotal,
      avanceDelta:       `+${api.stats.avanceDeltaPct}% esta semana`,
      alertasCriticas:   api.stats.alertasCriticas,
      alertasDelta:      `+${api.stats.alertasDeltaHoy} hoy`,
      pedidos:           api.stats.pedidos,
      pedidosPendientes: api.stats.pedidosPendientes,
      tareasCompletadas: api.stats.tareasCompletadas,
      tareasTotal:       api.stats.tareasTotal,
    },

    budget: {
      total:           api.budget.total,
      ejecutado:       api.budget.ejecutado,
      disponible:      api.budget.disponible,
      ejecutadoPct:    api.budget.ejecutadoPct,
      comprometidoPct: api.budget.comprometidoPct,
      librePct:        api.budget.librePct,
      updatedAt:       formatRelativeDay(api.budget.updatedAt),
    },

    budgetBreakdown: api.budgetBreakdown.map((item) => {
      const over = item.spent > item.cap;
      return {
        name:    item.name,
        spent:   item.spent,
        cap:     item.cap,
        over,
        overPct: over
          ? Math.round(((item.spent - item.cap) / item.cap) * 100)
          : undefined,
      };
    }),

    tradeProgress: api.tradeProgress.map((item) => ({
      id:    item.id,
      name:  item.name,
      pct:   item.pct,
      color: TRADE_COLORS[item.name] ?? TRADE_COLOR_FALLBACK,
    })),

    activityFeed: api.activityFeed.map((item) => ({
      initials: item.initials,
      name:     item.name,
      action:   item.action,
      tipo:     item.tipo,
      texto:    item.texto,
      time:     formatTime(item.timestamp),
    })),

    alerts: api.alerts.map((item) => ({
      id:       item.id,
      title:    item.title,
      subtitle: item.subtitle,
      time:     formatRelative(item.timestamp),
      tone:     item.severity,
    })),

    tasks: api.tasks.map((task): TaskItem => ({
      id:             task.id,
      title:          task.titulo,
      status:         task.estado,
      priority:       task.prioridad,
      progressPercent: task.porcentaje_avance,
      startDate:      task.fecha_inicio ? formatRelativeDay(task.fecha_inicio) : "",
      dueDate:        task.fecha_limite ? formatRelativeDay(task.fecha_limite) : "",
    })),

    orders: api.orders.map((order): OrderItem => ({
      id:         order.id,
      status:     order.estado,
      approved:   order.aprobado,
      date:       formatRelativeDay(order.fecha),
      supplierId: order.proveedor_id,
      items:      order.items.map((item) => ({
        materialId: item.material_id,
        quantity:   item.cantidad,
        unitPrice:  item.precio_unitario,
      })),
    })),
  };
}

// ─── Export público ───────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function getDashboard(obraId: string): Promise<DashboardData> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}/dashboard/${obraId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
  });

  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
  const data: ApiDashboardResponse = await res.json();

  return transformDashboard(data);
}