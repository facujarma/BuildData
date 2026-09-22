import { ApiCall } from "../handlers/pendingQuery.store";
import {
  EntidadCandidata,
  EntidadResuelta,
  mapearResultadoBusqueda,
} from "./entityMatch.service";
import { buscarEntidades } from "./api.service";
import { displayPath } from "./actionExecuted.service";

export type EntityKind = "material" | "proveedor" | "rubro" | "tarea";

// Resolución sin LLM: busca por similitud en el Backend (exacto → fuzzy →
// embeddings). Si la búsqueda falla, se comporta como "sin match".
async function resolverEntidad(
  rawValue: string,
  kind: EntityKind,
  obraId: string,
): Promise<EntidadResuelta> {
  try {
    const resultado = await buscarEntidades(obraId, kind, rawValue);
    const top = resultado.candidatos
      .slice(0, 3)
      .map(
        (c) =>
          `${c.nombre}:${typeof c.similitud === "number" ? c.similitud.toFixed(3) : "?"}`,
      )
      .join(" | ");
    console.log(
      `[entityResolution] "${rawValue}" (${kind}) → confianza=${resultado.confianza}${top ? `, top=${top}` : ""}`,
    );
    return mapearResultadoBusqueda(resultado);
  } catch (error) {
    console.error(
      `[entityResolution] búsqueda falló para "${rawValue}":`,
      error,
    );
    return { match_id: null, confianza: "ninguna", candidatos: [] };
  }
}

export interface EntityQuestion {
  entity: string;
  kind: EntityKind;
  opIndex: number;
  dataKey: string | null; // null → el slot está en la raíz del data; si no, es la key del array (items/movimientos)
  itemIndex: number; // índice dentro del array (irrelevante si dataKey es null)
  slotKey: string;
  options: EntidadCandidata[]; // opciones para la encuesta (sin contar "Ninguno" ni "Cancelar")
}

interface SlotDef {
  key: string;
  targetKey: string;
  kind: EntityKind;
}

// Campos "nombre" que emite el LLM y el ID real que espera el Backend.
const SLOTS: SlotDef[] = [
  { key: "material_nombre", targetKey: "material_id", kind: "material" },
  { key: "nombre", targetKey: "material_id", kind: "material" }, // movimientos del stock
  { key: "proveedor_nombre", targetKey: "proveedor_id", kind: "proveedor" },
  { key: "tarea", targetKey: "tarea_id", kind: "rubro" }, // /bot/retraso → identifica rubros
  { key: "rubro_id", targetKey: "rubro_id", kind: "rubro" },
  { key: "tarea_nombre", targetKey: "tarea_id", kind: "tarea" }, // /bot/tareas/:id/completar → identifica tareas reales
];

// Claves que solo tienen sentido dentro de un array de items (no en el data raíz).
const ARRAY_ONLY_KEYS = new Set(["nombre"]);

// Arreglos dentro de un op que contienen items con slots anidados (pedidos → items, stock → movimientos).
const ARRAY_KEYS = new Set(["items", "movimientos"]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isId(value: unknown): boolean {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Recorre un op buscando campos de nombre (materiales/proveedores/rubros/tareas).
 * Aplica lo que se resuelve con confianza alta y devuelve la PRIMERA pregunta
 * pendiente si no hay match confiable, o null.
 */
export async function resolveOperationEntities(
  op: ApiCall,
  obraId: string,
  opIndex: number,
): Promise<EntityQuestion | null> {
  const data = op.data as Record<string, unknown>;

  const question = await resolveContainer(data, null, 0, obraId, op, opIndex);
  if (question) return question;

  for (const [arrayKey, value] of Object.entries(data)) {
    if (!ARRAY_KEYS.has(arrayKey) || !Array.isArray(value)) continue;
    for (let i = 0; i < value.length; i++) {
      const item = value[i] as Record<string, unknown>;
      if (!item || typeof item !== "object") continue;
      const q = await resolveContainer(item, arrayKey, i, obraId, op, opIndex);
      if (q) return q;
    }
  }

  return null;
}

async function resolveContainer(
  container: Record<string, unknown>,
  dataKey: string | null,
  itemIndex: number,
  obraId: string,
  op: ApiCall,
  opIndex: number,
): Promise<EntityQuestion | null> {
  for (const slot of SLOTS) {
    if (dataKey === null && ARRAY_ONLY_KEYS.has(slot.key)) continue;
    const rawValue = container[slot.key];
    if (typeof rawValue !== "string" || rawValue.trim() === "" || isId(rawValue)) continue;
    if (slot.targetKey !== slot.key && isId(container[slot.targetKey])) continue;

    const question = await resolveSlot(container, slot, rawValue, obraId, opIndex, dataKey, itemIndex, op);
    if (question) return question;
  }
  return null;
}

async function resolveSlot(
  container: Record<string, unknown>,
  slot: SlotDef,
  rawValue: string,
  obraId: string,
  opIndex: number,
  dataKey: string | null,
  itemIndex: number,
  op: ApiCall,
): Promise<EntityQuestion | null> {
  const resolved = await resolverEntidad(rawValue, slot.kind, obraId);

  console.log(`[entityResolution] slot "${slot.key}" con valor "${rawValue}" → match_id=${resolved.match_id}, confianza=${resolved.confianza}, candidatos=${resolved.candidatos.map((c) => c.id).join(",")}`);

  // Guarda el nombre legible de la entidad resuelta para el action_executed del mensaje.
  const remember = (nombre: string): void => {
    if (!op.display) op.display = {};
    op.display[displayPath(dataKey, itemIndex, slot.targetKey)] = nombre;
  };
  const apply = (id: string, nombre: string): void => {
    if (slot.key !== slot.targetKey) delete container[slot.key];
    container[slot.targetKey] = id;
    remember(nombre);
  };

  // Match claro: se aplica directo (el top viene entre los candidatos).
  if (resolved.confianza === "alta" && resolved.match_id) {
    apply(resolved.match_id, nameOfMatch(resolved, rawValue));
    return null;
  }

  // Confianza baja o ninguna con candidatos: se encuesta (en "ninguna" son los
  // parecidos más flojos).
  if (resolved.candidatos.length > 0) {
    return {
      entity: rawValue,
      kind: slot.kind,
      opIndex,
      dataKey,
      itemIndex,
      slotKey: slot.key,
      options: resolved.candidatos,
    };
  }

  // Sin match ni candidatos: se pregunta sin opciones (el usuario solo puede
  // cancelar). No se auto-crean ni se omiten entidades.
  return {
    entity: rawValue,
    kind: slot.kind,
    opIndex,
    dataKey,
    itemIndex,
    slotKey: slot.key,
    options: [],
  };
}

function nameOfMatch(resolved: EntidadResuelta, fallback: string): string {
  const match = resolved.candidatos.find((c) => c.id === resolved.match_id);
  return match?.nombre || fallback;
}

/**
 * Aplica la respuesta del usuario a una encuesta de entidad dentro del pending.
 * - option con id → se setea ese id en el slot.
 * - option null ("Ninguno de estos") no llega acá: handleEntityTextReply lo
 *   intercepta y cancela con error antes de llamar.
 */
export async function applyQuestionAnswer(
  pending: { type?: unknown; operation?: ApiCall[] },
  question: EntityQuestion,
  option: EntidadCandidata | null,
  obraId: string,
): Promise<void> {
  const op = pending.operation?.[question.opIndex];
  if (!op) return;
  const data = op.data as Record<string, unknown>;

  const container =
    question.dataKey && Array.isArray(data[question.dataKey])
      ? ((data[question.dataKey] as unknown[])[question.itemIndex] as Record<string, unknown>)
      : data;

  if (!container || typeof container !== "object") return;
  const slot = SLOTS.find((s) => s.key === question.slotKey);
  if (!slot) return;

  const set = (id: string, nombre?: string): void => {
    if (slot.key !== slot.targetKey) delete container[slot.key];
    container[slot.targetKey] = id;
    if (nombre) {
      if (!op.display) op.display = {};
      op.display[displayPath(question.dataKey, question.itemIndex, slot.targetKey)] = nombre;
    }
  };

  if (option?.id) {
    set(option.id, option.nombre);
    return;
  }
}
