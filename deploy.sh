#!/bin/bash

# Gita Fashion PWA Deployment Script for Ubuntu VPS
# Run this script on your Ubuntu VPS after uploading files

echo "🚀 Starting Gita Fashion PWA deployment on Ubuntu..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    print_status "Usage: sudo ./deploy.sh"
    exit 1
fi

# Check Ubuntu version
print_status "Checking Ubuntu version..."
ubuntu_version=$(lsb_release -rs)
print_status "Ubuntu version: $ubuntu_version"

# Set application directory
APP_DIR="/var/www/gita-fashion"
cd $APP_DIR

print_status "Current directory: $(pwd)"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p data
mkdir -p logs
mkdir -p backups

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production

# Build application
print_status "Building application..."
npm run build

# Setup database
print_status "Setting up database..."
npm run db:generate
npm run db:migrate

# Seed database (optional - comment out if not needed)
print_warning "Seeding database with initial data..."
npm run db:seed

# Set permissions
print_status "Setting permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Start/Restart PM2
print_status "Starting application with PM2..."
pm2 stop gita-fashion 2>/dev/null || true
pm2 delete gita-fashion 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup
print_status "Setting up PM2 startup..."
pm2 startup systemd -u www-data --hp /var/www

# Test Nginx configuration
print_status "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    print_status "Reloading Nginx..."
    systemctl reload nginx
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# Check application status
print_status "Checking application status..."
sleep 5
pm2 status

# Test application
print_status "Testing application..."
curl -f http://localhost:3000 > /dev/null

if [ $? -eq 0 ]; then
    print_status "✅ Application is running successfully!"
    print_status "🌐 Access your application at: http://$(curl -s ifconfig.me)"
else
    print_error "❌ Application test failed!"
    print_status "Check logs with: pm2 logs gita-fashion"
    exit 1
fi

print_status "🎉 PWA Deployment completed successfully!"
print_status ""
print_status "📱 PWA Features Available:"
print_status "  ✅ Offline Support"
print_status "  ✅ Install Prompt"
print_status "  ✅ Push Notifications"
print_status "  ✅ Background Sync"
print_status ""
print_status "🔧 Useful commands:"
print_status "  pm2 status              - Check application status"
print_status "  pm2 logs gita-fashion   - View application logs"
print_status "  pm2 restart gita-fashion - Restart application"
print_status "  systemctl status nginx  - Check Nginx status"
print_status "  certbot certificates    - Check SSL certificates"
print_status ""
print_status "🌐 Access your PWA at:"
print_status "  https://$(curl -s ifconfig.me) (IP)"
print_status "  https://your-domain.com (Domain - setup SSL first)"
print_status ""
print_status "⚠️  Next steps:"
print_status "  1. Setup SSL certificate: certbot --nginx -d your-domain.com"
print_status "  2. Test PWA install prompt on mobile/desktop"
print_status "  3. Configure push notifications if needed"