#!/usr/bin/env python3
"""
Minimal test for code execution - directly calling Anthropic API
"""
import os
import asyncio
from anthropic import AsyncAnthropic

async def test_direct_api():
    """Test code execution directly with Anthropic API"""
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        # Try to load from .env file
        env_path = "/Users/timhunter/ron-ai/.env"
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith("ANTHROPIC_API_KEY="):
                        api_key = line.split("=", 1)[1].strip()
                        break
    
    if not api_key:
        print("❌ No API key found")
        return False
        
    client = AsyncAnthropic(api_key=api_key)
    
    print("🚀 Testing code execution with direct Anthropic API...")
    print("=" * 50)
    
    try:
        # Create a streaming response
        async with client.beta.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": "Use Python to calculate 5 factorial and print the result."
            }],
            tools=[{
                "type": "code_execution_20250522",
                "name": "code_execution"
            }],
            betas=["code-execution-2025-05-22"]
        ) as stream:
            
            async for event in stream:
                if hasattr(event, 'type'):
                    print(f"Event type: {event.type}")
                    
                    if event.type == 'content_block_start':
                        block = event.content_block
                        print(f"  Block type: {block.type}")
                        if hasattr(block, 'name'):
                            print(f"  Block name: {block.name}")
                            
                    elif event.type == 'content_block_stop':
                        print(f"  Block stopped at index: {event.index}")
                        
                    # Try to capture any content that looks like code execution result
                    if hasattr(event, 'content_block'):
                        block = event.content_block
                        if hasattr(block, 'content'):
                            print(f"  Content found: {type(block.content)}")
                            if hasattr(block.content, 'stdout'):
                                print(f"  ✅ STDOUT: {block.content.stdout}")
                            if hasattr(block.content, 'type'):
                                print(f"  Content type: {block.content.type}")
        
        print("\n" + "=" * 50)
        print("✅ Test completed")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import sys
    result = asyncio.run(test_direct_api())
    sys.exit(0 if result else 1)
