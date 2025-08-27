"""
Claude Code SDK Tool - Proper implementation using the real SDK
"""

from typing import Dict, Any, List, Optional, AsyncGenerator
import logging
import json
import asyncio
import os
from datetime import datetime
from claude_code_sdk import query, ClaudeCodeOptions

logger = logging.getLogger(__name__)

# Session storage for maintaining conversation context
_claude_code_sessions: Dict[str, Dict[str, Any]] = {}

async def use_claude_code(
    prompt: str, 
    max_turns: int = 5,
    session_id: Optional[str] = None,
    continue_session: bool = False,
    mode: str = "create"
) -> Dict[str, Any]:
    """
    Execute a task using Claude Code SDK with multi-turn support
    
    Args:
        prompt: The task/prompt to execute
        max_turns: Maximum conversation turns (default 5)
        session_id: Optional session ID for continuing conversations
        continue_session: Whether to continue an existing session
        mode: Mode of operation (create, test, debug, deploy)
    
    Returns:
        Dict with result, files created, and session information
    """
    try:
        import uuid
        
        # Initialize session
        if session_id and continue_session and session_id in _claude_code_sessions:
            session = _claude_code_sessions[session_id]
            logger.info(f"Continuing session {session_id}")
        else:
            session_id = session_id or str(uuid.uuid4())
            session = {
                'id': session_id,
                'history': [],
                'files_created': [],
                'files_modified': [],
                'console_outputs': [],
                'created_at': datetime.now().isoformat(),
                'mode': mode
            }
            _claude_code_sessions[session_id] = session
            logger.info(f"Created new session {session_id} in {mode} mode")
        
        # Configure options
        options = ClaudeCodeOptions(
            max_turns=max_turns,
            allowed_tools=["Write", "Read", "Edit", "MultiEdit", "Bash", "WebSearch", "Grep", "Glob", "LS"],
            permission_mode="acceptEdits",
            output_format="stream-json"  # Use stream-json to get detailed messages
        )
        
        # If resuming, use the resume option
        if session_id and continue_session:
            options.resume = session_id
        
        # Collect all messages and track file operations
        messages = []
        result_text = ""
        files_created = []
        files_modified = []
        console_outputs = []
        total_cost = 0
        
        # Use the query function to execute
        async for message in query(prompt=prompt, options=options):
            messages.append(message)
            
            # Handle different message types according to the schema
            if message.get('type') == 'assistant':
                # Assistant message contains the actual response
                assistant_msg = message.get('message', {})
                
                # Extract content from assistant message
                if 'content' in assistant_msg:
                    for content_block in assistant_msg.get('content', []):
                        # Handle text content
                        if content_block.get('type') == 'text':
                            result_text += content_block.get('text', '')
                        
                        # Handle tool use (file operations)
                        elif content_block.get('type') == 'tool_use':
                            tool_name = content_block.get('name', '')
                            tool_input = content_block.get('input', {})
                            
                            # Track Write operations (new files)
                            if tool_name == 'str_replace_based_edit_tool':
                                # This is the actual tool name used by Claude Code for file edits
                                file_path = tool_input.get('command', '').split()[1] if tool_input.get('command', '').startswith('create') else None
                                if file_path:
                                    # Read the actual file content after creation
                                    try:
                                        file_content = tool_input.get('file_text', '')
                                        files_created.append({
                                            'path': file_path,
                                            'content': file_content,
                                            'language': _detect_language(file_path)
                                        })
                                    except:
                                        pass
                            
                            # Track actual Write tool
                            elif tool_name == 'Write':
                                file_path = tool_input.get('file_path', '')
                                content = tool_input.get('content', '')
                                if file_path and content:
                                    files_created.append({
                                        'path': file_path,
                                        'content': content,
                                        'language': _detect_language(file_path)
                                    })
                                    logger.info(f"Claude Code created file: {file_path}")
                            
                            # Track Edit operations
                            elif tool_name in ['Edit', 'MultiEdit']:
                                file_path = tool_input.get('file_path', '')
                                if file_path:
                                    files_modified.append(file_path)
                                    logger.info(f"Claude Code modified file: {file_path}")
                            
                            # Track Bash command outputs
                            elif tool_name == 'Bash':
                                command = tool_input.get('command', '')
                                console_outputs.append({
                                    'command': command,
                                    'output': ''  # Will be filled by tool result
                                })
            
            # Handle tool results
            elif message.get('type') == 'tool_result':
                # Tool results contain output from executed tools
                tool_output = message.get('output', '')
                if console_outputs and not console_outputs[-1]['output']:
                    console_outputs[-1]['output'] = tool_output
            
            # Handle result message (final summary)
            elif message.get('type') == 'result':
                # This is the final result
                if message.get('subtype') == 'success':
                    result_text = message.get('result', result_text)
                    total_cost = message.get('total_cost_usd', 0)
                    session['id'] = message.get('session_id', session_id)
        
        # Update session history
        session['history'].append({
            'role': 'user',
            'content': prompt,
            'timestamp': datetime.now().isoformat()
        })
        session['history'].append({
            'role': 'assistant',
            'content': result_text,
            'timestamp': datetime.now().isoformat()
        })
        session['files_created'].extend(files_created)
        session['files_modified'].extend(files_modified)
        session['console_outputs'].extend(console_outputs)
        
        return {
            "success": True,
            "result": result_text or "Task completed",
            "session_id": session['id'],
            "files_created": files_created,
            "files_modified": files_modified,
            "console_outputs": console_outputs,
            "cost": total_cost,
            "turns_used": len([h for h in session['history'] if h['role'] == 'user']),
            "can_continue": len([h for h in session['history'] if h['role'] == 'user']) < max_turns
        }
        
    except Exception as e:
        logger.error(f"Claude Code error: {e}")
        return {
            "success": False,
            "error": str(e),
            "session_id": session_id,
            "files_created": [],
            "files_modified": [],
            "console_outputs": []
        }

def _detect_language(file_path: str) -> str:
    """Detect language from file extension"""
    ext_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript', 
        '.tsx': 'typescript',
        '.html': 'html',
        '.css': 'css',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.md': 'markdown',
        '.sh': 'bash',
        '.sql': 'sql',
        '.go': 'go',
        '.rs': 'rust',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.hpp': 'cpp',
        '.rb': 'ruby',
        '.php': 'php',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.r': 'r',
        '.R': 'r',
        '.lua': 'lua',
        '.pl': 'perl',
        '.scala': 'scala',
        '.dart': 'dart',
        '.xml': 'xml',
        '.vue': 'vue',
        '.svelte': 'svelte'
    }
    
    import os
    _, ext = os.path.splitext(file_path.lower())
    return ext_map.get(ext, 'text')

async def stream_claude_code(
    prompt: str,
    session_id: Optional[str] = None,
    continue_session: bool = False,
    mode: str = "create"
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Stream Claude Code responses for real-time updates
    
    Yields events with types:
    - text: Explanatory text from Claude Code
    - file_create: File creation event
    - file_modify: File modification event
    - console: Console output from commands
    - status: Status updates
    - complete: Final completion event
    """
    try:
        import uuid
        
        # Get or create session
        if session_id and continue_session and session_id in _claude_code_sessions:
            session = _claude_code_sessions[session_id]
        else:
            session_id = session_id or str(uuid.uuid4())
            session = {
                'id': session_id,
                'history': [],
                'files_created': [],
                'files_modified': [],
                'current_directory': '.',
                'created_at': datetime.now().isoformat(),
                'mode': mode
            }
            _claude_code_sessions[session_id] = session
        
        # Yield initial status
        yield {
            'type': 'status',
            'content': 'Starting Claude Code session...',
            'session_id': session_id
        }
        
        # Configure options for streaming
        options = ClaudeCodeOptions(
            max_turns=1,
            allowed_tools=["Write", "Read", "Edit", "MultiEdit", "Bash", "WebSearch", "Grep", "Glob", "LS"],
            permission_mode="acceptEdits",
            output_format="stream-json"
        )
        
        # Stream messages
        async for message in query(prompt=prompt, options=options):
            if message.get('type') == 'assistant':
                # Stream text content
                assistant_msg = message.get('message', {})
                if 'content' in assistant_msg:
                    for content_block in assistant_msg.get('content', []):
                        if content_block.get('type') == 'text':
                            yield {
                                'type': 'text',
                                'content': content_block.get('text', ''),
                                'session_id': session_id
                            }
                        elif content_block.get('type') == 'tool_use':
                            tool_name = content_block.get('name', '')
                            tool_input = content_block.get('input', {})
                            
                            if tool_name == 'Write':
                                file_path = tool_input.get('file_path', '')
                                content = tool_input.get('content', '')
                                if file_path:
                                    yield {
                                        'type': 'file_create',
                                        'path': file_path,
                                        'content': content,
                                        'language': _detect_language(file_path),
                                        'session_id': session_id
                                    }
                            elif tool_name in ['Edit', 'MultiEdit']:
                                file_path = tool_input.get('file_path', '')
                                if file_path:
                                    yield {
                                        'type': 'file_modify',
                                        'path': file_path,
                                        'session_id': session_id
                                    }
                            elif tool_name == 'Bash':
                                command = tool_input.get('command', '')
                                yield {
                                    'type': 'console',
                                    'command': command,
                                    'output': '',
                                    'session_id': session_id
                                }
            
            elif message.get('type') == 'result':
                # Final completion
                yield {
                    'type': 'complete',
                    'success': message.get('subtype') == 'success',
                    'result': message.get('result', ''),
                    'cost': message.get('total_cost_usd', 0),
                    'session_id': session_id
                }
                
    except Exception as e:
        yield {
            'type': 'error',
            'content': str(e),
            'session_id': session_id
        }

# Additional helper functions
def list_claude_code_sessions() -> List[Dict[str, Any]]:
    """List all active Claude Code sessions"""
    return [
        {
            'id': session['id'],
            'created_at': session.get('created_at'),
            'mode': session.get('mode', 'create'),
            'files_created': len(session.get('files_created', [])),
            'turns_used': len([h for h in session.get('history', []) if h['role'] == 'user'])
        }
        for session in _claude_code_sessions.values()
    ]

def get_claude_code_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Get details of a specific session"""
    return _claude_code_sessions.get(session_id)

def clear_claude_code_sessions():
    """Clear all sessions (for cleanup)"""
    _claude_code_sessions.clear()