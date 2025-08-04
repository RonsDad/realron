#!/bin/bash
# Claude Computer Use Environment Startup Script

set -e

# Load environment variables
if [ -f "/home/ubuntu/claude-agent/.env" ]; then
    export $(cat /home/ubuntu/claude-agent/.env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found. Please run setup-environment.sh first."
    exit 1
fi

echo "🚀 Starting Claude Computer Use Environment..."

# Set display environment
export DISPLAY=:1

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "Xvfb :1" || true
pkill -f "mutter" || true
pkill -f "tint2" || true
pkill -f "x11vnc" || true
pkill -f "openvscode-server" || true

# Wait for cleanup
sleep 2

# Start virtual display
echo "🖥️ Starting virtual display..."
Xvfb :1 -screen 0 ${SCREEN_WIDTH:-1024}x${SCREEN_HEIGHT:-768}x24 -ac &
XVFB_PID=$!

# Wait for X server to start
sleep 3

# Start window manager
echo "🪟 Starting window manager..."
DISPLAY=:1 mutter --replace &
MUTTER_PID=$!

# Start panel
echo "📊 Starting desktop panel..."
DISPLAY=:1 tint2 &
TINT2_PID=$!

# Set VNC password
echo "🔐 Setting up VNC access..."
mkdir -p ~/.vnc
echo "${VNC_PASSWORD:-claude123}" | vncpasswd -f > ~/.vnc/passwd
chmod 600 ~/.vnc/passwd

# Start VNC server
echo "🌐 Starting VNC server..."
DISPLAY=:1 x11vnc -forever -usepw -display :1 -rfbport 5901 &
VNC_PID=$!

# Start OpenVSCode Server
echo "💻 Starting OpenVSCode Server..."
openvscode-server --host 0.0.0.0 --port 3000 --without-connection-token &
VSCODE_PID=$!

# Wait for services to start
sleep 5

# Test X11 display
echo "🧪 Testing X11 display..."
DISPLAY=:1 xdpyinfo > /dev/null 2>&1 && echo "✅ X11 display working" || echo "❌ X11 display failed"

# Open a terminal for testing
echo "🖥️ Opening test terminal..."
DISPLAY=:1 gnome-terminal &

# Start Claude agent
echo "🤖 Starting Claude Computer Use Agent..."
cd /home/ubuntu/claude-agent
source venv/bin/activate

# Create a simple test script
cat > test_claude.py << 'EOF'
#!/usr/bin/env python3
import asyncio
from claude_computer_agent import ComputerUseAgent
import os

async def test_agent():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        print("❌ Please set ANTHROPIC_API_KEY in .env file")
        return
    
    agent = ComputerUseAgent(api_key)
    
    # Test screenshot
    print("📸 Testing screenshot...")
    screenshot_result = agent.execute_computer_action("screenshot")
    if "error" not in screenshot_result:
        print("✅ Screenshot working")
    else:
        print(f"❌ Screenshot failed: {screenshot_result}")
    
    print("🎯 Agent ready for requests!")

if __name__ == "__main__":
    asyncio.run(test_agent())
EOF

# Save process IDs for cleanup
cat > /tmp/claude-env-pids << EOF
XVFB_PID=$XVFB_PID
MUTTER_PID=$MUTTER_PID
TINT2_PID=$TINT2_PID
VNC_PID=$VNC_PID
VSCODE_PID=$VSCODE_PID
EOF

echo "✅ Environment started successfully!"
echo ""
echo "📋 Access Information:"
echo "  🌐 VNC: localhost:5901 (password: ${VNC_PASSWORD:-claude123})"
echo "  💻 VSCode: http://localhost:3000"
echo "  🖥️ Display: :1 (${SCREEN_WIDTH:-1024}x${SCREEN_HEIGHT:-768})"
echo ""
echo "🚀 To start the Claude agent:"
echo "  cd /home/ubuntu/claude-agent"
echo "  source venv/bin/activate"
echo "  python claude_computer_agent.py"
echo ""
echo "🧪 To test the setup:"
echo "  python test_claude.py"
echo ""
echo "🛑 To stop all services:"
echo "  ./stop-claude-env.sh"

# Keep script running
echo "🔄 Environment running... Press Ctrl+C to stop"
trap 'echo "🛑 Stopping environment..."; ./stop-claude-env.sh; exit 0' INT

# Run test
python test_claude.py

# Start interactive agent
python claude_computer_agent.py
