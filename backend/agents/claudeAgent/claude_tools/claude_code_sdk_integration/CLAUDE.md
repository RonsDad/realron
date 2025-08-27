# CLAUDE.md - Claude Code SDK Integration Documentation

This document contains the ACTUAL documentation for Claude Code SDK based on official sources.

## Official Claude Code SDK Information

### Package Installation

**NPM Package:**
```bash
npm install -g @anthropic-ai/claude-code
```

**Python Package:**
```bash
pip install claude-code-sdk
```

**Native Install (CLI):**
```bash
# macOS/Linux/WSL
curl -fsSL claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
```

### SDK Implementation Methods

#### TypeScript SDK

```typescript
import { query } from "@anthropic-ai/claude-code";

// Basic usage with query() function
for await (const message of query({
  prompt: "Your task here",
  options: {
    systemPrompt: "Define the agent's role",
    allowedTools: ["Bash", "Read", "Write", "WebSearch"],
    maxTurns: 5,
    permissionMode: "default" // or "acceptEdits", "plan", "bypassPermissions"
  }
})) {
  if (message.type === "result") {
    console.log(message.result);
  }
}
```

#### Python SDK

```python
from claude_code_sdk import ClaudeSDKClient

# Uses async context manager
async with ClaudeSDKClient() as client:
    # Implementation details from docs are limited
    pass
```

### Core Features (From Documentation)

1. **Multi-turn Conversations**: Supports maintaining context across interactions
2. **Tool Management**: Control which tools the agent can use via `allowedTools`
3. **Permission Modes**: Different permission levels for agent operations
4. **Output Formats**: Text (default), JSON, Streaming JSON
5. **Session Support**: Maintain sessions for continued conversations
6. **MCP Extension**: Model Context Protocol for extending capabilities
7. **Tool Confirmation**: `canUseTool` callback for tool usage confirmation

### Authentication

- Uses `ANTHROPIC_API_KEY` environment variable
- Supports third-party providers (Amazon Bedrock, Google Vertex AI)

### Available Tools (Default Set)

- **Bash**: Execute shell commands
- **Read**: Read files
- **Write**: Write files  
- **Edit**: Edit files
- **WebSearch**: Search the web
- **Grep**: Search within files
- **LS**: List directory contents

### Agent Types You Can Build

**Coding Agents:**
- SRE incident response
- Security code review
- Engineering assistants
- Code review enforcement

**Business Agents:**
- Legal document analysis
- Financial reporting
- Customer support
- Content creation

## Requirements for Implementation

Based on your requirements, here's what needs to be built:

### 1. Run Projects Created by Claude Code SDK

**NOT PROVIDED IN DOCS** - Need to implement:
- Project execution environment
- Dev server management
- Output capture and streaming

### 2. Preview Output in Browser Window

**NOT PROVIDED IN DOCS** - Need to implement:
- Browser integration (using existing browserbase)
- Dev server launching
- Live reload capability
- Port management

### 3. One-Click Deploy with Vercel MCP

**NOT PROVIDED IN DOCS** - Need to implement:
- Vercel API integration
- MCP server for deployment
- Build configuration detection
- Environment variable management

## What the Documentation DOESN'T Tell Us

The official documentation does NOT provide:

1. **Specific class structures** for extending the SDK
2. **Methods for programmatic project execution**
3. **APIs for capturing execution output**
4. **Browser preview integration methods**
5. **Deployment pipeline integration**
6. **Detailed Python SDK usage examples**
7. **How to wrap SDK as a callable tool for other agents**

## Implementation Approach

Since the documentation doesn't provide these specifics, we need to:

### 1. Use the SDK's Query Interface
```typescript
// Wrap the query() function as a tool
async function executeClaudeCodeTask(task: string, options: any) {
  const messages = [];
  
  for await (const message of query({
    prompt: task,
    options: {
      allowedTools: options.allowedTools || ["Bash", "Read", "Write"],
      systemPrompt: options.systemPrompt,
      maxTurns: options.maxTurns || 5
    }
  })) {
    messages.push(message);
    
    if (message.type === "result") {
      return {
        success: true,
        result: message.result,
        messages: messages
      };
    }
  }
}
```

### 2. Build Preview System Ourselves
Since not documented, need custom implementation:
- Start dev server using Bash tool
- Capture localhost URL
- Open in browserbase
- Monitor for file changes

### 3. Build Deployment System Ourselves
Since not documented, need custom implementation:
- Use Vercel API directly
- Create MCP server wrapper
- Handle build and deploy

## CLI Commands (From Documentation)

```bash
# Start interactive mode
claude

# Run one-time task
claude "create a Python web scraper"

# Query and exit
claude -p "analyze this codebase"

# Continue recent conversation
claude -c

# Resume previous conversation
claude -r

# Create Git commit
claude commit
```

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# The documentation doesn't specify others for SDK usage
```

## Summary

The Claude Code SDK documentation provides:
- ✅ Installation instructions
- ✅ Basic TypeScript query() usage
- ✅ Available tools list
- ✅ Permission modes
- ✅ CLI commands

The documentation does NOT provide:
- ❌ Detailed programmatic usage
- ❌ Project execution methods
- ❌ Browser preview integration
- ❌ Deployment integration
- ❌ Output capture methods
- ❌ Python SDK detailed examples

Therefore, to implement your requirements (run projects, preview in browser, one-click deploy), we need to BUILD these capabilities on top of the basic SDK functionality.