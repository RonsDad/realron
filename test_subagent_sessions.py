#!/usr/bin/env python3
"""
Test script for subagent session management.
Tests session creation, execution, monitoring, and cleanup.
"""

import asyncio
import aiohttp
import json
from datetime import datetime

API_BASE = "http://localhost:8001"


async def test_subagent_sessions():
    """Test subagent session management features."""

    async with aiohttp.ClientSession() as session:
        print("🧪 Testing Subagent Session Management")
        print("=" * 50)

        # Test 1: Spawn agents
        print("\n📋 Test 1: Spawning Healthcare Agents")
        spawn_request = {
            "messages": [
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "tool_use": {
                                "name": "orchestrate_healthcare_task",
                                "input": {
                                    "task": "Research treatment options for rheumatoid arthritis",
                                    "specialties": [
                                        "clinical_researcher",
                                        "pharmacy_specialist",
                                    ],
                                    "parallel": True,
                                },
                            }
                        }
                    ),
                }
            ]
        }

        async with session.post(f"{API_BASE}/chat", json=spawn_request) as resp:
            if resp.status == 200:
                result = await resp.json()
                print(f"✅ Agents spawned successfully")
                print(f"   Response: {json.dumps(result, indent=2)[:500]}...")
            else:
                print(f"❌ Failed to spawn agents: {resp.status}")
                return

        # Wait for execution
        await asyncio.sleep(3)

        # Test 2: Get agent sessions
        print("\n📋 Test 2: Getting Agent Sessions")
        sessions_request = {
            "messages": [
                {
                    "role": "user",
                    "content": json.dumps(
                        {"tool_use": {"name": "get_agent_sessions", "input": {}}}
                    ),
                }
            ]
        }

        async with session.post(f"{API_BASE}/chat", json=sessions_request) as resp:
            if resp.status == 200:
                result = await resp.json()
                print(f"✅ Retrieved agent sessions")

                # Parse the response to get session info
                if "content" in result:
                    try:
                        content = json.loads(result["content"])
                        if "sessions" in content:
                            print(
                                f"   Active sessions: {content.get('active_agents', 0)}"
                            )
                            print(
                                f"   Total sessions: {content.get('total_sessions', 0)}"
                            )
                            for sess in content["sessions"]:
                                print(
                                    f"   - {sess.get('agent_id')}: {sess.get('status')}"
                                )
                    except:
                        print(f"   Response: {result['content'][:200]}...")
            else:
                print(f"❌ Failed to get sessions: {resp.status}")

        # Wait a bit more
        await asyncio.sleep(2)

        # Test 3: End all sessions
        print("\n📋 Test 3: Ending All Agent Sessions")
        end_request = {
            "messages": [
                {
                    "role": "user",
                    "content": json.dumps(
                        {"tool_use": {"name": "end_all_agent_sessions", "input": {}}}
                    ),
                }
            ]
        }

        async with session.post(f"{API_BASE}/chat", json=end_request) as resp:
            if resp.status == 200:
                result = await resp.json()
                print(f"✅ All sessions ended")
                print(f"   Response: {result.get('content', '')[:200]}...")
            else:
                print(f"❌ Failed to end sessions: {resp.status}")

        print("\n" + "=" * 50)
        print("✅ All tests completed!")


if __name__ == "__main__":
    asyncio.run(test_subagent_sessions())
