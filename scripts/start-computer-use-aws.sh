#!/usr/bin/env bash
set -euo pipefail

# Minimal AWS launcher for Claude Computer Use VM
# - Creates/starts an EC2 instance with VNC + OpenVSCode Server
# - Idempotent: reuses SG/instance/key when present

REGION="${REGION:-us-east-1}"
NAME_TAG="Claude-Computer-Use"
SG_NAME="claude-computer-use-sg"
AMI_ID="${AMI_ID:-ami-0c02fb55956c7d316}"   # Ubuntu 22.04 LTS in us-east-1
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.medium}"

if ! command -v aws >/dev/null 2>&1; then
  echo "awscli not found. Please install and configure AWS CLI (aws configure)." >&2
  exit 1
fi

# Verify credentials
aws sts get-caller-identity >/dev/null 2>&1 || { echo "AWS credentials not configured." >&2; exit 1; }

echo "[aws] Region: $REGION"

# Resolve default VPC
VPC_ID=$(aws ec2 describe-vpcs \
  --filters Name=is-default,Values=true \
  --query 'Vpcs[0].VpcId' --output text --region "$REGION")
if [[ -z "$VPC_ID" || "$VPC_ID" == "None" ]]; then
  echo "No default VPC in $REGION" >&2
  exit 1
fi
echo "[aws] VPC: $VPC_ID"

# Ensure Security Group
SG_ID=$(aws ec2 describe-security-groups \
  --filters Name=group-name,Values=$SG_NAME Name=vpc-id,Values=$VPC_ID \
  --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" 2>/dev/null || true)
if [[ -z "$SG_ID" || "$SG_ID" == "None" ]]; then
  SG_ID=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "Security group for Claude Computer Use" \
    --vpc-id "$VPC_ID" \
    --region "$REGION" \
    --query 'GroupId' --output text)
  echo "[aws] Created SG: $SG_ID"
else
  echo "[aws] Using SG: $SG_ID"
fi

# Ingress rules (idempotent)
YOUR_IP=$(curl -s ifconfig.me || echo "0.0.0.0")
allow_rule() { local PORT=$1 CIDR=$2; aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port "$PORT" --cidr "$CIDR" --region "$REGION" >/dev/null 2>&1 || true; }
allow_rule 22 0.0.0.0/0
allow_rule 5901 ${YOUR_IP}/32
allow_rule 3000 ${YOUR_IP}/32
allow_rule 80 0.0.0.0/0
allow_rule 443 0.0.0.0/0

# Find existing instance by tag
EXISTING_INSTANCE=$(aws ec2 describe-instances \
  --filters Name=tag:Name,Values=$NAME_TAG Name=instance-state-name,Values=pending,running,stopping,stopped \
  --query 'sort_by(Reservations[].Instances[], &LaunchTime)[-1].InstanceId' \
  --output text --region "$REGION" 2>/dev/null || true)

# Ensure key pair (create local if not available)
KEY_DIR="$HOME/.ssh"
mkdir -p "$KEY_DIR"
KEY_PATH=$(ls -t $KEY_DIR/claude-computer-use-*.pem 2>/dev/null | head -1 || true)
if [[ -z "${KEY_PATH}" ]]; then
  KEY_NAME="claude-computer-use-$(date +%s)"
  KEY_PATH="$KEY_DIR/${KEY_NAME}.pem"
  KP_CREATE=$(aws ec2 create-key-pair --key-name "$KEY_NAME" --query 'KeyMaterial' --output text --region "$REGION")
  umask 077; echo "$KP_CREATE" > "$KEY_PATH"; chmod 400 "$KEY_PATH"
else
  KEY_NAME=$(basename "$KEY_PATH" .pem)
fi
echo "[aws] Using key: $KEY_NAME ($KEY_PATH)"

if [[ -n "$EXISTING_INSTANCE" && "$EXISTING_INSTANCE" != "None" ]]; then
  STATE=$(aws ec2 describe-instances --instance-ids "$EXISTING_INSTANCE" --region "$REGION" --query 'Reservations[0].Instances[0].State.Name' --output text)
  echo "[aws] Found instance $EXISTING_INSTANCE (state=$STATE)"
  if [[ "$STATE" == "stopped" ]]; then
    aws ec2 start-instances --instance-ids "$EXISTING_INSTANCE" --region "$REGION" >/dev/null
    aws ec2 wait instance-running --instance-ids "$EXISTING_INSTANCE" --region "$REGION"
  elif [[ "$STATE" == "stopping" ]]; then
    echo "[aws] Waiting for instance to stop..."; aws ec2 wait instance-stopped --instance-ids "$EXISTING_INSTANCE" --region "$REGION"
    aws ec2 start-instances --instance-ids "$EXISTING_INSTANCE" --region "$REGION" >/dev/null
    aws ec2 wait instance-running --instance-ids "$EXISTING_INSTANCE" --region "$REGION"
  fi
  INSTANCE_ID="$EXISTING_INSTANCE"
else
  echo "[aws] Launching new instance..."
  # Create cloud-init on the fly
  cat > .user-data-cloud-init.sh << 'EOF'
#!/bin/bash
set -e
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
apt update && apt upgrade -y
apt install -y \
  xvfb mutter tint2 x11vnc firefox libreoffice gedit nautilus \
  gnome-terminal python3 python3-pip python3-venv curl wget git \
  build-essential xdotool scrot imagemagick unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g @anthropic/claude-code @gitpod/openvscode-server
mkdir -p /home/ubuntu/claude-agent/{tools,logs}
cd /home/ubuntu/claude-agent
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install anthropic pillow pyautogui pynput opencv-python fastapi uvicorn websockets python-dotenv requests aiofiles
cat > /home/ubuntu/claude-agent/.env << 'ENVEOF'
ANTHROPIC_API_KEY=your_api_key_here
DISPLAY=:1
SCREEN_WIDTH=1280
SCREEN_HEIGHT=800
VNC_PASSWORD=claude123
OPENVSCODE_SERVER_TOKEN=changeme
ENVEOF
chown -R ubuntu:ubuntu /home/ubuntu/claude-agent
mkdir -p /home/ubuntu/.vnc
/bin/echo "claude123" | vncpasswd -f > /home/ubuntu/.vnc/passwd
chmod 600 /home/ubuntu/.vnc/passwd
chown -R ubuntu:ubuntu /home/ubuntu/.vnc
EOF

  INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --user-data file://.user-data-cloud-init.sh \
    --region "$REGION" \
    --tag-specifications '[{"ResourceType":"instance","Tags":[{"Key":"Name","Value":"Claude-Computer-Use"}]}]' \
    --query 'Instances[0].InstanceId' --output text)
  echo "[aws] Instance launched: $INSTANCE_ID"
  aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
fi

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "[aws] Public IP: $PUBLIC_IP"

# Prepare helper scripts locally (upload each run to keep simple)
cat > .start-claude-env.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /home/ubuntu/claude-agent
export $(grep -v '^#' .env | xargs -d '\n' -I{} echo {})
if ! pgrep -f "Xvfb :1" >/dev/null; then
  Xvfb :1 -screen 0 ${SCREEN_WIDTH:-1280}x${SCREEN_HEIGHT:-800}x24 -ac -nolisten tcp &
  sleep 1
fi
nohup mutter --sm-disable --replace >/dev/null 2>&1 &
nohup tint2 >/dev/null 2>&1 &
if ! pgrep -f "x11vnc -display :1" >/dev/null; then
  x11vnc -display :1 -forever -passwd "${VNC_PASSWORD:-claude123}" -rfbport 5901 -shared >/dev/null 2>&1 &
fi
if ! pgrep -f "openvscode-server .*--port 3000" >/dev/null; then
  openvscode-server --host 0.0.0.0 --port 3000 --connection-token "${OPENVSCODE_SERVER_TOKEN:-changeme}" >/dev/null 2>&1 &
fi
EOF

chmod 600 "$KEY_PATH"

# Wait for SSH readiness (max ~5 minutes)
ATTEMPTS=0
until ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@"$PUBLIC_IP" 'echo "SSH Ready"' >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS+1)); [[ $ATTEMPTS -gt 60 ]] && echo "SSH not reachable after ~5 minutes." >&2 && exit 2; sleep 5; done

scp -i "$KEY_PATH" -o StrictHostKeyChecking=no .start-claude-env.sh ubuntu@"$PUBLIC_IP":/home/ubuntu/claude-agent/start-claude-env.sh >/dev/null
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@"$PUBLIC_IP" 'chmod +x /home/ubuntu/claude-agent/start-claude-env.sh && /home/ubuntu/claude-agent/start-claude-env.sh || true' >/dev/null

echo "SSH: ssh -i $KEY_PATH ubuntu@$PUBLIC_IP"
echo "VNC: $PUBLIC_IP:5901 (password: claude123)"
echo "VSCode: http://$PUBLIC_IP:3000 (token in /home/ubuntu/claude-agent/.env)"


