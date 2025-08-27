#!/usr/bin/env python3
"""
Test script for Claude Code SDK integration
"""

import asyncio
import json
from backend.agents.claudeAgent.claude_tools.claude_code_tool import (
    use_claude_code, 
    stream_claude_code,
    list_claude_code_sessions,
    clear_claude_code_session
)

async def test_basic_creation():
    """Test basic code creation"""
    print("\n=== Test 1: Basic Code Creation ===")
    
    result = await use_claude_code(
        prompt="Create a simple Python function that calculates factorial",
        mode="create"
    )
    
    print(f"Success: {result.get('success')}")
    print(f"Session ID: {result.get('session_id')}")
    print(f"Files created: {len(result.get('files_created', []))}")
    
    if result.get('files_created'):
        for file in result['files_created']:
            print(f"  - {file.get('path')} ({file.get('language')})")
    
    print(f"Response preview: {result.get('result', '')[:200]}...")
    
    return result.get('session_id')

async def test_continue_session(session_id):
    """Test continuing a session"""
    print(f"\n=== Test 2: Continue Session {session_id} ===")
    
    result = await use_claude_code(
        prompt="Now add unit tests for the factorial function",
        session_id=session_id,
        continue_session=True,
        mode="test"
    )
    
    print(f"Success: {result.get('success')}")
    print(f"Can continue: {result.get('can_continue')}")
    print(f"Turns used: {result.get('turns_used')}")
    print(f"Files created: {len(result.get('files_created', []))}")
    
    return result

async def test_streaming():
    """Test streaming responses"""
    print("\n=== Test 3: Streaming Response ===")
    
    events_collected = []
    
    async for event in stream_claude_code(
        prompt="Create a React button component",
        mode="create"
    ):
        event_type = event.get('type')
        events_collected.append(event_type)
        
        if event_type == 'status':
            print(f"Status: {event.get('content')}")
        elif event_type == 'text':
            print(f"Text: {event.get('content')[:50]}...")
        elif event_type == 'file_create':
            print(f"File created: {event.get('path')}")
        elif event_type == 'console':
            print(f"Console: {event.get('command')} -> {event.get('output')[:50]}...")
        elif event_type == 'complete':
            print("Stream complete!")
    
    print(f"\nCollected event types: {set(events_collected)}")
    return events_collected

async def test_session_management():
    """Test session management"""
    print("\n=== Test 4: Session Management ===")
    
    # List sessions
    sessions = await list_claude_code_sessions()
    print(f"Active sessions: {len(sessions)}")
    
    for session in sessions:
        print(f"  - {session['id']}: {session['turns']} turns, {session['files_created']} files")
    
    # Clear first session if any
    if sessions:
        cleared = await clear_claude_code_session(sessions[0]['id'])
        print(f"Cleared session {sessions[0]['id']}: {cleared}")
    
    return sessions

async def main():
    """Run all tests"""
    print("=" * 50)
    print("Claude Code SDK Integration Tests")
    print("=" * 50)
    
    try:
        # Test 1: Basic creation
        session_id = await test_basic_creation()
        
        # Test 2: Continue session
        if session_id:
            await test_continue_session(session_id)
        
        # Test 3: Streaming
        await test_streaming()
        
        # Test 4: Session management
        await test_session_management()
        
        print("\n" + "=" * 50)
        print("All tests completed successfully!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())