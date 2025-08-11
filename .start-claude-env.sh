#!/usr/bin/env bash
set -euo pipefail
cd /home/ubuntu/claude-agent
export $(grep -v '^#' .env | xargs -d '\n' -I{} echo {})
if ! pgrep -f "Xvfb :1" >/dev/null; then
  Xvfb :1 -screen 0 ${SCREEN_WIDTH:-1280}x${SCREEN_HEIGHT:-800}x24 -ac -nolisten tcp &
  sleep 1
fi
nohup mutter --sm-disable --replace >/dev/null 2>&1 &
nohup tint2 >/dev/null 2>&1 &
if ! pgrep -f "x11vnc -display :1" >/dev/null; then
  x11vnc -display :1 -forever -passwd "${VNC_PASSWORD:-claude123}" -rfbport 5901 -shared >/dev/null 2>&1 &
fi
if ! pgrep -f "openvscode-server .*--port 3000" >/dev/null; then
  openvscode-server --host 0.0.0.0 --port 3000 --connection-token "${OPENVSCODE_SERVER_TOKEN:-changeme}" >/dev/null 2>&1 &
fi
