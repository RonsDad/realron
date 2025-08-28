#!/bin/bash

# Custom Claude Computer Use Implementation for EC2
# Direct implementation without using Anthropic's demo

set -e

echo "🚀 Implementing Claude Computer Use Solution"
echo "==========================================="

# Instance configuration
INSTANCE_IP="3.137.139.249"
SSH_KEY="ronscomputer.pem"
SSH_USER="ec2-user"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}✅ Target Instance: $INSTANCE_IP${NC}"

# Check SSH key
chmod 400 "$SSH_KEY"

# Create the implementation script
cat > implement-computer-use.sh << 'EOF'
#!/bin/bash

echo "🔧 Implementing Claude Computer Use Environment..."

# Update system
sudo yum update -y

# Install required packages
sudo yum install -y python3.11 python3.11-pip git
sudo yum install -y xorg-x11-server-Xvfb xorg-x11-xauth xorg-x11-apps
sudo yum install -y firefox chromium
sudo yum install -y tigervnc-server

# Install Python dependencies
python3.11 -m pip install --user --upgrade pip
python3.11 -m pip install --user anthropic pillow pyautogui opencv-python-headless selenium webdriver-manager pynput

# Set up X11 virtual display
export DISPLAY=:1
Xvfb :1 -screen 0 1280x800x24 &
echo $! > /tmp/xvfb.pid

# Set up VNC
mkdir -p ~/.vnc
echo "claude2024" | vncpasswd -f > ~/.vnc/passwd
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

# Start VNC server
vncserver :1 -geometry 1280x800 -depth 24

# Create the computer use implementation directory
mkdir -p ~/claude-computer-use-impl
cd ~/claude-computer-use-impl

# Create the main computer use tool implementation
cat > computer_use_tool.py << 'PYTHONEOF'
#!/usr/bin/env python3.11

import os
import base64
import time
import subprocess
from io import BytesIO
from PIL import Image, ImageGrab
import pyautogui
from pynput import mouse, keyboard
from pynput.mouse import Button, Listener as MouseListener
from pynput.keyboard import Key, Listener as KeyboardListener

class ComputerUseTool:
    """Custom implementation of Claude Computer Use tool"""
    
    def __init__(self, display_width=1280, display_height=800, display_number=1):
        self.display_width = display_width
        self.display_height = display_height
        self.display_number = display_number
        
        # Set up display
        os.environ['DISPLAY'] = f':{display_number}'
        
        # Configure pyautogui
        pyautogui.FAILSAFE = False
        pyautogui.PAUSE = 0.1
        
    def screenshot(self):
        """Take a screenshot of the virtual display"""
        try:
            # Use xwd to capture the X11 display
            result = subprocess.run([
                'xwd', '-root', '-display', f':{self.display_number}', '-out', '/tmp/screenshot.xwd'
            ], capture_output=True, text=True)
            
            if result.returncode != 0:
                return {"error": "Failed to capture screenshot"}
            
            # Convert xwd to png using ImageMagick
            subprocess.run(['convert', '/tmp/screenshot.xwd', '/tmp/screenshot.png'])
            
            # Read and encode the image
            with open('/tmp/screenshot.png', 'rb') as f:
                image_data = f.read()
                encoded_image = base64.b64encode(image_data).decode('utf-8')
            
            return {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": encoded_image
                }
            }
            
        except Exception as e:
            return {"error": f"Screenshot failed: {str(e)}"}
    
    def left_click(self, coordinate):
        """Perform left mouse click at coordinates"""
        try:
            x, y = coordinate
            if not (0 <= x < self.display_width and 0 <= y < self.display_height):
                return {"error": f"Coordinates {coordinate} out of bounds"}
            
            # Use xdotool for X11 click
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)])
            subprocess.run(['xdotool', 'click', '1'])
            
            return {"result": f"Clicked at {coordinate}"}
            
        except Exception as e:
            return {"error": f"Click failed: {str(e)}"}
    
    def right_click(self, coordinate):
        """Perform right mouse click at coordinates"""
        try:
            x, y = coordinate
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)])
            subprocess.run(['xdotool', 'click', '3'])
            return {"result": f"Right-clicked at {coordinate}"}
        except Exception as e:
            return {"error": f"Right-click failed: {str(e)}"}
    
    def double_click(self, coordinate):
        """Perform double click at coordinates"""
        try:
            x, y = coordinate
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)])
            subprocess.run(['xdotool', 'click', '--repeat', '2', '1'])
            return {"result": f"Double-clicked at {coordinate}"}
        except Exception as e:
            return {"error": f"Double-click failed: {str(e)}"}
    
    def type_text(self, text):
        """Type text using keyboard"""
        try:
            # Escape special characters for xdotool
            escaped_text = text.replace('"', '\\"').replace("'", "\\'")
            subprocess.run(['xdotool', 'type', escaped_text])
            return {"result": f"Typed: {text}"}
        except Exception as e:
            return {"error": f"Type failed: {str(e)}"}
    
    def key_press(self, key):
        """Press a key or key combination"""
        try:
            # Handle key combinations like ctrl+c
            if '+' in key:
                keys = key.split('+')
                cmd = ['xdotool', 'key']
                for k in keys:
                    cmd.append(k.strip())
                subprocess.run(cmd)
            else:
                subprocess.run(['xdotool', 'key', key])
            
            return {"result": f"Pressed key: {key}"}
        except Exception as e:
            return {"error": f"Key press failed: {str(e)}"}
    
    def scroll(self, coordinate, scroll_direction="down", scroll_amount=3):
        """Scroll at coordinates"""
        try:
            x, y = coordinate
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)])
            
            # Convert direction to xdotool button numbers
            if scroll_direction == "down":
                button = "5"
            elif scroll_direction == "up":
                button = "4"
            else:
                return {"error": f"Invalid scroll direction: {scroll_direction}"}
            
            # Perform scroll
            for _ in range(scroll_amount):
                subprocess.run(['xdotool', 'click', button])
                time.sleep(0.1)
            
            return {"result": f"Scrolled {scroll_direction} {scroll_amount} times at {coordinate}"}
        except Exception as e:
            return {"error": f"Scroll failed: {str(e)}"}
    
    def left_click_drag(self, start_coordinate, end_coordinate):
        """Click and drag from start to end coordinates"""
        try:
            x1, y1 = start_coordinate
            x2, y2 = end_coordinate
            
            subprocess.run(['xdotool', 'mousemove', str(x1), str(y1)])
            subprocess.run(['xdotool', 'mousedown', '1'])
            subprocess.run(['xdotool', 'mousemove', str(x2), str(y2)])
            subprocess.run(['xdotool', 'mouseup', '1'])
            
            return {"result": f"Dragged from {start_coordinate} to {end_coordinate}"}
        except Exception as e:
            return {"error": f"Drag failed: {str(e)}"}
    
    def mouse_move(self, coordinate):
        """Move mouse to coordinates"""
        try:
            x, y = coordinate
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)])
            return {"result": f"Moved mouse to {coordinate}"}
        except Exception as e:
            return {"error": f"Mouse move failed: {str(e)}"}
    
    def wait(self, seconds):
        """Wait for specified seconds"""
        try:
            time.sleep(seconds)
            return {"result": f"Waited {seconds} seconds"}
        except Exception as e:
            return {"error": f"Wait failed: {str(e)}"}
    
    def execute_action(self, action_data):
        """Execute a computer use action"""
        action = action_data.get("action")
        
        if action == "screenshot":
            return self.screenshot()
        elif action == "left_click":
            return self.left_click(action_data["coordinate"])
        elif action == "right_click":
            return self.right_click(action_data["coordinate"])
        elif action == "double_click":
            return self.double_click(action_data["coordinate"])
        elif action == "type":
            return self.type_text(action_data["text"])
        elif action == "key":
            return self.key_press(action_data["key"])
        elif action == "scroll":
            return self.scroll(
                action_data["coordinate"],
                action_data.get("scroll_direction", "down"),
                action_data.get("scroll_amount", 3)
            )
        elif action == "left_click_drag":
            return self.left_click_drag(
                action_data["startCoordinate"],
                action_data["endCoordinate"]
            )
        elif action == "mouse_move":
            return self.mouse_move(action_data["coordinate"])
        elif action == "wait":
            return self.wait(action_data.get("seconds", 1))
        else:
            return {"error": f"Unknown action: {action}"}

PYTHONEOF

# Create the Claude API client implementation
cat > claude_computer_client.py << 'PYTHONEOF'
#!/usr/bin/env python3.11

import os
import json
from anthropic import Anthropic
from computer_use_tool import ComputerUseTool

class ClaudeComputerClient:
    """Claude Computer Use client implementation"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found")
        
        self.client = Anthropic(api_key=self.api_key)
        self.computer_tool = ComputerUseTool()
        
    def create_computer_use_request(self, user_message, max_tokens=2000):
        """Create a computer use request to Claude"""
        return self.client.beta.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=max_tokens,
            tools=[{
                "type": "computer_20250124",
                "name": "computer",
                "display_width_px": 1280,
                "display_height_px": 800,
                "display_number": 1,
            }],
            messages=[{
                "role": "user",
                "content": user_message
            }],
            betas=["computer-use-2025-01-24"]
        )
    
    def execute_computer_task(self, task_description, max_iterations=10):
        """Execute a computer use task with agent loop"""
        messages = [{
            "role": "user",
            "content": task_description
        }]
        
        print(f"🎯 Starting task: {task_description}")
        
        for iteration in range(max_iterations):
            print(f"\n🔄 Iteration {iteration + 1}")
            
            # Call Claude API
            response = self.client.beta.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                tools=[{
                    "type": "computer_20250124",
                    "name": "computer",
                    "display_width_px": 1280,
                    "display_height_px": 800,
                    "display_number": 1,
                }],
                messages=messages,
                betas=["computer-use-2025-01-24"]
            )
            
            # Add Claude's response to conversation
            messages.append({
                "role": "assistant",
                "content": response.content
            })
            
            # Process tool use requests
            tool_results = []
            for content in response.content:
                if content.type == "tool_use":
                    print(f"🔧 Executing: {content.input.get('action', 'unknown')}")
                    
                    # Execute the computer action
                    result = self.computer_tool.execute_action(content.input)
                    
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": content.id,
                        "content": json.dumps(result)
                    })
                elif content.type == "text":
                    print(f"💬 Claude: {content.text}")
            
            # If no tools used, task complete
            if not tool_results:
                print("✅ Task completed!")
                break
            
            # Continue with tool results
            messages.append({
                "role": "user",
                "content": tool_results
            })
        
        return messages

if __name__ == "__main__":
    # Test the implementation
    try:
        client = ClaudeComputerClient()
        client.execute_computer_task("Take a screenshot and tell me what you see")
    except Exception as e:
        print(f"❌ Error: {e}")

PYTHONEOF

# Create environment configuration
cat > .env << 'ENVEOF'
# Claude Computer Use Configuration
ANTHROPIC_API_KEY=your_api_key_here
DISPLAY_WIDTH_PX=1280
DISPLAY_HEIGHT_PX=800
DISPLAY_NUMBER=1
ENVEOF

# Create startup script
cat > start_computer_use.sh << 'STARTEOF'
#!/bin/bash

echo "🚀 Starting Claude Computer Use Implementation"
echo "============================================="

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check API key
if [ "$ANTHROPIC_API_KEY" = "your_api_key_here" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Please set your ANTHROPIC_API_KEY in .env file"
    exit 1
fi

# Ensure X11 display is running
export DISPLAY=:1
if ! pgrep Xvfb > /dev/null; then
    echo "🖥️  Starting X11 virtual display..."
    Xvfb :1 -screen 0 1280x800x24 &
    sleep 2
fi

# Ensure VNC is running
if ! pgrep vnc > /dev/null; then
    echo "🔗 Starting VNC server..."
    vncserver :1 -geometry 1280x800 -depth 24
fi

echo "✅ Environment ready!"
echo ""
echo "📋 Connection Info:"
echo "- VNC: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5901"
echo "- VNC Password: claude2024"
echo ""
echo "🧪 Test the implementation:"
echo "python3.11 claude_computer_client.py"

STARTEOF

chmod +x start_computer_use.sh

# Install xdotool for X11 automation
sudo yum install -y xdotool ImageMagick

echo "✅ Claude Computer Use Implementation Complete!"
echo ""
echo "📁 Created files:"
echo "- computer_use_tool.py (Core implementation)"
echo "- claude_computer_client.py (API client)"
echo "- .env (Configuration)"
echo "- start_computer_use.sh (Startup script)"
echo ""
echo "🔧 Next steps:"
echo "1. Edit .env with your ANTHROPIC_API_KEY"
echo "2. Run: ./start_computer_use.sh"
echo "3. Test: python3.11 claude_computer_client.py"

EOF

# Upload and execute implementation
echo -e "${YELLOW}📤 Uploading implementation...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no implement-computer-use.sh "$SSH_USER@$INSTANCE_IP:~/"

echo -e "${YELLOW}🔧 Running implementation...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$INSTANCE_IP" "chmod +x ~/implement-computer-use.sh && ~/implement-computer-use.sh"

# Clean up
rm -f implement-computer-use.sh

echo -e "${GREEN}🎉 Claude Computer Use Implementation Complete!${NC}"
echo ""
echo "📋 Custom implementation deployed:"
echo "- Direct computer use tool implementation"
echo "- Claude API client with agent loop"
echo "- X11 virtual display and VNC access"
echo "- All actions supported (click, type, scroll, drag, etc.)"
echo ""
echo "🔧 Next steps:"
echo "1. SSH: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP"
echo "2. cd ~/claude-computer-use-impl"
echo "3. Edit .env with your API key"
echo "4. Run: ./start_computer_use.sh"
echo "5. Test: python3.11 claude_computer_client.py"
