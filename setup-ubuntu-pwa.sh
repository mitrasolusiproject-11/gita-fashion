#!/bin/bash

# Gita Fashion PWA Setup Script for Ubuntu VPS
# This script prepares Ubuntu VPS for PWA deployment

echo "🚀 Setting up Ubuntu VPS for Gita Fashion PWA..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    print_status "Usage: sudo ./setup-ubuntu-pwa.sh"
    exit 1
fi

# Get Ubuntu version
ubuntu_version=$(lsb_release -rs)
print_status "Ubuntu version: $ubuntu_version"

# Step 1: Update system
print_header "1. Updating Ubuntu system..."
apt update && apt upgrade -y
apt install curl wget git unzip software-properties-common -y

# Step 2: Install Node.js 20.x
print_header "2. Installing Node.js 20.x LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js installed: $node_version"
print_status "NPM installed: $npm_version"

# Step 3: Install PM2
print_header "3. Installing PM2 Process Manager..."
npm install -g pm2
pm2_version=$(pm2 --version)
print_status "PM2 installed: $pm2_version"

# Step 4: Install Nginx
print_header "4. Installing Nginx..."
apt install nginx -y
systemctl start nginx
systemctl enable nginx

# Check Nginx status
if systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx failed to start"
fi

# Step 5: Install Certbot for SSL
print_header "5. Installing Certbot for SSL certificates..."
apt install snapd -y
snap install core
snap refresh core
snap install --classic certbot

# Create symlink
ln -sf /snap/bin/certbot /usr/bin/certbot

print_status "✅ Certbot installed"

# Step 6: Setup Firewall
print_header "6. Configuring UFW Firewall..."
ufw --force reset
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

print_status "✅ Firewall configured"
ufw status

# Step 7: Create application directory
print_header "7. Creating application directory..."
mkdir -p /var/www/gita-fashion
chown -R www-data:www-data /var/www/gita-fashion
chmod -R 755 /var/www/gita-fashion

print_status "✅ Application directory created: /var/www/gita-fashion"

# Step 8: Setup log directories
print_header "8. Setting up log directories..."
mkdir -p /var/log/gita-fashion
chown -R www-data:www-data /var/log/gita-fashion

# Step 9: Install additional tools
print_header "9. Installing additional tools..."
apt install htop tree ncdu fail2ban -y

# Configure fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Step 10: Setup swap (if needed)
print_header "10. Checking memory and swap..."
total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
print_status "Total memory: ${total_mem}MB"

if [ "$total_mem" -lt 2048 ]; then
    print_warning "Low memory detected. Setting up swap file..."
    
    # Create 1GB swap file
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Make swap permanent
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    
    print_status "✅ 1GB swap file created"
else
    print_status "✅ Sufficient memory available"
fi

# Step 11: Optimize system for PWA
print_header "11. Optimizing system for PWA..."

# Increase file limits
echo "fs.file-max = 65536" >> /etc/sysctl.conf
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Apply changes
sysctl -p

print_status "✅ System optimized for PWA"

# Step 12: Create backup directory
print_header "12. Setting up backup directory..."
mkdir -p /root/backups/gita-fashion
chmod 700 /root/backups

print_status "✅ Backup directory created"

# Final summary
print_header "🎉 Ubuntu VPS Setup Complete!"
print_status ""
print_status "✅ System updated"
print_status "✅ Node.js $(node --version) installed"
print_status "✅ PM2 $(pm2 --version) installed"
print_status "✅ Nginx installed and running"
print_status "✅ Certbot installed for SSL"
print_status "✅ Firewall configured"
print_status "✅ Application directory ready"
print_status "✅ System optimized for PWA"
print_status ""
print_status "📋 Next steps:"
print_status "  1. Upload your Gita Fashion files to /var/www/gita-fashion/"
print_status "  2. Edit .env.production with your domain"
print_status "  3. Edit nginx.conf with your domain"
print_status "  4. Run: cd /var/www/gita-fashion && sudo ./deploy.sh"
print_status "  5. Setup SSL: sudo certbot --nginx -d your-domain.com"
print_status ""
print_status "🔧 Useful commands:"
print_status "  systemctl status nginx    - Check Nginx status"
print_status "  pm2 status               - Check PM2 processes"
print_status "  ufw status               - Check firewall status"
print_status "  free -h                  - Check memory usage"
print_status "  df -h                    - Check disk usage"
print_status ""
print_warning "⚠️  Remember to:"
print_status "  - Point your domain to this server IP: $(curl -s ifconfig.me)"
print_status "  - Setup SSL certificate for PWA functionality"
print_status "  - Test PWA features after deployment"

print_status ""
print_status "🌐 Server IP: $(curl -s ifconfig.me)"
print_status "📧 Ready for Gita Fashion PWA deployment!"