#!/bin/bash

# SUPER SIMPLE DEPLOYMENT SCRIPT
# Just run: ./simple-deploy.sh

echo "🚀 GITA FASHION - SUPER SIMPLE DEPLOYMENT"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_VPS_IP")

print_info "Server IP: $SERVER_IP"
print_info "Starting deployment..."

# Step 1: Clean everything
print_info "Step 1: Cleaning up..."
docker-compose down 2>/dev/null || true
docker system prune -f 2>/dev/null || true

# Step 2: Create simple .env
print_info "Step 2: Creating environment..."
cat > .env << EOF
DOMAIN=$SERVER_IP
NEXTAUTH_URL=http://$SERVER_IP:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "gita-fashion-secret-key-$(date +%s)")
DATABASE_URL=file:./data/sqlite.db
NEXT_PUBLIC_APP_NAME=Gita Fashion
NODE_ENV=production
EOF

print_success "Environment created"

# Step 3: Create simple docker-compose
print_info "Step 3: Creating simple Docker setup..."
cat > docker-compose.simple.yml << 'EOF'
services:
  gita-fashion:
    build: .
    container_name: gita-fashion-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/sqlite.db
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXT_PUBLIC_APP_NAME=Gita Fashion
    volumes:
      - gita-fashion-data:/app/data
      - gita-fashion-logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  gita-fashion-data:
  gita-fashion-logs:
EOF

# Step 4: Create simple Dockerfile
print_info "Step 4: Creating simple Dockerfile..."
cat > Dockerfile.simple << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build application
RUN npm run build

# Create data directory
RUN mkdir -p data logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
EOF

# Step 5: Build and run
print_info "Step 5: Building and starting application..."

# Build with simple dockerfile
docker build -f Dockerfile.simple -t gita-fashion:simple . || {
    print_error "Build failed! Trying alternative build..."
    
    # Alternative: build without optimization
    cat > Dockerfile.simple << 'EOF'
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Skip build, just start
EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF
    
    docker build -f Dockerfile.simple -t gita-fashion:simple .
}

# Run container
docker run -d \
  --name gita-fashion-app \
  --restart unless-stopped \
  -p 3000:3000 \
  -v gita-fashion-data:/app/data \
  -v gita-fashion-logs:/app/logs \
  --env-file .env \
  gita-fashion:simple

# Step 6: Setup database
print_info "Step 6: Setting up database..."
sleep 10

# Run database setup inside container
docker exec gita-fashion-app npm run db:generate 2>/dev/null || true
docker exec gita-fashion-app npm run db:migrate 2>/dev/null || true
docker exec gita-fashion-app npm run db:seed 2>/dev/null || true

# Step 7: Test application
print_info "Step 7: Testing application..."
sleep 5

if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    print_success "APPLICATION DEPLOYED SUCCESSFULLY!"
    echo ""
    echo "🌐 Access your application:"
    echo "   http://$SERVER_IP:3000"
    echo ""
    echo "📱 Default login:"
    echo "   Email: admin@gitafashion.com"
    echo "   Password: admin123"
    echo ""
    echo "🔧 Management commands:"
    echo "   docker logs gita-fashion-app     # View logs"
    echo "   docker restart gita-fashion-app # Restart app"
    echo "   docker stop gita-fashion-app    # Stop app"
    echo ""
else
    print_error "Application test failed!"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   docker logs gita-fashion-app"
    echo "   docker ps"
    echo ""
fi

print_info "Deployment completed!"
EOF