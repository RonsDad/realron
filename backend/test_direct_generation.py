#!/usr/bin/env python3
"""
Test tool generation directly with Claude Code SDK
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/timhunter/ron-ai/.env')

# Test with EXACT SDK imports
from claude_code_sdk import query, ClaudeCodeOptions, Message

async def test_tool_generation():
    """Test generating a healthcare tool with SDK"""
    
    prompt = """Create a complete, self-contained HTML file for a medication tracker tool.

Requirements:
1. Create a COMPLETE HTML file with ALL styles inline
2. Mobile-first responsive design
3. Beautiful blue gradient theme
4. Interactive elements where appropriate
5. NO external dependencies - everything inline
6. Patient-friendly language - no technical jargon
7. Include all functionality in one file

Generate the complete HTML file now:"""

    options = ClaudeCodeOptions(
        allowed_tools=["Write"],
        permission_mode='acceptEdits',
        max_turns=3,
        system_prompt="You are a healthcare tool generator. Create beautiful, functional, self-contained HTML tools for patients."
    )
    
    print("Starting tool generation with Claude Code SDK...")
    messages = []
    
    async for message in query(prompt=prompt, options=options):
        messages.append(message)
        # Print message type
        print(f"Received: {type(message).__name__}")
        
        # Check for content
        if hasattr(message, 'content'):
            print(f"  Has content attribute")
            if hasattr(message.content, '__iter__'):
                for block in message.content:
                    if hasattr(block, 'text'):
                        text = block.text[:100] + "..." if len(block.text) > 100 else block.text
                        print(f"  Text block: {text}")
    
    print(f"\nTotal messages received: {len(messages)}")
    
    # Check if we got any HTML
    for message in messages:
        if hasattr(message, 'content'):
            for block in getattr(message.content, '__iter__', lambda: [message.content])():
                if hasattr(block, 'text') and ('<html' in block.text.lower() or '<!doctype' in block.text.lower()):
                    print("\n✅ Found HTML content!")
                    # Save it
                    with open('test_sdk_generated.html', 'w') as f:
                        f.write(block.text)
                    print("   Saved to test_sdk_generated.html")
                    return

if __name__ == "__main__":
    asyncio.run(test_tool_generation())