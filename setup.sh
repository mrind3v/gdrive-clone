#!/bin/bash

# Google Drive Clone - Quick Setup Script
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
    echo "  sudo apt-get install docker.io docker-compose"
    exit 1
fi

echo "✓ Docker is installed"

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
echo "Starting Google Drive Clone..."
echo ""

# Stop any existing containers
docker compose down 2>/dev/null || true

# Start the application
docker compose up -d --build

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
echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check if services are running
docker compose ps

echo ""
echo "🎉 Setup complete! Open http://localhost:3000 in your browser"
echo ""
