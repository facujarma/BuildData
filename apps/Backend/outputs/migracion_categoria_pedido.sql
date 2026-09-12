-- ============================================================
-- Migración: la categoría pasa a vivir en el pedido de compra
-- (pedidos_materiales.categoria). materiales.categoria se conserva.
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

-- 1) Nueva columna a nivel de pedido
ALTER TABLE public.pedidos_materiales
  ADD COLUMN IF NOT EXISTS categoria text;

-- 2) Backfill histórico: copiar la categoría del material de los ítems ya cargados
--    (si un pedido tiene varias, se toma una no nula)
UPDATE public.pedidos_materiales pm
SET categoria = agg.categoria
FROM (
  SELECT i.pedido_id, max(m.categoria) AS categoria
  FROM pedidos_items i
  JOIN materiales m ON m.id = i.material_id
  WHERE m.categoria IS NOT NULL
  GROUP BY i.pedido_id
) agg
WHERE pm.id = agg.pedido_id AND pm.categoria IS NULL;

-- 3) Índice para filtrar pedidos por categoría
CREATE INDEX IF NOT EXISTS pedidos_materiales_categoria_idx
  ON public.pedidos_materiales (categoria);