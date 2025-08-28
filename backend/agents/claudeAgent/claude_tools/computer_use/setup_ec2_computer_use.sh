#!/bin/bash

# Official Claude Computer Use EC2 Setup Script
# Sets up EC2 instance for computer-use-2025-01-24 specifications

set -e

echo "🚀 Setting up Official Claude Computer Use on EC2"
echo "================================================"

# Instance configuration
INSTANCE_IP="3.137.139.249"
SSH_KEY="/Users/timhunter/ron-ai/ronscomputer.pem"
SSH_USER="ec2-user"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Create the setup script for EC2
cat > ec2_setup.sh << 'EOF'
#!/bin/bash

echo "🔧 Setting up Official Claude Computer Use Environment..."

# Update system
sudo yum update -y

# Install required packages for X11 and desktop environment
sudo yum install -y python3.11 python3.11-pip git
sudo yum install -y xorg-x11-server-Xvfb xorg-x11-xauth xorg-x11-apps xdotool
sudo yum install -y ImageMagick firefox chromium
sudo yum install -y tigervnc-server

# Install Python dependencies
python3.11 -m pip install --user --upgrade pip
python3.11 -m pip install --user anthropic pillow pyautogui opencv-python-headless

# Set up X11 virtual display (following Anthropic specs: 1280x800 max)
export DISPLAY=:1

# Kill any existing Xvfb processes
pkill Xvfb || true

# Start Xvfb with optimal resolution
Xvfb :1 -screen 0 1280x800x24 &
echo $! > /tmp/xvfb.pid
sleep 2

# Set up VNC for monitoring
mkdir -p ~/.vnc
echo "claude2025" | vncpasswd -f > ~/.vnc/passwd
chmod 600 ~/.vnc/passwd

cat > ~/.vnc/xstartup << 'VNCEOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export DISPLAY=:1
xsetroot -solid grey
firefox &
VNCEOF

chmod +x ~/.vnc/xstartup

# Kill any existing VNC processes
vncserver -kill :1 || true
sleep 1

# Start VNC server with official resolution
vncserver :1 -geometry 1280x800 -depth 24

# Install and setup noVNC (free web VNC client)
cd ~
git clone https://github.com/novnc/noVNC.git
cd noVNC

# Start noVNC web server
./utils/novnc_proxy --vnc localhost:5901 --listen 6080 &
echo $! > /tmp/novnc.pid

# Create computer use directory
mkdir -p ~/ron-ai-computer-use
cd ~/ron-ai-computer-use

# Create environment configuration
cat > .env << 'ENVEOF'
# Official Claude Computer Use Configuration
ANTHROPIC_API_KEY=your_api_key_here

# Display configuration (following Anthropic specs)
DISPLAY_WIDTH_PX=1280
DISPLAY_HEIGHT_PX=800
DISPLAY_NUMBER=1

# Model configuration
CLAUDE_MODEL=claude-sonnet-4-20250514
TOOL_VERSION=computer_20250124
BETA_FLAG=computer-use-2025-01-24
ENVEOF

# Create startup script
cat > start_computer_use.sh << 'STARTEOF'
#!/bin/bash

echo "🚀 Starting Official Claude Computer Use Environment"
echo "=================================================="

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check API key
if [ "$ANTHROPIC_API_KEY" = "your_api_key_here" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Please set your ANTHROPIC_API_KEY in .env file"
    echo "Edit: ~/ron-ai-computer-use/.env"
    exit 1
fi

# Ensure X11 display is running
export DISPLAY=:1
if ! pgrep Xvfb > /dev/null; then
    echo "🖥️  Starting X11 virtual display..."
    Xvfb :1 -screen 0 1280x800x24 &
    echo $! > /tmp/xvfb.pid
    sleep 2
fi

# Ensure VNC is running
if ! pgrep vnc > /dev/null; then
    echo "🔗 Starting VNC server..."
    vncserver :1 -geometry 1280x800 -depth 24
fi

# Ensure noVNC web interface is running
if ! pgrep novnc > /dev/null; then
    echo "🌐 Starting web VNC interface..."
    cd ~/noVNC
    ./utils/novnc_proxy --vnc localhost:5901 --listen 6080 &
    echo $! > /tmp/novnc.pid
fi

echo "✅ Official Claude Computer Use Environment Ready!"
echo ""
echo "📋 Configuration:"
echo "- Model: $CLAUDE_MODEL"
echo "- Tool Version: $TOOL_VERSION"
echo "- Beta Flag: $BETA_FLAG"
echo "- Display: ${DISPLAY_WIDTH_PX}x${DISPLAY_HEIGHT_PX}"
echo ""
echo "🔗 Access:"
echo "- Web VNC: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):6080/vnc.html"
echo "- Direct VNC: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5901"
echo "- VNC Password: claude2025"
echo ""
echo "🧪 Test the implementation:"
echo "python3.11 -c \"import sys; sys.path.append('.'); from official_computer_use_tool import execute_official_computer_use; import asyncio; asyncio.run(execute_official_computer_use({'task': 'Take a screenshot'}))\" "

STARTEOF

chmod +x start_computer_use.sh

# Create test script
cat > test_official_implementation.py << 'TESTEOF'
#!/usr/bin/env python3.11

"""
Test script for Official Claude Computer Use Implementation
"""

import os
import sys
import asyncio
import json

# Add current directory to path
sys.path.append('.')

async def test_official_computer_use():
    """Test the official implementation"""
    
    print("🧪 Testing Official Claude Computer Use Implementation")
    print("===================================================")
    
    # Load environment variables
    if os.path.exists('.env'):
        with open('.env') as f:
            for line in f:
                if line.strip() and not line.startswith('#') and '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    # Check API key
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key or api_key == 'your_api_key_here':
        print("❌ Please set ANTHROPIC_API_KEY in .env file")
        return False
    
    try:
        # Import the official implementation
        from official_computer_use_tool import execute_official_computer_use
        
        print("✅ Official implementation imported successfully")
        
        # Test basic screenshot
        test_input = {
            "task": "Take a screenshot and describe what you see",
            "max_iterations": 3
        }
        
        print("🔄 Testing screenshot capability...")
        result = await execute_official_computer_use(test_input)
        
        if result.get("success"):
            print("✅ Screenshot test successful!")
            print(f"Iterations used: {result.get('iterations', 'unknown')}")
            if result.get('final_response'):
                print(f"Claude's response: {result['final_response'][:200]}...")
        else:
            print(f"❌ Screenshot test failed: {result.get('error', 'Unknown error')}")
            return False
        
        print("\n🎉 All tests passed!")
        print("Official Claude Computer Use implementation is working correctly!")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_official_computer_use())

TESTEOF

chmod +x test_official_implementation.py

echo "✅ Official Claude Computer Use setup complete!"
echo ""
echo "📋 What was installed:"
echo "- X11 virtual display (Xvfb) with 1280x800 resolution"
echo "- VNC server for remote desktop monitoring"
echo "- xdotool for mouse/keyboard control"
echo "- ImageMagick for screenshot processing"
echo "- Python 3.11 with Anthropic SDK"
echo "- Firefox and Chromium browsers"
echo ""
echo "📁 Files created:"
echo "- .env (configuration file)"
echo "- start_computer_use.sh (startup script)"
echo "- test_official_implementation.py (test script)"
echo ""
echo "🔧 Next steps:"
echo "1. Edit .env file with your ANTHROPIC_API_KEY"
echo "2. Run: ./start_computer_use.sh"
echo "3. Test: python3.11 test_official_implementation.py"
echo "4. Connect via VNC to monitor Claude's actions"
echo ""
echo "🔗 VNC Access:"
echo "- Address: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5901"
echo "- Password: claude2025"

EOF

# Upload setup script to EC2
echo -e "${YELLOW}📤 Uploading setup script to EC2...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2_setup.sh "$SSH_USER@$INSTANCE_IP:~/"

# Execute setup on EC2 first to create directories
echo -e "${YELLOW}🔧 Running setup on EC2 instance...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$INSTANCE_IP" "chmod +x ~/ec2_setup.sh && ~/ec2_setup.sh"

# Upload the official computer use tool after directory is created
echo -e "${YELLOW}📤 Uploading official computer use implementation...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no official_computer_use_tool.py "$SSH_USER@$INSTANCE_IP:~/ron-ai-computer-use/"

# Clean up local files
rm -f ec2_setup.sh

echo -e "${GREEN}🎉 Official Claude Computer Use Setup Complete!${NC}"
echo ""
echo "📋 Your EC2 instance now has:"
echo "- Official computer-use-2025-01-24 implementation"
echo "- X11 virtual display (1280x800 - Anthropic recommended)"
echo "- VNC access for monitoring Claude's actions"
echo "- All required dependencies and tools"
echo ""
echo "🔧 Next steps:"
echo "1. SSH: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP"
echo "2. cd ~/ron-ai-computer-use"
echo "3. Edit .env with your ANTHROPIC_API_KEY"
echo "4. Run: ./start_computer_use.sh"
echo "5. Test: python3.11 test_official_implementation.py"
echo ""
echo "🔗 VNC Access:"
echo "- Web Browser: http://$INSTANCE_IP:6080/vnc.html"
echo "- VNC Client: $INSTANCE_IP:5901"
echo "- Password: claude2025"
echo ""
echo "📖 Official Anthropic Specs Implemented:"
echo "- Model: claude-sonnet-4-20250514"
echo "- Tool Version: computer_20250124"
echo "- Beta Flag: computer-use-2025-01-24"
echo "- All enhanced actions supported"
