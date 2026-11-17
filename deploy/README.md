# Deploy

Stack de producción en una VPS: **Backend + Bot de WhatsApp + Caddy** (TLS automático).
El **Frontend va en Vercel** y llama a la API por `NEXT_PUBLIC_API_URL=https://$DOMAIN`.

```
Internet ──443──> Caddy ──> backend:3001
                                ▲
                     bot ───────┘  (red interna de compose, sin puertos)
                      │
                      └──outbound──> WhatsApp
```

Todo el estado vive afuera (Supabase, MongoDB Atlas): la VPS es descartable.

## 1. DNS

Creá un registro **A**: `api.tudominio.com` → IP pública de la VPS.
Esperá a que propague (`dig +short api.tudominio.com`) antes de levantar Caddy,
o Let's Encrypt falla la validación.

## 2. Variables

```bash
cp deploy/.env.example deploy/.env
$EDITOR deploy/.env
```

Mínimo a completar: `DOMAIN`, `ACME_EMAIL`, `INVITACION_SECRET` (`openssl rand -hex 32`),
`GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`DATABASE_URL`, `OPENAI_API_KEY`, `MONGO_URI`.

Dos cosas que muerden:

- **`DATABASE_URL`**: en una VPS con IPv4 usá la cadena del **pooler** de Supabase
  (Connect → Connection pooling → Session mode, puerto 5432). La conexión directa
  hoy es IPv6-only y no resuelve.
- **`MONGO_URI`**: habilitá la IP de la VPS en Atlas → Network Access.

## 3. Primera puesta en marcha

```bash
sudo ./deploy/bootstrap.sh     # docker, compose, ufw, swap (idempotente)
docker compose up -d --build
docker compose ps
```

Verificación:

```bash
curl -s https://api.tudominio.com/     # → "BuildData API funcionando"
```

## 4. Vincular WhatsApp

```bash
docker compose logs -f bot
```

Aparece el QR en consola (`qrcode-terminal`). WhatsApp → **Dispositivos vinculados** →
Vincular dispositivo. La sesión queda en Mongo (`baileys_auth`), así que no se pierde
al reiniciar el contenedor.

> Si ya tenés la sesión abierta en otra máquina, cerrala ahí primero: dos procesos con
> el mismo auth state se expulsan mutuamente (error 440).

## 5. Frontend (Vercel)

```
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

El Backend ya tiene `cors()` abierto (`apps/Backend/server.js`), no hace falta tocar nada.

## 6. Actualizar

### Manual

```bash
./deploy/update.sh
```

Avisá antes: al reiniciar el bot se pierden las encuestas pendientes en memoria
(`pendingQuery`, `clarifications`, `pollMessage.store`).

### Automático con GitHub Actions

`.github/workflows/deploy.yml` corre `./deploy/update.sh` por SSH cuando el
workflow **CI** termina bien en `master` (o a mano desde Actions → CD - VPS →
Run workflow). Después del deploy hace un healthcheck contra la API.

Solo actualiza si el commit tocó `apps/Backend`, `apps/WhatsApp-Bot`, `deploy/`,
`docker-compose.yml`, `package.json`, `bun.lock` o el propio workflow: un cambio
de frontend o de docs no reinicia el bot.

Configuración, una sola vez:

1. Generar una clave dedicada para el deploy (no uses tu clave personal):

   ```bash
   ssh-keygen -t ed25519 -C "github-actions@builddata" -f ~/.ssh/builddata_deploy -N ""
   ```

2. Autorizar la pública en la VM, con el usuario que corre Docker:

   ```bash
   # En la VM (por gcloud compute ssh o por SSH normal)
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   cat >> ~/.ssh/authorized_keys
   # pegás el contenido de ~/.ssh/builddata_deploy.pub y terminás con Ctrl+D
   chmod 600 ~/.ssh/authorized_keys
   ```

3. Cargar los secrets del repo (`gh secret set` o Settings → Secrets and
   variables → Actions):

   ```bash
   gh secret set VPS_HOST --body "34.138.144.130"
   gh secret set VPS_USER --body "<usuario-de-ssh>"   # el dueño de ~/BuildData y del grupo docker
   gh secret set VPS_SSH_KEY < ~/.ssh/builddata_deploy
   ssh-keyscan -H 34.138.144.130 2>/dev/null | gh secret set VPS_KNOWN_HOSTS
   ```

   Opcionales: `VPS_PORT` (default 22) y `API_HEALTH_URL` (default
   `https://api.builddata.com.ar/`).

4. Opcional: en Settings → Environments → `production`, agregar **required
   reviewers** si querés aprobar cada deploy a mano.

El workflow no hace checkout: la VM es la que hace `git pull --ff-only`. Si el
checkout de la VM quedó en otra rama, el workflow lo pasa a `master` antes de
correr el script. Si hay cambios locales sin commitear en la VM, falla a
propósito en vez de pisarlos.

## Backups

- **Supabase**: backups automáticos del proyecto. Nada que hacer.
- **Mongo**: la sesión de WhatsApp es lo único no reproducible. Perderla = re-escanear
  el QR, no perder datos de negocio.

## Troubleshooting

| Síntoma | Causa |
|---|---|
| Caddy no emite el certificado | DNS todavía no apunta a la VPS, o 80/443 cerrados |
| `ECONNREFUSED`/timeout a Postgres | `DATABASE_URL` con la conexión directa (IPv6) en vez del pooler |
| Bot se desconecta con `connectionReplaced` (440) | Hay otra instancia con el mismo `baileys_auth` |
| `!invitacion` responde token inválido | `INVITACION_SECRET` distinto entre Backend y Bot |
| 502 en la API | `docker compose logs backend`; el healthcheck lo marca `unhealthy` |
| Bot sin respuesta y backend OK | `docker compose logs bot` — revisá que `API_URL=http://backend:3001` |

Nunca `docker compose down -v`: borra el volumen `caddy_data` (certificados) y podés
comer el rate limit de Let's Encrypt.
