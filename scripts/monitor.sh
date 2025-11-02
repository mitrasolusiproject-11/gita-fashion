#!/bin/bash

# Gita Fashion - Monitoring Script
# Usage: ./scripts/monitor.sh [status|logs|health|resources]

set -e

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
LOG_FILE="/var/log/gita-fashion-monitor.log"
DOMAIN="https://$(hostname -f)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Check container status
check_status() {
    log "Checking container status..."
    echo ""
    
    # Docker containers
    echo "=== Docker Containers ==="
    docker compose -f $COMPOSE_FILE ps
    echo ""
    
    # Container health
    echo "=== Container Health ==="
    for container in $(docker compose -f $COMPOSE_FILE ps -q); do
        name=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
        status=$(docker inspect --format='{{.State.Status}}' $container)
        health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "no-health-check")
        
        if [ "$status" = "running" ]; then
            echo -e "${GREEN}✓${NC} $name: $status ($health)"
        else
            echo -e "${RED}✗${NC} $name: $status ($health)"
        fi
    done
    echo ""
}

# Check application health
check_health() {
    log "Checking application health..."
    echo ""
    
    # API health check
    echo "=== API Health Check ==="
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        echo -e "${GREEN}✓${NC} API is responding"
    else
        echo -e "${RED}✗${NC} API is not responding"
    fi
    
    # Database check
    echo -e "\n=== Database Check ==="
    if [ -f "data/sqlite.db" ]; then
        size=$(du -h data/sqlite.db | cut -f1)
        echo -e "${GREEN}✓${NC} Database file exists (Size: $size)"
    else
        echo -e "${RED}✗${NC} Database file not found"
    fi
    
    # SSL certificate check
    echo -e "\n=== SSL Certificate Check ==="
    if command -v openssl &> /dev/null; then
        cert_info=$(echo | openssl s_client -servername $(hostname -f) -connect $(hostname -f):443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
        if [ -n "$cert_info" ]; then
            echo -e "${GREEN}✓${NC} SSL certificate is valid"
            echo "$cert_info"
        else
            echo -e "${YELLOW}!${NC} Could not verify SSL certificate"
        fi
    else
        echo -e "${YELLOW}!${NC} OpenSSL not available for certificate check"
    fi
    echo ""
}

# Show system resources
check_resources() {
    log "Checking system resources..."
    echo ""
    
    # System info
    echo "=== System Information ==="
    echo "Hostname: $(hostname -f)"
    echo "Uptime: $(uptime -p)"
    echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
    echo ""
    
    # Memory usage
    echo "=== Memory Usage ==="
    free -h
    echo ""
    
    # Disk usage
    echo "=== Disk Usage ==="
    df -h | grep -E "(Filesystem|/dev/)"
    echo ""
    
    # Docker resources
    echo "=== Docker Resources ==="
    docker system df
    echo ""
    
    # Container stats
    echo "=== Container Stats ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo ""
}

# Show logs
show_logs() {
    local lines=${1:-50}
    log "Showing last $lines lines of logs..."
    echo ""
    
    echo "=== Application Logs ==="
    docker compose -f $COMPOSE_FILE logs --tail=$lines gita-fashion
    echo ""
    
    echo "=== Nginx Logs ==="
    docker compose -f $COMPOSE_FILE logs --tail=$lines nginx 2>/dev/null || echo "Nginx container not found"
    echo ""
}

# Performance test
performance_test() {
    log "Running performance test..."
    echo ""
    
    if command -v curl &> /dev/null; then
        echo "=== Response Time Test ==="
        for i in {1..5}; do
            response_time=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000/)
            echo "Request $i: ${response_time}s"
        done
        echo ""
    else
        warning "curl not available for performance testing"
    fi
}

# Generate report
generate_report() {
    local report_file="/tmp/gita-fashion-report-$(date +%Y%m%d_%H%M%S).txt"
    
    log "Generating system report..."
    
    {
        echo "Gita Fashion - System Report"
        echo "Generated: $(date)"
        echo "==============================="
        echo ""
        
        echo "CONTAINER STATUS:"
        docker compose -f $COMPOSE_FILE ps
        echo ""
        
        echo "SYSTEM RESOURCES:"
        free -h
        echo ""
        df -h
        echo ""
        
        echo "DOCKER STATS:"
        docker stats --no-stream
        echo ""
        
        echo "RECENT LOGS:"
        docker compose -f $COMPOSE_FILE logs --tail=20 gita-fashion
        
    } > $report_file
    
    log "Report generated: $report_file"
}

# Auto-restart if unhealthy
auto_restart() {
    log "Checking if auto-restart is needed..."
    
    # Check if application is responding
    if ! curl -f -s http://localhost:3000/api/health > /dev/null; then
        warning "Application is not responding, attempting restart..."
        
        # Log the incident
        echo "$(date): Application unresponsive, restarting..." >> $LOG_FILE
        
        # Restart containers
        docker compose -f $COMPOSE_FILE restart
        
        # Wait and check again
        sleep 30
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            log "Application restarted successfully"
            echo "$(date): Application restart successful" >> $LOG_FILE
        else
            error "Application restart failed"
            echo "$(date): Application restart failed" >> $LOG_FILE
        fi
    else
        log "Application is healthy, no restart needed"
    fi
}

# Main function
main() {
    case "${1:-status}" in
        status)
            check_status
            ;;
        health)
            check_health
            ;;
        resources)
            check_resources
            ;;
        logs)
            show_logs "${2:-50}"
            ;;
        performance)
            performance_test
            ;;
        report)
            generate_report
            ;;
        restart)
            auto_restart
            ;;
        all)
            check_status
            check_health
            check_resources
            performance_test
            ;;
        help|--help|-h)
            echo "Usage: $0 [COMMAND] [OPTIONS]"
            echo ""
            echo "Commands:"
            echo "  status      Show container status (default)"
            echo "  health      Check application health"
            echo "  resources   Show system resources"
            echo "  logs [N]    Show last N lines of logs (default: 50)"
            echo "  performance Run performance test"
            echo "  report      Generate system report"
            echo "  restart     Auto-restart if unhealthy"
            echo "  all         Run all checks"
            echo "  help        Show this help"
            ;;
        *)
            error "Unknown command: $1. Use 'help' for usage information."
            ;;
    esac
}

# Run main function
main "$@"