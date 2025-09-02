#!/usr/bin/env python3.11

"""
Official Claude Computer Use Tool Implementation
Following Anthropic's computer-use-2025-01-24 specifications
"""

import os
import base64
import time
import subprocess
import json
import logging
from typing import Dict, Any, List, Optional
from PIL import Image
from anthropic import Anthropic

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OfficialComputerUseTool:
    """
    Official implementation of Claude Computer Use tool following Anthropic specs
    Supports all actions from computer_20250124 tool version
    """
    
    def __init__(self, display_width=1920, display_height=1080, display_number=1):
        self.display_width = display_width
        self.display_height = display_height
        self.display_number = display_number
        
        # Set up display environment to connect to VNC server
        os.environ['DISPLAY'] = f':{display_number}'
        
        logger.info(f"Initialized computer use tool with display {display_width}x{display_height}:{display_number}")
        
    def screenshot(self) -> Dict[str, Any]:
        """
        Take a screenshot of the virtual display
        Returns base64 encoded PNG image as per Anthropic specs
        """
        try:
            # Use ImageMagick import to capture screenshot directly as PNG
            result = subprocess.run([
                'import', '-window', 'root', '-display', f':{self.display_number}', '/tmp/screenshot.png'
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode != 0:
                return {"error": "Failed to capture screenshot with import"}
            
            # Read and encode the image
            with open('/tmp/screenshot.png', 'rb') as f:
                image_data = f.read()
                encoded_image = base64.b64encode(image_data).decode('utf-8')
            
            # Return in official Anthropic format
            return {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": encoded_image
                }
            }
            
        except subprocess.TimeoutExpired:
            return {"error": "Screenshot capture timed out"}
        except Exception as e:
            return {"error": f"Screenshot failed: {str(e)}"}
    
    def left_click(self, coordinate: List[int]) -> Dict[str, Any]:
        """Perform left mouse click at coordinates [x, y]"""
        try:
            x, y = coordinate
            if not self._validate_coordinates(x, y):
                return {"error": f"Coordinates {coordinate} out of bounds (0,0) to ({self.display_width},{self.display_height})"}
            
            # Use xdotool for X11 click
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True, timeout=5)
            subprocess.run(['xdotool', 'click', '1'], check=True, timeout=5)
            
            return {"result": f"Left clicked at {coordinate}"}
            
        except subprocess.CalledProcessError as e:
            return {"error": f"Click command failed: {e}"}
        except Exception as e:
            return {"error": f"Click failed: {str(e)}"}
    
    def right_click(self, coordinate: List[int]) -> Dict[str, Any]:
        """Perform right mouse click at coordinates [x, y]"""
        try:
            x, y = coordinate
            if not self._validate_coordinates(x, y):
                return {"error": f"Coordinates {coordinate} out of bounds"}
            
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True, timeout=5)
            subprocess.run(['xdotool', 'click', '3'], check=True, timeout=5)
            
            return {"result": f"Right clicked at {coordinate}"}
        except Exception as e:
            return {"error": f"Right click failed: {str(e)}"}
    
    def double_click(self, coordinate: List[int]) -> Dict[str, Any]:
        """Perform double click at coordinates [x, y]"""
        try:
            x, y = coordinate
            if not self._validate_coordinates(x, y):
                return {"error": f"Coordinates {coordinate} out of bounds"}
            
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True, timeout=5)
            subprocess.run(['xdotool', 'click', '--repeat', '2', '1'], check=True, timeout=5)
            
            return {"result": f"Double clicked at {coordinate}"}
        except Exception as e:
            return {"error": f"Double click failed: {str(e)}"}
    
    def middle_click(self, coordinate: List[int]) -> Dict[str, Any]:
        """Perform middle mouse click at coordinates [x, y]"""
        try:
            x, y = coordinate
            if not self._validate_coordinates(x, y):
                return {"error": f"Coordinates {coordinate} out of bounds"}
            
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True, timeout=5)
            subprocess.run(['xdotool', 'click', '2'], check=True, timeout=5)
            
            return {"result": f"Middle clicked at {coordinate}"}
        except Exception as e:
            return {"error": f"Middle click failed: {str(e)}"}
    
    def type(self, text: str) -> Dict[str, Any]:
        """Type text using keyboard"""
        try:
            # Escape special characters for xdotool
            escaped_text = text.replace('"', '\\"').replace("'", "\\'")
            subprocess.run(['xdotool', 'type', escaped_text], check=True, timeout=10)
            
            return {"result": f"Typed: {text}"}
        except Exception as e:
            return {"error": f"Type failed: {str(e)}"}
    
    def key(self, key: str) -> Dict[str, Any]:
        """Press a key or key combination (e.g., 'ctrl+s', 'Return', 'Escape')"""
        try:
            # Handle key combinations like ctrl+c
            if '+' in key:
                # Split and join with + for xdotool
                keys = [k.strip() for k in key.split('+')]
                subprocess.run(['xdotool', 'key'] + keys, check=True, timeout=5)
            else:
                subprocess.run(['xdotool', 'key', key], check=True, timeout=5)
            
            return {"result": f"Pressed key: {key}"}
        except Exception as e:
            return {"error": f"Key press failed: {str(e)}"}
    
    def scroll(self, coordinate: List[int], scroll_direction: str = "down", scroll_amount: int = 3) -> Dict[str, Any]:
        """Scroll at coordinates with direction and amount control"""
        try:
            x, y = coordinate
            if not self._validate_coordinates(x, y):
                return {"error": f"Coordinates {coordinate} out of bounds"}
            
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True, timeout=5)
            
            # Convert direction to xdotool button numbers
            scroll_buttons = {
                "down": "5",
                "up": "4",
                "left": "6",
                "right": "7"
            }
            
            if scroll_direction not in scroll_buttons:
                return {"error": f"Invalid scroll direction: {scroll_direction}. Use: up, down, left, right"}
            
            button = scroll_buttons[scroll_direction]
            
            # Perform scroll
            for _ in range(scroll_amount):
                subprocess.run(['xdotool', 'click', button], check=True, timeout=5)
                time.sleep(0.1)  # Small delay between scrolls
            
            return {"result": f"Scrolled {scroll_direction} {scroll_amount} times at {coordinate}"}
        except Exception as e:
            return {"error": f"Scroll failed: {str(e)}"}
    
    def left_click_drag(self, startCoordinate: List[int], endCoordinate: List[int]) -> Dict[str, Any]:
        """Click and drag from start to end coordinates"""
        try:
            x1, y1 = startCoordinate
            x2, y2 = endCoordinate
            
            if not self._validate_coordinates(x1, y1) or not self._validate_coordinates(x2, y2):
                return {"error": "One or both coordinates out of bounds"}
            
            # Move to start position
            subprocess.run(['xdotool', 'mousemove', str(x1), str(y1)], check=True, timeout=5)
            # Press and hold left mouse button
            subprocess.run(['xdotool', 'mousedown', '1'], check=True, timeout=5)
            # Move to end position
            subprocess.run(['xdotool', 'mousemove', str(x2), str(y2)], check=True, timeout=5)
            # Release mouse button
            subprocess.run(['xdotool', 'mouseup', '1'], check=True, timeout=5)
            
            return {"result": f"Dragged from {startCoordinate} to {endCoordinate}"}
        except Exception as e:
            return {"error": f"Drag failed: {str(e)}"}
    
    def mouse_move(self, coordinate: List[int]) -> Dict[str, Any]:
        """Move mouse to coordinates"""
        try:
            x, y = coordinate
            if not self._validate_coordinates(x, y):
                return {"error": f"Coordinates {coordinate} out of bounds"}
            
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True, timeout=5)
            return {"result": f"Moved mouse to {coordinate}"}
        except Exception as e:
            return {"error": f"Mouse move failed: {str(e)}"}
    
    def left_mouse_down(self, coordinate: List[int]) -> Dict[str, Any]:
        """Press and hold left mouse button at coordinates"""
        try:
            x, y = coordinate
            if not self._validate_coordinates(x, y):
                return {"error": f"Coordinates {coordinate} out of bounds"}
            
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True, timeout=5)
            subprocess.run(['xdotool', 'mousedown', '1'], check=True, timeout=5)
            
            return {"result": f"Left mouse down at {coordinate}"}
        except Exception as e:
            return {"error": f"Left mouse down failed: {str(e)}"}
    
    def left_mouse_up(self, coordinate: List[int]) -> Dict[str, Any]:
        """Release left mouse button at coordinates"""
        try:
            x, y = coordinate
            if not self._validate_coordinates(x, y):
                return {"error": f"Coordinates {coordinate} out of bounds"}
            
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True, timeout=5)
            subprocess.run(['xdotool', 'mouseup', '1'], check=True, timeout=5)
            
            return {"result": f"Left mouse up at {coordinate}"}
        except Exception as e:
            return {"error": f"Left mouse up failed: {str(e)}"}
    
    def triple_click(self, coordinate: List[int]) -> Dict[str, Any]:
        """Perform triple click at coordinates"""
        try:
            x, y = coordinate
            if not self._validate_coordinates(x, y):
                return {"error": f"Coordinates {coordinate} out of bounds"}
            
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True, timeout=5)
            subprocess.run(['xdotool', 'click', '--repeat', '3', '1'], check=True, timeout=5)
            
            return {"result": f"Triple clicked at {coordinate}"}
        except Exception as e:
            return {"error": f"Triple click failed: {str(e)}"}
    
    def hold_key(self, key: str) -> Dict[str, Any]:
        """Hold a key (use with caution - remember to release)"""
        try:
            subprocess.run(['xdotool', 'keydown', key], check=True, timeout=5)
            return {"result": f"Holding key: {key}"}
        except Exception as e:
            return {"error": f"Hold key failed: {str(e)}"}
    
    def wait(self, seconds: float = 1.0) -> Dict[str, Any]:
        """Wait for specified seconds"""
        try:
            time.sleep(seconds)
            return {"result": f"Waited {seconds} seconds"}
        except Exception as e:
            return {"error": f"Wait failed: {str(e)}"}
    
    def _validate_coordinates(self, x: int, y: int) -> bool:
        """Validate coordinates are within display bounds"""
        return 0 <= x < self.display_width and 0 <= y < self.display_height
    
    def execute_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a computer use action based on Claude's request
        Supports all actions from computer_20250124 tool version
        """
        action = action_data.get("action")
        
        if not action:
            return {"error": "No action specified"}
        
        logger.info(f"Executing action: {action}")
        
        # Basic actions (all versions)
        if action == "screenshot":
            return self.screenshot()
        elif action == "left_click":
            return self.left_click(action_data["coordinate"])
        elif action == "type":
            return self.type(action_data["text"])
        elif action == "key":
            return self.key(action_data["key"])
        elif action == "mouse_move":
            return self.mouse_move(action_data["coordinate"])
        
        # Enhanced actions (computer_20250124)
        elif action == "scroll":
            return self.scroll(
                action_data["coordinate"],
                action_data.get("scroll_direction", "down"),
                action_data.get("scroll_amount", 3)
            )
        elif action == "left_click_drag":
            return self.left_click_drag(
                action_data["startCoordinate"],
                action_data["endCoordinate"]
            )
        elif action == "right_click":
            return self.right_click(action_data["coordinate"])
        elif action == "middle_click":
            return self.middle_click(action_data["coordinate"])
        elif action == "double_click":
            return self.double_click(action_data["coordinate"])
        elif action == "triple_click":
            return self.triple_click(action_data["coordinate"])
        elif action == "left_mouse_down":
            return self.left_mouse_down(action_data["coordinate"])
        elif action == "left_mouse_up":
            return self.left_mouse_up(action_data["coordinate"])
        elif action == "hold_key":
            return self.hold_key(action_data["key"])
        elif action == "wait":
            return self.wait(action_data.get("seconds", 1.0))
        else:
            return {"error": f"Unknown action: {action}"}


class OfficialClaudeComputerClient:
    """
    Official Claude Computer Use client following Anthropic specifications
    Implements proper agent loop with computer_20250124 tool version
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")
        
        self.client = Anthropic(api_key=self.api_key)
        self.computer_tool = OfficialComputerUseTool()
        
        logger.info("Initialized Claude Computer Use client")
    
    def execute_computer_task(self, task_description: str, max_iterations: int = 10, 
                            thinking_budget: Optional[int] = None) -> Dict[str, Any]:
        """
        Execute a computer use task with official agent loop
        
        Args:
            task_description: The task for Claude to perform
            max_iterations: Maximum number of iterations to prevent runaway costs
            thinking_budget: Optional thinking tokens for Claude 3.7+
        
        Returns:
            Dict containing task results and conversation history
        """
        messages = [{
            "role": "user",
            "content": task_description
        }]
        
        logger.info(f"Starting computer use task: {task_description}")
        
        for iteration in range(max_iterations):
            logger.info(f"Iteration {iteration + 1}/{max_iterations}")
            
            try:
                # Prepare API call parameters
                api_params = {
                    "model": "claude-sonnet-4-20250514",  # Latest Claude 4 model
                    "max_tokens": 2000,
                    "tools": [{
                        "type": "computer_20250124",  # Latest tool version
                        "name": "computer",
                        "display_width_px": self.computer_tool.display_width,
                        "display_height_px": self.computer_tool.display_height,
                        "display_number": self.computer_tool.display_number,
                    }],
                    "messages": messages,
                    "betas": ["computer-use-2025-01-24"]  # Required beta flag
                }
                
                # Add thinking capability if specified (Claude 3.7+)
                if thinking_budget:
                    api_params["thinking"] = {
                        "type": "enabled",
                        "budget_tokens": thinking_budget
                    }
                
                # Call Claude API
                response = self.client.beta.messages.create(**api_params)
                
                # Add Claude's response to conversation
                messages.append({
                    "role": "assistant",
                    "content": response.content
                })
                
                # Process tool use requests
                tool_results = []
                has_text_response = False
                
                for content in response.content:
                    if content.type == "tool_use":
                        logger.info(f"Executing tool: {content.input.get('action', 'unknown')}")
                        
                        # Execute the computer action
                        result = self.computer_tool.execute_action(content.input)
                        
                        # Format result for Claude (following official specs)
                        tool_result = {
                            "type": "tool_result",
                            "tool_use_id": content.id,
                            "content": json.dumps(result)
                        }
                        
                        # Handle errors properly
                        if "error" in result:
                            tool_result["is_error"] = True
                        
                        tool_results.append(tool_result)
                        
                    elif content.type == "text":
                        logger.info(f"Claude response: {content.text}")
                        has_text_response = True
                
                # If no tools used, task complete
                if not tool_results:
                    logger.info("Task completed - no more tool use requested")
                    return {
                        "success": True,
                        "task_completed": True,
                        "iterations": iteration + 1,
                        "messages": messages,
                        "final_response": response.content[-1].text if has_text_response else "Task completed"
                    }
                
                # Continue conversation with tool results
                messages.append({
                    "role": "user",
                    "content": tool_results
                })
                
            except Exception as e:
                logger.error(f"Error in iteration {iteration + 1}: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "task_completed": False,
                    "iterations": iteration + 1,
                    "messages": messages
                }
        
        # Max iterations reached
        logger.warning(f"Max iterations ({max_iterations}) reached")
        return {
            "success": False,
            "error": f"Max iterations ({max_iterations}) reached",
            "task_completed": False,
            "iterations": max_iterations,
            "messages": messages
        }


# Main execution function for integration with existing Ron AI backend
async def execute_official_computer_use(tool_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function for executing computer use tasks in Ron AI backend
    Compatible with existing agent structure
    """
    try:
        task = tool_input.get("task", "")
        max_iterations = tool_input.get("max_iterations", 10)
        thinking_budget = tool_input.get("thinking_budget")
        
        if not task:
            return {
                "success": False,
                "error": "No task provided",
                "task_completed": False
            }
        
        # Initialize client
        client = OfficialClaudeComputerClient()
        
        # Execute task
        result = client.execute_computer_task(
            task_description=task,
            max_iterations=max_iterations,
            thinking_budget=thinking_budget
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Computer use execution failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "task_completed": False
        }


if __name__ == "__main__":
    # Test the implementation
    import asyncio
    
    async def test_computer_use():
        """Test the official computer use implementation"""
        test_input = {
            "task": "Take a screenshot and tell me what you see on the desktop",
            "max_iterations": 5
        }
        
        result = await execute_official_computer_use(test_input)
        print(json.dumps(result, indent=2))
    
    asyncio.run(test_computer_use())
