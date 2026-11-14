-- ============================================================
-- Migración: roles por obra y permisos dinámicos (issue #8).
--
-- - Elimina el CHECK de tres roles de miembros_obra (el rol sigue siendo el
--   NOMBRE del rol, por compatibilidad con los datos y los tokens existentes).
-- - Crea public.roles_obra: cada obra tiene sus roles (6 de sistema + los que
--   cree un Director) con el catálogo de permisos bot/web.
-- - Hace el backfill de las obras existentes con los 6 roles de sistema.
--
-- El JSON de permisos se genera desde ROLES_SISTEMA de
-- apps/Backend/services/roles.service.js: si se cambia una matriz ahí, hay que
-- volver a generar este bloque (script interno) o editar las dos partes juntas.
--
-- Ejecutar a mano, una vez, contra la base. Es idempotente.
-- ============================================================

BEGIN;

-- 1. El default de miembros_obra sigue siendo el rol mínimo.
ALTER TABLE public.miembros_obra ALTER COLUMN rol SET DEFAULT 'Obrero';

-- 2. El rol ahora puede ser cualquier nombre de roles_obra (se resuelve por obra).
ALTER TABLE public.miembros_obra DROP CONSTRAINT IF EXISTS miembros_obra_rol_check;

-- 3. Tabla de roles por obra.
CREATE TABLE IF NOT EXISTS public.roles_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text NOT NULL DEFAULT '',
  nivel integer NOT NULL DEFAULT 10 CHECK (nivel BETWEEN 1 AND 100),
  es_sistema boolean NOT NULL DEFAULT false,
  permisos jsonb NOT NULL DEFAULT '{"bot":{},"web":{}}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS roles_obra_nombre_unique
  ON public.roles_obra (obra_id, lower(nombre));

-- 4. Backfill: los seis roles de sistema en cada obra existente.
INSERT INTO public.roles_obra (obra_id, nombre, descripcion, nivel, es_sistema, permisos)
SELECT o.id, r.nombre, r.descripcion, r.nivel, true, r.permisos::jsonb
FROM public.obras o
CROSS JOIN (VALUES
  ('Cliente', 'Lectura del avance: dashboard, cronograma, actividad, galería y reportes. Sin costos ni operación.', 5, $json${
        "bot": {
          "stock.registrar": false,
          "stock.ajustar": false,
          "gasto.crear": false,
          "pedido.crear": false,
          "pedido.entregar": false,
          "tarea.crear": false,
          "tarea.completar": false,
          "retraso.registrar": false,
          "alerta.crear": false,
          "foto.subir": false
        },
        "web": {
          "dashboard.ver": true,
          "bandeja.ver": false,
          "bandeja.aprobar": false,
          "equipo.ver": true,
          "equipo.administrar": false,
          "configuracion.ver": false,
          "configuracion.editar": false,
          "roles.administrar": false,
          "cronograma.ver": true,
          "cronograma.editar": false,
          "actividad.ver": true,
          "actividad.registrar": false,
          "galeria.ver": true,
          "galeria.gestionar": false,
          "reportes.ver": true,
          "reportes.exportar": false,
          "pedidos.ver": false,
          "pedidos.crear": false,
          "pedidos.aprobar": false,
          "pedidos.entregar": false,
          "stock.ver": false,
          "stock.ajustar": false,
          "proveedores.ver": false,
          "proveedores.gestionar": false,
          "presupuesto.ver": false,
          "presupuesto.editar": false,
          "recibos.ver": false,
          "recibos.gestionar": false,
          "alertas.ver": false,
          "alertas.gestionar": false
        }
      }$json$),
  ('Obrero', 'Reporta el día a día desde WhatsApp y consulta stock/actividad/galería desde la web.', 10, $json${
        "bot": {
          "stock.registrar": true,
          "stock.ajustar": false,
          "gasto.crear": true,
          "pedido.crear": false,
          "pedido.entregar": false,
          "tarea.crear": true,
          "tarea.completar": true,
          "retraso.registrar": true,
          "alerta.crear": true,
          "foto.subir": true
        },
        "web": {
          "dashboard.ver": true,
          "bandeja.ver": false,
          "bandeja.aprobar": false,
          "equipo.ver": true,
          "equipo.administrar": false,
          "configuracion.ver": false,
          "configuracion.editar": false,
          "roles.administrar": false,
          "cronograma.ver": true,
          "cronograma.editar": false,
          "actividad.ver": true,
          "actividad.registrar": true,
          "galeria.ver": true,
          "galeria.gestionar": true,
          "reportes.ver": false,
          "reportes.exportar": false,
          "pedidos.ver": false,
          "pedidos.crear": false,
          "pedidos.aprobar": false,
          "pedidos.entregar": false,
          "stock.ver": true,
          "stock.ajustar": false,
          "proveedores.ver": false,
          "proveedores.gestionar": false,
          "presupuesto.ver": false,
          "presupuesto.editar": false,
          "recibos.ver": false,
          "recibos.gestionar": false,
          "alertas.ver": true,
          "alertas.gestionar": true
        }
      }$json$),
  ('Seguridad e Higiene', 'Alertas, fotos, retrasos y reportes de seguridad. Sin compras ni costos.', 25, $json${
        "bot": {
          "stock.registrar": false,
          "stock.ajustar": false,
          "gasto.crear": false,
          "pedido.crear": false,
          "pedido.entregar": false,
          "tarea.crear": true,
          "tarea.completar": false,
          "retraso.registrar": true,
          "alerta.crear": true,
          "foto.subir": true
        },
        "web": {
          "dashboard.ver": true,
          "bandeja.ver": false,
          "bandeja.aprobar": false,
          "equipo.ver": true,
          "equipo.administrar": false,
          "configuracion.ver": false,
          "configuracion.editar": false,
          "roles.administrar": false,
          "cronograma.ver": true,
          "cronograma.editar": false,
          "actividad.ver": true,
          "actividad.registrar": true,
          "galeria.ver": true,
          "galeria.gestionar": true,
          "reportes.ver": true,
          "reportes.exportar": false,
          "pedidos.ver": false,
          "pedidos.crear": false,
          "pedidos.aprobar": false,
          "pedidos.entregar": false,
          "stock.ver": true,
          "stock.ajustar": false,
          "proveedores.ver": false,
          "proveedores.gestionar": false,
          "presupuesto.ver": false,
          "presupuesto.editar": false,
          "recibos.ver": false,
          "recibos.gestionar": false,
          "alertas.ver": true,
          "alertas.gestionar": true
        }
      }$json$),
  ('Capataz', 'Operación de campo y supervisión: pedidos, stock, tareas, bandeja. Sin presupuesto/export/equipo.', 30, $json${
        "bot": {
          "stock.registrar": true,
          "stock.ajustar": true,
          "gasto.crear": true,
          "pedido.crear": true,
          "pedido.entregar": true,
          "tarea.crear": true,
          "tarea.completar": true,
          "retraso.registrar": true,
          "alerta.crear": true,
          "foto.subir": true
        },
        "web": {
          "dashboard.ver": true,
          "bandeja.ver": true,
          "bandeja.aprobar": true,
          "equipo.ver": true,
          "equipo.administrar": false,
          "configuracion.ver": false,
          "configuracion.editar": false,
          "roles.administrar": false,
          "cronograma.ver": true,
          "cronograma.editar": true,
          "actividad.ver": true,
          "actividad.registrar": true,
          "galeria.ver": true,
          "galeria.gestionar": true,
          "reportes.ver": true,
          "reportes.exportar": false,
          "pedidos.ver": true,
          "pedidos.crear": true,
          "pedidos.aprobar": true,
          "pedidos.entregar": true,
          "stock.ver": true,
          "stock.ajustar": true,
          "proveedores.ver": true,
          "proveedores.gestionar": false,
          "presupuesto.ver": true,
          "presupuesto.editar": false,
          "recibos.ver": true,
          "recibos.gestionar": true,
          "alertas.ver": true,
          "alertas.gestionar": true
        }
      }$json$),
  ('Administrativo', 'Oficina: compras, proveedores, stock, comprobantes, presupuesto (solo lectura) y exportación.', 60, $json${
        "bot": {
          "stock.registrar": false,
          "stock.ajustar": true,
          "gasto.crear": true,
          "pedido.crear": true,
          "pedido.entregar": false,
          "tarea.crear": false,
          "tarea.completar": false,
          "retraso.registrar": false,
          "alerta.crear": false,
          "foto.subir": true
        },
        "web": {
          "dashboard.ver": true,
          "bandeja.ver": true,
          "bandeja.aprobar": true,
          "equipo.ver": true,
          "equipo.administrar": false,
          "configuracion.ver": false,
          "configuracion.editar": false,
          "roles.administrar": false,
          "cronograma.ver": true,
          "cronograma.editar": false,
          "actividad.ver": true,
          "actividad.registrar": true,
          "galeria.ver": true,
          "galeria.gestionar": false,
          "reportes.ver": true,
          "reportes.exportar": true,
          "pedidos.ver": true,
          "pedidos.crear": true,
          "pedidos.aprobar": true,
          "pedidos.entregar": false,
          "stock.ver": true,
          "stock.ajustar": true,
          "proveedores.ver": true,
          "proveedores.gestionar": true,
          "presupuesto.ver": true,
          "presupuesto.editar": false,
          "recibos.ver": true,
          "recibos.gestionar": true,
          "alertas.ver": true,
          "alertas.gestionar": false
        }
      }$json$),
  ('Director', 'Todo, incluida la administración de equipo y roles.', 100, $json${
        "bot": {
          "stock.registrar": true,
          "stock.ajustar": true,
          "gasto.crear": true,
          "pedido.crear": true,
          "pedido.entregar": true,
          "tarea.crear": true,
          "tarea.completar": true,
          "retraso.registrar": true,
          "alerta.crear": true,
          "foto.subir": true
        },
        "web": {
          "dashboard.ver": true,
          "bandeja.ver": true,
          "bandeja.aprobar": true,
          "equipo.ver": true,
          "equipo.administrar": true,
          "configuracion.ver": true,
          "configuracion.editar": true,
          "roles.administrar": true,
          "cronograma.ver": true,
          "cronograma.editar": true,
          "actividad.ver": true,
          "actividad.registrar": true,
          "galeria.ver": true,
          "galeria.gestionar": true,
          "reportes.ver": true,
          "reportes.exportar": true,
          "pedidos.ver": true,
          "pedidos.crear": true,
          "pedidos.aprobar": true,
          "pedidos.entregar": true,
          "stock.ver": true,
          "stock.ajustar": true,
          "proveedores.ver": true,
          "proveedores.gestionar": true,
          "presupuesto.ver": true,
          "presupuesto.editar": true,
          "recibos.ver": true,
          "recibos.gestionar": true,
          "alertas.ver": true,
          "alertas.gestionar": true
        }
      }$json$)
) AS r(nombre, descripcion, nivel, permisos)
ON CONFLICT (obra_id, lower(nombre)) DO NOTHING;

COMMIT;
