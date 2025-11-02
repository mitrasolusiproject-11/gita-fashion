#!/bin/bash

# Setup Docker & Docker Compose on Ubuntu for Gita Fashion PWA
echo "🐳 Setting up Docker on Ubuntu for Gita Fashion PWA..."

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
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. It's recommended to run as a regular user with sudo."
fi

# Get Ubuntu version
ubuntu_version=$(lsb_release -rs)
print_status "Ubuntu version: $ubuntu_version"

print_header "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

print_header "2. Installing Docker..."

# Remove old Docker versions
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER

print_status "✅ Docker installed successfully"

print_header "3. Installing Docker Compose..."

# Install Docker Compose (standalone)
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create symlink for easier access
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

print_status "✅ Docker Compose installed successfully"

print_header "4. Configuring Docker..."

# Configure Docker daemon
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# Restart Docker to apply configuration
sudo systemctl restart docker

print_header "5. Setting up firewall..."

# Install and configure UFW
sudo apt install -y ufw

# Configure firewall for Docker
sudo ufw --force reset
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp  # Traefik dashboard
sudo ufw --force enable

print_status "✅ Firewall configured"

print_header "6. Creating application directory..."

# Create application directory
sudo mkdir -p /opt/gita-fashion
sudo chown -R $USER:$USER /opt/gita-fashion
chmod 755 /opt/gita-fashion

print_status "✅ Application directory created: /opt/gita-fashion"

print_header "7. Setting up system optimization..."

# Increase file limits for Docker
echo "fs.file-max = 65536" | sudo tee -a /etc/sysctl.conf
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Apply sysctl changes
sudo sysctl -p

# Setup log rotation for Docker
sudo tee /etc/logrotate.d/docker > /dev/null <<EOF
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

print_header "8. Installing additional tools..."

# Install useful tools
sudo apt install -y htop tree ncdu fail2ban

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

print_header "9. Setting up swap (if needed)..."

# Check memory and setup swap if needed
total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
print_status "Total memory: ${total_mem}MB"

if [ "$total_mem" -lt 2048 ]; then
    print_warning "Low memory detected. Setting up 2GB swap file..."
    
    # Create swap file
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Make swap permanent
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    
    # Configure swappiness
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    
    print_status "✅ 2GB swap file created"
else
    print_status "✅ Sufficient memory available"
fi

print_header "10. Verifying installation..."

# Verify Docker installation
docker_version=$(docker --version)
compose_version=$(docker-compose --version)

print_status "Docker version: $docker_version"
print_status "Docker Compose version: $compose_version"

# Test Docker
if docker run --rm hello-world > /dev/null 2>&1; then
    print_status "✅ Docker test successful"
else
    print_error "❌ Docker test failed"
fi

print_header "🎉 Docker setup completed!"
print_status ""
print_status "✅ Docker Engine installed and running"
print_status "✅ Docker Compose installed"
print_status "✅ User added to docker group"
print_status "✅ Firewall configured"
print_status "✅ Application directory ready"
print_status "✅ System optimized for containers"
print_status ""
print_status "📋 Next steps:"
print_status "  1. Logout and login again (or run: newgrp docker)"
print_status "  2. Upload Gita Fashion files to /opt/gita-fashion/"
print_status "  3. Configure .env file"
print_status "  4. Run: cd /opt/gita-fashion && ./docker-deploy.sh"
print_status ""
print_status "🔧 Useful commands:"
print_status "  docker --version                 # Check Docker version"
print_status "  docker-compose --version         # Check Compose version"
print_status "  docker ps                        # List running containers"
print_status "  docker images                    # List images"
print_status "  docker system df                 # Check disk usage"
print_status "  docker system prune              # Clean up unused resources"
print_status ""
print_warning "⚠️  Important:"
print_status "  - Logout and login again to apply docker group membership"
print_status "  - Make sure your domain points to this server IP: $(curl -s ifconfig.me)"
print_status "  - Configure your .env file before deployment"
print_status ""
print_status "🌐 Server IP: $(curl -s ifconfig.me)"
print_status "📁 Application directory: /opt/gita-fashion"
print_status ""
print_status "🐳 Ready for Gita Fashion PWA Docker deployment!"

# Show logout reminder
print_warning ""
print_warning "🔄 IMPORTANT: Please logout and login again to apply docker group changes!"
print_warning "Or run: newgrp docker"