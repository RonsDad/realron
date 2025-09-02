#!/usr/bin/env python3

import os
import sys
sys.path.append('/home/ec2-user')

from official_computer_use_tool import ComputerUseTool

def test_computer_use():
    print("Testing Computer Use Tool...")
    
    # Initialize tool
    tool = ComputerUseTool()
    
    # Test screenshot
    print("Taking screenshot...")
    result = tool.screenshot()
    
    if "error" in result:
        print(f"Screenshot failed: {result['error']}")
        return False
    
    print(f"Screenshot successful! Image size: {len(result['source']['data'])} bytes")
    
    # Test mouse movement
    print("Testing mouse movement...")
    result = tool.mouse_move([640, 400])
    
    if "error" in result:
        print(f"Mouse move failed: {result['error']}")
        return False
    
    print("Mouse movement successful!")
    
    print("All tests passed!")
    return True

if __name__ == "__main__":
    test_computer_use()
