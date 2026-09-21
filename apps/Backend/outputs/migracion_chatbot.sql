-- ChatBot AI: auditoría de consultas en lenguaje natural.
-- Ejecución manual una vez (idempotente): psql "$DATABASE_URL" -f outputs/migracion_chatbot.sql

CREATE TABLE IF NOT EXISTS public.chat_consultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid REFERENCES public.obras(id),
  persona_id uuid REFERENCES public.personas(id),
  pregunta text NOT NULL,
  plan jsonb,
  subpreguntas jsonb,
  respuesta text,
  error text,
  duracion_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_consultas_obra_created_idx
  ON public.chat_consultas (obra_id, created_at DESC);
