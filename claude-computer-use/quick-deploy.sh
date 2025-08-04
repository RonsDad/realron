#!/bin/bash
# Quick Deploy Script for Claude Computer Use Environment

set -e

echo "🚀 Claude Computer Use Environment - Quick Deploy"
echo "=================================================="

# Configuration
REGION="us-east-1"
INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"  # Ubuntu 22.04 LTS
SG_NAME="claude-computer-use-sg"
KEY_NAME="claude-computer-use-key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

print_success "Prerequisites check passed"

# Get user's IP for security group
print_status "Getting your public IP for security configuration..."
YOUR_IP=$(curl -s ifconfig.me)
print_success "Your IP: $YOUR_IP"

# Get default VPC
print_status "Getting default VPC..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $REGION)
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    print_error "No default VPC found. Please create a VPC first."
    exit 1
fi
print_success "Using VPC: $VPC_ID"

# Create security group
print_status "Creating security group..."
if aws ec2 describe-security-groups --group-names $SG_NAME --region $REGION &> /dev/null; then
    print_warning "Security group $SG_NAME already exists"
    SG_ID=$(aws ec2 describe-security-groups --group-names $SG_NAME --query 'SecurityGroups[0].GroupId' --output text --region $REGION)
else
    aws ec2 create-security-group \
        --group-name $SG_NAME \
        --description "Security group for Claude Computer Use Environment" \
        --vpc-id $VPC_ID \
        --region $REGION > /dev/null
    
    SG_ID=$(aws ec2 describe-security-groups --group-names $SG_NAME --query 'SecurityGroups[0].GroupId' --output text --region $REGION)
    print_success "Created security group: $SG_ID"
fi

# Configure security group rules
print_status "Configuring security group rules..."

# SSH access
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION 2>/dev/null || print_warning "SSH rule may already exist"

# VNC access (restricted to your IP)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5901 \
    --cidr $YOUR_IP/32 \
    --region $REGION 2>/dev/null || print_warning "VNC rule may already exist"

# VSCode Server access (restricted to your IP)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 3000 \
    --cidr $YOUR_IP/32 \
    --region $REGION 2>/dev/null || print_warning "VSCode rule may already exist"

print_success "Security group configured"

# Create key pair
print_status "Creating key pair..."
if [ -f ~/.ssh/$KEY_NAME.pem ]; then
    print_warning "Key pair $KEY_NAME already exists locally"
else
    if aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
        print_error "Key pair $KEY_NAME exists on AWS but not locally. Please download it or use a different name."
        exit 1
    else
        aws ec2 create-key-pair \
            --key-name $KEY_NAME \
            --query 'KeyMaterial' \
            --output text \
            --region $REGION > ~/.ssh/$KEY_NAME.pem
        
        chmod 400 ~/.ssh/$KEY_NAME.pem
        print_success "Created key pair: ~/.ssh/$KEY_NAME.pem"
    fi
fi

# Create user data script
print_status "Creating user data script..."
cat > /tmp/user-data-deploy.sh << 'EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting Claude Computer Use Environment setup..."

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y \
    xvfb mutter tint2 x11vnc firefox libreoffice gedit nautilus \
    gnome-terminal python3 python3-pip python3-venv curl wget git \
    build-essential xdotool scrot imagemagick unzip jq

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Claude Code CLI
npm install -g @anthropic/claude-code

# Install OpenVSCode Server
npm install -g @gitpod/openvscode-server

# Create project structure
mkdir -p /home/ubuntu/claude-agent/{tools,logs}
cd /home/ubuntu/claude-agent

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install anthropic pillow pyautogui pynput opencv-python fastapi uvicorn websockets python-dotenv requests aiofiles

# Create environment file
cat > .env << 'ENVEOF'
ANTHROPIC_API_KEY=your_api_key_here
DISPLAY=:1
SCREEN_WIDTH=1024
SCREEN_HEIGHT=768
VNC_PASSWORD=claude123
ENVEOF

# Set permissions
chown -R ubuntu:ubuntu /home/ubuntu/claude-agent

# Configure VNC
mkdir -p /home/ubuntu/.vnc
echo "claude123" | vncpasswd -f > /home/ubuntu/.vnc/passwd
chmod 600 /home/ubuntu/.vnc/passwd
chown -R ubuntu:ubuntu /home/ubuntu/.vnc

# Create setup completion marker
touch /home/ubuntu/setup-complete

echo "Setup completed! Please upload agent code and configure API key."
EOF

# Launch instance
print_status "Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --user-data file:///tmp/user-data-deploy.sh \
    --region $REGION \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Claude-Computer-Use}]' \
    --query 'Instances[0].InstanceId' \
    --output text)

print_success "Launched instance: $INSTANCE_ID"

# Wait for instance to be running
print_status "Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get instance details
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

print_success "Instance is running!"

# Wait for SSH to be available
print_status "Waiting for SSH to be available..."
while ! ssh -i ~/.ssh/$KEY_NAME.pem -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP 'echo "SSH Ready"' 2>/dev/null; do
    echo -n "."
    sleep 5
done
echo ""
print_success "SSH is ready"

# Upload agent files
print_status "Uploading agent files..."
scp -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no claude_computer_agent.py ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/ 2>/dev/null || print_warning "claude_computer_agent.py not found locally"
scp -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no claude_cli_integration.py ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/ 2>/dev/null || print_warning "claude_cli_integration.py not found locally"
scp -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no requirements.txt ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/ 2>/dev/null || print_warning "requirements.txt not found locally"
scp -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no start-claude-env.sh ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/ 2>/dev/null || print_warning "start-claude-env.sh not found locally"
scp -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no stop-claude-env.sh ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/ 2>/dev/null || print_warning "stop-claude-env.sh not found locally"
scp -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no validate-setup.sh ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/ 2>/dev/null || print_warning "validate-setup.sh not found locally"

# Make scripts executable
ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP 'chmod +x /home/ubuntu/claude-agent/*.sh' 2>/dev/null || true

print_success "Files uploaded"

# Wait for setup to complete
print_status "Waiting for system setup to complete..."
while ! ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP 'test -f /home/ubuntu/setup-complete' 2>/dev/null; do
    echo -n "."
    sleep 10
done
echo ""
print_success "System setup completed"

# Clean up
rm -f /tmp/user-data-deploy.sh

# Display connection information
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📋 Instance Information:"
echo "  Instance ID: $INSTANCE_ID"
echo "  Public IP: $PUBLIC_IP"
echo "  Region: $REGION"
echo ""
echo "🔗 Access Information:"
echo "  SSH: ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP"
echo "  VNC: $PUBLIC_IP:5901 (password: claude123)"
echo "  VSCode: http://$PUBLIC_IP:3000"
echo ""
echo "⚙️ Next Steps:"
echo "1. SSH into the instance:"
echo "   ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP"
echo ""
echo "2. Configure your Anthropic API key:"
echo "   cd /home/ubuntu/claude-agent"
echo "   nano .env"
echo "   # Replace 'your_api_key_here' with your actual API key"
echo ""
echo "3. Start the Claude environment:"
echo "   ./start-claude-env.sh"
echo ""
echo "4. Run the Claude agent:"
echo "   source venv/bin/activate"
echo "   python claude_computer_agent.py"
echo ""
echo "🔧 Management Commands:"
echo "  Stop instance: aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $REGION"
echo "  Start instance: aws ec2 start-instances --instance-ids $INSTANCE_ID --region $REGION"
echo "  Terminate: aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION"
echo ""
print_success "Ready to use Claude Computer Use Environment!"
