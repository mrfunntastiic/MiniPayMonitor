#!/bin/bash
set -e

echo "============================================"
echo "  Deploy MiniPay Monitor ke VPS"
echo "============================================"

# Cek .env.production ada
if [ ! -f ".env.production" ]; then
  echo "ERROR: File .env.production tidak ditemukan!"
  echo "Buat dulu dengan mengisi DATABASE_URL dan variabel lainnya."
  exit 1
fi

source .env.production

# Install semua dependencies
echo "[1/4] Install dependencies..."
pnpm install --frozen-lockfile

# Build libs dulu
echo "[2/4] Build shared libraries..."
pnpm run typecheck:libs

# Build API server
echo "[3/4] Build API server..."
pnpm --filter @workspace/api-server run build

# Build frontend (set BASE_PATH=/ untuk production)
echo "[4/4] Build frontend..."
PORT=3000 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/minipay-monitor run build

echo ""
echo "Build selesai!"
echo "Salin static files ke Nginx..."

# Copy static files ke nginx web root
sudo mkdir -p /var/www/minipay-monitor
sudo cp -r artifacts/minipay-monitor/dist/public/. /var/www/minipay-monitor/
sudo chown -R www-data:www-data /var/www/minipay-monitor

echo "Restart PM2 (API server)..."
pm2 restart ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs

pm2 save
pm2 startup | tail -1 | sudo bash 2>/dev/null || true

echo ""
echo "============================================"
echo "  Deploy selesai!"
echo "  Website: http://$(curl -s ifconfig.me 2>/dev/null || echo 'IP_VPS_KAMU')"
echo "============================================"
