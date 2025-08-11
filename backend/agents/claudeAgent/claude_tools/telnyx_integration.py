"""
This file is intentionally left blank.

The Telnyx MCP integration has been refactored to use a persistent,
standalone MCP server and a centralized, singleton client. The tool
definitions are now loaded dynamically from the server at startup
and cached.

The new implementation can be found in:
- backend/agents/claudeAgent/claude_tools/telnyx_client.py
- backend/agents/claudeAgent/claude_tools/telnyx_tool_loader.py
- backend/agents/claudeAgent/claude_tools/claude_tool_handler.py

This new architecture is more scalable, efficient, and maintainable.
"""
import logging

logger = logging.getLogger(__name__)

logger.info("Telnyx integration has been refactored. This file is no longer in use.")
