-- Roles del bot WhatsApp: Obrero | Capataz | Director
--
-- Normaliza los roles libres que ya existen en miembros_obra (por ejemplo
-- "Director de obra", "Capataz", "Compras", "Sin asignar") a los tres roles que
-- entiende el bot. Los valores desconocidos caen en Obrero (mínimo privilegio).
--
-- Ejecutar una vez en la base. Es idempotente: se puede volver a correr.

ALTER TABLE public.miembros_obra ALTER COLUMN rol SET DEFAULT 'Obrero';

UPDATE public.miembros_obra
SET rol = CASE
  WHEN rol IS NULL OR btrim(rol) = '' THEN 'Obrero'
  WHEN lower(rol) ~ '(director|dueño|dueno|admin|gerente|arquitect|ingenier|socio|propietari|cliente)' THEN 'Director'
  WHEN lower(rol) ~ '(capataz|jefe|supervisor|encargado|compras|seguridad|higiene)' THEN 'Capataz'
  ELSE 'Obrero'
END;

ALTER TABLE public.miembros_obra DROP CONSTRAINT IF EXISTS miembros_obra_rol_check;
ALTER TABLE public.miembros_obra
  ADD CONSTRAINT miembros_obra_rol_check
  CHECK (rol IN ('Obrero', 'Capataz', 'Director'));
