"""
Claude Code SDK Integration Package
Complete integration system for Claude Code SDK as a tool for main agent and subagents
"""

from .claude_code_tool_handler import (
    ClaudeCodeToolHandler,
    ClaudeCodeMode,
    PermissionMode,
    ClaudeCodeSession,
    claude_code_handler
)

from .subagent_factory import (
    SubagentFactory,
    SubagentSpecialization,
    SubagentConfig,
    SubagentTask
)

from .mcp_integration import (
    MCPServer,
    DeploymentMCPServer,
    TestingMCPServer,
    MonitoringMCPServer,
    MCPIntegrationManager,
    mcp_manager
)

from .tool_definitions import (
    get_claude_code_tool_definitions,
    register_claude_code_tools,
    execute_claude_code_tool
)

__all__ = [
    # Tool Handler
    'ClaudeCodeToolHandler',
    'ClaudeCodeMode',
    'PermissionMode',
    'ClaudeCodeSession',
    'claude_code_handler',
    
    # Subagent Factory
    'SubagentFactory',
    'SubagentSpecialization',
    'SubagentConfig',
    'SubagentTask',
    
    # MCP Integration
    'MCPServer',
    'DeploymentMCPServer',
    'TestingMCPServer',
    'MonitoringMCPServer',
    'MCPIntegrationManager',
    'mcp_manager',
    
    # Tool Definitions
    'get_claude_code_tool_definitions',
    'register_claude_code_tools',
    'execute_claude_code_tool'
]

# Version info
__version__ = '1.0.0'