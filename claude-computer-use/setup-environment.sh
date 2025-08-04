#!/bin/bash
# Claude Computer Use Environment Setup Script
# Run this on Ubuntu EC2 instance

set -e

echo "🚀 Setting up Claude Computer Use Environment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install X11 virtual framebuffer and desktop components
echo "🖥️ Installing virtual display components..."
sudo apt install -y \
    xvfb \
    mutter \
    tint2 \
    x11vnc \
    firefox \
    libreoffice \
    gedit \
    nautilus \
    gnome-terminal \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    wget \
    git \
    build-essential \
    xdotool \
    scrot \
    imagemagick

# Install Node.js 18+
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install Claude Code CLI globally
echo "🤖 Installing Claude Code CLI..."
npm install -g @anthropic/claude-code

# Install OpenVSCode Server
echo "💻 Installing OpenVSCode Server..."
npm install -g @gitpod/openvscode-server

# Create claude-user for isolation
echo "👤 Creating isolated user for Claude operations..."
sudo useradd -m -s /bin/bash claude-user || echo "User already exists"

# Set resource limits
echo "⚙️ Configuring resource limits..."
sudo tee -a /etc/security/limits.conf << EOF
claude-user hard cpu 2
claude-user hard memory 2048000
claude-user hard nproc 100
EOF

# Create project directory
echo "📁 Creating project directories..."
mkdir -p /home/ubuntu/claude-agent
mkdir -p /home/ubuntu/claude-agent/tools
mkdir -p /home/ubuntu/claude-agent/logs

# Create Python virtual environment
echo "🐍 Setting up Python environment..."
cd /home/ubuntu/claude-agent
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install anthropic pillow pyautogui pynput opencv-python fastapi uvicorn websockets

# Create .env file template
echo "📝 Creating environment configuration..."
cat > /home/ubuntu/claude-agent/.env << EOF
ANTHROPIC_API_KEY=your_api_key_here
DISPLAY=:1
SCREEN_WIDTH=1024
SCREEN_HEIGHT=768
VNC_PASSWORD=claude123
EOF

echo "✅ Environment setup complete!"
echo "📋 Next steps:"
echo "1. Edit /home/ubuntu/claude-agent/.env with your Anthropic API key"
echo "2. Run ./start-claude-env.sh to start the environment"
echo "3. Connect via VNC to localhost:5901 (password: claude123)"
