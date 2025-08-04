#!/usr/bin/env python3
"""
Claude Computer Use Agent
Implements Anthropic's computer use capability with full desktop automation
"""

import os
import asyncio
import base64
import json
import subprocess
import time
from typing import Dict, List, Any, Optional
from PIL import Image, ImageGrab
import pyautogui
from pynput import mouse, keyboard
import anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ComputerUseAgent:
    def __init__(self, api_key: str, display_width: int = 1024, display_height: int = 768):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.display_width = display_width
        self.display_height = display_height
        self.display_number = 1
        
        # Configure pyautogui
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.1
        
        # Tool version - use version compatible with Sonnet 4
        self.tool_version = "20241022"
        self.beta_flag = "computer-use-2024-10-22"
        
        # Use Claude Sonnet 4 - latest model with computer use support
        self.model = "claude-3-5-sonnet-20241022"
        
    def take_screenshot(self) -> str:
        """Take screenshot and return base64 encoded image"""
        try:
            # Use scrot for X11 screenshot
            screenshot_path = "/tmp/screenshot.png"
            subprocess.run([
                "scrot", "-z", screenshot_path
            ], check=True, env={"DISPLAY": ":1"})
            
            # Read and encode image
            with open(screenshot_path, "rb") as img_file:
                img_data = img_file.read()
                return base64.b64encode(img_data).decode()
        except Exception as e:
            print(f"Screenshot error: {e}")
            return ""
    
    def execute_computer_action(self, action: str, **kwargs) -> Dict[str, Any]:
        """Execute computer use tool actions"""
        try:
            if action == "screenshot":
                screenshot_b64 = self.take_screenshot()
                return {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": screenshot_b64
                    }
                }
            
            elif action == "left_click":
                coordinate = kwargs.get("coordinate", [0, 0])
                pyautogui.click(coordinate[0], coordinate[1])
                return {"result": f"Left clicked at {coordinate}"}
            
            elif action == "right_click":
                coordinate = kwargs.get("coordinate", [0, 0])
                pyautogui.rightClick(coordinate[0], coordinate[1])
                return {"result": f"Right clicked at {coordinate}"}
            
            elif action == "double_click":
                coordinate = kwargs.get("coordinate", [0, 0])
                pyautogui.doubleClick(coordinate[0], coordinate[1])
                return {"result": f"Double clicked at {coordinate}"}
            
            elif action == "left_click_drag":
                start = kwargs.get("startCoordinate", [0, 0])
                end = kwargs.get("endCoordinate", [0, 0])
                pyautogui.drag(end[0] - start[0], end[1] - start[1], 
                              duration=0.5, button='left')
                return {"result": f"Dragged from {start} to {end}"}
            
            elif action == "type":
                text = kwargs.get("text", "")
                pyautogui.typewrite(text, interval=0.05)
                return {"result": f"Typed: {text}"}
            
            elif action == "key":
                key = kwargs.get("key", "")
                # Handle key combinations
                if "+" in key:
                    keys = key.split("+")
                    pyautogui.hotkey(*keys)
                else:
                    pyautogui.press(key)
                return {"result": f"Pressed key: {key}"}
            
            elif action == "scroll":
                coordinate = kwargs.get("coordinate", [500, 400])
                direction = kwargs.get("scroll_direction", "down")
                amount = kwargs.get("scroll_amount", 3)
                
                pyautogui.moveTo(coordinate[0], coordinate[1])
                if direction == "down":
                    pyautogui.scroll(-amount)
                else:
                    pyautogui.scroll(amount)
                return {"result": f"Scrolled {direction} by {amount}"}
            
            elif action == "mouse_move":
                coordinate = kwargs.get("coordinate", [0, 0])
                pyautogui.moveTo(coordinate[0], coordinate[1])
                return {"result": f"Moved mouse to {coordinate}"}
            
            elif action == "wait":
                duration = kwargs.get("duration", 1)
                time.sleep(duration)
                return {"result": f"Waited {duration} seconds"}
            
            else:
                return {"error": f"Unknown action: {action}"}
                
        except Exception as e:
            return {"error": f"Action failed: {str(e)}"}
    
    def execute_bash_command(self, command: str) -> Dict[str, Any]:
        """Execute bash command"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30,
                env={"DISPLAY": ":1", **os.environ}
            )
            
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"error": "Command timed out"}
        except Exception as e:
            return {"error": f"Command failed: {str(e)}"}
    
    def execute_text_editor_action(self, action: str, **kwargs) -> Dict[str, Any]:
        """Execute text editor actions"""
        try:
            if action == "str_replace_editor":
                command = kwargs.get("command", "")
                path = kwargs.get("path", "")
                
                if command == "view":
                    with open(path, 'r') as f:
                        content = f.read()
                    return {"content": content}
                
                elif command == "create":
                    file_text = kwargs.get("file_text", "")
                    with open(path, 'w') as f:
                        f.write(file_text)
                    return {"result": f"Created file: {path}"}
                
                elif command == "str_replace":
                    old_str = kwargs.get("old_str", "")
                    new_str = kwargs.get("new_str", "")
                    
                    with open(path, 'r') as f:
                        content = f.read()
                    
                    if old_str in content:
                        content = content.replace(old_str, new_str)
                        with open(path, 'w') as f:
                            f.write(content)
                        return {"result": f"Replaced text in {path}"}
                    else:
                        return {"error": "Text not found"}
                
            return {"error": f"Unknown editor action: {action}"}
            
        except Exception as e:
            return {"error": f"Editor action failed: {str(e)}"}
    
    async def sampling_loop(
        self,
        messages: List[Dict],
        max_tokens: int = 4096,
        max_iterations: int = 10
    ) -> List[Dict]:
        """Main agent loop for processing messages with tool use"""
        
        tools = [
            {
                "type": f"computer_{self.tool_version}",
                "name": "computer",
                "display_width_px": self.display_width,
                "display_height_px": self.display_height,
                "display_number": self.display_number,
            },
            {
                "type": f"text_editor_{self.tool_version}",
                "name": "str_replace_editor"
            },
            {
                "type": f"bash_{self.tool_version}",
                "name": "bash"
            }
        ]
        
        iterations = 0
        while iterations < max_iterations:
            iterations += 1
            print(f"🔄 Iteration {iterations}")
            
            try:
                response = self.client.beta.messages.create(
                    model=self.model,  # Use Claude Sonnet 4
                    max_tokens=max_tokens,
                    messages=messages,
                    tools=tools,
                    betas=[self.beta_flag]
                )
                
                response_content = response.content
                messages.append({"role": "assistant", "content": response_content})
                
                # Process tool use requests
                tool_results = []
                for block in response_content:
                    if hasattr(block, 'type') and block.type == "tool_use":
                        tool_name = block.name
                        tool_input = block.input
                        
                        print(f"🔧 Executing tool: {tool_name}")
                        print(f"📝 Input: {tool_input}")
                        
                        if tool_name == "computer":
                            result = self.execute_computer_action(**tool_input)
                        elif tool_name == "bash":
                            result = self.execute_bash_command(tool_input.get("command", ""))
                        elif tool_name == "str_replace_editor":
                            result = self.execute_text_editor_action(**tool_input)
                        else:
                            result = {"error": f"Unknown tool: {tool_name}"}
                        
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result) if isinstance(result, dict) else str(result)
                        })
                
                if not tool_results:
                    print("✅ No more tools to execute")
                    break
                
                messages.append({"role": "user", "content": tool_results})
                
            except Exception as e:
                print(f"❌ Error in sampling loop: {e}")
                break
        
        return messages

async def main():
    """Main function to run the Claude Computer Use Agent"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        print("❌ Please set ANTHROPIC_API_KEY in .env file")
        return
    
    agent = ComputerUseAgent(api_key)
    
    print("🤖 Claude Computer Use Agent Started")
    print("💻 Available commands:")
    print("  - screenshot: Take a screenshot")
    print("  - click: Click at coordinates")
    print("  - type: Type text")
    print("  - key: Press keys")
    print("  - bash: Execute bash commands")
    print("  - quit: Exit agent")
    
    while True:
        try:
            user_input = input("\n🎯 Enter your request (or 'quit' to exit): ")
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                break
            
            messages = [{"role": "user", "content": user_input}]
            
            print("🚀 Processing request...")
            result_messages = await agent.sampling_loop(messages)
            
            # Print final response
            if result_messages:
                final_response = result_messages[-2]  # Assistant's last response
                if final_response["role"] == "assistant":
                    for block in final_response["content"]:
                        if hasattr(block, 'text'):
                            print(f"🤖 Claude: {block.text}")
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
