#!/usr/bin/env bash
# Actualiza el stack en la VPS: trae el código, reconstruye y reinicia sin cortar de más.
#
#   ./deploy/update.sh
#
# El bot pierde las encuestas pendientes en memoria al reiniciar (pendingQuery,
# clarifications, pollMessage.store): avisá antes si hay gente operando.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▸ Código"
git pull --ff-only

echo "▸ Build"
docker compose build --pull

echo "▸ Deploy"
docker compose up -d --remove-orphans

echo "▸ Limpieza de imágenes viejas"
docker image prune -f >/dev/null

echo
docker compose ps
echo
echo "✅ Actualizado. Logs: docker compose logs -f --tail=50"
