#!/bin/bash

# Ron AI Healthcare Copilot - Google Cloud Platform Deployment Script
set -e

echo "☁️  Ron AI Healthcare Copilot - GCP Deployment"
echo "=============================================="

# Configuration
PROJECT_ID="ron-ai-healthcare"
REGION="us-central1"
ZONE="us-central1-a"
INSTANCE_NAME="ron-ai-instance"
MACHINE_TYPE="e2-standard-4"  # 4 vCPUs, 16GB RAM
IMAGE_FAMILY="ubuntu-2004-lts"
IMAGE_PROJECT="ubuntu-os-cloud"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK is required but not installed."
    echo "Please install gcloud: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

echo "✅ Google Cloud SDK is configured"

# Set project
echo "🔧 Setting up project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# Create firewall rules
echo "🔒 Creating firewall rules..."
gcloud compute firewall-rules create ron-ai-http \
    --allow tcp:80,tcp:443,tcp:3000,tcp:8000 \
    --source-ranges 0.0.0.0/0 \
    --description "Ron AI Healthcare Copilot HTTP/HTTPS access" \
    --quiet || echo "Firewall rule already exists"

gcloud compute firewall-rules create ron-ai-ssh \
    --allow tcp:22 \
    --source-ranges 0.0.0.0/0 \
    --description "SSH access for Ron AI" \
    --quiet || echo "SSH firewall rule already exists"

# Create startup script
cat > startup-script.sh << 'EOF'
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Python 3.9
apt-get install -y python3.9 python3.9-venv python3.9-dev python3-pip

# Install Git
apt-get install -y git

# Install Nginx
apt-get install -y nginx
systemctl enable nginx

# Create application directory
mkdir -p /opt/ron-ai
chown $USER:$USER /opt/ron-ai

# Install PM2
npm install -g pm2

echo "✅ Server setup complete"
EOF

# Create the VM instance
echo "🚀 Creating VM instance..."
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=$(gcloud iam service-accounts list --format="value(email)" --filter="displayName:Compute Engine default service account") \
    --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append \
    --tags=http-server,https-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image=projects/$IMAGE_PROJECT/global/images/family/$IMAGE_FAMILY,mode=rw,size=50,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-standard \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --reservation-affinity=any \
    --metadata-from-file startup-script=startup-script.sh

echo "✅ VM instance created: $INSTANCE_NAME"

# Wait for instance to be running
echo "⏳ Waiting for instance to be ready..."
sleep 60

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "✅ Instance is running at: $EXTERNAL_IP"

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

# Copy files to instance
echo "📁 Copying files to instance..."
gcloud compute scp ron-ai-deploy.tar.gz $INSTANCE_NAME:/tmp/ --zone=$ZONE
gcloud compute scp docker-compose.yml $INSTANCE_NAME:/tmp/ --zone=$ZONE

# Create deployment script for the instance
cat > deploy-on-gcp.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying Ron AI on GCP instance..."

# Extract application
cd /opt/ron-ai
sudo tar -xzf /tmp/ron-ai-deploy.tar.gz --strip-components=1
sudo chown -R $USER:$USER /opt/ron-ai

# Copy docker-compose file
cp /tmp/docker-compose.yml /opt/ron-ai/

# Start services with Docker Compose
cd /opt/ron-ai
docker-compose up --build -d

echo "✅ Deployment complete!"
echo "🌐 Application should be available at: http://$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google")"
EOF

# Execute deployment on instance
gcloud compute scp deploy-on-gcp.sh $INSTANCE_NAME:/tmp/ --zone=$ZONE
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="chmod +x /tmp/deploy-on-gcp.sh && /tmp/deploy-on-gcp.sh"

# Cleanup local files
rm startup-script.sh deploy-on-gcp.sh ron-ai-deploy.tar.gz

echo ""
echo "🎉 GCP Deployment Complete!"
echo "==========================="
echo ""
echo "🌐 Your Ron AI Healthcare Copilot is now running at:"
echo "   http://$EXTERNAL_IP"
echo ""
echo "📊 Instance Details:"
echo "   Name: $INSTANCE_NAME"
echo "   Zone: $ZONE"
echo "   External IP: $EXTERNAL_IP"
echo "   Machine Type: $MACHINE_TYPE"
echo ""
echo "🔧 Management Commands:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "   gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE"
echo "   gcloud compute instances start $INSTANCE_NAME --zone=$ZONE"
echo "   gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "📈 Monitoring:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='docker ps'"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='docker-compose logs'"
echo ""
echo "💡 Next Steps:"
echo "   - Set up a custom domain and SSL certificate"
echo "   - Configure Cloud Load Balancer for high availability"
echo "   - Set up Cloud Monitoring and Logging"
echo "   - Consider using Cloud Run for serverless deployment"
echo ""
