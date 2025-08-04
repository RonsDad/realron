# Claude Computer Use Environment

A complete implementation of Anthropic's Claude computer use capability on Ubuntu EC2, enabling Claude to interact with desktop applications, CLI tools, and perform autonomous computer tasks through computer vision and automation.

## 🚀 Features

### Computer Use Capabilities
- **Screenshot Analysis**: Claude can see and analyze the desktop
- **Mouse Control**: Click, drag, scroll, and precise cursor movement
- **Keyboard Input**: Type text and execute key combinations
- **Desktop Automation**: Interact with any GUI application
- **CLI Integration**: Direct interaction with command-line tools
- **Browser Automation**: Navigate and interact with web applications

### Claude CLI Integration
- **Code Analysis**: Analyze codebases using Claude CLI
- **Code Review**: Automated code review and suggestions
- **Documentation**: Generate comprehensive project documentation
- **Refactoring**: Get intelligent refactoring recommendations
- **Interactive Sessions**: Real-time Claude CLI interaction

## 📋 Prerequisites

- AWS Account with EC2 access
- Anthropic API key
- SSH key pair for EC2 access
- VNC client for desktop access (optional)

## 🛠️ Quick Setup

### 1. Deploy to EC2

```bash
# Clone this repository
git clone <repository-url>
cd claude-computer-use

# Configure deployment (edit deploy-to-ec2.sh)
# Set your key pair name and region
vim deploy-to-ec2.sh

# Deploy to EC2
./deploy-to-ec2.sh
```

### 2. Configure API Key

```bash
# SSH into your EC2 instance
ssh -i ~/.ssh/your-key.pem ubuntu@<public-ip>

# Edit environment configuration
cd /home/ubuntu/claude-agent
vim .env

# Add your Anthropic API key
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 3. Upload Agent Code

```bash
# Copy the agent files to your EC2 instance
scp -i ~/.ssh/your-key.pem claude_computer_agent.py ubuntu@<public-ip>:/home/ubuntu/claude-agent/
scp -i ~/.ssh/your-key.pem claude_cli_integration.py ubuntu@<public-ip>:/home/ubuntu/claude-agent/
scp -i ~/.ssh/your-key.pem requirements.txt ubuntu@<public-ip>:/home/ubuntu/claude-agent/
```

### 4. Start the Environment

```bash
# On the EC2 instance
cd /home/ubuntu/claude-agent
./start-claude-env.sh
```

## 🖥️ Manual Setup (Local or Custom Server)

### 1. Run Environment Setup

```bash
# Make scripts executable
chmod +x *.sh

# Run the setup script
./setup-environment.sh
```

### 2. Install Python Dependencies

```bash
cd /home/ubuntu/claude-agent
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Edit .env file
vim .env

# Set your API key and preferences
ANTHROPIC_API_KEY=your_api_key_here
DISPLAY=:1
SCREEN_WIDTH=1024
SCREEN_HEIGHT=768
VNC_PASSWORD=claude123
```

### 4. Start Services

```bash
./start-claude-env.sh
```

## 🎯 Usage

### Basic Computer Use Agent

```bash
# Start the main agent
cd /home/ubuntu/claude-agent
source venv/bin/activate
python claude_computer_agent.py
```

Example interactions:
- "Take a screenshot and tell me what you see"
- "Open Firefox and navigate to GitHub"
- "Create a new text file and write a Python script"
- "Find and open the terminal application"

### Claude CLI Integration

```bash
# Start the CLI integration agent
python claude_cli_integration.py
```

Available commands:
- `analyze <path>` - Analyze codebase with Claude CLI
- `review <file>` - Review code file
- `docs <path>` - Generate documentation
- `refactor <file>` - Get refactoring suggestions
- `interactive` - Start interactive Claude CLI session
- `terminal` - Open new terminal
- `screenshot` - Take screenshot

### Web Interface Access

- **VNC Desktop**: Connect to `<public-ip>:5901` (password: claude123)
- **VSCode Server**: Open `http://<public-ip>:3000`

## 🔧 Validation and Troubleshooting

### Run Validation Script

```bash
./validate-setup.sh
```

This will check:
- ✅ All required packages installed
- ✅ X11 display working
- ✅ VNC server running
- ✅ Python environment configured
- ✅ Claude CLI installed
- ✅ Network connectivity

### Common Issues

#### 1. X11 Display Not Working
```bash
# Check if Xvfb is running
ps aux | grep Xvfb

# Restart if needed
export DISPLAY=:1
Xvfb :1 -screen 0 1024x768x24 -ac &
```

#### 2. VNC Connection Failed
```bash
# Check VNC server
ps aux | grep x11vnc

# Restart VNC
DISPLAY=:1 x11vnc -forever -usepw -display :1 -rfbport 5901 &
```

#### 3. Claude CLI Not Found
```bash
# Install Claude CLI
npm install -g @anthropic/claude-code

# Verify installation
claude --version
```

#### 4. Python Dependencies Missing
```bash
cd /home/ubuntu/claude-agent
source venv/bin/activate
pip install -r requirements.txt
```

#### 5. API Key Issues
```bash
# Check API key is set
echo $ANTHROPIC_API_KEY

# Verify API connectivity
curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages
```

## 🏗️ Architecture

```
Claude Computer Use Environment
├── Virtual Display (Xvfb)
│   ├── Window Manager (Mutter)
│   ├── Desktop Panel (Tint2)
│   └── Applications (Firefox, Terminal, etc.)
├── VNC Server (x11vnc)
├── VSCode Server (OpenVSCode)
├── Python Agent
│   ├── Computer Use Tool
│   ├── Screenshot Capture
│   ├── Mouse/Keyboard Control
│   └── CLI Integration
└── Claude API Integration
```

## 🔒 Security Considerations

### Isolation
- Dedicated `claude-user` with resource limits
- Sandboxed environment with restricted permissions
- Network access controls via security groups

### Resource Limits
```bash
# CPU and memory limits
claude-user hard cpu 2
claude-user hard memory 2048000
claude-user hard nproc 100
```

### Network Security
- VNC access restricted to specific IPs
- API keys stored in environment variables
- No sensitive data in logs

## 📊 Monitoring and Logs

### Service Status
```bash
# Check all services
systemctl status claude-env

# View logs
journalctl -u claude-env -f
```

### Application Logs
```bash
# Agent logs
tail -f /home/ubuntu/claude-agent/logs/agent.log

# System logs
tail -f /var/log/user-data.log
```

## 🚀 Advanced Usage

### Custom Tool Integration

```python
# Add custom tools to the agent
def execute_custom_tool(self, action: str, **kwargs):
    if action == "my_custom_action":
        # Implement your custom functionality
        return {"result": "Custom action completed"}
```

### Batch Operations

```python
# Execute multiple actions in sequence
async def batch_operations(self, operations):
    results = []
    for operation in operations:
        result = await self.execute_computer_action(**operation)
        results.append(result)
    return results
```

### Integration with External APIs

```python
# Integrate with external services
async def integrate_external_api(self, api_endpoint, data):
    # Make API calls and use results in computer use actions
    response = await make_api_call(api_endpoint, data)
    return await self.process_api_response(response)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Run the validation script
3. Review the logs
4. Open an issue with detailed information

## 🔗 Related Resources

- [Anthropic Computer Use Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool)
- [Claude CLI Documentation](https://github.com/anthropics/claude-cli)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [VNC Setup Guide](https://help.ubuntu.com/community/VNC)
