#!/bin/bash
set -e

echo "=== Starting Backend with Environment Variables ==="

# Change to project directory
cd /Users/timhunter/ron-ai

# Source environment variables
if [ -f .env ]; then
    echo "Loading .env file..."
    set -a  # automatically export all variables
    source .env
    set +a
    echo "✅ Environment variables loaded"
else
    echo "❌ .env file not found"
    exit 1
fi

# Verify API key is loaded
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY not found in environment"
    exit 1
else
    echo "✅ ANTHROPIC_API_KEY loaded"
fi

# Activate virtual environment
source venv/bin/activate
echo "✅ Virtual environment activated"

# Set Python path
export PYTHONPATH="/Users/timhunter/ron-ai/backend:$PYTHONPATH"
export PORT=8000

echo "Starting uvicorn..."
python -m uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload
