-- ============================================================
-- Migración: unificar columnas de instantes a timestamptz (UTC)
-- ------------------------------------------------------------
-- Contexto: las columnas "timestamp without time zone" se escribían con now()/CURRENT_TIMESTAMP
-- de una sesión UTC (wall clock UTC), pero node-postgres las interpretaba como hora local del
-- proceso, corriendo todos los instantes +3 h. Pasarlas a timestamptz guarda el instante exacto.
--
-- `USING <col> AT TIME ZONE 'UTC'` interpreta el valor viejo como UTC, que es como se escribió.
--
-- Ejecutar a mano una vez contra la base (fuera de este archivo no hace falta nada más).
-- ============================================================

BEGIN;

ALTER TABLE public.actividad             ALTER COLUMN created_at       TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.alertas               ALTER COLUMN created_at       TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.alertas               ALTER COLUMN resolved_at      TYPE timestamptz USING resolved_at AT TIME ZONE 'UTC';
ALTER TABLE public.archivos              ALTER COLUMN uploaded_at      TYPE timestamptz USING uploaded_at AT TIME ZONE 'UTC';
ALTER TABLE public.comprobantes_facturas ALTER COLUMN created_at       TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.gastos                ALTER COLUMN created_at       TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.gastos                ALTER COLUMN updated_at       TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE public.mensajes              ALTER COLUMN created_at       TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.miembros_obra         ALTER COLUMN joined_at        TYPE timestamptz USING joined_at AT TIME ZONE 'UTC';
ALTER TABLE public.movimientos_stock     ALTER COLUMN fecha            TYPE timestamptz USING fecha AT TIME ZONE 'UTC';
ALTER TABLE public.obras                 ALTER COLUMN created_at       TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.obras                 ALTER COLUMN last_activity    TYPE timestamptz USING last_activity AT TIME ZONE 'UTC';
ALTER TABLE public.pedidos_materiales    ALTER COLUMN fecha            TYPE timestamptz USING fecha AT TIME ZONE 'UTC';
ALTER TABLE public.pedidos_materiales    ALTER COLUMN fecha_aprobacion TYPE timestamptz USING fecha_aprobacion AT TIME ZONE 'UTC';
ALTER TABLE public.pedidos_materiales    ALTER COLUMN fecha_entrega    TYPE timestamptz USING fecha_entrega AT TIME ZONE 'UTC';
ALTER TABLE public.personas              ALTER COLUMN created_at       TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.presupuesto_rubros    ALTER COLUMN updated_at       TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE public.presupuestos          ALTER COLUMN updated_at       TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE public.reportes              ALTER COLUMN fecha_generacion TYPE timestamptz USING fecha_generacion AT TIME ZONE 'UTC';
ALTER TABLE public.rubros                ALTER COLUMN created_at       TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.rubros                ALTER COLUMN updated_at       TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE public.tareas                ALTER COLUMN created_at       TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.tareas                ALTER COLUMN fecha_completada TYPE timestamptz USING fecha_completada AT TIME ZONE 'UTC';

COMMIT;

-- Dejar el timezone de la base explícito en UTC (fuera de transacción; reemplazar <db> por el nombre):
-- ALTER DATABASE <db> SET timezone = 'UTC';

-- Limpieza de datos del seed: no debería haber pedidos con fecha en el futuro.
UPDATE public.pedidos_materiales SET fecha = now() - (interval '1 day' * (3 + floor(random() * 18)::int)) WHERE fecha > now();
UPDATE public.pedidos_materiales SET fecha_aprobacion = fecha - interval '1 day'
  WHERE fecha_aprobacion IS NOT null AND fecha_aprobacion > fecha;
