#!/usr/bin/env python3
"""
Simple connection test for Claude Code SDK
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/timhunter/ron-ai/.env')

print("1. Checking environment variables...")
print(f"   ANTHROPIC_API_KEY: {'✅ Set' if os.getenv('ANTHROPIC_API_KEY') else '❌ Not set'}")
print(f"   BROWSERLESS_API_TOKEN: {'✅ Set' if os.getenv('BROWSERLESS_API_TOKEN') else '❌ Not set'}")

print("\n2. Checking Claude Code SDK...")
try:
    from claude_code_sdk import query, ClaudeCodeOptions, Message
    print("   ✅ Claude Code SDK can be imported")
except ImportError as e:
    print(f"   ❌ Claude Code SDK not installed: {e}")
    print("   Run: pip install claude-code-sdk")

print("\n3. Checking Ron AI modules...")
sys.path.insert(0, '/Users/timhunter/ron-ai/backend')
try:
    from agents.claudeAgent.claude_tools.claude_code_sdk import patient_request_handler
    print("   ✅ Ron AI modules can be imported")
except ImportError as e:
    print(f"   ❌ Ron AI modules import error: {e}")

print("\nDone!")