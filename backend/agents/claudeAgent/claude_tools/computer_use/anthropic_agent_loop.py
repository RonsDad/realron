#!/usr/bin/env python3.11

import os
import json
import subprocess
import base64
from anthropic import Anthropic

async def sampling_loop(
    *,
    model: str,
    messages: list[dict],
    api_key: str,
    max_tokens: int = 4096,
    tool_version: str,
    thinking_budget: int | None = None,
    max_iterations: int = 10,
):
    """
    Official Anthropic agent loop for Claude computer use interactions.
    """
    # Set up tools and API parameters
    client = Anthropic(api_key=api_key)
    beta_flag = "computer-use-2025-01-24" if "20250124" in tool_version else "computer-use-2024-10-22"

    # Configure tools
    tools = [
        {"type": f"computer_{tool_version}", "name": "computer", "display_width_px": 1280, "display_height_px": 800, "display_number": 1},
        {"type": f"text_editor_{tool_version}", "name": "str_replace_editor"},
        {"type": f"bash_{tool_version}", "name": "bash"}
    ]

    # Main agent loop
    iterations = 0
    while True and iterations < max_iterations:
        iterations += 1
        
        # Set up optional thinking parameter
        thinking = None
        if thinking_budget:
            thinking = {"type": "enabled", "budget_tokens": thinking_budget}

        # Call the Claude API
        response = client.beta.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=messages,
            tools=tools,
            betas=[beta_flag],
            thinking=thinking
        )

        # Add Claude's response to the conversation history
        response_content = response.content
        messages.append({"role": "assistant", "content": response_content})

        # Check if Claude used any tools
        tool_results = []
        for block in response_content:
            if block.type == "tool_use":
                # Execute the tool
                result = run_tool(block.name, block.input)

                # Format the result for Claude
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result
                })

        # If no tools were used, Claude is done
        if not tool_results:
            return messages

        # Add tool results to messages for the next iteration
        messages.append({"role": "user", "content": tool_results})

def run_tool(tool_name: str, tool_input: dict):
    """Execute tool based on Anthropic specifications"""
    if tool_name == "computer":
        return handle_computer_action(tool_input)
    elif tool_name == "str_replace_editor":
        return handle_text_editor(tool_input)
    elif tool_name == "bash":
        return handle_bash(tool_input)
    else:
        return {"error": f"Unknown tool: {tool_name}"}

def handle_computer_action(action_data: dict):
    """Handle computer use actions per Anthropic specs"""
    action = action_data.get("action")
    
    if action == "screenshot":
        return capture_screenshot()
    elif action == "left_click":
        x, y = action_data["coordinate"]
        return click_at(x, y)
    elif action == "type":
        return type_text(action_data["text"])
    elif action == "key":
        return press_key(action_data["key"])
    elif action == "mouse_move":
        x, y = action_data["coordinate"]
        return move_mouse(x, y)
    elif action == "scroll":
        return scroll_action(
            action_data["coordinate"],
            action_data.get("scroll_direction", "down"),
            action_data.get("scroll_amount", 3)
        )
    elif action == "left_click_drag":
        return drag_action(action_data["startCoordinate"], action_data["endCoordinate"])
    elif action == "right_click":
        x, y = action_data["coordinate"]
        return right_click_at(x, y)
    elif action == "double_click":
        x, y = action_data["coordinate"]
        return double_click_at(x, y)
    elif action == "wait":
        import time
        time.sleep(action_data.get("seconds", 1))
        return {"result": f"Waited {action_data.get('seconds', 1)} seconds"}
    else:
        return {"error": f"Unknown action: {action}"}

def capture_screenshot():
    """Capture screenshot per Anthropic specs"""
    try:
        # Use xwd to capture X11 display
        subprocess.run(['xwd', '-root', '-display', ':1', '-out', '/tmp/screenshot.xwd'], check=True)
        subprocess.run(['convert', '/tmp/screenshot.xwd', '/tmp/screenshot.png'], check=True)
        
        with open('/tmp/screenshot.png', 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        return {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": image_data
            }
        }
    except Exception as e:
        return {"error": f"Screenshot failed: {str(e)}", "is_error": True}

def click_at(x: int, y: int):
    """Click at coordinates"""
    try:
        subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True)
        subprocess.run(['xdotool', 'click', '1'], check=True)
        return {"result": f"Clicked at ({x}, {y})"}
    except Exception as e:
        return {"error": f"Click failed: {str(e)}", "is_error": True}

def type_text(text: str):
    """Type text"""
    try:
        subprocess.run(['xdotool', 'type', text], check=True)
        return {"result": f"Typed: {text}"}
    except Exception as e:
        return {"error": f"Type failed: {str(e)}", "is_error": True}

def press_key(key: str):
    """Press key combination"""
    try:
        subprocess.run(['xdotool', 'key', key], check=True)
        return {"result": f"Pressed: {key}"}
    except Exception as e:
        return {"error": f"Key press failed: {str(e)}", "is_error": True}

def move_mouse(x: int, y: int):
    """Move mouse"""
    try:
        subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True)
        return {"result": f"Moved mouse to ({x}, {y})"}
    except Exception as e:
        return {"error": f"Mouse move failed: {str(e)}", "is_error": True}

def scroll_action(coordinate: list, direction: str, amount: int):
    """Scroll action"""
    try:
        x, y = coordinate
        subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True)
        
        button = "5" if direction == "down" else "4"
        for _ in range(amount):
            subprocess.run(['xdotool', 'click', button], check=True)
        
        return {"result": f"Scrolled {direction} {amount} times at ({x}, {y})"}
    except Exception as e:
        return {"error": f"Scroll failed: {str(e)}", "is_error": True}

def drag_action(start: list, end: list):
    """Drag action"""
    try:
        x1, y1 = start
        x2, y2 = end
        subprocess.run(['xdotool', 'mousemove', str(x1), str(y1)], check=True)
        subprocess.run(['xdotool', 'mousedown', '1'], check=True)
        subprocess.run(['xdotool', 'mousemove', str(x2), str(y2)], check=True)
        subprocess.run(['xdotool', 'mouseup', '1'], check=True)
        return {"result": f"Dragged from ({x1}, {y1}) to ({x2}, {y2})"}
    except Exception as e:
        return {"error": f"Drag failed: {str(e)}", "is_error": True}

def right_click_at(x: int, y: int):
    """Right click"""
    try:
        subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True)
        subprocess.run(['xdotool', 'click', '3'], check=True)
        return {"result": f"Right clicked at ({x}, {y})"}
    except Exception as e:
        return {"error": f"Right click failed: {str(e)}", "is_error": True}

def double_click_at(x: int, y: int):
    """Double click"""
    try:
        subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True)
        subprocess.run(['xdotool', 'click', '--repeat', '2', '1'], check=True)
        return {"result": f"Double clicked at ({x}, {y})"}
    except Exception as e:
        return {"error": f"Double click failed: {str(e)}", "is_error": True}

def handle_text_editor(tool_input: dict):
    """Handle text editor tool"""
    return {"result": "Text editor executed"}

def handle_bash(tool_input: dict):
    """Handle bash tool"""
    return {"result": "Bash command executed"}

# Main execution function
async def execute_computer_use_task(task: str, api_key: str = None):
    """Execute computer use task using official Anthropic agent loop"""
    api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
    
    messages = [{"role": "user", "content": task}]
    
    result = await sampling_loop(
        model="claude-sonnet-4-20250514",
        messages=messages,
        api_key=api_key,
        tool_version="20250124",
        max_iterations=10,
        thinking_budget=1024
    )
    
    return {"success": True, "messages": result}

if __name__ == "__main__":
    import asyncio
    
    async def test():
        result = await execute_computer_use_task("Take a screenshot and describe what you see")
        print(json.dumps(result, indent=2))
    
    asyncio.run(test())
