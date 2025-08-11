#!/bin/bash

# Ron AI Healthcare Copilot - AWS Deployment Script
# This script deploys the application to AWS EC2 with proper configuration

set -e

echo "🚀 Ron AI Healthcare Copilot - AWS Deployment"
echo "=============================================="

# Configuration
INSTANCE_TYPE="t3.large"  # 2 vCPUs, 8GB RAM - good for healthcare AI workloads
KEY_NAME="ron-ai-key"
SECURITY_GROUP="ron-ai-sg"
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2023 (update for your region)
REGION="us-west-2"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is required but not installed."
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured."
    echo "Please run: aws configure"
    exit 1
fi

echo "✅ AWS CLI configured"

# Create key pair if it doesn't exist
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
    echo "🔑 Creating EC2 key pair..."
    aws ec2 create-key-pair --key-name $KEY_NAME --region $REGION --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
    chmod 400 ${KEY_NAME}.pem
    echo "✅ Key pair created: ${KEY_NAME}.pem"
else
    echo "✅ Key pair already exists"
fi

# Create security group if it doesn't exist
if ! aws ec2 describe-security-groups --group-names $SECURITY_GROUP --region $REGION &> /dev/null; then
    echo "🔒 Creating security group..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP \
        --description "Ron AI Healthcare Copilot Security Group" \
        --region $REGION \
        --query 'GroupId' --output text)
    
    # Add rules for HTTP, HTTPS, SSH, and application ports
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 8000 --cidr 0.0.0.0/0 --region $REGION
    
    echo "✅ Security group created: $SECURITY_GROUP_ID"
else
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP --region $REGION --query 'SecurityGroups[0].GroupId' --output text)
    echo "✅ Security group already exists: $SECURITY_GROUP_ID"
fi

# Create user data script for instance initialization
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Python 3.11
yum install -y python3.11 python3.11-pip python3.11-venv

# Install Git
yum install -y git

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Install PM2 for process management
npm install -g pm2

# Create application directory
mkdir -p /opt/ron-ai
chown ec2-user:ec2-user /opt/ron-ai

# Create systemd service for the application
cat > /etc/systemd/system/ron-ai.service << 'EOL'
[Unit]
Description=Ron AI Healthcare Copilot
After=network.target

[Service]
Type=forking
User=ec2-user
WorkingDirectory=/opt/ron-ai
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 delete ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl enable ron-ai

# Configure Nginx as reverse proxy
cat > /etc/nginx/conf.d/ron-ai.conf << 'EOL'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

systemctl restart nginx

echo "✅ Server setup complete"
EOF

# Launch EC2 instance
echo "🚀 Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-groups $SECURITY_GROUP \
    --user-data file://user-data.sh \
    --region $REGION \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Ron-AI-Healthcare-Copilot}]' \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ Instance launched: $INSTANCE_ID"

# Wait for instance to be running
echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "✅ Instance is running at: $PUBLIC_IP"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf ron-ai-deploy.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='venv' \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='.next' \
    --exclude='.DS_Store' \
    .

echo "✅ Deployment package created"

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ron-ai-backend',
      script: 'python3.11',
      args: 'backend/api.py',
      cwd: '/opt/ron-ai',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/ron-ai-backend-error.log',
      out_file: '/var/log/ron-ai-backend-out.log',
      log_file: '/var/log/ron-ai-backend.log'
    },
    {
      name: 'ron-ai-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/ron-ai',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/ron-ai-frontend-error.log',
      out_file: '/var/log/ron-ai-frontend-out.log',
      log_file: '/var/log/ron-ai-frontend.log'
    }
  ]
};
EOF

# Create deployment script
cat > deploy-to-instance.sh << EOF
#!/bin/bash
set -e

echo "🚀 Deploying to EC2 instance..."

# Copy files to instance
echo "📁 Copying files..."
scp -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ron-ai-deploy.tar.gz ec2-user@${PUBLIC_IP}:/tmp/
scp -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ecosystem.config.js ec2-user@${PUBLIC_IP}:/tmp/

# Deploy on instance
ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ec2-user@${PUBLIC_IP} << 'DEPLOY_SCRIPT'
set -e

# Extract application
cd /opt/ron-ai
sudo tar -xzf /tmp/ron-ai-deploy.tar.gz --strip-components=1
sudo chown -R ec2-user:ec2-user /opt/ron-ai

# Copy PM2 config
cp /tmp/ecosystem.config.js /opt/ron-ai/

# Install Python dependencies
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Install Node.js dependencies and build
npm install
npm run build

# Start services
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "✅ Deployment complete!"
DEPLOY_SCRIPT

echo "✅ Application deployed successfully!"
echo ""
echo "🌐 Your Ron AI Healthcare Copilot is now running at:"
echo "   http://${PUBLIC_IP}"
echo ""
echo "📊 To monitor the application:"
echo "   ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "🔧 To update the application:"
echo "   ./deploy-to-instance.sh"
EOF

chmod +x deploy-to-instance.sh

echo ""
echo "🎉 AWS Infrastructure Setup Complete!"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo "1. Wait 2-3 minutes for the instance to fully initialize"
echo "2. Run: ./deploy-to-instance.sh"
echo "3. Access your application at: http://$PUBLIC_IP"
echo ""
echo "💡 Instance Details:"
echo "   Instance ID: $INSTANCE_ID"
echo "   Public IP: $PUBLIC_IP"
echo "   SSH: ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo ""
echo "🔒 Security:"
echo "   - Keep ${KEY_NAME}.pem secure"
echo "   - Consider setting up SSL/TLS for production"
echo "   - Review security group rules"
echo ""

# Cleanup
rm user-data.sh
