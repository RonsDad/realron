#!/bin/bash
# Stop Claude Computer Use Environment

echo "🛑 Stopping Claude Computer Use Environment..."

# Kill processes by name
echo "🧹 Stopping services..."
pkill -f "Xvfb :1" || true
pkill -f "mutter" || true
pkill -f "tint2" || true
pkill -f "x11vnc" || true
pkill -f "openvscode-server" || true
pkill -f "gnome-terminal" || true

# Kill processes by PID if available
if [ -f "/tmp/claude-env-pids" ]; then
    source /tmp/claude-env-pids
    
    [ ! -z "$XVFB_PID" ] && kill $XVFB_PID 2>/dev/null || true
    [ ! -z "$MUTTER_PID" ] && kill $MUTTER_PID 2>/dev/null || true
    [ ! -z "$TINT2_PID" ] && kill $TINT2_PID 2>/dev/null || true
    [ ! -z "$VNC_PID" ] && kill $VNC_PID 2>/dev/null || true
    [ ! -z "$VSCODE_PID" ] && kill $VSCODE_PID 2>/dev/null || true
    
    rm /tmp/claude-env-pids
fi

# Clean up temporary files
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/screenshot.png
rm -f /tmp/claude-*.log

# Wait for processes to stop
sleep 2

echo "✅ Environment stopped successfully!"
