# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ron AI is a healthcare-focused AI application with:
- **Frontend**: Next.js React application with TypeScript and Tailwind CSS
- **Backend**: FastAPI Python service with agent orchestration
- **AI Integration**: Anthropic Claude, MCP servers, browser automation, and specialized healthcare agents

## Quick Start

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Run full stack development
npm run dev:all

# Or run services separately:
npm run dev           # Frontend only
npm run dev:backend   # Backend only
```

## Architecture

### Backend Structure
- `backend/api.py` - Main FastAPI application with WebSocket and SSE support
- `backend/agents/claudeAgent/` - Claude agent implementation with tools and integrations
- `backend/agents/claudeAgent/claude_tools/` - Specialized tools (PubMed, FDA, clinical agents, browser automation)
- `backend/integrations/` - External service integrations (Browserbase MCP, etc.)
- `backend/memory_integration.py` - Memory management system
- `backend/database.py` - Database operations

### Frontend Structure
- `src/app/` - Next.js app directory
- `src/components/` - React components including computer-use-agent, message-card
- `src/lib/` - Utility functions and shared logic
- `src/store/` - Zustand state management (6 slices with 32 state variables)
- `src/hooks/` - Custom React hooks including useMessageHandler

## Development Commands

### Frontend
```bash
# Development server (port 3000)
npm run dev

# Build production
npm run build

# Run production build
npm start

# Lint and type checking
npm run lint
```

### Backend
```bash
# Activate virtual environment
source venv/bin/activate

# Run backend development server (port 8001)
npm run dev:backend
# OR directly:
python3 -m uvicorn backend.api:app --host 0.0.0.0 --port 8001 --reload

# Run all services (frontend + backend + Brave MCP)
npm run dev:all

# Kill stuck ports before starting
npm run kill-ports
```

### Docker Development
```bash
# Start all services with Docker Compose
docker-compose up -d

# With Brave MCP integration
docker-compose -f docker-compose.brave.yml up -d

# Computer Use AWS deployment
npm run dev:computer-use-aws
```

### Testing
```bash
# Run integration tests
python test_full_integration.py
python test_advanced_features.py

# Backend orchestration tests
python backend/test_orchestration.py

# Verify store naming consistency
node verify-store-naming.js
```

## Key Dependencies

### Backend (Python 3.12+)
- `anthropic` - Claude API client
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `browser-use` - Browser automation
- `mcp[cli]` - Model Context Protocol
- Google Cloud libraries for various services

### Frontend
- Next.js 15.2.4
- React 18
- Radix UI components
- Tailwind CSS
- Zustand for state management
- Firebase integration

## Environment Variables

Required API keys (set in `.env`):
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `BRAVE_API_KEY`
- `BROWSERLESS_API_TOKEN`
- `TELNYX_MCP_URL` and `TELNYX_MCP_MODE` for Telnyx integration
- Various healthcare API keys (FDA, PubMed, etc.)

## Important Patterns

### Agent Communication
- Uses WebSocket for real-time streaming (primary)
- Server-Sent Events (SSE) as fallback
- Message format follows structured JSON with role, content, and tool_calls
- Endpoint: `ws://localhost:8001/ws` or `http://localhost:8001/api/chat` (SSE)

### Tool Integration
- Tools are dynamically loaded from `backend/agents/claudeAgent/claude_tools/` directory
- Each tool module exports specific functions with standardized interfaces
- MCP servers provide additional capabilities (Browserbase, Brave Search, Telnyx)
- Claude Code SDK integration in `claude_tools/claude_code_sdk_proper.py`

### Memory System
- Persistent memory stored in `backend/memory_integration.py`
- API endpoints at `/api/memory/*` for CRUD operations
- Memory categories: medical_history, preferences, context

### State Management (Critical - Preserve Exact Names)
- Frontend uses Zustand with 6 slices: chat, agent, deepResearch, ui, tool, connection
- All 32 state variables preserved with EXACT naming for compatibility
- Custom hooks like useMessageHandler handle complex business logic
- SSR-safe implementation with store factory pattern

## Development Workflow

1. **Starting Development**:
   - Ensure virtual environment is activated
   - Source environment variables from `.env`
   - Use `npm run dev:all` for full stack development

2. **Adding New Tools**:
   - Create tool module in `backend/agents/claudeAgent/claude_tools/`
   - Follow existing tool patterns for function signatures
   - Update tool loading in main agent

3. **Frontend Changes**:
   - Components use TypeScript with strict typing
   - Follow existing component patterns in `src/components/`
   - Use Tailwind CSS for styling
   - Maintain Zustand store structure when adding state

## Testing Approach

- Integration tests verify end-to-end functionality
- Test files at project root test full system integration
- Backend tests in `backend/` test specific modules
- Frontend store verification: `node verify-store-naming.js`
- Python tests use pytest: `pytest backend/test_*.py`

## Current Refactoring: Zustand State Management

### Active Branch: `refactor-zustand-modular-frontend`

We are refactoring the frontend to use Zustand for state management. Key agreements:

1. **Trust Through Transparency**: Every action explained clearly
2. **Real Code Only**: No templates or fake files
3. **Preserve Everything**: ALL 32 state variable names remain EXACT
4. **Safe Development**: Working on separate branch with page-refactored.tsx

### Refactoring Status

✅ **Completed (85% Done):**
- **SSR-Safe Provider Pattern**: Fixed Next.js 13+ issues with createStore
- **Zustand store**: 6 slices with all 32 state variables (exact names)
- **Component Extraction**: 6 components created, page reduced 84% (2,244→368 lines)
- **Business Logic Hooks**: useMessageHandler extracted (1,294 lines)

🔄 **Remaining Work (15%):**
- Extract 2 more components (AgentActivityFeed, ToolOutputDisplay)
- Create 3 more hooks (useToolExecution, useDeepResearch, useAgentOrchestration)
- Add performance optimizations (React.memo, useShallow)

### File Structure
```
src/
├── store/                    # ✅ SSR-safe store factory
├── providers/                # ✅ Context provider
├── components/chat/          # ✅ 6 extracted components
├── hooks/                    # ⚠️ 1 of 4 hooks done
└── app/
    ├── page.tsx              # Original (preserved)
    └── page-refactored.tsx   # ✅ Clean 368 lines
```

See `src/app/CLAUDE.md` for detailed next steps and instructions.