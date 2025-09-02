#!/usr/bin/env python3.11

"""
Test script for Claude Computer Use custom implementation
Run this after setting up the implementation on EC2
"""

import os
import sys
import json

def test_computer_use_implementation():
    """Test the custom Claude Computer Use implementation"""
    
    print("🧪 Testing Claude Computer Use Implementation")
    print("===========================================")
    
    # Test 1: Check if we can import the modules
    try:
        sys.path.append('/home/ec2-user/claude-computer-use-impl')
        from computer_use_tool import ComputerUseTool
        from claude_computer_client import ClaudeComputerClient
        print("✅ Modules imported successfully")
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False
    
    # Test 2: Check API key
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key or api_key == 'your_api_key_here':
        print("❌ ANTHROPIC_API_KEY not set properly")
        print("Please set it in .env file")
        return False
    print("✅ API key configured")
    
    # Test 3: Test computer tool initialization
    try:
        computer_tool = ComputerUseTool()
        print("✅ Computer tool initialized")
    except Exception as e:
        print(f"❌ Computer tool initialization failed: {e}")
        return False
    
    # Test 4: Test screenshot capability
    try:
        screenshot_result = computer_tool.screenshot()
        if "error" in screenshot_result:
            print(f"❌ Screenshot failed: {screenshot_result['error']}")
            return False
        print("✅ Screenshot capability working")
    except Exception as e:
        print(f"❌ Screenshot test failed: {e}")
        return False
    
    # Test 5: Test basic actions
    test_actions = [
        {"action": "mouse_move", "coordinate": [640, 400]},
        {"action": "wait", "seconds": 1},
    ]
    
    for action in test_actions:
        try:
            result = computer_tool.execute_action(action)
            if "error" in result:
                print(f"❌ Action {action['action']} failed: {result['error']}")
                return False
            print(f"✅ Action {action['action']} working")
        except Exception as e:
            print(f"❌ Action {action['action']} test failed: {e}")
            return False
    
    # Test 6: Test Claude client initialization
    try:
        claude_client = ClaudeComputerClient()
        print("✅ Claude client initialized")
    except Exception as e:
        print(f"❌ Claude client initialization failed: {e}")
        return False
    
    print("\n🎉 All tests passed!")
    print("Your Claude Computer Use implementation is ready!")
    print("")
    print("🔧 To use it:")
    print("1. python3.11 claude_computer_client.py")
    print("2. Or import and use in your own scripts")
    print("")
    print("📺 Monitor via VNC:")
    print("- Connect to your_instance_ip:5901")
    print("- Password: claude2024")
    
    return True

if __name__ == "__main__":
    # Load environment variables
    if os.path.exists('.env'):
        with open('.env') as f:
            for line in f:
                if line.strip() and not line.startswith('#') and '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    test_computer_use_implementation()
