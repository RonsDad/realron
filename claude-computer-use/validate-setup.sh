#!/bin/bash
# Validation and Troubleshooting Script for Claude Computer Use Environment

echo "🔍 Validating Claude Computer Use Environment..."
echo "=" * 60

# Check if running as correct user
if [ "$USER" != "ubuntu" ]; then
    echo "⚠️ Warning: Should be run as ubuntu user"
fi

# Check environment variables
echo "📋 Environment Variables:"
echo "  DISPLAY: ${DISPLAY:-Not set}"
echo "  ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+Set (hidden)}${ANTHROPIC_API_KEY:-Not set}"

# Check required packages
echo ""
echo "📦 Package Installation:"
packages=("xvfb" "mutter" "tint2" "x11vnc" "firefox" "python3" "nodejs")
for package in "${packages[@]}"; do
    if command -v $package >/dev/null 2>&1 || dpkg -l | grep -q $package; then
        echo "  ✅ $package: Installed"
    else
        echo "  ❌ $package: Missing"
    fi
done

# Check Node.js and npm versions
echo ""
echo "🟢 Node.js Environment:"
if command -v node >/dev/null 2>&1; then
    echo "  ✅ Node.js: $(node --version)"
else
    echo "  ❌ Node.js: Not installed"
fi

if command -v npm >/dev/null 2>&1; then
    echo "  ✅ npm: $(npm --version)"
else
    echo "  ❌ npm: Not installed"
fi

# Check Claude CLI
echo ""
echo "🤖 Claude CLI:"
if command -v claude >/dev/null 2>&1; then
    echo "  ✅ Claude CLI: $(claude --version 2>/dev/null || echo 'Installed')"
else
    echo "  ❌ Claude CLI: Not installed"
    echo "     Install with: npm install -g @anthropic/claude-code"
fi

# Check Python environment
echo ""
echo "🐍 Python Environment:"
if [ -d "/home/ubuntu/claude-agent/venv" ]; then
    echo "  ✅ Virtual environment: Exists"
    
    # Activate and check packages
    source /home/ubuntu/claude-agent/venv/bin/activate
    
    python_packages=("anthropic" "pillow" "pyautogui" "pynput")
    for package in "${python_packages[@]}"; do
        if pip show $package >/dev/null 2>&1; then
            echo "  ✅ $package: Installed"
        else
            echo "  ❌ $package: Missing"
        fi
    done
else
    echo "  ❌ Virtual environment: Not found"
fi

# Check X11 display
echo ""
echo "🖥️ X11 Display:"
if pgrep -f "Xvfb :1" >/dev/null; then
    echo "  ✅ Xvfb: Running"
else
    echo "  ❌ Xvfb: Not running"
fi

if DISPLAY=:1 xdpyinfo >/dev/null 2>&1; then
    echo "  ✅ Display :1: Accessible"
else
    echo "  ❌ Display :1: Not accessible"
fi

# Check window manager
echo ""
echo "🪟 Window Manager:"
if pgrep -f "mutter" >/dev/null; then
    echo "  ✅ Mutter: Running"
else
    echo "  ❌ Mutter: Not running"
fi

# Check VNC server
echo ""
echo "🌐 VNC Server:"
if pgrep -f "x11vnc" >/dev/null; then
    echo "  ✅ x11vnc: Running"
    
    # Check if port is listening
    if netstat -ln | grep -q ":5901"; then
        echo "  ✅ VNC Port 5901: Listening"
    else
        echo "  ❌ VNC Port 5901: Not listening"
    fi
else
    echo "  ❌ x11vnc: Not running"
fi

# Check VSCode server
echo ""
echo "💻 VSCode Server:"
if pgrep -f "openvscode-server" >/dev/null; then
    echo "  ✅ OpenVSCode Server: Running"
    
    # Check if port is listening
    if netstat -ln | grep -q ":3000"; then
        echo "  ✅ VSCode Port 3000: Listening"
    else
        echo "  ❌ VSCode Port 3000: Not listening"
    fi
else
    echo "  ❌ OpenVSCode Server: Not running"
fi

# Check project files
echo ""
echo "📁 Project Files:"
project_files=("claude_computer_agent.py" "claude_cli_integration.py" ".env")
for file in "${project_files[@]}"; do
    if [ -f "/home/ubuntu/claude-agent/$file" ]; then
        echo "  ✅ $file: Exists"
    else
        echo "  ❌ $file: Missing"
    fi
done

# Test screenshot capability
echo ""
echo "📸 Screenshot Test:"
if command -v scrot >/dev/null 2>&1; then
    if DISPLAY=:1 scrot -z /tmp/test_screenshot.png 2>/dev/null; then
        echo "  ✅ Screenshot: Working"
        rm -f /tmp/test_screenshot.png
    else
        echo "  ❌ Screenshot: Failed"
    fi
else
    echo "  ❌ scrot: Not installed"
fi

# Network connectivity test
echo ""
echo "🌐 Network Connectivity:"
if curl -s --connect-timeout 5 https://api.anthropic.com >/dev/null; then
    echo "  ✅ Anthropic API: Reachable"
else
    echo "  ❌ Anthropic API: Not reachable"
fi

# Summary and recommendations
echo ""
echo "📋 Summary and Recommendations:"

# Count issues
issues=0

# Check critical components
if ! pgrep -f "Xvfb :1" >/dev/null; then
    echo "  🔧 Start Xvfb: Xvfb :1 -screen 0 1024x768x24 -ac &"
    ((issues++))
fi

if ! DISPLAY=:1 xdpyinfo >/dev/null 2>&1; then
    echo "  🔧 Fix X11 display: export DISPLAY=:1"
    ((issues++))
fi

if ! command -v claude >/dev/null 2>&1; then
    echo "  🔧 Install Claude CLI: npm install -g @anthropic/claude-code"
    ((issues++))
fi

if [ ! -f "/home/ubuntu/claude-agent/.env" ] || grep -q "your_api_key_here" /home/ubuntu/claude-agent/.env 2>/dev/null; then
    echo "  🔧 Configure API key in /home/ubuntu/claude-agent/.env"
    ((issues++))
fi

if [ $issues -eq 0 ]; then
    echo "  ✅ All systems operational!"
    echo ""
    echo "🚀 Ready to start Claude Computer Use Agent:"
    echo "  cd /home/ubuntu/claude-agent"
    echo "  source venv/bin/activate"
    echo "  python claude_computer_agent.py"
else
    echo "  ⚠️ Found $issues issues that need attention"
fi

echo ""
echo "🔗 Access URLs:"
echo "  🌐 VNC: $(curl -s ifconfig.me):5901 (password: claude123)"
echo "  💻 VSCode: http://$(curl -s ifconfig.me):3000"
