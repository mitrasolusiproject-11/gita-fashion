# Panduan Deployment Gita Fashion PWA ke Ubuntu VPS Hostinger

## ✨ Fitur PWA yang Tersedia
- 📱 **Installable**: Bisa diinstall seperti aplikasi native
- 🔄 **Offline Support**: Tetap bisa digunakan tanpa internet
- 🚀 **Fast Loading**: Caching untuk performa optimal
- 📲 **Push Notifications**: Notifikasi real-time
- 🎯 **App Shortcuts**: Akses cepat ke fitur utama
- 💾 **Background Sync**: Sinkronisasi data otomatis

## Persiapan Sebelum Deploy

### 1. Persyaratan Ubuntu VPS
- **Node.js**: Versi 18.x atau lebih baru
- **PM2**: Process manager untuk Node.js
- **Nginx**: Web server (reverse proxy)
- **SQLite**: Database (sudah built-in di Node.js)
- **Git**: Untuk clone repository
- **Certbot**: Untuk SSL certificate (PWA memerlukan HTTPS)

### 2. Spesifikasi VPS Minimum
- **RAM**: 1GB (recommended 2GB untuk PWA)
- **Storage**: 10GB (recommended 20GB)
- **CPU**: 1 vCore
- **OS**: Ubuntu 20.04 LTS atau Ubuntu 22.04 LTS

## Langkah 1: Persiapan File untuk Upload

### File yang HARUS diupload:
```
gita-fashion/
├── src/                    # Semua source code
├── public/                 # Static assets
├── drizzle/               # Database migrations
├── package.json           # Dependencies
├── package-lock.json      # Lock file
├── next.config.ts         # Next.js config
├── tailwind.config.ts     # Tailwind config
├── tsconfig.json          # TypeScript config
├── drizzle.config.ts      # Database config
├── .env.production        # Environment variables (buat baru)
└── ecosystem.config.js    # PM2 config (buat baru)
```

### File yang TIDAK perlu diupload:
```
node_modules/              # Akan diinstall di server
.next/                     # Build output (akan dibuat di server)
.env                       # Development env
.env.local                 # Local env
sqlite.db                  # Development database
*.log                      # Log files
.git/                      # Git history (optional)
```

## Langkah 2: Buat File Konfigurasi Production

### 2.1 Environment Variables (.env.production)
```env
# Database Configuration
DATABASE_URL=file:./data/sqlite.db

# Authentication
NEXTAUTH_SECRET=gita-fashion-super-secret-key-production-2024-min-32-characters
NEXTAUTH_URL=https://your-domain.com

# App Configuration
NEXT_PUBLIC_APP_NAME=Gita Fashion
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production

# Security Settings
SECURE_COOKIES=true
TRUST_PROXY=true
```

### 2.2 PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'gita-fashion',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

## Langkah 3: Setup Ubuntu VPS

### 3.1 Koneksi ke VPS
```bash
ssh root@your-vps-ip
```

### 3.2 Update System Ubuntu
```bash
apt update && apt upgrade -y
apt install curl wget git unzip -y
```

### 3.3 Install Node.js 20.x (LTS)
```bash
# Install Node.js 20.x menggunakan NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 3.4 Install PM2 Process Manager
```bash
npm install -g pm2

# Verify PM2 installation
pm2 --version
```

### 3.5 Install Nginx Web Server
```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
systemctl status nginx  # Check if running
```

### 3.6 Install Certbot untuk SSL (PWA memerlukan HTTPS)
```bash
apt install snapd -y
snap install core; snap refresh core
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot
```

### 3.7 Setup UFW Firewall
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

### 3.8 Create Non-Root User (Recommended)
```bash
adduser gita-fashion
usermod -aG sudo gita-fashion
# Optional: Setup SSH key for new user
```

## Langkah 4: Upload dan Setup Aplikasi

### 4.1 Buat Directory Aplikasi
```bash
mkdir -p /var/www/gita-fashion
cd /var/www/gita-fashion
```

### 4.2 Upload Files
**Opsi A: Menggunakan SCP/SFTP**
```bash
# Dari komputer lokal
scp -r gita-fashion/* root@your-vps-ip:/var/www/gita-fashion/
```

**Opsi B: Menggunakan Git (Recommended)**
```bash
# Di VPS
git clone https://github.com/your-username/gita-fashion.git .
```

### 4.3 Setup Environment
```bash
# Copy environment file
cp .env.production.example .env.production
# Edit dengan nano atau vim
nano .env.production
```

### 4.4 Install Dependencies
```bash
npm ci --only=production
```

### 4.5 Build Aplikasi
```bash
npm run build
```

### 4.6 Setup Database
```bash
# Buat directory untuk database
mkdir -p data

# Generate database schema
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 4.7 Setup Permissions
```bash
chown -R www-data:www-data /var/www/gita-fashion
chmod -R 755 /var/www/gita-fashion
```

## Langkah 5: Konfigurasi Nginx

### 5.1 Buat Nginx Config
```bash
nano /etc/nginx/sites-available/gita-fashion
```

### 5.2 Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.3 Enable Site
```bash
ln -s /etc/nginx/sites-available/gita-fashion /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Langkah 6: Start Aplikasi

### 6.1 Start dengan PM2
```bash
cd /var/www/gita-fashion
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6.2 Verify Application
```bash
pm2 status
pm2 logs gita-fashion
```

## Langkah 7: Setup SSL Certificate (WAJIB untuk PWA)

⚠️ **PENTING**: PWA memerlukan HTTPS untuk berfungsi dengan baik!

### 7.1 Pastikan Domain Sudah Pointing ke VPS
```bash
# Test domain resolution
nslookup your-domain.com
ping your-domain.com
```

### 7.2 Get SSL Certificate dengan Certbot
```bash
# Automatic SSL setup dengan Nginx
certbot --nginx -d your-domain.com -d www.your-domain.com

# Atau manual jika ada masalah
certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### 7.3 Test SSL Certificate
```bash
# Test auto-renewal
certbot renew --dry-run

# Check certificate status
certbot certificates
```

### 7.4 Setup Auto-Renewal
```bash
# Add to crontab
crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Langkah 8: Monitoring dan Maintenance

### 8.1 Setup Log Rotation
```bash
nano /etc/logrotate.d/gita-fashion
```

```
/var/www/gita-fashion/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload gita-fashion
    endscript
}
```

### 8.2 Setup Backup Script
```bash
nano /root/backup-gita-fashion.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
APP_DIR="/var/www/gita-fashion"

mkdir -p $BACKUP_DIR

# Backup database
cp $APP_DIR/data/sqlite.db $BACKUP_DIR/sqlite_$DATE.db

# Backup application (optional)
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
chmod +x /root/backup-gita-fashion.sh
```

### 8.3 Setup Cron Job
```bash
crontab -e
```

```
# Backup daily at 2 AM
0 2 * * * /root/backup-gita-fashion.sh

# Restart PM2 weekly (optional)
0 3 * * 0 pm2 restart gita-fashion
```

## Troubleshooting

### Common Issues:

1. **Port 3000 already in use**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Permission denied**
   ```bash
   chown -R www-data:www-data /var/www/gita-fashion
   ```

3. **Database locked**
   ```bash
   pm2 stop gita-fashion
   pm2 start gita-fashion
   ```

4. **Out of memory**
   ```bash
   # Add swap space
   fallocate -l 1G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   ```

## Useful Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs gita-fashion

# Restart application
pm2 restart gita-fashion

# Check Nginx status
systemctl status nginx

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Check memory usage
free -h
```

## Security Checklist

- [ ] Change default SSH port
- [ ] Disable root login
- [ ] Setup fail2ban
- [ ] Regular security updates
- [ ] Strong passwords
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Regular backups
- [ ] Monitor logs

## Performance Optimization

1. **Enable Gzip in Nginx**
2. **Setup Redis for caching (optional)**
3. **Optimize database queries**
4. **Monitor resource usage**
5. **Setup CDN for static assets (optional)**

---

**Selamat! Aplikasi Gita Fashion sudah berhasil di-deploy ke VPS Hostinger.**

Akses aplikasi di: `https://your-domain.com`