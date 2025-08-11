#!/usr/bin/env python3
"""
Test script to start backend without Telnyx MCP connection
"""
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Monkey-patch the Telnyx client to skip connection
import agents.claudeAgent.claude_tools.telnyx_client as telnyx_module

class MockTelnyxClient:
    async def connect(self):
        print("MockTelnyxClient: Skipping Telnyx connection")
        pass
    
    async def disconnect(self):
        print("MockTelnyxClient: Skipping Telnyx disconnection")
        pass

# Replace the real client
telnyx_module.telnyx_mcp_client = MockTelnyxClient()

# Now import and run the app
if __name__ == "__main__":
    import uvicorn
    from backend.api import app
    
    print("Starting backend without Telnyx MCP connection...")
    uvicorn.run(app, host="0.0.0.0", port=8000)