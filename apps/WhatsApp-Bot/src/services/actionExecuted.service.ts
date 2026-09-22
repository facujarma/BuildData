import type { ApiCall } from "../handlers/pendingQuery.store";
import { getEndpointSchema } from "./endpointSchema";
import type { ComprobanteData, FacturaData } from "./vision.service";

// Un elemento de mensajes.action_executed: el registro de UNA llamada ejecutada.
// El frontend lo usa para renderizar la "Interpretación de la IA"
// (tipo → destino, campos, confianza, resultado aplicado).
export interface ActionExecuted {
  endpoint: string;
  method: string;
  tipo: string;
  destino: string;
  confianza?: number;
  comment?: string;
  campos: [string, string][];
  data: Record<string, unknown>;
  result?: unknown;
  estado: "ejecutado" | "error";
  error?: string;
  ejecutado_at: string;
}

export interface ActionOutcome {
  body: Record<string, unknown>;
  result?: unknown;
  error?: unknown;
}

// Clave del nombre legible de una entidad resuelta dentro de data.
// Ej: ("items", 0, "material_id") → "items[0].material_id"; (null, 0, "tarea_id") → "tarea_id".
export function displayPath(dataKey: string | null, itemIndex: number, targetKey: string): string {
  return dataKey ? `${dataKey}[${itemIndex}].${targetKey}` : targetKey;
}

export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

type FieldBuilder = (
  data: Record<string, unknown>,
  display?: Record<string, string>,
) => [string, string][];

interface ActionMeta {
  tipo: string | ((data: Record<string, unknown>) => string);
  destino: string;
  fields: FieldBuilder;
}

function str(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.map(str).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function arrayOf(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.map(asRecord).filter((x): x is Record<string, unknown> => x !== null)
    : [];
}

function add(campos: [string, string][], label: string, value: unknown): void {
  const v = str(value);
  if (v !== "—") campos.push([label, v]);
}

function named(
  display: Record<string, string> | undefined,
  path: string,
  fallback: unknown,
): string {
  return display?.[path] || str(fallback);
}

function pedidoFields(data: Record<string, unknown>, display?: Record<string, string>): [string, string][] {
  const campos: [string, string][] = [];
  const items = arrayOf(data.items);
  if (items.length > 0) {
    const materiales = items
      .map((item, i) => {
        const nombre = named(
          display,
          displayPath("items", i, "material_id"),
          item.material_nombre ?? item.material_id,
        );
        const unidad = item.unidad ? ` ${str(item.unidad)}` : "";
        return `${nombre} x${str(item.cantidad)}${unidad}`;
      })
      .join(", ");
    campos.push(["Materiales", materiales]);
  }
  if (data.proveedor_id || data.proveedor_nombre) {
    campos.push(["Proveedor", named(display, "proveedor_id", data.proveedor_nombre ?? data.proveedor_id)]);
  }
  if (data.rubro_id || data.rubro_nombre) {
    campos.push(["Rubro", named(display, "rubro_id", (data.rubro_nombre ?? data.rubro_id) as string)]);
  }
  if (data.urgente === true) campos.push(["Urgente", "Sí"]);
  add(campos, "Llegada estimada", data.fecha_llegada_estimada);
  add(campos, "Nota", data.nota);
  return campos;
}

function stockFields(data: Record<string, unknown>, display?: Record<string, string>): [string, string][] {
  const campos: [string, string][] = [];
  const movimientos = arrayOf(data.movimientos);
  if (movimientos.length > 0) {
    const materiales = movimientos
      .map((mov, i) => {
        const nombre = named(
          display,
          displayPath("movimientos", i, "material_id"),
          mov.material_nombre ?? mov.material_id,
        );
        return `${nombre} x${str(mov.cantidad)}`;
      })
      .join(", ");
    campos.push(["Materiales", materiales]);

    const rubros = [
      ...new Set(
        movimientos
          .map((_, i) => display?.[displayPath("movimientos", i, "rubro_id")])
          .filter((r): r is string => Boolean(r)),
      ),
    ];
    if (rubros.length > 0) campos.push(["Rubro", rubros.join(", ")]);
  }
  return campos;
}

function retrasoFields(data: Record<string, unknown>, display?: Record<string, string>): [string, string][] {
  const campos: [string, string][] = [];
  campos.push(["Tarea", named(display, "tarea_id", data.tarea_nombre ?? data.tarea ?? data.tarea_id)]);
  add(campos, "Días de retraso", data.dias_retraso);
  return campos;
}

function tareaFields(data: Record<string, unknown>, display?: Record<string, string>): [string, string][] {
  const campos: [string, string][] = [];
  add(campos, "Título", data.titulo);
  add(campos, "Descripción", data.descripcion);
  if (data.rubro_id || data.rubro_nombre) {
    campos.push(["Rubro", named(display, "rubro_id", data.rubro_nombre ?? data.rubro_id)]);
  }
  return campos;
}

function completarFields(data: Record<string, unknown>, display?: Record<string, string>): [string, string][] {
  const campos: [string, string][] = [];
  if (data.tarea_id || data.tarea_nombre) {
    campos.push(["Tarea", named(display, "tarea_id", data.tarea_nombre ?? data.tarea_id)]);
  }
  if (data.porcentaje_avance !== undefined && data.porcentaje_avance !== null) {
    campos.push(["Avance", `${str(data.porcentaje_avance)}%`]);
  }
  return campos;
}

function gastoFields(data: Record<string, unknown>, display?: Record<string, string>): [string, string][] {
  const campos: [string, string][] = [];
  if (data.monto !== undefined && data.monto !== null) {
    const moneda = data.moneda ? ` ${str(data.moneda)}` : "";
    campos.push(["Monto", `$${str(data.monto)}${moneda}`]);
  }
  add(campos, "Fecha", data.fecha);
  add(campos, "Descripción", data.descripcion);
  if (data.rubro_id || data.rubro_nombre) {
    campos.push(["Rubro", named(display, "rubro_id", data.rubro_nombre ?? data.rubro_id)]);
  }
  return campos;
}

function mensajeFields(data: Record<string, unknown>): [string, string][] {
  const campos: [string, string][] = [];
  add(campos, "Contenido", data.contenido);
  return campos;
}

const ACTION_META: Record<string, ActionMeta> = {
  "/bot/pedidoDeCompra": { tipo: "Pedido de material", destino: "Pedidos", fields: pedidoFields },
  "/bot/stock": { tipo: "Uso de material", destino: "Stock", fields: stockFields },
  "/bot/retraso": { tipo: "Retraso", destino: "Cronograma", fields: retrasoFields },
  "/bot/tareas": { tipo: "Reporte de tarea", destino: "Tareas", fields: tareaFields },
  "/bot/tareas/:id/completar": {
    tipo: (data) => (data.completada === false ? "Reapertura de tarea" : "Tarea completada"),
    destino: "Cronograma",
    fields: completarFields,
  },
  "/bot/gastos": { tipo: "Gasto", destino: "Gastos", fields: gastoFields },
  "/bot/mensaje": { tipo: "Nota", destino: "Actividad", fields: mensajeFields },
};

// Campos de contexto que no aportan a la card cuando el endpoint no tiene formatter.
const HIDDEN_FALLBACK_KEYS = new Set([
  "obra_id",
  "telefono",
  "mensaje_id",
  "solicitado_por",
  "creada_por_telefono",
]);

function fallbackFields(data: Record<string, unknown>): [string, string][] {
  const campos: [string, string][] = [];
  for (const [key, value] of Object.entries(data)) {
    if (HIDDEN_FALLBACK_KEYS.has(key)) continue;
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.every((v) => typeof v !== "object")) {
        campos.push([key, value.map(str).join(", ")]);
      }
      continue;
    }
    if (typeof value === "object") continue;
    campos.push([key, str(value)]);
  }
  return campos;
}

export function buildActionExecuted(op: ApiCall, outcome: ActionOutcome): ActionExecuted {
  const meta = ACTION_META[op.endpoint];
  // Mezcla: op.data conserva los campos de path (ej. tarea_id) que se sacan del body.
  const data = { ...op.data, ...outcome.body };
  const tipo = typeof meta?.tipo === "function" ? meta.tipo(data) : meta?.tipo;

  const action: ActionExecuted = {
    endpoint: op.endpoint,
    method: op.method,
    tipo: tipo ?? getEndpointSchema(op.endpoint)?.description ?? op.endpoint,
    destino: meta?.destino ?? "—",
    campos: meta ? meta.fields(data, op.display) : fallbackFields(data),
    // data mezclada: conserva los params de path (ej. tarea_id) que se sacan del body.
    data,
    estado: outcome.error ? "error" : "ejecutado",
    ejecutado_at: new Date().toISOString(),
  };
  if (typeof op.confianza === "number") action.confianza = clamp01(op.confianza);
  if (op.comment) action.comment = op.comment;
  if (outcome.result !== undefined) action.result = outcome.result;
  if (outcome.error) action.error = formatError(outcome.error);
  return action;
}

function documentAction(
  tipo: string,
  payload: Record<string, unknown>,
  campos: [string, string][],
  outcome: { result?: unknown; error?: unknown },
): ActionExecuted {
  const action: ActionExecuted = {
    endpoint: "/bot/gastos",
    method: "POST",
    tipo,
    destino: "Gastos",
    campos,
    data: payload,
    estado: outcome.error ? "error" : "ejecutado",
    ejecutado_at: new Date().toISOString(),
  };
  if (outcome.result !== undefined) action.result = outcome.result;
  if (outcome.error) action.error = formatError(outcome.error);
  return action;
}

export function buildComprobanteAction(
  data: ComprobanteData,
  payload: Record<string, unknown>,
  outcome: { result?: unknown; error?: unknown },
): ActionExecuted {
  const campos: [string, string][] = [];
  add(campos, "Entidad", data.entidad);
  add(campos, "Tipo", data.tipo);
  add(campos, "Fecha", data.fecha);
  add(campos, "Monto", [data.monto, data.moneda].filter(Boolean).join(" "));
  add(campos, "Origen", data.origen);
  add(campos, "Destino", data.destino);
  add(campos, "N° Operación", data.numeroOperacion);
  return documentAction("Comprobante", payload, campos, outcome);
}

export function buildFacturaAction(
  data: FacturaData,
  payload: Record<string, unknown>,
  outcome: { result?: unknown; error?: unknown },
): ActionExecuted {
  const campos: [string, string][] = [];
  add(campos, "Tipo", data.tipoFactura);
  add(campos, "N° Factura", data.numero);
  add(campos, "Fecha", data.fecha);
  add(campos, "Vencimiento", data.fechaVencimiento);
  add(campos, "Emisor", data.emisor);
  add(campos, "CUIT Emisor", data.cuitEmisor);
  add(campos, "Receptor", data.receptor);
  add(campos, "CUIT Receptor", data.cuitReceptor);
  add(
    campos,
    "Items",
    data.items.map((i) => `${i.descripcion} x${i.cantidad} — ${i.subtotal}`).join("; "),
  );
  add(campos, "Subtotal", data.subtotal);
  add(campos, "IVA", data.iva);
  add(campos, "Total", data.total);
  return documentAction("Factura", payload, campos, outcome);
}
