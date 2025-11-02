#!/bin/sh

# Docker Backup Script for Gita Fashion PWA
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DATA_DIR="/data"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

echo "🔄 Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup SQLite database
if [ -f "$DATA_DIR/sqlite.db" ]; then
    echo "📦 Backing up database..."
    cp $DATA_DIR/sqlite.db $BACKUP_DIR/sqlite_$DATE.db
    
    # Compress backup
    gzip $BACKUP_DIR/sqlite_$DATE.db
    
    echo "✅ Database backup completed: sqlite_$DATE.db.gz"
else
    echo "⚠️  Database file not found at $DATA_DIR/sqlite.db"
fi

# Clean old backups
echo "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "*.db.gz" -mtime +$RETENTION_DAYS -delete

# Show backup summary
echo "📊 Backup summary:"
echo "  Location: $BACKUP_DIR"
echo "  Files:"
ls -lah $BACKUP_DIR/*$DATE* 2>/dev/null || echo "  No files created"

# Calculate total backup size
TOTAL_SIZE=$(du -sh $BACKUP_DIR 2>/dev/null | cut -f1)
echo "💾 Total backup size: $TOTAL_SIZE"

echo "✅ Backup process completed!"