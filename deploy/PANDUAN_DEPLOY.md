# Panduan Deploy MiniPay Monitor ke VPS Ubuntu

## Persiapan Awal

### Yang dibutuhkan:
- VPS Ubuntu 22.04 / 24.04
- Akses SSH ke VPS
- (Opsional) Domain yang sudah diarahkan ke IP VPS

---

## Langkah 1 — Upload kode ke VPS

Di komputer lokal / Replit, download project sebagai ZIP atau push ke GitHub dulu.

**Cara termudah: pakai Git**

```bash
# Di VPS, clone dari GitHub (atau upload manual)
git clone https://github.com/USERNAME/REPO_KAMU.git
cd REPO_KAMU
```

---

## Langkah 2 — Setup VPS (jalankan sekali saja)

```bash
bash deploy/setup-vps.sh
```

Script ini otomatis:
- Install Node.js 22, pnpm, PM2, Nginx
- Install & setup PostgreSQL
- Buatkan database & user baru
- Setup firewall (port 80, 443, SSH)

---

## Langkah 3 — Buat file konfigurasi

```bash
cp deploy/.env.production.example .env.production
nano .env.production
```

Isi `DATABASE_URL` sesuai database yang dibuat di langkah 2:
```
DATABASE_URL=postgresql://minipay_user:PASSWORD@localhost:5432/minipay_db
```

---

## Langkah 4 — Setup Nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/minipay-monitor
sudo ln -s /etc/nginx/sites-available/minipay-monitor /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Kalau punya domain, edit dulu bagian `server_name` di `deploy/nginx.conf`:
```nginx
server_name domain-kamu.com www.domain-kamu.com;
```

---

## Langkah 5 — Migrasi database

```bash
source .env.production
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push
```

---

## Langkah 6 — Build & Deploy

```bash
bash deploy/deploy.sh
```

Script ini otomatis:
- Build API server
- Build frontend (static files)
- Copy ke Nginx web root
- Jalankan API server via PM2

---

## Langkah 7 — HTTPS gratis (opsional, butuh domain)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-kamu.com
```

---

## Perintah berguna

```bash
# Cek status API server
pm2 status

# Lihat log API
pm2 logs minipay-api

# Restart API
pm2 restart minipay-api

# Cek status Nginx
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

---

## Update / Deploy ulang setelah ada perubahan kode

```bash
git pull
bash deploy/deploy.sh
```

---

## Troubleshooting

**Website tidak bisa diakses:**
- Cek firewall: `sudo ufw status`
- Cek Nginx: `sudo systemctl status nginx`
- Cek error Nginx: `sudo tail -f /var/log/nginx/error.log`

**API error:**
- Cek PM2: `pm2 logs minipay-api`
- Cek DATABASE_URL di `.env.production`

**Database tidak konek:**
- Pastikan PostgreSQL jalan: `sudo systemctl status postgresql`
- Test koneksi: `psql $DATABASE_URL -c "SELECT 1"`
