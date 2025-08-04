"""
Claude Code SDK Integration for Healthcare Tool Generation
Generates personalized patient tools with zero code visibility
"""

from .claude_code_sdk_browserless import ClaudeCodeSDKBrowserless
from .tool_generator import ToolGenerator
from .message_handler import MessageStreamHandler
from .patient_handler import PatientRequestHandler, patient_request_handler
from .template_library import TemplateLibrary
from .context_extractor import ContextExtractor
from .intent_classifier import IntentClassifier

# Check if Claude Code SDK is available
try:
    from claude_code_sdk import query, ClaudeCodeOptions, Message
    CLAUDE_CODE_SDK_AVAILABLE = True
except ImportError:
    CLAUDE_CODE_SDK_AVAILABLE = False

__all__ = [
    "ClaudeCodeSDKBrowserless",
    "ToolGenerator", 
    "MessageStreamHandler",
    "PatientRequestHandler",
    "patient_request_handler",
    "TemplateLibrary",
    "ContextExtractor",
    "IntentClassifier",
    "CLAUDE_CODE_SDK_AVAILABLE"
]