// Lógica compartida de movimientos de stock (bot, ajustes manuales y entrega de pedidos).
// Todas las funciones reciben un `client` de pg con la transacción ya abierta.

// El stock negativo se avisa solo cuando el movimiento lo cruza de >= 0 a < 0:
// una vez que ya está negativo no se repite la alerta en cada movimiento.
export function debeAlertarStockNegativo(stockActual, delta) {
  return stockActual < 0 && stockActual - delta >= 0;
}

// Delta efectivo de un ajuste: 'delta' se aplica tal cual; 'stock_final' se
// convierte en la diferencia contra el stock actual del material.
export function calcularDeltaAjuste(tipoAjuste, valor, stockActual) {
  return tipoAjuste === "delta" ? valor : valor - stockActual;
}

// Aplica un movimiento a un material: actualiza stock_actual, registra el movimiento
// y crea las alertas que correspondan ('stock_bajo' y 'stock_negativo').
// tipo: 'entrada' suma, 'salida' resta. El stock puede quedar negativo: no se bloquea.
// soloAlCruzar: la alerta de stock bajo se emite solo cuando el movimiento hace bajar
// el stock del mínimo (evita una alerta por cada click en los ajustes manuales); por
// defecto alerta siempre que el stock quede en o bajo el mínimo (comportamiento del bot).
// Devuelve el material actualizado, o null si el material no existe o está inactivo.
export async function aplicarMovimientoStock(
  client,
  { materialId, obraId, usuarioId = null, rubroId = null, tipo, cantidad, observacion = null, soloAlCruzar = false }
) {
  if (tipo !== "entrada" && tipo !== "salida") {
    throw new Error(`tipo de movimiento inválido: ${tipo}`);
  }
  const delta = tipo === "entrada" ? cantidad : -cantidad;

  const actualizado = await client.query(
    `UPDATE materiales SET stock_actual = COALESCE(stock_actual, 0) + $1
     WHERE id = $2 AND activo
     RETURNING *`,
    [delta, materialId]
  );
  const material = actualizado.rows[0];
  if (!material) return null;

  await client.query(
    `INSERT INTO movimientos_stock (material_id, obra_id, usuario_id, rubro_id, tipo, cantidad, observacion)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [materialId, obraId, usuarioId, rubroId, tipo, cantidad, observacion]
  );

  // numeric llega como string desde pg: comparar como números
  const stockActual = Number(material.stock_actual);
  const cruzoNegativo = debeAlertarStockNegativo(stockActual, delta);
  const bajoMinimo = material.stock_minimo !== null && stockActual <= Number(material.stock_minimo);
  const yaEstabaBajo = material.stock_minimo !== null && stockActual - delta <= Number(material.stock_minimo);
  // Si el movimiento cruzó a negativo, la alerta 'stock_negativo' (más severa) reemplaza
  // a la de stock bajo para no duplicar avisos por el mismo movimiento.
  if (!cruzoNegativo && tipo === "salida" && bajoMinimo && !(soloAlCruzar && yaEstabaBajo)) {
    await client.query(
      `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, titulo, subtitulo, severity)
       VALUES ($1, 'stock_bajo', $2, 'media', $3, $4, 'attention')`,
      [
        obraId,
        `Stock bajo de ${material.nombre}: quedan ${stockActual} unidades`,
        `Stock bajo de ${material.nombre}`,
        `Quedan ${stockActual} unidades`,
      ]
    );
  }

  if (cruzoNegativo) {
    await client.query(
      `INSERT INTO alertas (obra_id, tipo, mensaje, prioridad, titulo, subtitulo, severity)
       VALUES ($1, 'stock_negativo', $2, 'alta', $3, $4, 'critical')`,
      [
        obraId,
        `Stock negativo de ${material.nombre}: quedan ${stockActual} unidades`,
        `Stock negativo de ${material.nombre}`,
        `Quedan ${stockActual} unidades`,
      ]
    );
  }

  return material;
}
