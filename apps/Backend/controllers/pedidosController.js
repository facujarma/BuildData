import { pool } from "../db.js";
import {
  guardarEmbedding,
  guardarEmbeddings,
} from "../services/embeddings.service.js";
import { aplicarMovimientoStock } from "../services/stock.service.js";
import { esMiembroDeObra, obraDePedido } from "../services/obraAccess.service.js";

const sinAcceso = (res) =>
  res.status(403).json({ code: "FORBIDDEN", message: "No pertenecés a esta obra" });
const noEncontrado = (res) =>
  res.status(404).json({ code: "NOT_FOUND", message: "Pedido no encontrado" });

// Estados desde los que un pedido puede avanzar a en_camino / demorado / entregado
const ESTADOS_EN_CURSO = ["aprobado", "en_camino", "demorado"];

// GET /pedidos/:obra_id — pedidos de una obra con proveedor, persona y ítems.
// Devuelve datos crudos (snake_case, estados en español); el frontend hace el mapping de presentación.
export async function getPedidos(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
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
         to_char(pm.fecha_entrega, 'YYYY-MM-DD"T"HH24:MI') AS fecha_entrega, -- texto: sin corrimiento de zona horaria
         pm.ubicacion_entrega,
         pm.recibido_por,
         pm.documento_receptor,
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
  if (existente.rows[0]) return { ...existente.rows[0], creado: false };
  // Requiere el índice único proveedores_nombre_unique (migración)
  const creado = await client.query(
    `INSERT INTO proveedores (nombre) VALUES ($1)
     ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
     RETURNING *`,
    [nombre]
  );
  return { ...creado.rows[0], creado: true };
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
  if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);

  const client = await pool.connect();
  const materialesCreados = [];
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
          `SELECT id FROM materiales WHERE obra_id = $1 AND activo AND lower(nombre) = lower($2) LIMIT 1`,
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
          materialesCreados.push({ id: materialId, nombre });
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
    if (proveedor.creado) {
      await guardarEmbedding("proveedor", proveedor.id, proveedor.nombre);
    }
    await guardarEmbeddings("material", materialesCreados);
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
    const dueno = await obraDePedido(id);
    if (!dueno) return noEncontrado(res);
    if (!(await esMiembroDeObra(req.personaId, dueno.obra_id))) return sinAcceso(res);
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
    const dueno = await obraDePedido(id);
    if (!dueno) return noEncontrado(res);
    if (!(await esMiembroDeObra(req.personaId, dueno.obra_id))) return sinAcceso(res);
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

// PATCH /pedidos/:id/estado
// Body: { estado: 'en_camino' | 'demorado' } — solo para pedidos aprobados o ya en curso.
export async function cambiarEstadoPedido(req, res) {
  const { id } = req.params;
  const { estado } = req.body;
  if (estado !== "en_camino" && estado !== "demorado") {
    return res.status(400).json({ code: "VALIDATION", message: "estado debe ser 'en_camino' o 'demorado'" });
  }
  try {
    const dueno = await obraDePedido(id);
    if (!dueno) return noEncontrado(res);
    if (!(await esMiembroDeObra(req.personaId, dueno.obra_id))) return sinAcceso(res);

    const result = await pool.query(
      `UPDATE pedidos_materiales SET estado = $1
       WHERE id = $2 AND estado = ANY($3)
       RETURNING *`,
      [estado, id, ESTADOS_EN_CURSO]
    );
    if (!result.rows[0]) {
      return res.status(409).json({ code: "INVALID_STATE", message: "El pedido debe estar aprobado o en curso" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
}

// PATCH /pedidos/:id/entregar
// Body: { ubicacion, recibido_por, documento?, fecha? (YYYY-MM-DD), hora? (HH:MM) }
// Marca el pedido como entregado y suma los ítems al stock (movimiento 'entrada' por cada material).
export async function entregarPedido(req, res) {
  const { id } = req.params;
  const ubicacion = typeof req.body.ubicacion === "string" ? req.body.ubicacion.trim() : "";
  const recibidoPor = typeof req.body.recibido_por === "string" ? req.body.recibido_por.trim() : "";
  const documento = typeof req.body.documento === "string" ? req.body.documento.trim() : "";
  const { fecha, hora } = req.body;

  if (!ubicacion || !recibidoPor) {
    return res.status(400).json({ code: "VALIDATION", message: "ubicacion y recibido_por son requeridos" });
  }
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ code: "VALIDATION", message: "fecha debe tener formato YYYY-MM-DD" });
  }
  if (hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    return res.status(400).json({ code: "VALIDATION", message: "hora debe tener formato HH:MM" });
  }
  // Sin fecha → ahora (CURRENT_TIMESTAMP); con fecha y sin hora → 00:00
  const fechaEntrega = fecha ? `${fecha} ${hora || "00:00"}` : null;

  let client;
  try {
    const dueno = await obraDePedido(id);
    if (!dueno) return noEncontrado(res);
    if (!(await esMiembroDeObra(req.personaId, dueno.obra_id))) return sinAcceso(res);

    client = await pool.connect();
    await client.query("BEGIN");

    // FOR UPDATE: evita sumar el stock dos veces ante un doble click
    const pedido = await client.query(`SELECT id, obra_id, estado FROM pedidos_materiales WHERE id = $1 FOR UPDATE`, [id]);
    if (!ESTADOS_EN_CURSO.includes(pedido.rows[0].estado)) {
      await client.query("ROLLBACK");
      return res.status(409).json({ code: "INVALID_STATE", message: "Solo se pueden entregar pedidos aprobados o en curso" });
    }

    const actualizado = await client.query(
      `UPDATE pedidos_materiales
       SET estado = 'entregado',
           fecha_entrega = COALESCE($1::timestamp, CURRENT_TIMESTAMP),
           ubicacion_entrega = $2,
           recibido_por = $3,
           documento_receptor = $4
       WHERE id = $5
       RETURNING *`,
      [fechaEntrega, ubicacion, recibidoPor, documento || null, id]
    );

    const items = await client.query(
      `SELECT material_id, cantidad FROM pedidos_items
       WHERE pedido_id = $1 AND material_id IS NOT NULL AND cantidad > 0`,
      [id]
    );
    for (const item of items.rows) {
      await aplicarMovimientoStock(client, {
        materialId: item.material_id,
        obraId: dueno.obra_id,
        usuarioId: req.personaId || null,
        tipo: "entrada",
        cantidad: Number(item.cantidad),
        observacion: `Entrada por pedido ${id.slice(0, 8)}`,
      });
    }

    await client.query("COMMIT");
    res.json(actualizado.rows[0]);
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  } finally {
    if (client) client.release();
  }
}
