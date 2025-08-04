"""
Message Stream Handler for Claude Code SDK
Based on documented streaming patterns from research
"""

import asyncio
import logging
from typing import AsyncIterator, Dict, Any, Optional, Callable
from datetime import datetime

# Import based on documented patterns
try:
    from claude_code_sdk import query, ClaudeCodeOptions, Message
    CLAUDE_CODE_SDK_AVAILABLE = True
except ImportError:
    CLAUDE_CODE_SDK_AVAILABLE = False
    logging.warning("Claude Code SDK not available")

logger = logging.getLogger(__name__)


class MessageStreamHandler:
    """Handles streaming messages from Claude Code SDK"""
    
    def __init__(self, live_url_callback: Optional[Callable] = None):
        """
        Initialize handler with optional LiveURL callback
        
        Args:
            live_url_callback: Async function to call when LiveURL should be sent
        """
        self.live_url_callback = live_url_callback
        self.current_session_id = None
        
    async def stream_tool_generation(
        self, 
        prompt: str, 
        options: Optional[ClaudeCodeOptions] = None,
        on_progress: Optional[Callable] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream tool generation progress based on documented patterns
        Yields events for frontend consumption
        """
        if not CLAUDE_CODE_SDK_AVAILABLE:
            yield {
                "type": "error",
                "message": "Claude Code SDK not available",
                "timestamp": datetime.now().isoformat()
            }
            return
        
        try:
            # Start event
            yield {
                "type": "start",
                "message": "Starting tool generation...",
                "timestamp": datetime.now().isoformat()
            }
            
            # Send LiveURL immediately if callback provided
            if self.live_url_callback:
                live_url_data = await self.live_url_callback()
                if live_url_data and live_url_data.get('success'):
                    yield {
                        "type": "live_url",
                        "live_url": live_url_data['live_url'],
                        "session_id": live_url_data['session_id'],
                        "timestamp": datetime.now().isoformat()
                    }
                    self.current_session_id = live_url_data['session_id']
            
            # Progress tracking
            message_count = 0
            total_text = ""
            tool_uses = []
            
            # Stream messages using documented async for pattern
            async for message in query(prompt=prompt, options=options):
                message_count += 1
                
                # Handle message types from actual SDK
                if hasattr(message, 'content'):
                    # AssistantMessage has content with blocks
                    for block in getattr(message.content, '__iter__', lambda: [message.content])():
                        if hasattr(block, 'text'):
                            text = block.text
                            total_text += text
                            
                            # Yield text update
                            yield {
                                "type": "text",
                                "content": text,
                                "total_length": len(total_text),
                                "timestamp": datetime.now().isoformat()
                            }
                            
                            # Call progress callback if provided
                            if on_progress:
                                await on_progress(text)
                
                # Yield progress update every few messages
                if message_count % 3 == 0:
                    yield {
                        "type": "progress",
                        "messages_processed": message_count,
                        "timestamp": datetime.now().isoformat()
                    }
            
            # Final complete event
            yield {
                "type": "complete",
                "total_messages": message_count,
                "total_text_length": len(total_text),
                "tools_used": tool_uses,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Stream error: {str(e)}")
            yield {
                "type": "error",
                "error": "unknown",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def handle_tool_result(self, tool_name: str, result: Any) -> Dict[str, Any]:
        """
        Handle tool execution results
        Based on documented tool_result patterns
        """
        return {
            "type": "tool_result",
            "tool": tool_name,
            "success": not isinstance(result, Exception),
            "result": str(result),
            "timestamp": datetime.now().isoformat()
        }
    
    def create_progress_handler(self, stages: list) -> Callable:
        """
        Create a progress handler that updates based on content
        Returns async function for progress callbacks
        """
        current_stage = 0
        
        async def handler(text: str):
            nonlocal current_stage
            
            # Simple keyword-based stage detection
            keywords = {
                "analyzing": "Analyzing requirements",
                "personalizing": "Personalizing for patient",
                "building": "Building components",
                "optimizing": "Optimizing for mobile",
                "finalizing": "Finalizing tool"
            }
            
            for keyword, stage_name in keywords.items():
                if keyword in text.lower() and current_stage < len(stages):
                    stages[current_stage] = {
                        "name": stage_name,
                        "completed": True,
                        "timestamp": datetime.now().isoformat()
                    }
                    current_stage += 1
                    break
        
        return handler


# Global instance
message_handler = MessageStreamHandler() if CLAUDE_CODE_SDK_AVAILABLE else None