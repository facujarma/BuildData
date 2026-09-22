export interface EndpointParam {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  source: "obra_poll" | "user_phone" | "llm" | "auto" | "entity_resolution";
  isName?: boolean;
  prompt?: string;
  examples?: string[];
  elementParams?: EndpointParam[];
}

export interface EndpointSchema {
  path: string;
  method: "POST" | "GET" | "PATCH";
  description: string;
  params: EndpointParam[];
}

export const ENDPOINTS: EndpointSchema[] = [
  {
    path: "/bot/stock",
    method: "POST",
    description:
      "Descontar materiales del stock (ej: 'usé 10 bolsas de cemento')",
    params: [
      {
        name: "obra_id",
        type: "string",
        description: "ID o nombre de la obra",
        required: true,
        source: "obra_poll",
      },
      {
        name: "telefono",
        type: "string",
        description: "Teléfono del obrero",
        required: true,
        source: "user_phone",
      },
      {
        name: "movimientos",
        type: "array",
        description:
          "Lista de materiales usados. Cada item: { nombre: string, cantidad: number }",
        required: true,
        source: "llm",
        isName: true,
        prompt: "¿Qué materiales usaste y cuánto de cada uno?",
        elementParams: [
          {
            name: "nombre",
            type: "string",
            description: "Nombre del material",
            required: true,
            source: "llm",
            isName: true,
            prompt: "¿Qué material usaste?",
          },
          {
            name: "cantidad",
            type: "number",
            description: "Cantidad usada",
            required: true,
            source: "llm",
            prompt: "¿Cuánto usaste?",
          },
        ],
      },
    ],
  },

  {
    path: "/bot/pedidoDeCompra",
    method: "POST",
    description:
      "Crear un pedido de compra de materiales para una obra. El pedido queda pendiente de aprobación.",

    params: [
      {
        name: "obra_id",
        type: "string",
        description: "ID de la obra donde se necesitan los materiales",
        required: true,
        source: "obra_poll",
      },
      {
        name: "proveedor_nombre",
        type: "string",
        description:
          "Nombre del proveedor al que se realizará el pedido. Debe existir en la obra o en el catálogo global.",
        required: false,
        source: "llm",
        isName: true,
      },
      {
        name: "items",
        type: "array",
        description:
          "Material a pedir. Debe tener material_nombre y cantidad, y puede incluir unidad y precio_unitario.",
        required: true,
        source: "llm",
        prompt: "¿Qué materiales querés pedir y cuántos?",
        elementParams: [
          {
            name: "material_nombre",
            type: "string",
            description: "Nombre del material a pedir",
            required: true,
            source: "llm",
            isName: true,
            prompt: "¿Qué material querés pedir?",
          },
          {
            name: "cantidad",
            type: "number",
            description: "Cantidad a pedir",
            required: true,
            source: "llm",
            prompt: "¿Cuántos pedís?",
          },
        ],
      },
      {
        name: "rubro_nombre",
        type: "string",
        description:
          "Rubro del pedido. Solo si el usuario lo menciona. Debe existir en la obra.",
        required: false,
        source: "llm",
        isName: true,
      },
      {
        name: "urgente",
        type: "boolean",
        description:
          "Indica si el pedido es urgente. Solo establecer en true si el usuario expresa que lo necesita con urgencia.",
        required: false,
        source: "llm",
      },
      {
        name: "nota",
        type: "string",
        description:
          "Observaciones adicionales del pedido que el usuario haya mencionado.",
        required: false,
        source: "llm",
      },
      {
        name: "fecha_llegada_estimada",
        type: "string",
        description:
          "Fecha estimada en la que se necesita recibir el pedido, si el usuario la especifica. En formato YYYY-MM-DD (ISO), interpretando fechas relativas usando la fecha de hoy.",
        required: false,
        source: "llm",
      },
      {
        name: "solicitado_por",
        type: "string",
        description:
          "Se completa automáticamente: el backend lo resuelve desde el teléfono del obrero que manda el mensaje.",
        required: false,
        source: "user_phone",
      },
    ],
  },
  {
    path: "/bot/retraso",
    method: "POST",
    description:
      "Registrar que una tarea se atrasó (ej: 'se atrasó la entrega de ladrillos')",
    params: [
      {
        name: "obra_id",
        type: "string",
        description: "ID o nombre de la obra",
        required: true,
        source: "obra_poll",
      },
      {
        name: "telefono",
        type: "string",
        description: "Teléfono del obrero",
        required: true,
        source: "user_phone",
      },
      {
        name: "tarea",
        type: "string",
        description: "Nombre de la tarea atrasada (ej: 'Entrega de ladrillos')",
        required: true,
        source: "llm",
        isName: true,
        prompt: "¿Qué tarea se atrasó?",
      },
      {
        name: "dias_retraso",
        type: "number",
        description: "Cantidad de días de retraso",
        required: true,
        source: "llm",
        prompt: "¿Cuántos días de atraso?",
      },
    ],
  },
  {
    path: "/bot/tareas",
    method: "POST",
    description:
      "Registrar un reporte breve a partir de un mensaje de un obrero (ej: 'hay que pintar la pared del baño', 'terminé de pintar la pared')",
    params: [
      {
        name: "obra_id",
        type: "string",
        description: "ID o nombre de la obra",
        required: true,
        source: "obra_poll",
      },
      {
        name: "creada_por_telefono",
        type: "string",
        description: "Teléfono del obrero que reporta",
        required: true,
        source: "user_phone",
      },
      {
        name: "titulo",
        type: "string",
        description: "Título breve del reporte (máx 150 caracteres)",
        required: true,
        source: "llm",
        prompt: "¿Qué querés reportar? Contame en una frase.",
      },
      {
        name: "descripcion",
        type: "string",
        description: "Descripción detallada del reporte",
        required: false,
        source: "llm",
      },
      {
        name: "rubro_id",
        type: "string",
        description:
          "Nombre del rubro al que corresponde (ej: 'Pintura', 'Electricidad')",
        required: false,
        source: "llm",
        isName: true,
      },
    ],
  },
  {
    path: "/bot/tareas/:id/completar",
    method: "PATCH",
    description:
      "Marcar una tarea como terminada, o revertir esa marca, a partir de un mensaje de un obrero (ej: 'terminé de pintar la pared')",
    params: [
      {
        name: "obra_id",
        type: "string",
        description: "ID o nombre de la obra",
        required: true,
        source: "obra_poll",
      },
      {
        name: "tarea_nombre",
        type: "string",
        description:
          "Nombre de la tarea que el obrero dice haber terminado (se resuelve contra las tareas de la obra a través del pipeline de entidades)",
        required: true,
        source: "llm",
        prompt: "¿Qué tarea terminaste?",
      },
      {
        name: "completada",
        type: "boolean",
        description:
          "true si el obrero terminó el trabajo, false si hay que revertir una marca anterior",
        required: true,
        source: "llm",
        prompt: "¿La terminaste o querés revertir una marca anterior?",
        examples: ["Sí, la terminé", "No, quiero deshacer la marca"],
      },
      {
        name: "porcentaje_avance",
        type: "number",
        description:
          "Porcentaje de avance (opcional; default 100 si completada=true, 0 si completada=false)",
        required: false,
        source: "llm",
      },
    ],
  },
  {
    path: "/bot/gastos",
    method: "POST",
    description:
      "Registrar un gasto a partir de un mensaje de un obrero (ej: 'gastamos 500 pesos en carpintería', 'pagué 20000 de flete')",
    params: [
      {
        name: "obra_id",
        type: "string",
        description: "ID o nombre de la obra",
        required: true,
        source: "obra_poll",
      },
      {
        name: "telefono",
        type: "string",
        description: "Teléfono del obrero",
        required: true,
        source: "user_phone",
      },
      {
        name: "monto",
        type: "number",
        description: "Monto del gasto",
        required: true,
        source: "llm",
        prompt: "¿Cuánto gastaste?",
      },
      {
        name: "fecha",
        type: "string",
        description:
          "Fecha del gasto si el usuario la menciona (ej: 'ayer', 'el lunes'). En formato YYYY-MM-DD (ISO), interpretando fechas relativas usando la fecha de hoy.",
        required: false,
        source: "llm",
      },
      {
        name: "rubro_id",
        type: "string",
        description:
          "Nombre del rubro del gasto si se menciona (ej: 'carpintería', 'flete'); si no se menciona, no incluir el campo",
        required: false,
        source: "llm",
        isName: true,
      },
      {
        name: "descripcion",
        type: "string",
        description: "Detalle adicional del gasto, si lo hay",
        required: false,
        source: "llm",
      },
      {
        name: "moneda",
        type: "string",
        description:
          "'ARS' o 'USD' — 'USD' solo si se menciona explícitamente dólares/USD, si no 'ARS'",
        required: false,
        source: "llm",
      },
    ],
  },
  {
    path: "/bot/mensaje",
    method: "POST",
    description:
      "Guardar un mensaje general en la obra (cuando el mensaje no amerita otro endpoint específico)",
    params: [
      {
        name: "obra_id",
        type: "string",
        description: "ID o nombre de la obra",
        required: true,
        source: "obra_poll",
      },
      {
        name: "telefono",
        type: "string",
        description: "Teléfono del obrero",
        required: true,
        source: "user_phone",
      },
      {
        name: "tipo",
        type: "string",
        description: "tipo de mensaje: 'texto' (siempre texto por ahora)",
        required: true,
        source: "auto",
      },
      {
        name: "contenido",
        type: "string",
        description: "El mensaje tal cual lo escribió el usuario",
        required: true,
        source: "llm",
        prompt: "¿Qué mensaje querés dejar asentado?",
      },
    ],
  },
];

function assertRequiredPrompts(): void {
  const check = (param: EndpointParam, where: string): void => {
    if (param.required && param.source === "llm" && !param.prompt) {
      throw new Error(
        `${where}: el campo requerido "${param.name}" no tiene "prompt" de repregunta`,
      );
    }
    for (const sub of param.elementParams ?? []) {
      check(sub, `${where} → ${param.name}[]`);
    }
  };

  for (const endpoint of ENDPOINTS) {
    for (const param of endpoint.params) {
      check(param, endpoint.path);
    }
  }
}

assertRequiredPrompts();

export function getEndpointSchema(path: string): EndpointSchema | undefined {
  return ENDPOINTS.find((e) => e.path === path);
}

export interface ValidationResult {
  valid: boolean;
  missingRequired: string[];
}

export interface MissingField {
  opIndex: number;
  path: string;
  name: string;
  type: EndpointParam["type"];
  prompt: string;
  context?: string;
  examples?: string[];
  dataKey: string | null;
  itemIndex: number;
}

function isMissingValue(
  value: unknown,
  type?: EndpointParam["type"],
): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (typeof value === "number" && Number.isNaN(value)) return true;
  if (type === "array") return !Array.isArray(value) || value.length === 0;
  return false;
}

function elementLabel(
  params: EndpointParam[],
  item: Record<string, unknown>,
): string | undefined {
  for (const param of params) {
    if (!param.isName) continue;
    const value = item[param.name];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

export function collectMissingFields(
  endpoint: string,
  data: Record<string, unknown>,
  opIndex = 0,
): MissingField[] {
  const schema = getEndpointSchema(endpoint);
  if (!schema) return [];

  const missing: MissingField[] = [];

  for (const param of schema.params) {
    if (!param.required || param.source !== "llm") continue;

    const value = data[param.name];
    if (isMissingValue(value, param.type)) {
      missing.push({
        opIndex,
        path: param.name,
        name: param.name,
        type: param.type,
        prompt: param.prompt ?? `¿Me pasás el dato de "${param.name}"?`,
        examples: param.examples,
        dataKey: null,
        itemIndex: 0,
      });
      continue;
    }

    if (!param.elementParams || !Array.isArray(value)) continue;

    value.forEach((rawItem, itemIndex) => {
      if (!rawItem || typeof rawItem !== "object") return;
      const item = rawItem as Record<string, unknown>;
      const context = elementLabel(param.elementParams!, item);

      for (const sub of param.elementParams!) {
        if (!sub.required || sub.source !== "llm") continue;
        if (!isMissingValue(item[sub.name], sub.type)) continue;

        missing.push({
          opIndex,
          path: `${param.name}[${itemIndex}].${sub.name}`,
          name: sub.name,
          type: sub.type,
          prompt: sub.prompt ?? `¿Me pasás el dato de "${sub.name}"?`,
          context,
          examples: sub.examples,
          dataKey: param.name,
          itemIndex,
        });
      }
    });
  }

  return missing;
}

export function formatMissingQuestion(field: MissingField): string {
  return field.context ? `${field.prompt} (${field.context})` : field.prompt;
}

export function validateApiCall(
  endpoint: string,
  data: Record<string, unknown>,
): ValidationResult {
  const schema = getEndpointSchema(endpoint);
  if (!schema) {
    return {
      valid: false,
      missingRequired: [`endpoint "${endpoint}" no existe`],
    };
  }

  const missing = collectMissingFields(endpoint, data);
  return {
    valid: missing.length === 0,
    missingRequired: missing.map((m) => m.path),
  };
}

/**
 * Nombres de los campos de un endpoint que el bot completa automáticamente
 * con el teléfono del obrero (source "user_phone" + nombre que contenga "telefono").
 * Ej: /bot/tareas → creada_por_telefono.
 */
export function getUserPhoneFields(endpoint: string): string[] {
  const schema = getEndpointSchema(endpoint);
  if (!schema) return [];
  return schema.params
    .filter((p) => p.source === "user_phone" && p.name.toLowerCase().includes("telefono"))
    .map((p) => p.name);
}

function describeEndpoint(ep: EndpointSchema): string {
  const requiredFields = ep.params
    .filter((p) => p.required && p.source === "llm")
    .map((p) => `${p.name} (${p.description})`)
    .join(", ");
  const optionalFields = ep.params
    .filter((p) => !p.required)
    .map((p) => `${p.name} (${p.description})`)
    .join(", ");

  let desc = `  - ${ep.method} ${ep.path}: ${ep.description}`;
  if (requiredFields) desc += `\n    Requerido: ${requiredFields}`;
  if (optionalFields) desc += `\n    Opcional: ${optionalFields}`;
  return desc;
}

// paths opcional: si se pasa, describe solo esos endpoints (schema completo del
// endpoint en curso). Sin paths (o con paths desconocidos) describe todos.
export function buildEndpointDescription(paths?: string[]): string {
  const wanted = paths && paths.length > 0 ? paths : null;
  const selected = wanted
    ? ENDPOINTS.filter((e) => wanted.includes(e.path))
    : ENDPOINTS;
  const targets = selected.length > 0 ? selected : ENDPOINTS;
  return targets.map(describeEndpoint).join("\n\n");
}

// Índice compacto (una línea por endpoint) para que el LLM sepa qué endpoints
// existen sin cargar todas las descripciones de campos.
export function buildEndpointIndex(): string {
  return ENDPOINTS.map((ep) => {
    const required = ep.params
      .filter((p) => p.required && p.source === "llm")
      .map((p) => p.name)
      .join(", ");
    const suffix = required ? ` (requeridos: ${required})` : "";
    return `  - ${ep.method} ${ep.path}: ${ep.description}${suffix}`;
  }).join("\n");
}
