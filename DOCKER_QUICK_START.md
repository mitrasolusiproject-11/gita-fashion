# 🐳 Gita Fashion PWA - Docker Quick Start

## 🚀 Super Quick Deployment (5 menit)

### 1. Setup Docker di Ubuntu VPS
```bash
# SSH ke VPS
ssh root@your-vps-ip

# Download dan jalankan setup script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout dan login lagi
exit
ssh root@your-vps-ip
```

### 2. Upload dan Deploy
```bash
# Buat directory
mkdir -p /opt/gita-fashion
cd /opt/gita-fashion

# Upload semua file project ke directory ini
# Kemudian:

# Configure environment
cp .env.docker .env
nano .env  # Edit DOMAIN, NEXTAUTH_SECRET, ACME_EMAIL

# Deploy
chmod +x docker-deploy.sh
./docker-deploy.sh
```

### 3. Pilih Reverse Proxy
Script akan menanyakan:
- **1) Traefik** ← Pilih ini (auto SSL)
- 2) Nginx (manual SSL)
- 3) None (port 3000)

### 4. Selesai! 🎉
Akses: `https://your-domain.com`

---

## 📁 File yang Diperlukan untuk Docker

```
gita-fashion/
├── 🐳 Dockerfile                 # Docker image definition
├── 🐳 docker-compose.yml         # Services orchestration
├── 🐳 .env.docker               # Environment template
├── 🐳 docker-deploy.sh          # Deployment script
├── 🐳 setup-docker-ubuntu.sh    # Ubuntu Docker setup
├── 🐳 healthcheck.js            # Container health check
├── 📁 nginx/                    # Nginx configuration
├── 📁 scripts/                  # Backup scripts
├── 📁 src/                      # Application source
├── 📁 public/                   # Static assets + PWA
├── 📁 drizzle/                  # Database migrations
├── 📄 package.json              # Dependencies
├── 📄 next.config.ts            # Next.js config
└── 📄 drizzle.config.ts         # Database config
```

## 🔧 Docker Services

### Core Services
- **gita-fashion**: Main PWA application
- **nginx**: Web server (optional)
- **traefik**: Reverse proxy + auto SSL (optional)

### Additional Services
- **backup**: Automated database backup
- **watchtower**: Auto-updates containers

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Required
DOMAIN=your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
NEXTAUTH_URL=https://your-domain.com
ACME_EMAIL=your-email@example.com

# Optional
BACKUP_RETENTION_DAYS=7
```

### Docker Compose Profiles
```bash
# App only
docker-compose up -d

# With Traefik (auto SSL)
docker-compose --profile traefik up -d

# With Nginx (manual SSL)
docker-compose --profile nginx up -d

# With backup service
docker-compose --profile backup up -d

# With monitoring
docker-compose --profile monitoring up -d
```

## 🔍 Management Commands

### Basic Operations
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f gita-fashion

# Restart app
docker-compose restart gita-fashion

# Stop all
docker-compose down

# Start all
docker-compose up -d
```

### Database Operations
```bash
# Run migrations
docker-compose exec gita-fashion npm run db:migrate

# Seed database
docker-compose exec gita-fashion npm run db:seed

# Access Drizzle Studio
docker-compose exec gita-fashion npm run db:studio
```

### Backup & Restore
```bash
# Manual backup
docker-compose --profile backup run backup

# List backups
docker-compose exec gita-fashion ls -la /app/backups

# Restore database
docker-compose stop gita-fashion
docker cp backup.db gita-fashion-app:/app/data/sqlite.db
docker-compose start gita-fashion
```

## 🔒 SSL Certificate

### Automatic (Traefik)
- SSL otomatis dari Let's Encrypt
- Domain harus pointing ke server
- Port 80/443 harus terbuka

### Manual (Nginx)
```bash
# Get certificate
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy to nginx directory
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
```

## 📊 Monitoring

### Health Checks
```bash
# Application health
curl http://localhost:3000/api/health

# Container health
docker-compose ps
docker stats
```

### Logs
```bash
# Application logs
docker-compose logs -f gita-fashion

# Traefik logs
docker-compose logs -f traefik

# All logs
docker-compose logs -f
```

## 🐛 Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker-compose logs gita-fashion
docker-compose down && docker-compose up -d
```

**SSL not working:**
```bash
# Check domain DNS
nslookup your-domain.com

# Check Traefik logs
docker-compose logs traefik
```

**Database issues:**
```bash
# Check database file
docker-compose exec gita-fashion ls -la /app/data

# Reset database
docker-compose down
docker volume rm gita-fashion_gita-fashion-data
docker-compose up -d
```

**PWA not working:**
```bash
# Check HTTPS
curl -I https://your-domain.com

# Check manifest
curl https://your-domain.com/manifest.json
```

### Clean Up
```bash
# Remove unused containers
docker system prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## 🎯 Production Tips

1. **Use Traefik** for automatic SSL
2. **Enable monitoring** with Watchtower
3. **Setup backup cron job**
4. **Monitor disk space** regularly
5. **Keep Docker updated**
6. **Use specific image tags** in production

## 📈 Scaling

### Horizontal Scaling
```yaml
# In docker-compose.yml
services:
  gita-fashion:
    deploy:
      replicas: 3
```

### Load Balancing
Traefik automatically load balances multiple replicas.

## 🔐 Security

- Containers run as non-root user
- Network isolation between services
- Firewall configured for necessary ports only
- SSL/TLS encryption
- Regular security updates via Watchtower

---

## 🎊 Keuntungan Docker Deployment

✅ **Konsistensi**: Sama di dev dan production  
✅ **Isolasi**: Tidak bentrok dengan aplikasi lain  
✅ **Mudah Scale**: Horizontal scaling dengan mudah  
✅ **Auto SSL**: Dengan Traefik  
✅ **Auto Backup**: Scheduled backup  
✅ **Auto Update**: Dengan Watchtower  
✅ **Monitoring**: Built-in health checks  
✅ **Rollback**: Mudah rollback ke versi sebelumnya  

**Total deployment time: ~5 menit dengan Docker! 🚀**