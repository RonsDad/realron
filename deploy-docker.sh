#!/bin/bash

# Ron AI Healthcare Copilot - Docker Deployment Script
set -e

echo "🐳 Ron AI Healthcare Copilot - Docker Deployment"
echo "================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed."
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is required but not installed."
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please ensure your .env file exists with all required API keys."
    exit 1
fi

echo "✅ Environment file found"

# Create logs directory
mkdir -p logs

# Create SSL directory for future use
mkdir -p ssl

# Build and start services
echo "🏗️  Building and starting services..."

# Use docker-compose or docker compose based on availability
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
$DOCKER_COMPOSE_CMD down

# Build and start services
echo "🚀 Building and starting services..."
$DOCKER_COMPOSE_CMD up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check backend health
if curl -f http://localhost:8000/health &> /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend health check failed, checking logs..."
    $DOCKER_COMPOSE_CMD logs backend
fi

# Check frontend
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend check failed, checking logs..."
    $DOCKER_COMPOSE_CMD logs frontend
fi

# Check nginx
if curl -f http://localhost &> /dev/null; then
    echo "✅ Nginx proxy is working"
else
    echo "⚠️  Nginx check failed, checking logs..."
    $DOCKER_COMPOSE_CMD logs nginx
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "🌐 Your Ron AI Healthcare Copilot is now running at:"
echo "   http://localhost (via Nginx proxy)"
echo "   http://localhost:3000 (Frontend direct)"
echo "   http://localhost:8000 (Backend API direct)"
echo ""
echo "📊 Monitoring Commands:"
echo "   $DOCKER_COMPOSE_CMD ps                    # View running containers"
echo "   $DOCKER_COMPOSE_CMD logs -f               # View all logs"
echo "   $DOCKER_COMPOSE_CMD logs -f backend       # View backend logs"
echo "   $DOCKER_COMPOSE_CMD logs -f frontend      # View frontend logs"
echo "   $DOCKER_COMPOSE_CMD logs -f nginx         # View nginx logs"
echo ""
echo "🔧 Management Commands:"
echo "   $DOCKER_COMPOSE_CMD restart               # Restart all services"
echo "   $DOCKER_COMPOSE_CMD restart backend       # Restart backend only"
echo "   $DOCKER_COMPOSE_CMD down                  # Stop all services"
echo "   $DOCKER_COMPOSE_CMD up -d                 # Start services in background"
echo ""
echo "📈 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""
echo "💡 Next Steps:"
echo "   - Set up SSL certificates for production"
echo "   - Configure domain name and DNS"
echo "   - Set up monitoring and alerting"
echo "   - Configure backup strategies"
echo ""
