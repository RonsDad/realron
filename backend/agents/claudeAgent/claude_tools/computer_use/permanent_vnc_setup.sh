#!/bin/bash

# Kill existing VNC
vncserver -kill :1 2>/dev/null

# Remove password file permanently
rm -f ~/.vnc/passwd

# Create VNC config without password
mkdir -p ~/.vnc
cat > ~/.vnc/config << EOF
geometry=1920x1080
depth=24
SecurityTypes=None
localhost=no
EOF

# Create xstartup for colorful Firefox
cat > ~/.vnc/xstartup << 'EOF'
#!/bin/bash
export DISPLAY=:1
firefox --kiosk 'data:text/html,<body style="background:linear-gradient(45deg,red,orange,yellow,green,blue,indigo,violet);margin:0;height:100vh;display:flex;align-items:center;justify-content:center;"><h1 style="color:white;font-size:8em;text-shadow:4px 4px 8px black;font-family:Arial;">🌈 RONS COMPUTER 🌈</h1></body>' &
EOF

chmod +x ~/.vnc/xstartup

# Start VNC
vncserver :1

echo "Permanent VNC setup complete: No password, 1920x1080, colorful"
