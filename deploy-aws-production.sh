#!/bin/bash

# Ron AI Healthcare Copilot - Production AWS Deployment Script
# Production specs: 8GB+ RAM, 4+ CPU cores, 50GB+ SSD, Load Balancer

set -e

echo "🚀 Ron AI Healthcare Copilot - Production AWS Deployment"
echo "======================================================="

# Production Configuration
INSTANCE_TYPE="t3.xlarge"  # 4 vCPUs, 16GB RAM - exceeds your requirements
KEY_NAME="ron-ai-production-key"
SECURITY_GROUP="ron-ai-production-sg"
ALB_SECURITY_GROUP="ron-ai-alb-sg"
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2023 (update for your region)
REGION="us-west-2"
VPC_NAME="ron-ai-vpc"
SUBNET_NAME="ron-ai-subnet"
ALB_NAME="ron-ai-alb"
TARGET_GROUP_NAME="ron-ai-targets"
STORAGE_SIZE="100"  # 100GB SSD - exceeds your 50GB requirement
MIN_INSTANCES=2     # For high availability
MAX_INSTANCES=5     # For auto-scaling

echo "📋 Production Configuration:"
echo "   Instance Type: $INSTANCE_TYPE (4 vCPUs, 16GB RAM)"
echo "   Storage: ${STORAGE_SIZE}GB SSD"
echo "   Min Instances: $MIN_INSTANCES"
echo "   Max Instances: $MAX_INSTANCES"
echo "   Region: $REGION"
echo ""

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

# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --region $REGION --query 'Vpcs[0].VpcId' --output text)
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    echo "❌ No default VPC found. Creating VPC..."
    # Create VPC if none exists
    VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region $REGION --query 'Vpc.VpcId' --output text)
    aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=$VPC_NAME --region $REGION
    
    # Create Internet Gateway
    IGW_ID=$(aws ec2 create-internet-gateway --region $REGION --query 'InternetGateway.InternetGatewayId' --output text)
    aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID --region $REGION
    
    # Create subnets in different AZs
    SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone ${REGION}a --region $REGION --query 'Subnet.SubnetId' --output text)
    SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone ${REGION}b --region $REGION --query 'Subnet.SubnetId' --output text)
    
    # Create route table
    ROUTE_TABLE_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --region $REGION --query 'RouteTable.RouteTableId' --output text)
    aws ec2 create-route --route-table-id $ROUTE_TABLE_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID --region $REGION
    
    # Associate subnets with route table
    aws ec2 associate-route-table --subnet-id $SUBNET_1 --route-table-id $ROUTE_TABLE_ID --region $REGION
    aws ec2 associate-route-table --subnet-id $SUBNET_2 --route-table-id $ROUTE_TABLE_ID --region $REGION
    
    echo "✅ VPC created: $VPC_ID"
else
    echo "✅ Using existing VPC: $VPC_ID"
    # Get existing subnets
    SUBNET_1=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $REGION --query 'Subnets[0].SubnetId' --output text)
    SUBNET_2=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $REGION --query 'Subnets[1].SubnetId' --output text)
fi

# Create key pair if it doesn't exist
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
    echo "🔑 Creating EC2 key pair..."
    aws ec2 create-key-pair --key-name $KEY_NAME --region $REGION --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
    chmod 400 ${KEY_NAME}.pem
    echo "✅ Key pair created: ${KEY_NAME}.pem"
else
    echo "✅ Key pair already exists"
fi

# Create security group for instances
if ! aws ec2 describe-security-groups --group-names $SECURITY_GROUP --region $REGION &> /dev/null; then
    echo "🔒 Creating instance security group..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP \
        --description "Ron AI Production Instance Security Group" \
        --vpc-id $VPC_ID \
        --region $REGION \
        --query 'GroupId' --output text)
    
    # Add rules for SSH and application ports from ALB only
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 3000 --source-group $SECURITY_GROUP_ID --region $REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 8000 --source-group $SECURITY_GROUP_ID --region $REGION
    
    echo "✅ Instance security group created: $SECURITY_GROUP_ID"
else
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP --region $REGION --query 'SecurityGroups[0].GroupId' --output text)
    echo "✅ Instance security group already exists: $SECURITY_GROUP_ID"
fi

# Create security group for ALB
if ! aws ec2 describe-security-groups --group-names $ALB_SECURITY_GROUP --region $REGION &> /dev/null; then
    echo "🔒 Creating ALB security group..."
    ALB_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $ALB_SECURITY_GROUP \
        --description "Ron AI Production ALB Security Group" \
        --vpc-id $VPC_ID \
        --region $REGION \
        --query 'GroupId' --output text)
    
    # Add rules for HTTP and HTTPS
    aws ec2 authorize-security-group-ingress --group-id $ALB_SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $REGION
    aws ec2 authorize-security-group-ingress --group-id $ALB_SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $REGION
    
    echo "✅ ALB security group created: $ALB_SECURITY_GROUP_ID"
else
    ALB_SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names $ALB_SECURITY_GROUP --region $REGION --query 'SecurityGroups[0].GroupId' --output text)
    echo "✅ ALB security group already exists: $ALB_SECURITY_GROUP_ID"
fi

# Update instance security group to allow traffic from ALB
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --source-group $ALB_SECURITY_GROUP_ID --region $REGION 2>/dev/null || echo "ALB to instance rule already exists"

# Create user data script for production instance initialization
cat > user-data-production.sh << 'EOF'
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

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Install PM2 for process management
npm install -g pm2

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Create application directory
mkdir -p /opt/ron-ai
chown ec2-user:ec2-user /opt/ron-ai

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CW_CONFIG'
{
    "metrics": {
        "namespace": "RonAI/Production",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "diskio": {
                "measurement": ["io_time"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            },
            "netstat": {
                "measurement": ["tcp_established", "tcp_time_wait"],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": ["swap_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/opt/ron-ai/logs/*.log",
                        "log_group_name": "ron-ai-production",
                        "log_stream_name": "{instance_id}/application"
                    },
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "ron-ai-production",
                        "log_stream_name": "{instance_id}/nginx-access"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "ron-ai-production",
                        "log_stream_name": "{instance_id}/nginx-error"
                    }
                ]
            }
        }
    }
}
CW_CONFIG

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Configure Nginx for production
cat > /etc/nginx/conf.d/ron-ai-production.conf << 'NGINX_CONFIG'
upstream backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Health check endpoint for ALB
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Frontend routes
    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Backend API routes
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://frontend;
    }
}
NGINX_CONFIG

systemctl restart nginx

echo "✅ Production server setup complete"
EOF

# Create launch template
echo "🚀 Creating launch template..."
LAUNCH_TEMPLATE_ID=$(aws ec2 create-launch-template \
    --launch-template-name ron-ai-production-template \
    --launch-template-data '{
        "ImageId": "'$AMI_ID'",
        "InstanceType": "'$INSTANCE_TYPE'",
        "KeyName": "'$KEY_NAME'",
        "SecurityGroupIds": ["'$SECURITY_GROUP_ID'"],
        "UserData": "'$(base64 -w 0 user-data-production.sh)'",
        "BlockDeviceMappings": [
            {
                "DeviceName": "/dev/xvda",
                "Ebs": {
                    "VolumeSize": '$STORAGE_SIZE',
                    "VolumeType": "gp3",
                    "DeleteOnTermination": true,
                    "Encrypted": true
                }
            }
        ],
        "IamInstanceProfile": {
            "Name": "CloudWatchAgentServerRole"
        },
        "TagSpecifications": [
            {
                "ResourceType": "instance",
                "Tags": [
                    {"Key": "Name", "Value": "Ron-AI-Production"},
                    {"Key": "Environment", "Value": "Production"},
                    {"Key": "Application", "Value": "Ron-AI-Healthcare-Copilot"}
                ]
            }
        ]
    }' \
    --region $REGION \
    --query 'LaunchTemplate.LaunchTemplateId' \
    --output text)

echo "✅ Launch template created: $LAUNCH_TEMPLATE_ID"

# Create Application Load Balancer
echo "🔄 Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name $ALB_NAME \
    --subnets $SUBNET_1 $SUBNET_2 \
    --security-groups $ALB_SECURITY_GROUP_ID \
    --region $REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

echo "✅ Application Load Balancer created: $ALB_ARN"

# Create target group
echo "🎯 Creating target group..."
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name $TARGET_GROUP_NAME \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region $REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

echo "✅ Target group created: $TARGET_GROUP_ARN"

# Create listener
echo "👂 Creating ALB listener..."
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    --region $REGION

echo "✅ ALB listener created"

# Create Auto Scaling Group
echo "📈 Creating Auto Scaling Group..."
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name ron-ai-production-asg \
    --launch-template LaunchTemplateId=$LAUNCH_TEMPLATE_ID,Version='$Latest' \
    --min-size $MIN_INSTANCES \
    --max-size $MAX_INSTANCES \
    --desired-capacity $MIN_INSTANCES \
    --target-group-arns $TARGET_GROUP_ARN \
    --health-check-type ELB \
    --health-check-grace-period 300 \
    --vpc-zone-identifier "$SUBNET_1,$SUBNET_2" \
    --region $REGION

echo "✅ Auto Scaling Group created"

# Create scaling policies
echo "⚖️  Creating scaling policies..."
SCALE_UP_POLICY_ARN=$(aws autoscaling put-scaling-policy \
    --auto-scaling-group-name ron-ai-production-asg \
    --policy-name ron-ai-scale-up \
    --policy-type TargetTrackingScaling \
    --target-tracking-configuration '{
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
        }
    }' \
    --region $REGION \
    --query 'PolicyARN' \
    --output text)

echo "✅ Scaling policies created"

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --region $REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

# Wait for instances to be healthy
echo "⏳ Waiting for instances to be healthy (this may take 5-10 minutes)..."
sleep 300

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf ron-ai-production-deploy.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='venv' \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='.next' \
    --exclude='.DS_Store' \
    .

# Create production deployment script
cat > deploy-to-production.sh << EOF
#!/bin/bash
set -e

echo "🚀 Deploying to production instances..."

# Get instance IDs from Auto Scaling Group
INSTANCE_IDS=\$(aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names ron-ai-production-asg \
    --region $REGION \
    --query 'AutoScalingGroups[0].Instances[?LifecycleState==\`InService\`].InstanceId' \
    --output text)

for INSTANCE_ID in \$INSTANCE_IDS; do
    echo "📁 Deploying to instance: \$INSTANCE_ID"
    
    # Get instance IP
    INSTANCE_IP=\$(aws ec2 describe-instances \
        --instance-ids \$INSTANCE_ID \
        --region $REGION \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    
    # Copy files to instance
    scp -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ron-ai-production-deploy.tar.gz ec2-user@\$INSTANCE_IP:/tmp/
    
    # Deploy on instance
    ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ec2-user@\$INSTANCE_IP << 'DEPLOY_SCRIPT'
set -e

# Extract application
cd /opt/ron-ai
sudo tar -xzf /tmp/ron-ai-production-deploy.tar.gz --strip-components=1
sudo chown -R ec2-user:ec2-user /opt/ron-ai

# Create logs directory
mkdir -p /opt/ron-ai/logs

# Install Python dependencies
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Install Node.js dependencies and build
npm install
npm run build

# Create PM2 ecosystem file for production
cat > ecosystem.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [
    {
      name: 'ron-ai-backend',
      script: 'python3.11',
      args: 'backend/api.py',
      cwd: '/opt/ron-ai',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
        PYTHONPATH: '/opt/ron-ai:/opt/ron-ai/backend'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '2G',
      error_file: '/opt/ron-ai/logs/backend-error.log',
      out_file: '/opt/ron-ai/logs/backend-out.log',
      log_file: '/opt/ron-ai/logs/backend.log',
      time: true
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
      max_memory_restart: '2G',
      error_file: '/opt/ron-ai/logs/frontend-error.log',
      out_file: '/opt/ron-ai/logs/frontend-out.log',
      log_file: '/opt/ron-ai/logs/frontend.log',
      time: true
    }
  ]
};
PM2_CONFIG

# Start services
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "✅ Deployment complete on \$(hostname)!"
DEPLOY_SCRIPT

    echo "✅ Deployment complete on instance: \$INSTANCE_ID"
done

echo "🎉 Production deployment complete!"
EOF

chmod +x deploy-to-production.sh

# Cleanup
rm user-data-production.sh

echo ""
echo "🎉 Production AWS Infrastructure Setup Complete!"
echo "==============================================="
echo ""
echo "🌐 Your Ron AI Healthcare Copilot will be available at:"
echo "   http://$ALB_DNS"
echo ""
echo "📊 Infrastructure Details:"
echo "   Load Balancer: $ALB_DNS"
echo "   Instance Type: $INSTANCE_TYPE (4 vCPUs, 16GB RAM)"
echo "   Storage: ${STORAGE_SIZE}GB SSD per instance"
echo "   Min Instances: $MIN_INSTANCES"
echo "   Max Instances: $MAX_INSTANCES"
echo "   Auto Scaling: CPU-based (target 70%)"
echo ""
echo "📋 Next Steps:"
echo "1. Wait 5-10 minutes for instances to fully initialize"
echo "2. Run: ./deploy-to-production.sh"
echo "3. Monitor deployment: aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN --region $REGION"
echo "4. Access your application at: http://$ALB_DNS"
echo ""
echo "🔧 Management Commands:"
echo "   # Check Auto Scaling Group status"
echo "   aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names ron-ai-production-asg --region $REGION"
echo ""
echo "   # Check target health"
echo "   aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN --region $REGION"
echo ""
echo "   # Scale up manually"
echo "   aws autoscaling set-desired-capacity --auto-scaling-group-name ron-ai-production-asg --desired-capacity 3 --region $REGION"
echo ""
echo "   # SSH to instances"
echo "   aws ec2 describe-instances --filters 'Name=tag:Name,Values=Ron-AI-Production' --region $REGION --query 'Reservations[].Instances[].PublicIpAddress' --output text"
echo ""
echo "🔒 Security Features:"
echo "   - Encrypted EBS volumes"
echo "   - Security groups with minimal access"
echo "   - CloudWatch monitoring and logging"
echo "   - Auto Scaling for high availability"
echo ""
echo "💡 Production Recommendations:"
echo "   - Set up SSL certificate with AWS Certificate Manager"
echo "   - Configure Route 53 for custom domain"
echo "   - Set up CloudWatch alarms and SNS notifications"
echo "   - Implement backup strategy for application data"
echo ""
