# Official Claude Computer Use Implementation Guide

## 🎯 Overview
This guide implements Claude Computer Use on your EC2 instance following Anthropic's official documentation and reference implementation. It uses the latest API specifications and best practices.

## 📋 Key Updates from Official Documentation

### Latest API Specifications
- **Model**: `claude-sonnet-4-20250514` (Claude 4) or `claude-sonnet-3-7-20250109` (Claude 3.7)
- **Tool Version**: `computer_20250124` (latest)
- **Beta Flag**: `computer-use-2025-01-24`
- **Recommended Resolution**: 1280x800 (WXGA) or below

### Enhanced Actions (Claude 4 & 3.7)
The latest `computer_20250124` tool includes:
- ✅ **scroll** - Directional scrolling with amount control
- ✅ **left_click_drag** - Click and drag operations
- ✅ **right_click**, **middle_click** - Additional mouse buttons
- ✅ **double_click**, **triple_click** - Multiple click actions
- ✅ **left_mouse_down**, **left_mouse_up** - Fine-grained control
- ✅ **hold_key** - Hold keys while performing actions
- ✅ **wait** - Pause between actions

## 🚀 Quick Setup

### Step 1: Run Official Setup
```bash
chmod +x setup-claude-computer-use-official.sh
./setup-claude-computer-use-official.sh
```

This will:
- Install Anthropic's official `computer-use-demo` from GitHub
- Set up proper X11 virtual display (Xvfb)
- Configure VNC for monitoring Claude's actions
- Install all required dependencies

### Step 2: Configure API Key
```bash
# SSH into your instance
ssh -i ronscomputer.pem ec2-user@3.137.139.249

# Edit the environment file
cd ~/anthropic-quickstarts/computer-use-demo
nano .env

# Add your API key:
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### Step 3: Start the Environment
```bash
# Run the startup script
~/start_computer_use.sh
```

## 🖥️ Accessing Claude's Desktop

### VNC Connection
- **Address**: `3.137.139.249:5901`
- **Password**: `claude2024`
- **Resolution**: 1280x800 (optimized for Claude)

### Running the Official Demo
```bash
cd ~/anthropic-quickstarts/computer-use-demo
python3.11 -m computer_use_demo.loop
```

## 🔧 Official API Usage

### Basic Computer Use Request
```python
import anthropic

client = anthropic.Anthropic(api_key="your-api-key")

response = client.beta.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=[{
        "type": "computer_20250124",
        "name": "computer",
        "display_width_px": 1280,
        "display_height_px": 800,
        "display_number": 1,
    }],
    messages=[{
        "role": "user", 
        "content": "Take a screenshot and describe what you see"
    }],
    betas=["computer-use-2025-01-24"]
)
```

### Multi-Tool Usage (Computer + Bash + Text Editor)
```python
response = client.beta.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=2000,
    tools=[
        {
            "type": "computer_20250124",
            "name": "computer",
            "display_width_px": 1280,
            "display_height_px": 800,
            "display_number": 1,
        },
        {
            "type": "text_editor_20250124",
            "name": "str_replace_editor"
        },
        {
            "type": "bash_20250124",
            "name": "bash"
        }
    ],
    messages=[{
        "role": "user", 
        "content": "Create a Python script that displays 'Hello World' and run it"
    }],
    betas=["computer-use-2025-01-24"]
)
```

### Using Thinking Capability (Claude 3.7+)
```python
response = client.beta.messages.create(
    model="claude-sonnet-3-7-20250109",
    max_tokens=1024,
    tools=[{
        "type": "computer_20250124",
        "name": "computer",
        "display_width_px": 1280,
        "display_height_px": 800,
        "display_number": 1,
    }],
    messages=[{
        "role": "user", 
        "content": "Navigate to Google and search for 'Anthropic Claude'"
    }],
    thinking={
        "type": "enabled",
        "budget_tokens": 1024
    },
    betas=["computer-use-2025-01-24"]
)
```

## 🔄 Agent Loop Implementation

Here's the official agent loop pattern:

```python
async def computer_use_agent_loop(
    client: anthropic.Anthropic,
    messages: list,
    max_iterations: int = 10
):
    """Official agent loop for computer use interactions"""
    
    tools = [{
        "type": "computer_20250124",
        "name": "computer",
        "display_width_px": 1280,
        "display_height_px": 800,
        "display_number": 1,
    }]
    
    for iteration in range(max_iterations):
        # Call Claude API
        response = client.beta.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            tools=tools,
            messages=messages,
            betas=["computer-use-2025-01-24"]
        )
        
        # Add Claude's response to conversation
        messages.append({
            "role": "assistant", 
            "content": response.content
        })
        
        # Check for tool use
        tool_results = []
        for content in response.content:
            if content.type == "tool_use":
                # Execute the computer use action
                result = execute_computer_action(content.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": content.id,
                    "content": result
                })
        
        # If no tools used, task complete
        if not tool_results:
            break
            
        # Continue with tool results
        messages.append({
            "role": "user", 
            "content": tool_results
        })
    
    return messages
```

## 🎮 Available Actions

### Basic Actions (All Versions)
```python
# Screenshot
{"action": "screenshot"}

# Click
{"action": "left_click", "coordinate": [640, 400]}

# Type text
{"action": "type", "text": "Hello, Claude!"}

# Key press
{"action": "key", "key": "ctrl+s"}
```

### Enhanced Actions (Claude 4 & 3.7)
```python
# Scroll with direction and amount
{
    "action": "scroll",
    "coordinate": [640, 400],
    "scroll_direction": "down",
    "scroll_amount": 3
}

# Click and drag
{
    "action": "left_click_drag",
    "startCoordinate": [100, 100],
    "endCoordinate": [200, 200]
}

# Right click
{"action": "right_click", "coordinate": [640, 400]}

# Double click
{"action": "double_click", "coordinate": [640, 400]}

# Hold key while performing action
{"action": "hold_key", "key": "shift"}

# Wait/pause
{"action": "wait", "seconds": 2}
```

## 🔐 Security Best Practices

Following Anthropic's security recommendations:

### 1. Isolated Environment
- ✅ Running in EC2 instance (isolated from your main system)
- ✅ Using VNC for monitoring (no direct system access)
- ✅ Limited network access (configure security groups)

### 2. API Key Security
```bash
# Store API key securely
echo "ANTHROPIC_API_KEY=your_key" > .env
chmod 600 .env
```

### 3. Prompt Injection Protection
```python
# Anthropic automatically runs classifiers for prompt injection detection
# For additional protection, validate user inputs:

def validate_user_input(user_message):
    # Add your validation logic
    if "ignore previous instructions" in user_message.lower():
        return False, "Potentially unsafe input detected"
    return True, None
```

## 📊 Pricing Considerations

### Token Usage (Official Rates)
- **System prompt overhead**: 466-499 tokens
- **Computer tool definition**: 735 tokens (Claude 4/3.7)
- **Screenshots**: Variable based on image size
- **Tool results**: Based on response content

### Cost Optimization
```python
# Use appropriate max_tokens to control costs
response = client.beta.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,  # Adjust based on task complexity
    # ... other parameters
)

# Implement iteration limits
max_iterations = 10  # Prevent runaway loops
```

## 🧪 Testing Your Setup

### 1. Test API Connection
```bash
cd ~/anthropic-quickstarts/computer-use-demo
python3.11 ~/test_computer_use_api.py
```

### 2. Test VNC Access
Connect to `3.137.139.249:5901` with password `claude2024`

### 3. Run Official Demo
```bash
cd ~/anthropic-quickstarts/computer-use-demo
python3.11 -m computer_use_demo.loop
```

## 🔍 Troubleshooting

### Common Issues

#### API Key Not Set
```bash
# Check if API key is properly set
echo $ANTHROPIC_API_KEY
# Should not be empty or "your_api_key_here"
```

#### VNC Connection Failed
```bash
# Restart VNC server
vncserver -kill :1
vncserver :1 -geometry 1280x800 -depth 24
```

#### Display Issues
```bash
# Check X11 display
echo $DISPLAY
# Should be :1

# Test X11 applications
xterm &  # Should open a terminal window
```

## 🚀 Integration with Your Ron AI Backend

### Connect to Your Existing System
```python
# In your Ron AI backend, add computer use capability
from anthropic import Anthropic

class RonAIComputerUse:
    def __init__(self, api_key):
        self.client = Anthropic(api_key=api_key)
    
    async def execute_computer_task(self, task_description):
        """Execute a computer use task for Ron AI"""
        response = await self.client.beta.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            tools=[{
                "type": "computer_20250124",
                "name": "computer",
                "display_width_px": 1280,
                "display_height_px": 800,
                "display_number": 1,
            }],
            messages=[{
                "role": "user",
                "content": f"Ron AI Task: {task_description}"
            }],
            betas=["computer-use-2025-01-24"]
        )
        return response
```

## 📖 Next Steps

1. **Test the basic setup** with Anthropic's official demo
2. **Integrate with your Ron AI system** using the provided examples
3. **Explore advanced features** like multi-tool usage and thinking capability
4. **Monitor costs** and optimize for your use case
5. **Follow security best practices** for production deployment

## 📚 Resources

- [Official Anthropic Computer Use Docs](https://docs.anthropic.com/en/docs/build-with-claude/computer-use)
- [Reference Implementation](https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo)
- [API Reference](https://docs.anthropic.com/en/api/messages)

---

**Ready to start?** Run the setup script and begin exploring Claude's computer use capabilities!
