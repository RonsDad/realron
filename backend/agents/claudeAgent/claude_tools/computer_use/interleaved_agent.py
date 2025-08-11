#!/usr/bin/env python3
"""
Claude Sonnet 4 Computer Use Agent with Interleaved Thinking
Enables sophisticated desktop automation with reasoning between tool calls
"""

import anthropic
import asyncio
import base64
import io
import json
import logging
import os
import subprocess
from typing import Dict, List, Any, Optional
from datetime import datetime
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

class InterleavedThinkingAgent:
    """Claude Sonnet 4 agent with computer use and interleaved thinking capabilities"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY must be set")
            
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"
        self.max_tokens = 16000
        self.thinking_budget = 10000
        self.display_width = 1024
        self.display_height = 768
        self.display_number = os.getenv("DISPLAY", ":1").replace(":", "")
        
        # Initialize tools
        self.tools = [
            {
                "type": "computer_20250124",
                "name": "computer",
                "display_width_px": self.display_width,
                "display_height_px": self.display_height,
                "display_number": int(self.display_number),
            },
            {
                "type": "text_editor_20250124",
                "name": "str_replace_editor"
            },
            {
                "type": "bash_20250124",
                "name": "bash"
            }
        ]
        
    async def interleaved_thinking_loop(
        self,
        messages: List[Dict[str, Any]],
        max_iterations: int = 10
    ) -> List[Dict[str, Any]]:
        """Execute agent loop with interleaved thinking between tool calls"""
        
        iterations = 0
        while iterations < max_iterations:
            iterations += 1
            logger.info(f"Iteration {iterations}/{max_iterations}")
            
            try:
                # Create message with interleaved thinking enabled
                response = self.client.beta.messages.create(
                    model=self.model,
                    max_tokens=self.max_tokens,
                    thinking={
                        "type": "enabled",
                        "budget_tokens": self.thinking_budget
                    },
                    tools=self.tools,
                    betas=["interleaved-thinking-2025-05-14"],
                    messages=messages
                )
                
                # Process response blocks
                thinking_blocks = []
                tool_use_blocks = []
                text_blocks = []
                
                for block in response.content:
                    if hasattr(block, 'type'):
                        if block.type == "thinking":
                            thinking_blocks.append(block)
                            logger.info(f"💭 Claude's thinking: {block.thinking[:200]}...")
                        elif block.type == "tool_use":
                            tool_use_blocks.append(block)
                            logger.info(f"🔧 Tool use: {block.name}")
                        elif block.type == "text":
                            text_blocks.append(block)
                            logger.info(f"💬 Claude says: {block.text[:200]}...")
                
                # Add assistant response to conversation
                messages.append({
                    "role": "assistant", 
                    "content": response.content
                })
                
                # If no tools used, conversation is complete
                if not tool_use_blocks:
                    logger.info("No tool use required, conversation complete")
                    return messages
                
                # Execute tools and add results
                tool_results = []
                for tool_block in tool_use_blocks:
                    result = await self.execute_tool(tool_block)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_block.id,
                        "content": result
                    })
                
                messages.append({
                    "role": "user", 
                    "content": tool_results
                })
                
            except Exception as e:
                logger.error(f"Error in iteration {iterations}: {str(e)}")
                raise
        
        logger.warning(f"Reached max iterations ({max_iterations})")
        return messages
    
    async def execute_tool(self, tool_block: Any) -> str:
        """Execute a tool and return the result"""
        
        logger.info(f"Executing tool: {tool_block.name} with input: {json.dumps(tool_block.input)[:200]}...")
        
        if tool_block.name == "computer":
            return await self.execute_computer_action(tool_block.input)
        elif tool_block.name == "bash":
            return await self.execute_bash_command(tool_block.input)
        elif tool_block.name == "str_replace_editor":
            return await self.execute_text_editor(tool_block.input)
        else:
            return f"Unknown tool: {tool_block.name}"
    
    async def execute_computer_action(self, action_input: Dict[str, Any]) -> str:
        """Execute computer use action"""
        
        action = action_input.get("action")
        
        if action == "screenshot":
            return await self.take_screenshot()
        elif action == "left_click":
            coord = action_input.get("coordinate", [0, 0])
            return await self.click(coord[0], coord[1])
        elif action == "right_click":
            coord = action_input.get("coordinate", [0, 0])
            return await self.right_click(coord[0], coord[1])
        elif action == "double_click":
            coord = action_input.get("coordinate", [0, 0])
            return await self.double_click(coord[0], coord[1])
        elif action == "type":
            text = action_input.get("text", "")
            return await self.type_text(text)
        elif action == "key":
            key = action_input.get("key", "")
            return await self.press_key(key)
        elif action == "drag":
            start = action_input.get("start_coordinate", [0, 0])
            end = action_input.get("end_coordinate", [0, 0])
            return await self.drag(start[0], start[1], end[0], end[1])
        elif action == "scroll":
            coord = action_input.get("coordinate", [0, 0])
            direction = action_input.get("direction", "down")
            clicks = action_input.get("clicks", 3)
            return await self.scroll(coord[0], coord[1], direction, clicks)
        else:
            return f"Unknown computer action: {action}"
    
    async def take_screenshot(self) -> str:
        """Take a screenshot and return base64 encoded image"""
        try:
            # Use xwd to capture screenshot
            cmd = f"DISPLAY=:{self.display_number} xwd -root -silent | convert xwd:- png:-"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            
            if result.returncode != 0:
                logger.error(f"Screenshot failed: {result.stderr.decode()}")
                return "Failed to take screenshot"
            
            # Convert to base64
            img_base64 = base64.b64encode(result.stdout).decode()
            
            # Create image data URL
            img_data = f"data:image/png;base64,{img_base64}"
            
            logger.info("Screenshot captured successfully")
            return img_data
            
        except Exception as e:
            logger.error(f"Screenshot error: {str(e)}")
            return f"Screenshot error: {str(e)}"
    
    async def click(self, x: int, y: int) -> str:
        """Perform left click at coordinates"""
        try:
            cmd = f"DISPLAY=:{self.display_number} xdotool mousemove {x} {y} click 1"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            
            if result.returncode == 0:
                return f"Clicked at ({x}, {y})"
            else:
                return f"Click failed: {result.stderr.decode()}"
                
        except Exception as e:
            return f"Click error: {str(e)}"
    
    async def right_click(self, x: int, y: int) -> str:
        """Perform right click at coordinates"""
        try:
            cmd = f"DISPLAY=:{self.display_number} xdotool mousemove {x} {y} click 3"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            
            if result.returncode == 0:
                return f"Right-clicked at ({x}, {y})"
            else:
                return f"Right-click failed: {result.stderr.decode()}"
                
        except Exception as e:
            return f"Right-click error: {str(e)}"
    
    async def double_click(self, x: int, y: int) -> str:
        """Perform double click at coordinates"""
        try:
            cmd = f"DISPLAY=:{self.display_number} xdotool mousemove {x} {y} click --repeat 2 --delay 100 1"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            
            if result.returncode == 0:
                return f"Double-clicked at ({x}, {y})"
            else:
                return f"Double-click failed: {result.stderr.decode()}"
                
        except Exception as e:
            return f"Double-click error: {str(e)}"
    
    async def type_text(self, text: str) -> str:
        """Type text using keyboard"""
        try:
            # Escape special characters for xdotool
            escaped_text = text.replace('"', '\\"').replace("'", "\\'")
            cmd = f'DISPLAY=:{self.display_number} xdotool type "{escaped_text}"'
            result = subprocess.run(cmd, shell=True, capture_output=True)
            
            if result.returncode == 0:
                return f"Typed: {text}"
            else:
                return f"Type failed: {result.stderr.decode()}"
                
        except Exception as e:
            return f"Type error: {str(e)}"
    
    async def press_key(self, key: str) -> str:
        """Press a specific key"""
        try:
            # Map common key names
            key_map = {
                "enter": "Return",
                "tab": "Tab",
                "escape": "Escape",
                "backspace": "BackSpace",
                "delete": "Delete",
                "up": "Up",
                "down": "Down",
                "left": "Left",
                "right": "Right",
                "home": "Home",
                "end": "End",
                "pageup": "Page_Up",
                "pagedown": "Page_Down"
            }
            
            xdo_key = key_map.get(key.lower(), key)
            cmd = f"DISPLAY=:{self.display_number} xdotool key {xdo_key}"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            
            if result.returncode == 0:
                return f"Pressed key: {key}"
            else:
                return f"Key press failed: {result.stderr.decode()}"
                
        except Exception as e:
            return f"Key press error: {str(e)}"
    
    async def drag(self, start_x: int, start_y: int, end_x: int, end_y: int) -> str:
        """Perform drag operation"""
        try:
            cmd = f"DISPLAY=:{self.display_number} xdotool mousemove {start_x} {start_y} mousedown 1 mousemove {end_x} {end_y} mouseup 1"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            
            if result.returncode == 0:
                return f"Dragged from ({start_x}, {start_y}) to ({end_x}, {end_y})"
            else:
                return f"Drag failed: {result.stderr.decode()}"
                
        except Exception as e:
            return f"Drag error: {str(e)}"
    
    async def scroll(self, x: int, y: int, direction: str, clicks: int) -> str:
        """Perform scroll operation"""
        try:
            button = "5" if direction.lower() == "down" else "4"
            cmd = f"DISPLAY=:{self.display_number} xdotool mousemove {x} {y} click --repeat {clicks} {button}"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            
            if result.returncode == 0:
                return f"Scrolled {direction} {clicks} clicks at ({x}, {y})"
            else:
                return f"Scroll failed: {result.stderr.decode()}"
                
        except Exception as e:
            return f"Scroll error: {str(e)}"
    
    async def execute_bash_command(self, command_input: Dict[str, Any]) -> str:
        """Execute bash command"""
        
        command = command_input.get("command", "")
        timeout = command_input.get("timeout", 30)
        
        try:
            # Set display for GUI commands
            env = os.environ.copy()
            env["DISPLAY"] = f":{self.display_number}"
            
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env
            )
            
            output = result.stdout
            if result.stderr:
                output += f"\nSTDERR:\n{result.stderr}"
            
            if result.returncode != 0:
                output += f"\nReturn code: {result.returncode}"
            
            return output[:10000]  # Limit output length
            
        except subprocess.TimeoutExpired:
            return f"Command timed out after {timeout} seconds"
        except Exception as e:
            return f"Bash error: {str(e)}"
    
    async def execute_text_editor(self, editor_input: Dict[str, Any]) -> str:
        """Execute text editor operations"""
        
        command = editor_input.get("command", "view")
        path = editor_input.get("path", "")
        
        if command == "view":
            return await self.view_file(path)
        elif command == "str_replace":
            old_str = editor_input.get("old_str", "")
            new_str = editor_input.get("new_str", "")
            return await self.replace_in_file(path, old_str, new_str)
        elif command == "create":
            content = editor_input.get("file_text", "")
            return await self.create_file(path, content)
        else:
            return f"Unknown editor command: {command}"
    
    async def view_file(self, path: str) -> str:
        """View file contents"""
        try:
            with open(path, 'r') as f:
                content = f.read()
            return f"File: {path}\n\n{content[:10000]}"
        except Exception as e:
            return f"Error viewing file: {str(e)}"
    
    async def replace_in_file(self, path: str, old_str: str, new_str: str) -> str:
        """Replace string in file"""
        try:
            with open(path, 'r') as f:
                content = f.read()
            
            if old_str not in content:
                return f"String not found in {path}"
            
            new_content = content.replace(old_str, new_str)
            
            with open(path, 'w') as f:
                f.write(new_content)
            
            return f"Replaced in {path}"
            
        except Exception as e:
            return f"Error replacing in file: {str(e)}"
    
    async def create_file(self, path: str, content: str) -> str:
        """Create new file"""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w') as f:
                f.write(content)
            return f"Created file: {path}"
        except Exception as e:
            return f"Error creating file: {str(e)}"


async def main():
    """Example usage of interleaved thinking agent"""
    
    agent = InterleavedThinkingAgent()
    
    # Example: Use Claude Code CLI with computer use
    messages = [{
        "role": "user",
        "content": """Take a screenshot, then open a terminal and run 'claude --help' 
        to see the Claude Code CLI options. After that, create a simple JavaScript 
        project and use Claude to analyze it. Take screenshots of the results."""
    }]
    
    try:
        result = await agent.interleaved_thinking_loop(messages)
        logger.info("Task completed successfully")
        
        # Save conversation
        with open("interleaved_conversation.json", "w") as f:
            json.dump(result, f, indent=2, default=str)
            
    except Exception as e:
        logger.error(f"Task failed: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())