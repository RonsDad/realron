#!/bin/bash

# Official Claude Computer Use Setup for EC2
# Based on Anthropic's official documentation and reference implementation

set -e

echo "🚀 Claude Computer Use - Official Setup"
echo "======================================"

# Instance configuration
INSTANCE_IP="3.137.139.249"
SSH_KEY="ronscomputer.pem"
SSH_USER="ec2-user"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}✅ Target Instance: $INSTANCE_IP${NC}"

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key $SSH_KEY not found${NC}"
    exit 1
fi

chmod 400 "$SSH_KEY"

# Test SSH connection
echo -e "${YELLOW}🔍 Testing SSH connection...${NC}"
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$INSTANCE_IP" "echo 'SSH OK'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    exit 1
fi

# Create the official setup script based on Anthropic's reference implementation
cat > official-setup.sh << 'EOF'
#!/bin/bash

echo "🔧 Setting up Official Claude Computer Use Environment..."

# Update system
sudo yum update -y

# Install Docker (required for Anthropic's reference implementation)
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Python 3.11+ for the agent loop
sudo yum install -y python3.11 python3.11-pip

# Install X11 and desktop environment for computer use
sudo yum groupinstall -y "Server with GUI"
sudo yum install -y xorg-x11-server-Xvfb xfce4-session xfce4-panel firefox

# Install VNC for remote access
sudo yum install -y tigervnc-server

# Set up VNC
mkdir -p ~/.vnc
echo "claude2024" | vncpasswd -f > ~/.vnc/passwd
chmod 600 ~/.vnc/passwd

# Create VNC startup script
cat > ~/.vnc/xstartup << 'VNCEOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
exec startxfce4
VNCEOF

chmod +x ~/.vnc/xstartup

# Start VNC server with proper resolution (as per Anthropic docs: keep at or below 1280x800)
vncserver :1 -geometry 1280x800 -depth 24

# Clone Anthropic's official computer use reference implementation
cd ~
git clone https://github.com/anthropics/anthropic-quickstarts.git
cd anthropic-quickstarts/computer-use-demo

# Install Python dependencies for the reference implementation
python3.11 -m pip install --user --upgrade pip
python3.11 -m pip install --user anthropic

# Create environment file for API key
cat > .env << 'ENVEOF'
# Add your Anthropic API key here
ANTHROPIC_API_KEY=your_api_key_here

# Computer use configuration (as per official docs)
DISPLAY_WIDTH_PX=1280
DISPLAY_HEIGHT_PX=800
DISPLAY_NUMBER=1
ENVEOF

# Create a startup script for the computer use environment
cat > ~/start_computer_use.sh << 'STARTEOF'
#!/bin/bash

echo "🚀 Starting Claude Computer Use Environment"
echo "=========================================="

# Ensure VNC is running
vncserver :1 -geometry 1280x800 -depth 24 2>/dev/null || echo "VNC already running"

# Set display for X11 applications
export DISPLAY=:1

# Navigate to the computer use demo
cd ~/anthropic-quickstarts/computer-use-demo

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if API key is set
if [ "$ANTHROPIC_API_KEY" = "your_api_key_here" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Please set your ANTHROPIC_API_KEY in .env file"
    echo "Edit: ~/anthropic-quickstarts/computer-use-demo/.env"
    exit 1
fi

echo "✅ Environment ready!"
echo ""
echo "📋 Connection Info:"
echo "- VNC: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5901"
echo "- VNC Password: claude2024"
echo "- Display Resolution: 1280x800 (optimal for Claude)"
echo ""
echo "🔧 To run the computer use demo:"
echo "cd ~/anthropic-quickstarts/computer-use-demo"
echo "python3.11 -m computer_use_demo.loop"
echo ""
echo "📖 For more info, see: https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo"

STARTEOF

chmod +x ~/start_computer_use.sh

# Create a simple test script following official API format
cat > ~/test_computer_use_api.py << 'TESTEOF'
#!/usr/bin/env python3.11

import os
import anthropic
from anthropic import Anthropic

def test_computer_use_api():
    """Test Claude Computer Use API following official documentation"""
    
    # Check for API key
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key or api_key == 'your_api_key_here':
        print("❌ Please set ANTHROPIC_API_KEY in .env file")
        return False
    
    try:
        # Initialize Claude client
        client = Anthropic(api_key=api_key)
        
        # Test computer use API call (following official docs)
        response = client.beta.messages.create(
            model="claude-sonnet-4-20250514",  # Latest model with computer use
            max_tokens=1024,
            tools=[
                {
                    "type": "computer_20250124",  # Latest tool version
                    "name": "computer",
                    "display_width_px": 1280,
                    "display_height_px": 800,
                    "display_number": 1,
                }
            ],
            messages=[{
                "role": "user", 
                "content": "Take a screenshot and tell me what you see on the desktop"
            }],
            betas=["computer-use-2025-01-24"]  # Required beta flag
        )
        
        print("✅ Claude Computer Use API test successful!")
        print(f"Response: {response.content[0].text if response.content else 'No content'}")
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Claude Computer Use API")
    print("=================================")
    
    # Load environment
    if os.path.exists('.env'):
        with open('.env') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    test_computer_use_api()

TESTEOF

chmod +x ~/test_computer_use_api.py

echo "✅ Official Claude Computer Use setup complete!"
echo ""
echo "📋 What was installed:"
echo "- Anthropic's official computer-use-demo from GitHub"
echo "- Docker and Docker Compose"
echo "- X11 virtual display (Xvfb)"
echo "- VNC server for remote desktop access"
echo "- Python 3.11 with Anthropic SDK"
echo ""
echo "🔧 Next steps:"
echo "1. Edit ~/.env file with your ANTHROPIC_API_KEY"
echo "2. Run: ~/start_computer_use.sh"
echo "3. Connect via VNC to see Claude's desktop interactions"
echo "4. Follow Anthropic's official documentation for advanced usage"

EOF

# Upload and execute setup
echo -e "${YELLOW}📤 Uploading official setup script...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no official-setup.sh "$SSH_USER@$INSTANCE_IP:~/"

echo -e "${YELLOW}🔧 Running official setup...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$INSTANCE_IP" "chmod +x ~/official-setup.sh && ~/official-setup.sh"

# Clean up
rm -f official-setup.sh

echo -e "${GREEN}🎉 Official Claude Computer Use Setup Complete!${NC}"
echo ""
echo "📋 Your EC2 instance now has:"
echo "- Anthropic's official computer-use-demo"
echo "- Proper X11 virtual display setup"
echo "- VNC access for monitoring Claude's actions"
echo "- Latest API specifications (computer_20250124)"
echo ""
echo "🔧 Next steps:"
echo "1. SSH: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP"
echo "2. Edit API key: nano ~/anthropic-quickstarts/computer-use-demo/.env"
echo "3. Start environment: ~/start_computer_use.sh"
echo "4. Connect VNC: $INSTANCE_IP:5901 (password: claude2024)"
echo ""
echo "📖 Official docs: https://docs.anthropic.com/en/docs/build-with-claude/computer-use"
