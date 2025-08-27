"""
Claude Code SDK Tool Handler
Comprehensive integration system for Claude Code SDK as a tool for main agent and subagents
"""

import asyncio
import json
import os
import uuid
from typing import Dict, List, Any, Optional, AsyncGenerator
from datetime import datetime
import logging
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class ClaudeCodeMode(Enum):
    """Operation modes for Claude Code SDK"""
    CREATE = "create"
    TEST = "test"
    DEPLOY = "deploy"
    DEBUG = "debug"
    REVIEW = "review"
    OPTIMIZE = "optimize"

class PermissionMode(Enum):
    """Permission modes for Claude Code sessions"""
    DEFAULT = "default"
    ACCEPT_EDITS = "acceptEdits"
    PLAN = "plan"
    BYPASS_PERMISSIONS = "bypassPermissions"

@dataclass
class ClaudeCodeSession:
    """Represents a Claude Code SDK session"""
    session_id: str
    mode: ClaudeCodeMode
    created_at: datetime
    last_activity: datetime
    turn_count: int = 0
    max_turns: int = 10
    context: Dict[str, Any] = field(default_factory=dict)
    responses: List[Dict[str, Any]] = field(default_factory=list)
    total_cost_usd: float = 0.0
    is_active: bool = True
    allowed_tools: List[str] = field(default_factory=list)
    system_prompt: str = ""
    mcp_servers: Dict[str, Any] = field(default_factory=dict)

class ClaudeCodeToolHandler:
    """
    Main handler for Claude Code SDK integration
    Manages sessions, executions, and tool interactions
    """
    
    def __init__(self):
        self.active_sessions: Dict[str, ClaudeCodeSession] = {}
        self.session_timeout_minutes = 15
        self.default_tools = ["Bash", "Read", "Write", "WebSearch", "Grep", "LS"]
        self.deployment_tools = ["mcp__deployment", "mcp__testing", "mcp__monitoring"]
        
        # Mode-specific configurations
        self.mode_configs = {
            ClaudeCodeMode.CREATE: {
                "system_prompt": "You are a tool creation specialist. Build robust, well-documented tools with comprehensive error handling.",
                "allowed_tools": self.default_tools + ["Write", "MultiEdit"],
                "max_turns": 5
            },
            ClaudeCodeMode.TEST: {
                "system_prompt": "You are a testing specialist. Thoroughly test code and provide detailed reports with edge cases.",
                "allowed_tools": self.default_tools + ["Bash", "Read"],
                "max_turns": 4
            },
            ClaudeCodeMode.DEPLOY: {
                "system_prompt": "You are a deployment specialist. Ensure secure, reliable deployments with proper monitoring.",
                "allowed_tools": self.default_tools + self.deployment_tools,
                "max_turns": 6
            },
            ClaudeCodeMode.DEBUG: {
                "system_prompt": "You are a debugging specialist. Identify and fix issues systematically with root cause analysis.",
                "allowed_tools": self.default_tools + ["Bash", "Read", "Grep"],
                "max_turns": 5
            },
            ClaudeCodeMode.REVIEW: {
                "system_prompt": "You are a code review specialist. Provide thorough security and performance analysis.",
                "allowed_tools": ["Read", "Grep", "WebSearch"],
                "max_turns": 3,
                "permission_mode": PermissionMode.PLAN
            },
            ClaudeCodeMode.OPTIMIZE: {
                "system_prompt": "You are a performance optimization specialist. Identify bottlenecks and optimize systematically.",
                "allowed_tools": self.default_tools + ["Bash"],
                "max_turns": 5
            }
        }
    
    async def execute_claude_code_task(
        self,
        task: str,
        mode: str = "create",
        allowed_tools: Optional[List[str]] = None,
        system_prompt: Optional[str] = None,
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        mcp_config: Optional[Dict[str, Any]] = None,
        permission_mode: str = "default",
        max_turns: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Execute a Claude Code task with specified configuration
        
        Args:
            task: The coding task to execute
            mode: Operation mode (create, test, deploy, debug, review, optimize)
            allowed_tools: Optional list of allowed tools
            system_prompt: Optional custom system prompt
            session_id: Optional session ID to reuse existing session
            context: Optional context for the task
            mcp_config: Optional MCP server configuration
            permission_mode: Permission mode for the session
            max_turns: Maximum conversation turns
            
        Returns:
            Dict containing execution results and metadata
        """
        try:
            # Validate and convert mode
            try:
                mode_enum = ClaudeCodeMode(mode.lower())
            except ValueError:
                mode_enum = ClaudeCodeMode.CREATE
            
            # Get mode-specific configuration
            mode_config = self.mode_configs.get(mode_enum, {})
            
            # Prepare tools list
            tools = allowed_tools or mode_config.get("allowed_tools", self.default_tools)
            
            # Prepare system prompt
            base_prompt = mode_config.get("system_prompt", "You are a coding assistant.")
            final_prompt = f"{base_prompt}\n{system_prompt}" if system_prompt else base_prompt
            
            # Set max turns
            turns = max_turns or mode_config.get("max_turns", 5)
            
            # Check for existing session or create new one
            if session_id and session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                session.last_activity = datetime.now()
                logger.info(f"Reusing existing session {session_id}")
            else:
                session = await self._create_session(
                    mode=mode_enum,
                    system_prompt=final_prompt,
                    allowed_tools=tools,
                    max_turns=turns,
                    context=context or {},
                    mcp_servers=mcp_config or {}
                )
                logger.info(f"Created new session {session.session_id}")
            
            # Execute the task using Claude Code SDK
            result = await self._execute_with_sdk(
                session=session,
                task=task,
                permission_mode=permission_mode
            )
            
            # Update session state
            session.turn_count += 1
            session.responses.append(result)
            
            # Check if session should be closed
            if session.turn_count >= session.max_turns:
                session.is_active = False
                logger.info(f"Session {session.session_id} reached max turns, marking inactive")
            
            return {
                'success': True,
                'session_id': session.session_id,
                'mode': mode,
                'result': result.get('result', ''),
                'cost': result.get('cost', 0),
                'turn_count': session.turn_count,
                'max_turns': session.max_turns,
                'is_active': session.is_active,
                'metadata': {
                    'duration_ms': result.get('duration_ms', 0),
                    'tools_used': result.get('tools_used', []),
                    'files_created': result.get('files_created', []),
                    'files_modified': result.get('files_modified', [])
                }
            }
            
        except Exception as e:
            logger.error(f"Error executing Claude Code task: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'mode': mode,
                'session_id': session_id
            }
    
    async def _create_session(
        self,
        mode: ClaudeCodeMode,
        system_prompt: str,
        allowed_tools: List[str],
        max_turns: int,
        context: Dict[str, Any],
        mcp_servers: Dict[str, Any]
    ) -> ClaudeCodeSession:
        """Create a new Claude Code session"""
        session_id = str(uuid.uuid4())
        session = ClaudeCodeSession(
            session_id=session_id,
            mode=mode,
            created_at=datetime.now(),
            last_activity=datetime.now(),
            max_turns=max_turns,
            context=context,
            allowed_tools=allowed_tools,
            system_prompt=system_prompt,
            mcp_servers=mcp_servers
        )
        self.active_sessions[session_id] = session
        return session
    
    async def _execute_with_sdk(
        self,
        session: ClaudeCodeSession,
        task: str,
        permission_mode: str
    ) -> Dict[str, Any]:
        """
        Execute task using Claude Code SDK
        This will be replaced with actual SDK calls when integrated
        """
        try:
            # Import the actual Claude Code SDK
            from claude_code_sdk import ClaudeSDKClient, ClaudeCodeOptions
            
            # Prepare options
            options = ClaudeCodeOptions(
                system_prompt=session.system_prompt,
                allowed_tools=session.allowed_tools,
                max_turns=1,  # Single turn per execution
                permission_mode=permission_mode,
                mcp_servers=session.mcp_servers if session.mcp_servers else None
            )
            
            # Execute with SDK
            responses = []
            tools_used = []
            files_created = []
            files_modified = []
            total_cost = 0.0
            start_time = datetime.now()
            
            async with ClaudeSDKClient(options=options) as client:
                await client.query(task)
                
                # Collect responses
                async for message in client.receive_response():
                    if hasattr(message, 'content'):
                        for block in message.content:
                            # Track tool usage
                            if hasattr(block, 'type') and block.type == 'tool_use':
                                tools_used.append(block.name)
                                
                                # Track file operations
                                if block.name == 'Write':
                                    if hasattr(block, 'input') and 'file_path' in block.input:
                                        files_created.append(block.input['file_path'])
                                elif block.name in ['Edit', 'MultiEdit']:
                                    if hasattr(block, 'input') and 'file_path' in block.input:
                                        files_modified.append(block.input['file_path'])
                            
                            # Collect text responses
                            if hasattr(block, 'text'):
                                responses.append(block.text)
                    
                    # Capture final result
                    if type(message).__name__ == "ResultMessage":
                        total_cost = message.total_cost_usd
                        session.total_cost_usd += total_cost
                        
                        duration_ms = (datetime.now() - start_time).total_seconds() * 1000
                        
                        return {
                            'result': ''.join(responses),
                            'cost': total_cost,
                            'duration_ms': duration_ms,
                            'tools_used': list(set(tools_used)),
                            'files_created': list(set(files_created)),
                            'files_modified': list(set(files_modified)),
                            'session_id': session.session_id
                        }
            
            # Fallback if no result message received
            return {
                'result': ''.join(responses) if responses else "No response received",
                'cost': 0,
                'duration_ms': (datetime.now() - start_time).total_seconds() * 1000,
                'tools_used': list(set(tools_used)),
                'files_created': list(set(files_created)),
                'files_modified': list(set(files_modified)),
                'session_id': session.session_id
            }
            
        except ImportError:
            # Fallback for testing without SDK installed
            logger.warning("Claude Code SDK not installed, using mock response")
            return await self._mock_sdk_response(session, task, permission_mode)
        except Exception as e:
            logger.error(f"Error in SDK execution: {str(e)}")
            raise
    
    async def _mock_sdk_response(
        self,
        session: ClaudeCodeSession,
        task: str,
        permission_mode: str
    ) -> Dict[str, Any]:
        """Mock response for testing without SDK"""
        await asyncio.sleep(0.5)  # Simulate processing time
        
        mode_responses = {
            ClaudeCodeMode.CREATE: f"Created tool for: {task}\n\n```python\ndef generated_tool():\n    # Tool implementation\n    pass\n```",
            ClaudeCodeMode.TEST: f"Test results for: {task}\n\n✓ All tests passed\n✓ 100% code coverage",
            ClaudeCodeMode.DEPLOY: f"Deployment complete for: {task}\n\n✓ Deployed to production\n✓ Health checks passing",
            ClaudeCodeMode.DEBUG: f"Debug analysis for: {task}\n\n✓ Issue identified\n✓ Fix applied",
            ClaudeCodeMode.REVIEW: f"Code review for: {task}\n\n✓ No security issues\n✓ Performance optimal",
            ClaudeCodeMode.OPTIMIZE: f"Optimization complete for: {task}\n\n✓ 50% performance improvement"
        }
        
        return {
            'result': mode_responses.get(session.mode, f"Completed: {task}"),
            'cost': 0.001,
            'duration_ms': 500,
            'tools_used': ["mock_tool"],
            'files_created': [],
            'files_modified': [],
            'session_id': session.session_id
        }
    
    async def continue_session(
        self,
        session_id: str,
        task: str,
        context_update: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Continue an existing Claude Code session
        
        Args:
            session_id: ID of the session to continue
            task: New task to execute
            context_update: Optional context updates
            
        Returns:
            Execution results
        """
        if session_id not in self.active_sessions:
            return {
                'success': False,
                'error': f"Session {session_id} not found or expired"
            }
        
        session = self.active_sessions[session_id]
        
        if not session.is_active:
            return {
                'success': False,
                'error': f"Session {session_id} is no longer active"
            }
        
        # Update context if provided
        if context_update:
            session.context.update(context_update)
        
        # Continue with the task
        return await self.execute_claude_code_task(
            task=task,
            mode=session.mode.value,
            session_id=session_id,
            context=session.context
        )
    
    async def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """Get the status of a Claude Code session"""
        if session_id not in self.active_sessions:
            return {
                'exists': False,
                'error': 'Session not found'
            }
        
        session = self.active_sessions[session_id]
        
        return {
            'exists': True,
            'session_id': session_id,
            'mode': session.mode.value,
            'is_active': session.is_active,
            'turn_count': session.turn_count,
            'max_turns': session.max_turns,
            'total_cost_usd': session.total_cost_usd,
            'created_at': session.created_at.isoformat(),
            'last_activity': session.last_activity.isoformat(),
            'context': session.context
        }
    
    async def close_session(self, session_id: str) -> Dict[str, Any]:
        """Close and cleanup a Claude Code session"""
        if session_id not in self.active_sessions:
            return {
                'success': False,
                'error': 'Session not found'
            }
        
        session = self.active_sessions[session_id]
        session.is_active = False
        
        # Generate summary
        summary = {
            'session_id': session_id,
            'mode': session.mode.value,
            'total_turns': session.turn_count,
            'total_cost_usd': session.total_cost_usd,
            'duration_minutes': (session.last_activity - session.created_at).total_seconds() / 60,
            'responses_count': len(session.responses)
        }
        
        # Remove from active sessions
        del self.active_sessions[session_id]
        
        return {
            'success': True,
            'summary': summary
        }
    
    async def cleanup_expired_sessions(self):
        """Clean up expired sessions based on timeout"""
        current_time = datetime.now()
        expired_sessions = []
        
        for session_id, session in self.active_sessions.items():
            time_since_activity = (current_time - session.last_activity).total_seconds() / 60
            if time_since_activity > self.session_timeout_minutes:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            logger.info(f"Cleaning up expired session {session_id}")
            await self.close_session(session_id)
        
        return {
            'cleaned_sessions': len(expired_sessions),
            'active_sessions': len(self.active_sessions)
        }

# Global instance
claude_code_handler = ClaudeCodeToolHandler()