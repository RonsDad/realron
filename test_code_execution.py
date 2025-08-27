#!/usr/bin/env python3
"""
Test script to verify code execution tool is working properly
"""
import asyncio
import json
import sys
import os

# Add parent directory to path
sys.path.append('/Users/timhunter/ron-ai')

from backend.agents.claudeAgent.claude_completions import ClaudeCompletions

async def test_code_execution():
    """Test code execution with Claude"""
    
    # Initialize Claude client
    claude = ClaudeCompletions()
    
    # Test message requesting code execution
    messages = [{
        "role": "user",
        "content": "Please use Python to calculate the factorial of 10 and also create a simple bar chart showing the first 5 factorial values."
    }]
    
    print("🚀 Testing code execution with Claude...")
    print("=" * 50)
    
    # Stream the response
    code_executed = False
    code_output = ""
    
    async for event in claude.stream_complete(
        messages=messages,
        tools=["code_execution"],  # Enable code execution tool
        max_tokens=4096,
        enable_thinking=True
    ):
        # Process different event types
        if event.get('type') == 'message_start':
            print(f"📨 Message started: {event['message']['id']}")
            if 'container' in event:
                print(f"📦 Container ID: {event['container']['id']}")
                
        elif event.get('type') == 'content_block_start':
            block = event.get('content_block', {})
            if block.get('type') == 'server_tool_use' and block.get('name') == 'code_execution':
                print(f"💻 Code execution starting...")
                code_executed = True
                
        elif event.get('type') == 'content_block_delta':
            delta = event.get('delta', {})
            if delta.get('type') == 'text_delta':
                print(delta.get('text', ''), end='', flush=True)
            elif delta.get('type') == 'input_json_delta':
                # This is the code being prepared for execution
                pass
                
        elif event.get('type') == 'code_execution_result':
            print("\n📊 Code Execution Result:")
            print("-" * 40)
            data = event.get('data', {})
            
            stdout = data.get('stdout', '')
            stderr = data.get('stderr', '')
            return_code = data.get('return_code', -1)
            
            if stdout:
                print(f"✅ Output:\n{stdout}")
                code_output = stdout
            if stderr:
                print(f"❌ Error:\n{stderr}")
            print(f"🔢 Return Code: {return_code}")
            print("-" * 40)
            
        elif event.get('type') == 'message_stop':
            print("\n\n✅ Message completed")
            
        elif event.get('type') == 'error':
            print(f"\n❌ Error: {event.get('error')}")
    
    print("\n" + "=" * 50)
    if code_executed:
        print("✅ Code execution tool was used successfully!")
        if code_output:
            print(f"📊 Captured output: {len(code_output)} characters")
    else:
        print("⚠️ Code execution tool was not used")
    
    return code_executed

if __name__ == "__main__":
    # Run the test
    result = asyncio.run(test_code_execution())
    sys.exit(0 if result else 1)
