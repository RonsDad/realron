#!/usr/bin/env python3
"""
Fix for Telnyx MCP async/sync mismatch issue
This wraps synchronous calls in asyncio.to_thread to prevent blocking
"""

import asyncio
from functools import wraps
import sys
import os

def make_async_wrapper():
    """Create a wrapper that properly handles sync-to-async conversion"""
    
    fix_code = '''
# Patch for async/sync mismatch in phone_numbers.py
import asyncio
from typing import Any, Dict

# Original imports remain the same
from pydantic import Field
from ..mcp import mcp
from ..telnyx.services.numbers import NumbersService
from ..utils.error_handler import handle_telnyx_error
from ..utils.logger import get_logger
from ..utils.service import get_authenticated_service

logger = get_logger(__name__)

# Fixed version with proper async handling
@mcp.tool()
async def list_phone_numbers(request: Dict[str, Any]) -> Dict[str, Any]:
    """List phone numbers with proper async handling."""
    try:
        service = get_authenticated_service(NumbersService)
        # Run synchronous method in thread pool to avoid blocking
        result = await asyncio.to_thread(
            service.list_phone_numbers,
            **request
        )
        return result
    except Exception as e:
        logger.error(f"Error listing phone numbers: {e}")
        raise handle_telnyx_error(e)
'''
    
    return fix_code

def apply_fix():
    """Apply the fix to the Telnyx MCP server"""
    
    target_file = "/Users/timhunter/ron-ai/telnyx-mcp-server/src/telnyx_mcp_server/tools/phone_numbers_async_fix.py"
    
    print("🔧 Creating async fix for Telnyx MCP phone numbers tool...")
    
    # Create the fixed version
    fix_content = make_async_wrapper()
    
    with open(target_file, 'w') as f:
        f.write(fix_content)
    
    print(f"✅ Fix created at: {target_file}")
    print("\n📝 To apply this fix permanently, you need to:")
    print("1. Update the original phone_numbers.py to use asyncio.to_thread()")
    print("2. Or install an async HTTP client like httpx")
    print("\n💡 The issue: Synchronous HTTP requests in async functions block the event loop")
    print("   Solution: Wrap sync calls with asyncio.to_thread() to run in thread pool")

if __name__ == "__main__":
    apply_fix()