import { pool } from "../db.js";

// tipo: uno de los que entiende el feed del frontend (KIND_ICONS en actividad/data):
// avance | pedido | problema | foto | cierre.

// Corre fn(db) sin que un error aborte la transacción del caller: con un client de pg
// (transacción abierta) usa un SAVEPOINT; con el pool corre directo. Si falla, loguea y
// devuelve `fallback`.
async function intentar(db, fn, fallback) {
  const enTransaccion = db !== pool && typeof db.release === "function";
  try {
    if (enTransaccion) await db.query("SAVEPOINT actividad");
    const resultado = await fn(db);
    if (enTransaccion) await db.query("RELEASE SAVEPOINT actividad");
    return resultado;
  } catch (error) {
    if (enTransaccion) await db.query("ROLLBACK TO SAVEPOINT actividad").catch(() => {});
    console.error("[actividad] no se pudo registrar:", error.message);
    return fallback;
  }
}

// Registra una fila en la bitácora (tabla actividad). Best-effort: un fallo acá nunca
// tumba la operación que se está registrando. rubroId opcional: suma el nombre del
// rubro como tag.
export async function registrarActividad(
  db,
  { obraId, usuarioId = null, tipo, accion, texto = null, entidadTipo = null, entidadId = null, tags = [], rubroId = null }
) {
  if (!obraId || !accion) return;
  await intentar(db, (c) =>
    c.query(
      `INSERT INTO actividad (obra_id, usuario_id, accion, tipo, texto, entidad_tipo, entidad_id, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7,
               ARRAY(SELECT DISTINCT t FROM unnest(
                 $8::text[] || COALESCE((SELECT ARRAY[nombre::text] FROM rubros WHERE id = $9), '{}')
               ) AS t WHERE t IS NOT NULL AND t <> ''))`,
      [obraId, usuarioId, accion, tipo, texto, entidadTipo, entidadId, tags, rubroId]
    )
  );
}

// Datos de un pedido para describirlo en la bitácora.
// material: "Cemento (+2 más)"; proveedor puede ser null.
export async function resumenPedido(db, pedidoId) {
  const fallback = { material: "materiales", proveedor: null, rubroId: null, tags: [] };
  return intentar(
    db,
    async (c) => {
      const { rows } = await c.query(
        `SELECT pm.rubro_id, pm.urgente, pr.nombre AS proveedor,
                (SELECT m.nombre FROM pedidos_items i JOIN materiales m ON m.id = i.material_id
                 WHERE i.pedido_id = pm.id ORDER BY i.id LIMIT 1) AS material,
                (SELECT count(*) FROM pedidos_items i WHERE i.pedido_id = pm.id)::int AS items
         FROM pedidos_materiales pm
         LEFT JOIN proveedores pr ON pr.id = pm.proveedor_id
         WHERE pm.id = $1`,
        [pedidoId]
      );
      const p = rows[0];
      if (!p) return fallback;
      const extra = p.items > 1 ? ` (+${p.items - 1} más)` : "";
      return {
        material: p.material ? `${p.material}${extra}` : "materiales",
        proveedor: p.proveedor,
        rubroId: p.rubro_id,
        tags: p.urgente ? ["Urgente"] : [],
      };
    },
    fallback
  );
}
