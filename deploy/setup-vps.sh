#!/bin/bash
set -e

echo "============================================"
echo "  Setup VPS Ubuntu untuk MiniPay Monitor"
echo "============================================"

# Update system
echo "[1/6] Update sistem..."
sudo apt-get update -y && sudo apt-get upgrade -y

# Install dependencies
echo "[2/6] Install dependencies..."
sudo apt-get install -y curl git nginx postgresql postgresql-contrib ufw

# Install Node.js 22 (LTS)
echo "[3/6] Install Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
echo "[4/6] Install pnpm..."
npm install -g pnpm pm2

# Setup PostgreSQL
echo "[5/6] Setup PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Buat database dan user
echo ""
echo "=== Setup Database ==="
echo "Masukkan nama database (contoh: minipay_db):"
read DB_NAME
echo "Masukkan username database (contoh: minipay_user):"
read DB_USER
echo "Masukkan password database:"
read -s DB_PASS

sudo -u postgres psql <<SQL
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL

echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME" >> .env.production
echo "Database berhasil dibuat!"

# Setup firewall
echo "[6/6] Setup firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo ""
echo "============================================"
echo "  Setup selesai!"
echo "  Lanjutkan dengan: bash deploy/deploy.sh"
echo "============================================"
