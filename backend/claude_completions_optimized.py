import anthropic
import os
from typing import List, Dict, Any, Optional, AsyncGenerator
import json
import logging

logger = logging.getLogger(__name__)

class OptimizedClaudeCompletions:
    """
    Optimized Claude Completions handler with simplified prompts.
    Based on browser-use documentation best practices.
    """
    
    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
            
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"
        
        # Simplified, focused system prompt based on browser-use agent documentation
        self.default_system_prompt = """You are Ron AI, a healthcare assistant helping patients save on medications.

Core capabilities:
- Find lowest medication prices using web search
- Enroll in assistance programs using browser automation
- Navigate insurance and pharmacy websites
- Provide clear, actionable cost-saving recommendations

Browser usage:
- Use ONE browser session at a time (system enforces this)
- Browser sessions are automatically reused for efficiency
- Use browser_use tool for form filling and website navigation

Be concise, accurate, and focused on tangible cost savings."""
    
    async def stream_complete(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 8192,  # Reduced from 32000 for efficiency
        temperature: float = 0.7,  # Slightly reduced for more focused responses
        enable_thinking: bool = True,
        thinking_budget: int = 5000,  # Reduced from 20000
        tools: Optional[List[Any]] = None,
        custom_tools: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Optimized streaming completion with reduced complexity.
        """
        try:
            # Prepare the request
            request_params = {
                "model": self.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "betas": ["web-search-2025-03-05"]
            }
            
            # Use simplified system prompt
            request_params["system"] = system_prompt if system_prompt else self.default_system_prompt
            
            # Add thinking with reduced budget
            if enable_thinking:
                request_params["thinking"] = {
                    "type": "enabled",
                    "budget_tokens": thinking_budget
                }
            
            # Handle tools efficiently
            if tools or custom_tools:
                tool_list = []
                
                # Add native tools
                if tools:
                    for tool in tools:
                        if isinstance(tool, str):
                            if tool == "bash":
                                tool_list.append({"type": "bash_20250124", "name": "bash"})
                            elif tool == "text_editor":
                                tool_list.append({"type": "text_editor_20250728", "name": "str_replace_based_edit_tool"})
                            elif tool == "web_search":
                                tool_list.append({"name": "web_search", "type": "web_search_20250305"})
                
                # Add custom tools
                if custom_tools:
                    tool_list.extend(custom_tools)
                
                if tool_list:
                    request_params["tools"] = tool_list
            
            # Stream with simplified event handling
            with self.client.beta.messages.stream(**request_params) as stream:
                for event in stream:
                    if hasattr(event, 'type'):
                        # Simplified event handling - only essential events
                        if event.type == 'message_start':
                            yield {
                                'type': 'message_start',
                                'message': {
                                    'id': getattr(event.message, 'id', ''),
                                    'role': 'assistant',
                                    'model': self.model
                                }
                            }
                        elif event.type == 'content_block_delta':
                            yield {
                                'type': 'content_block_delta',
                                'index': 0,
                                'delta': {
                                    'type': 'text_delta',
                                    'text': getattr(event.delta, 'text', '')
                                }
                            }
                        elif event.type == 'message_stop':
                            yield {'type': 'message_stop'}
                            
        except Exception as e:
            logger.error(f"Error in stream_complete: {str(e)}")
            yield {'type': 'error', 'error': str(e)}
    
    async def complete(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 8192,
        temperature: float = 0.7,
        enable_thinking: bool = True,
        thinking_budget: int = 5000,
        tools: Optional[List[Any]] = None,
        custom_tools: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Optimized non-streaming completion.
        """
        try:
            request_params = {
                "model": self.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "betas": ["web-search-2025-03-05"]
            }
            
            request_params["system"] = system_prompt if system_prompt else self.default_system_prompt
            
            if enable_thinking:
                request_params["thinking"] = {
                    "type": "enabled",
                    "budget_tokens": thinking_budget
                }
            
            # Handle tools
            if tools or custom_tools:
                tool_list = []
                if tools:
                    for tool in tools:
                        if isinstance(tool, str):
                            if tool == "bash":
                                tool_list.append({"type": "bash_20250124", "name": "bash"})
                            elif tool == "text_editor":
                                tool_list.append({"type": "text_editor_20250728", "name": "str_replace_based_edit_tool"})
                            elif tool == "web_search":
                                tool_list.append({"name": "web_search", "type": "web_search_20250305"})
                
                if custom_tools:
                    tool_list.extend(custom_tools)
                
                if tool_list:
                    request_params["tools"] = tool_list
            
            # Create message
            message = self.client.beta.messages.create(**request_params)
            
            # Return simplified response
            return {
                "id": message.id,
                "type": "message",
                "role": message.role,
                "content": [
                    {
                        "type": "text",
                        "text": block.text if hasattr(block, 'text') else str(block)
                    }
                    for block in message.content
                ],
                "model": message.model,
                "stop_reason": message.stop_reason,
                "usage": {
                    "input_tokens": message.usage.input_tokens,
                    "output_tokens": message.usage.output_tokens
                }
            }
            
        except Exception as e:
            logger.error(f"Error in complete: {str(e)}")
            raise