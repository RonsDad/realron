#!/usr/bin/env python3
"""
Test script to verify agent orchestration visibility
"""

import asyncio
import json
import aiohttp
import sys

async def test_orchestration():
    """Test orchestration tool execution with streaming"""
    print("🧪 Testing Agent Orchestration Visibility...")
    
    # Test tool payload
    test_request = {
        "tool_name": "execute_with_orchestrator",
        "tool_input": {
            "orchestrator_id": "orchestrator_f1b22fab",
            "task": "Research the benefits of green tea",
            "context": {"test": True}
        }
    }
    
    print(f"\n📤 Sending request: {json.dumps(test_request, indent=2)}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'http://localhost:8001/execute-agent-tool-stream',
                json=test_request
            ) as response:
                print(f"\n📨 Response status: {response.status}")
                
                if response.status != 200:
                    error = await response.text()
                    print(f"❌ Error: {error}")
                    return
                
                print("\n📡 Streaming events:")
                print("-" * 50)
                
                # Process SSE stream
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        data = line[6:]  # Remove 'data: ' prefix
                        if data == '[DONE]':
                            print("\n✅ Stream completed")
                            break
                        try:
                            event = json.loads(data)
                            print(f"\n🎯 Event: {event.get('type', 'unknown')}")
                            
                            # Display event details
                            if event.get('type') == 'agent_spawned':
                                print(f"   Agent: {event.get('name')} ({event.get('agent_type')})")
                                print(f"   Model: {event.get('model')}")
                                print(f"   Task: {event.get('task')}")
                            elif event.get('type') == 'agent_thinking':
                                thinking = event.get('content', '')[:100]
                                if thinking:
                                    print(f"   Thinking: {thinking}...")
                            elif event.get('type') == 'agent_completed':
                                print(f"   Agent ID: {event.get('agent_id')}")
                                print(f"   Success: {event.get('success')}")
                                
                        except json.JSONDecodeError:
                            print(f"   Raw: {data}")
                            
    except aiohttp.ClientConnectionError:
        print("❌ Could not connect to backend. Is it running on port 8001?")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 60)
    print("AGENT ORCHESTRATION VISIBILITY TEST")
    print("=" * 60)
    asyncio.run(test_orchestration())