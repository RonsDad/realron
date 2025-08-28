#!/bin/bash

# Stop and remove any existing browserless container
sudo docker stop browserless 2>/dev/null
sudo docker rm browserless 2>/dev/null

# Start browserless with high quality settings
sudo docker run -d --restart always -p 3000:3000 --name browserless \
  -e SCREEN_WIDTH=1920 \
  -e SCREEN_HEIGHT=1080 \
  -e SCREEN_DEPTH=24 \
  -e ENABLE_DEBUGGER=true \
  -e DEFAULT_VIEWPORT_WIDTH=1920 \
  -e DEFAULT_VIEWPORT_HEIGHT=1080 \
  browserless/chrome:latest

echo "Browserless started with 1920x1080 high quality settings"
