#!/bin/bash
set -e
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
apt update && apt upgrade -y
apt install -y \
  xvfb mutter tint2 x11vnc firefox libreoffice gedit nautilus \
  gnome-terminal python3 python3-pip python3-venv curl wget git \
  build-essential xdotool scrot imagemagick unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g @anthropic/claude-code @gitpod/openvscode-server
mkdir -p /home/ubuntu/claude-agent/{tools,logs}
cd /home/ubuntu/claude-agent
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install anthropic pillow pyautogui pynput opencv-python fastapi uvicorn websockets python-dotenv requests aiofiles
cat > /home/ubuntu/claude-agent/.env << 'ENVEOF'
ANTHROPIC_API_KEY=your_api_key_here
DISPLAY=:1
SCREEN_WIDTH=1280
SCREEN_HEIGHT=800
VNC_PASSWORD=claude123
OPENVSCODE_SERVER_TOKEN=changeme
ENVEOF
chown -R ubuntu:ubuntu /home/ubuntu/claude-agent
mkdir -p /home/ubuntu/.vnc
/bin/echo "claude123" | vncpasswd -f > /home/ubuntu/.vnc/passwd
chmod 600 /home/ubuntu/.vnc/passwd
chown -R ubuntu:ubuntu /home/ubuntu/.vnc
