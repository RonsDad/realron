#!/bin/bash
# AWS VM Setup Script for Computer Use Tool

echo "Setting up AWS VM for Computer Use Tool..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install X11 and desktop environment
echo "Installing X11 and XFCE desktop..."
sudo apt-get install -y xvfb x11vnc xfce4 xfce4-terminal dbus-x11

# Install required tools
echo "Installing required tools..."
sudo apt-get install -y \
    xdotool \
    imagemagick \
    firefox \
    chromium-browser \
    python3-pip \
    git \
    curl \
    wget \
    nodejs \
    npm

# Install Claude Code CLI
echo "Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code

# Create virtual display
echo "Setting up virtual display..."
cat > ~/start_display.sh << 'EOF'
#!/bin/bash
# Start Xvfb on display :1
Xvfb :1 -screen 0 1024x768x24 &
export DISPLAY=:1

# Start XFCE desktop
startxfce4 &

# Optional: Start VNC server for remote access
x11vnc -display :1 -forever -nopw -shared &

echo "Virtual display started on :1"
echo "VNC server running on port 5900"
EOF

chmod +x ~/start_display.sh

# Create systemd service for auto-start
sudo tee /etc/systemd/system/virtual-display.service > /dev/null << 'EOF'
[Unit]
Description=Virtual Display for Computer Use
After=network.target

[Service]
Type=simple
User=ubuntu
Environment="DISPLAY=:1"
ExecStart=/home/ubuntu/start_display.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl enable virtual-display.service
sudo systemctl start virtual-display.service

# Set up Python environment
echo "Setting up Python environment..."
pip3 install --user \
    anthropic \
    pymongo \
    Pillow \
    pyvirtualdisplay

# Create test script
cat > ~/test_computer_use.py << 'EOF'
#!/usr/bin/env python3
import os
import subprocess
from PIL import Image

# Set display
os.environ['DISPLAY'] = ':1'

# Take a screenshot
print("Taking screenshot...")
result = subprocess.run(
    "xwd -root | convert xwd:- png:/tmp/test_screenshot.png",
    shell=True,
    capture_output=True
)

if result.returncode == 0:
    print("Screenshot saved to /tmp/test_screenshot.png")
    # Check if file exists and has content
    if os.path.exists('/tmp/test_screenshot.png'):
        img = Image.open('/tmp/test_screenshot.png')
        print(f"Screenshot size: {img.size}")
    else:
        print("Screenshot file not created!")
else:
    print(f"Screenshot failed: {result.stderr.decode()}")

# Test xdotool
print("\nTesting xdotool...")
result = subprocess.run(
    "xdotool getmouselocation",
    shell=True,
    capture_output=True,
    text=True
)
print(f"Mouse location: {result.stdout}")
EOF

chmod +x ~/test_computer_use.py

# Set environment variables
echo 'export DISPLAY=:1' >> ~/.bashrc
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.bashrc

echo ""
echo "Setup complete! Next steps:"
echo "1. Replace 'your-api-key-here' with your actual Anthropic API key in ~/.bashrc"
echo "2. Run 'source ~/.bashrc' to load environment variables"
echo "3. Run './start_display.sh' to start the virtual display"
echo "4. Run './test_computer_use.py' to test the setup"
echo ""
echo "For VNC access: Connect to VM_IP:5900 with any VNC client"