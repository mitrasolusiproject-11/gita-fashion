#!/bin/bash

# Gita Fashion PWA - Hostinger VPS Ubuntu 24.04 Setup Script
# Run this script on fresh Hostinger VPS

echo "🚀 Setting up Hostinger VPS Ubuntu 24.04 for Gita Fashion PWA..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root user"
    print_status "Usage: sudo bash hostinger-setup.sh"
    exit 1
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
print_status "Server IP: $SERVER_IP"

# Get Ubuntu version
UBUNTU_VERSION=$(lsb_release -rs)
print_status "Ubuntu version: $UBUNTU_VERSION"

if [ "$UBUNTU_VERSION" != "24.04" ]; then
    print_warning "This script is optimized for Ubuntu 24.04. Current version: $UBUNTU_VERSION"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_header "1. System Update & Basic Tools"
apt update && apt upgrade -y
apt install -y curl wget git unzip nano htop tree neofetch software-properties-common apt-transport-https ca-certificates gnupg lsb-release

print_header "2. Create Non-Root User"
read -p "Enter username for new user (default: gitauser): " USERNAME
USERNAME=${USERNAME:-gitauser}

if id "$USERNAME" &>/dev/null; then
    print_warning "User $USERNAME already exists"
else
    adduser --gecos "" $USERNAME
    usermod -aG sudo $USERNAME
    print_success "User $USERNAME created and added to sudo group"
fi

print_header "3. Configure SSH Security"
read -p "Change SSH port from 22 to 2222? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    # Backup original config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Configure SSH
    sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
    
    print_success "SSH configured to use port 2222"
    print_warning "Remember to use -p 2222 for future SSH connections"
fi

print_header "4. Setup Firewall (UFW)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (both ports during transition)
ufw allow 22/tcp
ufw allow 2222/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow Docker Swarm ports
ufw allow 2376/tcp
ufw allow 7946/tcp
ufw allow 4789/udp

# Allow Traefik dashboard
ufw allow 8080/tcp

ufw --force enable
print_success "Firewall configured and enabled"

print_header "5. Install Fail2Ban"
apt install -y fail2ban

# Configure fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 22,2222
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl start fail2ban
systemctl enable fail2ban
print_success "Fail2Ban installed and configured"

print_header "6. Install Docker Engine"
# Remove old Docker versions
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
usermod -aG docker $USERNAME

# Start and enable Docker
systemctl start docker
systemctl enable docker

print_success "Docker Engine installed"

print_header "7. Install Docker Compose"
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

print_success "Docker Compose installed: $DOCKER_COMPOSE_VERSION"

print_header "8. Configure Docker"
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker
print_success "Docker configured"

print_header "9. Setup Swap (if needed)"
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
print_status "Total memory: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 4096 ]; then
    print_warning "Memory < 4GB. Setting up 2GB swap file..."
    
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    sysctl -p
    
    print_success "2GB swap file created"
else
    print_success "Sufficient memory available"
fi

print_header "10. Create Application Directory"
mkdir -p /opt/gita-fashion
chown -R $USERNAME:$USERNAME /opt/gita-fashion
chmod -R 755 /opt/gita-fashion
print_success "Application directory created: /opt/gita-fashion"

print_header "11. Setup Git Configuration"
read -p "Setup Git for GitHub integration? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    read -p "Enter your GitHub username: " GITHUB_USERNAME
    read -p "Enter your email: " GITHUB_EMAIL
    
    # Configure git for the user
    sudo -u $USERNAME git config --global user.name "$GITHUB_USERNAME"
    sudo -u $USERNAME git config --global user.email "$GITHUB_EMAIL"
    sudo -u $USERNAME git config --global init.defaultBranch main
    
    print_success "Git configured for user $USERNAME"
    
    read -p "Generate SSH key for GitHub? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        # Generate SSH key for GitHub
        sudo -u $USERNAME ssh-keygen -t rsa -b 4096 -C "$GITHUB_EMAIL" -f /home/$USERNAME/.ssh/id_rsa -N ""
        
        print_success "SSH key generated!"
        print_warning "Add this public key to your GitHub account:"
        print_status "GitHub > Settings > SSH and GPG keys > New SSH key"
        echo ""
        echo "Public Key:"
        echo "----------------------------------------"
        sudo -u $USERNAME cat /home/$USERNAME/.ssh/id_rsa.pub
        echo "----------------------------------------"
        echo ""
        read -p "Press Enter after adding the key to GitHub..."
        
        # Test GitHub connection
        print_status "Testing GitHub connection..."
        if sudo -u $USERNAME ssh -T git@github.com -o StrictHostKeyChecking=no 2>&1 | grep -q "successfully authenticated"; then
            print_success "✅ GitHub SSH connection successful!"
        else
            print_warning "⚠️  GitHub SSH connection test failed. You can test later with: ssh -T git@github.com"
        fi
    fi
fi

print_header "12. Install Additional Tools"
apt install -y certbot python3-certbot-nginx
print_success "Additional tools installed"

print_header "13. System Optimization"
# Increase file limits
echo "fs.file-max = 65536" >> /etc/sysctl.conf
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Apply changes
sysctl -p

print_success "System optimized"

print_header "14. Setup Log Rotation"
cat > /etc/logrotate.d/docker-gita-fashion << EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

print_success "Log rotation configured"

# Restart SSH if port was changed
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    print_header "15. Restarting SSH Service"
    systemctl restart sshd
    print_success "SSH service restarted on port 2222"
fi

print_header "🎉 Hostinger VPS Setup Complete!"
print_status ""
print_success "✅ System updated and secured"
print_success "✅ User '$USERNAME' created with sudo access"
print_success "✅ SSH configured (port 2222)"
print_success "✅ Firewall (UFW) enabled"
print_success "✅ Fail2Ban installed"
print_success "✅ Docker Engine installed"
print_success "✅ Docker Compose installed"
print_success "✅ Application directory ready"
print_success "✅ System optimized for production"

print_status ""
print_header "📋 Next Steps:"
print_status "1. Logout and login as '$USERNAME' user:"
print_status "   ssh -p 2222 $USERNAME@$SERVER_IP"
print_status ""
print_status "2. Clone Gita Fashion from GitHub (Public Repository):"
print_status "   cd /opt/gita-fashion"
print_status "   git clone https://github.com/your-username/gita-fashion.git ."
print_status ""
print_status "3. Configure environment:"
print_status "   cd /opt/gita-fashion"
print_status "   cp .env.docker .env"
print_status "   nano .env  # Edit DOMAIN, NEXTAUTH_SECRET, etc."
print_status ""
print_status "4. Deploy application:"
print_status "   chmod +x docker-deploy.sh"
print_status "   ./docker-deploy.sh"
print_status ""
print_status "5. Setup domain DNS to point to: $SERVER_IP"

print_status ""
print_header "🔧 Important Information:"
print_status "• Server IP: $SERVER_IP"
print_status "• SSH Port: 2222"
print_status "• SSH User: $USERNAME"
print_status "• App Directory: /opt/gita-fashion"
print_status "• Docker Version: $(docker --version)"
print_status "• Docker Compose Version: $(docker-compose --version)"

print_status ""
print_warning "⚠️  Security Notes:"
print_status "• SSH root login disabled"
print_status "• SSH port changed to 2222"
print_status "• Firewall enabled with minimal ports"
print_status "• Fail2Ban active for SSH protection"

print_status ""
print_header "🌐 Ready for Gita Fashion PWA deployment!"
print_status "Follow the HOSTINGER_VPS_PRODUCTION_GUIDE.md for detailed deployment steps."