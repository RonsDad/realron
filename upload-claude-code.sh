#!/bin/bash

# Upload Claude Computer Use Code to EC2 Instance

set -e

# Configuration
INSTANCE_IP="3.137.139.249"
SSH_KEY="ronscomputer.pem"
SSH_USER="ec2-user"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}📤 Uploading Claude Computer Use code to EC2...${NC}"

# Create a temporary directory with the files we want to upload
echo -e "${YELLOW}📦 Preparing files for upload...${NC}"
mkdir -p temp-upload/claude-computer-use

# Copy essential files from your claude-computer-use directory
cp -r claude-computer-use/* temp-upload/claude-computer-use/ 2>/dev/null || echo "Some files may not exist, continuing..."

# Copy your environment and configuration files
cp .env temp-upload/ 2>/dev/null || echo "No .env file found"
cp requirements.txt temp-upload/ 2>/dev/null || echo "No requirements.txt found"

# Create a deployment script for the remote instance
cat > temp-upload/deploy-on-instance.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying Claude Computer Use on EC2..."

# Set up environment
cd ~/claude-computer-use

# Install additional Python packages if needed
python3.11 -m pip install --user -r ../requirements.txt 2>/dev/null || echo "No requirements.txt or already installed"

# Make scripts executable
chmod +x *.py *.sh 2>/dev/null || echo "No scripts to make executable"

# Set up environment variables (you'll need to add your API key)
if [ -f "../.env" ]; then
    echo "📋 Found .env file, copying to current directory"
    cp ../.env .
    echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY"
else
    echo "📝 Creating sample .env file"
    cat > .env << 'ENVEOF'
# Add your Anthropic API key here
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Other configuration
DISPLAY=:1
ENVEOF
    echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY"
fi

# Create a simple launcher script
cat > start_claude_computer_use.sh << 'LAUNCHEREOF'
#!/bin/bash

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Ensure VNC is running
vncserver :1 -geometry 1920x1080 -depth 24 2>/dev/null || echo "VNC already running"

# Set display for GUI applications
export DISPLAY=:1

echo "🚀 Starting Claude Computer Use..."
echo "Environment ready. You can now run your Claude computer use scripts."
echo ""
echo "Example usage:"
echo "python3.11 claude_computer_agent.py"
echo ""
echo "VNC connection: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5901"
echo "VNC password: claude123"

LAUNCHEREOF

chmod +x start_claude_computer_use.sh

echo "✅ Deployment complete!"
echo ""
echo "🔧 To get started:"
echo "1. Edit .env file and add your ANTHROPIC_API_KEY"
echo "2. Run: ./start_claude_computer_use.sh"
echo "3. Connect via VNC to see the desktop"
echo "4. Run your Claude computer use scripts"

EOF

chmod +x temp-upload/deploy-on-instance.sh

# Upload files to the instance
echo -e "${YELLOW}📤 Uploading files...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r temp-upload/* "$SSH_USER@$INSTANCE_IP:~/"

# Execute the deployment script
echo -e "${YELLOW}🔧 Running deployment on instance...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$INSTANCE_IP" "chmod +x ~/deploy-on-instance.sh && ~/deploy-on-instance.sh"

# Clean up
rm -rf temp-upload

echo -e "${GREEN}🎉 Upload Complete!${NC}"
echo ""
echo "📋 Your Claude Computer Use code is now on the EC2 instance:"
echo "- Location: ~/claude-computer-use/"
echo "- Launcher: ~/claude-computer-use/start_claude_computer_use.sh"
echo ""
echo "🔧 Next steps:"
echo "1. SSH: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP"
echo "2. cd ~/claude-computer-use"
echo "3. Edit .env file with your ANTHROPIC_API_KEY"
echo "4. Run: ./start_claude_computer_use.sh"
echo "5. Connect VNC: $INSTANCE_IP:5901 (password: claude123)"
