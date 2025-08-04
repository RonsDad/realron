#!/bin/bash
# Deploy Claude Computer Use Environment to EC2

set -e

# Configuration
INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"  # Ubuntu 22.04 LTS
KEY_NAME="your-key-pair"
SECURITY_GROUP="claude-computer-use-sg"
REGION="us-east-1"

echo "🚀 Deploying Claude Computer Use Environment to EC2..."

# Create security group
echo "🔒 Creating security group..."
aws ec2 create-security-group \
    --group-name $SECURITY_GROUP \
    --description "Security group for Claude Computer Use" \
    --region $REGION || echo "Security group may already exist"

# Add security group rules
echo "🔓 Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
    --group-name $SECURITY_GROUP \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION || true

aws ec2 authorize-security-group-ingress \
    --group-name $SECURITY_GROUP \
    --protocol tcp \
    --port 5901 \
    --cidr 0.0.0.0/0 \
    --region $REGION || true

aws ec2 authorize-security-group-ingress \
    --group-name $SECURITY_GROUP \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 \
    --region $REGION || true

# Launch EC2 instance
echo "🖥️ Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-groups $SECURITY_GROUP \
    --region $REGION \
    --user-data file://user-data.sh \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "📋 Instance ID: $INSTANCE_ID"

# Wait for instance to be running
echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "✅ Instance deployed successfully!"
echo "📋 Connection Information:"
echo "  🌐 Public IP: $PUBLIC_IP"
echo "  🔑 SSH: ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP"
echo "  🖥️ VNC: $PUBLIC_IP:5901 (password: claude123)"
echo "  💻 VSCode: http://$PUBLIC_IP:3000"
echo ""
echo "⏳ Please wait 5-10 minutes for the setup to complete."
echo "🔍 Monitor setup progress: ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP 'tail -f /var/log/cloud-init-output.log'"
