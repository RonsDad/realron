"""
Integration helper for browser-use Cloud API tools in the main tools registry
"""

from .browser_use_cloud.browser_use_cloud_tools import (
    execute_browser_use_cloud_automation,
    execute_browser_use_cloud_pause,
    execute_browser_use_cloud_resume,
    execute_browser_use_cloud_status,
    execute_browser_use_cloud_stop,
    execute_browser_use_cloud_list_active,
    execute_browser_use_cloud_account_status,
)

# Browser-Use Cloud API Tools for the main tools registry
BROWSER_USE_CLOUD_TOOLS = {
    "browser_use_cloud_automation": {
        "function": execute_browser_use_cloud_automation,
        "description": "Execute browser automation tasks using browser-use Cloud API with live URL for human oversight. Supports both ultra-fast (Groq) and smart (o3) use cases with stealth mode enabled by default. Perfect for web scraping, form filling, research, and complex browser interactions.",
        "parameters": {
            "task": {
                "type": "string",
                "description": "Detailed description of the browser automation task. Be specific about what actions to perform, what data to extract, and the expected outcome. Use clear, actionable language.",
                "required": True,
            },
            "use_case": {
                "type": "string",
                "description": "Select automation strategy: 'ultra-fast' uses Groq (fastest, $0.01/step), 'smart-o3' uses GPT-4o (smarter, $0.03/step), 'balanced' uses GPT-4o-mini",
                "required": False,
                "default": "ultra-fast",
            },
            "stealth_mode": {
                "type": "boolean",
                "description": "Enable stealth mode to avoid detection by anti-bot systems",
                "required": False,
                "default": True,
            },
        },
    },
    "browser_use_cloud_pause": {
        "function": execute_browser_use_cloud_pause,
        "description": "Pause a running browser automation task for human intervention. Use when the task needs human input, verification, or manual completion of complex steps.",
        "parameters": {
            "task_id": {
                "type": "string",
                "description": "The task ID to pause",
                "required": True,
            },
            "reason": {
                "type": "string",
                "description": "Reason for pausing (e.g., 'needs human verification', 'captcha detected', 'manual input required')",
                "required": False,
            },
        },
    },
    "browser_use_cloud_resume": {
        "function": execute_browser_use_cloud_resume,
        "description": "Resume a paused browser automation task with context about human actions performed during the pause.",
        "parameters": {
            "task_id": {
                "type": "string",
                "description": "The task ID to resume",
                "required": True,
            },
            "human_actions": {
                "type": "string",
                "description": "Description of what the human did while the task was paused (e.g., 'filled in captcha', 'completed login', 'navigated to correct page')",
                "required": False,
            },
            "additional_instructions": {
                "type": "string",
                "description": "Additional instructions for the agent to continue with",
                "required": False,
            },
        },
    },
    "browser_use_cloud_status": {
        "function": execute_browser_use_cloud_status,
        "description": "Get detailed status and progress information for a browser automation task, including live URL and available media.",
        "parameters": {
            "task_id": {
                "type": "string",
                "description": "The task ID to check status for",
                "required": True,
            },
        },
    },
    "browser_use_cloud_stop": {
        "function": execute_browser_use_cloud_stop,
        "description": "Stop a browser automation task permanently and clean up all resources.",
        "parameters": {
            "task_id": {
                "type": "string",
                "description": "The task ID to stop",
                "required": True,
            },
        },
    },
    "browser_use_cloud_list_active": {
        "function": execute_browser_use_cloud_list_active,
        "description": "List all currently active (running or paused) browser automation tasks for monitoring and management.",
        "parameters": {},
    },
    "browser_use_cloud_account_status": {
        "function": execute_browser_use_cloud_account_status,
        "description": "Check browser-use Cloud API account status, balance, and service availability.",
        "parameters": {},
    },
}

def get_browser_use_cloud_tools_registry():
    """Get the browser-use Cloud tools for integration into the main tools registry"""
    return BROWSER_USE_CLOUD_TOOLS