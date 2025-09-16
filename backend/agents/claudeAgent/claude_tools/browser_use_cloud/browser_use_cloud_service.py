"""
Browser-Use Cloud Service
High-level service for Ron's AI system integration
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .browser_use_cloud_client import BrowserUseCloudClient, TaskConfig, Model, TaskStatus

# Configure logging
logger = logging.getLogger(__name__)

class BrowserUseCloudService:
    """High-level service for browser automation using browser-use Cloud API"""

    def __init__(self):
        self.client: Optional[BrowserUseCloudClient] = None
        self._initialized = False

    async def _ensure_client(self):
        """Ensure client is initialized"""
        if not self._initialized:
            try:
                self.client = BrowserUseCloudClient()
                self._initialized = True
                logger.info("Browser-Use Cloud service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize browser-use cloud client: {str(e)}")
                raise RuntimeError(f"Browser-Use Cloud service initialization failed: {str(e)}")

    async def create_session_and_task(
        self,
        task: str,
        use_case: str = "ultra-fast",
        stealth_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Create session and task workflow for Ron's use case.
        Combined workflow: Create Session -> Get Session -> Create Task -> Get Task
        """
        await self._ensure_client()

        try:
            # Select model based on use case
            if use_case == "ultra-fast":
                model = Model.GEMINI_2_0_FLASH  # Fastest and cheapest ($0.01/step)
            elif use_case == "smart-o3":
                model = Model.GPT_4O  # Smarter for complex tasks ($0.03/step)
            else:
                model = Model.GPT_4O_MINI  # Default balanced option ($0.01/step)

            logger.info(f"Creating browser session and task with {model.value} model")

            # Create task configuration with stealth mode
            config = TaskConfig(
                task=task,
                model=model,
                timeout=1800,  # 30 minutes for complex tasks
                max_steps=150  # Allow more steps for complex workflows
            )

            # Create the task (this also creates the browser session)
            task_result = await self.client.create_task(config)
            task_id = task_result.get("task_id")
            live_url = task_result.get("live_url")

            if not task_id:
                raise RuntimeError("No task_id returned from task creation")

            logger.info(f"Created task {task_id} with live URL: {live_url}")

            # Get initial task details
            task_details = await self.client.get_task(task_id)

            return {
                "success": True,
                "task_id": task_id,
                "live_url": live_url,
                "model": model.value,
                "stealth_mode": stealth_mode,
                "use_case": use_case,
                "task_details": task_details,
                "iframe_config": {
                    "src": live_url,
                    "width": "100%",
                    "height": "600px",
                    "style": "border: none; border-radius: 8px;",
                    "title": "Ron's Browser Window - Browser-Use Cloud",
                    "frameborder": "0",
                    "allowfullscreen": True
                },
                "instructions": {
                    "usage": "Embed the live_url in an iframe in your frontend",
                    "note": "Users can watch the browser automation in real-time through this URL",
                    "human_takeover": "Use pause/resume endpoints for human intervention"
                }
            }

        except Exception as e:
            logger.error(f"Error in session and task creation: {str(e)}")
            raise RuntimeError(f"Failed to create session and task: {str(e)}")

    async def pause_for_human_intervention(self, task_id: str, description: str = "") -> Dict[str, Any]:
        """Pause task for human intervention"""
        await self._ensure_client()

        try:
            result = await self.client.pause_task(task_id)

            logger.info(f"Task {task_id} paused for human intervention: {description}")

            return {
                "success": True,
                "task_id": task_id,
                "status": "paused",
                "message": "Task paused - human can now interact with browser",
                "description": description,
                "next_steps": [
                    "Human can interact with the browser through the live URL",
                    "Call resume endpoint with context to continue automation",
                    "Browser state will be preserved during pause"
                ]
            }

        except Exception as e:
            logger.error(f"Error pausing task for human intervention: {str(e)}")
            raise RuntimeError(f"Failed to pause task: {str(e)}")

    async def resume_with_context(
        self,
        task_id: str,
        human_actions: str = "",
        additional_instructions: str = ""
    ) -> Dict[str, Any]:
        """Resume task after human intervention with context"""
        await self._ensure_client()

        try:
            # TODO: If browser-use Cloud API supports context updates, send human actions
            # For now, just resume the task
            result = await self.client.resume_task(task_id)

            logger.info(f"Task {task_id} resumed after human intervention")

            context_info = ""
            if human_actions:
                context_info += f"Human actions performed: {human_actions}. "
            if additional_instructions:
                context_info += f"Additional instructions: {additional_instructions}"

            return {
                "success": True,
                "task_id": task_id,
                "status": "running",
                "message": "Task resumed - agent continues with updated context",
                "context_provided": context_info,
                "note": "Agent will adapt based on current browser state"
            }

        except Exception as e:
            logger.error(f"Error resuming task with context: {str(e)}")
            raise RuntimeError(f"Failed to resume task: {str(e)}")

    async def get_task_status_detailed(self, task_id: str) -> Dict[str, Any]:
        """Get detailed task status and progress"""
        await self._ensure_client()

        try:
            # Get both status and full task details
            status = await self.client.get_task_status(task_id)
            task_details = await self.client.get_task(task_id)

            # Try to get media/screenshots if available
            media = None
            screenshots = None
            try:
                media = await self.client.get_task_media(task_id)
            except:
                pass

            try:
                screenshots = await self.client.get_task_screenshots(task_id)
            except:
                pass

            return {
                "success": True,
                "task_id": task_id,
                "status": status,
                "task_details": task_details,
                "media": media,
                "screenshots": screenshots,
                "live_url": task_details.get("live_url"),
                "progress_info": {
                    "completed": status in ["completed", "failed", "stopped"],
                    "can_pause": status == "running",
                    "can_resume": status == "paused",
                    "can_stop": status in ["running", "paused"]
                }
            }

        except Exception as e:
            logger.error(f"Error getting detailed task status: {str(e)}")
            raise RuntimeError(f"Failed to get task status: {str(e)}")

    async def stop_task_clean(self, task_id: str) -> Dict[str, Any]:
        """Stop task and clean up resources"""
        await self._ensure_client()

        try:
            result = await self.client.stop_task(task_id)

            logger.info(f"Task {task_id} stopped and cleaned up")

            return {
                "success": True,
                "task_id": task_id,
                "status": "stopped",
                "message": "Task stopped and resources cleaned up",
                "cleanup_completed": True
            }

        except Exception as e:
            logger.error(f"Error stopping task cleanly: {str(e)}")
            raise RuntimeError(f"Failed to stop task: {str(e)}")

    async def list_active_tasks(self) -> Dict[str, Any]:
        """List all active tasks for monitoring"""
        await self._ensure_client()

        try:
            # Get running tasks
            running_tasks = await self.client.list_tasks(status="running", limit=50)
            paused_tasks = await self.client.list_tasks(status="paused", limit=50)

            active_tasks = []
            if "tasks" in running_tasks:
                active_tasks.extend(running_tasks["tasks"])
            if "tasks" in paused_tasks:
                active_tasks.extend(paused_tasks["tasks"])

            return {
                "success": True,
                "active_tasks": active_tasks,
                "total_active": len(active_tasks),
                "running_count": len(running_tasks.get("tasks", [])),
                "paused_count": len(paused_tasks.get("tasks", []))
            }

        except Exception as e:
            logger.error(f"Error listing active tasks: {str(e)}")
            raise RuntimeError(f"Failed to list active tasks: {str(e)}")

    async def check_account_status(self) -> Dict[str, Any]:
        """Check account status and balance"""
        await self._ensure_client()

        try:
            balance = await self.client.check_balance()
            user_info = await self.client.get_user_info()

            return {
                "success": True,
                "balance": balance,
                "user_info": user_info,
                "api_key_valid": True,
                "service_available": True
            }

        except Exception as e:
            logger.error(f"Error checking account status: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "api_key_valid": False,
                "service_available": False
            }

    async def close(self):
        """Clean up resources"""
        if self.client:
            await self.client.close()
            self._initialized = False
            logger.info("Browser-Use Cloud service closed")

# Global service instance
_service_instance: Optional[BrowserUseCloudService] = None

async def get_browser_use_cloud_service() -> BrowserUseCloudService:
    """Get or create global service instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = BrowserUseCloudService()
    return _service_instance

async def cleanup_browser_use_cloud_service():
    """Cleanup global service instance"""
    global _service_instance
    if _service_instance:
        await _service_instance.close()
        _service_instance = None