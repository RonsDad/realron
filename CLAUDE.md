# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ron AI is a healthcare-focused AI application with:
- **Frontend**: Next.js React application with TypeScript and Tailwind CSS
- **Backend**: FastAPI Python service with agent orchestration
- **AI Integration**: Anthropic Claude, MCP servers, browser automation, and specialized healthcare agents

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

## Development Commands

### Frontend
```bash
# Development server
npm run dev

# Build production
npm run build

# Run production
npm start

# Lint
npm run lint
```

### Backend
```bash
# Activate virtual environment
source venv/bin/activate

# Run backend development server
npm run dev:backend
# OR directly:
python3 -m uvicorn backend.api:app --host 0.0.0.0 --port 8001 --reload

# Run all services (frontend + backend)
npm run dev:all
```

### Docker Development
```bash
# Start all services with Docker Compose
docker-compose up -d

# With Brave MCP integration
docker-compose -f docker-compose.brave.yml up -d
```

### Testing
```bash
# Run integration tests
python test_full_integration.py
python test_advanced_features.py

# Backend orchestration tests
python backend/test_orchestration.py
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
- Firebase integration

## Environment Variables

Required API keys (set in `.env`):
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `BRAVE_API_KEY`
- `BROWSERLESS_API_TOKEN`
- Various healthcare API keys (FDA, PubMed, etc.)

## Important Patterns

### Agent Communication
- Uses WebSocket for real-time streaming
- Server-Sent Events (SSE) as fallback
- Message format follows structured JSON with role, content, and tool_calls

### Tool Integration
- Tools are dynamically loaded from `claude_tools/` directory
- Each tool module exports specific functions with standardized interfaces
- MCP servers provide additional capabilities

### Memory System
- Persistent memory stored in `backend/memory_integration.py`
- API endpoints at `/api/memory/*` for CRUD operations

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

## Testing Approach

- Integration tests verify end-to-end functionality
- Test files at project root test full system integration
- Backend tests in `backend/` test specific modules
- No unit test framework specified - check with team for testing requirements