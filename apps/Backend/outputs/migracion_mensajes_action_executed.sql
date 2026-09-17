-- mensajes.action_executed: interpretación ejecutada del mensaje del bot.
-- Un elemento por cada llamada a la API (jsonb[]), con tipo, destino, campos,
-- confianza, data, result, estado y error. Lo consume la bandeja de WhatsApp.
ALTER TABLE public.mensajes
  ADD COLUMN IF NOT EXISTS action_executed jsonb[] NULL;
