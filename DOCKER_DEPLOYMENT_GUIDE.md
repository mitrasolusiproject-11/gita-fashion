# 🐳 Gita Fashion PWA - Docker Deployment Guide

## ✨ Mengapa Docker?

- **🔄 Konsistensi**: Aplikasi berjalan sama di development dan production
- **🚀 Mudah Deploy**: Satu command untuk deploy seluruh stack
- **📦 Isolated**: Tidak bentrok dengan aplikasi lain di server
- **🔧 Easy Scaling**: Mudah scale horizontal
- **💾 Persistent Data**: Database dan file tetap aman
- **🔒 Security**: Container isolation untuk keamanan
- **📊 Monitoring**: Built-in health checks dan logging

## 🏗️ Arsitektur Docker

```
┌─────────────────────────────────────────┐
│                 Docker Host             │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Traefik   │  │      Nginx      │   │
│  │ (SSL + LB)  │  │  (Alternative)  │   │
│  └─────────────┘  └─────────────────┘   │
│         │                   │           │
│  ┌─────────────────────────────────┐     │
│  │      Gita Fashion PWA App       │     │
│  │         (Next.js)               │     │
│  └─────────────────────────────────┘     │
│         │                               │
│  ┌─────────────────────────────────┐     │
│  │        Docker Volumes           │     │
│  │  • Database (SQLite)            │     │
│  │  • Logs                         │     │
│  │  • Backups                      │     │
│  │  • SSL Certificates             │     │
│  └─────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

## 📋 Prerequisites

### 1. Server Requirements
- **OS**: Ubuntu 20.04/22.04 LTS (recommended)
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 20GB minimum
- **CPU**: 1 vCore minimum

### 2. Install Docker & Docker Compose
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🚀 Quick Deployment

### 1. Upload Files
Upload semua file project ke server, misalnya ke `/opt/gita-fashion/`:

```bash
# Create directory
sudo mkdir -p /opt/gita-fashion
cd /opt/gita-fashion

# Upload files via scp, git, atau file manager
# Pastikan semua file Docker ada (Dockerfile, docker-compose.yml, dll)
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.docker .env

# Edit environment variables
nano .env
```

**Edit .env file:**
```env
DOMAIN=your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
ACME_EMAIL=your-email@example.com
```

### 3. Deploy with Script
```bash
# Make script executable
chmod +x docker-deploy.sh

# Run deployment
./docker-deploy.sh
```

### 4. Choose Reverse Proxy
Script akan menanyakan pilihan:
1. **Traefik** (recommended) - Auto SSL dengan Let's Encrypt
2. **Nginx** - Manual SSL setup
3. **None** - Direct access port 3000

## 🔧 Manual Deployment Steps

### 1. Build Image
```bash
docker-compose build --no-cache
```

### 2. Setup Database
```bash
# Run migrations
docker-compose run --rm gita-fashion npm run db:generate
docker-compose run --rm gita-fashion npm run db:migrate

# Seed database (optional)
docker-compose run --rm gita-fashion npm run db:seed
```

### 3. Start Services

**With Traefik (Auto SSL):**
```bash
docker-compose --profile traefik up -d
```

**With Nginx (Manual SSL):**
```bash
docker-compose --profile nginx up -d
```

**App Only:**
```bash
docker-compose up -d gita-fashion
```

## 🔒 SSL Certificate Setup

### Option 1: Traefik (Automatic)
Traefik akan otomatis mendapatkan SSL certificate dari Let's Encrypt.

**Requirements:**
- Domain sudah pointing ke server IP
- Port 80 dan 443 terbuka
- Email valid untuk ACME

### Option 2: Nginx (Manual)
```bash
# Create SSL directory
mkdir -p ssl

# Get certificate with Certbot
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl/

# Restart Nginx
docker-compose restart nginx
```

## 📊 Monitoring & Management

### Container Status
```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f gita-fashion
docker-compose logs -f traefik
docker-compose logs -f nginx

# Check resource usage
docker stats
```

### Application Health
```bash
# Health check endpoint
curl http://localhost:3000/api/health

# Or via domain
curl https://your-domain.com/health
```

### Database Management
```bash
# Access database container
docker-compose exec gita-fashion sh

# Inside container, you can run:
npm run db:studio  # Drizzle Studio
npm run db:migrate # Run migrations
```

## 💾 Backup & Restore

### Automatic Backup
```bash
# Run backup service
docker-compose --profile backup run backup

# Schedule with cron
crontab -e
# Add: 0 2 * * * cd /opt/gita-fashion && docker-compose --profile backup run backup
```

### Manual Backup
```bash
# Backup database
docker-compose exec gita-fashion cp /app/data/sqlite.db /app/backups/manual-backup-$(date +%Y%m%d).db

# Copy backup to host
docker cp gita-fashion-app:/app/backups ./backups
```

### Restore Database
```bash
# Stop application
docker-compose stop gita-fashion

# Restore database
docker-compose run --rm -v $(pwd)/backups:/backups gita-fashion cp /backups/your-backup.db /app/data/sqlite.db

# Start application
docker-compose start gita-fashion
```

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Auto-Updates with Watchtower
```bash
# Enable Watchtower
docker-compose --profile monitoring up -d

# Watchtower will automatically update containers daily
```

### Clean Up
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

## 🐛 Troubleshooting

### Common Issues

**1. Container won't start**
```bash
# Check logs
docker-compose logs gita-fashion

# Check if port is in use
sudo netstat -tlnp | grep :3000
```

**2. SSL Certificate issues**
```bash
# Check Traefik logs
docker-compose logs traefik

# Verify domain DNS
nslookup your-domain.com
```

**3. Database connection issues**
```bash
# Check volume mounts
docker-compose exec gita-fashion ls -la /app/data

# Check database file permissions
docker-compose exec gita-fashion ls -la /app/data/sqlite.db
```

**4. PWA not working**
```bash
# Check HTTPS
curl -I https://your-domain.com

# Check manifest
curl https://your-domain.com/manifest.json

# Check service worker
curl https://your-domain.com/sw.js
```

### Useful Commands
```bash
# Restart specific service
docker-compose restart gita-fashion

# View real-time logs
docker-compose logs -f --tail=100 gita-fashion

# Execute command in container
docker-compose exec gita-fashion sh

# Check container resource usage
docker stats gita-fashion-app

# Inspect container
docker inspect gita-fashion-app
```

## 🔧 Configuration Files

### Docker Compose Profiles
- `default`: Gita Fashion app only
- `traefik`: App + Traefik reverse proxy
- `nginx`: App + Nginx reverse proxy
- `backup`: Backup service
- `monitoring`: Watchtower auto-updates

### Environment Variables
```env
# Required
DOMAIN=your-domain.com
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# Optional
ACME_EMAIL=your-email@example.com
BACKUP_RETENTION_DAYS=7
WATCHTOWER_NOTIFICATIONS=slack
```

## 🎯 Production Checklist

- [ ] Domain pointing to server IP
- [ ] SSL certificate configured
- [ ] Environment variables set
- [ ] Database migrated and seeded
- [ ] Health checks passing
- [ ] PWA features working
- [ ] Backup strategy configured
- [ ] Monitoring enabled
- [ ] Firewall configured
- [ ] Auto-updates enabled

## 🌐 Access Points

- **Application**: `https://your-domain.com`
- **Traefik Dashboard**: `http://server-ip:8080`
- **Health Check**: `https://your-domain.com/api/health`
- **PWA Manifest**: `https://your-domain.com/manifest.json`

---

**🎉 Selamat! Gita Fashion PWA berhasil di-deploy dengan Docker!**

**Total deployment time: ~10 menit dengan script otomatis**