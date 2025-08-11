#!/bin/bash

echo "=== Starting Ron AI Healthcare Copilot ==="
echo ""

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "uvicorn backend.api" 2>/dev/null
pkill -f "python.*api.py" 2>/dev/null
pkill -f "telnyx-mcp" 2>/dev/null
pkill -f "ngrok" 2>/dev/null
sleep 2

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ .env file not found!"
    exit 1
fi

# Start Telnyx MCP server in background (optional)
echo ""
echo "Starting Telnyx MCP server (optional)..."
if [ -n "$TELNYX_API_KEY" ] && [ -n "$NGROK_AUTHTOKEN" ]; then
    (cd telnyx-mcp-server && \
     TELNYX_API_KEY="$TELNYX_API_KEY" \
     NGROK_AUTHTOKEN="$NGROK_AUTHTOKEN" \
     uvx --from . telnyx-mcp-server --webhook-enabled --ngrok-enabled > ../telnyx-mcp.log 2>&1 &)
    echo "✅ Telnyx MCP server started in background (check telnyx-mcp.log for details)"
else
    echo "⚠️  Skipping Telnyx MCP (missing TELNYX_API_KEY or NGROK_AUTHTOKEN)"
fi

# Start backend
echo ""
echo "Starting backend API server..."
export DISABLE_TELNYX_STARTUP=true
export PYTHONPATH="${PWD}/backend:${PYTHONPATH}"
(cd backend && python3 -m uvicorn api:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &)
echo "✅ Backend starting on http://localhost:8001"
echo "   Check backend.log for details"

# Start frontend
echo ""
echo "Starting frontend..."
npm run dev > frontend.log 2>&1 &
echo "✅ Frontend starting on http://localhost:3000"
echo "   Check frontend.log for details"

echo ""
echo "=== All services starting ==="
echo ""
echo "Services:"
echo "  - Backend API: http://localhost:8001"
echo "  - Backend Docs: http://localhost:8001/docs"
echo "  - Frontend: http://localhost:3000"
echo ""
echo "Logs:"
echo "  - Backend: tail -f backend.log"
echo "  - Frontend: tail -f frontend.log"
echo "  - Telnyx MCP: tail -f telnyx-mcp.log"
echo ""
echo "To stop all services: pkill -f 'uvicorn|next-server|telnyx-mcp'"
echo ""
echo "Waiting for services to start..."
sleep 5

# Check backend health
echo ""
echo "Checking backend health..."
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "⚠️  Backend not responding yet. Check backend.log"
fi

echo ""
echo "=== Setup complete! ==="