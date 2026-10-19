// Contexto de esquema para el ChatBot AI (NL → SQL).
// Las columnas salen de la base real (information_schema), no de outputs/migracion_final.sql.
// Solo se exponen tablas de la whitelist: el LLM nunca debe consultar otra cosa.

export const TABLAS = {
  obras: {
    descripcion: "Obra: datos generales, fechas y presupuesto global.",
    obraId: "id",
    columnas: [
      "id", "nombre", "direccion", "estado", "presupuesto_total",
      "fecha_inicio", "fecha_fin_estimada", "progress", "created_at",
    ],
    clave: ["id", "nombre", "estado", "presupuesto_total", "fecha_inicio", "fecha_fin_estimada", "progress"],
  },
  tareas: {
    descripcion: "Tareas de la obra (pendientes, en progreso, completadas, canceladas), con avance y costo estimado.",
    obraId: "obra_id",
    columnas: [
      "id", "obra_id", "titulo", "descripcion", "estado", "prioridad",
      "fecha_inicio", "fecha_limite", "fecha_completada", "porcentaje_avance",
      "costo_estimado", "rubro_id", "asignado_a", "completada_por", "created_at",
    ],
    clave: ["id", "obra_id", "titulo", "estado", "prioridad", "fecha_inicio", "fecha_limite", "fecha_completada", "porcentaje_avance", "costo_estimado", "rubro_id"],
    valores: { estado: "pendiente | en_progreso | completada | cancelada", prioridad: "baja | media | alta | urgente" },
  },
  rubros: {
    descripcion: "Rubros/categorías de trabajo de la obra (ej: albañilería, plomería). Tienen avance propio.",
    obraId: "obra_id",
    columnas: ["id", "obra_id", "nombre", "descripcion", "porcentaje_avance", "orden", "created_at"],
    clave: ["id", "obra_id", "nombre", "porcentaje_avance"],
  },
  gastos: {
    descripcion: "Gastos / recibos de la obra: monto, fecha, descripción, rubro, pedido asociado, proveedor, categoría (Materiales, Mano de obra, Equipos, Logística, Servicios) y estado de pago.",
    obraId: "obra_id",
    columnas: [
      "id", "obra_id", "pedido_id", "rubro_id", "descripcion", "monto", "fecha", "moneda", "origen", "revisado",
      "usuario_id", "categoria", "proveedor", "estado_pago", "archivo_nombre", "created_at",
    ],
    clave: ["id", "obra_id", "rubro_id", "pedido_id", "descripcion", "monto", "fecha", "moneda", "revisado", "categoria", "proveedor", "estado_pago"],
    valores: { estado_pago: "pagado | pendiente (pendiente = falta pagar)" },
  },
  pedidos_materiales: {
    descripcion: "Pedidos de compra de materiales: estado, aprobación, proveedor, urgencia y fecha estimada de llegada. El rubro es una FK a la tabla rubros (nombre del rubro).",
    obraId: "obra_id",
    columnas: [
      "id", "obra_id", "proveedor_id", "rubro_id", "solicitado_por", "aprobado_por", "estado",
      "aprobado", "urgente", "nota", "fecha", "fecha_aprobacion", "total",
      "fecha_llegada_estimada", "fecha_entrega", "ubicacion_entrega", "recibido_por", "documento_receptor",
    ],
    clave: ["id", "obra_id", "proveedor_id", "rubro_id", "estado", "aprobado", "urgente", "fecha", "fecha_aprobacion", "fecha_llegada_estimada", "fecha_entrega", "total"],
  },
  pedidos_items: {
    descripcion: "Detalle de materiales de cada pedido: cantidad, precio unitario y subtotal (cantidad * precio_unitario). El precio unitario sale del catálogo de materiales al crear el pedido.",
    obraId: null,
    columnas: ["id", "pedido_id", "material_id", "cantidad", "precio_unitario", "subtotal"],
    clave: ["pedido_id", "material_id", "cantidad", "precio_unitario", "subtotal"],
  },
  materiales: {
    descripcion: "Catálogo de materiales de la obra, con stock actual, stock mínimo, ubicación y costo unitario. Los eliminados quedan con activo = false (borrado lógico).",
    obraId: "obra_id",
    columnas: ["id", "obra_id", "nombre", "categoria", "unidad", "stock_actual", "stock_minimo", "costo_unitario", "ubicacion", "activo"],
    clave: ["id", "obra_id", "nombre", "categoria", "unidad", "stock_actual", "stock_minimo", "costo_unitario", "ubicacion", "activo"],
  },
  movimientos_stock: {
    descripcion: "Movimientos de stock de materiales: consumos (salida), ingresos por entrega de pedidos y ajustes manuales (entrada).",
    obraId: "obra_id",
    columnas: ["id", "material_id", "obra_id", "rubro_id", "usuario_id", "tipo", "cantidad", "fecha", "observacion"],
    clave: ["material_id", "obra_id", "rubro_id", "tipo", "cantidad", "fecha"],
    valores: { tipo: "salida (uso/consumo o baja de stock) | entrada (ingreso por entrega de pedido o ajuste manual). Para consumos filtrar tipo = 'salida'" },
  },
  proveedores: {
    descripcion: "Proveedores: catálogo global (scope='global', obra_id NULL, compartido por todas las obras) o de una obra puntual (scope='obra'). Los eliminados quedan con activo = false.",
    obraId: "obra_id",
    columnas: [
      "id", "scope", "obra_id", "nombre", "rubro", "cuit", "contacto_nombre", "contacto_puesto",
      "telefono", "whatsapp", "email", "web", "direccion", "condicion_pago", "plazo_entrega",
      "descripcion", "activo", "created_at",
    ],
    clave: ["id", "scope", "obra_id", "nombre", "rubro", "telefono", "email", "condicion_pago", "plazo_entrega", "activo"],
    valores: { scope: "global (todas las obras) | obra (solo la obra de obra_id)" },
  },
  proveedores_favoritos: {
    descripcion: "Proveedores marcados como frecuentes por cada persona (agenda personal, no del proveedor).",
    obraId: null,
    columnas: ["persona_id", "proveedor_id", "created_at"],
    clave: ["persona_id", "proveedor_id"],
  },
  materiales_proveedores: {
    descripcion: "Relación entre materiales y proveedores.",
    obraId: null,
    columnas: ["id", "material_id", "proveedor_id"],
    clave: ["material_id", "proveedor_id"],
  },
  presupuestos: {
    descripcion: "Presupuesto de la obra: total, ejecutado y comprometido (una fila por obra).",
    obraId: "obra_id",
    columnas: ["id", "obra_id", "total", "ejecutado", "comprometido", "updated_at"],
    clave: ["obra_id", "total", "ejecutado", "comprometido", "updated_at"],
  },
  presupuesto_rubros: {
    descripcion: "Tope asignado (cap) del presupuesto por rubro. Para lo ejecutado por rubro usar gastos y pedidos entregados (spent puede estar desactualizado).",
    obraId: null,
    columnas: ["id", "rubro_id", "cap", "spent", "updated_at"],
    clave: ["rubro_id", "cap", "updated_at"],
  },
  presupuesto_ajustes: {
    descripcion: "Historial de ajustes del presupuesto: quién lo cambió, cuándo, el motivo y los topes por rubro antes/después (cambios es jsonb).",
    obraId: "obra_id",
    columnas: ["id", "obra_id", "usuario_id", "motivo", "cambios", "total_anterior", "total_nuevo", "created_at"],
    clave: ["obra_id", "usuario_id", "motivo", "total_anterior", "total_nuevo", "created_at"],
  },
  comprobantes_facturas: {
    descripcion: "Comprobantes y facturas cargadas: totales, emisor, receptor, fechas e IVA.",
    obraId: "obra_id",
    columnas: [
      "id", "gasto_id", "obra_id", "tipo_documento", "tipo", "tipo_factura", "numero",
      "fecha", "fecha_vencimiento", "monto", "moneda", "subtotal", "iva", "total",
      "emisor", "cuit_emisor", "receptor", "cuit_receptor", "origen", "destino",
      "numero_operacion", "entidad", "imagen_url", "created_at",
    ],
    clave: ["id", "gasto_id", "obra_id", "tipo_documento", "fecha", "total", "iva", "emisor", "cuit_emisor", "receptor"],
  },
  factura_items: {
    descripcion: "Ítems de cada factura/comprobante.",
    obraId: null,
    columnas: ["id", "factura_id", "descripcion", "cantidad", "precio_unitario", "subtotal"],
    clave: ["factura_id", "descripcion", "cantidad", "precio_unitario", "subtotal"],
  },
  miembros_obra: {
    descripcion: "Personas que pertenecen a la obra, con su rol.",
    obraId: "obra_id",
    columnas: ["id", "persona_id", "obra_id", "rol", "joined_at"],
    clave: ["persona_id", "obra_id", "rol", "joined_at"],
  },
  personas: {
    descripcion: "Personas del sistema (nombre y teléfono).",
    obraId: null,
    columnas: ["id", "auth_user_id", "nombre", "telefono", "created_at"],
    clave: ["id", "nombre", "telefono"],
  },
  actividad: {
    descripcion: "Bitácora de la obra: lo que pasó y quién lo hizo (tareas creadas/completadas, pedidos creados/aprobados/entregados, gastos, problemas/alertas, retrasos y cargas manuales). texto es la frase legible; tags es un text[] (ej: nombre del rubro, 'Crítico', 'Urgente', 'Gasto', 'Manual').",
    obraId: "obra_id",
    columnas: ["id", "obra_id", "usuario_id", "accion", "texto", "tipo", "tags", "entidad_tipo", "entidad_id", "created_at"],
    clave: ["obra_id", "usuario_id", "accion", "texto", "tipo", "tags", "entidad_tipo", "created_at"],
    valores: {
      tipo: "avance (tareas) | pedido (pedidos y gastos) | problema (alertas y retrasos) | foto | cierre; las cargas manuales viejas usan 'Avance de tarea', 'Foto', 'Cierre de jornada', 'Problema'",
      entidad_tipo: "tarea | pedido | gasto | alerta | rubro",
    },
  },
  fotos_obra: {
    descripcion: "Fotos de la galería de obra: tarea y rubro asociados, quién la subió, nota, etiqueta (flag) y origen (web | whatsapp).",
    obraId: "obra_id",
    columnas: ["id", "obra_id", "tarea_id", "rubro_id", "usuario_id", "nota", "flag", "origen", "created_at"],
    clave: ["obra_id", "tarea_id", "rubro_id", "usuario_id", "flag", "origen", "created_at"],
  },
  alertas: {
    descripcion: "Alertas de la obra, con severidad y estado de resolución.",
    obraId: "obra_id",
    columnas: ["id", "obra_id", "usuario_id", "tipo", "titulo", "subtitulo", "mensaje", "prioridad", "severity", "resuelta", "resolved_at", "created_at"],
    clave: ["obra_id", "titulo", "severity", "resuelta", "created_at"],
  },
};

export const TABLAS_PERMITIDAS = Object.keys(TABLAS);

// Glosario de lenguaje de obra → tablas. Va en el prompt del planner y del SQL generator.
export const GLOSARIO = `
- "pedidos" / "pedidos de compra" → pedidos_materiales (detalle en pedidos_items)
- "gastos" / "gastamos" / "plata" / "costos" / "recibos" → gastos
- "deudas" / "a pagar" / "pendiente de pago" / "qué falta pagar" → gastos con estado_pago = 'pendiente'
- "stock" / "inventario" → materiales.stock_actual y materiales.stock_minimo (solo materiales con activo = true)
- "materiales usados" / "consumidos" / "movimientos" → movimientos_stock (consumo = tipo 'salida')
- "avance" de la obra → obras.progress; avance por tarea → tareas.porcentaje_avance; avance por rubro → rubros.porcentaje_avance
- "presupuesto" → presupuestos.total / ejecutado / comprometido; tope por rubro → presupuesto_rubros.cap
- "ajustes" / "cambios de presupuesto" → presupuesto_ajustes
- "rubro" → rubros (categorías de trabajo de la obra)
- "proveedor" → proveedores (scope='global' = catálogo de la empresa; scope='obra' = solo esa obra; siempre filtrar activo = true); "proveedores favoritos/frecuentes" → proveedores_favoritos
- "factura" / "comprobante" → comprobantes_facturas (detalle en factura_items)
- "obreros" / "equipo" / "gente" → miembros_obra y personas
- "bitácora" / "actividad" / "qué pasó" / "qué se hizo" / "novedades" / "jornada" / "avances de hoy" → actividad (con personas para el nombre); para el detalle cruzar con tareas, pedidos_materiales y alertas
- "fotos" / "galería" / "imágenes" / "evidencia" → fotos_obra (con tareas/rubros/personas para el detalle)
- "problemas" / "incidentes" / "críticos" → alertas (severity = 'critical' para críticos) y actividad con tipo = 'problema'
- "quién hizo" / "quién cargó" / "quién aprobó" → actividad.usuario_id → personas.nombre

Métricas derivadas (no existen como columna; se calculan):
- "disponible" del presupuesto = presupuestos.total - presupuestos.ejecutado - presupuestos.comprometido
- ejecutado de un rubro = SUM(gastos.monto del rubro, moneda ARS) + SUM(pedidos_materiales.total del rubro con estado 'entregado' sin gasto vinculado en gastos.pedido_id)
- comprometido de un rubro = SUM(pedidos_materiales.total del rubro con estado IN ('aprobado','en_camino','demorado'))
- saldo de un rubro = presupuesto_rubros.cap - ejecutado - comprometido
- costo total de un pedido = pedidos_materiales.total (por ítem: pedidos_items.subtotal = cantidad * precio_unitario)
- "materiales a reponer" / "stock bajo" = materiales activos (activo = true) con stock_actual < stock_minimo
- cantidad de pedidos = COUNT de pedidos_materiales; monto de factura = comprobantes_facturas.total
- Los montos de gastos y facturas están en su columna "moneda" (por defecto ARS): sumar solo montos de la misma moneda.
`;

// Resumen compacto para el planner: solo descripción y columnas clave.
export function resumenPlanner() {
  return Object.entries(TABLAS)
    .map(([nombre, t]) => {
      const valores = t.valores
        ? ` Valores: ${Object.entries(t.valores).map(([c, v]) => `${c} → ${v}`).join("; ")}.`
        : "";
      return `- ${nombre}: ${t.descripcion} Columnas clave: ${t.clave.join(", ")}.${valores}`;
    })
    .join("\n");
}

// Resumen completo para el SQL generator (fase siguiente): columnas + valores de enums.
export function resumenSQL() {
  return Object.entries(TABLAS)
    .map(([nombre, t]) => {
      const valores = t.valores
        ? ` Valores posibles: ${Object.entries(t.valores).map(([c, v]) => `${c} = ${v}`).join("; ")}.`
        : "";
      return `- ${nombre} (${t.columnas.join(", ")}): ${t.descripcion}${valores}`;
    })
    .join("\n");
}
