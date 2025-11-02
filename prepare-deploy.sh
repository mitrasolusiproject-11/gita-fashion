#!/bin/bash

# Script untuk mempersiapkan file deployment
# Jalankan script ini di komputer lokal sebelum upload ke VPS

echo "🚀 Mempersiapkan file untuk deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json tidak ditemukan. Pastikan Anda berada di directory project."
    exit 1
fi

# Create deployment directory
DEPLOY_DIR="gita-fashion-deploy"
print_status "Membuat directory deployment: $DEPLOY_DIR"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy necessary files and directories
print_status "Menyalin file yang diperlukan..."

# Source code
cp -r src $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp -r drizzle $DEPLOY_DIR/

# Configuration files
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp next.config.ts $DEPLOY_DIR/
cp tailwind.config.ts $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp drizzle.config.ts $DEPLOY_DIR/

# Deployment files
cp .env.production $DEPLOY_DIR/
cp ecosystem.config.js $DEPLOY_DIR/
cp nginx.conf $DEPLOY_DIR/
cp deploy.sh $DEPLOY_DIR/
cp backup.sh $DEPLOY_DIR/

# Documentation
cp DEPLOYMENT_GUIDE.md $DEPLOY_DIR/
cp DEPLOYMENT_CHECKLIST.md $DEPLOY_DIR/

# Make scripts executable
chmod +x $DEPLOY_DIR/deploy.sh
chmod +x $DEPLOY_DIR/backup.sh

print_status "File berhasil disalin ke $DEPLOY_DIR/"

# Create archive
print_status "Membuat archive untuk upload..."
tar -czf gita-fashion-deploy.tar.gz $DEPLOY_DIR/

print_status "✅ Persiapan deployment selesai!"
print_status ""
print_status "File yang siap untuk upload:"
print_status "  📁 $DEPLOY_DIR/ - Directory dengan semua file"
print_status "  📦 gita-fashion-deploy.tar.gz - Archive untuk upload"
print_status ""
print_status "Langkah selanjutnya:"
print_status "  1. Upload gita-fashion-deploy.tar.gz ke VPS"
print_status "  2. Extract di /var/www/: tar -xzf gita-fashion-deploy.tar.gz"
print_status "  3. Rename directory: mv gita-fashion-deploy gita-fashion"
print_status "  4. Jalankan: cd /var/www/gita-fashion && ./deploy.sh"
print_status ""
print_warning "Jangan lupa update .env.production dengan domain dan secret yang benar!"

# Show file sizes
print_status "Ukuran file:"
du -sh $DEPLOY_DIR
du -sh gita-fashion-deploy.tar.gz