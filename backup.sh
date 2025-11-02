#!/bin/bash

# Gita Fashion Backup Script
# Place this in /root/backup-gita-fashion.sh on your VPS

# Configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/gita-fashion"
APP_DIR="/var/www/gita-fashion"
RETENTION_DAYS=7

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[BACKUP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p $BACKUP_DIR

print_status "Starting backup process..."

# Backup database
if [ -f "$APP_DIR/data/sqlite.db" ]; then
    print_status "Backing up database..."
    cp $APP_DIR/data/sqlite.db $BACKUP_DIR/sqlite_$DATE.db
    
    # Compress database backup
    gzip $BACKUP_DIR/sqlite_$DATE.db
    
    print_status "Database backup completed: sqlite_$DATE.db.gz"
else
    print_warning "Database file not found at $APP_DIR/data/sqlite.db"
fi

# Backup environment file
if [ -f "$APP_DIR/.env.production" ]; then
    print_status "Backing up environment configuration..."
    cp $APP_DIR/.env.production $BACKUP_DIR/env_$DATE.txt
    print_status "Environment backup completed: env_$DATE.txt"
fi

# Backup application files (optional - uncomment if needed)
# print_status "Backing up application files..."
# tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR \
#     --exclude=node_modules \
#     --exclude=.next \
#     --exclude=logs \
#     --exclude=data \
#     .
# print_status "Application backup completed: app_$DATE.tar.gz"

# Clean old backups
print_status "Cleaning old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "*.db.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.txt" -mtime +$RETENTION_DAYS -delete

# Show backup summary
print_status "Backup summary:"
echo "  Location: $BACKUP_DIR"
echo "  Files:"
ls -lah $BACKUP_DIR/*$DATE* 2>/dev/null || echo "  No files created"

# Calculate total backup size
TOTAL_SIZE=$(du -sh $BACKUP_DIR 2>/dev/null | cut -f1)
print_status "Total backup size: $TOTAL_SIZE"

print_status "Backup process completed!"

# Optional: Send backup status to a webhook or email
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"Gita Fashion backup completed successfully"}' \
#     YOUR_WEBHOOK_URL