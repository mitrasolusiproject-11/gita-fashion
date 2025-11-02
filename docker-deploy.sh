#!/bin/bash

# Gita Fashion PWA Docker Deployment Script
echo "🐳 Starting Gita Fashion PWA Docker deployment..."

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.docker .env
    print_warning "Please edit .env file with your configuration before continuing."
    print_status "Required variables: DOMAIN, NEXTAUTH_SECRET, ACME_EMAIL"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
if [ -z "$DOMAIN" ] || [ -z "$NEXTAUTH_SECRET" ]; then
    print_error "Required environment variables not set. Please check your .env file."
    print_status "Required: DOMAIN, NEXTAUTH_SECRET"
    exit 1
fi

print_header "1. Building Docker image..."
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    print_error "Docker build failed!"
    exit 1
fi

print_header "2. Setting up database..."
# Create data directory if it doesn't exist
mkdir -p data

# Run database migrations
print_status "Running database migrations..."
docker-compose run --rm gita-fashion npm run db:generate
docker-compose run --rm gita-fashion npm run db:migrate

# Optional: Seed database
read -p "Do you want to seed the database with initial data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    docker-compose run --rm gita-fashion npm run db:seed
fi

print_header "3. Starting services..."

# Ask which reverse proxy to use
echo "Choose reverse proxy:"
echo "1) Traefik (automatic SSL with Let's Encrypt)"
echo "2) Nginx (manual SSL setup required)"
echo "3) None (direct access on port 3000)"
read -p "Enter choice (1-3): " -n 1 -r
echo

case $REPLY in
    1)
        print_status "Starting with Traefik..."
        docker-compose --profile traefik up -d
        ;;
    2)
        print_status "Starting with Nginx..."
        print_warning "You need to setup SSL certificates manually in ./ssl/ directory"
        docker-compose --profile nginx up -d
        ;;
    3)
        print_status "Starting application only..."
        docker-compose up -d gita-fashion
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

print_header "4. Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Services are running!"
else
    print_error "❌ Some services failed to start. Check logs:"
    docker-compose logs
    exit 1
fi

print_header "5. Running health checks..."
sleep 5

# Test application health
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "✅ Application health check passed"
else
    print_warning "⚠️  Application health check failed. Check logs:"
    docker-compose logs gita-fashion
fi

print_header "🎉 Deployment completed!"
print_status ""
print_status "📱 PWA Features Available:"
print_status "  ✅ Offline Support"
print_status "  ✅ Install Prompt"
print_status "  ✅ Push Notifications"
print_status "  ✅ Background Sync"
print_status ""
print_status "🌐 Access your application:"
if [ "$REPLY" = "1" ]; then
    print_status "  https://$DOMAIN (Traefik with auto SSL)"
    print_status "  http://localhost:8080 (Traefik dashboard)"
elif [ "$REPLY" = "2" ]; then
    print_status "  https://$DOMAIN (Nginx - setup SSL first)"
    print_status "  http://$DOMAIN (HTTP redirect to HTTPS)"
else
    print_status "  http://localhost:3000 (Direct access)"
fi

print_status ""
print_status "🔧 Useful commands:"
print_status "  docker-compose logs -f                    # View logs"
print_status "  docker-compose ps                         # Check status"
print_status "  docker-compose restart gita-fashion       # Restart app"
print_status "  docker-compose down                       # Stop all services"
print_status "  docker-compose up -d                      # Start all services"
print_status ""
print_status "💾 Backup:"
print_status "  docker-compose --profile backup run backup  # Manual backup"
print_status ""
print_status "📊 Monitoring:"
print_status "  docker-compose --profile monitoring up -d   # Enable auto-updates"

if [ "$REPLY" = "1" ]; then
    print_status ""
    print_warning "⚠️  Traefik Notes:"
    print_status "  - SSL certificates will be automatically obtained"
    print_status "  - Make sure your domain points to this server"
    print_status "  - Check Traefik dashboard at http://localhost:8080"
fi

print_status ""
print_status "🎊 Gita Fashion PWA is now running with Docker!"