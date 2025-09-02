"""
Claude Code SDK v2 - Production Implementation
Proper async implementation using the official claude-code-sdk Python package
Following best practices from https://docs.anthropic.com/en/docs/claude-code/sdk/sdk-python
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, AsyncIterator, List, Callable
from dataclasses import dataclass, field
from enum import Enum
import hashlib

# Official SDK imports
try:
    from claude_code_sdk import (
        ClaudeSDKClient,
        ClaudeCodeOptions, 
        query
    )
    # Try importing message types - they might have different names
    try:
        from claude_code_sdk import (
            AssistantMessage,
            UserMessage,
            SystemMessage,
            ResultMessage,
            ErrorMessage,
            TextBlock,
            ToolUseBlock,
            ToolResultBlock
        )
    except ImportError:
        # These types might not be directly exported
        AssistantMessage = None
        UserMessage = None
        SystemMessage = None
        ResultMessage = None
        ErrorMessage = None
        TextBlock = None
        ToolUseBlock = None
        ToolResultBlock = None
    
    # Try importing error types
    try:
        from claude_code_sdk import (
            ClaudeSDKError,
            CLINotFoundError,
            CLIConnectionError,
            ProcessError,
            CLIJSONDecodeError
        )
    except ImportError:
        # Use generic exceptions if specific ones not available
        ClaudeSDKError = Exception
        CLINotFoundError = Exception
        CLIConnectionError = Exception
        ProcessError = Exception
        CLIJSONDecodeError = Exception
    
    CLAUDE_CODE_SDK_AVAILABLE = True
except ImportError:
    CLAUDE_CODE_SDK_AVAILABLE = False
    logging.error("Claude Code SDK not installed. Run: pip install claude-code-sdk")

logger = logging.getLogger(__name__)

# Configuration
DEFAULT_SYSTEM_PROMPT = """You are Ron AI's code generation assistant. 
Create functional, well-documented healthcare applications with proper error handling.
Focus on creating complete, working solutions that are ready for production use."""

DEFAULT_ALLOWED_TOOLS = ["Read", "Write", "Edit", "Bash", "Grep", "WebSearch"]

class PermissionMode(Enum):
    """Permission modes for Claude Code operations"""
    DEFAULT = "default"  # CLI prompts for dangerous tools
    ACCEPT_EDITS = "acceptEdits"  # Auto-accept file edits
    PLAN = "plan"  # Plan mode - analyze without changes
    BYPASS = "bypassPermissions"  # Allow all tools (use with caution)

@dataclass
class SessionData:
    """Session data structure"""
    id: str
    created_at: datetime
    last_activity: datetime
    turns: int = 0
    working_directory: Optional[str] = None
    files_created: List[str] = field(default_factory=list)
    files_modified: List[str] = field(default_factory=list)
    total_cost_usd: float = 0.0
    total_tokens: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "turns": self.turns,
            "working_directory": self.working_directory,
            "files_created": self.files_created,
            "files_modified": self.files_modified,
            "total_cost_usd": self.total_cost_usd,
            "total_tokens": self.total_tokens,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SessionData':
        """Create from dictionary"""
        return cls(
            id=data["id"],
            created_at=datetime.fromisoformat(data["created_at"]),
            last_activity=datetime.fromisoformat(data["last_activity"]),
            turns=data.get("turns", 0),
            working_directory=data.get("working_directory"),
            files_created=data.get("files_created", []),
            files_modified=data.get("files_modified", []),
            total_cost_usd=data.get("total_cost_usd", 0.0),
            total_tokens=data.get("total_tokens", 0),
            metadata=data.get("metadata", {})
        )


class SessionManager:
    """Enhanced session manager with persistence support"""
    
    def __init__(self, storage_backend: Optional[Any] = None):
        """
        Initialize with optional storage backend (Redis, database, etc.)
        For now, using in-memory storage with file persistence
        """
        self.sessions: Dict[str, SessionData] = {}
        self.storage_backend = storage_backend
        self.session_file = Path.home() / ".claude_code_sessions.json"
        self._load_sessions()
    
    def _load_sessions(self):
        """Load sessions from persistent storage"""
        if self.session_file.exists():
            try:
                with open(self.session_file, 'r') as f:
                    data = json.load(f)
                    for session_dict in data.get("sessions", []):
                        session = SessionData.from_dict(session_dict)
                        # Only load sessions less than 24 hours old
                        if (datetime.now() - session.last_activity) < timedelta(hours=24):
                            self.sessions[session.id] = session
                logger.info(f"Loaded {len(self.sessions)} active sessions")
            except Exception as e:
                logger.error(f"Error loading sessions: {e}")
    
    def _save_sessions(self):
        """Save sessions to persistent storage"""
        try:
            sessions_data = {
                "sessions": [s.to_dict() for s in self.sessions.values()],
                "saved_at": datetime.now().isoformat()
            }
            with open(self.session_file, 'w') as f:
                json.dump(sessions_data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving sessions: {e}")
    
    def create_session(self, **metadata) -> SessionData:
        """Create new session"""
        session_id = str(uuid.uuid4())
        session = SessionData(
            id=session_id,
            created_at=datetime.now(),
            last_activity=datetime.now(),
            metadata=metadata
        )
        self.sessions[session_id] = session
        self._save_sessions()
        logger.info(f"Created session: {session_id}")
        return session
    
    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    def update_session(self, session_id: str, **updates) -> bool:
        """Update session data"""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            for key, value in updates.items():
                if hasattr(session, key):
                    setattr(session, key, value)
            session.last_activity = datetime.now()
            session.turns += 1
            self._save_sessions()
            return True
        return False
    
    def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Remove sessions older than max_age_hours"""
        now = datetime.now()
        removed = []
        for session_id, session in list(self.sessions.items()):
            if (now - session.last_activity).total_seconds() > max_age_hours * 3600:
                del self.sessions[session_id]
                removed.append(session_id)
        
        if removed:
            self._save_sessions()
            logger.info(f"Cleaned up {len(removed)} old sessions")
        
        return removed


class ClaudeCodeAgent:
    """Production-ready Claude Code Agent with proper SDK integration"""
    
    def __init__(self, session_manager: Optional[SessionManager] = None):
        """Initialize agent with session manager"""
        if not CLAUDE_CODE_SDK_AVAILABLE:
            raise RuntimeError("Claude Code SDK not available. Install with: pip install claude-code-sdk")
        
        self.session_manager = session_manager or SessionManager()
        self.active_clients: Dict[str, ClaudeSDKClient] = {}
    
    async def _get_or_create_client(
        self,
        session_id: Optional[str] = None,
        options: Optional[ClaudeCodeOptions] = None
    ) -> tuple[ClaudeSDKClient, str]:
        """Get existing or create new client with session"""
        if session_id and session_id in self.active_clients:
            return self.active_clients[session_id], session_id
        
        # Create new client
        client = ClaudeSDKClient(options=options)
        await client.connect()
        
        # Create or get session
        if not session_id:
            session = self.session_manager.create_session()
            session_id = session.id
        
        self.active_clients[session_id] = client
        return client, session_id
    
    async def execute(
        self,
        prompt: str,
        working_directory: Optional[str] = None,
        allowed_tools: Optional[List[str]] = None,
        system_prompt: Optional[str] = None,
        permission_mode: PermissionMode = PermissionMode.ACCEPT_EDITS,
        max_turns: int = 5,
        session_id: Optional[str] = None,
        continue_conversation: bool = False,
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Execute Claude Code with full SDK integration
        
        Args:
            prompt: The task or code to generate
            working_directory: Directory to work in
            allowed_tools: List of allowed tools
            system_prompt: Custom system prompt
            permission_mode: How to handle permissions
            max_turns: Maximum conversation turns
            session_id: Existing session to continue
            continue_conversation: Continue most recent conversation
            stream_callback: Async callback for streaming updates
        
        Returns:
            Dict with results, files created, preview content, etc.
        """
        try:
            # Prepare options
            working_directory = working_directory or os.getcwd()
            allowed_tools = allowed_tools or DEFAULT_ALLOWED_TOOLS
            system_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
            
            # Track files before execution
            files_before = self._get_directory_files(working_directory)
            
            # Configure Claude Code options
            options = ClaudeCodeOptions(
                system_prompt=system_prompt,
                allowed_tools=allowed_tools,
                permission_mode=permission_mode.value,
                max_turns=max_turns,
                cwd=working_directory,
                continue_conversation=continue_conversation,
                resume=session_id if session_id and not continue_conversation else None
            )
            
            # Get or create client
            client, session_id = await self._get_or_create_client(session_id, options)
            
            # Update session
            session = self.session_manager.get_session(session_id)
            if session:
                session.working_directory = working_directory
            
            # Execute query
            await client.query(prompt)
            
            # Collect results with streaming
            result_text = ""
            tool_uses = []
            total_cost = 0.0
            message_count = 0
            
            async for message in client.receive_response():
                message_count += 1
                
                # Handle different message types
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            result_text += block.text
                            # Stream callback
                            if stream_callback:
                                await stream_callback({
                                    "type": "text",
                                    "content": block.text,
                                    "session_id": session_id
                                })
                        elif isinstance(block, ToolUseBlock):
                            tool_uses.append({
                                "name": block.name,
                                "id": block.id,
                                "input": block.input
                            })
                            if stream_callback:
                                await stream_callback({
                                    "type": "tool_use",
                                    "tool": block.name,
                                    "session_id": session_id
                                })
                
                elif isinstance(message, ResultMessage):
                    # Final result with metadata
                    result_text = message.result
                    total_cost = getattr(message, 'total_cost_usd', 0.0)
                    
                    # Update session with final data
                    if session:
                        session.total_cost_usd += total_cost
                        session.total_tokens += getattr(message, 'total_tokens', 0)
                
                elif isinstance(message, ErrorMessage):
                    # Handle errors
                    error_msg = getattr(message, 'error', str(message))
                    logger.error(f"Claude Code error: {error_msg}")
                    
                    return {
                        "success": False,
                        "error": error_msg,
                        "session_id": session_id,
                        "partial_result": result_text
                    }
            
            # Track files after execution
            files_after = self._get_directory_files(working_directory)
            files_created = list(files_after - files_before)
            files_modified = self._detect_modified_files(working_directory, files_before, files_after)
            
            # Prepare preview content
            preview_content = await self._prepare_preview_content(files_created, working_directory)
            
            # Update session
            if session:
                session.files_created.extend(files_created)
                session.files_modified.extend(files_modified)
                self.session_manager.update_session(session_id)
            
            # Final callback
            if stream_callback:
                await stream_callback({
                    "type": "complete",
                    "session_id": session_id,
                    "files_created": files_created,
                    "total_cost": total_cost
                })
            
            return {
                "success": True,
                "result": result_text,
                "session_id": session_id,
                "files_created": files_created,
                "files_modified": files_modified,
                "preview_content": preview_content,
                "working_directory": working_directory,
                "tool_uses": tool_uses,
                "message_count": message_count,
                "total_cost_usd": total_cost
            }
            
        except CLINotFoundError as e:
            error_msg = "Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
            
        except ProcessError as e:
            logger.error(f"Process error: {e}")
            return {"success": False, "error": str(e), "exit_code": e.exit_code}
            
        except Exception as e:
            logger.error(f"Unexpected error in Claude Code execution: {e}")
            return {"success": False, "error": str(e)}
        
        finally:
            # Cleanup client if not continuing session
            if not continue_conversation and session_id in self.active_clients:
                try:
                    await self.active_clients[session_id].disconnect()
                    del self.active_clients[session_id]
                except:
                    pass
    
    async def stream_execute(
        self,
        prompt: str,
        **kwargs
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream execution with real-time updates
        """
        # Use callback to yield streaming updates
        async def stream_handler(data: Dict[str, Any]):
            # This will be called by execute()
            pass
        
        # Track streamed data
        streamed_data = []
        
        async def collecting_callback(data: Dict[str, Any]):
            streamed_data.append(data)
        
        kwargs['stream_callback'] = collecting_callback
        
        # Start execution in background
        task = asyncio.create_task(self.execute(prompt, **kwargs))
        
        # Yield streamed data as it comes in
        last_index = 0
        while not task.done():
            # Yield new data
            while last_index < len(streamed_data):
                yield streamed_data[last_index]
                last_index += 1
            
            # Small delay to prevent busy waiting
            await asyncio.sleep(0.1)
        
        # Get final result
        result = await task
        
        # Yield any remaining data
        while last_index < len(streamed_data):
            yield streamed_data[last_index]
            last_index += 1
        
        # Yield final result
        yield {
            "type": "final_result",
            "data": result
        }
    
    async def continue_session(
        self,
        session_id: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Continue an existing session"""
        kwargs['session_id'] = session_id
        return await self.execute(prompt, **kwargs)
    
    async def cleanup(self):
        """Cleanup all active clients"""
        for client in self.active_clients.values():
            try:
                await client.disconnect()
            except:
                pass
        self.active_clients.clear()
    
    def _get_directory_files(self, directory: str) -> set:
        """Get all files in a directory"""
        files = set()
        try:
            for root, dirs, filenames in os.walk(directory):
                # Skip hidden directories
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                
                for filename in filenames:
                    if not filename.startswith('.'):
                        rel_path = os.path.relpath(
                            os.path.join(root, filename),
                            directory
                        )
                        files.add(rel_path)
        except Exception as e:
            logger.error(f"Error scanning directory: {e}")
        
        return files
    
    def _detect_modified_files(
        self,
        directory: str,
        files_before: set,
        files_after: set
    ) -> List[str]:
        """Detect modified files by comparing checksums"""
        modified = []
        common_files = files_before & files_after
        
        for file_path in common_files:
            full_path = os.path.join(directory, file_path)
            try:
                # Simple modification detection using mtime
                # In production, use checksums for accuracy
                stat = os.stat(full_path)
                # Check if modified in last minute
                if (datetime.now().timestamp() - stat.st_mtime) < 60:
                    modified.append(file_path)
            except:
                pass
        
        return modified
    
    async def _prepare_preview_content(
        self,
        files_created: List[str],
        working_directory: str
    ) -> Dict[str, Any]:
        """Prepare preview content for created files"""
        preview_data = {
            "html_files": [],
            "preview_available": False,
            "total_files": len(files_created)
        }
        
        # Find HTML files for preview
        html_files = [f for f in files_created if f.endswith(('.html', '.htm'))]
        
        if html_files:
            preview_data["preview_available"] = True
            
            for html_file in html_files[:3]:  # Limit to 3 files
                try:
                    full_path = os.path.join(working_directory, html_file)
                    
                    if os.path.exists(full_path):
                        with open(full_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        preview_data["html_files"].append({
                            "filename": os.path.basename(html_file),
                            "path": html_file,
                            "content": content,
                            "size": len(content)
                        })
                except Exception as e:
                    logger.error(f"Error reading file {html_file}: {e}")
        
        return preview_data


# Global instances
_session_manager = SessionManager()
_agent = ClaudeCodeAgent(_session_manager)

# Public API functions
async def use_claude_code(
    prompt: str,
    working_directory: Optional[str] = None,
    allowed_tools: Optional[List[str]] = None,
    system_prompt: Optional[str] = None,
    permission_mode: str = "acceptEdits",
    max_turns: int = 5,
    session_id: Optional[str] = None,
    continue_conversation: bool = False
) -> Dict[str, Any]:
    """
    Main API function for Claude Code execution
    Compatible with existing codebase
    """
    mode = PermissionMode(permission_mode) if isinstance(permission_mode, str) else permission_mode
    
    return await _agent.execute(
        prompt=prompt,
        working_directory=working_directory,
        allowed_tools=allowed_tools,
        system_prompt=system_prompt,
        permission_mode=mode,
        max_turns=max_turns,
        session_id=session_id,
        continue_conversation=continue_conversation
    )

async def stream_claude_code(
    prompt: str,
    **kwargs
) -> AsyncIterator[Dict[str, Any]]:
    """Stream Claude Code execution"""
    async for message in _agent.stream_execute(prompt, **kwargs):
        yield message

async def continue_claude_code_session(
    session_id: str,
    prompt: str,
    **kwargs
) -> Dict[str, Any]:
    """Continue existing Claude Code session"""
    return await _agent.continue_session(session_id, prompt, **kwargs)

async def list_claude_code_sessions() -> List[Dict[str, Any]]:
    """List all active sessions"""
    return [s.to_dict() for s in _session_manager.sessions.values()]

async def get_claude_code_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Get specific session details"""
    session = _session_manager.get_session(session_id)
    return session.to_dict() if session else None

async def cleanup_claude_code_sessions(max_age_hours: int = 24) -> List[str]:
    """Cleanup old sessions"""
    return _session_manager.cleanup_old_sessions(max_age_hours)

# Compatibility aliases
claude_code_agent = use_claude_code
stream_claude_code_agent = stream_claude_code