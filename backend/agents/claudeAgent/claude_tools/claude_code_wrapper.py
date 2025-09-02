"""
Claude Code SDK Integration Wrapper
Provides backward compatibility while using the new v2 implementation
"""

from .claude_code_sdk_v2 import (
    use_claude_code,
    stream_claude_code,
    continue_claude_code_session,
    list_claude_code_sessions,
    get_claude_code_session,
    cleanup_claude_code_sessions,
    # Compatibility aliases
    claude_code_agent,
    stream_claude_code_agent
)

# Re-export all functions for backward compatibility
__all__ = [
    'use_claude_code',
    'stream_claude_code', 
    'continue_claude_code_session',
    'list_claude_code_sessions',
    'get_claude_code_session',
    'cleanup_claude_code_sessions',
    'claude_code_agent',
    'stream_claude_code_agent'
]

# Legacy function mapping
async def execute_claude_code_plan(plan, session_id=None):
    """Legacy function for plan execution"""
    prompt = f"Execute plan: {plan.get('name', 'Unnamed')}"
    if 'steps' in plan:
        prompt += "\n".join(f"- {step}" for step in plan['steps'])
    
    return await use_claude_code(
        prompt=prompt,
        session_id=session_id,
        max_turns=10
    )

# Add any other legacy functions that need to be maintained
