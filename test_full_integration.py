#!/usr/bin/env python3
"""
Full end-to-end test of Claude Code SDK integration
"""

import asyncio
import os
import sys
sys.path.append('/Users/timhunter/ron-ai')

# Set API key
os.environ['ANTHROPIC_API_KEY'] = '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'

from backend.agents.claudeAgent.claude_tools.claude_code_sdk_integration import (
    execute_claude_code_tool,
    ClaudeCodeToolHandler,
    SubagentFactory
)

async def test_full_integration():
    print("="*60)
    print("FULL CLAUDE CODE SDK INTEGRATION TEST")
    print("="*60)
    
    # Test 1: Basic tool creation
    print("\n1. CREATE A TOOL WITH CLAUDE CODE SDK")
    print("-"*40)
    
    result = await execute_claude_code_tool(
        'claude_code_agent',
        {
            'task': 'Create a Python function that validates email addresses using regex',
            'mode': 'create',
            'allowed_tools': ['Write', 'Read']
        }
    )
    
    print(f"✅ Tool created: {result.get('success')}")
    print(f"   Session ID: {result.get('session_id', 'N/A')[:8]}...")
    print(f"   Cost: ${result.get('cost', 0):.4f}")
    
    session_id = result.get('session_id')
    
    # Test 2: Continue session
    if session_id:
        print("\n2. CONTINUE SESSION - ADD TESTS")
        print("-"*40)
        
        continue_result = await execute_claude_code_tool(
            'claude_code_continue_session',
            {
                'session_id': session_id,
                'task': 'Add unit tests for the email validation function'
            }
        )
        
        print(f"✅ Tests added: {continue_result.get('success')}")
        
        # Test 3: Check session status
        print("\n3. CHECK SESSION STATUS")
        print("-"*40)
        
        status_result = await execute_claude_code_tool(
            'claude_code_session_status',
            {'session_id': session_id}
        )
        
        print(f"   Session active: {status_result.get('is_active')}")
        print(f"   Turns used: {status_result.get('turn_count')}/{status_result.get('max_turns')}")
        print(f"   Total cost: ${status_result.get('total_cost_usd', 0):.4f}")
        
        # Test 4: Close session
        print("\n4. CLOSE SESSION")
        print("-"*40)
        
        close_result = await execute_claude_code_tool(
            'claude_code_close_session',
            {'session_id': session_id}
        )
        
        print(f"✅ Session closed: {close_result.get('success')}")
    
    # Test 5: Subagent delegation
    print("\n5. DELEGATE TO SPECIALIZED SUBAGENT")
    print("-"*40)
    
    subagent_result = await execute_claude_code_tool(
        'claude_code_subagent',
        {
            'task': 'Create a React component for displaying user profiles',
            'specialization': 'frontend',
            'mode': 'create'
        }
    )
    
    print(f"✅ Subagent task completed: {subagent_result.get('success')}")
    if subagent_result.get('subagent'):
        print(f"   Subagent: {subagent_result['subagent'].get('name')}")
        print(f"   Specialization: {subagent_result['subagent'].get('specialization')}")
    
    # Test 6: Test MCP integration
    print("\n6. TEST MCP INTEGRATION - RUN TESTS")
    print("-"*40)
    
    test_result = await execute_claude_code_tool(
        'claude_code_test',
        {
            'project_path': '/Users/timhunter/ron-ai',
            'test_types': ['unit'],
            'coverage': True
        }
    )
    
    print(f"✅ Tests executed: {test_result.get('success')}")
    if test_result.get('test_results'):
        for test_type, results in test_result['test_results'].items():
            if results:
                print(f"   {test_type}: {results.get('passed', 0)}/{results.get('total_tests', 0)} passed")
    
    print("\n" + "="*60)
    print("✅ FULL INTEGRATION TEST COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(test_full_integration())