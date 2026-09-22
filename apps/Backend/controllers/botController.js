import { pool } from "../db.js";
import { resolvePersonaIdByTelefono } from "../services/personaService.js";
import { guardarEmbedding } from "../services/embeddings.service.js";
import { aplicarMovimientoStock } from "../services/stock.service.js";

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
// Body esperado: { obra_id, proveedor_id, telefono, mensaje_id, items: [{material_id, cantidad, precio_unitario}], urgente?, nota?, fecha_llegada_estimada? }
// solicitado_por se resuelve automáticamente desde telefono → persona que hizo el pedido.
export async function crearPedidoDeCompra(req, res) {
  const { obra_id, proveedor_id, telefono, mensaje_id, items, urgente, nota, fecha_llegada_estimada, categoria } = req.body;
  if (!telefono) return res.status(400).json({ error: "telefono es requerido" });

  const usuario_id = await resolvePersonaIdByTelefono(telefono);
  if (!usuario_id) return res.status(404).json({ error: "Persona no encontrada para el teléfono proporcionado" });

  const client = await pool.connect();
  try {
    const obra = await client.query(`SELECT aprobacion_automatica FROM obras WHERE id = $1`, [obra_id]);
    const autoApprove = obra.rows[0]?.aprobacion_automatica || false;

    await client.query("BEGIN");

    // Crear el pedido (solicitado_por = obrero que lo pidió, resuelto desde su teléfono)
    const pedido = await client.query(
      `INSERT INTO pedidos_materiales (obra_id, proveedor_id, estado, aprobado, fecha_aprobacion, urgente, nota, fecha_llegada_estimada, solicitado_por, categoria)
       VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE NULL END, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        obra_id,
        proveedor_id,
        autoApprove ? "aprobado" : "pendiente",
        autoApprove,
        urgente || false,
        nota || null,
        fecha_llegada_estimada || null,
        usuario_id,
        categoria || null,
      ]
    );
    const pedido_id = pedido.rows[0].id;

    // Insertar los ítems del pedido
    for (const item of items) {
      await client.query(
        `INSERT INTO pedidos_items (pedido_id, material_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedido_id, item.material_id, item.cantidad, item.precio_unitario]
      );
    }

    // Alerta: informativa si se aprobó solo, de acción si necesita que alguien decida
    if (autoApprove) {
      await client.query(
        `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, usuario_id, titulo, subtitulo, severity)
         VALUES ($1, 'pedido_aprobado_automaticamente', 'Pedido de compra creado y aprobado automáticamente', 'media', $2, 'Pedido aprobado automáticamente', 'El pedido de compra se generó y quedó aprobado', 'attention')`,
        [obra_id, usuario_id]
      );
    } else {
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


// POST /bot/materiales
// Facu auto-crea un material que el usuario pidió y no está en el catálogo.
// Body esperado: { obra_id, nombre, unidad? }
export async function crearMaterialDesdeBot(req, res) {
  const { obra_id, nombre, unidad } = req.body;
  if (!obra_id || !nombre) return res.status(400).json({ error: "obra_id y nombre son requeridos" });

  try {
    const existing = await pool.query(
      `SELECT id, nombre, unidad FROM materiales
       WHERE obra_id = $1 AND activo AND LOWER(nombre) = LOWER($2)
       LIMIT 1`,
      [obra_id, nombre]
    );
    if (existing.rows.length > 0) {
      return res.status(201).json(existing.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO materiales (obra_id, nombre, unidad)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, unidad`,
      [obra_id, nombre, unidad || null]
    );
    await guardarEmbedding("material", result.rows[0].id, result.rows[0].nombre);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando material" });
  }
}

// POST /bot/stock
// Facu detectó uso de materiales → descuenta del stock y registra movimiento.
// Body esperado: { obra_id, telefono, mensaje_id, movimientos: [{material_id, cantidad, rubro_id}] }
export async function actualizarStock(req, res) {
  const { obra_id, telefono, mensaje_id, movimientos } = req.body;
  if (!telefono) return res.status(400).json({ error: "telefono es requerido" });

  const usuario_id = await resolvePersonaIdByTelefono(telefono);
  if (!usuario_id) return res.status(404).json({ error: "Persona no encontrada para el teléfono proporcionado" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const mov of movimientos) {
      // Descuenta stock, registra el movimiento y alerta si quedó bajo el mínimo
      const material = await aplicarMovimientoStock(client, {
        materialId: mov.material_id,
        obraId: obra_id,
        usuarioId: usuario_id,
        rubroId: mov.rubro_id,
        tipo: "salida",
        cantidad: mov.cantidad,
      });
      if (!material) throw new Error(`Material no encontrado: ${mov.material_id}`);
    }

    await client.query(
      `UPDATE mensajes SET estado_procesamiento = 'procesado' WHERE id = $1`,
      [mensaje_id]
    );

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error actualizando stock" });
  } finally {
    client.release();
  }
}