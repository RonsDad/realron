#!/usr/bin/env python3
"""Test script for computer use tool in Docker"""

import asyncio
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from computer_use_tool import execute_computer_use

async def test_basic_actions():
    """Test basic computer use actions"""
    print("=== Testing Computer Use Tool ===")
    print(f"Time: {datetime.now()}")
    print(f"Display: {os.environ.get('DISPLAY', 'Not set')}")
    
    # Test 1: Take a screenshot
    print("\n1. Testing screenshot capability...")
    result = await execute_computer_use({
        "task": "Take a screenshot of the desktop",
        "max_iterations": 1
    })
    print(f"Result: {result.get('success', False)}")
    if result.get('screenshots'):
        print(f"Screenshots taken: {len(result['screenshots'])}")
    
    # Test 2: Open terminal and show system info
    print("\n2. Testing terminal and system commands...")
    result = await execute_computer_use({
        "task": "Open a terminal and run 'uname -a' to show system information",
        "max_iterations": 5
    })
    print(f"Result: {result.get('success', False)}")
    
    # Test 3: Open Firefox
    print("\n3. Testing browser launch...")
    result = await execute_computer_use({
        "task": "Open Firefox browser and navigate to https://www.anthropic.com",
        "max_iterations": 8
    })
    print(f"Result: {result.get('success', False)}")
    
    # Test 4: Create a simple file
    print("\n4. Testing file creation...")
    result = await execute_computer_use({
        "task": "Open a terminal and create a file called 'hello_claude.txt' with the content 'Hello from Claude Computer Use!'",
        "max_iterations": 10
    })
    print(f"Result: {result.get('success', False)}")
    
    return True

async def main():
    """Run all tests"""
    try:
        await test_basic_actions()
        print("\n=== All tests completed ===")
    except Exception as e:
        print(f"\nError during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())