#!/bin/bash

# VPS Setup Script for Multi-App Docker Environment
# Usage: curl -sSL https://raw.githubusercontent.com/your-repo/gita-fashion/main/scripts/setup-vps.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOCKER_COMPOSE_VERSION="2.21.0"
USER_NAME="deploy"
SSH_PORT="22"
APPS_DIR="/opt/apps"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Please run this script as root (use sudo)"
    fi
}

# Update system
update_system() {
    log "Updating system packages..."
    apt-get update
    apt-get upgrade -y
    apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    success "System updated"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Remove old versions
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    success "Docker installed"
}

# Install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose installed"
}

# Create deploy user
create_deploy_user() {
    log "Creating deploy user..."
    
    # Create user if doesn't exist
    if ! id "$USER_NAME" &>/dev/null; then
        useradd -m -s /bin/bash "$USER_NAME"
        usermod -aG docker "$USER_NAME"
        usermod -aG sudo "$USER_NAME"
        
        # Create SSH directory
        mkdir -p /home/$USER_NAME/.ssh
        chmod 700 /home/$USER_NAME/.ssh
        chown $USER_NAME:$USER_NAME /home/$USER_NAME/.ssh
        
        success "Deploy user created"
    else
        warning "Deploy user already exists"
    fi
}

# Setup directories
setup_directories() {
    log "Setting up directories..."
    
    # Create apps directory
    mkdir -p $APPS_DIR
    chown $USER_NAME:$USER_NAME $APPS_DIR
    
    # Create backup directory
    mkdir -p /opt/backups
    chown $USER_NAME:$USER_NAME /opt/backups
    
    # Create logs directory
    mkdir -p /var/log/apps
    chown $USER_NAME:$USER_NAME /var/log/apps
    
    success "Directories created"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Install UFW if not installed
    apt-get install -y ufw
    
    # Reset UFW
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow $SSH_PORT/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow Traefik dashboard (restrict to specific IPs in production)
    ufw allow 8080/tcp
    
    # Enable UFW
    ufw --force enable
    
    success "Firewall configured"
}

# Install monitoring tools
install_monitoring() {
    log "Installing monitoring tools..."
    
    # Install htop, iotop, etc.
    apt-get install -y htop iotop nethogs ncdu tree
    
    # Install Docker system monitoring
    docker run -d \
        --name=cadvisor \
        --restart=unless-stopped \
        --volume=/:/rootfs:ro \
        --volume=/var/run:/var/run:ro \
        --volume=/sys:/sys:ro \
        --volume=/var/lib/docker/:/var/lib/docker:ro \
        --volume=/dev/disk/:/dev/disk:ro \
        --publish=8081:8080 \
        --detach=true \
        gcr.io/cadvisor/cadvisor:latest
    
    success "Monitoring tools installed"
}

# Setup SSL certificates directory
setup_ssl() {
    log "Setting up SSL certificates directory..."
    
    mkdir -p /opt/ssl
    chown $USER_NAME:$USER_NAME /opt/ssl
    chmod 755 /opt/ssl
    
    success "SSL directory created"
}

# Create deployment script
create_deployment_script() {
    log "Creating deployment helper script..."
    
    cat > /usr/local/bin/deploy-app << 'EOF'
#!/bin/bash

# Quick deployment script
# Usage: deploy-app <app-name> [environment]

APP_NAME=${1:-gita-fashion}
ENVIRONMENT=${2:-production}
APPS_DIR="/opt/apps"

if [ ! -d "$APPS_DIR/$APP_NAME" ]; then
    echo "❌ App directory $APPS_DIR/$APP_NAME not found!"
    exit 1
fi

cd "$APPS_DIR/$APP_NAME"

echo "🚀 Deploying $APP_NAME ($ENVIRONMENT)..."

# Pull latest code
git pull origin main

# Run deployment script
if [ -f "scripts/deploy.sh" ]; then
    chmod +x scripts/deploy.sh
    ./scripts/deploy.sh $ENVIRONMENT
else
    echo "⚠️  No deployment script found, running docker-compose..."
    docker-compose -f docker-compose.production.yml up -d --build
fi

echo "✅ Deployment completed!"
EOF

    chmod +x /usr/local/bin/deploy-app
    success "Deployment script created"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    cat > /etc/logrotate.d/docker-apps << 'EOF'
/var/log/apps/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
}
EOF

    success "Log rotation configured"
}

# Setup automatic updates
setup_auto_updates() {
    log "Setting up automatic security updates..."
    
    apt-get install -y unattended-upgrades
    
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

    cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

    success "Automatic updates configured"
}

# Display final information
display_info() {
    log "=== VPS Setup Complete ==="
    echo ""
    success "✅ Docker and Docker Compose installed"
    success "✅ Deploy user created: $USER_NAME"
    success "✅ Firewall configured (UFW)"
    success "✅ Monitoring tools installed"
    success "✅ SSL directory created: /opt/ssl"
    success "✅ Apps directory created: $APPS_DIR"
    success "✅ Automatic updates enabled"
    echo ""
    warning "📋 Next Steps:"
    echo "1. Add your SSH public key to /home/$USER_NAME/.ssh/authorized_keys"
    echo "2. Clone your applications to $APPS_DIR/"
    echo "3. Configure domain DNS to point to this server"
    echo "4. Update environment variables in .env.production files"
    echo "5. Run: deploy-app gita-fashion production"
    echo ""
    warning "🔧 Useful Commands:"
    echo "• deploy-app <app-name> [environment] - Deploy application"
    echo "• docker-compose logs -f <service> - View logs"
    echo "• docker system prune -a - Clean up Docker"
    echo "• ufw status - Check firewall status"
    echo ""
    warning "🌐 Access URLs (after deployment):"
    echo "• Traefik Dashboard: http://your-server-ip:8080"
    echo "• cAdvisor Monitoring: http://your-server-ip:8081"
    echo "• Portainer: https://portainer.yourdomain.com"
    echo ""
    success "🎉 VPS is ready for multi-app deployment!"
}

# Main execution
main() {
    log "=== Starting VPS Setup for Multi-App Docker Environment ==="
    
    check_root
    update_system
    install_docker
    install_docker_compose
    create_deploy_user
    setup_directories
    configure_firewall
    install_monitoring
    setup_ssl
    create_deployment_script
    setup_log_rotation
    setup_auto_updates
    display_info
}

# Run main function
main "$@"