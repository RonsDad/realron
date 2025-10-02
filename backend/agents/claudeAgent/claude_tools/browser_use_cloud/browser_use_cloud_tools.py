"""
Browser-Use Cloud Tools for Ron's AI System
Tool registration and definitions for Claude to use browser-use Cloud API
"""

import logging
from typing import Dict, Any, List

from .browser_use_cloud_service import get_browser_use_cloud_service

logger = logging.getLogger(__name__)

# Tool definitions for Claude
BROWSER_USE_CLOUD_TOOLS = [
    {
        "name": "browser_use_cloud_automation",
        "description": "Execute browser automation tasks using browser-use Cloud API with live URL for human oversight. Supports both ultra-fast (Groq) and smart (o3) use cases with stealth mode enabled by default. Perfect for web scraping, form filling, research, and complex browser interactions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task": {
                    "type": "string",
                    "description": "Detailed description of the browser automation task. Be specific about what actions to perform, what data to extract, and the expected outcome. Use clear, actionable language."
                },
                "use_case": {
                    "type": "string",
                    "enum": ["ultra-fast", "smart-o3", "balanced"],
                    "default": "ultra-fast",
                    "description": "Select automation strategy: 'ultra-fast' uses Groq (fastest, $0.01/step), 'smart-o3' uses GPT-4o (smarter, $0.03/step), 'balanced' uses GPT-4o-mini"
                },
                "stealth_mode": {
                    "type": "boolean",
                    "default": True,
                    "description": "Enable stealth mode to avoid detection by anti-bot systems"
                }
            },
            "required": ["task"]
        }
    },
    {
        "name": "browser_use_cloud_pause",
        "description": "Pause a running browser automation task for human intervention. Use when the task needs human input, verification, or manual completion of complex steps.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "The task ID to pause"
                },
                "reason": {
                    "type": "string",
                    "description": "Reason for pausing (e.g., 'needs human verification', 'captcha detected', 'manual input required')"
                }
            },
            "required": ["task_id"]
        }
    },
    {
        "name": "browser_use_cloud_resume",
        "description": "Resume a paused browser automation task with context about human actions performed during the pause.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "The task ID to resume"
                },
                "human_actions": {
                    "type": "string",
                    "description": "Description of what the human did while the task was paused (e.g., 'filled in captcha', 'completed login', 'navigated to correct page')"
                },
                "additional_instructions": {
                    "type": "string",
                    "description": "Additional instructions for the agent to continue with"
                }
            },
            "required": ["task_id"]
        }
    },
    {
        "name": "browser_use_cloud_status",
        "description": "Get detailed status and progress information for a browser automation task, including live URL and available media.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "The task ID to check status for"
                }
            },
            "required": ["task_id"]
        }
    },
    {
        "name": "browser_use_cloud_stop",
        "description": "Stop a browser automation task permanently and clean up all resources.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "The task ID to stop"
                }
            },
            "required": ["task_id"]
        }
    },
    {
        "name": "browser_use_cloud_list_active",
        "description": "List all currently active (running or paused) browser automation tasks for monitoring and management.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "browser_use_cloud_account_status",
        "description": "Check browser-use Cloud API account status, balance, and service availability.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
]

# Tool execution functions
async def execute_browser_use_cloud_automation(task: str, use_case: str = "ultra-fast", stealth_mode: bool = True) -> Dict[str, Any]:
    """Execute browser automation using browser-use Cloud API"""
    try:
        service = await get_browser_use_cloud_service()

        logger.info(f"Executing browser automation task: {task[:100]}... (use_case: {use_case}, stealth: {stealth_mode})")

        result = await service.create_session_and_task(
            task=task,
            use_case=use_case,
            stealth_mode=stealth_mode
        )

        return {
            "success": True,
            "result": result,
            "message": f"Browser automation task created successfully. Live URL: {result.get('live_url')}",
            "live_url": result.get("live_url"),
            "task_id": result.get("task_id"),
            "iframe_instructions": result.get("iframe_config"),
            "monitoring_available": True
        }

    except Exception as e:
        logger.error(f"Error in browser automation: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Browser automation failed: {str(e)}"
        }

async def execute_browser_use_cloud_pause(task_id: str, reason: str = "") -> Dict[str, Any]:
    """Pause browser automation task"""
    try:
        service = await get_browser_use_cloud_service()

        result = await service.pause_for_human_intervention(task_id, reason)

        return {
            "success": True,
            "result": result,
            "message": f"Task {task_id} paused successfully. Human can now interact with the browser.",
            "next_steps": result.get("next_steps", [])
        }

    except Exception as e:
        logger.error(f"Error pausing task: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to pause task: {str(e)}"
        }

async def execute_browser_use_cloud_resume(task_id: str, human_actions: str = "", additional_instructions: str = "") -> Dict[str, Any]:
    """Resume browser automation task with context"""
    try:
        service = await get_browser_use_cloud_service()

        result = await service.resume_with_context(task_id, human_actions, additional_instructions)

        return {
            "success": True,
            "result": result,
            "message": f"Task {task_id} resumed successfully. Agent continues with provided context.",
            "context_applied": result.get("context_provided", "")
        }

    except Exception as e:
        logger.error(f"Error resuming task: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to resume task: {str(e)}"
        }

async def execute_browser_use_cloud_status(task_id: str) -> Dict[str, Any]:
    """Get detailed task status"""
    try:
        service = await get_browser_use_cloud_service()

        result = await service.get_task_status_detailed(task_id)

        return {
            "success": True,
            "result": result,
            "message": f"Task {task_id} status: {result.get('status')}",
            "live_url": result.get("live_url"),
            "progress_info": result.get("progress_info"),
            "media_available": bool(result.get("media")),
            "screenshots_available": bool(result.get("screenshots"))
        }

    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to get task status: {str(e)}"
        }

async def execute_browser_use_cloud_stop(task_id: str) -> Dict[str, Any]:
    """Stop browser automation task"""
    try:
        service = await get_browser_use_cloud_service()

        result = await service.stop_task_clean(task_id)

        return {
            "success": True,
            "result": result,
            "message": f"Task {task_id} stopped and cleaned up successfully."
        }

    except Exception as e:
        logger.error(f"Error stopping task: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to stop task: {str(e)}"
        }

async def execute_browser_use_cloud_list_active() -> Dict[str, Any]:
    """List active browser automation tasks"""
    try:
        service = await get_browser_use_cloud_service()

        result = await service.list_active_tasks()

        return {
            "success": True,
            "result": result,
            "message": f"Found {result.get('total_active', 0)} active tasks ({result.get('running_count', 0)} running, {result.get('paused_count', 0)} paused)",
            "active_tasks": result.get("active_tasks", [])
        }

    except Exception as e:
        logger.error(f"Error listing active tasks: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to list active tasks: {str(e)}"
        }

async def execute_browser_use_cloud_account_status() -> Dict[str, Any]:
    """Check account status"""
    try:
        service = await get_browser_use_cloud_service()

        result = await service.check_account_status()

        if result.get("success"):
            return {
                "success": True,
                "result": result,
                "message": "Browser-Use Cloud API is available and API key is valid.",
                "balance": result.get("balance"),
                "user_info": result.get("user_info")
            }
        else:
            return {
                "success": False,
                "result": result,
                "message": "Browser-Use Cloud API is not available or API key is invalid.",
                "error": result.get("error")
            }

    except Exception as e:
        logger.error(f"Error checking account status: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to check account status: {str(e)}"
        }

# Tool execution mapping
BROWSER_USE_CLOUD_TOOL_EXECUTORS = {
    "browser_use_cloud_automation": execute_browser_use_cloud_automation,
    "browser_use_cloud_pause": execute_browser_use_cloud_pause,
    "browser_use_cloud_resume": execute_browser_use_cloud_resume,
    "browser_use_cloud_status": execute_browser_use_cloud_status,
    "browser_use_cloud_stop": execute_browser_use_cloud_stop,
    "browser_use_cloud_list_active": execute_browser_use_cloud_list_active,
    "browser_use_cloud_account_status": execute_browser_use_cloud_account_status,
}

def get_browser_use_cloud_tools() -> List[Dict[str, Any]]:
    """Get browser-use Cloud tool definitions"""
    return BROWSER_USE_CLOUD_TOOLS

async def execute_browser_use_cloud_tool(tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a browser-use Cloud tool by name"""
    if tool_name not in BROWSER_USE_CLOUD_TOOL_EXECUTORS:
        return {
            "success": False,
            "error": f"Unknown tool: {tool_name}",
            "available_tools": list(BROWSER_USE_CLOUD_TOOL_EXECUTORS.keys())
        }

    try:
        executor = BROWSER_USE_CLOUD_TOOL_EXECUTORS[tool_name]
        return await executor(**parameters)
    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Tool execution failed: {str(e)}"
        }