"""
Claude Code SDK Production Implementation
Simplified wrapper around the official claude-code-sdk
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional, AsyncIterator, List
from datetime import datetime
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the official SDK
try:
    from claude_code_sdk import query, ClaudeCodeOptions, ClaudeSDKClient
    CLAUDE_CODE_SDK_AVAILABLE = True
except ImportError:
    CLAUDE_CODE_SDK_AVAILABLE = False
    logger.error("Claude Code SDK not installed. Run: pip install claude-code-sdk")

# Default configuration
DEFAULT_SYSTEM_PROMPT = """You are Ron AI's code generation assistant. 
Create functional, well-documented healthcare applications with proper error handling.
Focus on creating complete, working solutions that are ready for production use."""

DEFAULT_ALLOWED_TOOLS = ["Read", "Write", "Edit", "Bash", "Grep", "WebSearch"]

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
    Execute Claude Code with the official SDK
    
    Args:
        prompt: The task or code to generate
        working_directory: Directory to work in
        allowed_tools: List of allowed tools
        system_prompt: Custom system prompt
        permission_mode: How to handle permissions
        max_turns: Maximum conversation turns
        session_id: Existing session to continue
        continue_conversation: Continue most recent conversation
    
    Returns:
        Dict with results, files created, session info, etc.
    """
    
    if not CLAUDE_CODE_SDK_AVAILABLE:
        return {
            "success": False,
            "error": "Claude Code SDK not available. Install with: pip install claude-code-sdk",
            "result": "",
            "files_created": [],
            "session_id": None
        }
    
    try:
        # Set defaults
        working_directory = working_directory or os.getcwd()
        allowed_tools = allowed_tools or DEFAULT_ALLOWED_TOOLS
        system_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
        
        # Track files before execution
        files_before = set()
        if os.path.exists(working_directory):
            for root, dirs, files in os.walk(working_directory):
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                for file in files:
                    if not file.startswith('.'):
                        rel_path = os.path.relpath(os.path.join(root, file), working_directory)
                        files_before.add(rel_path)
        
        # Configure options
        options = ClaudeCodeOptions(
            system_prompt=system_prompt,
            allowed_tools=allowed_tools,
            max_turns=max_turns,
            cwd=working_directory
        )
        
        # Note: permission_mode is not directly supported by CLI
        # The CLI only has --dangerously-skip-permissions flag
        # So we'll ignore permission_mode for now
        
        # Add session handling if needed
        if continue_conversation:
            options.continue_conversation = True
        elif session_id:
            options.resume = session_id
        
        # Execute query and collect results
        result_text = ""
        messages = []
        error_occurred = False
        
        async for message in query(prompt=prompt, options=options):
            messages.append(message)
            
            # Extract text from message
            if hasattr(message, 'content'):
                for block in message.content:
                    if hasattr(block, 'text'):
                        result_text += block.text
            
            # Check for result message
            if type(message).__name__ == "ResultMessage":
                if hasattr(message, 'result'):
                    result_text = message.result
                break
            
            # Check for errors
            if type(message).__name__ == "ErrorMessage":
                error_occurred = True
                if hasattr(message, 'error'):
                    logger.error(f"Claude Code error: {message.error}")
        
        # Track files after execution
        files_after = set()
        if os.path.exists(working_directory):
            for root, dirs, files in os.walk(working_directory):
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                for file in files:
                    if not file.startswith('.'):
                        rel_path = os.path.relpath(os.path.join(root, file), working_directory)
                        files_after.add(rel_path)
        
        files_created = list(files_after - files_before)
        
        # Prepare preview content for HTML files
        preview_content = {}
        html_files = [f for f in files_created if f.endswith(('.html', '.htm'))]
        if html_files:
            preview_content["html_files"] = []
            for html_file in html_files[:3]:  # Limit to 3 files
                try:
                    full_path = os.path.join(working_directory, html_file)
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    preview_content["html_files"].append({
                        "filename": os.path.basename(html_file),
                        "path": html_file,
                        "content": content,
                        "size": len(content)
                    })
                except Exception as e:
                    logger.error(f"Error reading {html_file}: {e}")
            preview_content["preview_available"] = True
        else:
            preview_content["preview_available"] = False
        
        return {
            "success": not error_occurred,
            "result": result_text,
            "files_created": files_created,
            "files_modified": [],
            "preview_content": preview_content,
            "working_directory": working_directory,
            "session_id": session_id or "generated-" + datetime.now().strftime("%Y%m%d-%H%M%S"),
            "message_count": len(messages)
        }
        
    except Exception as e:
        logger.error(f"Error in use_claude_code: {e}")
        return {
            "success": False,
            "error": str(e),
            "result": "",
            "files_created": [],
            "session_id": None
        }

async def stream_claude_code(
    prompt: str,
    **kwargs
) -> AsyncIterator[Dict[str, Any]]:
    """
    Stream Claude Code execution with real-time updates
    """
    if not CLAUDE_CODE_SDK_AVAILABLE:
        yield {
            "type": "error",
            "error": "Claude Code SDK not available"
        }
        return
    
    try:
        working_directory = kwargs.get('working_directory', os.getcwd())
        allowed_tools = kwargs.get('allowed_tools', DEFAULT_ALLOWED_TOOLS)
        system_prompt = kwargs.get('system_prompt', DEFAULT_SYSTEM_PROMPT)
        
        options = ClaudeCodeOptions(
            system_prompt=system_prompt,
            allowed_tools=allowed_tools,
            max_turns=kwargs.get('max_turns', 5),
            cwd=working_directory
        )
        
        message_count = 0
        async for message in query(prompt=prompt, options=options):
            message_count += 1
            
            # Yield different message types
            if hasattr(message, 'content'):
                for block in message.content:
                    if hasattr(block, 'text'):
                        yield {
                            "type": "text",
                            "content": block.text,
                            "message_number": message_count
                        }
                    elif hasattr(block, 'type') and block.type == 'tool_use':
                        yield {
                            "type": "tool_use",
                            "tool": getattr(block, 'name', 'unknown'),
                            "message_number": message_count
                        }
            
            # Check for completion
            if type(message).__name__ == "ResultMessage":
                yield {
                    "type": "complete",
                    "result": getattr(message, 'result', ''),
                    "total_messages": message_count
                }
                break
                
    except Exception as e:
        yield {
            "type": "error",
            "error": str(e)
        }

# Simplified session management using SDK client
class ClaudeCodeSession:
    """Simple session wrapper using SDK client"""
    
    def __init__(self):
        self.client = None
        self.session_id = None
        self.working_directory = None
        
    async def start(self, working_directory: Optional[str] = None, **options):
        """Start a new session"""
        if not CLAUDE_CODE_SDK_AVAILABLE:
            raise RuntimeError("Claude Code SDK not available")
        
        self.working_directory = working_directory or os.getcwd()
        self.session_id = "session-" + datetime.now().strftime("%Y%m%d-%H%M%S")
        
        # Create client with options
        self.client = ClaudeSDKClient(options=ClaudeCodeOptions(**options))
        await self.client.connect()
        
        return self.session_id
    
    async def query(self, prompt: str) -> Dict[str, Any]:
        """Send query to session"""
        if not self.client:
            raise RuntimeError("Session not started")
        
        await self.client.query(prompt)
        
        result_text = ""
        async for message in self.client.receive_response():
            if hasattr(message, 'content'):
                for block in message.content:
                    if hasattr(block, 'text'):
                        result_text += block.text
        
        return {
            "success": True,
            "result": result_text,
            "session_id": self.session_id
        }
    
    async def close(self):
        """Close the session"""
        if self.client:
            await self.client.disconnect()
            self.client = None

# Compatibility functions
async def continue_claude_code_session(
    session_id: str,
    prompt: str,
    **kwargs
) -> Dict[str, Any]:
    """Continue an existing session"""
    kwargs['session_id'] = session_id
    return await use_claude_code(prompt, **kwargs)

async def list_claude_code_sessions() -> List[Dict[str, Any]]:
    """List sessions (placeholder for compatibility)"""
    return []

async def get_claude_code_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Get session details (placeholder for compatibility)"""
    return {
        "id": session_id,
        "created_at": datetime.now().isoformat(),
        "active": False
    }

async def cleanup_claude_code_sessions(max_age_hours: int = 24) -> List[str]:
    """Cleanup sessions (placeholder for compatibility)"""
    return []

# Aliases for backward compatibility
claude_code_agent = use_claude_code
stream_claude_code_agent = stream_claude_code

# Export all functions
__all__ = [
    'use_claude_code',
    'stream_claude_code',
    'continue_claude_code_session',
    'list_claude_code_sessions',
    'get_claude_code_session',
    'cleanup_claude_code_sessions',
    'claude_code_agent',
    'stream_claude_code_agent',
    'ClaudeCodeSession'
]