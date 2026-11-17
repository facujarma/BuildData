-- ============================================================
-- Migración: invitación de WhatsApp atada a una persona existente.
--
-- Cuando el Director invita a alguien que ya forma parte de la obra y tiene
-- cuenta web (`personas.auth_user_id`), la invitación guarda su `persona_id`.
-- Al consumir el link, el teléfono se vincula a ESA persona en vez de crear una
-- fila nueva (y si el número ya pertenece a otra persona, se unifican).
--
-- `ON DELETE SET NULL`: si la persona se borra/unifica antes de usar el link,
-- la invitación sigue siendo válida y cae al flujo manual por teléfono.
-- Idempotente. Ejecutar a mano contra la base antes de levantar la API.
-- ============================================================

ALTER TABLE public.invitaciones
  ADD COLUMN IF NOT EXISTS persona_id uuid
  REFERENCES public.personas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS invitaciones_persona_idx
  ON public.invitaciones (persona_id);
