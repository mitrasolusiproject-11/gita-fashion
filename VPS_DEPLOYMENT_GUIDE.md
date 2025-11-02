# 🚀 Panduan Deployment Gita Fashion ke VPS

## 📋 **Daftar Isi**
1. [Persiapan VPS](#persiapan-vps)
2. [Instalasi Docker](#instalasi-docker)
3. [Setup Domain & SSL](#setup-domain--ssl)
4. [Deployment dengan Docker](#deployment-dengan-docker)
5. [Konfigurasi Nginx](#konfigurasi-nginx)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## 🖥️ **Persiapan VPS**

### **Spesifikasi Minimum VPS**
- **RAM**: 2GB (recommended 4GB)
- **Storage**: 20GB SSD
- **CPU**: 2 vCPU
- **OS**: Ubuntu 20.04 LTS atau 22.04 LTS
- **Bandwidth**: Unlimited atau min 1TB/bulan

### **Provider VPS Recommended**
1. **Hostinger VPS** - €3.99/bulan
2. **DigitalOcean Droplet** - $6/bulan
3. **Vultr Cloud Compute** - $6/bulan
4. **Linode Nanode** - $5/bulan
5. **AWS Lightsail** - $5/bulan

### **1. Koneksi ke VPS**
```bash
# Koneksi via SSH
ssh root@your-server-ip

# Atau dengan user non-root
ssh username@your-server-ip
```

### **2. Update System**
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### **3. Create Non-Root User (Recommended)**
```bash
# Create new user
sudo adduser gitafashion

# Add to sudo group
sudo usermod -aG sudo gitafashion

# Switch to new user
su - gitafashion
```

---

## 🐳 **Instalasi Docker**

### **1. Install Docker**
```bash
# Remove old versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker

# Test Docker installation
docker --version
docker run hello-world
```

### **2. Install Docker Compose (if not included)**
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Test installation
docker-compose --version
```

---

## 🌐 **Setup Domain & SSL**

### **1. Domain Configuration**
```bash
# Point your domain to VPS IP
# A Record: @ -> your-server-ip
# A Record: www -> your-server-ip
# CNAME Record: api -> your-domain.com
```

### **2. Install Nginx**
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### **3. Install Certbot for SSL**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 📦 **Deployment dengan Docker**

### **1. Clone Repository**
```bash
# Clone your repository
git clone https://github.com/yourusername/gita-fashion.git
cd gita-fashion

# Or upload files via SCP/SFTP
```

### **2. Create Production Environment**
```bash
# Create .env.production file
nano .env.production
```

**Isi .env.production:**
```env
# Database
DATABASE_URL=file:./data/sqlite.db

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=https://your-domain.com

# App Configuration
NEXT_PUBLIC_APP_NAME=Gita Fashion
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production

# Security
SECURE_COOKIES=true
TRUST_PROXY=true
```

### **3. Create Docker Files**

**Dockerfile:**
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**docker-compose.production.yml:**
```yaml
version: '3.8'

services:
  gita-fashion:
    build: .
    container_name: gita-fashion-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - ./data:/app/data
      - ./public/uploads:/app/public/uploads
    networks:
      - gita-fashion-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: gita-fashion-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - gita-fashion
    networks:
      - gita-fashion-network

networks:
  gita-fashion-network:
    driver: bridge

volumes:
  gita-fashion-data:
```

### **4. Update next.config.ts for Production**
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### **5. Build and Deploy**
```bash
# Create necessary directories
mkdir -p data ssl

# Build and start containers
docker-compose -f docker-compose.production.yml up -d --build

# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Check container status
docker ps
```

---

## ⚙️ **Konfigurasi Nginx**

### **nginx.conf:**
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream
    upstream gita-fashion-app {
        server gita-fashion:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Client max body size (for file uploads)
        client_max_body_size 10M;

        # Rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://gita-fashion-app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://gita-fashion-app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Main application
        location / {
            proxy_pass http://gita-fashion-app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support (if needed)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Static files caching
        location /_next/static/ {
            proxy_pass http://gita-fashion-app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## 📊 **Monitoring & Maintenance**

### **1. Setup Monitoring Scripts**

**health-check.sh:**
```bash
#!/bin/bash

# Health check script
DOMAIN="https://your-domain.com"
LOG_FILE="/var/log/gita-fashion-health.log"

# Check if application is responding
if curl -f -s "$DOMAIN/api/health" > /dev/null; then
    echo "$(date): Application is healthy" >> $LOG_FILE
else
    echo "$(date): Application is down! Restarting..." >> $LOG_FILE
    cd /home/gitafashion/gita-fashion
    docker-compose -f docker-compose.production.yml restart
fi
```

**backup.sh:**
```bash
#!/bin/bash

# Backup script
BACKUP_DIR="/home/gitafashion/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/gitafashion/gita-fashion"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $APP_DIR/data/sqlite.db $BACKUP_DIR/sqlite_$DATE.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR/public uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "$(date): Backup completed - sqlite_$DATE.db" >> /var/log/gita-fashion-backup.log
```

### **2. Setup Cron Jobs**
```bash
# Edit crontab
crontab -e

# Add these lines:
# Health check every 5 minutes
*/5 * * * * /home/gitafashion/scripts/health-check.sh

# Daily backup at 2 AM
0 2 * * * /home/gitafashion/scripts/backup.sh

# SSL certificate renewal check (twice daily)
0 12,0 * * * /usr/bin/certbot renew --quiet
```

### **3. Log Management**
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/gita-fashion

# Add content:
/var/log/gita-fashion-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 gitafashion gitafashion
}
```

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Container Won't Start**
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs gita-fashion

# Check container status
docker ps -a

# Restart specific service
docker-compose -f docker-compose.production.yml restart gita-fashion
```

#### **2. Database Issues**
```bash
# Check database file permissions
ls -la data/sqlite.db

# Fix permissions if needed
sudo chown 1001:1001 data/sqlite.db

# Backup and restore if corrupted
cp data/sqlite.db data/sqlite.db.backup
# Restore from backup
```

#### **3. SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Test SSL configuration
openssl s_client -connect your-domain.com:443
```

#### **4. Performance Issues**
```bash
# Check system resources
htop
df -h
free -m

# Check Docker stats
docker stats

# Optimize if needed
docker system prune -a
```

### **Useful Commands**

```bash
# View application logs
docker-compose -f docker-compose.production.yml logs -f gita-fashion

# Update application
git pull origin main
docker-compose -f docker-compose.production.yml up -d --build

# Backup database
docker exec gita-fashion-app cp /app/data/sqlite.db /tmp/
docker cp gita-fashion-app:/tmp/sqlite.db ./backup-$(date +%Y%m%d).db

# Restore database
docker cp ./backup.db gita-fashion-app:/app/data/sqlite.db
docker-compose -f docker-compose.production.yml restart gita-fashion

# Check disk usage
du -sh /home/gitafashion/gita-fashion/
docker system df
```

---

## 🚀 **Go Live Checklist**

### **Pre-Launch**
- [ ] VPS setup and secured
- [ ] Domain pointed to VPS IP
- [ ] SSL certificate installed
- [ ] Docker containers running
- [ ] Database initialized with admin user
- [ ] Backup system configured
- [ ] Monitoring setup
- [ ] Performance testing completed

### **Post-Launch**
- [ ] Test all major features
- [ ] Verify SSL certificate
- [ ] Check application logs
- [ ] Test backup/restore process
- [ ] Monitor system resources
- [ ] Setup alerts for downtime
- [ ] Document admin credentials securely

### **Security Checklist**
- [ ] Change default passwords
- [ ] Setup firewall (UFW)
- [ ] Disable root SSH login
- [ ] Setup fail2ban
- [ ] Regular security updates
- [ ] Monitor access logs

---

## 📞 **Support & Maintenance**

### **Regular Maintenance Tasks**
1. **Weekly**: Check logs and system resources
2. **Monthly**: Update system packages and Docker images
3. **Quarterly**: Review and update SSL certificates
4. **Annually**: Full security audit and backup testing

### **Emergency Contacts**
- **VPS Provider Support**: [Provider's support contact]
- **Domain Registrar**: [Registrar's support contact]
- **Developer**: [Your contact information]

---

**🎉 Selamat! Aplikasi Gita Fashion sekarang live di production!**

*Pastikan untuk melakukan testing menyeluruh setelah deployment dan monitor aplikasi secara berkala untuk memastikan performa optimal.*