#!/bin/bash

# Kill any existing VNC/X processes
vncserver -kill :1 2>/dev/null
pkill firefox 2>/dev/null
pkill Xvfb 2>/dev/null

# Remove VNC password file
rm -f ~/.vnc/passwd

# Start VNC without password, full resolution
vncserver :1 -geometry 1920x1080 -depth 24 -SecurityTypes None -localhost no

# Wait for VNC to start
sleep 3

# Set display
export DISPLAY=:1

# Start colorful fullscreen Firefox
DISPLAY=:1 firefox --kiosk 'data:text/html,<body style="background:linear-gradient(45deg,red,orange,yellow,green,blue,indigo,violet);margin:0;height:100vh;display:flex;align-items:center;justify-content:center;"><h1 style="color:white;font-size:6em;text-shadow:3px 3px 6px black;font-family:Arial;">🌈 CLAUDE COMPUTER 🌈</h1></body>' &

echo "VNC started: no password, 1920x1080, colorful fullscreen"
