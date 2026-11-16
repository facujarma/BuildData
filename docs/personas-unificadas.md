# Personas unificadas (issue #13)

Documento de referencia del issue [#13](https://github.com/facujarma/BuildData/issues/13).
Cubre el problema de identidad, la migración manual, los scripts de auditoría y
merge, el procedimiento operativo y el rollback.

> `AGENTS.md` todavía no está actualizado (es un archivo protegido). Este
> documento es la referencia mientras tanto; cuando se apruebe el cambio, el
> resumen de "Arquitectura" tiene que apuntar acá.

## El problema

El bot identifica a la persona por **teléfono** y la web por **`auth_user_id`**.
Cuando el mismo humano se da de alta por los dos caminos quedan **dos filas en
`personas`**, cada una con su membresía y su rol. El caso real:

| | Teléfono (bot) | Web |
|---|---|---|
| Nombre | `Persona A` | `Persona A (cuenta web)` |
| Clave | `personas.telefono` = `***NNNN` | `personas.auth_user_id` = cuenta de Supabase |
| Rol en la obra compartida | Director | Director |

Consecuencias mientras no se unifican:

- Las acciones del bot (`movimientos_stock`, `operaciones_bot`, `mensajes`,
  `gastos`, `tareas`, `actividad`) quedan a nombre de una fila y las de la web
  (`chat_consultas`, `reportes`, `presupuestos`) a nombre de la otra.
- El rol se parte: la persona puede ser Director por un canal y Obrero por el
  otro en la misma obra.
- La bandeja de aprobación y la bitácora muestran dos identidades para la misma
  persona.

### Modelo actual

- `personas` tiene **dos UNIQUE independientes y nullables**: `auth_user_id`
  (`personas_auth_user_id_key`) y `telefono` (`personas_telefono_key`). Un mismo
  humano puede ocupar una fila con cada uno.
- El rol vive en `miembros_obra` (`persona_id`, `obra_id`, `rol`), con
  `UNIQUE (persona_id, obra_id)`. El nivel del rol se resuelve contra
  `roles_obra` de la obra y, si no existe, contra `ROLES_SISTEMA` (Obrero,
  Capataz, Director, etc.).
- `tareas.asignado_a` y `tareas.completada_por` **no apuntan a personas**: son
  FKs a `miembros_obra.id`.
- El teléfono se compara por dígitos normalizados, porque WhatsApp manda `549…`
  y la web suele guardar `+54 11 …` sin el 9 (`personas.service.js`:
  `variantesTelefono`).
- La base tiene el CHECK `personas_auth_or_phone_chk`: toda persona necesita
  `auth_user_id` **o** `telefono`. Una cuenta web sin teléfono no puede quedarse
  sin auth, por eso el merge borra el origen antes de transferir el
  `auth_user_id` al destino.

## Estrategia

1. **Destino = la persona del teléfono** (la que usa el bot). Es la que conserva
   el `id` que ya está referenciado por todo el historial de WhatsApp.
2. **Origen = la persona web** (la que tiene `auth_user_id`). Se elimina.
3. El merge es **una sola transacción**: o se migra todo, o no se toca nada.
   Orden:
   1. `verificarReferenciasConocidas`: contrasta las FKs reales de
      `information_schema` contra la lista explícita del servicio. Si aparece
      una tabla nueva que referencia `personas`/`miembros_obra`, **aborta**
      (`REFERENCIAS_DESCONOCIDAS`) en vez de perder datos.
   2. Migra las FKs simples (`actividad`, `alertas`, `chat_consultas`,
      `fotos_obra`, `gastos`, `invitaciones`, `mensajes`, `movimientos_stock`,
      `operaciones_bot`, `pedidos_materiales`, `presupuesto_ajustes`, `reportes`,
      `tareas.created_by/usuario_id`).
   3. Fusiona `proveedores_favoritos` (PK compuesta: `INSERT … ON CONFLICT DO
      NOTHING` y después `DELETE` de los del origen).
   4. Fusiona las membresías por obra: si la obra era solo del origen, se crea
      la membresía en el destino; si existía en los dos, se actualiza el rol.
   5. Remapea `tareas.asignado_a`/`completada_por` del miembro viejo al nuevo.
   6. Borra las membresías del origen.
   7. **Borra la fila de `personas` del origen** (ya sin refs ni membresías).
   8. Transfiere `auth_user_id` al destino. Va después del delete porque el
      CHECK `personas_auth_or_phone_chk` impide dejar sin auth a una persona web
      que no tiene teléfono.
   9. Inserta el snapshot en `personas_unificaciones` (después del delete:
      `persona_origen` no tiene FK y guarda el id histórico).
4. **El rol final nunca baja**: en cada obra gana el rol de mayor nivel
   (empate → el del destino). El merge no puede quitarle permisos a la persona
   en ninguno de los dos canales.
5. **Auditoría**: cada merge deja una fila en `personas_unificaciones` con las
   dos personas, las membresías y los conteos de referencias previos.

Implementación: `apps/Backend/services/personas.service.js`
(`planificarUnificacion`, `unificarPersonas`, `vincularPersonaAuth`).

## Migración manual (una sola vez)

Archivo: `apps/Backend/outputs/migracion_personas_unificadas.sql`.

Crea:

- `personas_unificaciones` (`persona_origen`, `persona_destino`, `auth_user_id`,
  `telefono`, `snapshot jsonb`, `ejecutado_por`, `created_at`) con índices por
  origen, destino y fecha.
- `personas_telefono_normalizado_idx`: índice funcional sobre
  `regexp_replace(COALESCE(telefono, ''), '\D', '', 'g')`, la misma expresión
  que usa la búsqueda por teléfono. **No reemplaza** el UNIQUE de `telefono`.
- `UNIQUE (persona_id, obra_id)` de `miembros_obra` (`miembros_obra_unique`) si
  la base se creó desde `outputs/` y no lo tenía. Es el que necesitan los
  `ON CONFLICT` del merge y de las altas.

Es idempotente (`IF NOT EXISTS`) y **no borra ni modifica datos existentes**.
Se corre a mano antes de usar el merge:

```bash
psql "$DATABASE_URL" -f apps/Backend/outputs/migracion_personas_unificadas.sql
# o pegarlo en el SQL Editor de Supabase
```

`persona_origen`/`persona_destino` **no tienen FK** a propósito: el origen se
borra en la misma transacción y una FK con `ON DELETE SET NULL`/`CASCADE`
borraría la evidencia histórica. `ejecutado_por` sí tiene FK con
`ON DELETE SET NULL`.

Si la migración no está aplicada, `unificarPersonas` falla con
`MIGRACION_PENDIENTE` (detecta `42P01`) y no escribe nada.

## Auditoría de duplicados

```bash
cd apps/Backend
node scripts/auditar_personas.js                  # tabla legible
node scripts/auditar_personas.js --json           # machine-readable
node scripts/auditar_personas.js --obra=<uuid>    # solo pares con membresía en esa obra
node scripts/auditar_personas.js --estricto       # exit 1 si hay candidatos
```

La tabla muestra: id corto de destino y origen, nombre del destino, teléfono
**enmascarado** (`***NNNN`), email de la cuenta web, rol por obra
(`origen→final`), total de referencias y si requiere revisión.

Detalles:

- Los teléfonos se enmascaran **también en `--json`**: el script no consulta ni
  imprime el número completo. Los ids sí van completos para poder pasarlos al
  merge.
- Los candidatos salen de `auditarDuplicadosPersonas`: grupos por teléfono
  normalizado, por nombre normalizado (ignora acentos y el sufijo `v. WEB`) y
  por nombre contenido. Cada par se completa con el plan de merge (membresías y
  referencias) y sus conflictos.
- `--estricto` sirve para monitoreo/CI: corta con 1 si queda algún candidato.
- En `--json`, stdout es JSON puro (los tips de dotenv quedan silenciados); los
  errores van a stderr.
- Es **solo lectura**. No crea, no modifica y no borra.

## Merge

```bash
cd apps/Backend

# 1) Plan (default: dry-run, no escribe)
node scripts/unificar_personas.js --destino=<uuid|telefono> --origen=<uuid|email>

# 2) Ejecución real (pide confirmación; --si para modo no interactivo)
node scripts/unificar_personas.js --destino=<uuid|telefono> --origen=<uuid|email> --aplicar --si

# Opcional: dejar registrado quién ejecutó
node scripts/unificar_personas.js ... --aplicar --si --ejecutado-por=<uuid de persona>

# Salida machine-readable (los errores van a stderr)
node scripts/unificar_personas.js ... --json
```

| Flag | Qué hace |
|---|---|
| `--destino=<uuid\|telefono>` | Persona que se conserva. El teléfono se resuelve con las variantes normalizadas. |
| `--origen=<uuid\|email>` | Persona web que se elimina. El email se resuelve en `auth.users` y de ahí a `personas.auth_user_id`. |
| `--dry-run` | Default. Imprime el plan y no escribe. |
| `--aplicar` | Ejecuta `unificarPersonas` (transaccional). |
| `--si` | Confirma sin prompt. Sin `--si` en un entorno no interactivo, el script cancela. |
| `--ejecutado-por=<uuid>` | Persona que queda en `personas_unificaciones.ejecutado_por`. |
| `--json` | Salida JSON. Teléfonos enmascarados. |

Códigos de salida: `0` OK, `1` error de uso/ejecución, `2` conflictos (no
escribe). El script de merge tampoco tiene ids ni datos personales
hardcodeados. Con `--json`, stdout es JSON puro y los errores van a stderr.

El plan muestra: las dos personas, las membresías con rol de origen/destino y
rol final, las referencias a mover con su tabla/columna, y los conflictos. Si
hay conflictos, sale 2 **antes** de escribir.

### Qué valida el plan

- Origen y destino existen y son distintos.
- El origen tiene cuenta web (`auth_user_id`).
- El destino no está vinculado a otra cuenta web distinta.
- Si las dos tienen teléfono, es el mismo (normalizado).
- No hay FKs desconocidas: `verificarReferenciasConocidas` corre tanto en el
  dry-run como dentro de `unificarPersonas`, antes de tocar una fila.

## Procedimiento paso a paso

### 1. Backup lógico de las dos filas

El snapshot automático guarda las dos personas y las membresías, pero **no los
ids de cada fila de las FKs simples** (guarda conteos). Para un rollback exacto:

```bash
cd apps/Backend
psql "$DATABASE_URL" <<'SQL'
\copy (SELECT * FROM personas WHERE id IN ('<destino>', '<origen>')) TO 'backup_personas.csv' CSV HEADER
\copy (SELECT * FROM miembros_obra WHERE persona_id IN ('<destino>', '<origen>')) TO 'backup_miembros.csv' CSV HEADER
\copy (SELECT 'actividad' AS tabla, id FROM actividad WHERE usuario_id IN ('<destino>', '<origen>') UNION ALL SELECT 'gastos', id FROM gastos WHERE usuario_id IN ('<destino>', '<origen>') UNION ALL SELECT 'mensajes', id FROM mensajes WHERE usuario_id IN ('<destino>', '<origen>') UNION ALL SELECT 'movimientos_stock', id FROM movimientos_stock WHERE usuario_id IN ('<destino>', '<origen>') UNION ALL SELECT 'operaciones_bot', id FROM operaciones_bot WHERE usuario_id IN ('<destino>', '<origen>') OR aprobada_por IN ('<destino>', '<origen>') UNION ALL SELECT 'tareas', id FROM tareas WHERE created_by IN ('<destino>', '<origen>') OR usuario_id IN ('<destino>', '<origen>')) TO 'backup_fks.csv' CSV HEADER
SQL
```

> No commitear los CSV: contienen datos personales.

### 2. Dry-run y revisión

```bash
node scripts/unificar_personas.js --destino=<teléfono> --origen=<email>
```

Revisar, en este orden:

1. Que el destino sea la persona del teléfono (la del bot).
2. Que las membresías sean las esperadas: cada obra una sola vez, con el rol
   final de mayor nivel.
3. Que los conteos de referencias coincidan con lo que se espera mover.
4. Que `Conflictos: ninguno.`

Si algo no cuadra, **no seguir**: corregir datos o crear la card de fix.

### 3. Aplicar

```bash
node scripts/unificar_personas.js --destino=<teléfono> --origen=<email> --aplicar --si --ejecutado-por=<uuid>
```

El prompt interactivo pide escribir `UNIFICAR`; `--si` lo saltea.

### 4. Verificación post-merge

- **Misma persona en los dos canales**:

  ```sql
  SELECT id, nombre, telefono, auth_user_id
    FROM personas
   WHERE id = '<destino>';            -- debe traer teléfono Y auth_user_id
  ```

- **Bot**: `GET /bot/obreros/telefono/<teléfono>` (service key) devuelve el
  `id` del destino y su rol por obra.
- **Web**: con la sesión de esa persona, `GET /usuarios/:obra_id` y
  `GET /obreros/:obra_id` devuelven el mismo `id` y el mismo rol.
- **Membresías**: una sola fila por obra en `miembros_obra` para esa persona.
- **Referencias**: los conteos de la tabla de verificación no bajaron y el
  origen quedó en cero:

  ```sql
  SELECT 'actividad' AS tabla, count(*) FROM actividad WHERE usuario_id = '<origen>'
  UNION ALL SELECT 'movimientos_stock', count(*) FROM movimientos_stock WHERE usuario_id = '<origen>'
  UNION ALL SELECT 'operaciones_bot', count(*) FROM operaciones_bot WHERE usuario_id = '<origen>'
  UNION ALL SELECT 'mensajes', count(*) FROM mensajes WHERE usuario_id = '<origen>';
  -- todas en 0
  ```

- **Auditoría**: existe la fila en `personas_unificaciones` con
  `persona_origen = '<origen>'` y el snapshot.

## Caso real verificado

Verificado con `--dry-run` (solo lectura) sobre la base de desarrollo, sin
ejecutar `--aplicar`:

| | Destino | Origen |
|---|---|---|
| id | `<destino>` | `<origen>` |
| Nombre | Persona A | Persona A (cuenta web) |
| Clave | teléfono `***NNNN` | cuenta web (auth) |

- 3 membresías: 2 obras que solo tenía la persona web (se crean en el destino) y
  1 obra compartida **Director/Director → Director**.
- 0 conflictos.
- 107 filas a mover: `actividad` 10, `chat_consultas` 13, `gastos` 1,
  `invitaciones.creada_por` 3, `movimientos_stock` 23, `operaciones_bot` 25,
  `pedidos_materiales.aprobado_por` 11, `reportes` 2, `tareas.created_by` 4,
  `tareas.usuario_id` 4, `miembros_obra` 3, `tareas.asignado_a` 4 (vía
  membresía) y `tareas.completada_por` 4 (vía membresía).

El `--aplicar` de este caso **no se corrió**: queda para cuando el dueño de los
datos lo apruebe.

## Reglas de seguridad

- **API web**: solo un Director con `equipo.administrar` puede vincular dos
  identidades. Se valida el nivel del operador en **todas las obras afectadas**
  (no alcanza con ser Director en una) y nunca puede otorgar un rol superior al
  propio. El endpoint es
  `POST /obreros/:obrero_id/obra/:obra_id/vincular` (body
  `{ persona_origen_id }`) y usa `unificarPersonas`; el controller aplica el
  gate de rol/membresía.
- **El alta web NO vincula por teléfono.** El teléfono del registro o de
  `user_metadata` no está verificado (no hay OTP): si el número ya existe, el
  alta crea la persona web **sin teléfono** y devuelve `201` con
  `requiere_vinculacion: true`; no toca la persona de WhatsApp ni le asigna el
  `auth_user_id`. Un Director la vincula desde Equipo (o el script de operador).
  Aceptar ese teléfono automáticamente permitiría que cualquiera reclame el
  WhatsApp de un Director y herede sus obras. El parámetro
  `permitirVinculoPorTelefono` de `vincularPersonaAuth` existe solo para flujos
  confiables y por defecto es `false`.
- **Los scripts son de operador**: corren con la `DATABASE_URL` y saltean la API.
  No son un endpoint ni reemplazan el gate de la web. No dárselos a usuarios
  finales.
- **No borrar filas a mano.** El orden de FKs y el UNIQUE de `auth_user_id`
  hacen que un borrado manual pierda historial o falle a mitad de camino.
- **No mergear si hay FKs desconocidas.** Si aparece una tabla nueva que
  referencia `personas`/`miembros_obra`, el servicio aborta. Primero hay que
  agregarla a `REFERENCIAS_PERSONA`/`REFERENCIAS_MIEMBROS_OBRA` y actualizar este
  documento.
- **No mergear teléfonos distintos** ni dos cuentas web distintas: el plan lo
  marca como conflicto y no escribe.
- **Backup primero.** El rollback es manual (ver abajo); sin backup no se puede
  deshacer con exactitud.

## Rollback

El rollback **no es automático**. `personas_unificaciones.snapshot` guarda:

```json
{
  "origen":  { "id": "...", "nombre": "...", "telefono": null, "auth_user_id": "..." },
  "destino": { "id": "...", "nombre": "...", "telefono": "...", "auth_user_id": null },
  "miembros": [ { "obra_id": "...", "miembro_origen_id": "...", "miembro_destino_id": "...", "rol_origen": "...", "rol_destino": "...", "rol_final": "..." } ],
  "referencias": [ { "tabla": "...", "columna": "...", "filas": 0 } ],
  "movidos": [ { "tabla": "...", "columna": "...", "filas": 0 } ]
}
```

Pasos:

1. Leer el snapshot de la fila de auditoría (no borrarla: es la evidencia).
2. Liberar el `auth_user_id` en el destino (`UPDATE personas SET auth_user_id =
   NULL WHERE id = '<destino>'`).
3. Re-insertar la persona de origen con **el mismo id** y sus datos del
   snapshot.
4. Re-insertar las membresías del origen con sus ids originales y roles del
   snapshot; restaurar en el destino los roles que tenía (`rol_destino`).
5. Re-apuntar las FKs usando el backup del paso 1 del procedimiento: el
   snapshot dice **cuántas** filas se movieron por tabla/columna, pero no
   **cuáles**. Por eso el backup lógico es obligatorio.
6. Re-apuntar `tareas.asignado_a`/`completada_por` a los `miembro_origen_id`.
7. Verificar conteos y que el bot y la web vuelvan a resolver a la persona de
   origen.

Si el rollback se ejecuta, anotarlo en el issue/ticket: la fila de
`personas_unificaciones` queda como registro de que hubo un merge revertido.

## Runbook de prueba en una obra de prueba

Nunca sobre datos reales. En una base de desarrollo:

1. Crear (o usar) dos obras de prueba y una cuenta web descartable.
2. Insertar las dos personas sintéticas:

   ```sql
   -- Persona del bot
   INSERT INTO personas (nombre, telefono)
   VALUES ('Test Bot', '5491100000001') RETURNING id;

   -- Persona web (auth_user_id de la cuenta descartable)
   INSERT INTO personas (auth_user_id, nombre)
   VALUES ('<auth uuid>', 'Test Web') RETURNING id;
   ```

3. Darles membresías con roles distintos para probar la regla del máximo:

   ```sql
   INSERT INTO miembros_obra (persona_id, obra_id, rol) VALUES
     ('<bot id>',    '<obra A>', 'Obrero'),
     ('<web id>',    '<obra A>', 'Director'),
     ('<web id>',    '<obra B>', 'Capataz');
   ```

4. Crear referencias de los dos lados: una tarea asignada al miembro web, un
   gasto con `usuario_id` web, un movimiento de stock con `usuario_id` bot.
5. Correr `node scripts/auditar_personas.js --obra=<obra A>` y
   `node scripts/unificar_personas.js --destino=<bot id> --origen=<web id>`:
   el plan debe mostrar `Obrero/Director → Director` en la obra A y
   `—/Capataz → Capataz` en la B.
6. `--aplicar --si` y verificar:
   - una sola persona con teléfono + `auth_user_id`;
   - una sola membresía por obra y con el rol máximo;
   - la tarea asignada apunta al miembro del destino;
   - `GET /bot/obreros/telefono/5491100000001` y `GET /usuarios/<obra A>`
     devuelven el mismo id y rol;
   - referencia en `personas_unificaciones`.
7. Limpiar en este orden (si no hay FKs colgando): `tareas`, `gastos`,
   `movimientos_stock`, `miembros_obra`, `personas` de prueba y la cuenta web
   descartable. La fila de `personas_unificaciones` de la prueba también se
   puede borrar en desarrollo.

## Tests

- `apps/Backend/services/personas.service.test.js`: normalización, auditoría,
  plan, merge completo con FKs/membresías/tareas/auditoría y `vincularPersonaAuth`
  (19 tests, DB fake).
- `apps/Backend/scripts/personas.scripts.test.js`: parseo de flags,
  clasificación y resolución de identificadores (con fakes), formateo del plan
  y enmascarado de teléfonos (37 tests, sin DB). Importar los scripts no ejecuta
  `main()`.

```bash
bun run test:backend                                   # toda la suite del Backend
bun test apps/Backend/scripts/personas.scripts.test.js # solo los scripts
bun run check:backend                                  # node --check de todo el Backend
```

Los scripts **no** corren `--aplicar` en tests.

## Pendientes

- **Auto-vinculación con verificación de teléfono**: hoy el usuario no puede
  reclamar su propia persona de WhatsApp sin un Director. Para habilitarlo hace
  falta un OTP por WhatsApp (código de un uso) antes de completar el
  `auth_user_id`; no usar `user_metadata.telefono` como prueba.
- `AGENTS.md` (protegido): agregar la sección de personas unificadas, la
  migración, el endpoint de vinculación y la regla de no vincular por teléfono
  sin verificar.
- La web ya permite vincular desde Equipo (botón “Vincular cuenta”); falta
  evaluar un flujo de auto-servicio cuando exista OTP.
