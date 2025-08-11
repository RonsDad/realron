#!/bin/bash

# Kill any existing backend processes
echo "Killing existing backend processes..."
pkill -f "uvicorn backend.api" || true
pkill -f "python.*api.py" || true
sleep 2

# Set environment variables
export DISABLE_TELNYX_STARTUP=true
export PYTHONPATH="${PWD}/backend:${PYTHONPATH}"
export PORT=8001

# Load environment from .env file
source .env 2>/dev/null || true

echo "Starting backend on port 8001 with Telnyx disabled..."
cd backend
python3 -m uvicorn api:app --host 0.0.0.0 --port 8001