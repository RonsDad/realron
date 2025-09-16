"""
Browser-Use Cloud API Client
Production-ready implementation for browser automation using browser-use Cloud API
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import httpx
import json
from dataclasses import dataclass
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

class Model(Enum):
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    CLAUDE_3_5_SONNET = "claude-3-5-sonnet"
    GEMINI_2_0_FLASH = "gemini-2-0-flash"

@dataclass
class TaskConfig:
    task: str
    model: Model = Model.GPT_4O_MINI
    browser_profile_id: Optional[str] = None
    timeout: int = 900  # 15 minutes default
    max_steps: int = 100
    extraction_schema: Optional[Dict[str, Any]] = None
    webhook_url: Optional[str] = None

class BrowserUseCloudClient:
    """Production Browser-Use Cloud API Client with comprehensive error handling"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("BROWSER_USE_API_KEY")
        if not self.api_key:
            raise ValueError("BROWSER_USE_API_KEY environment variable or api_key parameter required")

        self.base_url = "https://api.browser-use.com"
        self.timeout = httpx.Timeout(30.0, connect=5.0)

        # Initialize HTTP client with proper headers
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Ron-AI Browser-Use Cloud Client/1.0"
            },
            timeout=self.timeout
        )

        # Track active tasks and sessions
        self.active_tasks: Dict[str, Dict[str, Any]] = {}
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

        logger.info("Browser-Use Cloud client initialized")

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def close(self):
        """Cleanup resources"""
        if self.client:
            await self.client.aclose()
            logger.info("Browser-Use Cloud client closed")

    async def create_task(self, config: TaskConfig) -> Dict[str, Any]:
        """Create and run a new browser automation task"""
        try:
            payload = {
                "task": config.task,
                "model": config.model.value,
                "timeout": config.timeout,
                "max_steps": config.max_steps
            }

            # Add optional parameters
            if config.browser_profile_id:
                payload["browser_profile_id"] = config.browser_profile_id
            if config.extraction_schema:
                payload["extraction_schema"] = config.extraction_schema
            if config.webhook_url:
                payload["webhook_url"] = config.webhook_url

            logger.info(f"Creating task: {config.task[:100]}...")

            response = await self.client.post("/api/v1/run-task", json=payload)
            response.raise_for_status()

            task_data = response.json()
            task_id = task_data.get("task_id")

            if task_id:
                self.active_tasks[task_id] = {
                    "task_id": task_id,
                    "config": config,
                    "status": TaskStatus.RUNNING,
                    "created_at": datetime.now().isoformat(),
                    "live_url": task_data.get("live_url"),
                    "data": task_data
                }

            logger.info(f"Task created successfully: {task_id}")
            return task_data

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error creating task: {e.response.status_code} - {e.response.text}")
            raise RuntimeError(f"Failed to create task: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            raise RuntimeError(f"Failed to create task: {str(e)}")

    async def get_task(self, task_id: str) -> Dict[str, Any]:
        """Get complete task details"""
        try:
            response = await self.client.get(f"/api/v1/get-task/{task_id}")
            response.raise_for_status()

            task_data = response.json()

            # Update local tracking
            if task_id in self.active_tasks:
                self.active_tasks[task_id]["data"] = task_data
                self.active_tasks[task_id]["status"] = TaskStatus(task_data.get("status", "running"))

            return task_data

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise ValueError(f"Task {task_id} not found")
            logger.error(f"HTTP error getting task: {e.response.status_code} - {e.response.text}")
            raise RuntimeError(f"Failed to get task: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error getting task {task_id}: {str(e)}")
            raise RuntimeError(f"Failed to get task: {str(e)}")

    async def get_task_status(self, task_id: str) -> str:
        """Get task status only"""
        try:
            response = await self.client.get(f"/api/v1/get-task-status/{task_id}")
            response.raise_for_status()

            status_data = response.json()
            status = status_data.get("status", "unknown")

            # Update local tracking
            if task_id in self.active_tasks:
                self.active_tasks[task_id]["status"] = TaskStatus(status) if status in [s.value for s in TaskStatus] else TaskStatus.RUNNING

            return status

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise ValueError(f"Task {task_id} not found")
            raise RuntimeError(f"Failed to get task status: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error getting task status {task_id}: {str(e)}")
            raise RuntimeError(f"Failed to get task status: {str(e)}")

    async def pause_task(self, task_id: str) -> Dict[str, Any]:
        """Pause a running task"""
        try:
            response = await self.client.post("/api/v1/pause-task", json={"task_id": task_id})
            response.raise_for_status()

            result = response.json()

            # Update local tracking
            if task_id in self.active_tasks:
                self.active_tasks[task_id]["status"] = TaskStatus.PAUSED

            logger.info(f"Task {task_id} paused successfully")
            return result

        except Exception as e:
            logger.error(f"Error pausing task {task_id}: {str(e)}")
            raise RuntimeError(f"Failed to pause task: {str(e)}")

    async def resume_task(self, task_id: str) -> Dict[str, Any]:
        """Resume a paused task"""
        try:
            response = await self.client.post("/api/v1/resume-task", json={"task_id": task_id})
            response.raise_for_status()

            result = response.json()

            # Update local tracking
            if task_id in self.active_tasks:
                self.active_tasks[task_id]["status"] = TaskStatus.RUNNING

            logger.info(f"Task {task_id} resumed successfully")
            return result

        except Exception as e:
            logger.error(f"Error resuming task {task_id}: {str(e)}")
            raise RuntimeError(f"Failed to resume task: {str(e)}")

    async def stop_task(self, task_id: str) -> Dict[str, Any]:
        """Stop a task permanently"""
        try:
            response = await self.client.post("/api/v1/stop-task", json={"task_id": task_id})
            response.raise_for_status()

            result = response.json()

            # Update local tracking
            if task_id in self.active_tasks:
                self.active_tasks[task_id]["status"] = TaskStatus.STOPPED

            logger.info(f"Task {task_id} stopped successfully")
            return result

        except Exception as e:
            logger.error(f"Error stopping task {task_id}: {str(e)}")
            raise RuntimeError(f"Failed to stop task: {str(e)}")

    async def list_tasks(self, limit: int = 10, offset: int = 0, status: Optional[str] = None) -> Dict[str, Any]:
        """List all tasks"""
        try:
            params = {"limit": limit, "offset": offset}
            if status:
                params["status"] = status

            response = await self.client.get("/api/v1/list-tasks", params=params)
            response.raise_for_status()

            return response.json()

        except Exception as e:
            logger.error(f"Error listing tasks: {str(e)}")
            raise RuntimeError(f"Failed to list tasks: {str(e)}")

    async def check_balance(self) -> Dict[str, Any]:
        """Check account balance"""
        try:
            response = await self.client.get("/api/v1/check-balance")
            response.raise_for_status()

            return response.json()

        except Exception as e:
            logger.error(f"Error checking balance: {str(e)}")
            raise RuntimeError(f"Failed to check balance: {str(e)}")

    async def get_user_info(self) -> Dict[str, Any]:
        """Get user info and validate API key"""
        try:
            response = await self.client.get("/api/v1/me")
            response.raise_for_status()

            return response.json()

        except Exception as e:
            logger.error(f"Error getting user info: {str(e)}")
            raise RuntimeError(f"Failed to get user info: {str(e)}")

# Global client instance
_client_instance: Optional[BrowserUseCloudClient] = None

async def get_browser_use_cloud_client() -> BrowserUseCloudClient:
    """Get or create global client instance"""
    global _client_instance
    if _client_instance is None:
        _client_instance = BrowserUseCloudClient()
    return _client_instance

async def cleanup_browser_use_cloud_client():
    """Cleanup global client instance"""
    global _client_instance
    if _client_instance:
        await _client_instance.close()
        _client_instance = None