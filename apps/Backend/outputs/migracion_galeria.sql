-- ============================================================
-- Migración: Galería de obra (fotos asociadas a tarea/rubro/autor).
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fotos_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  tarea_id uuid REFERENCES public.tareas(id) ON DELETE SET NULL,
  rubro_id uuid REFERENCES public.rubros(id) ON DELETE SET NULL,
  usuario_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
  url text NOT NULL,
  storage_path text,            -- path dentro del bucket 'galeria' (para borrar el objeto)
  nombre_archivo text,
  nota text,
  flag varchar(80),             -- ej: 'Evidencia de alerta', 'Documentación técnica'
  origen varchar(20) NOT NULL DEFAULT 'web' CHECK (origen IN ('web', 'whatsapp')),
  lote_id uuid,                 -- fotos subidas juntas (una sola entrada en la bitácora)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fotos_obra_obra ON public.fotos_obra (obra_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fotos_obra_lote ON public.fotos_obra (lote_id) WHERE lote_id IS NOT NULL;

ALTER TABLE public.fotos_obra ENABLE ROW LEVEL SECURITY;

-- Bucket público para las fotos (JPG/PNG/WebP, máx 10 MB).
-- Las subidas las hace el Backend con la service role key (no requiere policies).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('galeria', 'galeria', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
