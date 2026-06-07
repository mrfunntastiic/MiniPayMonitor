#!/bin/bash
set -e

echo "=== MiniPay Monitor Deploy ==="

if [ ! -f .env ]; then
  echo "ERROR: File .env tidak ditemukan!"
  echo "Jalankan dulu:"
  echo "  cp .env.example .env"
  echo "  nano .env   (isi POSTGRES_PASSWORD dan TELEGRAM_BOT_TOKEN)"
  exit 1
fi

echo "[1/4] Pull latest code..."
git pull origin main

echo "[2/4] Build Docker images..."
docker compose build --no-cache

echo "[3/4] Stop services lama (jika ada)..."
docker compose down --remove-orphans || true

echo "[4/4] Jalankan migrasi + start semua services..."
docker compose up -d

echo ""
echo "Menunggu services siap..."
sleep 5
docker compose logs migrate --tail=20

echo ""
echo "=== Deploy selesai! ==="
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || echo "IP_VPS_ANDA")
echo "Dashboard: http://$VPS_IP"
echo ""
echo "Perintah berguna:"
echo "  docker compose logs -f api       # lihat log API"
echo "  docker compose logs -f frontend  # lihat log nginx"
echo "  docker compose ps                # status semua container"
echo "  docker compose restart api       # restart API server"
