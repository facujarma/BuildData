-- ============================================================
-- Migración: reportes de obra generados desde la web (rango, secciones y
-- el contenido congelado en el momento de generarlo).
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

ALTER TABLE public.reportes
  ADD COLUMN IF NOT EXISTS rango varchar(20) DEFAULT 'mes',
  ADD COLUMN IF NOT EXISTS secciones text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS snapshot jsonb, -- payload completo del reporte tal como se generó
  ADD COLUMN IF NOT EXISTS generado_por uuid REFERENCES public.personas(id) ON DELETE SET NULL;

ALTER TABLE public.reportes
  DROP CONSTRAINT IF EXISTS reportes_rango_check,
  ADD CONSTRAINT reportes_rango_check CHECK (rango IN ('semana', 'mes', 'trimestre', 'total'));

CREATE INDEX IF NOT EXISTS idx_reportes_obra_fecha ON public.reportes (obra_id, fecha_generacion DESC);
