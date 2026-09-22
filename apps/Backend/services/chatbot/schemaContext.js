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
    descripcion: "Gastos de la obra: monto, fecha, descripción, rubro y pedido asociado.",
    obraId: "obra_id",
    columnas: ["id", "obra_id", "pedido_id", "rubro_id", "descripcion", "monto", "fecha", "moneda", "origen", "revisado", "usuario_id", "created_at"],
    clave: ["id", "obra_id", "rubro_id", "pedido_id", "descripcion", "monto", "fecha", "moneda", "revisado"],
  },
  pedidos_materiales: {
    descripcion: "Pedidos de compra de materiales: estado, aprobación, proveedor, urgencia y fecha estimada de llegada. El rubro es una FK a la tabla rubros (nombre del rubro).",
    obraId: "obra_id",
    columnas: [
      "id", "obra_id", "proveedor_id", "rubro_id", "solicitado_por", "aprobado_por", "estado",
      "aprobado", "urgente", "nota", "fecha", "fecha_aprobacion",
      "fecha_llegada_estimada", "fecha_entrega", "ubicacion_entrega", "recibido_por", "documento_receptor",
    ],
    clave: ["id", "obra_id", "proveedor_id", "rubro_id", "estado", "aprobado", "urgente", "fecha", "fecha_aprobacion", "fecha_llegada_estimada", "fecha_entrega"],
  },
  pedidos_items: {
    descripcion: "Detalle de materiales de cada pedido: cantidad y precio unitario.",
    obraId: null,
    columnas: ["id", "pedido_id", "material_id", "cantidad", "precio_unitario"],
    clave: ["pedido_id", "material_id", "cantidad", "precio_unitario"],
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
    descripcion: "Tope (cap) y gastado (spent) del presupuesto por rubro.",
    obraId: null,
    columnas: ["id", "rubro_id", "cap", "spent", "updated_at"],
    clave: ["rubro_id", "cap", "spent", "updated_at"],
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
    descripcion: "Historial de acciones registradas en la obra.",
    obraId: "obra_id",
    columnas: ["id", "obra_id", "usuario_id", "accion", "texto", "tipo", "entidad_tipo", "entidad_id", "created_at"],
    clave: ["obra_id", "usuario_id", "accion", "texto", "tipo", "created_at"],
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
- "gastos" / "gastamos" / "plata" / "costos" → gastos
- "stock" / "inventario" → materiales.stock_actual y materiales.stock_minimo (solo materiales con activo = true)
- "materiales usados" / "consumidos" / "movimientos" → movimientos_stock (consumo = tipo 'salida')
- "avance" de la obra → obras.progress; avance por tarea → tareas.porcentaje_avance; avance por rubro → rubros.porcentaje_avance
- "presupuesto" → presupuestos.total / ejecutado / comprometido; por rubro → presupuesto_rubros.cap / spent
- "rubro" → rubros (categorías de trabajo de la obra)
- "proveedor" → proveedores (scope='global' = catálogo de la empresa; scope='obra' = solo esa obra; siempre filtrar activo = true); "proveedores favoritos/frecuentes" → proveedores_favoritos
- "factura" / "comprobante" → comprobantes_facturas (detalle en factura_items)
- "obreros" / "equipo" / "gente" → miembros_obra y personas

Métricas derivadas (no existen como columna; se calculan):
- "disponible" del presupuesto = presupuestos.total - presupuestos.ejecutado - presupuestos.comprometido
- saldo de un rubro = presupuesto_rubros.cap - presupuesto_rubros.spent
- costo total de un pedido = SUM(pedidos_items.cantidad * pedidos_items.precio_unitario)
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
