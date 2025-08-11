FROM ubuntu:22.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install X11, desktop environment and required tools
RUN apt-get update && apt-get install -y \
    # X11 and VNC
    xvfb \
    x11vnc \
    novnc \
    websockify \
    # Desktop environment
    xfce4 \
    xfce4-terminal \
    dbus-x11 \
    # Automation tools
    xdotool \
    imagemagick \
    x11-utils \
    # Development tools
    python3 \
    python3-pip \
    curl \
    wget \
    git \
    nodejs \
    npm \
    # Browsers
    firefox \
    chromium-browser \
    # Utilities
    sudo \
    net-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install --no-cache-dir \
    anthropic \
    pymongo \
    pillow \
    asyncio \
    aiofiles

# Create non-root user
RUN useradd -m -s /bin/bash claude && \
    echo 'claude ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Create necessary directories
RUN mkdir -p /tmp/claude_screenshots && \
    mkdir -p /home/claude/.vnc && \
    mkdir -p /home/claude/Desktop && \
    chown -R claude:claude /home/claude /tmp/claude_screenshots

# Switch to claude user
USER claude
WORKDIR /home/claude

# Copy the computer use tool
COPY --chown=claude:claude computer_use_tool.py /home/claude/
COPY --chown=claude:claude __init__.py /home/claude/

# Create startup script
RUN echo '#!/bin/bash\n\
# Start Xvfb\n\
Xvfb :1 -screen 0 1024x768x24 -ac +extension GLX +render -noreset &\n\
sleep 2\n\
\n\
# Export display\n\
export DISPLAY=:1\n\
\n\
# Start XFCE desktop\n\
startxfce4 &\n\
sleep 3\n\
\n\
# Start VNC server without password for easy access\n\
x11vnc -display :1 -nopw -forever -xkb -shared -repeat &\n\
\n\
# Start NoVNC (web-based VNC)\n\
websockify --web=/usr/share/novnc/ 6080 localhost:5900 &\n\
\n\
echo "Environment ready!"\n\
echo "VNC access: port 5900"\n\
echo "Web access: http://localhost:6080/vnc.html"\n\
echo "Display: $DISPLAY"\n\
\n\
# Keep container running\n\
tail -f /dev/null' > /home/claude/start.sh && \
    chmod +x /home/claude/start.sh

# Expose ports
EXPOSE 5900 6080

# Set environment variables
ENV DISPLAY=:1
ENV HOME=/home/claude

CMD ["/home/claude/start.sh"]