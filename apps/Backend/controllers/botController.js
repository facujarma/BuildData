import { pool } from "../db.js";
import { resolvePersonaIdByTelefono } from "../services/personaService.js";
import { aplicarMovimientoStock, calcularDeltaAjuste } from "../services/stock.service.js";
import { proveedorAccesible } from "../services/obraAccess.service.js";

// ============================================================
// CONTRATO DE API CON FACU (bot de WhatsApp)
// Facu llama a estos endpoints después de procesar el mensaje.
// Nunca escribe SQL directo — siempre pasa por acá.
// ============================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ESTADOS_PROCESAMIENTO = new Set(["pendiente", "procesado", "error"]);


// POST /bot/mensaje
// Facu manda el mensaje crudo. Nosotros lo guardamos con estado 'pendiente'.
// Facu después lo procesa y llama a los endpoints específicos según el tipo.
// Los mensajes NO se registran en el feed de actividad (tienen su propia sección).
export async function recibirMensaje(req, res) {
  const { obra_id, telefono, tipo, contenido } = req.body;
  if (!telefono) return res.status(400).json({ error: "telefono es requerido" });

  const usuario_id = await resolvePersonaIdByTelefono(telefono);
  if (!usuario_id) return res.status(404).json({ error: "Persona no encontrada para el teléfono proporcionado" });

  try {
    const result = await pool.query(
      `INSERT INTO mensajes (obra_id, usuario_id, tipo, contenido, estado_procesamiento)
       VALUES ($1, $2, $3, $4, 'pendiente')
       RETURNING *`,
      [obra_id, usuario_id, tipo, contenido]
    );

    // Se llama en cada interacción del bot → es el punto único para trackear actividad
    // de la obra (usado por alertasController.verificarInactividad) y cerrar cualquier
    // alerta de inactividad abierta, ya que la obra volvió a tener movimiento.
    await pool.query(
      `UPDATE obras SET
        last_activity = CURRENT_TIMESTAMP,
        last_activity_who = COALESCE((SELECT nombre FROM personas WHERE id = $1), last_activity_who)
       WHERE id = $2`,
      [usuario_id, obra_id]
    );
    await pool.query(
      `UPDATE alertas SET resuelta = true WHERE obra_id = $1 AND tipo = 'inactividad' AND resuelta = false`,
      [obra_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error guardando mensaje" });
  }
}


// PATCH /bot/mensaje/:id
// Facu ya ejecutó (o intentó ejecutar) la operación interpretada → persistimos
// cada acción en mensajes.action_executed (jsonb[], una entry por llamada) para
// que el frontend renderice la interpretación de la IA.
// Body esperado: { action_executed: [ ... ], estado_procesamiento?, error_detalle? }
export async function actualizarAccionesMensaje(req, res) {
  const { id } = req.params;
  const { action_executed, estado_procesamiento, error_detalle } = req.body;

  if (!UUID_RE.test(id)) {
    return res.status(400).json({ error: "id de mensaje inválido" });
  }
  if (!Array.isArray(action_executed)) {
    return res.status(400).json({ error: "action_executed debe ser un array" });
  }
  if (estado_procesamiento && !ESTADOS_PROCESAMIENTO.has(estado_procesamiento)) {
    return res.status(400).json({ error: "estado_procesamiento inválido" });
  }

  try {
    // jsonb[] se concatena desempaquetando el JSON del body: pasar el string
    // directo como ::jsonb[] no funciona porque el literal de array de Postgres
    // no es lo mismo que un array JSON.
    const result = await pool.query(
      `UPDATE mensajes
       SET action_executed = COALESCE(action_executed, '{}'::jsonb[])
             || ARRAY(SELECT jsonb_array_elements($2::jsonb)),
           estado_procesamiento = COALESCE($3, estado_procesamiento),
           error_detalle = COALESCE($4, error_detalle)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        JSON.stringify(action_executed),
        estado_procesamiento || null,
        error_detalle || null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando acciones del mensaje" });
  }
}


// POST /bot/pedidoDeCompra
// Facu detectó que se pidió material → crea el pedido. Si la obra tiene aprobacion_automatica
// activada, el pedido queda aprobado y listo para comprar; si no (default), queda pendiente
// para que el admin lo apruebe desde el panel (PATCH /pedidos/:id/aprobar|rechazar).
// Body esperado: { obra_id, proveedor_id, telefono, mensaje_id, items: [{material_id, cantidad}], rubro_id?, urgente?, nota?, fecha_llegada_estimada?, aprobado_por? }
// El precio unitario y el total salen del catálogo de materiales (materiales.costo_unitario).
// solicitado_por se resuelve automáticamente desde telefono → persona que hizo el pedido.
// `aprobado_por` (uuid de persona) lo manda el executor cuando la operación se
// aprueba desde la bandeja: el pedido nace aprobado para no pedir doble aprobación.
export async function crearPedidoDeCompra(req, res) {
  const { obra_id, proveedor_id, telefono, mensaje_id, items, rubro_id, urgente, nota, fecha_llegada_estimada, aprobado_por } = req.body;
  if (!telefono) return res.status(400).json({ error: "telefono es requerido" });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items debe ser un array no vacío" });
  }

  const usuario_id = await resolvePersonaIdByTelefono(telefono);
  if (!usuario_id) return res.status(404).json({ error: "Persona no encontrada para el teléfono proporcionado" });

  const client = await pool.connect();
  try {
    const obra = await client.query(`SELECT aprobacion_automatica FROM obras WHERE id = $1`, [obra_id]);
    const autoApprove = obra.rows[0]?.aprobacion_automatica || false;
    const aprobado = autoApprove || Boolean(aprobado_por);

    await client.query("BEGIN");

    if (proveedor_id) {
      const proveedor = await proveedorAccesible(client, obra_id, proveedor_id);
      if (!proveedor) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "proveedor_id inválido para esta obra" });
      }
    }

    if (rubro_id) {
      const rubro = await client.query(
        `SELECT id FROM rubros WHERE id = $1 AND obra_id = $2`,
        [rubro_id, obra_id]
      );
      if (rubro.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "rubro_id inválido para esta obra" });
      }
    }

    // El costo SIEMPRE se calcula con el precio unitario del catálogo de materiales de la obra
    const itemsFinal = [];
    let total = 0;
    for (const item of items) {
      const cantidad = Number(item.cantidad) || 0;
      const material = item.material_id
        ? await client.query(
            `SELECT costo_unitario FROM materiales WHERE id = $1 AND obra_id = $2 AND activo`,
            [item.material_id, obra_id]
          )
        : { rows: [] };
      const precioUnitario = Number(material.rows[0]?.costo_unitario) || 0;
      total += cantidad * precioUnitario;
      itemsFinal.push({ material_id: item.material_id || null, cantidad, precio_unitario: precioUnitario });
    }

    // Crear el pedido (solicitado_por = obrero que lo pidió, resuelto desde su teléfono)
    const pedido = await client.query(
      `INSERT INTO pedidos_materiales (obra_id, proveedor_id, rubro_id, estado, aprobado, fecha_aprobacion, urgente, nota, fecha_llegada_estimada, solicitado_por, total, aprobado_por)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 THEN CURRENT_TIMESTAMP ELSE NULL END, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        obra_id,
        proveedor_id,
        rubro_id || null,
        aprobado ? "aprobado" : "pendiente",
        aprobado,
        urgente || false,
        nota || null,
        fecha_llegada_estimada || null,
        usuario_id,
        total,
        aprobado_por || null,
      ]
    );
    const pedido_id = pedido.rows[0].id;

    // Insertar los ítems del pedido (subtotal lo calcula la base)
    for (const it of itemsFinal) {
      await client.query(
        `INSERT INTO pedidos_items (pedido_id, material_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedido_id, it.material_id, it.cantidad, it.precio_unitario]
      );
    }

    // Alerta: informativa si se aprobó solo, de acción si necesita que alguien
    // decida. Si nace aprobado porque se aprobó desde la bandeja, no hay alerta
    // (la aprobación ya queda registrada en la operación).
    if (autoApprove) {
      await client.query(
        `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity)
         VALUES ($1, 'pedido_aprobado_automaticamente', 'Pedido de compra creado y aprobado automáticamente', 'media', $2, 'Pedido aprobado automáticamente', 'El pedido de compra se generó y quedó aprobado', 'attention')`,
        [obra_id, usuario_id]
      );
    } else if (!aprobado_por) {
      await client.query(
        `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity)
         VALUES ($1, 'pedido_pendiente', 'Nuevo pedido de compra requiere aprobación', 'alta', $2, 'Nuevo pedido de compra', 'Requiere aprobación para ejecutar la compra', 'attention')`,
        [obra_id, usuario_id]
      );
    }

    // Marcar mensaje como procesado
    await client.query(
      `UPDATE mensajes SET estado_procesamiento = 'procesado' WHERE id = $1`,
      [mensaje_id]
    );

    await client.query("COMMIT");
    res.status(201).json(pedido.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error creando pedido de compra" });
  } finally {
    client.release();
  }
}


// POST /bot/retraso
// Facu detectó que algo se atrasó → actualiza el rubro (ítem programable) y desplaza la fecha límite.
// Body esperado: { tarea_id, dias_retraso, mensaje_id, obra_id, telefono }
// (el campo se sigue llamando tarea_id por compatibilidad con el contrato existente,
// pero desde la reestructuración tareas/rubros identifica un rubro, no un reporte granular)
export async function registrarRetraso(req, res) {
  const { tarea_id, dias_retraso, mensaje_id, obra_id, telefono } = req.body;
  if (!telefono) return res.status(400).json({ error: "telefono es requerido" });

  const usuario_id = await resolvePersonaIdByTelefono(telefono);
  if (!usuario_id) return res.status(404).json({ error: "Persona no encontrada para el teléfono proporcionado" });

  try {

    const rubro = await pool.query(
      `UPDATE rubros
       SET fecha_limite = fecha_limite + ($1 || ' days')::interval,
           estado = 'retrasada'
       WHERE id = $2
       RETURNING *`,
      [dias_retraso, tarea_id]
    );

    // VALIDACIÓN
    if (rubro.rows.length === 0) {
      return res.status(404).json({
        error: "Rubro no encontrado"
      });
    }

    await pool.query(
      `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity)
       VALUES ($1, 'retraso', $2, 'alta', $3, 'Retraso en tarea', $2, 'attention')`,
      [
        obra_id,
        `El rubro "${rubro.rows[0].nombre}" se atrasó ${dias_retraso} días`,
        usuario_id,
      ]
    );

    await pool.query(
      `UPDATE mensajes
       SET estado_procesamiento = 'procesado'
       WHERE id = $1`,
      [mensaje_id]
    );

    res.json({
      rubro: rubro.rows[0],
      mensaje: `Fecha límite desplazada ${dias_retraso} días`,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error registrando retraso"
    });
  }
}


// POST /bot/stock
// Registra movimientos de stock desde el bot: 'entrada' (llegó material) o
// 'salida' (uso, merma, rotura, devolución). El stock puede quedar negativo.
// Body esperado: { obra_id, telefono, mensaje_id, tipo, movimientos: [{material_id, cantidad, rubro_id?, observacion?}] }
const TIPOS_STOCK = { entrada: "entrada", ingreso: "entrada", salida: "salida", egreso: "salida" };

export async function actualizarStock(req, res) {
  const { obra_id, telefono, mensaje_id, movimientos } = req.body;
  if (!telefono) return res.status(400).json({ error: "telefono es requerido" });
  const tipo = TIPOS_STOCK[String(req.body.tipo ?? "").trim().toLowerCase()];
  if (!tipo) {
    return res.status(400).json({ error: "tipo debe ser 'entrada' o 'salida'" });
  }
  if (!Array.isArray(movimientos) || movimientos.length === 0) {
    return res.status(400).json({ error: "movimientos debe ser un array no vacío" });
  }
  for (const mov of movimientos) {
    if (!mov.material_id || !(Number(mov.cantidad) > 0)) {
      return res.status(400).json({ error: "cada movimiento requiere material_id y cantidad mayor a 0" });
    }
  }

  const usuario_id = await resolvePersonaIdByTelefono(telefono);
  if (!usuario_id) return res.status(404).json({ error: "Persona no encontrada para el teléfono proporcionado" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const aplicados = [];
    for (const mov of movimientos) {
      const cantidad = Number(mov.cantidad);
      const material = await aplicarMovimientoStock(client, {
        materialId: mov.material_id,
        obraId: obra_id,
        usuarioId: usuario_id,
        rubroId: mov.rubro_id,
        tipo,
        cantidad,
        observacion: mov.observacion || null,
      });
      if (!material) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Material no encontrado o inactivo" });
      }
      aplicados.push({
        material_id: material.id,
        nombre: material.nombre,
        tipo,
        cantidad,
        stock_actual: Number(material.stock_actual),
      });
    }

    await client.query(
      `UPDATE mensajes SET estado_procesamiento = 'procesado' WHERE id = $1`,
      [mensaje_id]
    );

    await client.query("COMMIT");
    res.json({ ok: true, movimientos: aplicados });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error actualizando stock" });
  } finally {
    client.release();
  }
}

// POST /bot/stock/ajuste
// Ajusta el stock sin movimiento físico: por diferencia ('delta', puede ser negativo)
// o fijando el valor final ('stock_final'). El stock puede quedar negativo por delta.
// Body esperado: { obra_id, telefono, mensaje_id, movimientos: [{ material_id, tipo_ajuste: 'delta'|'stock_final', valor, observacion? }] }
const TIPOS_AJUSTE = new Set(["delta", "stock_final"]);

export async function ajustarStockDesdeBot(req, res) {
  const { obra_id, telefono, mensaje_id, movimientos } = req.body;
  if (!telefono) return res.status(400).json({ error: "telefono es requerido" });
  if (!Array.isArray(movimientos) || movimientos.length === 0) {
    return res.status(400).json({ error: "movimientos debe ser un array no vacío" });
  }
  for (const mov of movimientos) {
    if (!mov.material_id) {
      return res.status(400).json({ error: "cada movimiento requiere material_id" });
    }
    if (!TIPOS_AJUSTE.has(mov.tipo_ajuste)) {
      return res.status(400).json({ error: "tipo_ajuste debe ser 'delta' o 'stock_final'" });
    }
    const valor = Number(mov.valor);
    const valido = mov.tipo_ajuste === "delta" ? valor !== 0 : valor >= 0;
    if (!Number.isFinite(valor) || !valido) {
      return res.status(400).json({ error: "valor inválido para el ajuste" });
    }
  }

  const usuario_id = await resolvePersonaIdByTelefono(telefono);
  if (!usuario_id) return res.status(404).json({ error: "Persona no encontrada para el teléfono proporcionado" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const aplicados = [];
    for (const mov of movimientos) {
      const actual = await client.query(
        `SELECT nombre, stock_actual FROM materiales WHERE id = $1 AND activo FOR UPDATE`,
        [mov.material_id]
      );
      if (!actual.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Material no encontrado o inactivo" });
      }

      const stockActual = Number(actual.rows[0].stock_actual || 0);
      const delta = calcularDeltaAjuste(mov.tipo_ajuste, Number(mov.valor), stockActual);

      // Sin diferencia no hay movimiento que registrar (el stock ya está en el valor pedido).
      if (delta === 0) {
        aplicados.push({
          material_id: mov.material_id,
          nombre: actual.rows[0].nombre,
          delta: 0,
          stock_actual: stockActual,
        });
        continue;
      }

      const material = await aplicarMovimientoStock(client, {
        materialId: mov.material_id,
        obraId: obra_id,
        usuarioId: usuario_id,
        tipo: delta > 0 ? "entrada" : "salida",
        cantidad: Math.abs(delta),
        observacion: mov.observacion || "Ajuste desde bot",
        soloAlCruzar: true,
      });
      if (!material) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Material no encontrado o inactivo" });
      }
      aplicados.push({
        material_id: material.id,
        nombre: material.nombre,
        delta,
        stock_actual: Number(material.stock_actual),
      });
    }

    await client.query(
      `UPDATE mensajes SET estado_procesamiento = 'procesado' WHERE id = $1`,
      [mensaje_id]
    );

    await client.query("COMMIT");
    res.json({ ok: true, movimientos: aplicados });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error ajustando stock" });
  } finally {
    client.release();
  }
}