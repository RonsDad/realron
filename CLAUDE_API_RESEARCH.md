# CLAUDE.md - Anthropic SDK and Claude Code SDK Parameter Documentation

## Research Summary
This document contains comprehensive findings from DeepWiki, WebFetch, and Context7 searches on Anthropic SDK Messages API Parameters and Claude Code SDK Parameters.

## 1. Anthropic SDK Messages API Parameters

### DeepWiki Findings

The Messages API `create()` method is the primary interface for conversational interactions with Claude models.

#### Required Parameters

1. **`max_tokens`** (integer)
   - Maximum number of tokens to generate before stopping
   - Must be ≥ 1

2. **`messages`** (iterable)
   - An iterable of `MessageParam` (stable) or `BetaMessageParam` (beta)
   - Messages should alternate between `user` and `assistant` roles
   - Each message must have `role` and `content`

3. **`model`** (string)
   - The Claude model identifier to use
   - Length: 1-256 characters
   - Example: "claude-3-5-sonnet-20241022"

#### Common Optional Parameters

- **`system`** (string or iterable)
  - System prompt to provide context and instructions
  - Can be string or iterable of `TextBlockParam`
  
- **`temperature`** (float)
  - Controls randomness: 0.0 to 1.0
  
- **`stream`** (boolean)
  - Enable incremental response streaming using server-sent events
  
- **`thinking`** (configuration object)
  - Configuration for enabling Claude's extended thinking process
  
- **`tool_choice`** (object)
  - How the model should use provided tools
  
- **`tools`** (array)
  - Definitions of tools that the model may use
  
- **`top_k`** (integer)
  - Nucleus sampling parameter
  
- **`top_p`** (float)
  - Nucleus sampling parameter
  
- **`metadata`** (object)
  - Metadata about the request
  
- **`service_tier`** (string)
  - Priority or standard capacity
  
- **`stop_sequences`** (array)
  - Custom text sequences that will cause model to stop

#### Beta-Specific Parameters

- **`container`** (string)
  - Identifier for container reuse across requests
  
- **`mcp_servers`** (iterable)
  - An iterable of `BetaRequestMCPServerURLDefinitionParam`
  - For specifying MCP servers to be utilized
  
- **`betas`** (list)
  - List of `AnthropicBetaParam` for enabling beta features

### WebFetch Findings

#### Message Structure
```json
{
  "role": "user" | "assistant",
  "content": "string" | [
    {
      "type": "text",
      "text": "string"
    },
    {
      "type": "image",
      "source": {
        "type": "base64",
        "media_type": "image/jpeg",
        "data": "..."
      }
    }
  ]
}
```

#### Key Features
- Supports multi-turn conversations
- Allows image and text content
- Provides detailed usage and token tracking
- Supports advanced features like tool use and extended thinking

### Context7 Analysis

No direct Anthropic SDK library found in Context7, but related findings:
- **Vercel AI SDK** (/vercel/ai) - Trust Score: 10, 2304 code snippets
- **Microsoft MCP for Beginners** (/microsoft/mcp-for-beginners) - Trust Score: 9.9
- These libraries may have integration patterns with Anthropic's API

## 2. Claude Code SDK Parameters

### DeepWiki Findings

#### SDK Features and Core Parameters

1. **`additionalDirectories`**
   - Option to search custom paths
   - Improves slash command processing

2. **`canUseTool` callback**
   - Supports tool confirmation
   - Allows fine-grained control over tool execution

3. **Environment Variables**
   - SDK allows specifying environment variables for spawned processes
   - Critical for authentication and configuration

4. **`parent_tool_use_id`**
   - Used in print mode (`-p`)
   - Tracks parent-child task relationships in multi-turn conversations

5. **`total_cost_usd`**
   - Renamed from `total_cost`
   - Tracks cost in USD for API usage

#### Session and Request Management
- Request cancellation support
- Session support for multi-turn conversations
- Permission denial tracking
- User input tracking across conversations

### WebFetch Findings

#### Authentication Parameters

1. **Basic Authentication**
   - `ANTHROPIC_API_KEY` environment variable
   - Obtained from Anthropic Console

2. **Third-Party Provider Authentication**
   - Amazon Bedrock: `CLAUDE_CODE_USE_BEDROCK=1`
   - Google Vertex AI: `CLAUDE_CODE_USE_VERTEX=1`

#### Tool Permission Parameters

1. **`allowedTools`**
   - Explicitly specify permitted tools
   - Array of tool names

2. **`disallowedTools`**
   - Block specific tools
   - Array of tool names to exclude

3. **`permissionMode`**
   - Set overall permission strategy
   - Controls default tool access behavior

#### System Configuration

- **System Prompt Configuration**
  - Defines agent's role, expertise, and behavior
  - Specifies the type of agent being built

#### SDK Options

- **Headless Mode**: For CLI scripts and automation
- **TypeScript SDK**: For Node.js and web applications
- **Python SDK**: For Python applications and data science

### Context7 Analysis

No direct Claude Code SDK library found, but related findings:
- **VS Code Power Query SDK** (/microsoft/vscode-powerquery-sdk) - SDK patterns
- **Visual Studio Code** (/microsoft/vscode) - 2716 code snippets
- **Vercel AI SDK** (/vercel/ai) - Modern AI SDK patterns

## 3. Critical Integration Parameters for Ron AI

### Messages API Integration Requirements

```python
# Required structure for Messages API
request_params = {
    "model": "claude-3-5-sonnet-20241022",  # or "claude-opus-4-1-20250805"
    "messages": [
        {
            "role": "user",
            "content": "message content"
        }
    ],
    "max_tokens": 4000,
    
    # Optional but important
    "system": "System prompt here",
    "temperature": 0.7,
    "stream": True,  # For SSE streaming
    
    # Beta features (requires header)
    "thinking": {
        "enabled": True,
        "budget": 5000
    },
    
    # MCP servers (beta)
    "mcp_servers": [
        {
            "type": "url",
            "url": "https://mcp.example.com/sse",
            "name": "mcp-server",
            "authorization_token": "token"
        }
    ]
}
```

### Required Headers

```python
headers = {
    "x-api-key": "ANTHROPIC_API_KEY",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
    "anthropic-beta": "mcp-client-2025-04-04"  # For MCP features
}
```

## 4. Common Issues and Solutions

### Issue: 500 Internal Server Error
**Likely Causes:**
1. Missing required parameters (`model`, `messages`, `max_tokens`)
2. Incorrect message structure (missing `role` or `content`)
3. Invalid parameter types (e.g., string indices error)
4. Missing API key or authentication

### Issue: MCP Server Connection
**Requirements:**
1. Beta header: `"anthropic-beta": "mcp-client-2025-04-04"`
2. Valid MCP server configuration with URL and auth token
3. Tool configuration properly set

### Issue: Streaming Not Working
**Requirements:**
1. `stream: true` parameter
2. Proper SSE (Server-Sent Events) handling
3. Correct content-type headers

## 5. Recommendations for Ron AI

1. **Fix Message Structure**: Ensure all messages have proper `role` and `content` fields
2. **Add Required Parameters**: Always include `model`, `messages`, and `max_tokens`
3. **Handle Beta Features**: Include beta headers when using MCP or thinking features
4. **Implement Proper Error Handling**: Check for missing parameters before API calls
5. **Use Streaming Correctly**: Implement proper SSE handling for streaming responses

## 6. Next Steps

1. Validate current API implementation against these parameters
2. Add missing required parameters to chat endpoint
3. Implement proper message structure validation
4. Add beta header support for MCP features
5. Test with minimal configuration first, then add optional features

---

*Document compiled from DeepWiki, WebFetch, and Context7 searches on 2025-08-26*