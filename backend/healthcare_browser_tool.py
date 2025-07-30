"""
Healthcare Browser Automation Tool
Uses centralized browser_use_service for healthcare portal automation
Returns either task results or LiveURL for human handoff
"""

import asyncio
import os
from typing import Dict, Any, Optional
from datetime import datetime
from browser_use import BrowserProfile
from browser_use_service import browser_use_service


class BrowserlessHealthcareTool:
	"""Healthcare browser automation using centralized browser_use_service"""
	
	def __init__(self):
		self.session_id: Optional[str] = None
		self.session_info: Optional[Dict[str, Any]] = None
		self.tracing_enabled = False
		self.tracing_callbacks = []

	async def create_browser_session(self, use_stealth: bool = True, use_proxy: bool = True) -> Dict[str, Any]:
		"""Create browser session using centralized service"""
		# Create browser profile
		browser_profile = BrowserProfile(
			stealth=use_stealth,
			headless=False,  # For human-in-the-loop workflows
			viewport={"width": 1280, "height": 900},
			wait_between_actions=0.1,
			interactive=False,  # Reduced from 0.3 for faster actions
		)
		
		# Create session through centralized service
		result = await browser_use_service.create_live_url_session(
			timeout_ms=900000,  # 15 minutes
			browser_profile=browser_profile,
			interactive=False  # Agent stays in control
		)
		
		self.session_id = result['session_id']
		self.session_info = result
		return result

	async def get_live_url(self) -> str:
		"""Get LiveURL from the current session"""
		if not self.session_id:
			raise RuntimeError("No active session")
		return self.session_info.get('live_url', '')

	async def execute_task(self, task: str) -> Any:
		"""Execute a task in the current session"""
		if not self.session_id:
			raise RuntimeError("No active session")
		return await browser_use_service.execute_browser_task(self.session_id, task)

	async def enable_user_control(self) -> Dict[str, Any]:
		"""Enable user interaction with the browser"""
		if not self.session_id:
			raise RuntimeError("No active session")
		return await browser_use_service.enable_user_control(self.session_id)

	async def relinquish_user_control(self) -> Dict[str, Any]:
		"""Return control to the agent"""
		if not self.session_id:
			raise RuntimeError("No active session")
		return await browser_use_service.relinquish_user_control(self.session_id)

	def enable_tracing(self, callback_func=None):
		"""Enable browserless-specific tracing"""
		self.tracing_enabled = True
		if callback_func:
			self.tracing_callbacks.append(callback_func)
	
	async def emit_tracing_event(self, event_type: str, data: Dict[str, Any]):
		"""Emit tracing event to registered callbacks"""
		if self.tracing_enabled:
			event = {
				"event_type": event_type,
				"data": data,
				"timestamp": datetime.now().isoformat(),
				"source": "browserless"
			}
			
			for callback in self.tracing_callbacks:
				try:
					if asyncio.iscoroutinefunction(callback):
						await callback(event)
					else:
						callback(event)
				except Exception as e:
					print(f"Tracing callback error: {e}")
	
	async def cleanup(self) -> None:
		"""Clean up resources"""
		try:
			if self.session_id:
				await browser_use_service.close_session(self.session_id)
				self.session_id = None
				self.session_info = None
		except Exception as e:
			print(f"Cleanup error: {e}")


# Legacy function for backward compatibility
async def execute_healthcare_browser_task(
	task_description: str,
	require_human_handoff: bool = False,
	enable_recording: bool = False
) -> Dict[str, Any]:
	"""Execute healthcare browser automation task using centralized service"""
	tool = BrowserlessHealthcareTool()
	
	try:
		# Create browser session through centralized service
		session_result = await tool.create_browser_session()
		
		result_data = {
			"success": True,
			"session_id": session_result['session_id'],
			"live_url": session_result['live_url']
		}
		
		if require_human_handoff:
			# Enable user control for human handoff
			print(f"Human handoff required. LiveURL: {session_result['live_url']}")
			await tool.enable_user_control()
			result_data["human_session_enabled"] = True
			result_data["message"] = "Human control enabled. User can interact with the browser."
		else:
			# Run agent automation through centralized service
			agent_result = await tool.execute_task(task_description)
			result_data["result"] = agent_result
		
		# Note: Recording is handled by the centralized service if configured
		if enable_recording:
			result_data["recording_note"] = "Recording is managed by the centralized browser service"
		
		return result_data
		
	except Exception as e:
		return {"success": False, "error": str(e)}
	finally:
		# Only cleanup if not requiring human handoff
		if not require_human_handoff:
			await tool.cleanup()