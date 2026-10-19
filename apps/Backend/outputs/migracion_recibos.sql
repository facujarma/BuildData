-- ============================================================
-- Migración: Recibos y comprobantes (gastos con categoría, proveedor,
-- estado de pago y archivo adjunto en Storage).
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

-- 1) Columnas nuevas en gastos.
--    categoria va SIN default a propósito: si se agregara con DEFAULT 'Materiales'
--    Postgres lo escribiría en todas las filas existentes y el GET ya no podría caer
--    al nombre del rubro. El default 'Materiales' lo pone el Backend al crear desde la web.
--    estado_pago sí lleva default: los gastos existentes (bot, carga manual) ya se pagaron.
ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS categoria varchar(60),
  ADD COLUMN IF NOT EXISTS proveedor text,
  ADD COLUMN IF NOT EXISTS estado_pago varchar(20) NOT NULL DEFAULT 'pagado',
  ADD COLUMN IF NOT EXISTS archivo_url text,
  ADD COLUMN IF NOT EXISTS archivo_nombre text;

ALTER TABLE public.gastos
  DROP CONSTRAINT IF EXISTS gastos_estado_pago_check,
  ADD CONSTRAINT gastos_estado_pago_check CHECK (estado_pago IN ('pagado', 'pendiente'));

CREATE INDEX IF NOT EXISTS idx_gastos_obra_fecha ON public.gastos (obra_id, fecha DESC);

-- 2) Bucket público para los archivos de comprobantes (PDF o imagen, máx 10 MB).
--    Las subidas las hace el Backend con la service role key (no requiere policies).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('comprobantes', 'comprobantes', true, 10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
