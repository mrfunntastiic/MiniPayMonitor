#!/bin/bash
set -e

echo "=== Setup HTTPS dengan Let's Encrypt ==="

if [ ! -f .env ]; then
  echo "ERROR: File .env tidak ditemukan!"
  exit 1
fi

# Load env vars
export $(grep -v '^#' .env | xargs)

# Tanya domain
read -p "Masukkan domain kamu (contoh: monitor.namadomain.com): " DOMAIN
read -p "Masukkan email untuk notif SSL (contoh: admin@domain.com): " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "ERROR: Domain dan email tidak boleh kosong!"
  exit 1
fi

echo ""
echo "Domain : $DOMAIN"
echo "Email  : $EMAIL"
echo ""

# Step 1: Buat nginx-current.conf dengan mode HTTP only dulu
echo "[1/5] Setup nginx HTTP (untuk verifikasi domain)..."
cp nginx/nginx-http.conf nginx/nginx-current.conf

# Step 2: Build dan start dengan HTTP config
echo "[2/5] Build & start services (HTTP mode)..."
docker compose -f docker-compose.ssl.yml build --no-cache
docker compose -f docker-compose.ssl.yml up -d

echo "Menunggu nginx siap..."
sleep 5

# Step 3: Ambil sertifikat SSL dari Let's Encrypt
echo "[3/5] Mengambil sertifikat SSL dari Let's Encrypt..."
docker compose -f docker-compose.ssl.yml run --rm certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# Step 4: Switch nginx ke HTTPS config
echo "[4/5] Mengaktifkan HTTPS..."
sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx-https.conf > nginx/nginx-current.conf

# Reload nginx
docker compose -f docker-compose.ssl.yml exec frontend nginx -s reload

# Step 5: Simpan domain ke .env untuk referensi
if ! grep -q "DOMAIN=" .env; then
  echo "DOMAIN=$DOMAIN" >> .env
fi

echo ""
echo "=== HTTPS berhasil dikonfigurasi! ==="
echo "Dashboard: https://$DOMAIN"
echo ""
echo "Sertifikat SSL akan diperbarui otomatis setiap 12 jam."
echo ""
echo "Untuk update kode berikutnya:"
echo "  git pull && docker compose -f docker-compose.ssl.yml build && docker compose -f docker-compose.ssl.yml up -d"
