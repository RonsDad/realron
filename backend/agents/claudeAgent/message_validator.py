"""
Message Validation for Anthropic API
Ensures messages comply with Anthropic's requirements
"""

import logging
from typing import List, Dict, Any, Tuple, Optional
from .anthropic_config import AnthropicConfig

logger = logging.getLogger(__name__)

class MessageValidationError(Exception):
    """Raised when message validation fails"""
    pass

class AnthropicMessageValidator:
    """Validates messages before sending to Anthropic API"""
    
    @staticmethod
    def validate_role_alternation(messages: List[Dict[str, Any]]) -> Tuple[bool, Optional[str]]:
        """
        Validate that messages alternate between user and assistant roles.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not messages:
            return False, "Messages list is empty"
        
        # First message should be from user (unless it's a tool result continuation)
        if messages[0]["role"] not in ["user", "system"]:
            # Check if it's a continuation with tool results
            if not (messages[0]["role"] == "assistant" and 
                   len(messages) > 1 and 
                   messages[1]["role"] == "user" and 
                   "tool_result" in str(messages[1].get("content", ""))):
                return False, "First message must be from user (or system)"
        
        # Check alternation
        last_role = None
        for i, msg in enumerate(messages):
            role = msg.get("role")
            
            if role not in ["user", "assistant", "system"]:
                return False, f"Invalid role '{role}' at message {i}"
            
            # System messages can appear anywhere
            if role == "system":
                continue
            
            # Check for consecutive same roles (except system)
            if last_role == role:
                # Exception: assistant with tool_use followed by user with tool_result is valid
                if not (role == "user" and 
                       i > 0 and 
                       _is_tool_result_message(msg) and
                       _has_tool_use(messages[i-1])):
                    return False, f"Consecutive {role} messages at position {i}"
            
            last_role = role
        
        return True, None
    
    @staticmethod
    def validate_message_content(message: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Validate individual message content structure.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if "role" not in message:
            return False, "Message missing 'role' field"
        
        if "content" not in message:
            return False, "Message missing 'content' field"
        
        role = message["role"]
        content = message["content"]
        
        # Validate content based on role
        if role == "user":
            if isinstance(content, list):
                # Check for valid content blocks
                for block in content:
                    if not isinstance(block, dict):
                        return False, "User content blocks must be dictionaries"
                    
                    if "type" not in block:
                        return False, "Content block missing 'type' field"
                    
                    # Validate block types
                    if block["type"] == "text":
                        if "text" not in block:
                            return False, "Text block missing 'text' field"
                    elif block["type"] == "image":
                        if "source" not in block:
                            return False, "Image block missing 'source' field"
                    elif block["type"] == "tool_result":
                        if "tool_use_id" not in block:
                            return False, "Tool result missing 'tool_use_id'"
                        if "content" not in block:
                            return False, "Tool result missing 'content'"
            elif not isinstance(content, str):
                return False, "User content must be string or list of blocks"
        
        elif role == "assistant":
            if isinstance(content, list):
                for block in content:
                    if not isinstance(block, dict):
                        return False, "Assistant content blocks must be dictionaries"
                    
                    if "type" not in block:
                        return False, "Content block missing 'type' field"
                    
                    # Validate assistant block types
                    if block["type"] == "text":
                        if "text" not in block:
                            return False, "Text block missing 'text' field"
                    elif block["type"] == "tool_use":
                        if "id" not in block:
                            return False, "Tool use missing 'id'"
                        if "name" not in block:
                            return False, "Tool use missing 'name'"
                        if "input" not in block:
                            return False, "Tool use missing 'input'"
                        # Input must be a dict
                        if not isinstance(block["input"], dict):
                            return False, "Tool use 'input' must be a dictionary"
            elif not isinstance(content, str):
                return False, "Assistant content must be string or list of blocks"
        
        return True, None
    
    @staticmethod
    def validate_messages(messages: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Comprehensive message validation.
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Check role alternation
        valid, error = AnthropicMessageValidator.validate_role_alternation(messages)
        if not valid:
            errors.append(f"Role alternation error: {error}")
        
        # Validate each message
        for i, msg in enumerate(messages):
            valid, error = AnthropicMessageValidator.validate_message_content(msg)
            if not valid:
                errors.append(f"Message {i} validation error: {error}")
        
        # Check message count
        config = AnthropicConfig()
        if len(messages) > config.MESSAGE_VALIDATION["max_messages_per_request"]:
            errors.append(f"Too many messages: {len(messages)} > {config.MESSAGE_VALIDATION['max_messages_per_request']}")
        
        # Check message sizes
        for i, msg in enumerate(messages):
            content_str = str(msg.get("content", ""))
            if len(content_str) > config.MESSAGE_VALIDATION["max_message_length"]:
                errors.append(f"Message {i} too long: {len(content_str)} chars")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def fix_message_alternation(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Attempt to fix message alternation issues.
        
        Returns:
            Fixed messages list
        """
        if not messages:
            return messages
        
        fixed = []
        last_role = None
        
        for msg in messages:
            role = msg["role"]
            
            # Always include system messages
            if role == "system":
                fixed.append(msg)
                continue
            
            # Skip consecutive same roles (except for tool results)
            if role == last_role:
                if role == "user" and _is_tool_result_message(msg):
                    # Tool results can follow tool use
                    fixed.append(msg)
                else:
                    logger.warning(f"Skipping consecutive {role} message")
                    continue
            else:
                fixed.append(msg)
                last_role = role
        
        # Ensure first message is from user
        if fixed and fixed[0]["role"] == "assistant":
            fixed.insert(0, {
                "role": "user",
                "content": "Continue from where we left off."
            })
        
        return fixed
    
    @staticmethod
    def prepare_messages_for_api(messages: List[Dict[str, Any]], 
                                auto_fix: bool = True) -> List[Dict[str, Any]]:
        """
        Prepare and validate messages for API submission.
        
        Args:
            messages: Raw messages list
            auto_fix: Whether to attempt automatic fixes
        
        Returns:
            Validated and prepared messages
        
        Raises:
            MessageValidationError if validation fails and auto_fix is False
        """
        # Clean messages first
        cleaned = AnthropicMessageValidator.clean_messages(messages)
        
        # Validate
        valid, errors = AnthropicMessageValidator.validate_messages(cleaned)
        
        if not valid:
            if auto_fix:
                logger.warning(f"Message validation errors (attempting fix): {errors}")
                cleaned = AnthropicMessageValidator.fix_message_alternation(cleaned)
                
                # Re-validate
                valid, errors = AnthropicMessageValidator.validate_messages(cleaned)
                if not valid:
                    raise MessageValidationError(f"Could not fix validation errors: {errors}")
            else:
                raise MessageValidationError(f"Message validation failed: {errors}")
        
        return cleaned
    
    @staticmethod
    def clean_messages(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Clean messages to ensure proper format.
        Similar to _clean_messages in claude_completions.py but more comprehensive.
        """
        cleaned = []
        
        for msg in messages:
            cleaned_msg = {"role": msg["role"]}
            
            if isinstance(msg.get("content"), list):
                cleaned_content = []
                for block in msg["content"]:
                    if isinstance(block, dict):
                        # Ensure tool_use blocks have dict inputs
                        if block.get("type") == "tool_use":
                            cleaned_block = block.copy()
                            if not isinstance(cleaned_block.get("input"), dict):
                                cleaned_block["input"] = {}
                            cleaned_content.append(cleaned_block)
                        else:
                            cleaned_content.append(block)
                    else:
                        # Convert string content to text block
                        cleaned_content.append({
                            "type": "text",
                            "text": str(block)
                        })
                cleaned_msg["content"] = cleaned_content
            else:
                # Keep string content as is
                cleaned_msg["content"] = msg.get("content", "")
            
            cleaned.append(cleaned_msg)
        
        return cleaned

def _is_tool_result_message(msg: Dict[str, Any]) -> bool:
    """Check if a message contains tool results"""
    content = msg.get("content", [])
    if isinstance(content, list):
        return any(block.get("type") == "tool_result" for block in content)
    return False

def _has_tool_use(msg: Dict[str, Any]) -> bool:
    """Check if a message contains tool use"""
    content = msg.get("content", [])
    if isinstance(content, list):
        return any(block.get("type") in ["tool_use", "server_tool_use", "mcp_tool_use"] 
                  for block in content)
    return False