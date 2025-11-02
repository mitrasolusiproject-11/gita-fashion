# Checklist Deployment Gita Fashion PWA ke Ubuntu VPS Hostinger

## 📱 PWA Features
- ✅ **Installable**: Bisa diinstall seperti aplikasi native
- ✅ **Offline Support**: Tetap bisa digunakan tanpa internet  
- ✅ **Fast Loading**: Caching untuk performa optimal
- ✅ **Push Notifications**: Notifikasi real-time
- ✅ **App Shortcuts**: Akses cepat ke POS, Products, Transactions
- ✅ **Background Sync**: Sinkronisasi data otomatis

## ✅ Persiapan Lokal

### File yang harus disiapkan:
- [ ] `.env.production` - Environment variables production
- [ ] `ecosystem.config.js` - PM2 configuration
- [ ] `nginx.conf` - Nginx configuration
- [ ] `deploy.sh` - Deployment script
- [ ] `backup.sh` - Backup script

### File yang harus diupload ke VPS:
```
📁 gita-fashion/
├── 📁 src/                    ✅ Source code
├── 📁 public/                 ✅ Static assets
├── 📁 drizzle/               ✅ Database migrations
├── 📄 package.json           ✅ Dependencies
├── 📄 package-lock.json      ✅ Lock file
├── 📄 next.config.ts         ✅ Next.js config
├── 📄 tailwind.config.ts     ✅ Tailwind config
├── 📄 tsconfig.json          ✅ TypeScript config
├── 📄 drizzle.config.ts      ✅ Database config
├── 📄 .env.production        ✅ Production env
├── 📄 ecosystem.config.js    ✅ PM2 config
├── 📄 nginx.conf             ✅ Nginx config
├── 📄 deploy.sh              ✅ Deploy script
├── 📄 backup.sh              ✅ Backup script
└── 📄 setup-ubuntu-pwa.sh    ✅ Ubuntu setup script
```

### File yang TIDAK diupload:
- [ ] `node_modules/` - Akan diinstall di server
- [ ] `.next/` - Build output
- [ ] `.env` - Development environment
- [ ] `sqlite.db` - Development database
- [ ] `*.log` - Log files

## ✅ Setup Ubuntu VPS

### Opsi A: Setup Otomatis (Recommended)
- [ ] SSH ke VPS: `ssh root@your-vps-ip`
- [ ] Upload `setup-ubuntu-pwa.sh` ke VPS
- [ ] Run setup script: `chmod +x setup-ubuntu-pwa.sh && sudo ./setup-ubuntu-pwa.sh`
- [ ] Tunggu hingga selesai (5-10 menit)

### Opsi B: Setup Manual
- [ ] SSH ke VPS: `ssh root@your-vps-ip`
- [ ] Update system: `apt update && apt upgrade -y`
- [ ] Install Node.js 20.x: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && apt-get install -y nodejs`
- [ ] Install PM2: `npm install -g pm2`
- [ ] Install Nginx: `apt install nginx -y && systemctl start nginx && systemctl enable nginx`
- [ ] Install Certbot: `apt install snapd && snap install --classic certbot`
- [ ] Setup firewall: `ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable`
- [ ] Create directory: `mkdir -p /var/www/gita-fashion`

## ✅ Upload dan Konfigurasi

### 1. Upload Files
**Pilih salah satu metode:**

**Metode A: SCP/SFTP (Recommended)**
- [ ] Upload via FileZilla/WinSCP ke `/var/www/gita-fashion/`
- [ ] Pastikan semua file terupload dengan benar

**Metode B: Git**
- [ ] Clone repository: `git clone https://github.com/your-repo/gita-fashion.git .`
- [ ] Copy file konfigurasi production

### 2. Konfigurasi Environment
- [ ] Edit `.env.production`:
  - [ ] Update `NEXTAUTH_URL` dengan domain Anda
  - [ ] Update `NEXTAUTH_SECRET` dengan secret yang kuat
  - [ ] Verifikasi `DATABASE_URL`

### 3. Konfigurasi Nginx
- [ ] Copy nginx config: `cp nginx.conf /etc/nginx/sites-available/gita-fashion`
- [ ] Edit domain di config: `nano /etc/nginx/sites-available/gita-fashion`
- [ ] Enable site: `ln -s /etc/nginx/sites-available/gita-fashion /etc/nginx/sites-enabled/`
- [ ] Test config: `nginx -t`
- [ ] Reload Nginx: `systemctl reload nginx`

## ✅ Deployment

### 1. Run Deployment Script
- [ ] Make script executable: `chmod +x deploy.sh`
- [ ] Run deployment: `./deploy.sh`

### 2. Manual Steps (jika script gagal)
- [ ] Install dependencies: `npm ci --only=production`
- [ ] Build application: `npm run build`
- [ ] Setup database: `npm run db:generate && npm run db:migrate`
- [ ] Seed database: `npm run db:seed`
- [ ] Set permissions: `chown -R www-data:www-data /var/www/gita-fashion`
- [ ] Start PM2: `pm2 start ecosystem.config.js`
- [ ] Save PM2: `pm2 save`
- [ ] Setup startup: `pm2 startup`

## ✅ Verifikasi

### 1. Check Services
- [ ] PM2 status: `pm2 status`
- [ ] Nginx status: `systemctl status nginx`
- [ ] Application logs: `pm2 logs gita-fashion`

### 2. Test Application
- [ ] Local test: `curl http://localhost:3000`
- [ ] External test: `curl http://your-domain.com`
- [ ] Browser test: Buka `http://your-domain.com`

### 3. Test PWA Features
- [ ] Login page accessible via HTTPS
- [ ] Dashboard accessible
- [ ] Database operations working
- [ ] Barcode generation working
- [ ] Print functionality working
- [ ] **PWA Install prompt** appears (mobile/desktop)
- [ ] **Offline functionality** works
- [ ] **Service Worker** registered: Check DevTools > Application > Service Workers
- [ ] **Manifest** loaded: Check DevTools > Application > Manifest
- [ ] **App shortcuts** working (after install)
- [ ] **Push notifications** ready (if configured)

## ✅ SSL Certificate (WAJIB untuk PWA)

⚠️ **PENTING**: PWA memerlukan HTTPS untuk berfungsi penuh!

### 1. Setup Domain
- [ ] Point domain A record ke IP VPS
- [ ] Test domain: `nslookup your-domain.com`
- [ ] Wait for DNS propagation (5-30 menit)

### 2. Install SSL Certificate
- [ ] Get certificate: `certbot --nginx -d your-domain.com -d www.your-domain.com`
- [ ] Test certificate: `curl -I https://your-domain.com`
- [ ] Test auto-renewal: `certbot renew --dry-run`

### 3. Verify HTTPS
- [ ] Access: `https://your-domain.com`
- [ ] Check SSL grade: https://www.ssllabs.com/ssltest/
- [ ] Verify PWA manifest: `https://your-domain.com/manifest.json`

### 4. Additional Security
- [ ] Install fail2ban: `apt install fail2ban`
- [ ] Change SSH port (optional)
- [ ] Disable root login (optional)

## ✅ Backup & Monitoring

### 1. Setup Backup
- [ ] Copy backup script: `cp backup.sh /root/backup-gita-fashion.sh`
- [ ] Make executable: `chmod +x /root/backup-gita-fashion.sh`
- [ ] Test backup: `/root/backup-gita-fashion.sh`

### 2. Setup Cron Jobs
- [ ] Edit crontab: `crontab -e`
- [ ] Add backup job: `0 2 * * * /root/backup-gita-fashion.sh`
- [ ] Add restart job: `0 3 * * 0 pm2 restart gita-fashion`

### 3. Log Rotation
- [ ] Setup logrotate for application logs
- [ ] Monitor disk space: `df -h`
- [ ] Monitor memory: `free -h`

## ✅ Final Checks

### 1. Performance
- [ ] Application response time < 2 seconds
- [ ] Memory usage < 80%
- [ ] CPU usage normal
- [ ] Disk space sufficient

### 2. Functionality
- [ ] All pages load correctly
- [ ] Authentication working
- [ ] Database operations working
- [ ] Print functionality working
- [ ] Barcode generation working

### 3. Documentation
- [ ] Update DNS records (if needed)
- [ ] Document server credentials
- [ ] Document backup procedures
- [ ] Share access details with team

## 🚨 Troubleshooting

### Common Issues:
1. **Port 3000 in use**: `lsof -ti:3000 | xargs kill -9`
2. **Permission denied**: `chown -R www-data:www-data /var/www/gita-fashion`
3. **Database locked**: `pm2 restart gita-fashion`
4. **Out of memory**: Add swap space
5. **Nginx config error**: Check syntax with `nginx -t`

### Useful Commands:
```bash
# Check application
pm2 status
pm2 logs gita-fashion
pm2 restart gita-fashion

# Check Nginx
systemctl status nginx
nginx -t
tail -f /var/log/nginx/error.log

# Check system
df -h          # Disk space
free -h        # Memory
top            # CPU usage
netstat -tlnp  # Open ports
```

## 📞 Support

Jika mengalami masalah:
1. Check logs: `pm2 logs gita-fashion`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check system resources: `htop`
4. Restart services jika diperlukan

---

**🎉 Selamat! Aplikasi Gita Fashion berhasil di-deploy ke VPS Hostinger!**