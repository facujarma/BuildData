// Lógica compartida de movimientos de stock (bot, ajustes manuales y entrega de pedidos).
// Todas las funciones reciben un `client` de pg con la transacción ya abierta.

// Aplica un movimiento a un material: actualiza stock_actual, registra el movimiento
// y, si el stock quedó por debajo del mínimo, crea la alerta 'stock_bajo'.
// tipo: 'entrada' suma, 'salida' resta.
// soloAlCruzar: alerta solo cuando el movimiento hace bajar el stock del mínimo
// (evita una alerta por cada click en los ajustes manuales); por defecto alerta siempre
// que el stock quede en o bajo el mínimo (comportamiento del bot).
// Devuelve el material actualizado, o null si el material no existe.
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
     WHERE id = $2
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
  const bajoMinimo = material.stock_minimo !== null && stockActual <= Number(material.stock_minimo);
  const yaEstabaBajo = material.stock_minimo !== null && stockActual - delta <= Number(material.stock_minimo);
  if (tipo === "salida" && bajoMinimo && !(soloAlCruzar && yaEstabaBajo)) {
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

  return material;
}
