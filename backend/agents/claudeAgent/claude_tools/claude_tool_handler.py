"""
Simple tool handler for Claude based on Anthropic documentation
"""

import logging
import json
from typing import Dict, Any, List
from .tools import execute_tool as execute_local_tool, get_tool_definitions_for_claude

logger = logging.getLogger(__name__)


async def handle_tool_use_in_conversation(messages: List[Dict[str, Any]], tools: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Handle a conversation that may involve tool use.
    This follows the pattern from Anthropic documentation.
    
    Args:
        messages: Conversation history
        tools: Available tools for Claude
        
    Returns:
        Final response after any tool executions
    """
    from backend.agents.claudeAgent.claude_completions import ClaudeCompletions
    
    claude = ClaudeCompletions()
    
    # Keep conversation going until we get a final response
    while True:
        # Call Claude with tools
        response = await claude.complete(
            messages=messages,
            max_tokens=32000,  # Increased for complex browser tasks
            temperature=1.0,
            enable_thinking=True,
            thinking_budget=20000,
            custom_tools=tools
        )
        
        # Check if Claude used a tool
        if response.get("tool_use"):
            tool_use = response["tool_use"]
            logger.info(f"Claude used tool: {tool_use['name']} with input: {tool_use['input']}")
            
            # Execute the tool
            tool_result = await execute_tool(tool_use["name"], tool_use["input"], tools)
            
            # Add Claude's response (with tool use) to messages
            messages.append({
                "role": "assistant",
                "content": [
                    {"type": "text", "text": response.get("content", "")},
                    {
                        "type": "tool_use",
                        "id": tool_use["id"],
                        "name": tool_use["name"],
                        "input": tool_use["input"]
                    }
                ]
            })
            
            # Add tool result to messages
            messages.append({
                "role": "user",
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": tool_use["id"],
                    "content": str(tool_result)
                }]
            })
            
            # Continue the loop to get Claude's next response
            continue
        else:
            # No tool use, return final response
            return response


async def execute_tool(tool_name: str, tool_input: Dict[str, Any], available_tools: List[Dict[str, Any]]) -> Any:
    """
    Executes a tool, checking if it's a Telnyx tool or a local one.
    """
    # For now, all tools go through local execution
    # Remote MCP tools (like Telnyx) should be handled via Claude's MCP connector, not here
    return await execute_local_tool(tool_name, tool_input)


async def stream_with_tool_handling(messages: List[Dict[str, Any]], tools: List[Dict[str, Any]], **kwargs):
    """
    Stream responses with tool handling.
    """
    from backend.agents.claudeAgent.claude_completions import ClaudeCompletions
    
    claude = ClaudeCompletions()
    
    # For streaming with tools, we need to handle tool use events
    async for event in claude.stream_complete_with_tools(
        messages=messages,
        tools=tools,
        **kwargs
    ):
        yield event
        
        # If we see a tool use completion, we'd need to handle it
        # This is more complex with streaming and may require buffering
