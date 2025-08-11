# Computer Use Tool for Ron AI

This tool enables Claude Sonnet 4 to control a computer desktop with interleaved thinking capabilities, allowing it to reason between actions for sophisticated healthcare automation workflows.

## Features

- **Interleaved Thinking**: Claude thinks between each action, providing reasoning for better decision-making
- **Desktop Automation**: Full computer control including screenshots, clicks, typing, and more
- **Healthcare Integration**: Designed for creating healthcare tools using Claude Code CLI
- **MongoDB Logging**: Optional logging of sessions, thinking, and actions
- **AWS VM Support**: Configured for AWS virtual desktop environments

## Setup

### 1. Environment Setup

Run the setup script on your AWS VM:

```bash
cd /backend/agents/claudeAgent/claude_tools/computer_use/
./setup_environment.sh
```

This will:
- Install required packages (xvfb, xdotool, imagemagick, etc.)
- Start virtual display on :1
- Configure desktop environment
- Test screenshot and automation capabilities

### 2. API Configuration

Ensure your environment has:
```bash
export ANTHROPIC_API_KEY="your-api-key"
export DISPLAY=:1
```

## Usage

The computer_use tool can be called from Claude like any other tool:

```python
# From claude_completions.py or any tool execution
result = await execute_tool("computer_use", {
    "task": "Open terminal and install Claude Code CLI, then create a medication tracker",
    "max_iterations": 15,
    "thinking_budget": 10000
})
```

### Parameters

- **task** (required): The desktop automation task to perform
- **max_iterations** (optional, default: 10): Maximum thinking-action cycles
- **thinking_budget** (optional, default: 10000): Token budget for thinking

### Return Format

```python
{
    "success": True,
    "task_completed": True,
    "screenshots": ["base64_encoded_data..."],
    "thinking_logs": [
        "I need to open a terminal first...",
        "Terminal is open, now I'll install Claude Code CLI...",
        "Installation complete, creating medication tracker..."
    ],
    "actions_taken": [
        {"action": "screenshot", "input": {}},
        {"action": "key", "input": {"key": "ctrl+alt+t"}},
        {"action": "type", "input": {"text": "npm install -g @anthropic/claude-code"}}
    ],
    "final_result": "Medication tracker created successfully",
    "session_id": "20240804_123456"
}
```

## Supported Actions

### Computer Actions
- **screenshot**: Capture current screen
- **left_click**: Click at coordinates
- **type**: Type text
- **key**: Press key or key combination
- **scroll**: Scroll at position
- **left_click_drag**: Drag from one position to another

### Bash Actions
- Execute shell commands with timeout support

### Text Editor Actions
- Basic text editor operations (extensible)

## Example Healthcare Workflows

### 1. Install Claude Code CLI and Create Tool
```
Task: "Install Claude Code CLI and create a medication cost calculator for diabetes medications"
```

### 2. Generate and Test Healthcare Dashboard
```
Task: "Create a patient dashboard showing medication schedules, then test it in a browser"
```

### 3. Automate Form Filling
```
Task: "Open a browser, navigate to a healthcare form, and fill it with test patient data"
```

## Troubleshooting

### Display Issues
If you get display errors:
```bash
export DISPLAY=:1
xhost +local:
```

### Screenshot Failures
Ensure ImageMagick is installed:
```bash
sudo apt install imagemagick
```

### xdotool Not Working
Test xdotool manually:
```bash
DISPLAY=:1 xdotool getdisplaygeometry
```

## Security Notes

- Only run on controlled AWS VMs
- Never expose to public internet
- Screenshots may contain sensitive data
- All actions are logged for audit

## Integration with Ron AI

This tool integrates seamlessly with:
- Browser automation tools
- FDA drug lookup tools
- PubMed research tools
- Clinical agent tools

It's designed to work alongside existing tools to create comprehensive healthcare solutions.