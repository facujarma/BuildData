import { ApiCall } from "../handlers/pendingQuery.store";
import { resolveEntity, EntidadCandidata, EntidadResuelta } from "./llm.service";
import { Catalogo, crearMaterial, buscarEntidades } from "./api.service";
import { mapearResultadoBusqueda } from "./entityMatch.service";
import { displayPath } from "./actionExecuted.service";

export type EntityKind = "material" | "proveedor" | "rubro" | "tarea";

export type MotorResolucion = "llm" | "embeddings";

// Motor de resolución de nombres → IDs: `llm` (default) o `embeddings`
// (Backend /bot/entidades/buscar, con fallback a LLM si la búsqueda falla).
export function motorResolucion(): MotorResolucion {
  return process.env.ENTITY_RESOLVER === "embeddings" ? "embeddings" : "llm";
}

async function resolverEntidad(
  rawValue: string,
  kind: EntityKind,
  candidates: EntidadCandidata[],
  obraId: string,
): Promise<EntidadResuelta> {
  if (motorResolucion() === "embeddings") {
    try {
      const resultado = await buscarEntidades(obraId, kind, rawValue);
      const top = resultado.candidatos
        .slice(0, 3)
        .map((c) =>
          `${c.nombre}:${typeof c.similitud === "number" ? c.similitud.toFixed(3) : "?"}`,
        )
        .join(" | ");
      console.log(
        `[entityResolution] embeddings "${rawValue}" (${kind}) → confianza=${resultado.confianza}${top ? `, top=${top}` : ""}`,
      );
      return mapearResultadoBusqueda(resultado);
    } catch (error) {
      console.error(
        `[entityResolution] búsqueda por embeddings falló para "${rawValue}", caigo a LLM:`,
        error,
      );
    }
  }
  return resolveEntity(rawValue, kind, candidates);
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
 * Recorre un op buscando campos de nombre (materiales/proveedores/rubros).
 * Aplica lo que se resuelve con confianza (alto match o auto-creación de material)
 * y devuelve la PRIMERA pregunta pendiente si el LLM no está seguro, o null.
 */
export async function resolveOperationEntities(
  op: ApiCall,
  catalogo: Catalogo | null,
  obraId: string,
  opIndex: number,
): Promise<EntityQuestion | null> {
  const data = op.data as Record<string, unknown>;

  const question = await resolveContainer(data, null, 0, catalogo, obraId, op, opIndex);
  if (question) return question;

  for (const [arrayKey, value] of Object.entries(data)) {
    if (!ARRAY_KEYS.has(arrayKey) || !Array.isArray(value)) continue;
    for (let i = 0; i < value.length; i++) {
      const item = value[i] as Record<string, unknown>;
      if (!item || typeof item !== "object") continue;
      const q = await resolveContainer(item, arrayKey, i, catalogo, obraId, op, opIndex);
      if (q) return q;
    }
  }

  return null;
}

async function resolveContainer(
  container: Record<string, unknown>,
  dataKey: string | null,
  itemIndex: number,
  catalogo: Catalogo | null,
  obraId: string,
  op: ApiCall,
  opIndex: number,
): Promise<EntityQuestion | null> {
  for (const slot of SLOTS) {
    if (dataKey === null && ARRAY_ONLY_KEYS.has(slot.key)) continue;
    const rawValue = container[slot.key];
    if (typeof rawValue !== "string" || rawValue.trim() === "" || isId(rawValue)) continue;
    if (slot.targetKey !== slot.key && isId(container[slot.targetKey])) continue;

    const question = await resolveSlot(container, slot, rawValue, catalogo, obraId, opIndex, dataKey, itemIndex, op);
    if (question) return question;
  }
  return null;
}

async function resolveSlot(
  container: Record<string, unknown>,
  slot: SlotDef,
  rawValue: string,
  catalogo: Catalogo | null,
  obraId: string,
  opIndex: number,
  dataKey: string | null,
  itemIndex: number,
  op: ApiCall,
): Promise<EntityQuestion | null> {
  const candidates = catalogList(catalogo, slot.kind);
  const resolved = await resolverEntidad(rawValue, slot.kind, candidates, obraId);

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
  const drop = (): void => {
    delete container[slot.key];
  };

  if(resolved.candidatos.length > 0){
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

  if (resolved.match_id && resolved.confianza === "alta") {
    apply(resolved.match_id, nameOfMatch(resolved, candidates, rawValue));
    return null;
  }

  if (resolved.match_id && resolved.confianza === "baja" && resolved.candidatos.length > 0) {
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

  if (resolved.match_id) {
    apply(resolved.match_id, nameOfMatch(resolved, candidates, rawValue));
    return null;
  }

  // Sin match confiable: el proveedor es opcional y se omite; el resto se
  // pregunta con las opciones disponibles (aunque el parecido sea flojo). No se
  // auto-crean entidades en la resolución.
  if (slot.kind === "proveedor") {
    drop();
    return null;
  }

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

function catalogList(catalogo: Catalogo | null, kind: EntityKind): EntidadCandidata[] {
  if (!catalogo) return [];
  switch (kind) {
    case "material":
      return catalogo.materiales ?? [];
    case "proveedor":
      return catalogo.proveedores ?? [];
    case "rubro":
      return catalogo.rubros ?? [];
    case "tarea":
      return catalogo.tareas ?? [];
  }
}

function nameOfMatch(resolved: EntidadResuelta, catalogo: EntidadCandidata[], fallback: string): string {
  const match =
    resolved.candidatos.find((c) => c.id === resolved.match_id) ??
    catalogo.find((c) => c.id === resolved.match_id);
  return match?.nombre || fallback;
}

// Qué secciones del catálogo necesita cada endpoint → el bot solo pide lo necesario.
// Inicialmente solo cubre pedidos y tareas; el resto de endpoints se agregan acá
// a medida que se pulen (endpoint desconocido → sin catálogo).
const ENDPOINT_CATALOG_KINDS: Record<string, EntityKind[]> = {
  "/bot/pedidoDeCompra": ["material", "proveedor"],
  "/bot/tareas": ["rubro"], // crear tarea: rubro_id opcional
  "/bot/tareas/:id/completar": ["tarea"],
};

const KIND_TO_CATALOG: Record<EntityKind, string> = {
  material: "materiales",
  proveedor: "proveedores",
  rubro: "rubros",
  tarea: "tareas",
};

// Unión de secciones de catálogo requeridas por todos los ops de la operación pendiente.
// Devuelve null si hay algún endpoint no mapeado (entonces se trae el catálogo completo,
// backward-compatible con los endpoints que todavía no están pulidos).
export function neededCatalogTipos(ops: ApiCall[]): string[] | null {
  const set = new Set<string>();
  for (const op of ops) {
    const kinds = ENDPOINT_CATALOG_KINDS[op.endpoint];
    if (!kinds) return null;
    for (const kind of kinds) {
      set.add(KIND_TO_CATALOG[kind]);
    }
  }
  return [...set];
}

/**
 * Aplica la respuesta del usuario a una encuesta de entidad dentro del pending.
 * - option con id → se setea ese id en el slot.
 * - option null ("Ninguno de estos") → material se auto-crea; proveedor/rubro se descartan.
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

  // "Ninguno de estos"
  if (slot.kind === "material") {
    try {
      const created = await crearMaterial({ obra_id: obraId, nombre: question.entity.trim() });
      set(created.id, created.nombre || question.entity.trim());
    } catch (error) {
      console.error(`[entityResolution] no pude auto-crear material "${question.entity}":`, error);
    }
  } else {
    delete container[slot.key];
  }
}