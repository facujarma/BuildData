-- ============================================================
-- Migración: pedidos_materiales.categoria (texto libre) → rubro_id (FK a rubros)
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

-- 1) Agregar la FK a rubros
ALTER TABLE public.pedidos_materiales
  ADD COLUMN rubro_id uuid REFERENCES public.rubros(id);

-- 2) Backfill: matchear categoria (texto) contra rubros.nombre de la misma obra
UPDATE public.pedidos_materiales pm
SET rubro_id = r.id
FROM public.rubros r
WHERE r.obra_id = pm.obra_id
  AND lower(btrim(r.nombre)) = lower(btrim(pm.categoria))
  AND pm.categoria IS NOT NULL;

-- 3) Eliminar la columna de texto libre
ALTER TABLE public.pedidos_materiales DROP COLUMN categoria;
