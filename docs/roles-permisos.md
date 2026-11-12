# Roles y permisos (política final)

Documento de referencia del issue [#8](https://github.com/facujarma/BuildData/issues/8).
Los permisos son **por obra** y tienen dos superficies independientes:

- **`bot`**: lo que la persona puede hacer desde WhatsApp.
- **`web`**: lo que la persona puede ver/hacer desde el dashboard.

Un rol es la misma identidad en las dos superficies, pero la matriz de cada una se
define por separado: un Capataz puede crear pedidos desde el bot y no necesita
editar el presupuesto desde la web; un Administrativo puede editar comprobantes
desde la web y no reportar stock desde el campo.

## Decisiones

1. **La web también valida rol**, no solo membresía. Cada ruta tiene un permiso
   `web.*`; sin él responde `403` con `code: "SIN_PERMISO"`.
2. **Capataz y Director ya no comparten la misma matriz.** El Capataz conserva la
   operación de campo (pedidos, stock, tareas, bandeja) y pierde configuración,
   edición de presupuesto, exportación y administración de equipo/roles. El
   Director conserva todo.
3. **No se prohíbe la autoaprobación.** Un Capataz/Administrativo/Director puede
   aprobar una operación o pedido que él mismo creó. Aprobar/rechazar exige
   `bandeja.aprobar`/`pedidos.aprobar`, no ser otra persona.
4. **Administrar el equipo sigue siendo exclusivo de Director** por defecto
   (`equipo.administrar` solo lo tiene Director). La jerarquía por `nivel` impide
   que un rol con ese permiso otorgue un rol de nivel superior al propio.
5. **Presupuesto y exportación**:
   - Ver presupuesto: Director, Administrativo y Capataz.
   - Editar presupuesto: solo Director.
   - Exportar reportes/Excel: Director y Administrativo.
   - Un Cliente no ve costos internos (ni presupuesto ni recibos).
6. **Invitar y editar roles sigue siendo exclusivo de Director** por defecto
   (`equipo.administrar` + `roles.administrar`).
7. **Roles editables desde Configuración → Roles y permisos.** Se pueden crear
   roles nuevos y editar permisos de cualquier rol. Los roles de sistema no se
   pueden renombrar ni borrar (sí editar sus permisos, salvo el candado de
   Director descrito abajo).
8. **Si una sección web no está permitida, se muestra un cartel** con el rol
   actual y el permiso faltante; no se renderiza la pantalla ni se disparan sus
   requests.

## Roles

| Rol | Nivel | Sistema | Para qué |
|---|---:|---|---|
| Cliente | 5 | sí | Lectura del avance: dashboard, cronograma, actividad, galería y reportes. Sin costos ni operación. |
| Obrero | 10 | sí | Reporta el día a día desde WhatsApp y consulta stock/actividad/galería desde la web. |
| Seguridad e Higiene | 25 | sí | Alertas, fotos, retrasos y reportes de seguridad. Sin compras ni costos. |
| Capataz | 30 | sí | Operación de campo y supervisión: pedidos, stock, tareas, bandeja. Sin presupuesto/export/equipo. |
| Administrativo | 60 | sí | Oficina: compras, proveedores, stock, comprobantes, presupuesto (solo lectura) y exportación. |
| Director | 100 | sí | Todo, incluida la administración de equipo y roles. |

`nivel` es la jerarquía para asignar roles: nadie puede otorgar un rol de nivel
mayor al propio. Solo se puede administrar el equipo si el rol tiene
`equipo.administrar`.

## Catálogo de permisos

### WhatsApp (`bot`)

| Permiso | Qué habilita |
|---|---|
| `stock.registrar` | Registrar entradas/salidas de stock |
| `stock.ajustar` | Ajustar stock (delta o stock final) |
| `gasto.crear` | Cargar gastos por texto o comprobante |
| `pedido.crear` | Crear pedidos de compra |
| `pedido.entregar` | Marcar pedidos como entregados |
| `tarea.crear` | Reportar/crear tareas |
| `tarea.completar` | Completar tareas |
| `retraso.registrar` | Registrar retrasos |
| `alerta.crear` | Generar alertas |
| `foto.subir` | Subir fotos a la galería |

### Web (`web`)

| Permiso | Qué habilita |
|---|---|
| `dashboard.ver` | Ver el dashboard de la obra |
| `bandeja.ver` | Ver la bandeja de operaciones |
| `bandeja.aprobar` | Aprobar, rechazar y reintentar operaciones |
| `equipo.ver` | Ver el equipo |
| `equipo.administrar` | Invitar, asignar, quitar y cambiar el rol de miembros |
| `configuracion.ver` | Ver Configuración |
| `configuracion.editar` | Editar datos de la obra, rubros y categorías |
| `roles.administrar` | Crear/editar/borrar roles y sus permisos |
| `cronograma.ver` | Ver cronograma y tareas |
| `cronograma.editar` | Crear, editar y completar tareas |
| `actividad.ver` | Ver la bitácora |
| `actividad.registrar` | Cargar actividad manual |
| `galeria.ver` | Ver la galería |
| `galeria.gestionar` | Subir y borrar fotos |
| `reportes.ver` | Ver reportes |
| `reportes.exportar` | Generar reportes y exportar información (Excel/PDF) |
| `pedidos.ver` | Ver pedidos |
| `pedidos.crear` | Crear pedidos |
| `pedidos.aprobar` | Aprobar/rechazar pedidos |
| `pedidos.entregar` | Marcar pedidos entregados y aplicar stock |
| `stock.ver` | Ver materiales/stock |
| `stock.ajustar` | Ajustar stock y gestionar materiales/categorías |
| `proveedores.ver` | Ver proveedores |
| `proveedores.gestionar` | Crear/editar/vincular/promover/borrar proveedores |
| `presupuesto.ver` | Ver presupuesto y costos |
| `presupuesto.editar` | Ajustar rubros del presupuesto |
| `recibos.ver` | Ver comprobantes/gastos |
| `recibos.gestionar` | Cargar/editar comprobantes y archivos |
| `alertas.ver` | Ver alertas |
| `alertas.gestionar` | Crear y resolver alertas |

## Matriz por defecto

### WhatsApp

| Permiso | Cliente | Obrero | Seg. e Higiene | Capataz | Administrativo | Director |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| stock.registrar | — | ✅ | — | ✅ | — | ✅ |
| stock.ajustar | — | — | — | ✅ | ✅ | ✅ |
| gasto.crear | — | ✅ | — | ✅ | ✅ | ✅ |
| pedido.crear | — | — | — | ✅ | ✅ | ✅ |
| pedido.entregar | — | — | — | ✅ | — | ✅ |
| tarea.crear | — | ✅ | ✅ | ✅ | — | ✅ |
| tarea.completar | — | ✅ | — | ✅ | — | ✅ |
| retraso.registrar | — | ✅ | ✅ | ✅ | — | ✅ |
| alerta.crear | — | ✅ | ✅ | ✅ | — | ✅ |
| foto.subir | — | ✅ | ✅ | ✅ | ✅ | ✅ |

### Web

| Permiso | Cliente | Obrero | Seg. e Higiene | Capataz | Administrativo | Director |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| dashboard.ver | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| bandeja.ver | — | — | — | ✅ | ✅ | ✅ |
| bandeja.aprobar | — | — | — | ✅ | ✅ | ✅ |
| equipo.ver | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| equipo.administrar | — | — | — | — | — | ✅ |
| configuracion.ver | — | — | — | — | — | ✅ |
| configuracion.editar | — | — | — | — | — | ✅ |
| roles.administrar | — | — | — | — | — | ✅ |
| cronograma.ver | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cronograma.editar | — | — | — | ✅ | — | ✅ |
| actividad.ver | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| actividad.registrar | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| galeria.ver | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| galeria.gestionar | — | ✅ | ✅ | ✅ | — | ✅ |
| reportes.ver | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| reportes.exportar | — | — | — | — | ✅ | ✅ |
| pedidos.ver | — | — | — | ✅ | ✅ | ✅ |
| pedidos.crear | — | — | — | ✅ | ✅ | ✅ |
| pedidos.aprobar | — | — | — | ✅ | ✅ | ✅ |
| pedidos.entregar | — | — | — | ✅ | — | ✅ |
| stock.ver | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| stock.ajustar | — | — | — | ✅ | ✅ | ✅ |
| proveedores.ver | — | — | — | ✅ | ✅ | ✅ |
| proveedores.gestionar | — | — | — | — | ✅ | ✅ |
| presupuesto.ver | — | — | — | ✅ | ✅ | ✅ |
| presupuesto.editar | — | — | — | — | — | ✅ |
| recibos.ver | — | — | — | ✅ | ✅ | ✅ |
| recibos.gestionar | — | — | — | ✅ | ✅ | ✅ |
| alertas.ver | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| alertas.gestionar | — | ✅ | ✅ | ✅ | — | ✅ |

## Modelo de datos

Migración manual: `apps/Backend/outputs/migracion_roles_permisos.sql`.

```sql
CREATE TABLE public.roles_obra (
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
CREATE UNIQUE INDEX roles_obra_nombre_unique
  ON public.roles_obra (obra_id, lower(nombre));
```

- Se elimina el `CHECK miembros_obra_rol_check`; `miembros_obra.rol` sigue siendo
  el **nombre** del rol (compatibilidad con datos y tokens existentes).
- Cada obra se siembra con los seis roles de sistema al crearse y la migración
  hace el backfill de las obras existentes.
- `permisos` guarda `{ "bot": { "<key>": true }, "web": { "<key>": true } }`.
  Al escribir se normaliza contra el catálogo: claves desconocidas se descartan.
- Si un miembro tiene un `rol` que no existe en `roles_obra`, se resuelve por
  compatibilidad (`normalizarRol`) al rol de sistema equivalente; si tampoco,
  cae en Obrero (mínimo privilegio).

## API

### `GET /obras/:obraId/mi-rol`
Valida membresía. Devuelve el rol y los permisos efectivos del que llama:

```json
{
  "rol": { "id": "...", "nombre": "Capataz", "nivel": 30, "es_sistema": true },
  "permisos": {
    "bot": ["stock.registrar", "stock.ajustar", "pedido.crear"],
    "web": ["dashboard.ver", "pedidos.ver", "..."],
    "botMap": { "stock.registrar": true },
    "webMap": { "dashboard.ver": true }
  }
}
```

`GET /obras/:obraId` incluye el mismo objeto como `miRol` (y valida membresía).

### Roles (solo `roles.administrar`)
- `GET /roles/:obra_id` → `{ roles: [...], catalogo: { bot: [...], web: [...] } }`.
- `POST /roles/:obra_id` → `{ nombre, descripcion, nivel, permisos }`.
- `PATCH /roles/:obra_id/:rol_id` → mismos campos, parcial.
- `DELETE /roles/:obra_id/:rol_id` → solo roles no sistema y sin miembros ni
  invitaciones pendientes (409 si están en uso).

Errores de permiso: `403 { code: "SIN_PERMISO", message, permiso, rol }`.

## Enforcement web

Cada ruta se protege con un middleware `exigirPermiso(permiso, resolverObra)`.
El resolver saca la obra de `:obra_id`, del body/query o del recurso
(`pedido`, `material`, `gasto`, `tarea`, `alerta`, `foto`, `operación`).
La membresía sigue siendo obligatoria: sin membresía, 403.

| Ruta | Permiso |
|---|---|
| `GET /dashboard/:obraId` | `dashboard.ver` |
| `GET /mensajes/:obraId` | `bandeja.ver` |
| `PATCH /operaciones/:id/aprobar\|rechazar\|reintentar` | `bandeja.aprobar` |
| `GET /pedidos/:obra_id` | `pedidos.ver` |
| `POST /pedidos` | `pedidos.crear` |
| `PATCH /pedidos/:id/aprobar\|rechazar` | `pedidos.aprobar` |
| `PATCH /pedidos/:id/estado\|entregar` | `pedidos.entregar` |
| `GET /materiales/:obra_id`, `GET .../categorias` | `stock.ver` |
| `POST/PATCH/DELETE /materiales*`, `POST /materiales/categorias` | `stock.ajustar` |
| `GET /presupuestos/:obra_id` | `presupuesto.ver` |
| `PUT /presupuestos/:obra_id/rubros` | `presupuesto.editar` |
| `GET /gastos/:obra_id` | `recibos.ver` |
| `POST/PATCH /gastos*`, `POST /gastos/:id/archivo` | `recibos.gestionar` |
| `GET /tareas/:obra_id` | `cronograma.ver` |
| `POST/PATCH /tareas*` | `cronograma.editar` |
| `GET /proveedores` | `proveedores.ver` |
| `POST/PATCH/DELETE /proveedores*` | `proveedores.gestionar` |
| `GET /alertas/:obra_id` | `alertas.ver` |
| `POST /alertas`, `PATCH /alertas/:id/resolver` | `alertas.gestionar` |
| `GET /actividad/:obra_id` | `actividad.ver` |
| `POST /actividad` | `actividad.registrar` |
| `GET /galeria/:obra_id` | `galeria.ver` |
| `POST/DELETE /galeria*` | `galeria.gestionar` |
| `GET /reportes/:obra_id*` | `reportes.ver` |
| `POST /reportes/:obra_id/generar`, `POST /reportes` | `reportes.exportar` |
| `GET /obreros/:obra_id`, `GET /usuarios/:obra_id` | `equipo.ver` |
| `POST/DELETE /obreros*`, `POST /usuarios/asignar-obra` | `equipo.administrar` |
| `GET /obras`, `GET /obras/:obraId`, `POST /obras`, `PATCH /obras/:obraId/starred` | membresía / autenticado |
| `PATCH/DELETE /obras/:obraId` | `configuracion.editar` |
| `GET /obras/:obraId/rubros` | `cronograma.ver` |
| `POST/PATCH/DELETE /obras/:obraId/rubros*` | `configuracion.editar` |
| `POST /chat/consultar` | `dashboard.ver` |

### Payloads filtrados por permiso

Dos endpoints los comparten roles con permisos distintos, así que recortan el body
con `req.perfilObra` (lo deja `exigirPermiso`) además de exigir su permiso de ruta:

- `GET /dashboard/:obraId`: `budget` y `budgetBreakdown` solo con `presupuesto.ver`;
  `orders` solo con `pedidos.ver` (sin el permiso vuelve `[]`). Si falta
  `presupuesto.ver` ni siquiera se consulta el presupuesto.
- `GET /reportes/:obra_id/snapshot` y `POST /reportes/:obra_id/generar`: sin
  `presupuesto.ver` omiten `presupuestoTotal`, `ejecutado`, `ejecutadoTotal` y
  `comprometido`; sin `recibos.ver`, `recibosPend`; sin `stock.ver`, `stockLow`.
  Las secciones `presupuesto`, `pedidos`, `stock` y `recibos` no se arman sin el
  permiso correspondiente.

El frontend gatea lo mismo (`BudgetCard` con `puede("presupuesto.ver")` y el KPI
de ejecutado en Reportes), así que el payload filtrado no rompe la pantalla.

## Bot

`GET /bot/obreros/telefono/:phone` devuelve por obra:

```json
{
  "obra_id": "...",
  "obra_nombre": "...",
  "rol": "Capataz",
  "permisos": ["stock.registrar", "stock.ajustar", "pedido.crear"]
}
```

El bot usa `permisos` cuando viene; si no (backend viejo), cae en la matriz
estática de `permissions.service.ts`. El chequeo previo del bot es solo un aviso:
la barrera dura sigue en el Backend (`registrarOperaciones` y endpoints directos).

## UI

- **RoleProvider/useRole** en el layout del dashboard: `GET /obras/:obraId/mi-rol`.
- **Sidebar**: oculta las entradas cuyo permiso de sección no está.
- **Cartel de sección bloqueada**: si se entra por URL directa a una sección sin
  permiso, se renderiza un cartel con el rol actual, el permiso faltante y la
  explicación (“Pedile a un Director que lo habilite”).
- **Badge de rol** en la barra superior.
- **Configuración → Roles y permisos** (solo `roles.administrar`): lista de roles,
  editor de nombre/descripción/nivel, toggles agrupados de WhatsApp y Web, alta
  de rol nuevo y baja de roles personalizados.
- **Acciones**: los botones de crear/aprobar/entregar/editar/exportar se ocultan
  o deshabilitan si falta el permiso específico.

## Invariantes de seguridad

- La membresía es obligatoria en todas las rutas web; el rol solo agrega una
  segunda barrera.
- Fail closed: permiso desconocido o rol no resuelto → sin acceso.
- El rol de sistema **Director** conserva siempre `roles.administrar` y
  `equipo.administrar` (no se puede dejar la obra sin administrador).
- Un rol con `equipo.administrar` solo puede asignar roles de nivel ≤ al suyo.
- Aprobar/rechazar no valida que el aprobador sea distinto del creador
  (autoaprobación permitida por decisión).
- El texto libre de nombre de rol se valida: 2–40 caracteres, único por obra
  (case-insensitive).
