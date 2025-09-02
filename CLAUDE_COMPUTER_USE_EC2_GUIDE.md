# Claude Computer Use EC2 Setup Guide

## 🎯 Overview
This guide will help you set up your existing EC2 instance (`i-0429ff77dfba380e1`) as a Claude Computer Use environment, allowing Claude to interact with a desktop environment through your EC2 instance.

## 📋 Instance Details
- **Instance ID**: i-0429ff77dfba380e1
- **Public IP**: 3.137.139.249
- **Region**: us-east-2
- **SSH Key**: ronscomputer.pem

## 🚀 Quick Setup

### Step 1: Run the Setup Script
```bash
# Make the setup script executable and run it
chmod +x setup-claude-computer-use.sh
./setup-claude-computer-use.sh
```

### Step 2: Upload Your Code
```bash
# Upload your Claude computer use code to the instance
chmod +x upload-claude-code.sh
./upload-claude-code.sh
```

### Step 3: Configure API Key
```bash
# SSH into your instance
ssh -i ronscomputer.pem ec2-user@3.137.139.249

# Navigate to the Claude directory
cd ~/claude-computer-use

# Edit the environment file
nano .env

# Add your Anthropic API key:
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### Step 4: Start the Environment
```bash
# On the EC2 instance, run:
./start_claude_computer_use.sh
```

## 🖥️ Accessing the Desktop

### VNC Connection
- **Address**: 3.137.139.249:5901
- **Password**: claude123
- **Resolution**: 1920x1080

### VNC Clients
- **macOS**: Use built-in Screen Sharing or download RealVNC Viewer
- **Windows**: Download RealVNC Viewer or TightVNC
- **Linux**: Use Remmina or TigerVNC viewer

## 🔧 What Gets Installed

### System Components
- ✅ Desktop environment (XFCE)
- ✅ VNC server (TigerVNC)
- ✅ Python 3.11
- ✅ Docker
- ✅ Chrome/Chromium browser
- ✅ Git

### Python Dependencies
- ✅ anthropic (Claude API client)
- ✅ pillow (Image processing)
- ✅ pyautogui (GUI automation)
- ✅ opencv-python (Computer vision)
- ✅ selenium (Web automation)

## 🧪 Testing the Setup

### 1. Test SSH Connection
```bash
ssh -i ronscomputer.pem ec2-user@3.137.139.249
```

### 2. Test Python Environment
```bash
cd ~/claude-computer-use
python3.11 test_computer_use.py
```

### 3. Test VNC Connection
Connect to `3.137.139.249:5901` with password `claude123`

## 🔐 Security Group Requirements

Your instance needs these ports open:
- **22** (SSH)
- **5901** (VNC)
- **80/443** (HTTP/HTTPS - optional)
- **8000** (Claude API - optional)

### Check Security Group
```bash
# Check current security group rules (adjust region)
aws ec2 describe-security-groups --region us-east-2 --group-ids <your-security-group-id>
```

### Add VNC Port (if needed)
```bash
# Add VNC port to security group
aws ec2 authorize-security-group-ingress \
    --group-id <your-security-group-id> \
    --protocol tcp \
    --port 5901 \
    --cidr 0.0.0.0/0 \
    --region us-east-2
```

## 🎮 Using Claude Computer Use

### Basic Usage
```python
#!/usr/bin/env python3.11

import os
from anthropic import Anthropic

# Set up Claude client
client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# Example: Ask Claude to take a screenshot and describe it
message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1000,
    tools=[{
        "type": "computer_use",
        "name": "computer",
        "display_width_px": 1920,
        "display_height_px": 1080,
        "display_number": 1
    }],
    messages=[{
        "role": "user", 
        "content": "Take a screenshot and tell me what you see on the desktop"
    }]
)

print(message.content)
```

### Advanced Features
- **Screen capture**: Claude can see the desktop
- **Mouse control**: Click, drag, scroll
- **Keyboard input**: Type text, use shortcuts
- **Browser automation**: Navigate websites
- **File operations**: Create, edit, move files

## 🔍 Troubleshooting

### SSH Connection Issues
```bash
# Check instance status
aws ec2 describe-instances --instance-ids i-0429ff77dfba380e1 --region us-east-2

# Verify SSH key permissions
chmod 400 ronscomputer.pem
```

### VNC Connection Issues
```bash
# On EC2 instance, restart VNC
vncserver -kill :1
vncserver :1 -geometry 1920x1080 -depth 24

# Check VNC process
ps aux | grep vnc
```

### Python/API Issues
```bash
# Check Python installation
python3.11 --version

# Check installed packages
python3.11 -m pip list --user

# Test API key
echo $ANTHROPIC_API_KEY
```

## 📁 File Structure on EC2

```
/home/ec2-user/
├── claude-computer-use/           # Your uploaded code
│   ├── .env                      # Environment variables
│   ├── start_claude_computer_use.sh  # Launcher script
│   ├── test_computer_use.py      # Test script
│   └── [your claude files]       # Your existing code
├── .vnc/                         # VNC configuration
│   ├── passwd                    # VNC password file
│   └── xstartup                  # VNC startup script
└── remote-setup.sh               # Setup script (can be deleted)
```

## 🚀 Next Steps

1. **Test the basic setup** with the provided test script
2. **Upload your specific Claude computer use code** 
3. **Configure your Anthropic API key**
4. **Test computer use functionality** through VNC
5. **Integrate with your Ron AI backend** if needed

## 💡 Tips

- Use VNC for visual debugging and monitoring
- Keep the VNC session active for Claude to interact with
- Monitor instance costs (t3.xlarge can be expensive if left running)
- Consider using spot instances for cost savings
- Set up CloudWatch monitoring for the instance

## 🆘 Support

If you encounter issues:
1. Check the setup logs on the EC2 instance
2. Verify all dependencies are installed
3. Test each component individually
4. Check AWS security group and network settings

---

**Ready to proceed?** Run the setup scripts and let me know if you need help with any specific step!
