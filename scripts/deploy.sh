#!/bin/bash

# Gita Fashion - Production Deployment Script
# Usage: ./scripts/deploy.sh [--build] [--restart] [--backup]

set -e

# Configuration
APP_DIR="/home/gitafashion/gita-fashion"
BACKUP_DIR="/home/gitafashion/backups"
COMPOSE_FILE="docker-compose.production.yml"
LOG_FILE="/var/log/gita-fashion-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a $LOG_FILE
}

# Check if running as correct user
check_user() {
    if [ "$USER" != "gitafashion" ]; then
        error "This script should be run as 'gitafashion' user"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check if Docker Compose is available
    if ! docker compose version &> /dev/null; then
        error "Docker Compose is not available"
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "docker-compose.production.yml not found. Are you in the right directory?"
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        error ".env.production file not found. Please create it from .env.production.example"
    fi
    
    log "Prerequisites check passed ✓"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    # Create backup directory
    mkdir -p $BACKUP_DIR
    
    # Backup database
    if [ -f "data/sqlite.db" ]; then
        DATE=$(date +%Y%m%d_%H%M%S)
        cp data/sqlite.db $BACKUP_DIR/sqlite_$DATE.db
        log "Database backup created: sqlite_$DATE.db"
    else
        warning "No database file found to backup"
    fi
    
    # Backup uploads
    if [ -d "public/uploads" ]; then
        tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C public uploads/
        log "Uploads backup created: uploads_$DATE.tar.gz"
    fi
    
    # Clean old backups (keep last 7 days)
    find $BACKUP_DIR -name "*.db" -mtime +7 -delete 2>/dev/null || true
    find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    
    log "Backup completed ✓"
}

# Pull latest code
pull_code() {
    log "Pulling latest code..."
    
    # Check if git repository
    if [ -d ".git" ]; then
        git pull origin main || error "Failed to pull latest code"
        log "Code updated ✓"
    else
        warning "Not a git repository, skipping code pull"
    fi
}

# Build and deploy
build_and_deploy() {
    log "Building and deploying application..."
    
    # Stop existing containers
    docker compose -f $COMPOSE_FILE down || warning "No containers to stop"
    
    # Build new images
    docker compose -f $COMPOSE_FILE build --no-cache || error "Failed to build images"
    
    # Start containers
    docker compose -f $COMPOSE_FILE up -d || error "Failed to start containers"
    
    log "Application deployed ✓"
}

# Restart services
restart_services() {
    log "Restarting services..."
    
    docker compose -f $COMPOSE_FILE restart || error "Failed to restart services"
    
    log "Services restarted ✓"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if containers are running
    if ! docker compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        error "Containers are not running properly"
    fi
    
    # Check application health
    for i in {1..30}; do
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            log "Application is healthy ✓"
            return 0
        fi
        info "Waiting for application to be ready... ($i/30)"
        sleep 2
    done
    
    error "Application health check failed"
}

# Show logs
show_logs() {
    log "Showing recent logs..."
    docker compose -f $COMPOSE_FILE logs --tail=50
}

# Cleanup
cleanup() {
    log "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f || warning "Failed to prune images"
    
    # Remove unused volumes
    docker volume prune -f || warning "Failed to prune volumes"
    
    log "Cleanup completed ✓"
}

# Main deployment function
deploy() {
    log "Starting deployment process..."
    
    check_user
    check_prerequisites
    
    # Parse arguments
    BUILD=false
    RESTART=false
    BACKUP=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build)
                BUILD=true
                shift
                ;;
            --restart)
                RESTART=true
                shift
                ;;
            --no-backup)
                BACKUP=false
                shift
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Create backup
    if [ "$BACKUP" = true ]; then
        create_backup
    fi
    
    # Pull latest code
    pull_code
    
    # Build and deploy or just restart
    if [ "$BUILD" = true ]; then
        build_and_deploy
    elif [ "$RESTART" = true ]; then
        restart_services
    else
        build_and_deploy
    fi
    
    # Health check
    health_check
    
    # Cleanup
    cleanup
    
    log "Deployment completed successfully! 🚀"
    info "Application is running at: https://$(hostname -f)"
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build      Force rebuild of Docker images"
    echo "  --restart    Only restart services (no rebuild)"
    echo "  --no-backup  Skip backup creation"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full deployment with backup"
    echo "  $0 --build           # Force rebuild"
    echo "  $0 --restart         # Quick restart"
    echo "  $0 --no-backup       # Deploy without backup"
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        shift
        deploy "$@"
        ;;
    logs)
        show_logs
        ;;
    health)
        health_check
        ;;
    backup)
        create_backup
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        error "Unknown command: $1. Use 'help' for usage information."
        ;;
esac