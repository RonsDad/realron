#!/bin/bash

# Load environment variables from .env file
set -a # automatically export all variables
source .env
set +a

# Define the log file path
LOG_FILE="telnyx_mcp_server.log"

echo "Starting Telnyx MCP Server..."
echo "Log file: $(pwd)/$LOG_FILE"

# Run the server in the background using uvx and disown it
uvx --from ./telnyx-mcp-server telnyx-mcp-server \
  --webhook-enabled \
  --ngrok-enabled \
  > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
disown $SERVER_PID

# Create a directory for PID files if it doesn't exist
PID_DIR=".pids"
mkdir -p $PID_DIR

echo "Telnyx MCP Server started with PID: $SERVER_PID"
echo $SERVER_PID > "$PID_DIR/telnyx_mcp_server.pid"
