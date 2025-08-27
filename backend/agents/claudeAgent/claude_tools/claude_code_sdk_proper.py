"""
Claude Code SDK Integration - Proper implementation following official SDK documentation
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, AsyncGenerator
from claude_code_sdk import (
    ClaudeSDKClient,
    ClaudeCodeOptions,
    query
)

logger = logging.getLogger(__name__)

# Session storage for conversation persistence
_sessions: Dict[str, Dict[str, Any]] = {}


def clear_claude_code_sessions():
    """Clear all Claude Code sessions to prevent memory leaks"""
    global _sessions
    count = len(_sessions)
    _sessions.clear()
    logger.info(f"Cleared {count} Claude Code sessions")


async def use_claude_code(
    prompt: str,
    max_turns: int = 5,
    session_id: Optional[str] = None,
    continue_session: bool = False,
    mode: str = "create",
    system_prompt_append: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute a task using the official Claude Code SDK
    
    Args:
        prompt: The task/prompt to execute
        max_turns: Maximum conversation turns (default 5)
        session_id: Optional session ID for continuing conversations
        continue_session: Whether to continue an existing session
        mode: Mode of operation (create, test, debug, plan, deploy)
        system_prompt_append: Additional system prompt instructions
    
    Returns:
        Dict with result, files created/modified, and session information
    """
    try:
        # Initialize or retrieve session
        if session_id and continue_session and session_id in _sessions:
            session = _sessions[session_id]
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
            _sessions[session_id] = session
            logger.info(f"Created new session {session_id} in {mode} mode")
        
        # Build system prompt
        base_prompt = "You are a helpful AI assistant that can write code, create files, and execute commands."
        if system_prompt_append:
            full_system_prompt = f"{base_prompt}\n\n{system_prompt_append}"
        else:
            full_system_prompt = base_prompt
        
        # Configure Claude Code options
        options_dict = {
            'system_prompt': full_system_prompt,
            'max_turns': max_turns,
            'allowed_tools': [
                "Write", "Read", "Edit", "MultiEdit", 
                "Bash", "WebSearch", "Grep", "Glob", 
                "LS", "TodoWrite"
            ]
        }
        
        # Set permission mode based on operation mode
        if mode == "plan":
            options_dict['permission_mode'] = "plan"
        elif mode == "deploy":
            options_dict['permission_mode'] = "bypassPermissions"
        else:
            options_dict['permission_mode'] = "acceptEdits"
        
        # Add session continuation if needed
        if continue_session and session_id in _sessions:
            # Continue the conversation
            options_dict['resume'] = session_id
        
        options = ClaudeCodeOptions(**options_dict)
        
        # Execute using ClaudeSDKClient for streaming
        files_created = []
        files_modified = []
        console_outputs = []
        result_text = ""
        total_cost = 0
        
        async with ClaudeSDKClient(options=options) as client:
            # Send the query
            await client.query(prompt)
            
            # Collect responses
            async for message in client.receive_response():
                # Process content blocks
                if hasattr(message, 'content'):
                    for block in message.content:
                        # Handle text content
                        if hasattr(block, 'text'):
                            result_text += block.text
                        
                        # Handle tool use
                        if hasattr(block, 'type') and block.type == 'tool_use':
                            tool_name = getattr(block, 'name', '')
                            
                            # Track file operations
                            if tool_name == 'Write':
                                input_data = json.loads(block.input) if isinstance(block.input, str) else block.input
                                file_path = input_data.get('file_path', '')
                                content = input_data.get('content', '')
                                if file_path:
                                    files_created.append({
                                        'path': file_path,
                                        'content': content,
                                        'language': _detect_language(file_path)
                                    })
                                    logger.info(f"Created file: {file_path}")
                            
                            elif tool_name in ['Edit', 'MultiEdit']:
                                input_data = json.loads(block.input) if isinstance(block.input, str) else block.input
                                file_path = input_data.get('file_path', '')
                                if file_path:
                                    files_modified.append(file_path)
                                    logger.info(f"Modified file: {file_path}")
                            
                            elif tool_name == 'Bash':
                                input_data = json.loads(block.input) if isinstance(block.input, str) else block.input
                                command = input_data.get('command', '')
                                console_outputs.append({
                                    'command': command,
                                    'output': ''
                                })
                
                # Check for result message
                if hasattr(message, '__class__') and message.__class__.__name__ == 'ResultMessage':
                    if hasattr(message, 'result'):
                        result_text = message.result
                    if hasattr(message, 'total_cost_usd'):
                        total_cost = message.total_cost_usd
                    if hasattr(message, 'session_id'):
                        session['id'] = message.session_id
        
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
            "result": result_text or "Task completed successfully",
            "session_id": session['id'],
            "files_created": files_created,
            "files_modified": files_modified,
            "console_outputs": console_outputs,
            "cost": total_cost,
            "turns_used": len([h for h in session['history'] if h['role'] == 'user']),
            "can_continue": True,
            "thinking_text": thinking_text if 'thinking_text' in locals() else "",
            "all_outputs": all_outputs if 'all_outputs' in locals() else []
        }
        
    except ImportError as e:
        logger.error(f"Claude Code SDK not installed: {e}")
        return {
            "success": False,
            "error": "Claude Code SDK not installed. Run: pip install claude-code-sdk",
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Claude Code execution error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "session_id": session_id,
            "files_created": [],
            "files_modified": [],
            "console_outputs": []
        }


async def stream_claude_code(
    prompt: str,
    session_id: Optional[str] = None,
    continue_session: bool = False,
    mode: str = "create",
    system_prompt_append: Optional[str] = None
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Stream Claude Code responses for real-time updates using the SDK
    
    Yields events with types:
    - status: Status updates
    - text: Streaming text content
    - file_create: File creation event
    - file_modify: File modification event  
    - console: Console output from commands
    - complete: Final completion event
    """
    try:
        # Get or create session
        if session_id and continue_session and session_id in _sessions:
            session = _sessions[session_id]
        else:
            session_id = session_id or str(uuid.uuid4())
            session = {
                'id': session_id,
                'history': [],
                'files_created': [],
                'files_modified': [],
                'created_at': datetime.now().isoformat(),
                'mode': mode
            }
            _sessions[session_id] = session
        
        # Yield initial status
        yield {
            'type': 'status',
            'content': f'Starting Claude Code session in {mode} mode...',
            'session_id': session_id
        }
        
        # Build system prompt
        base_prompt = "You are a helpful AI assistant that can write code, create files, and execute commands."
        if system_prompt_append:
            full_system_prompt = f"{base_prompt}\n\n{system_prompt_append}"
        else:
            full_system_prompt = base_prompt
        
        # Configure options for streaming
        options_dict = {
            'system_prompt': full_system_prompt,
            'max_turns': 1,  # Single turn for streaming
            'allowed_tools': [
                "Write", "Read", "Edit", "MultiEdit",
                "Bash", "WebSearch", "Grep", "Glob",
                "LS", "TodoWrite"
            ]
        }
        
        if mode == "plan":
            options_dict['permission_mode'] = "plan"
        else:
            options_dict['permission_mode'] = "acceptEdits"
        
        options = ClaudeCodeOptions(**options_dict)
        
        # Stream using ClaudeSDKClient
        async with ClaudeSDKClient(options=options) as client:
            await client.query(prompt)
            
            async for message in client.receive_response():
                # Stream text content
                if hasattr(message, 'content'):
                    for block in message.content:
                        if hasattr(block, 'text'):
                            yield {
                                'type': 'text',
                                'content': block.text,
                                'session_id': session_id
                            }
                        
                        # Handle tool use events
                        if hasattr(block, 'type') and block.type == 'tool_use':
                            tool_name = getattr(block, 'name', '')
                            
                            if tool_name == 'Write':
                                input_data = json.loads(block.input) if isinstance(block.input, str) else block.input
                                file_path = input_data.get('file_path', '')
                                content = input_data.get('content', '')
                                if file_path:
                                    yield {
                                        'type': 'file_create',
                                        'path': file_path,
                                        'content': content,
                                        'language': _detect_language(file_path),
                                        'session_id': session_id
                                    }
                            
                            elif tool_name in ['Edit', 'MultiEdit']:
                                input_data = json.loads(block.input) if isinstance(block.input, str) else block.input
                                file_path = input_data.get('file_path', '')
                                if file_path:
                                    yield {
                                        'type': 'file_modify',
                                        'path': file_path,
                                        'session_id': session_id
                                    }
                            
                            elif tool_name == 'Bash':
                                input_data = json.loads(block.input) if isinstance(block.input, str) else block.input
                                command = input_data.get('command', '')
                                yield {
                                    'type': 'console',
                                    'command': command,
                                    'output': '',
                                    'session_id': session_id
                                }
                
                # Check for completion
                if hasattr(message, '__class__') and message.__class__.__name__ == 'ResultMessage':
                    yield {
                        'type': 'complete',
                        'success': True,
                        'result': getattr(message, 'result', ''),
                        'cost': getattr(message, 'total_cost_usd', 0),
                        'session_id': session_id
                    }
                    
    except Exception as e:
        yield {
            'type': 'error',
            'content': str(e),
            'session_id': session_id
        }


def _detect_language(file_path: str) -> str:
    """Detect programming language from file extension"""
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
        '.svelte': 'svelte',
        '.tex': 'latex',
        '.dockerfile': 'dockerfile',
        '.Dockerfile': 'dockerfile',
        '.makefile': 'makefile',
        '.Makefile': 'makefile',
        '.cmake': 'cmake',
        '.gradle': 'gradle',
        '.toml': 'toml',
        '.ini': 'ini',
        '.conf': 'conf',
        '.cfg': 'cfg'
    }
    
    import os
    _, ext = os.path.splitext(file_path.lower())
    
    # Check for special files without extensions
    base_name = os.path.basename(file_path).lower()
    if base_name in ['dockerfile', 'makefile', 'cmakelists.txt']:
        return base_name.replace('.txt', '').replace('lists', '')
    
    return ext_map.get(ext, 'text')


# Helper functions for session management
def list_claude_code_sessions() -> List[Dict[str, Any]]:
    """List all active Claude Code sessions"""
    return [
        {
            'id': session['id'],
            'created_at': session.get('created_at'),
            'mode': session.get('mode', 'create'),
            'files_created': len(session.get('files_created', [])),
            'files_modified': len(session.get('files_modified', [])),
            'turns_used': len([h for h in session.get('history', []) if h['role'] == 'user'])
        }
        for session in _sessions.values()
    ]


def get_claude_code_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Get details of a specific Claude Code session"""
    return _sessions.get(session_id)


def clear_claude_code_sessions():
    """Clear all sessions (for cleanup)"""
    _sessions.clear()
    logger.info("All Claude Code sessions cleared")


async def continue_claude_code_session(
    session_id: str,
    prompt: str,
    max_turns: int = 3
) -> Dict[str, Any]:
    """
    Continue an existing Claude Code session
    
    Args:
        session_id: The session ID to continue
        prompt: The new prompt to execute
        max_turns: Maximum additional turns
    
    Returns:
        Dict with result and updated session information
    """
    if session_id not in _sessions:
        return {
            "success": False,
            "error": f"Session {session_id} not found",
            "session_id": session_id
        }
    
    return await use_claude_code(
        prompt=prompt,
        max_turns=max_turns,
        session_id=session_id,
        continue_session=True,
        mode=_sessions[session_id].get('mode', 'create')
    )


async def execute_claude_code_plan(
    prompt: str,
    max_turns: int = 2
) -> Dict[str, Any]:
    """
    Execute Claude Code in plan mode (analyze without modifications)
    
    Args:
        prompt: The analysis/planning prompt
        max_turns: Maximum conversation turns
    
    Returns:
        Dict with analysis result
    """
    return await use_claude_code(
        prompt=prompt,
        max_turns=max_turns,
        mode="plan"
    )


# Specialized agent functions
async def create_sre_agent(
    incident_description: str,
    severity: str = "medium"
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Create an SRE incident response agent
    
    Args:
        incident_description: Description of the incident
        severity: Incident severity (low, medium, high, critical)
    
    Yields:
        Streaming diagnosis and remediation steps
    """
    prompt = f"Incident: {incident_description} (Severity: {severity})"
    system_prompt = """You are an SRE expert. When investigating incidents:
1. Diagnose the root cause systematically
2. Assess the impact on users and systems
3. Provide immediate action items for mitigation
4. Suggest long-term fixes to prevent recurrence
5. Include monitoring and alerting recommendations"""
    
    async for event in stream_claude_code(
        prompt=prompt,
        mode="create",
        system_prompt_append=system_prompt
    ):
        yield event


async def create_security_review_agent(
    code_or_path: str,
    review_type: str = "comprehensive"
) -> Dict[str, Any]:
    """
    Create a security review agent
    
    Args:
        code_or_path: Code to review or path to file/directory
        review_type: Type of review (quick, comprehensive, compliance)
    
    Returns:
        Security review results with findings and recommendations
    """
    if review_type == "compliance":
        system_prompt = """You are a security compliance expert. Review code for:
- OWASP Top 10 vulnerabilities
- PCI DSS compliance if payment processing detected
- GDPR compliance for data handling
- SOC 2 requirements
- Industry-specific regulations"""
    else:
        system_prompt = """You are a security engineer. Review code for:
- Injection vulnerabilities (SQL, NoSQL, Command, etc.)
- Authentication and session management issues
- Sensitive data exposure
- Security misconfigurations
- Vulnerable dependencies
- Input validation issues"""
    
    prompt = f"Perform a {review_type} security review of: {code_or_path}"
    
    return await use_claude_code(
        prompt=prompt,
        max_turns=3,
        mode="plan",  # Use plan mode for reviews
        system_prompt_append=system_prompt
    )


async def create_legal_document_agent(
    document: str,
    action: str = "review"
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Create a legal document review agent
    
    Args:
        document: Document content or path to document
        action: Action to perform (review, summarize, redline, compliance)
    
    Yields:
        Streaming legal analysis
    """
    action_prompts = {
        "review": "Review this document for legal issues, risks, and recommendations",
        "summarize": "Create an executive summary highlighting key terms and obligations",
        "redline": "Suggest edits and improvements to protect our interests",
        "compliance": "Check for regulatory compliance and identify gaps"
    }
    
    prompt = f"{action_prompts.get(action, action)}: {document}"
    system_prompt = """You are a corporate lawyer specializing in technology contracts.
Focus on:
- Liability and indemnification clauses
- Intellectual property rights
- Data privacy and security provisions
- Termination conditions
- Payment terms and penalties
- Warranty and service level agreements"""
    
    async for event in stream_claude_code(
        prompt=prompt,
        mode="plan",
        system_prompt_append=system_prompt
    ):
        yield event