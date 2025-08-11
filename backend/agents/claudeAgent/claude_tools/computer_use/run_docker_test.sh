#!/bin/bash
# Script to build and run the computer use Docker container

echo "🤖 Ron AI Computer Use Tool - Docker Setup"
echo "========================================="

# Load environment variables from .env file
if [ -f "../../../../.env" ]; then
    export $(cat ../../../../.env | grep -v '^#' | xargs)
fi

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY not found"
    echo "Please add ANTHROPIC_API_KEY to your .env file in the root directory"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p screenshots
mkdir -p shared

# Build the Docker image
echo "🔨 Building Docker image..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

# Start the container
echo "🚀 Starting container..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container"
    exit 1
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Display access information
echo ""
echo "✅ Container is running!"
echo ""
echo "📺 Access the desktop:"
echo "   - VNC: Connect any VNC client to localhost:5900"
echo "   - Web: Open http://localhost:6080/vnc.html in your browser"
echo ""
echo "🔧 To run the test:"
echo "   docker exec -it claude-computer-use python3 /home/claude/computer_use/test_computer_use.py"
echo ""
echo "📋 To see logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down"
echo ""

# Optionally run the test immediately
read -p "Would you like to run the test now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running test..."
    docker exec -it claude-computer-use python3 /home/claude/computer_use/test_computer_use.py
fi