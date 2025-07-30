"""
Tool handlers for Claude to use
Based on the browser-use integration
"""

from typing import Any, Dict
import logging
import asyncio
from datetime import datetime
import os

logger = logging.getLogger(__name__)

# Browser automation tool using browser-use
async def browser_use(task: str, session_id: str = None) -> Dict[str, Any]:
    """
    Perform a browser automation task using browser-use Agent.
    Creates a new session if session_id is not provided.
    """
    try:
        from browser_use import Agent, BrowserSession, BrowserProfile
        from browser_use.llm import ChatOpenAI
        
        # Generate session_id if not provided
        if not session_id:
            session_id = f"claude_browser_{datetime.now().timestamp()}"
        
        logger.info(f"Starting browser task: {task}")
        
        # Get browserless token
        browserless_token = os.getenv('BROWSERLESS_API_TOKEN')
        if not browserless_token:
            return {"error": "BROWSERLESS_API_TOKEN not configured"}
        
        # Create browser profile for consistency
        browser_profile = BrowserProfile(
            stealth=True,
            headless=False,  # For human-in-the-loop
            viewport={"width": 1280, "height": 900},
            wait_between_actions=0.1  # Reduced from 0.3 for faster actions
        )
        
        # Import the centralized browser service to enforce single session
        from browser_use_service import browser_use_service
        
        # Check if we have an existing session to reuse
        active_sessions = await browser_use_service.list_active_sessions()
        
        if session_id and session_id in active_sessions.get('sessions', {}):
            # Use existing session
            logger.info(f"Reusing existing session: {session_id}")
            result = await browser_use_service.execute_browser_task(session_id, task)
            
            # Add session_id to result if not present
            if 'session_id' not in result:
                result['session_id'] = session_id
                
            return result
        else:
            # Create new session (will enforce single session limit)
            logger.info("Creating new browser session through centralized service")
            
            # The browser_use_service already uses the same profile settings:
            # ENFORCE ALL THESE PARAMETERS
            stealth=True
            headless=False  # for human-in-the-loop
            viewport={"width": 1280, "height": 900}
            wait_between_actions=0.1  # Reduced from 0.3 for faster actions
            interactive=False  # AGENT STAYS IN CONTROL
            
            session_result = await browser_use_service.create_live_url_session(
                timeout_ms=900000,  # 15 minutes - matches Browserless plan
                browser_profile=browser_profile,  # This already has stealth=True, headless=False, viewport, wait_between_actions
                interactive=False  # EXPLICITLY FALSE - AGENT STAYS IN CONTROL
            )
            new_session_id = session_result['session_id']
            live_url = session_result['live_url']
            
            logger.info(f"Browser session started with LiveURL: {live_url}")
            
            # Execute task in the new session
            # browser_use_service.execute_browser_task already:
            # - Uses ChatOpenAI(model="gpt-4.1") 
            # - Runs the agent with the task
            # - Returns result, live_url, final_url, etc.
            task_result = await browser_use_service.execute_browser_task(new_session_id, task)
            
            # Keep browser open briefly so user can see result
            await asyncio.sleep(1)  # Reduced from 5 seconds
            
            # Ensure we return all expected fields
            return {
                "success": task_result.get('success', True),
                "result": task_result.get('result', ''),
                "session_id": session_id,  # Use the original requested session_id
                "live_url": task_result.get('live_url', live_url),
                "final_url": task_result.get('final_url', ''),
                "task": task
            }
        
    except Exception as e:
        logger.error(f"Browser task error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "task": task
        }


# Web search tool
async def web_search(query: str, num_results: int = 5) -> Dict[str, Any]:
    """Search the web for information"""
    # This would integrate with your web search service
    # For now, return a placeholder
    return {
        "results": [f"Result {i+1} for '{query}'" for i in range(num_results)],
        "query": query
    }


# Code execution tool
async def execute_code(code: str, language: str = "python") -> Dict[str, Any]:
    """Execute code in a sandboxed environment"""
    # This would integrate with your code execution service
    return {
        "output": f"Executed {language} code",
        "code": code,
        "language": language,
        "error": None
    }


# Tool registry
TOOLS = {
    "browser_use": {
        "function": browser_use,
        "description": "Perform browser automation tasks like navigating websites, clicking elements, filling forms, extracting data",
        "parameters": {
            "task": {
                "type": "string",
                "description": "The browser automation task to perform",
                "required": True
            },
            "session_id": {
                "type": "string", 
                "description": "Optional session ID to reuse existing session",
                "required": False
            }
        }
    },
    "web_search": {
        "function": web_search,
        "description": "Search the web for information",
        "parameters": {
            "query": {
                "type": "string",
                "description": "The search query",
                "required": True
            },
            "num_results": {
                "type": "integer",
                "description": "Number of results to return",
                "required": False,
                "default": 5
            }
        }
    },
    "execute_code": {
        "function": execute_code,
        "description": "Execute code in a sandboxed environment",
        "parameters": {
            "code": {
                "type": "string",
                "description": "The code to execute",
                "required": True
            },
            "language": {
                "type": "string",
                "description": "Programming language",
                "required": False,
                "default": "python"
            }
        }
    }
}


def get_tool_definitions_for_claude():
    """Get tool definitions in Claude's expected format"""
    definitions = []
    
    for name, meta in TOOLS.items():
        tool_def = {
            "name": name,
            "description": meta["description"],
            "input_schema": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
        
        # Add parameters
        for param_name, param_info in meta["parameters"].items():
            tool_def["input_schema"]["properties"][param_name] = {
                "type": param_info["type"],
                "description": param_info["description"]
            }
            if param_info.get("default"):
                tool_def["input_schema"]["properties"][param_name]["default"] = param_info["default"]
            
            if param_info.get("required", False):
                tool_def["input_schema"]["required"].append(param_name)
        
        definitions.append(tool_def)
    
    return definitions


async def execute_tool(tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool by name with given input"""
    if tool_name not in TOOLS:
        return {"error": f"Unknown tool: {tool_name}"}
    
    tool_func = TOOLS[tool_name]["function"]
    
    try:
        # Execute the tool function
        result = await tool_func(**tool_input)
        return result
    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {str(e)}")
        return {
            "error": f"Tool execution failed: {str(e)}",
            "tool": tool_name,
            "input": tool_input
        }
