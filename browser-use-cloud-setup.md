# Browser-Use Cloud API Setup Guide

This document describes how to configure and use the new browser-use Cloud API integration in Ron's AI system.

## Environment Variables Required

Add these to your `.env` file:

```bash
# Browser-Use Cloud API Configuration
BROWSER_USE_API_KEY=your_browser_use_cloud_api_key_here
```

## API Key Setup

1. Visit [cloud.browser-use.com/billing](https://cloud.browser-use.com/billing)
2. Get your API key from your subscription
3. Add it to your environment variables
4. Restart the backend server

## New Tool Names for Ron

The following tools are now available for Ron's browser automation:

### Primary Tools

- `browser_use_cloud_automation` - Main browser automation tool
- `browser_use_cloud_pause` - Pause task for human intervention
- `browser_use_cloud_resume` - Resume with context from human actions
- `browser_use_cloud_status` - Check task status and progress
- `browser_use_cloud_stop` - Stop task permanently
- `browser_use_cloud_list_active` - List all active tasks
- `browser_use_cloud_account_status` - Check API account status

### Usage Examples

#### Basic Browser Automation

```json
{
  "tool_name": "browser_use_cloud_automation",
  "tool_input": {
    "task": "Go to google.com and search for 'browser automation'",
    "use_case": "ultra-fast",
    "stealth_mode": true
  }
}
```

#### Smart Mode for Complex Tasks

```json
{
  "tool_name": "browser_use_cloud_automation",
  "tool_input": {
    "task": "Navigate to a complex form, fill it out with provided data, and submit it",
    "use_case": "smart-o3",
    "stealth_mode": true
  }
}
```

#### Human-in-the-Loop Workflow

```json
// 1. Pause for human intervention
{
  "tool_name": "browser_use_cloud_pause",
  "tool_input": {
    "task_id": "task_123",
    "reason": "Need human verification for captcha"
  }
}

// 2. Resume with context
{
  "tool_name": "browser_use_cloud_resume",
  "tool_input": {
    "task_id": "task_123",
    "human_actions": "Completed captcha and clicked continue",
    "additional_instructions": "Now proceed to fill out the form"
  }
}
```

## Use Case Selection

- **ultra-fast**: Uses Groq/Gemini (fastest, $0.01/step) - Default
- **smart-o3**: Uses GPT-4o (smarter, $0.03/step) - For complex reasoning
- **balanced**: Uses GPT-4o-mini (balanced cost/performance)

## Features Included

1. **Stealth Mode**: Anti-bot detection enabled by default
2. **Live URL**: Real-time browser viewing through iframe
3. **Human Takeover**: Pause/resume with context passing
4. **Task Management**: Full lifecycle control
5. **Cost Optimization**: Multiple model options
6. **Error Handling**: Comprehensive retry logic
7. **Session Management**: Automatic cleanup

## Integration Points

### Frontend

- `computer-use-agent.tsx` - Displays live URL in iframe
- API routes updated to use tool system
- Human intervention UI ready

### Backend

- New tool registration in `tools.py`
- Browser-use Cloud client and service
- Proper error handling and logging

## Migration from Old System

The following old tools are replaced:

- ❌ `create_browser_session` → ✅ `browser_use_cloud_automation`
- ❌ `browser_use` → ✅ `browser_use_cloud_automation`
- ❌ `check_browser_session` → ✅ `browser_use_cloud_status`
- ❌ Manual session management → ✅ Automatic with Cloud API

## System Prompt Updates

Ron now knows about these tools and their capabilities:

- Browser automation with live URL feedback
- Human-in-the-loop capabilities
- Cost-efficient model selection
- Stealth mode for anti-bot protection
- Complete task lifecycle management

## Testing

Test the integration with:

```bash
curl -X POST http://localhost:8001/execute-agent-tool-stream \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "browser_use_cloud_automation",
    "tool_input": {
      "task": "Navigate to google.com and search for test",
      "use_case": "ultra-fast"
    }
  }'
```

## Troubleshooting

1. **API Key Issues**: Check environment variable is set
2. **Rate Limiting**: Use appropriate delays between requests
3. **Session Cleanup**: Use list and stop tools for management
4. **Live URL**: Ensure iframe src is properly set

## Security Considerations

- API keys stored in environment variables only
- No client-side API key exposure
- Proper input validation on all endpoints
- Rate limiting implemented

## Performance Optimization

- Parallel task execution supported
- Caching for session management
- Efficient model selection based on task complexity
- Automatic cleanup of completed tasks
