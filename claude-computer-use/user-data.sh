#!/bin/bash
# EC2 User Data Script for Claude Computer Use Environment

exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "🚀 Starting Claude Computer Use Environment setup..."

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y \
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
    imagemagick \
    unzip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Claude Code CLI globally
npm install -g @anthropic/claude-code

# Install OpenVSCode Server
npm install -g @gitpod/openvscode-server

# Create claude-user for isolation
useradd -m -s /bin/bash claude-user || echo "User already exists"

# Set resource limits
cat >> /etc/security/limits.conf << EOF
claude-user hard cpu 2
claude-user hard memory 2048000
claude-user hard nproc 100
EOF

# Create project directory
mkdir -p /home/ubuntu/claude-agent
mkdir -p /home/ubuntu/claude-agent/tools
mkdir -p /home/ubuntu/claude-agent/logs

# Download project files
cd /home/ubuntu/claude-agent

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install anthropic pillow pyautogui pynput opencv-python fastapi uvicorn websockets python-dotenv requests aiofiles

# Create .env file template
cat > .env << EOF
ANTHROPIC_API_KEY=your_api_key_here
DISPLAY=:1
SCREEN_WIDTH=1024
SCREEN_HEIGHT=768
VNC_PASSWORD=claude123
EOF

# Download agent files (you'll need to upload these to S3 or GitHub)
# For now, create placeholder files
cat > claude_computer_agent.py << 'EOF'
# Placeholder - replace with actual agent code
print("Claude Computer Agent - Please upload the actual code")
EOF

# Set permissions
chown -R ubuntu:ubuntu /home/ubuntu/claude-agent
chmod +x /home/ubuntu/claude-agent/*.sh

# Configure VNC
mkdir -p /home/ubuntu/.vnc
echo "claude123" | vncpasswd -f > /home/ubuntu/.vnc/passwd
chmod 600 /home/ubuntu/.vnc/passwd
chown -R ubuntu:ubuntu /home/ubuntu/.vnc

# Create systemd service for auto-start
cat > /etc/systemd/system/claude-env.service << EOF
[Unit]
Description=Claude Computer Use Environment
After=network.target

[Service]
Type=forking
User=ubuntu
WorkingDirectory=/home/ubuntu/claude-agent
Environment=DISPLAY=:1
ExecStart=/home/ubuntu/claude-agent/start-claude-env.sh
ExecStop=/home/ubuntu/claude-agent/stop-claude-env.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable service (but don't start yet - user needs to configure API key)
systemctl enable claude-env

echo "✅ Setup completed!"
echo "📋 Next steps:"
echo "1. SSH into the instance"
echo "2. Edit /home/ubuntu/claude-agent/.env with your Anthropic API key"
echo "3. Upload the actual agent code files"
echo "4. Run: sudo systemctl start claude-env"
echo "5. Connect via VNC to :5901 (password: claude123)"
