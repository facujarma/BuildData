-- ============================================================
-- Migración: invitaciones de obreros por WhatsApp.
-- El link que abre el chat del bot lleva un token cifrado (AES-256-GCM)
-- con los datos de la invitación. Esta tabla es el registro de uso único:
-- el backend la marca atómicamente al consumir el link.
-- Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono character varying,
  rol character varying,
  creada_por uuid REFERENCES public.personas(id) ON DELETE SET NULL,
  expira_at timestamptz NOT NULL,
  usada_at timestamptz,
  usada_por uuid REFERENCES public.personas(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitaciones_obra_idx ON public.invitaciones (obra_id);
CREATE INDEX IF NOT EXISTS invitaciones_pendientes_idx
  ON public.invitaciones (obra_id) WHERE usada_at IS NULL;
