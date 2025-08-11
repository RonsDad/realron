#!/usr/bin/env python3
"""
Fixed startup script for the backend that handles Telnyx connection properly
"""
import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Set environment variable to disable Telnyx connection at startup
os.environ['DISABLE_TELNYX_STARTUP'] = 'true'

if __name__ == "__main__":
    import uvicorn
    from backend.api import app
    
    print("Starting backend with deferred Telnyx connection...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)