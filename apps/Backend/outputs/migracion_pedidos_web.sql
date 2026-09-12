-- ============================================================
-- Migración: pedidos web (formulario "Nuevo pedido")
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

-- 1) Columnas nuevas en pedidos_materiales
ALTER TABLE public.pedidos_materiales
  ADD COLUMN IF NOT EXISTS urgente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nota text,
  ADD COLUMN IF NOT EXISTS fecha_llegada_estimada date,
  ADD COLUMN IF NOT EXISTS solicitado_por uuid;

ALTER TABLE public.pedidos_materiales
  ADD CONSTRAINT pedidos_materiales_solicitado_por_fkey
  FOREIGN KEY (solicitado_por) REFERENCES public.personas(id);

-- 2) Evitar duplicados de proveedores al resolver por nombre
--    (el endpoint POST /pedidos hace ON CONFLICT (nombre) DO UPDATE)
CREATE UNIQUE INDEX IF NOT EXISTS proveedores_nombre_unique
  ON public.proveedores (nombre);

-- 3) Índice para listar pedidos por obra rápido
CREATE INDEX IF NOT EXISTS pedidos_materiales_obra_id_idx
  ON public.pedidos_materiales (obra_id);