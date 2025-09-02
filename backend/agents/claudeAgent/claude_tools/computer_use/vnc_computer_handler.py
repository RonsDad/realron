"""
VNC Computer Handler for Claude's native computer-use tool.
Provides VNC server connection and iframe-embeddable URL for visual display.
Executes Claude's computer actions on the VNC server.
"""

import base64
import logging
import os
import asyncio
import subprocess
from typing import Dict, Any, Optional
from pathlib import Path
import tempfile
import json

logger = logging.getLogger(__name__)

class VNCComputerHandler:
    """
    Handles Claude's native computer actions through VNC server connection.
    Provides VNC URL for iframe embedding in the frontend.
    """
    
    def __init__(self):
        # VNC Configuration from environment or defaults
        self.vnc_host = os.getenv('VNC_HOST', 'localhost')
        self.vnc_port = int(os.getenv('VNC_PORT', '5901'))
        self.vnc_password = os.getenv('VNC_PASSWORD', 'claude123')
        
        # NoVNC web port for iframe access
        self.novnc_port = int(os.getenv('NOVNC_PORT', '6080'))
        
        # Display configuration
        self.display = os.getenv('DISPLAY', ':1')
        self.display_width = 1280
        self.display_height = 800
        
        # Use the EXISTING browserless setup!
        self.browserless_url = os.getenv('BROWSERLESS_URL', 'https://browserless.io')
        self.browserless_token = os.getenv('BROWSERLESS_API_TOKEN', '')
        
        # EC2 SSH configuration (optional for remote VNC)
        self.ec2_host = os.getenv('COMPUTER_USE_EC2_HOST', '')
        self.ec2_user = os.getenv('COMPUTER_USE_EC2_USER', 'ubuntu')
        self.ec2_key_path = os.getenv('COMPUTER_USE_EC2_KEY_PATH', '')
        
        # Auto-detect SSH key if EC2 is configured
        if self.ec2_host and not self.ec2_key_path:
            ssh_dir = Path.home() / '.ssh'
            key_files = list(ssh_dir.glob('claude-computer-use-*.pem'))
            if key_files:
                self.ec2_key_path = str(key_files[0])
                logger.info(f"Using SSH key: {self.ec2_key_path}")
        
        # VNC session state
        self.vnc_session_active = False
        self.novnc_url = None
        
        logger.info(f"VNCComputerHandler initialized")
        logger.info(f"  VNC: {self.vnc_host}:{self.vnc_port}")
        logger.info(f"  NoVNC: port {self.novnc_port}")
        if self.ec2_host:
            logger.info(f"  EC2: {self.ec2_host}")
    
    async def initialize_session(self) -> Dict[str, Any]:
        """Initialize VNC session and start NoVNC web server for iframe access"""
        try:
            # If using EC2, ensure VNC is running there
            if self.ec2_host:
                await self._ensure_ec2_vnc()
                # Build NoVNC URL for EC2 (iframe-embeddable)
                self.novnc_url = f"http://{self.ec2_host}:{self.novnc_port}/vnc_lite.html?autoconnect=true&resize=scale"
            else:
                # Local VNC setup
                await self._ensure_local_vnc()
                self.novnc_url = f"http://{self.vnc_host}:{self.novnc_port}/vnc.html?host={self.vnc_host}&port={self.novnc_port}&autoconnect=true"
            
            self.vnc_session_active = True
            
            logger.info(f"VNC session initialized")
            logger.info(f"NoVNC URL for iframe: {self.novnc_url}")
            
            return {
                "success": True,
                "vnc_url": self.novnc_url,
                "display": {
                    "width": self.display_width,
                    "height": self.display_height
                },
                "message": "VNC session ready for iframe embedding"
            }
            
        except Exception as e:
            logger.error(f"Failed to initialize VNC session: {e}")
            return {"error": str(e)}
    
    async def _ensure_ec2_vnc(self):
        """Ensure VNC and NoVNC are running on EC2"""
        if not self.ec2_host:
            return
        
        # Check if VNC is running
        check_vnc_cmd = "pgrep -f 'x11vnc' || echo 'not running'"
        result = await self._run_ec2_command(check_vnc_cmd)
        
        if 'not running' in result.get('output', ''):
            # Start VNC server
            start_vnc_cmd = f"""
            # Start virtual display if not running
            if ! pgrep -f 'Xvfb :1'; then
                Xvfb :1 -screen 0 {self.display_width}x{self.display_height}x24 &
                sleep 2
            fi
            
            # Start window manager
            DISPLAY=:1 mutter --sm-disable --replace &
            
            # Start VNC server
            x11vnc -display :1 -forever -passwd {self.vnc_password} -rfbport {self.vnc_port} -shared &
            """
            await self._run_ec2_command(start_vnc_cmd)
            logger.info("Started VNC server on EC2")
        
        # Check if NoVNC is running
        check_novnc_cmd = "pgrep -f 'websockify' || echo 'not running'"
        result = await self._run_ec2_command(check_novnc_cmd)
        
        if 'not running' in result.get('output', ''):
            # Start NoVNC web server
            start_novnc_cmd = f"""
            # Install NoVNC if not present
            if [ ! -d /home/ubuntu/noVNC ]; then
                cd /home/ubuntu
                git clone https://github.com/novnc/noVNC.git
                cd noVNC
                git clone https://github.com/novnc/websockify.git utils/websockify
            fi
            
            # Start websockify for NoVNC
            cd /home/ubuntu/noVNC
            ./utils/novnc_proxy --vnc {self.vnc_host}:{self.vnc_port} --listen {self.novnc_port} &
            """
            await self._run_ec2_command(start_novnc_cmd)
            logger.info("Started NoVNC web server on EC2")
            
        # Wait for services to be ready
        await asyncio.sleep(2)
    
    async def _ensure_local_vnc(self):
        """Ensure local VNC and NoVNC are running"""
        # Check if Xvfb is running
        try:
            result = subprocess.run(['pgrep', '-f', f'Xvfb {self.display}'], capture_output=True)
            if result.returncode != 0:
                # Start Xvfb
                subprocess.Popen([
                    'Xvfb', self.display,
                    '-screen', '0', f'{self.display_width}x{self.display_height}x24',
                    '-ac', '-nolisten', 'tcp'
                ])
                await asyncio.sleep(1)
                logger.info(f"Started Xvfb on display {self.display}")
        except Exception as e:
            logger.warning(f"Could not start Xvfb: {e}")
        
        # Check if x11vnc is running
        try:
            result = subprocess.run(['pgrep', '-f', 'x11vnc'], capture_output=True)
            if result.returncode != 0:
                # Start x11vnc
                subprocess.Popen([
                    'x11vnc',
                    '-display', self.display,
                    '-forever',
                    '-passwd', self.vnc_password,
                    '-rfbport', str(self.vnc_port),
                    '-shared'
                ])
                await asyncio.sleep(1)
                logger.info(f"Started x11vnc on port {self.vnc_port}")
        except Exception as e:
            logger.warning(f"Could not start x11vnc: {e}")
        
        # Check if NoVNC websockify is running
        try:
            result = subprocess.run(['pgrep', '-f', 'websockify'], capture_output=True)
            if result.returncode != 0:
                # Start websockify for NoVNC
                novnc_path = Path('/usr/share/novnc') 
                if not novnc_path.exists():
                    novnc_path = Path.home() / 'noVNC'
                
                if novnc_path.exists():
                    subprocess.Popen([
                        'websockify',
                        '--web', str(novnc_path),
                        str(self.novnc_port),
                        f'{self.vnc_host}:{self.vnc_port}'
                    ])
                    await asyncio.sleep(1)
                    logger.info(f"Started NoVNC websockify on port {self.novnc_port}")
                else:
                    logger.warning("NoVNC not found. Install with: git clone https://github.com/novnc/noVNC.git")
        except Exception as e:
            logger.warning(f"Could not start websockify: {e}")
    
    async def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute computer action from Claude's native computer-use tool.
        Actions are performed on the VNC server display.
        """
        try:
            # Ensure VNC session exists
            if not self.vnc_session_active:
                init_result = await self.initialize_session()
                if "error" in init_result:
                    return init_result
            
            # Map Claude's computer actions to VNC operations
            if action == "screenshot":
                return await self.take_screenshot()
            
            elif action == "left_click":
                coordinate = params.get("coordinate", [0, 0])
                return await self.click(coordinate, button=1)
            
            elif action == "right_click":
                coordinate = params.get("coordinate", [0, 0])
                return await self.click(coordinate, button=3)
            
            elif action == "middle_click":
                coordinate = params.get("coordinate", [0, 0])
                return await self.click(coordinate, button=2)
            
            elif action == "double_click":
                coordinate = params.get("coordinate", [0, 0])
                return await self.double_click(coordinate)
            
            elif action == "type":
                text = params.get("text", "")
                return await self.type_text(text)
            
            elif action == "key":
                key = params.get("key", "")
                return await self.press_key(key)
            
            elif action == "drag":
                start = params.get("start_coordinate", [0, 0])
                end = params.get("end_coordinate", [0, 0])
                return await self.drag(start, end)
            
            elif action == "scroll":
                coordinate = params.get("coordinate", [640, 400])
                direction = params.get("direction", "down")
                amount = params.get("amount", 3)
                return await self.scroll(coordinate, direction, amount)
            
            elif action == "mouse_move":
                coordinate = params.get("coordinate", [0, 0])
                return await self.move_mouse(coordinate)
            
            elif action == "wait":
                duration = params.get("duration", 1000)
                await asyncio.sleep(duration / 1000)
                return {"success": True, "action": "wait", "duration": duration}
            
            else:
                logger.warning(f"Unknown computer action: {action}")
                return {"error": f"Unknown action: {action}"}
                
        except Exception as e:
            logger.error(f"Error executing action {action}: {e}")
            return {"error": str(e)}
    
    async def _run_ec2_command(self, command: str) -> Dict[str, Any]:
        """Execute command on EC2 instance via SSH"""
        if not self.ec2_host:
            return {"error": "EC2 not configured"}
        
        ssh_cmd = [
            'ssh',
            '-i', self.ec2_key_path,
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'UserKnownHostsFile=/dev/null',
            f'{self.ec2_user}@{self.ec2_host}',
            f'DISPLAY={self.display} {command}'
        ]
        
        try:
            result = await asyncio.create_subprocess_exec(
                *ssh_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()
            
            if result.returncode != 0:
                error_msg = stderr.decode('utf-8') if stderr else 'Command failed'
                return {"error": error_msg}
            
            return {"success": True, "output": stdout.decode('utf-8') if stdout else ''}
        except Exception as e:
            return {"error": str(e)}
    
    async def _run_local_command(self, command: str) -> Dict[str, Any]:
        """Execute command locally"""
        try:
            result = await asyncio.create_subprocess_shell(
                f'DISPLAY={self.display} {command}',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()
            
            if result.returncode != 0:
                error_msg = stderr.decode('utf-8') if stderr else 'Command failed'
                return {"error": error_msg}
            
            return {"success": True, "output": stdout.decode('utf-8') if stdout else ''}
        except Exception as e:
            return {"error": str(e)}
    
    async def _run_command(self, command: str) -> Dict[str, Any]:
        """Run command either locally or on EC2"""
        if self.ec2_host:
            return await self._run_ec2_command(command)
        else:
            return await self._run_local_command(command)
    
    async def take_screenshot(self) -> Dict[str, Any]:
        """Take screenshot and return in Claude's expected format"""
        try:
            temp_file = f'/tmp/screenshot_{os.getpid()}.png'
            
            # Take screenshot using scrot or import
            screenshot_cmd = f'scrot -z {temp_file} 2>/dev/null || import -window root {temp_file}'
            result = await self._run_command(screenshot_cmd)
            
            if 'error' in result:
                return result
            
            # If using EC2, transfer the file
            if self.ec2_host:
                scp_cmd = [
                    'scp',
                    '-i', self.ec2_key_path,
                    '-o', 'StrictHostKeyChecking=no',
                    f'{self.ec2_user}@{self.ec2_host}:{temp_file}',
                    temp_file
                ]
                
                scp_result = await asyncio.create_subprocess_exec(
                    *scp_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await scp_result.communicate()
            
            # Read and encode screenshot
            if Path(temp_file).exists():
                with open(temp_file, 'rb') as f:
                    image_data = base64.b64encode(f.read()).decode('utf-8')
                
                # Cleanup
                Path(temp_file).unlink(missing_ok=True)
                if self.ec2_host:
                    await self._run_command(f'rm -f {temp_file}')
                
                # Return in Claude's expected format
                return {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_data
                    }
                }
            else:
                return {"error": "Failed to capture screenshot"}
                
        except Exception as e:
            logger.error(f"Screenshot failed: {e}")
            return {"error": f"Screenshot failed: {e}"}
    
    async def click(self, coordinate: list, button: int = 1) -> Dict[str, Any]:
        """Click at coordinates (button: 1=left, 2=middle, 3=right)"""
        x, y = coordinate
        
        try:
            cmd = f'xdotool mousemove {x} {y} click {button}'
            result = await self._run_command(cmd)
            
            if 'error' in result:
                return result
            
            button_name = {1: "left", 2: "middle", 3: "right"}.get(button, "unknown")
            logger.info(f"Clicked {button_name} at ({x}, {y})")
            return {"success": True, "action": f"{button_name}_click", "coordinate": [x, y]}
            
        except Exception as e:
            return {"error": f"Click failed: {e}"}
    
    async def double_click(self, coordinate: list) -> Dict[str, Any]:
        """Double click at coordinates"""
        x, y = coordinate
        
        try:
            cmd = f'xdotool mousemove {x} {y} click --repeat 2 1'
            result = await self._run_command(cmd)
            
            if 'error' in result:
                return result
            
            return {"success": True, "action": "double_click", "coordinate": [x, y]}
            
        except Exception as e:
            return {"error": f"Double click failed: {e}"}
    
    async def type_text(self, text: str) -> Dict[str, Any]:
        """Type text"""
        try:
            # Escape special characters
            escaped = text.replace('"', '\\"').replace('$', '\\$').replace('`', '\\`')
            cmd = f'xdotool type "{escaped}"'
            result = await self._run_command(cmd)
            
            if 'error' in result:
                return result
            
            logger.info(f"Typed: {text[:50]}...")
            return {"success": True, "action": "type", "text": text}
            
        except Exception as e:
            return {"error": f"Type failed: {e}"}
    
    async def press_key(self, key: str) -> Dict[str, Any]:
        """Press a key or key combination"""
        try:
            # Map common key names
            key_map = {
                "Enter": "Return",
                "Backspace": "BackSpace",
                "Tab": "Tab",
                "Escape": "Escape",
                "Delete": "Delete",
                "Space": "space",
                "ArrowUp": "Up",
                "ArrowDown": "Down",
                "ArrowLeft": "Left",
                "ArrowRight": "Right",
                "cmd+": "super+",
                "Meta+": "super+"
            }
            
            # Replace common key names
            for old, new in key_map.items():
                key = key.replace(old, new)
            
            cmd = f'xdotool key {key}'
            result = await self._run_command(cmd)
            
            if 'error' in result:
                return result
            
            logger.info(f"Pressed key: {key}")
            return {"success": True, "action": "key", "key": key}
            
        except Exception as e:
            return {"error": f"Key press failed: {e}"}
    
    async def move_mouse(self, coordinate: list) -> Dict[str, Any]:
        """Move mouse to coordinates"""
        x, y = coordinate
        
        try:
            cmd = f'xdotool mousemove {x} {y}'
            result = await self._run_command(cmd)
            
            if 'error' in result:
                return result
            
            return {"success": True, "action": "mouse_move", "coordinate": [x, y]}
            
        except Exception as e:
            return {"error": f"Mouse move failed: {e}"}
    
    async def scroll(self, coordinate: list, direction: str, amount: int) -> Dict[str, Any]:
        """Scroll at location"""
        x, y = coordinate
        
        try:
            # Move mouse first
            await self.move_mouse(coordinate)
            
            # Scroll (button 4=up, 5=down)
            button = '4' if direction == 'up' else '5'
            
            for _ in range(amount):
                cmd = f'xdotool click {button}'
                await self._run_command(cmd)
                await asyncio.sleep(0.1)
            
            return {"success": True, "action": "scroll", "direction": direction, "amount": amount}
            
        except Exception as e:
            return {"error": f"Scroll failed: {e}"}
    
    async def drag(self, start_coordinate: list, end_coordinate: list) -> Dict[str, Any]:
        """Drag from start to end"""
        start_x, start_y = start_coordinate
        end_x, end_y = end_coordinate
        
        try:
            cmd = f'xdotool mousemove {start_x} {start_y} mousedown 1 mousemove {end_x} {end_y} mouseup 1'
            result = await self._run_command(cmd)
            
            if 'error' in result:
                return result
            
            return {
                "success": True,
                "action": "drag",
                "start": start_coordinate,
                "end": end_coordinate
            }
            
        except Exception as e:
            return {"error": f"Drag failed: {e}"}
    
    def get_vnc_url(self) -> str:
        """Get the NoVNC URL for iframe embedding"""
        return self.novnc_url or f"http://{self.vnc_host}:{self.novnc_port}/vnc.html"
    
    async def close_session(self) -> Dict[str, Any]:
        """Close VNC session"""
        self.vnc_session_active = False
        logger.info("VNC session marked as closed")
        return {"success": True, "message": "VNC session closed"}

# Global handler instance
computer_handler = VNCComputerHandler()