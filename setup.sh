#!/bin/bash

# Google Drive Clone - Setup Script
# This script helps set up Docker permissions and starts the application

set -e

echo "========================================="
echo "Google Drive Clone - Setup Script"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker first:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install docker.io docker-compose-plugin"
    exit 1
fi

echo "✓ Docker is installed"

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available!"
    echo "Please install docker-compose-plugin:"
    echo "  sudo apt-get install docker-compose-plugin"
    exit 1
fi

echo "✓ Docker Compose is available"

# Check if user is in docker group
if ! groups $USER | grep &>/dev/null '\bdocker\b'; then
    echo ""
    echo "⚠️  Your user is not in the docker group."
    echo "Adding user to docker group..."
    sudo usermod -aG docker $USER
    echo ""
    echo "✓ User added to docker group"
    echo ""
    echo "⚠️  IMPORTANT: You need to log out and log back in for this to take effect!"
    echo "After logging back in, run this script again."
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit..."
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo ""
    echo "⚠️  Docker daemon is not running"
    echo "Starting Docker..."
    sudo systemctl start docker
    sudo systemctl enable docker
    echo "✓ Docker daemon started"
fi

echo ""
echo "Checking system resources..."

# Check available disk space
available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$available_space" -lt 10 ]; then
    echo "⚠️  Warning: Low disk space (${available_space}GB available)"
    echo "At least 10GB recommended for Docker images and containers"
fi

# Check available memory
available_memory=$(free -g | awk 'NR==2 {print $7}')
if [ "$available_memory" -lt 4 ]; then
    echo "⚠️  Warning: Low available memory (${available_memory}GB)"
    echo "At least 4GB recommended for smooth operation"
fi

echo ""
echo "Preparing to start Google Drive Clone..."
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created (you can customize it later)"
fi

# Stop any existing containers
echo "Stopping any existing containers..."
docker compose down 2>/dev/null || true

# Clean up old images if requested
read -p "Do you want to rebuild from scratch? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning up old images..."
    docker compose down -v
    docker system prune -f
fi

# Start the application
echo ""
echo "Building and starting services..."
echo "This may take 5-10 minutes on first run..."
echo ""

# Build with no cache if rebuild was requested
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose build --no-cache --progress=plain
else
    docker compose build --progress=plain
fi

# Start services
docker compose up -d

echo ""
echo "========================================="
echo "✓ Application started successfully!"
echo "========================================="
echo ""
echo "Access the application at:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8001"
echo "  API Docs:  http://localhost:8001/docs"
echo ""
echo "Useful commands:"
echo "  View logs:        docker compose logs -f"
echo "  Stop app:         docker compose down"
echo "  Restart app:      docker compose restart"
echo "  Check status:     docker compose ps"
echo ""
echo "Waiting for services to be healthy..."
echo ""

# Wait for services to be healthy with progress indicator
max_wait=120
elapsed=0
while [ $elapsed -lt $max_wait ]; do
    if docker compose ps | grep -q "healthy"; then
        break
    fi
    echo -n "."
    sleep 2
    elapsed=$((elapsed + 2))
done
echo ""

# Check if services are running
echo ""
docker compose ps
echo ""

# Check if services are accessible
echo "Verifying services..."
sleep 5

if curl -s http://localhost:8001/api/ > /dev/null; then
    echo "✓ Backend is accessible"
else
    echo "⚠️  Backend might not be ready yet. Check logs: docker compose logs backend"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ Frontend is accessible"
else
    echo "⚠️  Frontend might not be ready yet. Check logs: docker compose logs frontend"
fi

echo ""
echo "🎉 Setup complete! Open http://localhost:3000 in your browser"
echo ""
echo "📖 For troubleshooting, see TROUBLESHOOTING.md"
echo ""
