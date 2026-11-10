#!/bin/bash
# Instalación en Linux (Debian/Ubuntu). Ejecutar desde la carpeta del servidor: bash linux/instalar.sh
set -e
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo "Instala Node.js 18+ (https://nodejs.org o tu gestor de paquetes) y repite."; exit 1; }
command -v tailscale >/dev/null || echo "Aviso: Tailscale no está instalado (curl -fsSL https://tailscale.com/install.sh | sh; sudo tailscale up)."
npm install --omit=dev
npx playwright-core install --with-deps chromium
[ -f config.json ] || cp config.ejemplo.json config.json
echo "Listo. Prueba con: node servidor.js"
echo "Para dejarlo 24/7: edita linux/urefugio.service (USUARIO y RUTA) y:  sudo cp linux/urefugio.service /etc/systemd/system/ && sudo systemctl enable --now urefugio"
