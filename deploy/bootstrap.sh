#!/usr/bin/env bash
# Prepara una VPS limpia (Ubuntu/Debian) para correr el stack.
# Idempotente: se puede correr de nuevo sin romper nada.
#
#   sudo ./deploy/bootstrap.sh
#
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "❌ Correr con sudo: sudo ./deploy/bootstrap.sh" >&2
  exit 1
fi

echo "▸ Paquetes base"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  echo "▸ Instalando Docker + compose plugin"
  curl -fsSL https://get.docker.com | sh
else
  echo "▸ Docker ya instalado: $(docker --version)"
fi
systemctl enable --now docker

# Swap: Baileys + Node pueden tener picos de memoria; con 2 GB conviene tener colchón.
if ! swapon --show | grep -q .; then
  echo "▸ Creando 2 GB de swap"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "▸ Firewall"
# OJO: Docker publica 80/443 con sus propias reglas de iptables, que NO pasan por ufw.
# ufw acá protege SSH y el resto del sistema; no limita los puertos que publica compose.
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo
echo "✅ Listo. Siguientes pasos:"
echo "   1) cp deploy/.env.example deploy/.env  y completar"
echo "   2) docker compose up -d --build"
echo "   3) docker compose logs -f bot   (para escanear el QR)"
