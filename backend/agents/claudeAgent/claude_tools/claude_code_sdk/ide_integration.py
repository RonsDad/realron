"""
IDE Integration for Claude Code SDK
Integrates with OpenVSCode Server for enhanced code editing capabilities
"""

import os
import asyncio
import logging
import subprocess
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import aiohttp

logger = logging.getLogger(__name__)


class IDEIntegration:
    """Manages OpenVSCode Server integration for Claude Code SDK"""
    
    def __init__(self):
        self.openvscode_path = "/Users/timhunter/ron-ai/.openvscode-server"
        self.server_port = 8443  # Default port for OpenVSCode Server
        self.server_process = None
        self.server_url = f"http://localhost:{self.server_port}"
        self.auth_token = None
        self.workspace_path = "/Users/timhunter/ron-ai/backend/generated_tools"
        
    async def start_ide_server(self) -> Dict[str, Any]:
        """Start the OpenVSCode Server if not already running"""
        try:
            # Check if server is already running
            if await self._check_server_health():
                logger.info("OpenVSCode Server already running")
                return {
                    "success": True,
                    "server_url": self.server_url,
                    "message": "IDE server already running"
                }
            
            # Ensure workspace directory exists
            os.makedirs(self.workspace_path, exist_ok=True)
            
            # Find the server executable
            server_executable = self._find_server_executable()
            if not server_executable:
                raise Exception("OpenVSCode Server executable not found")
            
            # Start the server process
            cmd = [
                server_executable,
                "--port", str(self.server_port),
                "--host", "0.0.0.0",
                "--without-connection-token",  # Disable auth for local dev
                "--accept-server-license-terms",
                self.workspace_path
            ]
            
            logger.info(f"Starting OpenVSCode Server: {' '.join(cmd)}")
            
            self.server_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env={**os.environ, "VSCODE_PROXY_URI": "http://localhost:8443"}
            )
            
            # Wait for server to start
            start_time = time.time()
            while time.time() - start_time < 30:  # 30 second timeout
                if await self._check_server_health():
                    logger.info("OpenVSCode Server started successfully")
                    return {
                        "success": True,
                        "server_url": self.server_url,
                        "workspace": self.workspace_path,
                        "message": "IDE server started successfully"
                    }
                await asyncio.sleep(1)
            
            raise Exception("Timeout waiting for OpenVSCode Server to start")
            
        except Exception as e:
            logger.error(f"Failed to start IDE server: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def stop_ide_server(self) -> Dict[str, Any]:
        """Stop the OpenVSCode Server"""
        try:
            if self.server_process:
                self.server_process.terminate()
                self.server_process.wait(timeout=10)
                self.server_process = None
                logger.info("OpenVSCode Server stopped")
            
            return {
                "success": True,
                "message": "IDE server stopped"
            }
        except Exception as e:
            logger.error(f"Failed to stop IDE server: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_tool_workspace(self, tool_id: str, tool_html: str) -> Dict[str, Any]:
        """Create a workspace for a generated tool with IDE integration"""
        try:
            # Create tool-specific directory
            tool_dir = os.path.join(self.workspace_path, tool_id)
            os.makedirs(tool_dir, exist_ok=True)
            
            # Save the tool HTML
            tool_file = os.path.join(tool_dir, "index.html")
            with open(tool_file, 'w') as f:
                f.write(tool_html)
            
            # Create workspace configuration
            workspace_config = {
                "folders": [{"path": tool_dir}],
                "settings": {
                    "editor.formatOnSave": True,
                    "editor.wordWrap": "on",
                    "files.autoSave": "afterDelay",
                    "html.autoClosingTags": True,
                    "css.lint.duplicateProperties": "warning"
                }
            }
            
            config_file = os.path.join(tool_dir, f"{tool_id}.code-workspace")
            with open(config_file, 'w') as f:
                json.dump(workspace_config, f, indent=2)
            
            # Generate IDE URL for this specific tool
            ide_url = f"{self.server_url}?folder={tool_dir}"
            
            return {
                "success": True,
                "tool_id": tool_id,
                "workspace_path": tool_dir,
                "tool_file": tool_file,
                "workspace_config": config_file,
                "ide_url": ide_url,
                "message": "Tool workspace created successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to create tool workspace: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def install_extensions(self, extensions: List[str]) -> Dict[str, Any]:
        """Install VS Code extensions for enhanced development"""
        try:
            server_executable = self._find_server_executable()
            if not server_executable:
                raise Exception("OpenVSCode Server executable not found")
            
            installed = []
            failed = []
            
            for extension in extensions:
                try:
                    cmd = [
                        server_executable,
                        "--install-extension", extension,
                        "--force"
                    ]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=60
                    )
                    
                    if result.returncode == 0:
                        installed.append(extension)
                        logger.info(f"Installed extension: {extension}")
                    else:
                        failed.append(extension)
                        logger.error(f"Failed to install extension {extension}: {result.stderr}")
                        
                except Exception as e:
                    failed.append(extension)
                    logger.error(f"Error installing extension {extension}: {str(e)}")
            
            return {
                "success": len(failed) == 0,
                "installed": installed,
                "failed": failed,
                "message": f"Installed {len(installed)} extensions"
            }
            
        except Exception as e:
            logger.error(f"Failed to install extensions: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_server_info(self) -> Dict[str, Any]:
        """Get information about the running IDE server"""
        try:
            health = await self._check_server_health()
            
            return {
                "running": health,
                "server_url": self.server_url if health else None,
                "workspace_path": self.workspace_path,
                "port": self.server_port,
                "openvscode_path": self.openvscode_path
            }
            
        except Exception as e:
            logger.error(f"Failed to get server info: {str(e)}")
            return {
                "running": False,
                "error": str(e)
            }
    
    async def open_in_ide(self, file_path: str) -> Dict[str, Any]:
        """Open a specific file in the IDE"""
        try:
            # Ensure server is running
            if not await self._check_server_health():
                await self.start_ide_server()
            
            # Generate URL to open file
            ide_url = f"{self.server_url}?openFile={file_path}"
            
            return {
                "success": True,
                "ide_url": ide_url,
                "file_path": file_path,
                "message": "File opened in IDE"
            }
            
        except Exception as e:
            logger.error(f"Failed to open file in IDE: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _find_server_executable(self) -> Optional[str]:
        """Find the OpenVSCode Server executable"""
        possible_paths = [
            os.path.join(self.openvscode_path, "bin", "openvscode-server"),
            os.path.join(self.openvscode_path, "bin", "code-server"),
            os.path.join(self.openvscode_path, "server.sh"),
            os.path.join(self.openvscode_path, "bin", "remote-cli", "openvscode-server")
        ]
        
        for path in possible_paths:
            if os.path.exists(path) and os.access(path, os.X_OK):
                return path
        
        # Search recursively for executable
        for root, dirs, files in os.walk(self.openvscode_path):
            for file in files:
                if file in ["openvscode-server", "code-server", "server.sh"]:
                    full_path = os.path.join(root, file)
                    if os.access(full_path, os.X_OK):
                        return full_path
        
        return None
    
    async def _check_server_health(self) -> bool:
        """Check if the IDE server is healthy"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.server_url}/healthz",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    return response.status == 200
        except:
            return False
    
    async def execute_in_terminal(self, command: str, cwd: Optional[str] = None) -> Dict[str, Any]:
        """Execute a command in the IDE's integrated terminal"""
        try:
            # This would integrate with VS Code's terminal API
            # For now, we'll use subprocess as a fallback
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                cwd=cwd or self.workspace_path,
                timeout=30
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
            
        except Exception as e:
            logger.error(f"Failed to execute command: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# Global instance
ide_integration = IDEIntegration()


# Healthcare-specific IDE extensions
HEALTHCARE_EXTENSIONS = [
    "esbenp.prettier-vscode",  # Code formatter
    "dbaeumer.vscode-eslint",  # JavaScript linting
    "ms-vscode.live-server",   # Live preview for HTML
    "ritwickdey.liveserver",   # Alternative live server
    "zignd.html-css-class-completion",  # HTML/CSS helpers
    "formulahendry.auto-rename-tag",  # Auto rename HTML tags
    "naumovs.color-highlight",  # Color highlighting
    "bradlc.vscode-tailwindcss"  # Tailwind CSS support
]