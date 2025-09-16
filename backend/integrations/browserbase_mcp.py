"""
Browserbase MCP Server Integration for Ron AI
==============================================
Official Documentation Verified:
- NPM Package: @browserbasehq/mcp-server-browserbase (latest: v2.0.0)
- GitHub: https://github.com/browserbase/mcp-server-browserbase
- Docs: https://docs.browserbase.com/integrations/mcp/introduction

Zero-Assumption Protocol Implementation
Following exact specifications from official sources
"""

import os
import json
import subprocess
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

# ============================================================================
# VERIFIED TOOL NAMES FROM OFFICIAL DOCUMENTATION
# Source: GitHub browserbase/mcp-server-browserbase README.md
# ============================================================================
BROWSERBASE_MCP_TOOLS = {
    # Multi-session tools (verified from official repo)
    "multi_browserbase_stagehand_session_create": "Create a new browser session",    "multi_browserbase_stagehand_session_list": "List all active sessions",
    "multi_browserbase_stagehand_session_close": "Close a specific session",
    "multi_browserbase_stagehand_navigate_session": "Navigate to URL in session",
    "multi_browserbase_stagehand_act_session": "Perform action in session",
    "multi_browserbase_stagehand_extract_session": "Extract data from session",
    "multi_browserbase_stagehand_screenshot_session": "Take screenshot in session",
    
    # Debug tools (verified from official repo)
    "browserbase_stagehand_debug_session": "Get debug info and Live View URLs",
    
    # Cookie management (verified from official repo)
    "browserbase_cookies_add": "Add cookies to browser session",
}

class TransportType(Enum):
    """Transport types supported by Browserbase MCP"""
    STDIO = "stdio"
    SSE = "sse"
    SMITHERY = "smithery"

@dataclass
class BrowserbaseConfig:
    """Configuration for Browserbase MCP Server"""
    api_key: str
    project_id: str
    transport_type: TransportType = TransportType.STDIO
    smithery_url: Optional[str] = None
    model_name: str = "google/gemini-2.0-flash"  # Default per documentation
    model_api_key: Optional[str] = None
    proxies: bool = False
    advanced_stealth: bool = False
    context_id: Optional[str] = None
    browser_width: int = 1024
    browser_height: int = 768

class BrowserbaseMCPServer:
    """
    Browserbase MCP Server Manager
    Handles server lifecycle and configuration
    """
    
    def __init__(self, config: BrowserbaseConfig):
        self.config = config
        self.process: Optional[subprocess.Popen] = None
        self.server_url: Optional[str] = None
        
    def get_mcp_server_config(self) -> Dict[str, Any]:
        """
        Generate MCP server configuration for Anthropic API
        Returns configuration that can be added to mcp_servers parameter
        """
        if self.config.transport_type == TransportType.STDIO:
            # For STDIO, we need to run the server locally first
            raise ValueError(
                "STDIO transport requires local server management. "
                "Use SSE/Smithery for direct API integration."
            )
        
        if self.config.transport_type in [TransportType.SSE, TransportType.SMITHERY]:
            if not self.config.smithery_url:
                raise ValueError(f"{self.config.transport_type.value} transport requires smithery_url")            
            # Return URL-based MCP server config for Anthropic API
            return {
                "type": "url",
                "url": self.config.smithery_url,
                "name": "browserbase",
                "tool_configuration": {
                    "enabled": True,
                    "allowed_tools": list(BROWSERBASE_MCP_TOOLS.keys())
                }
            }
    
    async def start_local_server(self) -> Tuple[bool, Optional[str]]:
        """
        Start local Browserbase MCP server using npx
        Returns (success, server_url)
        """
        if self.config.transport_type != TransportType.STDIO:
            return False, "Local server only needed for STDIO transport"
        
        try:
            # Build command arguments based on verified documentation
            cmd = ["npx", "@browserbasehq/mcp-server-browserbase"]
            
            # Add configuration flags (verified from official docs)
            if self.config.proxies:
                cmd.append("--proxies")
            
            if self.config.advanced_stealth:
                cmd.append("--advancedStealth")
            
            if self.config.context_id:                cmd.extend(["--contextId", self.config.context_id])
            
            cmd.extend([
                "--browserWidth", str(self.config.browser_width),
                "--browserHeight", str(self.config.browser_height)
            ])
            
            # Add model configuration if not using default
            if self.config.model_name != "google/gemini-2.0-flash":
                cmd.extend(["--modelName", self.config.model_name])
                if self.config.model_api_key:
                    cmd.extend(["--modelApiKey", self.config.model_api_key])
            
            # Set environment variables
            env = os.environ.copy()
            env["BROWSERBASE_API_KEY"] = self.config.api_key
            env["BROWSERBASE_PROJECT_ID"] = self.config.project_id
            
            if self.config.model_api_key:
                # Set appropriate API key based on model provider
                if "gemini" in self.config.model_name.lower():
                    env["GOOGLE_GENERATIVE_AI_API_KEY"] = self.config.model_api_key
                    env["GEMINI_API_KEY"] = self.config.model_api_key  # Fallback
                elif "anthropic" in self.config.model_name.lower():
                    env["ANTHROPIC_API_KEY"] = self.config.model_api_key
                elif "openai" in self.config.model_name.lower():
                    env["OPENAI_API_KEY"] = self.config.model_api_key
            
            # Start the server process
            logger.info(f"Starting Browserbase MCP server: {' '.join(cmd)}")
            self.process = subprocess.Popen(                cmd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait a moment for server to start
            await asyncio.sleep(2)
            
            # Check if process is still running
            if self.process.poll() is None:
                logger.info("Browserbase MCP server started successfully")
                # For STDIO, we communicate via process pipes
                return True, "stdio://localhost"
            else:
                stderr = self.process.stderr.read() if self.process.stderr else ""
                logger.error(f"Server failed to start: {stderr}")
                return False, stderr
                
        except Exception as e:
            logger.error(f"Failed to start Browserbase MCP server: {e}")
            return False, str(e)
    
    async def stop_server(self):
        """Stop the local MCP server if running"""
        if self.process:
            logger.info("Stopping Browserbase MCP server")
            self.process.terminate()
            try:
                await asyncio.wait_for(                    asyncio.create_task(self._wait_for_process()),
                    timeout=5.0
                )
            except asyncio.TimeoutError:
                logger.warning("Server didn't stop gracefully, forcing kill")
                self.process.kill()
            self.process = None
    
    async def _wait_for_process(self):
        """Helper to wait for process termination"""
        while self.process and self.process.poll() is None:
            await asyncio.sleep(0.1)

class BrowserbaseMCPIntegration:
    """
    Main integration class for Browserbase MCP with Ron AI
    Manages server lifecycle and provides configuration for Claude API
    """
    
    def __init__(self):
        self.server: Optional[BrowserbaseMCPServer] = None
        self.config: Optional[BrowserbaseConfig] = None
        
    def initialize_from_env(self) -> bool:
        """
        Initialize Browserbase MCP from environment variables
        Following the exact pattern from official documentation
        """
        # Required environment variables (verified from docs)
        api_key = os.environ.get("BROWSERBASE_API_KEY")
        project_id = os.environ.get("BROWSERBASE_PROJECT_ID")        
        if not api_key or not project_id:
            logger.warning(
                "Browserbase MCP not configured: Missing BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID"
            )
            return False
        
        # Determine transport type
        smithery_url = os.environ.get("BROWSERBASE_MCP_URL")
        if smithery_url:
            transport_type = TransportType.SMITHERY
        else:
            transport_type = TransportType.STDIO
        
        # Optional configuration
        model_name = os.environ.get("BROWSERBASE_MODEL_NAME", "google/gemini-2.0-flash")
        model_api_key = (os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY") or
                        os.environ.get("GEMINI_API_KEY") or
                        os.environ.get("ANTHROPIC_API_KEY"))
        
        # Boolean flags
        proxies = os.environ.get("BROWSERBASE_PROXIES", "").lower() == "true"
        advanced_stealth = os.environ.get("BROWSERBASE_ADVANCED_STEALTH", "").lower() == "true"
        
        # Viewport settings
        browser_width = int(os.environ.get("BROWSERBASE_WIDTH", "1024"))
        browser_height = int(os.environ.get("BROWSERBASE_HEIGHT", "768"))
        
        # Context ID for persistent sessions
        context_id = os.environ.get("BROWSERBASE_CONTEXT_ID")
        
        self.config = BrowserbaseConfig(            api_key=api_key,
            project_id=project_id,
            transport_type=transport_type,
            smithery_url=smithery_url,
            model_name=model_name,
            model_api_key=model_api_key,
            proxies=proxies,
            advanced_stealth=advanced_stealth,
            context_id=context_id,
            browser_width=browser_width,
            browser_height=browser_height
        )
        
        self.server = BrowserbaseMCPServer(self.config)
        logger.info(
            f"Browserbase MCP initialized with transport: {transport_type.value}"
        )
        return True
    
    def get_mcp_server_config(self) -> Optional[Dict[str, Any]]:
        """
        Get MCP server configuration for Claude API
        This returns the configuration to add to mcp_servers parameter
        """
        if not self.server:
            return None
        
        try:
            return self.server.get_mcp_server_config()
        except ValueError as e:
            logger.error(f"Cannot get MCP config: {e}")
            return None
    
    async def start_local_server_if_needed(self) -> bool:
        """
        Start local server if using STDIO transport
        For SSE/Smithery, no local server is needed
        """
        if not self.server or not self.config:
            return False
        
        if self.config.transport_type == TransportType.STDIO:
            success, msg = await self.server.start_local_server()
            if not success:
                logger.error(f"Failed to start local server: {msg}")
            return success
        
        # For URL-based transports, no local server needed
        return True
    
    async def cleanup(self):
        """Clean up resources"""
        if self.server:
            await self.server.stop_server()

# ============================================================================
# Integration with Ron AI Backend
# ============================================================================

def add_browserbase_to_mcp_servers(
    mcp_servers: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Add Browserbase MCP server to the list of MCP servers
    This function integrates with the existing Ron AI backend
    """
    integration = BrowserbaseMCPIntegration()
    
    if not integration.initialize_from_env():
        logger.info("Browserbase MCP not configured, skipping")
        return mcp_servers
    
    # Get the MCP server configuration
    browserbase_config = integration.get_mcp_server_config()
    
    if browserbase_config:
        # Check if browserbase is already in the list
        existing = [s for s in mcp_servers if s.get("name") == "browserbase"]
        if not existing:
            mcp_servers.append(browserbase_config)
            logger.info("Added Browserbase MCP server to configuration")
        else:
            logger.info("Browserbase MCP server already in configuration")
    
    return mcp_servers

# ============================================================================
# Standalone Testing
# ============================================================================

async def test_browserbase_integration():
    """Test the Browserbase MCP integration"""
    integration = BrowserbaseMCPIntegration()

    # Initialize from environment
    if not integration.initialize_from_env():
        print("❌ Failed to initialize Browserbase MCP")
        print("Please set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID")
        return
    
    print("✅ Browserbase MCP initialized")
    
    # Get MCP configuration
    config = integration.get_mcp_server_config()
    if config:
        print(f"✅ MCP Server Config: {json.dumps(config, indent=2)}")
    else:
        # Try starting local server for STDIO
        if await integration.start_local_server_if_needed():
            print("✅ Local server started")
        else:
            print("❌ Failed to start local server")
    
    # Cleanup
    await integration.cleanup()
    print("✅ Cleanup completed")

if __name__ == "__main__":
    # Run test
    asyncio.run(test_browserbase_integration())