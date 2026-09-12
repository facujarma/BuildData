export interface EndpointParam {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  source: "obra_poll" | "user_phone" | "llm" | "auto" | "entity_resolution";
  isName?: boolean;
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
      },
    ],
  },

  {
    path: "/bot/pedidos",
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
          "Nombre del proveedor al que se realizará el pedido. Si el proveedor no existe, se crea automáticamente.",
        required: false,
        source: "llm",
        isName: true,
      },
      {
        name: "items",
        type: "array",
        description:
          "Material a pedir. Debe tener material_nombre y cantidad, y puede incluir categoria, unidad y precio_unitario.",
        required: true,
        source: "llm",
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
          "Fecha estimada en la que se necesita recibir el pedido, si el usuario la especifica.",
        required: false,
        source: "llm",
      },
      {
        name: "solicitado_por",
        type: "string",
        description:
          "ID de la persona que solicita el pedido. Si no se proporciona, el backend utiliza req.personaId.",
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
      },
      {
        name: "dias_retraso",
        type: "number",
        description: "Cantidad de días de retraso",
        required: true,
        source: "llm",
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
        name: "id",
        type: "string",
        description:
          "UUID de la tarea, resuelto por el pipeline de match de entidades (match_tareas), no lo genera el LLM",
        required: true,
        source: "entity_resolution",
      },
      {
        name: "completada",
        type: "boolean",
        description:
          "true si el obrero terminó el trabajo, false si hay que revertir una marca anterior",
        required: true,
        source: "llm",
      },
      {
        name: "completada_por_telefono",
        type: "string",
        description:
          "Teléfono del obrero que completó el trabajo (requerido si completada=true)",
        required: false,
        source: "user_phone",
      },
      {
        name: "porcentaje_avance",
        type: "number",
        description:
          "Porcentaje de avance (opcional; default 100 si completada=true, sin cambio si completada=false)",
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
      },
    ],
  },
];

export function getEndpointSchema(path: string): EndpointSchema | undefined {
  return ENDPOINTS.find((e) => e.path === path);
}

export interface ValidationResult {
  valid: boolean;
  missingRequired: string[];
}

export function validateApiCall(
  endpoint: string,
  data: Record<string, unknown>,
): ValidationResult {
  console.log(`Validando endpoint ${endpoint}:`, { data });
  const schema = getEndpointSchema(endpoint);
  if (!schema) {
    return {
      valid: false,
      missingRequired: [`endpoint "${endpoint}" no existe`],
    };
  }

  const missing = schema.params
    .filter((p) => p.required && p.source === "llm")
    .filter((p) => data[p.name] === undefined || data[p.name] === null)
    .map((p) => p.name);

    console.log(`Validando endpoint ${endpoint}:`, { data, missing });
  return {
    valid: missing.length === 0,
    missingRequired: missing,
  };
}

export function buildEndpointDescription(): string {
  return ENDPOINTS.map((ep) => {
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
  }).join("\n\n");
}
