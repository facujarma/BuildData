-- ============================================================
-- Migración: tags en la bitácora (actividad).
-- Los flujos de escritura (tareas, pedidos, gastos, alertas, retrasos) registran
-- actividad con tags (rubro, "Crítico", "Urgente", "Gasto", "Manual"...).
-- Ejecutar a mano contra la base antes de levantar la API: sin esta columna el
-- registro de actividad falla (en silencio: es best-effort) y la bitácora no crece.
-- ============================================================

ALTER TABLE public.actividad
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_actividad_obra_created
  ON public.actividad (obra_id, created_at DESC);
