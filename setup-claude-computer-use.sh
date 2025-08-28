#!/bin/bash

# Claude Computer Use Setup Script for Existing EC2 Instance
# Configures your EC2 instance for Claude's computer use capability

set -e

echo "🚀 Claude Computer Use - EC2 Setup"
echo "=================================="

# Instance configuration
INSTANCE_IP="3.137.139.249"
SSH_KEY="ronscomputer.pem"
SSH_USER="ec2-user"  # or ubuntu if using Ubuntu AMI

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}✅ Target Instance: $INSTANCE_IP${NC}"

# Check if SSH key exists and has correct permissions
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key $SSH_KEY not found${NC}"
    exit 1
fi

chmod 400 "$SSH_KEY"
echo -e "${GREEN}✅ SSH key permissions set${NC}"

# Test SSH connection
echo -e "${YELLOW}🔍 Testing SSH connection...${NC}"
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$INSTANCE_IP" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed. Please check:${NC}"
    echo "1. Instance is running"
    echo "2. Security group allows SSH (port 22)"
    echo "3. SSH key is correct"
    exit 1
fi

# Create remote setup script
cat > remote-setup.sh << 'EOF'
#!/bin/bash

echo "🔧 Setting up Claude Computer Use environment..."

# Update system
sudo yum update -y || sudo apt update -y

# Install Python 3.11+ and pip
if command -v yum &> /dev/null; then
    # Amazon Linux/RHEL
    sudo yum install -y python3.11 python3.11-pip git docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker $USER
elif command -v apt &> /dev/null; then
    # Ubuntu/Debian
    sudo apt install -y python3.11 python3.11-pip git docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker $USER
fi

# Install desktop environment (XFCE - lightweight)
if command -v yum &> /dev/null; then
    sudo yum groupinstall -y "Server with GUI" || sudo yum groupinstall -y "GNOME Desktop"
    sudo yum install -y xfce4-session xfce4-panel xfce4-desktop tigervnc-server
elif command -v apt &> /dev/null; then
    sudo apt install -y ubuntu-desktop-minimal xfce4 xfce4-goodies tightvncserver
fi

# Install Chrome for browser automation
if command -v yum &> /dev/null; then
    sudo yum install -y chromium
elif command -v apt &> /dev/null; then
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
    sudo apt update
    sudo apt install -y google-chrome-stable
fi

# Install Python dependencies for Claude Computer Use
python3.11 -m pip install --user --upgrade pip
python3.11 -m pip install --user anthropic pillow pyautogui opencv-python-headless selenium webdriver-manager

# Set up VNC server
mkdir -p ~/.vnc
echo "claude123" | vncpasswd -f > ~/.vnc/passwd
chmod 600 ~/.vnc/passwd

# Create VNC startup script
cat > ~/.vnc/xstartup << 'VNCEOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
exec startxfce4 &
VNCEOF

chmod +x ~/.vnc/xstartup

# Start VNC server
vncserver :1 -geometry 1920x1080 -depth 24 || echo "VNC server may already be running"

# Create Claude Computer Use directory
mkdir -p ~/claude-computer-use
cd ~/claude-computer-use

# Create a simple test script
cat > test_computer_use.py << 'PYTHONEOF'
#!/usr/bin/env python3.11

import os
import sys
from anthropic import Anthropic

def test_claude_setup():
    """Test Claude API connection and computer use setup"""
    
    # Check for API key
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ ANTHROPIC_API_KEY environment variable not set")
        print("Please set it with: export ANTHROPIC_API_KEY='your-api-key'")
        return False
    
    try:
        # Initialize Claude client
        client = Anthropic(api_key=api_key)
        
        # Test basic API connection
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[{"role": "user", "content": "Hello, can you see this message?"}]
        )
        
        print("✅ Claude API connection successful")
        print(f"Response: {message.content[0].text}")
        return True
        
    except Exception as e:
        print(f"❌ Claude API connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Claude Computer Use Setup")
    print("===================================")
    
    # Test Python installation
    print(f"✅ Python version: {sys.version}")
    
    # Test imports
    try:
        import anthropic
        print("✅ Anthropic library installed")
    except ImportError:
        print("❌ Anthropic library not installed")
        sys.exit(1)
    
    try:
        import PIL
        print("✅ PIL (Pillow) installed")
    except ImportError:
        print("❌ PIL (Pillow) not installed")
    
    try:
        import pyautogui
        print("✅ PyAutoGUI installed")
    except ImportError:
        print("❌ PyAutoGUI not installed")
    
    # Test Claude API
    test_claude_setup()
    
    print("\n🎉 Setup test complete!")
    print("Next steps:")
    print("1. Set ANTHROPIC_API_KEY environment variable")
    print("2. Connect via VNC to see the desktop: <instance-ip>:5901")
    print("3. VNC password: claude123")
PYTHONEOF

chmod +x test_computer_use.py

echo "✅ Claude Computer Use environment setup complete!"
echo ""
echo "📋 Setup Summary:"
echo "- Desktop environment installed (XFCE)"
echo "- VNC server running on :1 (port 5901)"
echo "- VNC password: claude123"
echo "- Python 3.11 and dependencies installed"
echo "- Test script created: ~/claude-computer-use/test_computer_use.py"
echo ""
echo "🔧 Next steps:"
echo "1. Set your Anthropic API key: export ANTHROPIC_API_KEY='your-key'"
echo "2. Run test: cd ~/claude-computer-use && python3.11 test_computer_use.py"
echo "3. Connect via VNC viewer to $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5901"

EOF

# Copy and execute the setup script on the remote instance
echo -e "${YELLOW}📤 Uploading setup script to instance...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no remote-setup.sh "$SSH_USER@$INSTANCE_IP:~/"

echo -e "${YELLOW}🔧 Executing setup script on instance...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$INSTANCE_IP" "chmod +x ~/remote-setup.sh && ~/remote-setup.sh"

# Clean up local files
rm -f remote-setup.sh

echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "📋 Your Claude Computer Use instance is ready:"
echo "- Instance IP: $INSTANCE_IP"
echo "- SSH: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP"
echo "- VNC: $INSTANCE_IP:5901 (password: claude123)"
echo ""
echo "🔧 Next steps:"
echo "1. SSH into the instance"
echo "2. Set your Anthropic API key"
echo "3. Test the setup"
echo "4. Upload your claude-computer-use code"
