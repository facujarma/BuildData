-- ============================================================
-- Migración: personas unificadas (issue #13)
--
-- Crea la tabla de auditoría de merges de personas y un índice de apoyo para
-- el match de teléfonos. NO borra ni modifica datos existentes.
--
-- Ejecutar a mano, UNA sola vez, contra la base antes de usar
-- `scripts/unificar_personas.js` (o el endpoint web de vinculación). Todo va
-- con IF NOT EXISTS: re-ejecutarla es seguro y no hace nada.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Auditoría de merges
--
-- Cada fila guarda el snapshot previo al merge: las dos filas de `personas`,
-- las membresías (con sus ids) y los conteos de referencias por tabla/columna.
-- Es la única fuente para reconstruir lo que se hizo y para el rollback manual.
--
-- `persona_origen` y `persona_destino` NO llevan FK a personas a propósito:
--   - el origen se BORRA dentro de la misma transacción del merge, así que una
--     FK con ON DELETE CASCADE borraría la auditoría y una con SET NULL perdería
--     justamente el id histórico que se quiere conservar;
--   - el destino puede borrarse más adelante por otras razones y la auditoría
--     debe seguir existiendo.
-- `ejecutado_por` sí lleva FK con ON DELETE SET NULL: es metadata operativa.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.personas_unificaciones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_origen uuid NOT NULL,
  persona_destino uuid NOT NULL,
  auth_user_id   uuid,
  telefono       text,
  snapshot       jsonb NOT NULL,
  ejecutado_por  uuid REFERENCES public.personas(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT personas_unificaciones_distintas CHECK (persona_origen <> persona_destino)
);

CREATE INDEX IF NOT EXISTS idx_personas_unificaciones_origen
  ON public.personas_unificaciones (persona_origen);

CREATE INDEX IF NOT EXISTS idx_personas_unificaciones_destino
  ON public.personas_unificaciones (persona_destino);

CREATE INDEX IF NOT EXISTS idx_personas_unificaciones_created_at
  ON public.personas_unificaciones (created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Índice de apoyo para el match de teléfono
--
-- `personas.telefono` es UNIQUE (personas_telefono_key), pero WhatsApp manda
-- 549... y la web puede guardar +54 11 ... sin el 9. La búsqueda compara
-- dígitos normalizados, así que hace falta un índice funcional. La expresión
-- tiene que ser IDÉNTICA a la consulta de `buscarPersonasPorTelefono`
-- (personas.service.js), que usa COALESCE(telefono, ''); si esa consulta
-- cambia, hay que recrear este índice.
--
-- NO reemplaza el UNIQUE: los dos conviven.
-- Las filas con telefono NULL quedan fuera del índice (la expresión es NULL) y
-- tampoco pueden matchear una búsqueda, así que no hace falta indexarlas.
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS personas_telefono_normalizado_idx
  ON public.personas ((regexp_replace(COALESCE(telefono, ''), '\D', '', 'g')));

-- ─────────────────────────────────────────────────────────────
-- UNIQUE (persona_id, obra_id) de miembros_obra
--
-- El merge y las altas usan `ON CONFLICT (persona_id, obra_id)`. En la base
-- original el constraint existe (`miembros_obra_unique`), pero no estaba en
-- `outputs/`: una base creada desde cero rompía con 42P10. Se agrega de forma
-- idempotente. Si la tabla tiene miembros duplicados, el ALTER falla a
-- propósito: hay que auditarlos antes de aplicar esta migración.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'public.miembros_obra'::regclass
       AND conname = 'miembros_obra_unique'
  ) THEN
    ALTER TABLE public.miembros_obra
      ADD CONSTRAINT miembros_obra_unique UNIQUE (persona_id, obra_id);
  END IF;
END $$;

