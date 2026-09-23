-- ============================================================
-- Migración: costo de pedidos (subtotal por ítem y total del pedido).
-- El precio unitario SIEMPRE sale del catálogo de materiales
-- (materiales.costo_unitario) al crear el pedido.
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

-- 1) pedidos_materiales: total del pedido (lo persiste el Backend al crear)
ALTER TABLE public.pedidos_materiales
  ADD COLUMN IF NOT EXISTS total numeric NOT NULL DEFAULT 0;

-- 2) pedidos_items: subtotal calculado por la propia base (cantidad * precio_unitario).
--    Columna generada: se recalcula sola al actualizar cantidad o precio_unitario.
ALTER TABLE public.pedidos_items
  ADD COLUMN IF NOT EXISTS subtotal numeric GENERATED ALWAYS AS (cantidad * precio_unitario) STORED;

-- 3) Backfill: precio unitario desde el catálogo de materiales (solo filas sin precio)
UPDATE public.pedidos_items pi
SET precio_unitario = m.costo_unitario
FROM public.materiales m
WHERE pi.material_id = m.id
  AND pi.precio_unitario IS NULL
  AND m.costo_unitario IS NOT NULL;

-- 4) Backfill: total de cada pedido = suma de subtotales
UPDATE public.pedidos_materiales pm
SET total = COALESCE(
  (SELECT SUM(pi.subtotal) FROM public.pedidos_items pi WHERE pi.pedido_id = pm.id),
  0
);
