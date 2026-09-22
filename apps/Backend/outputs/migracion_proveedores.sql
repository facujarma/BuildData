-- ============================================================
-- Migración: Proveedores (catálogo global + agenda por obra),
-- favoritos por usuario y borrado lógico.
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

-- 1) Columnas nuevas. Los registros existentes quedan scope='global',
--    obra_id=NULL (catálogo compartido, comportamiento actual).
ALTER TABLE public.proveedores
  ADD COLUMN IF NOT EXISTS scope varchar(10) NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS obra_id uuid REFERENCES public.obras(id),
  ADD COLUMN IF NOT EXISTS rubro varchar(120),
  ADD COLUMN IF NOT EXISTS cuit varchar(20),
  ADD COLUMN IF NOT EXISTS contacto_nombre varchar(120),
  ADD COLUMN IF NOT EXISTS contacto_puesto varchar(120),
  ADD COLUMN IF NOT EXISTS whatsapp varchar(40),
  ADD COLUMN IF NOT EXISTS web varchar(200),
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS condicion_pago varchar(40) DEFAULT '30 días',
  ADD COLUMN IF NOT EXISTS plazo_entrega varchar(60),
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true,
  -- Sin FK a propósito: no existe tabla "empresas" todavía. Reservada para
  -- cuando se soporte multi-empresa; hoy no se filtra por ella en ningún lado.
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.proveedores
  DROP CONSTRAINT IF EXISTS proveedores_scope_check,
  ADD CONSTRAINT proveedores_scope_check CHECK (scope IN ('global', 'obra'));

ALTER TABLE public.proveedores
  DROP CONSTRAINT IF EXISTS proveedores_scope_obra_check,
  ADD CONSTRAINT proveedores_scope_obra_check
    CHECK ((scope = 'obra' AND obra_id IS NOT NULL) OR (scope = 'global' AND obra_id IS NULL));

CREATE INDEX IF NOT EXISTS proveedores_obra_idx ON public.proveedores (obra_id);
CREATE INDEX IF NOT EXISTS proveedores_activo_idx ON public.proveedores (activo);

-- 2) Índice único por nombre: reemplaza el global por dos parciales, uno por
--    ámbito, para que un proveedor de obra pueda llamarse igual que uno global.
--    resolverProveedor() en pedidosController.js debe cambiar en el mismo
--    deploy: dejó de valer ON CONFLICT (nombre).
DROP INDEX IF EXISTS public.proveedores_nombre_unique;

CREATE UNIQUE INDEX IF NOT EXISTS proveedores_global_nombre_unique
  ON public.proveedores (lower(nombre)) WHERE scope = 'global';

CREATE UNIQUE INDEX IF NOT EXISTS proveedores_obra_nombre_unique
  ON public.proveedores (obra_id, lower(nombre)) WHERE scope = 'obra';

-- 3) Favoritos por usuario ("tu agenda"): cada persona marca los suyos.
CREATE TABLE IF NOT EXISTS public.proveedores_favoritos (
  persona_id uuid NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  proveedor_id uuid NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (persona_id, proveedor_id)
);

ALTER TABLE public.proveedores_favoritos ENABLE ROW LEVEL SECURITY;
