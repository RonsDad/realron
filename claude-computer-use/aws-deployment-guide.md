# AWS CLI Deployment Guide for Claude Computer Use

Complete AWS CLI commands and procedures to deploy the Claude Computer Use environment.

## 🚀 Prerequisites

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter your Access Key ID, Secret Access Key, Region, and Output format
```

## 🔧 Step 1: Create Security Group

```bash
# Set variables
REGION="us-east-1"
SG_NAME="claude-computer-use-sg"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $REGION)

# Create security group
aws ec2 create-security-group \
    --group-name $SG_NAME \
    --description "Security group for Claude Computer Use Environment" \
    --vpc-id $VPC_ID \
    --region $REGION

# Get security group ID
SG_ID=$(aws ec2 describe-security-groups \
    --group-names $SG_NAME \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region $REGION)

echo "Security Group ID: $SG_ID"
```

## 🔓 Step 2: Configure Security Group Rules

```bash
# SSH access (port 22)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# VNC access (port 5901) - Restrict to your IP for security
YOUR_IP=$(curl -s ifconfig.me)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5901 \
    --cidr $YOUR_IP/32 \
    --region $REGION

# VSCode Server (port 3000)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 3000 \
    --cidr $YOUR_IP/32 \
    --region $REGION

# HTTP (port 80) - Optional for web services
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# HTTPS (port 443) - Optional for web services
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $REGION
```

## 🔑 Step 3: Create or Use Existing Key Pair

```bash
# Create new key pair
KEY_NAME="claude-computer-use-key"
aws ec2 create-key-pair \
    --key-name $KEY_NAME \
    --query 'KeyMaterial' \
    --output text \
    --region $REGION > ~/.ssh/$KEY_NAME.pem

# Set correct permissions
chmod 400 ~/.ssh/$KEY_NAME.pem

# Or list existing key pairs
aws ec2 describe-key-pairs --region $REGION
```

## 🖥️ Step 4: Launch EC2 Instance

```bash
# Set instance parameters
INSTANCE_TYPE="t3.medium"  # Minimum recommended for GUI
AMI_ID="ami-0c02fb55956c7d316"  # Ubuntu 22.04 LTS (update as needed)

# Create user data script
cat > user-data-cloud-init.sh << 'EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting Claude Computer Use Environment setup..."

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y \
    xvfb mutter tint2 x11vnc firefox libreoffice gedit nautilus \
    gnome-terminal python3 python3-pip python3-venv curl wget git \
    build-essential xdotool scrot imagemagick unzip

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

echo "Setup completed! Please upload agent code and configure API key."
EOF

# Launch instance
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --user-data file://user-data-cloud-init.sh \
    --region $REGION \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Claude-Computer-Use}]' \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Instance ID: $INSTANCE_ID"
```

## ⏳ Step 5: Wait for Instance and Get Connection Info

```bash
# Wait for instance to be running
echo "Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get instance details
INSTANCE_INFO=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0]')

PUBLIC_IP=$(echo $INSTANCE_INFO | jq -r '.PublicIpAddress')
PRIVATE_IP=$(echo $INSTANCE_INFO | jq -r '.PrivateIpAddress')
STATE=$(echo $INSTANCE_INFO | jq -r '.State.Name')

echo "Instance Details:"
echo "  State: $STATE"
echo "  Public IP: $PUBLIC_IP"
echo "  Private IP: $PRIVATE_IP"
echo "  SSH Command: ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP"
```

## 📁 Step 6: Upload Agent Code

```bash
# Wait for instance to be fully ready
echo "Waiting for SSH to be available..."
while ! ssh -i ~/.ssh/$KEY_NAME.pem -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP 'echo "SSH Ready"' 2>/dev/null; do
    echo "Waiting for SSH..."
    sleep 10
done

# Upload agent files
scp -i ~/.ssh/$KEY_NAME.pem claude_computer_agent.py ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/
scp -i ~/.ssh/$KEY_NAME.pem claude_cli_integration.py ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/
scp -i ~/.ssh/$KEY_NAME.pem requirements.txt ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/
scp -i ~/.ssh/$KEY_NAME.pem start-claude-env.sh ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/
scp -i ~/.ssh/$KEY_NAME.pem stop-claude-env.sh ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/
scp -i ~/.ssh/$KEY_NAME.pem validate-setup.sh ubuntu@$PUBLIC_IP:/home/ubuntu/claude-agent/

# Make scripts executable
ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP 'chmod +x /home/ubuntu/claude-agent/*.sh'
```

## 🔑 Step 7: Configure API Key

```bash
# SSH into instance and configure
ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP << 'SSHEOF'
# Edit the .env file
cd /home/ubuntu/claude-agent
echo "Please enter your Anthropic API key:"
read -s API_KEY
sed -i "s/your_api_key_here/$API_KEY/" .env
echo "API key configured!"
SSHEOF
```

## 🚀 Step 8: Start the Environment

```bash
# Start the Claude environment
ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP << 'SSHEOF'
cd /home/ubuntu/claude-agent
./start-claude-env.sh
SSHEOF
```

## ✅ Step 9: Validate Setup

```bash
# Run validation
ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP '/home/ubuntu/claude-agent/validate-setup.sh'
```

## 🌐 Step 10: Access the Environment

```bash
echo "Environment Access:"
echo "  SSH: ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP"
echo "  VNC: $PUBLIC_IP:5901 (password: claude123)"
echo "  VSCode: http://$PUBLIC_IP:3000"
echo ""
echo "To start the Claude agent:"
echo "  ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP"
echo "  cd /home/ubuntu/claude-agent"
echo "  source venv/bin/activate"
echo "  python claude_computer_agent.py"
```

## 🔧 Management Commands

### Start/Stop Instance

```bash
# Stop instance
aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $REGION

# Start instance
aws ec2 start-instances --instance-ids $INSTANCE_ID --region $REGION

# Terminate instance (WARNING: This will delete the instance)
aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION
```

### Update Security Group

```bash
# Add new IP to VNC access
NEW_IP=$(curl -s ifconfig.me)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5901 \
    --cidr $NEW_IP/32 \
    --region $REGION
```

### Monitor Instance

```bash
# Get instance status
aws ec2 describe-instance-status --instance-ids $INSTANCE_ID --region $REGION

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --dimensions Name=InstanceId,Value=$INSTANCE_ID \
    --statistics Average \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --region $REGION
```

## 🛡️ Security Best Practices

### 1. Restrict VNC Access
```bash
# Only allow your IP for VNC
aws ec2 revoke-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5901 \
    --cidr 0.0.0.0/0 \
    --region $REGION

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5901 \
    --cidr $(curl -s ifconfig.me)/32 \
    --region $REGION
```

### 2. Use IAM Roles
```bash
# Create IAM role for EC2 (optional)
aws iam create-role \
    --role-name ClaudeComputeUseRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'
```

### 3. Enable CloudTrail
```bash
# Enable CloudTrail for auditing
aws cloudtrail create-trail \
    --name claude-computer-use-trail \
    --s3-bucket-name your-cloudtrail-bucket \
    --region $REGION
```

## 💰 Cost Optimization

### 1. Use Spot Instances
```bash
# Launch spot instance (much cheaper)
aws ec2 request-spot-instances \
    --spot-price "0.05" \
    --instance-count 1 \
    --type "one-time" \
    --launch-specification '{
        "ImageId": "'$AMI_ID'",
        "InstanceType": "'$INSTANCE_TYPE'",
        "KeyName": "'$KEY_NAME'",
        "SecurityGroupIds": ["'$SG_ID'"],
        "UserData": "'$(base64 -w 0 user-data-cloud-init.sh)'"
    }' \
    --region $REGION
```

### 2. Schedule Start/Stop
```bash
# Create Lambda function to start/stop instance on schedule
# (Implementation would require additional Lambda setup)
```

This comprehensive guide provides all the AWS CLI commands needed to deploy and manage the Claude Computer Use environment on EC2.
