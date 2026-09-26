-- Cola de operaciones del bot: lo que antes ejecutaba el bot directo ahora se
-- registra acá y se ejecuta al aprobarse desde la web (o directo si la obra
-- tiene aprobacion_automatica o la operación es de política automática).
-- Ejecutar una vez en el SQL editor de Supabase.

CREATE TABLE IF NOT EXISTS public.operaciones_bot (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL,
  mensaje_id uuid NULL,
  usuario_id uuid NULL,
  endpoint text NOT NULL,
  method varchar(6) NOT NULL,
  payload jsonb NOT NULL,
  tipo varchar(120) NULL,
  destino varchar(60) NULL,
  comment text NULL,
  confianza numeric NULL,
  campos jsonb NULL,
  display jsonb NULL,
  estado varchar(16) NOT NULL DEFAULT 'pendiente',
  resultado jsonb NULL,
  error_detalle text NULL,
  aprobada_por uuid NULL,
  aprobada_at timestamptz NULL,
  ejecutada_at timestamptz NULL,
  intentos integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operaciones_bot_pkey PRIMARY KEY (id),
  CONSTRAINT operaciones_bot_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE,
  CONSTRAINT operaciones_bot_mensaje_id_fkey FOREIGN KEY (mensaje_id) REFERENCES public.mensajes(id) ON DELETE SET NULL,
  CONSTRAINT operaciones_bot_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.personas(id) ON DELETE SET NULL,
  CONSTRAINT operaciones_bot_aprobada_por_fkey FOREIGN KEY (aprobada_por) REFERENCES public.personas(id) ON DELETE SET NULL,
  CONSTRAINT operaciones_bot_estado_check CHECK (estado IN ('pendiente','ejecutando','ejecutada','rechazada','error'))
);

CREATE INDEX IF NOT EXISTS idx_operaciones_bot_obra_estado ON public.operaciones_bot (obra_id, estado);
CREATE INDEX IF NOT EXISTS idx_operaciones_bot_mensaje ON public.operaciones_bot (mensaje_id);

-- Permite resolver la alerta puntual cuando se aprueba o rechaza una operación.
ALTER TABLE public.alertas
  ADD COLUMN IF NOT EXISTS operacion_id uuid NULL;
