#!/bin/bash
# Setup script for Claude Sonnet 4 Computer Use Desktop Environment

set -e

echo "🖥️  Setting up desktop environment for Claude Computer Use..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "🔧 Installing desktop environment components..."
sudo apt install -y \
    xvfb \
    openbox \
    tint2 \
    x11vnc \
    firefox \
    gnome-terminal \
    code \
    git \
    xdotool \
    imagemagick \
    xwd \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    chromium-browser \
    vim \
    curl \
    wget \
    unzip

# Install Claude Code CLI
echo "🤖 Installing Claude Code CLI..."
sudo npm install -g @anthropic/claude-code

# Create project directories
echo "📁 Creating project directories..."
mkdir -p ~/claude-projects
mkdir -p ~/claude-agent
mkdir -p ~/.vnc

# Set up VNC password
echo "🔐 Setting up VNC password..."
x11vnc -storepasswd "claude123" ~/.vnc/passwd

# Create Xvfb startup script
echo "📝 Creating Xvfb startup script..."
cat > ~/start-xvfb.sh << 'EOF'
#!/bin/bash
# Start virtual display
export DISPLAY=:1
Xvfb :1 -screen 0 1024x768x24 -ac &
echo "Virtual display started on DISPLAY=:1"
EOF

chmod +x ~/start-xvfb.sh

# Create desktop environment startup script
echo "📝 Creating desktop startup script..."
cat > ~/start-desktop.sh << 'EOF'
#!/bin/bash
# Start desktop environment

export DISPLAY=:1

# Check if Xvfb is running
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "Starting Xvfb..."
    ~/start-xvfb.sh
    sleep 2
fi

# Start window manager
echo "Starting Openbox window manager..."
DISPLAY=:1 openbox &
sleep 1

# Start panel
echo "Starting Tint2 panel..."
DISPLAY=:1 tint2 &
sleep 1

# Start terminal
echo "Starting terminal..."
DISPLAY=:1 gnome-terminal &
sleep 1

# Start VS Code
echo "Starting VS Code..."
DISPLAY=:1 code &
sleep 1

# Start VNC server
echo "Starting VNC server..."
DISPLAY=:1 x11vnc -forever -usepw -display :1 -geometry 1024x768 -rfbport 5901 &

echo "Desktop environment ready!"
echo "Connect via VNC to port 5901 with password: claude123"
EOF

chmod +x ~/start-desktop.sh

# Create Python virtual environment
echo "🐍 Setting up Python environment..."
cd ~/claude-agent
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
cat > requirements.txt << 'EOF'
anthropic>=0.39.0
pillow>=10.0.0
numpy>=1.24.0
asyncio
python-dotenv
EOF

pip install -r requirements.txt

# Create environment file template
echo "📋 Creating environment configuration..."
cat > .env.template << 'EOF'
# Copy this to .env and fill in your API key
ANTHROPIC_API_KEY=your-api-key-here
DISPLAY=:1
EOF

# Create sample Claude project
echo "📂 Creating sample project for testing..."
cd ~/claude-projects
mkdir -p sample-app
cd sample-app

# Create sample JavaScript files
cat > app.js << 'EOF'
// Sample application for Claude Code analysis
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello from Claude Computer Use Demo!');
});

app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'running',
        timestamp: new Date().toISOString(),
        agent: 'Claude Sonnet 4'
    });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
EOF

cat > package.json << 'EOF'
{
  "name": "claude-sample-app",
  "version": "1.0.0",
  "description": "Sample app for Claude Code CLI testing",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF

cat > README.md << 'EOF'
# Claude Sample App

This is a sample Express.js application for testing Claude Code CLI with computer use.

## Features
- Simple REST API
- Status endpoint
- Ready for Claude analysis

## Usage
```bash
npm install
npm start
```

## Claude Code Analysis
Use Claude Code CLI to analyze this project:
```bash
claude -p "Analyze this Express.js application and suggest improvements"
```
EOF

# Create systemd service for auto-start
echo "🚀 Creating systemd service..."
sudo tee /etc/systemd/system/claude-desktop.service > /dev/null << 'EOF'
[Unit]
Description=Claude Computer Use Desktop Environment
After=network.target

[Service]
Type=simple
User=ubuntu
Environment="DISPLAY=:1"
ExecStart=/home/ubuntu/start-desktop.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create complete startup script
echo "📝 Creating complete startup script..."
cat > ~/start-claude-interleaved.sh << 'EOF'
#!/bin/bash
# Complete startup script for Claude Sonnet 4 with Interleaved Thinking

export DISPLAY=:1
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set!"
    echo "Please set it in ~/.bashrc or .env file"
fi

# Start desktop environment
echo "🖥️  Starting desktop environment..."
~/start-desktop.sh

# Wait for desktop to be ready
sleep 5

# Activate Python environment
echo "🐍 Activating Python environment..."
cd ~/claude-agent
source venv/bin/activate

# Start interleaved agent
echo "🤖 Starting Claude Interleaved Thinking Agent..."
python interleaved_agent.py
EOF

chmod +x ~/start-claude-interleaved.sh

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > ~/monitor-claude.sh << 'EOF'
#!/bin/bash
# Monitor Claude Computer Use processes

echo "🔍 Claude Computer Use Monitor"
echo "============================="
echo

echo "📺 Display Status:"
if pgrep -x "Xvfb" > /dev/null; then
    echo "✅ Xvfb is running on DISPLAY=:1"
else
    echo "❌ Xvfb is not running"
fi

echo
echo "🖼️  Desktop Components:"
for process in openbox tint2 gnome-terminal code x11vnc; do
    if pgrep -x "$process" > /dev/null; then
        echo "✅ $process is running"
    else
        echo "❌ $process is not running"
    fi
done

echo
echo "🔌 VNC Server:"
if pgrep -x "x11vnc" > /dev/null; then
    echo "✅ VNC server is running on port 5901"
    echo "   Connect with: vncviewer <server-ip>:5901"
else
    echo "❌ VNC server is not running"
fi

echo
echo "🐍 Python Agent:"
if pgrep -f "interleaved_agent.py" > /dev/null; then
    echo "✅ Interleaved agent is running"
else
    echo "❌ Interleaved agent is not running"
fi
EOF

chmod +x ~/monitor-claude.sh

echo "✅ Desktop environment setup complete!"
echo
echo "📋 Next steps:"
echo "1. Copy .env.template to .env and add your ANTHROPIC_API_KEY"
echo "2. Start the desktop: ~/start-desktop.sh"
echo "3. Monitor status: ~/monitor-claude.sh"
echo "4. Start Claude agent: ~/start-claude-interleaved.sh"
echo "5. Connect via VNC to port 5901 (password: claude123)"
echo
echo "🎉 Ready for Claude Sonnet 4 Computer Use with Interleaved Thinking!"