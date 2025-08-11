# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ron AI Healthcare Copilot is an AI-powered healthcare advocacy assistant integrating Claude Sonnet 4 with advanced tool capabilities for medication management, provider search, and healthcare research.

## Development Commands

### Quick Start
```bash
# Initial setup (first time only)
./setup.sh

# Start EVERYTHING with one command (frontend + backend + Telnyx MCP)
npm run dev:all

# This starts:
# - Frontend on port 3000 (Next.js dev server)
# - Backend on port 8001 with automatic Telnyx MCP cloud connection
# - All 97 tools including 57 Telnyx telephony tools
# - Hot reload enabled for both frontend and backend
```

### Backend Development
```bash
# Backend is automatically started with npm run dev:all
# But if you need to run it separately:
npm run dev:backend

# Or manually:
cd backend
source ../venv/bin/activate
export TELNYX_MCP_URL="https://api.telnyx.com/mcp/sse"
export TELNYX_MCP_MODE="sse"
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python3 -m uvicorn api:app --reload --port 8001
```

### Frontend Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Utility Commands
```bash
# Kill stuck ports
npm run kill-ports

# Start Telnyx MCP server
npm run dev:telnyx

# Start computer use Docker
npm run dev:computer-use

# Start computer use AWS
npm run dev:computer-use-aws
```

## Architecture Overview

### Backend Structure (`/backend`)

The backend is a FastAPI application at `backend/api.py` that serves as the main integration point for all AI agents and tools.

**Key Components:**

1. **Claude Agent** (`agents/claudeAgent/`)
   - `claude_completions.py`: Core Claude Sonnet 4 integration with streaming support
   - `claude_tools/`: Tool implementations directory containing:
     - `tools.py`: Tool definitions and execution logic
     - `browser_use/`: Browser automation tools
     - `clinical_agent/`: Healthcare-specific operations
     - `computer_use/`: Desktop automation with interleaved thinking
     - FDA drug information tools (23 specialized endpoints)

2. **Deep Research Agent** (`agents/deepResearch/`)
   - Built on Google ADK (Agent Development Kit)
   - Multi-agent system for comprehensive research
   - SSE streaming for long-running tasks
   - Specialized sub-agents for different research aspects

3. **API Endpoints**:
   - `POST /chat`: Main chat endpoint with Claude
   - `POST /healthcare/task`: Healthcare-specific tasks
   - `POST /code/execute`: Code execution
   - `POST /search`: Web search
   - `POST /api/run_sse`: Deep research with SSE
   - WebSocket `/ws/chat`: Real-time chat streaming

### Frontend Structure (`/src`)

Next.js 15 application with TypeScript and React.

**Key Directories:**
- `app/`: App router pages (main chat, landing, browser)
- `components/`: 40+ React components including healthcare-specific UIs
- `components/ui/`: Shadcn/ui component library
- `hooks/`: Custom React hooks for state management
- `lib/`: API utilities and type definitions

### Critical Patterns

#### Adding New Tools

1. Create implementation in `backend/agents/claudeAgent/claude_tools/[tool_name]/`
2. Add definition to `TOOL_DEFINITIONS` in `tools.py`
3. Add execution case in `execute_tool` function:
   ```python
   elif tool_name == "your_tool":
       from .your_tool import execute_your_tool
       return await execute_your_tool(tool_input)
   ```
4. Update Claude's system prompt if needed in `claude_completions.py`

#### Browser Session Management

**CRITICAL**: System enforces SINGLE browser session limits:
- Only one browser session exists at a time
- Sessions auto-expire after 15 minutes
- Always use this workflow:
  1. Call `create_browser_session` to get session_id
  2. Immediately call `browser_use` with that session_id
  3. Use `check_browser_session` before reusing
  4. Use `reuse_browser_session` for follow-up actions

#### Tool Execution Pattern

Tools in `claude_completions.py` follow parallel execution when possible:
```python
# Browser tools execute sequentially
if has_browser_tools:
    for block in tool_blocks:
        result = await execute_tool(block.name, block.input)
        
# Other tools execute in parallel
else:
    tasks = [execute_tool(block.name, block.input) for block in tool_blocks]
    results = await asyncio.gather(*tasks)
```

## Environment Configuration

### Required Environment Variables
```bash
# In .env file (project root)
ANTHROPIC_API_KEY=your_actual_api_key_here  # Required

# Optional
BROWSERLESS_API_TOKEN=your_token  # For browser automation
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json  # For Google services
```

### Loading Order
1. Project root `.env` loads first
2. `backend/.env` provides overrides if present
3. Environment variables take precedence

## Key Integration Points

### Claude Tools System

Tools are defined in `backend/agents/claudeAgent/claude_tools/tools.py`:
- Each tool has a JSON schema definition
- Async execution functions handle tool logic
- Tools integrate with Claude via function calling

### Streaming Architecture

Three streaming methods:
1. **WebSocket**: Real-time chat responses
2. **SSE**: Deep research long-running tasks
3. **AsyncGenerator**: Claude response streaming

### API Response Pattern

Standard endpoint structure:
```python
@app.post("/endpoint")
async def handler(request: RequestModel):
    try:
        # Input validation
        # Agent/tool execution
        # Response formatting
        return response
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

## Available Tools

### Healthcare Tools
- **clinical_operations**: Fine-tuned GPT-4 for clinical queries
- **FDA tools** (23 endpoints): Drug labels, warnings, interactions
- **medication_management**: Track and optimize medications

### Browser Automation
- **create_browser_session**: Initialize browser session
- **browser_use**: Automate web interactions
- **reuse_browser_session**: Continue existing session
- **check_browser_session**: Verify session health

### Research Tools
- **perplexity_sonar_pro**: Fast web search
- **perplexity_reasoning_pro**: Advanced analysis
- **perplexity_deep_research**: Comprehensive research

### System Tools
- **computer_use**: Desktop automation with thinking
- **code_execution**: Run Python code
- **web_search**: General web search

## Performance Optimizations

1. **Prompt Caching**: Claude caches prompts automatically
2. **Parallel Tool Execution**: Non-browser tools run concurrently
3. **Session Reuse**: Browser sessions persist for 15 minutes
4. **Streaming Responses**: Improves perceived performance

## Common Tasks

### Running a Single Test
```bash
# No formal test suite exists
# Use API docs for manual testing
open http://localhost:8000/docs
```

### Debugging Backend
```bash
# Check logs
tail -f api.log

# Run with debug logging
LOG_LEVEL=DEBUG python3 backend/api.py
```

### Building for Production
```bash
# Frontend build
npm run build

# Backend doesn't require build
# Deploy with: uvicorn backend.api:app --host 0.0.0.0 --port 8000
```

## Project Dependencies

### Core Python Packages
- `anthropic`: Claude API client
- `fastapi` & `uvicorn`: Web framework
- `browser-use>=0.5.5`: Browser automation
- `google-adk>=0.1.0`: Agent Development Kit
- `google-generativeai`: Gemini integration

### Core JavaScript Packages
- `next@15.2.4`: React framework
- `react@18`: UI library
- `@radix-ui/*`: Component primitives
- `tailwindcss`: Styling
- `framer-motion`: Animations