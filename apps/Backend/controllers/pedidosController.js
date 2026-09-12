import { pool } from "../db.js";

// GET /pedidos/:obra_id — pedidos de una obra con proveedor, persona y ítems.
// Devuelve datos crudos (snake_case, estados en español); el frontend hace el mapping de presentación.
export async function getPedidos(req, res) {
  const { obra_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         pm.id,
         pm.estado,
         pm.aprobado,
         pm.fecha,
         pm.fecha_llegada_estimada,
         pm.urgente,
         pm.nota,
         pm.categoria,
         pr.nombre AS proveedor_nombre,
         sp.nombre AS solicitado_por_nombre,
         ap.nombre AS aprobado_por_nombre,
         COALESCE((
           SELECT json_agg(
             json_build_object(
               'material', m.nombre,
               'unidad', m.unidad,
               'cantidad', i.cantidad,
               'precio_unitario', i.precio_unitario
             )
           )
           FROM pedidos_items i
           LEFT JOIN materiales m ON m.id = i.material_id
           WHERE i.pedido_id = pm.id
         ), '[]') AS items
       FROM pedidos_materiales pm
       LEFT JOIN proveedores pr ON pr.id = pm.proveedor_id
       LEFT JOIN personas sp ON sp.id = pm.solicitado_por
       LEFT JOIN personas ap ON ap.id = pm.aprobado_por
       WHERE pm.obra_id = $1
       ORDER BY pm.fecha DESC`,
      [obra_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

async function resolverProveedor(client, nombre) {
  const existente = await client.query(
    `SELECT * FROM proveedores WHERE lower(nombre) = lower($1) LIMIT 1`,
    [nombre]
  );
  if (existente.rows[0]) return existente.rows[0];
  // Requiere el índice único proveedores_nombre_unique (migración)
  const creado = await client.query(
    `INSERT INTO proveedores (nombre) VALUES ($1)
     ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
     RETURNING *`,
    [nombre]
  );
  return creado.rows[0];
}

// POST /pedidos — crear pedido desde la web (usuario autenticado)
// Body: {
//   obra_id, proveedor_nombre,
//   items: [{ material_nombre, unidad?, cantidad, precio_unitario }],
//   categoria?, urgente?, nota?, fecha_llegada_estimada?, solicitado_por?
// }
export async function crearPedidoWeb(req, res) {
  const {
    obra_id,
    proveedor_nombre,
    items,
    categoria,
    urgente,
    nota,
    fecha_llegada_estimada,
    solicitado_por,
  } = req.body;

  if (!obra_id) return res.status(400).json({ error: "obra_id es requerido" });
  if (!proveedor_nombre || !proveedor_nombre.trim()) {
    return res.status(400).json({ error: "proveedor_nombre es requerido" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items debe ser un array no vacío" });
  }

  const obra = await pool.query(`SELECT id FROM obras WHERE id = $1`, [obra_id]);
  if (obra.rows.length === 0) {
    return res.status(404).json({ error: "obra_id no encontrada" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const proveedor = await resolverProveedor(client, proveedor_nombre.trim());
    const proveedor_id = proveedor.id;

    const itemsFinal = [];
    for (const item of items) {
      const nombre = (item.material_nombre || "").trim();
      let materialId = null;
      if (nombre) {
        const existente = await client.query(
          `SELECT id FROM materiales WHERE obra_id = $1 AND lower(nombre) = lower($2) LIMIT 1`,
          [obra_id, nombre]
        );
        if (existente.rows[0]) {
          materialId = existente.rows[0].id;
        } else {
          const creado = await client.query(
            `INSERT INTO materiales (obra_id, nombre, unidad, costo_unitario)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [obra_id, nombre, item.unidad || null, Number(item.precio_unitario) || null]
          );
          materialId = creado.rows[0].id;
        }
      }
      itemsFinal.push({
        material_id: materialId,
        cantidad: Number(item.cantidad) || 0,
        precio_unitario: Number(item.precio_unitario) || 0,
      });
    }

    const solicitadoPor = solicitado_por || req.personaId || null;

    const pedido = await client.query(
      `INSERT INTO pedidos_materiales
         (obra_id, proveedor_id, estado, aprobado, urgente, nota, fecha_llegada_estimada, solicitado_por, categoria)
       VALUES ($1, $2, 'pendiente', false, $3, $4, $5, $6, $7)
       RETURNING *`,
      [obra_id, proveedor_id, urgente || false, nota || null, fecha_llegada_estimada || null, solicitadoPor, categoria || null]
    );
    const pedido_id = pedido.rows[0].id;

    for (const it of itemsFinal) {
      await client.query(
        `INSERT INTO pedidos_items (pedido_id, material_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedido_id, it.material_id, it.cantidad, it.precio_unitario]
      );
    }

    await client.query(
      `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity)
       VALUES ($1, 'pedido_pendiente', 'Nuevo pedido de compra requiere aprobación', 'alta', $2, 'Nuevo pedido de compra', 'Requiere aprobación para ejecutar la compra', 'attention')`,
      [obra_id, solicitadoPor]
    );

    await client.query("COMMIT");
    res.status(201).json(pedido.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  } finally {
    client.release();
  }
}

// PATCH /pedidos/:id/aprobar
export async function aprobarPedido(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE pedidos_materiales
       SET estado = 'aprobado', aprobado = true, fecha_aprobacion = CURRENT_TIMESTAMP, aprobado_por = $1
       WHERE id = $2
       RETURNING *`,
      [req.personaId || null, id]
    );
    if (!result.rows[0]) return res.status(404).json({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// PATCH /pedidos/:id/rechazar
export async function rechazarPedido(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE pedidos_materiales
       SET estado = 'rechazado', aprobado = false, fecha_aprobacion = NULL, aprobado_por = NULL
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}