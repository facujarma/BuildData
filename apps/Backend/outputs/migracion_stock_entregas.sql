-- ============================================================
-- Migración: Stock conectado (ubicación, foto, categorías, soft delete)
-- y entrega de pedidos (fecha, lugar, receptor, documento).
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

-- 1) materiales: ubicación, foto (URL en Storage) y soft delete
ALTER TABLE public.materiales
  ADD COLUMN IF NOT EXISTS ubicacion text,
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS materiales_obra_activo_idx
  ON public.materiales (obra_id) WHERE activo;

-- 2) Categorías de materiales por obra (permite crear una categoría vacía)
CREATE TABLE IF NOT EXISTS public.categorias_materiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS categorias_materiales_obra_nombre_uq
  ON public.categorias_materiales (obra_id, lower(nombre));

ALTER TABLE public.categorias_materiales ENABLE ROW LEVEL SECURITY;

-- Backfill: las categorías que ya existen como string en materiales
INSERT INTO public.categorias_materiales (obra_id, nombre)
SELECT DISTINCT ON (obra_id, lower(btrim(categoria))) obra_id, btrim(categoria)
FROM public.materiales
WHERE obra_id IS NOT NULL AND btrim(coalesce(categoria, '')) <> ''
ORDER BY obra_id, lower(btrim(categoria)), btrim(categoria)
ON CONFLICT DO NOTHING;

-- 3) pedidos_materiales: datos de la entrega
ALTER TABLE public.pedidos_materiales
  ADD COLUMN IF NOT EXISTS fecha_entrega timestamp,
  ADD COLUMN IF NOT EXISTS ubicacion_entrega text,
  ADD COLUMN IF NOT EXISTS recibido_por text,
  ADD COLUMN IF NOT EXISTS documento_receptor text;

-- 4) Bucket público para las fotos de materiales.
--    Las subidas las hace el Backend con la service role key (no requiere policies).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('materiales', 'materiales', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
