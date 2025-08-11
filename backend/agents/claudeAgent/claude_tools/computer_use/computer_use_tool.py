import anthropic
from anthropic import AsyncAnthropic
import os
import asyncio
import subprocess
import base64
import json
from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def execute_computer_use(tool_input: Dict[str, Any]) -> Dict[str, Any]:
    """Execute computer use task with interleaved thinking"""
    
    task = tool_input.get("task", "")
    max_iterations = tool_input.get("max_iterations", 10)
    thinking_budget = tool_input.get("thinking_budget", 10000)
    
    if not task:
        return {
            "success": False,
            "error": "No task provided",
            "task_completed": False
        }
    
    # Initialize interleaved thinking agent
    agent = InterleavedComputerAgent(
        max_iterations=max_iterations,
        thinking_budget=thinking_budget
    )
    
    try:
        result = await agent.execute_task(task)
        return result
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "task_completed": False
        }

class InterleavedComputerAgent:
    def __init__(self, max_iterations: int = 10, thinking_budget: int = 10000):
        self.client = AsyncAnthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            default_headers={
                "anthropic-beta": "interleaved-thinking-2025-05-14,computer-use-2025-01-24,fine-grained-tool-streaming-2025-05-14"
            }
        )
        self.max_iterations = max_iterations
        self.thinking_budget = thinking_budget
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.screenshots = []
        self.thinking_logs = []
        self.actions_taken = []
        
        # MongoDB removed - logging to memory only
        
    async def execute_task(self, task: str) -> Dict[str, Any]:
        """Execute task with interleaved thinking loop and streaming"""
        
        messages = [{
            "role": "user",
            "content": f"Complete this task using computer use: {task}"
        }]
        
        iterations = 0
        while iterations < self.max_iterations:
            iterations += 1
            
            try:
                # Use streaming for long-running operations
                async with self.client.beta.messages.stream(
                    model="claude-sonnet-4-20250514",
                    max_tokens=16000,
                    thinking={
                        "type": "enabled",
                        "budget_tokens": self.thinking_budget
                    },
                    tools=[
                        {
                            "type": "computer_20250124",
                            "name": "computer",
                            "display_width_px": 1024,
                            "display_height_px": 768,
                            "display_number": 1,
                        },
                        {
                            "type": "text_editor_20250124",
                            "name": "str_replace_editor"
                        },
                        {
                            "type": "bash_20250124",
                            "name": "bash"
                        }
                    ],
                    betas=["computer-use-2025-01-24", "fine-grained-tool-streaming-2025-05-14"],
                    messages=messages
                ) as stream:
                    # Process streaming response
                    thinking_blocks = []
                    tool_use_blocks = []
                    text_blocks = []
                    assistant_content = []
                    
                    # Process events as they come
                    async for event in stream:
                        if hasattr(event, 'type'):
                            if event.type == 'content_block_start':
                                block_index = getattr(event, 'index', 0)
                                content_type = getattr(event.content_block, 'type', '')
                                
                                # Initialize content block
                                while len(assistant_content) <= block_index:
                                    assistant_content.append({})
                                
                                if content_type == 'thinking':
                                    assistant_content[block_index] = {
                                        'type': 'thinking',
                                        'thinking': '',
                                        'signature': ''
                                    }
                                elif content_type == 'tool_use':
                                    assistant_content[block_index] = {
                                        'type': 'tool_use',
                                        'id': getattr(event.content_block, 'id', ''),
                                        'name': getattr(event.content_block, 'name', ''),
                                        'input': ''
                                    }
                                elif content_type == 'text':
                                    assistant_content[block_index] = {
                                        'type': 'text',
                                        'text': ''
                                    }
                            
                            elif event.type == 'content_block_delta':
                                block_index = getattr(event, 'index', 0)
                                delta_type = getattr(event.delta, 'type', '')
                                
                                if block_index < len(assistant_content):
                                    if delta_type == 'thinking_delta':
                                        thinking_text = getattr(event.delta, 'thinking', '')
                                        assistant_content[block_index]['thinking'] += thinking_text
                                    elif delta_type == 'text_delta':
                                        text = getattr(event.delta, 'text', '')
                                        assistant_content[block_index]['text'] += text
                                    elif delta_type == 'input_json_delta':
                                        json_text = getattr(event.delta, 'partial_json', '')
                                        assistant_content[block_index]['input'] += json_text
                                    elif delta_type == 'signature_delta':
                                        sig_text = getattr(event.delta, 'signature', '')
                                        if 'signature' in assistant_content[block_index]:
                                            assistant_content[block_index]['signature'] += sig_text
                            
                            elif event.type == 'content_block_stop':
                                block_index = getattr(event, 'index', 0)
                                if block_index < len(assistant_content):
                                    block = assistant_content[block_index]
                                    
                                    # Process completed blocks
                                    if block.get('type') == 'thinking':
                                        thinking_blocks.append(block['thinking'])
                                        self.thinking_logs.append(block['thinking'])
                                        # Thinking logged to memory
                                    elif block.get('type') == 'tool_use':
                                        # Parse JSON input
                                        try:
                                            block['input'] = json.loads(block['input']) if block['input'] else {}
                                        except json.JSONDecodeError:
                                            logger.error(f"Failed to parse tool input: {block['input']}")
                                        tool_use_blocks.append(block)
                                    elif block.get('type') == 'text':
                                        text_blocks.append(block['text'])
                
                # Add assistant response to conversation
                messages.append({"role": "assistant", "content": assistant_content})
                
                # If no tools used, task is complete
                if not tool_use_blocks:
                    result = {
                        "success": True,
                        "task_completed": True,
                        "screenshots": self.screenshots,
                        "thinking_logs": self.thinking_logs,
                        "actions_taken": self.actions_taken,
                        "final_result": " ".join(text_blocks),
                        "session_id": self.session_id
                    }
                    # Task completion logged
                    return result
                
                # Execute tools and collect results
                tool_results = []
                for tool_block in tool_use_blocks:
                    result = await self._execute_tool_action(tool_block)
                    # Convert result to string if it's a dict
                    if isinstance(result, dict):
                        content = json.dumps(result)
                    else:
                        content = str(result)
                    
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_block['id'],
                        "content": content
                    })
                
                # Format tool results properly for Claude API
                messages.append({
                    "role": "user", 
                    "content": [result for result in tool_results]
                })
                
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Iteration {iterations} failed: {str(e)}",
                    "task_completed": False,
                    "screenshots": self.screenshots,
                    "thinking_logs": self.thinking_logs,
                    "actions_taken": self.actions_taken,
                    "session_id": self.session_id
                }
        
        return {
            "success": True,
            "task_completed": False,
            "error": f"Max iterations ({self.max_iterations}) reached",
            "screenshots": self.screenshots,
            "thinking_logs": self.thinking_logs,
            "actions_taken": self.actions_taken,
            "session_id": self.session_id
        }
    
    def _log_action(self, action_type: str, data: Dict[str, Any]):
        """Log action to memory"""
        log_entry = {
            "session_id": self.session_id,
            "timestamp": datetime.now(),
            "action_type": action_type,
            "data": data
        }
        # Just log to logger for now
        logger.debug(f"Computer use action: {action_type} - {data}")
    
    async def _execute_tool_action(self, tool_block) -> Dict[str, Any]:
        """Execute individual tool action"""
        
        tool_name = tool_block.get('name')
        tool_input = tool_block.get('input', {})
        if tool_name == "computer":
            return await self._execute_computer_action(tool_input)
        elif tool_name == "bash":
            return await self._execute_bash_action(tool_input)
        elif tool_name == "str_replace_editor":
            return await self._execute_editor_action(tool_input)
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    
    async def _execute_computer_action(self, action_input: Dict[str, Any]) -> Dict[str, Any]:
        """Execute computer use action"""
        
        action = action_input.get("action")
        self.actions_taken.append({"action": action, "input": action_input})
        self._log_action("computer_action", {"action": action, "input": action_input})
        
        try:
            if action == "screenshot":
                screenshot_data = await self._take_screenshot()
                self.screenshots.append(screenshot_data)
                return {"type": "screenshot", "data": screenshot_data}
            
            elif action == "left_click":
                coordinate = action_input.get("coordinate", [0, 0])
                return await self._click(coordinate[0], coordinate[1])
            
            elif action == "type":
                text = action_input.get("text", "")
                return await self._type_text(text)
            
            elif action == "key":
                key = action_input.get("key", "")
                return await self._press_key(key)
            
            elif action == "scroll":
                coordinate = action_input.get("coordinate", [500, 400])
                direction = action_input.get("scroll_direction", "down")
                amount = action_input.get("scroll_amount", 3)
                return await self._scroll(coordinate[0], coordinate[1], direction, amount)
            
            elif action == "left_click_drag":
                start = action_input.get("startCoordinate", [0, 0])
                end = action_input.get("endCoordinate", [0, 0])
                return await self._drag(start[0], start[1], end[0], end[1])
            
            elif action == "right_click":
                coordinate = action_input.get("coordinate", [0, 0])
                return await self._right_click(coordinate[0], coordinate[1])
            
            elif action == "middle_click":
                coordinate = action_input.get("coordinate", [0, 0])
                return await self._middle_click(coordinate[0], coordinate[1])
            
            elif action == "double_click":
                coordinate = action_input.get("coordinate", [0, 0])
                return await self._double_click(coordinate[0], coordinate[1])
            
            elif action == "triple_click":
                coordinate = action_input.get("coordinate", [0, 0])
                return await self._triple_click(coordinate[0], coordinate[1])
            
            elif action == "mouse_move":
                coordinate = action_input.get("coordinate", [0, 0])
                return await self._mouse_move(coordinate[0], coordinate[1])
            
            elif action == "wait":
                seconds = action_input.get("seconds", 1)
                return await self._wait(seconds)
            
            else:
                return {"error": f"Unsupported computer action: {action}"}
                
        except Exception as e:
            return {"error": f"Computer action failed: {str(e)}"}
    
    async def _take_screenshot(self) -> str:
        """Take screenshot and return base64 data"""
        try:
            # Ensure screenshots directory exists
            os.makedirs("/tmp/claude_screenshots", exist_ok=True)
            
            screenshot_path = f"/tmp/claude_screenshots/screenshot_{self.session_id}_{len(self.screenshots)}.png"
            
            # Use xwd to capture screenshot
            cmd = f"DISPLAY=:1 xwd -root | convert xwd:- png:{screenshot_path}"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0 and os.path.exists(screenshot_path):
                with open(screenshot_path, "rb") as f:
                    screenshot_data = base64.b64encode(f.read()).decode()
                return screenshot_data
            else:
                return "Screenshot failed"
                
        except Exception as e:
            return f"Screenshot error: {str(e)}"
    
    async def _click(self, x: int, y: int) -> Dict[str, Any]:
        """Click at coordinates"""
        try:
            cmd = f"DISPLAY=:1 xdotool mousemove {x} {y} click 1"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Clicked at ({x}, {y})", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Click failed: {str(e)}"}
    
    async def _type_text(self, text: str) -> Dict[str, Any]:
        """Type text"""
        try:
            # Escape special characters
            escaped_text = text.replace("'", "\\'").replace('"', '\\"')
            cmd = f"DISPLAY=:1 xdotool type '{escaped_text}'"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Typed: {text}", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Type failed: {str(e)}"}
    
    async def _press_key(self, key: str) -> Dict[str, Any]:
        """Press key or key combination"""
        try:
            cmd = f"DISPLAY=:1 xdotool key {key}"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Pressed key: {key}", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Key press failed: {str(e)}"}
    
    async def _scroll(self, x: int, y: int, direction: str, amount: int) -> Dict[str, Any]:
        """Scroll at coordinates"""
        try:
            # Map direction to xdotool button numbers
            button = "4" if direction == "up" else "5"  # 4=up, 5=down
            
            cmd = f"DISPLAY=:1 xdotool mousemove {x} {y}"
            for _ in range(amount):
                cmd += f" && DISPLAY=:1 xdotool click {button}"
            
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Scrolled {direction} {amount} times at ({x}, {y})", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Scroll failed: {str(e)}"}
    
    async def _drag(self, x1: int, y1: int, x2: int, y2: int) -> Dict[str, Any]:
        """Drag from one coordinate to another"""
        try:
            cmd = f"DISPLAY=:1 xdotool mousemove {x1} {y1} mousedown 1 mousemove {x2} {y2} mouseup 1"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Dragged from ({x1}, {y1}) to ({x2}, {y2})", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Drag failed: {str(e)}"}
    
    async def _execute_bash_action(self, action_input: Dict[str, Any]) -> Dict[str, Any]:
        """Execute bash command"""
        try:
            command = action_input.get("command", "")
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except Exception as e:
            return {"error": f"Bash execution failed: {str(e)}"}
    
    async def _execute_editor_action(self, action_input: Dict[str, Any]) -> Dict[str, Any]:
        """Execute text editor action"""
        # Implement text editor actions as needed
        return {"result": "Text editor action executed"}
    
    async def _right_click(self, x: int, y: int) -> Dict[str, Any]:
        """Right click at coordinates"""
        try:
            cmd = f"DISPLAY=:1 xdotool mousemove {x} {y} click 3"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Right clicked at ({x}, {y})", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Right click failed: {str(e)}"}
    
    async def _middle_click(self, x: int, y: int) -> Dict[str, Any]:
        """Middle click at coordinates"""
        try:
            cmd = f"DISPLAY=:1 xdotool mousemove {x} {y} click 2"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Middle clicked at ({x}, {y})", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Middle click failed: {str(e)}"}
    
    async def _double_click(self, x: int, y: int) -> Dict[str, Any]:
        """Double click at coordinates"""
        try:
            cmd = f"DISPLAY=:1 xdotool mousemove {x} {y} click --repeat 2 --delay 100 1"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Double clicked at ({x}, {y})", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Double click failed: {str(e)}"}
    
    async def _triple_click(self, x: int, y: int) -> Dict[str, Any]:
        """Triple click at coordinates"""
        try:
            cmd = f"DISPLAY=:1 xdotool mousemove {x} {y} click --repeat 3 --delay 100 1"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Triple clicked at ({x}, {y})", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Triple click failed: {str(e)}"}
    
    async def _mouse_move(self, x: int, y: int) -> Dict[str, Any]:
        """Move mouse to coordinates"""
        try:
            cmd = f"DISPLAY=:1 xdotool mousemove {x} {y}"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return {"result": f"Moved mouse to ({x}, {y})", "success": result.returncode == 0}
        except Exception as e:
            return {"error": f"Mouse move failed: {str(e)}"}
    
    async def _wait(self, seconds: float) -> Dict[str, Any]:
        """Wait for specified seconds"""
        try:
            await asyncio.sleep(seconds)
            return {"result": f"Waited {seconds} seconds", "success": True}
        except Exception as e:
            return {"error": f"Wait failed: {str(e)}"}