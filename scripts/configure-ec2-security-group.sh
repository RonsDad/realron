#!/bin/bash

# Configure AWS Security Group for VNC Computer Use
# Run this script to add the required inbound rules for VNC ports

EC2_INSTANCE_ID="i-0abc123def456789"  # Replace with your actual instance ID
SECURITY_GROUP_NAME="claude-computer-use-sg"

echo "Configuring AWS Security Group for VNC Computer Use..."
echo "EC2 Instance: $EC2_INSTANCE_ID"

# Get the security group ID from the instance
SECURITY_GROUP_ID=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
  --output text)

if [ "$SECURITY_GROUP_ID" = "None" ] || [ -z "$SECURITY_GROUP_ID" ]; then
  echo "Error: Could not find security group for instance $EC2_INSTANCE_ID"
  echo "Please check your instance ID and AWS credentials"
  exit 1
fi

echo "Found Security Group: $SECURITY_GROUP_ID"

# Add inbound rule for VNC port (5901)
echo "Adding inbound rule for VNC port 5901..."
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 5901 \
  --cidr 0.0.0.0/0 \
  --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=VNC-Port}]" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ VNC port 5901 rule added successfully"
else
  echo "⚠️  VNC port 5901 rule may already exist"
fi

# Add inbound rule for NoVNC web port (6080)
echo "Adding inbound rule for NoVNC web port 6080..."
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 6080 \
  --cidr 0.0.0.0/0 \
  --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=NoVNC-Web-Port}]" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ NoVNC web port 6080 rule added successfully"
else
  echo "⚠️  NoVNC web port 6080 rule may already exist"
fi

# Verify the rules were added
echo ""
echo "Current Security Group Rules:"
aws ec2 describe-security-groups \
  --group-ids $SECURITY_GROUP_ID \
  --query 'SecurityGroups[0].IpPermissions[?FromPort==`5901` || FromPort==`6080`]' \
  --output table

echo ""
echo "🎯 Configuration complete!"
echo "Your EC2 instance should now accept VNC connections on:"
echo "  - VNC Direct: 3.137.139.249:5901"
echo "  - NoVNC Web:  http://3.137.139.249:6080"
echo ""
echo "Next steps:"
echo "1. Verify the EC2 instance is running"
echo "2. Test the VNC connection in Ron AI"