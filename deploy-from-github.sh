#!/bin/bash

# Gita Fashion PWA - Deploy from GitHub (Public Repository)
# Simple deployment script for public GitHub repository

echo "🚀 Deploying Gita Fashion PWA from GitHub..."

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

# Check if we're in the right directory
if [ ! -d "/opt/gita-fashion" ]; then
    print_error "Directory /opt/gita-fashion not found!"
    print_status "Please run hostinger-setup.sh first"
    exit 1
fi

cd /opt/gita-fashion

# Get GitHub repository URL
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter repository name (default: gita-fashion): " REPO_NAME
REPO_NAME=${REPO_NAME:-gita-fashion}

GITHUB_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

print_header "1. Cloning from GitHub..."
print_status "Repository: $GITHUB_URL"

# Check if already cloned
if [ -d ".git" ]; then
    print_status "Git repository already exists. Pulling latest changes..."
    git pull origin main
    if [ $? -ne 0 ]; then
        print_error "Git pull failed!"
        exit 1
    fi
else
    print_status "Cloning repository..."
    git clone $GITHUB_URL .
    if [ $? -ne 0 ]; then
        print_error "Git clone failed!"
        print_status "Please check:"
        print_status "1. Repository URL is correct"
        print_status "2. Repository is public"
        print_status "3. Internet connection is working"
        exit 1
    fi
fi

print_header "2. Configuring Environment..."

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.docker" ]; then
        cp .env.docker .env
        print_status "Created .env from .env.docker template"
    else
        print_error ".env.docker template not found!"
        exit 1
    fi
fi

# Get domain configuration
read -p "Enter your domain (or VPS IP): " DOMAIN
read -p "Enter your email for SSL: " EMAIL

# Update .env file
sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env
sed -i "s/NEXTAUTH_URL=.*/NEXTAUTH_URL=https:\/\/$DOMAIN/" .env
sed -i "s/ACME_EMAIL=.*/ACME_EMAIL=$EMAIL/" .env

# Generate random secret if not set
if grep -q "your-super-secret-key" .env; then
    SECRET=$(openssl rand -base64 32)
    sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$SECRET/" .env
    print_status "Generated new NEXTAUTH_SECRET"
fi

print_status "Environment configured for domain: $DOMAIN"

print_header "3. Checking Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running!"
    print_status "Please start Docker or run hostinger-setup.sh first"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose not found!"
    exit 1
fi

print_header "4. Building Application..."

# Make scripts executable
chmod +x *.sh

# Build Docker image
print_status "Building Docker image..."
docker-compose build --no-cache
if [ $? -ne 0 ]; then
    print_error "Docker build failed!"
    exit 1
fi

print_header "5. Setting up Database..."

# Run database migrations
print_status "Running database migrations..."
docker-compose run --rm gita-fashion npm run db:generate
docker-compose run --rm gita-fashion npm run db:migrate

# Ask about seeding database
read -p "Seed database with initial data? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    print_status "Seeding database..."
    docker-compose run --rm gita-fashion npm run db:seed
fi

print_header "6. Deploying Application..."

# Ask which deployment method
echo "Choose deployment method:"
echo "1) Traefik (Auto SSL with Let's Encrypt) - RECOMMENDED"
echo "2) Nginx (Manual SSL setup)"
echo "3) Direct access (HTTP only, port 3000)"
read -p "Enter choice (1-3): " -n 1 -r
echo

case $REPLY in
    1)
        print_status "Deploying with Traefik (Auto SSL)..."
        docker-compose --profile traefik up -d
        ;;
    2)
        print_status "Deploying with Nginx..."
        print_warning "You'll need to setup SSL certificates manually"
        docker-compose --profile nginx up -d
        ;;
    3)
        print_status "Deploying application only..."
        docker-compose up -d gita-fashion
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_header "7. Verifying Deployment..."

# Wait for services to start
print_status "Waiting for services to start..."
sleep 15

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Containers are running"
else
    print_error "❌ Some containers failed to start"
    docker-compose logs
    exit 1
fi

# Test application health
print_status "Testing application health..."
sleep 5

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "✅ Application health check passed"
else
    print_warning "⚠️  Application health check failed"
    print_status "Check logs: docker-compose logs gita-fashion"
fi

print_header "🎉 Deployment Complete!"
print_status ""
print_status "📱 Gita Fashion PWA is now running!"
print_status ""
print_status "🌐 Access your application:"
if [ "$REPLY" = "1" ]; then
    print_status "  https://$DOMAIN (with auto SSL)"
    print_status "  http://$(curl -s ifconfig.me):8080 (Traefik dashboard)"
elif [ "$REPLY" = "2" ]; then
    print_status "  https://$DOMAIN (setup SSL first)"
    print_status "  http://$DOMAIN (HTTP)"
else
    print_status "  http://$DOMAIN:3000 (direct access)"
    print_status "  http://$(curl -s ifconfig.me):3000 (via IP)"
fi

print_status ""
print_status "🔧 Management commands:"
print_status "  docker-compose ps                 # Check status"
print_status "  docker-compose logs -f gita-fashion  # View logs"
print_status "  docker-compose restart gita-fashion  # Restart app"
print_status ""
print_status "🔄 To update from GitHub:"
print_status "  git pull origin main"
print_status "  docker-compose build --no-cache"
print_status "  docker-compose up -d"

if [ "$REPLY" = "1" ]; then
    print_status ""
    print_warning "⚠️  SSL Certificate Notes:"
    print_status "• Traefik will automatically get SSL certificate from Let's Encrypt"
    print_status "• Make sure your domain points to this server: $(curl -s ifconfig.me)"
    print_status "• SSL certificate may take 2-5 minutes to be issued"
    print_status "• Check Traefik logs: docker-compose logs traefik"
fi

print_status ""
print_status "🎊 Enjoy your Gita Fashion PWA!"