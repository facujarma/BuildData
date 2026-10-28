// Bitácora de la obra: escribe en la tabla `actividad` "quién hizo qué". Lo que se guarda
// acá lo muestran la pantalla Actividad (actividadController.getActividad), el widget
// "Avances de hoy" del dashboard, y lo consulta el ChatBot ("¿qué se hizo esta semana?").
// La llaman tareas, pedidos (ej. entregarPedido), gastos, alertas, presupuesto, galería y bot.

import { pool } from "../db.js"; // conexión a la base (también se usa para saber si `db` es el pool)

// tipo: uno de los que entiende el feed del frontend (KIND_ICONS en actividad/data):
// avance | pedido | problema | foto | cierre.

// Corre fn(db) sin que un error aborte la transacción del caller: con un client de pg
// (transacción abierta) usa un SAVEPOINT; con el pool corre directo. Si falla, loguea y
// devuelve `fallback`.
// Por qué hace falta: en Postgres, si UNA consulta falla dentro de una transacción, toda la
// transacción queda inválida. Un SAVEPOINT es un "punto de guardado": si la bitácora falla,
// volvemos a ese punto y el resto (ej. la entrega del pedido) sigue intacto.
async function intentar(db, fn, fallback) {
  // Un client de transacción tiene .release(); el pool no. Así distinguimos los dos casos.
  const enTransaccion = db !== pool && typeof db.release === "function";
  try {
    if (enTransaccion) await db.query("SAVEPOINT actividad"); // marca el punto de guardado
    const resultado = await fn(db); // hace el trabajo (insert o select)
    if (enTransaccion) await db.query("RELEASE SAVEPOINT actividad"); // salió bien: libera el punto
    return resultado;
  } catch (error) {
    // Salió mal: vuelve al punto de guardado (la transacción del caller sigue usable)
    if (enTransaccion) await db.query("ROLLBACK TO SAVEPOINT actividad").catch(() => {});
    console.error("[actividad] no se pudo registrar:", error.message); // solo se loguea, no se corta nada
    return fallback;
  }
}

// Registra una fila en la bitácora (tabla actividad). Best-effort: un fallo acá nunca
// tumba la operación que se está registrando. rubroId opcional: suma el nombre del
// rubro como tag.
export async function registrarActividad(
  db, // pool (operación suelta) o client (dentro de una transacción)
  { obraId, usuarioId = null, tipo, accion, texto = null, entidadTipo = null, entidadId = null, tags = [], rubroId = null }
) {
  if (!obraId || !accion) return; // sin obra o sin acción no hay nada que registrar
  await intentar(db, (c) =>
    c.query(
      // accion: verbo corto ("registró una entrega"); texto: la frase que ve el usuario;
      // entidad_tipo/entidad_id: a qué registro se refiere (ej. 'pedido' + id del pedido).
      // El ARRAY(...) final arma los tags: los que vienen + el nombre del rubro (si hay),
      // sin repetidos (DISTINCT) y sin vacíos.
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
// La usa pedidosController.actividadPedido para armar frases como
// "Registró la entrega de Cemento (+2 más) (Aceros Norte) · recibió Juan".
export async function resumenPedido(db, pedidoId) {
  // Si algo falla, se describe genérico en vez de romper
  const fallback = { material: "materiales", proveedor: null, rubroId: null, tags: [] };
  return intentar(
    db,
    async (c) => {
      // Trae rubro, urgencia, nombre del proveedor, el primer material del pedido y cuántos ítems tiene
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
      if (!p) return fallback; // el pedido no existe
      const extra = p.items > 1 ? ` (+${p.items - 1} más)` : ""; // "+2 más" si hay varios materiales
      return {
        material: p.material ? `${p.material}${extra}` : "materiales",
        proveedor: p.proveedor,
        rubroId: p.rubro_id, // registrarActividad lo convierte en tag con el nombre del rubro
        tags: p.urgente ? ["Urgente"] : [],
      };
    },
    fallback
  );
}
