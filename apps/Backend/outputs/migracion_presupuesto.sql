-- ============================================================
-- Migración: presupuesto real (montos en numeric + historial de ajustes).
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

BEGIN;

-- 1) Montos a numeric: integer trunca decimales y desborda en montos grandes en ARS.
--    (Si alguna columna ya es numeric, el ALTER no cambia nada.)
ALTER TABLE public.presupuestos
  ALTER COLUMN total TYPE numeric,
  ALTER COLUMN ejecutado TYPE numeric,
  ALTER COLUMN comprometido TYPE numeric;

ALTER TABLE public.presupuesto_rubros
  ALTER COLUMN cap TYPE numeric,
  ALTER COLUMN spent TYPE numeric;

-- 2) Historial de ajustes del presupuesto (lo escribe PUT /presupuestos/:obra_id/rubros)
CREATE TABLE IF NOT EXISTS public.presupuesto_ajustes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
  motivo text NOT NULL,
  cambios jsonb NOT NULL, -- [{ rubro_id, nombre, cap_anterior, cap_nuevo }]
  total_anterior numeric NOT NULL,
  total_nuevo numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presupuesto_ajustes_obra
  ON public.presupuesto_ajustes (obra_id, created_at DESC);

ALTER TABLE public.presupuesto_ajustes ENABLE ROW LEVEL SECURITY;

COMMIT;
