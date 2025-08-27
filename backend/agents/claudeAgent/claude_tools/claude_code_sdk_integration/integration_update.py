"""
Integration Update Script
Updates the main tools.py file to include Claude Code SDK tools
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent.parent.parent))

from backend.agents.claudeAgent.claude_tools.claude_code_sdk_integration import (
    get_claude_code_tool_definitions,
    execute_claude_code_tool
)

def add_claude_code_tools_to_main():
    """
    Add Claude Code SDK tools to the main TOOLS dictionary
    This function should be called during initialization
    """
    
    # Import the main tools module
    from backend.agents.claudeAgent.claude_tools import tools
    
    # Get Claude Code tool definitions
    claude_code_tools = get_claude_code_tool_definitions()
    
    # Add each tool to the main TOOLS dictionary
    for tool_name, definition in claude_code_tools.items():
        # Create an async wrapper for the tool execution
        async def tool_wrapper(tool_name=tool_name, **kwargs):
            return await execute_claude_code_tool(tool_name, kwargs)
        
        # Add to TOOLS dictionary
        tools.TOOLS[tool_name] = {
            "function": tool_wrapper,
            "description": definition["description"],
            "parameters": definition["parameters"]
        }
    
    print(f"Successfully added {len(claude_code_tools)} Claude Code SDK tools")
    
    # Return the tool names for reference
    return list(claude_code_tools.keys())

def get_claude_code_tool_snippet():
    """
    Get the code snippet to add to tools.py
    """
    
    snippet = '''
# Claude Code SDK Integration Tools
# Import at the top of the file:
from .claude_code_sdk_integration import (
    get_claude_code_tool_definitions,
    execute_claude_code_tool
)

# Add to TOOLS dictionary:
# Claude Code SDK Tools
claude_code_tools_config = get_claude_code_tool_definitions()

for tool_name, config in claude_code_tools_config.items():
    # Create async function for each tool
    async def _claude_code_tool_executor(
        tool_name=tool_name,  # Capture tool_name in closure
        **kwargs
    ):
        """Execute Claude Code SDK tool"""
        return await execute_claude_code_tool(tool_name, kwargs)
    
    TOOLS[tool_name] = {
        "function": _claude_code_tool_executor,
        "description": config["description"],
        "parameters": config["parameters"]
    }

# The following Claude Code SDK tools are now available:
# - claude_code_agent: Main coding agent for creating, testing, deploying tools
# - claude_code_continue_session: Continue an existing coding session
# - claude_code_session_status: Check session status
# - claude_code_close_session: Close a coding session
# - claude_code_subagent: Delegate to specialized subagents
# - claude_code_subagent_team: Run multiple subagents in parallel
# - claude_code_deploy: Deploy tools with MCP integration
# - claude_code_test: Run comprehensive tests
# - claude_code_monitor: Set up monitoring for deployed tools
'''
    
    return snippet

def update_execute_tool_function():
    """
    Get the updated execute_tool function to handle Claude Code tools
    """
    
    snippet = '''
# In the execute_tool function, add this section:

    # Handle Claude Code SDK tools
    elif tool_name.startswith("claude_code_"):
        from .claude_code_sdk_integration import execute_claude_code_tool
        result = await execute_claude_code_tool(tool_name, tool_input)
        return result
'''
    
    return snippet

if __name__ == "__main__":
    print("Claude Code SDK Integration Update Instructions")
    print("=" * 50)
    print("\nTo integrate Claude Code SDK tools into your main tools.py file:")
    print("\n1. Add the import statements:")
    print("-" * 30)
    print(get_claude_code_tool_snippet())
    print("\n2. Update the execute_tool function:")
    print("-" * 30)
    print(update_execute_tool_function())
    print("\n3. Or run this function to automatically add tools:")
    print("-" * 30)
    print("from backend.agents.claudeAgent.claude_tools.claude_code_sdk_integration.integration_update import add_claude_code_tools_to_main")
    print("tool_names = add_claude_code_tools_to_main()")
    print("\nDone!")