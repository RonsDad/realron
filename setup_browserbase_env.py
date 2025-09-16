#!/usr/bin/env python3
"""
Setup script to configure Browserbase MCP environment variables
This reads from the existing .env file and adds missing variables
"""

import os
import sys

def setup_browserbase_env():
    """Set up environment variables for Browserbase MCP integration"""

    print("Setting up Browserbase MCP environment variables...")

    # Get the existing GEMINI_API_KEY from environment
    gemini_api_key = os.environ.get('GEMINI_API_KEY')

    if gemini_api_key:
        print(f"✅ Found GEMINI_API_KEY: {gemini_api_key[-8:]}")
        # Set GOOGLE_GENERATIVE_AI_API_KEY to the same value
        os.environ['GOOGLE_GENERATIVE_AI_API_KEY'] = gemini_api_key
        print("✅ Set GOOGLE_GENERATIVE_AI_API_KEY from GEMINI_API_KEY")
    else:
        print("⚠️  GEMINI_API_KEY not found in environment")

    # Set placeholder values for Browserbase credentials (for testing structure)
    if not os.environ.get('BROWSERBASE_API_KEY'):
        os.environ['BROWSERBASE_API_KEY'] = 'bb_test_key_placeholder'
        print("✅ Set BROWSERBASE_API_KEY (placeholder)")

    if not os.environ.get('BROWSERBASE_PROJECT_ID'):
        os.environ['BROWSERBASE_PROJECT_ID'] = 'test_project_id_placeholder'
        print("✅ Set BROWSERBASE_PROJECT_ID (placeholder)")

    # Set ANTHROPIC_API_KEY if available
    anthropic_key = os.environ.get('ANTHROPIC_API_KEY')
    if anthropic_key:
        print(f"✅ ANTHROPIC_API_KEY already set: {anthropic_key[-8:]}")
    else:
        print("⚠️  ANTHROPIC_API_KEY not found - some tests may fail")

    print("\n📋 Current Browserbase-related environment variables:")
    browserbase_vars = [
        'BROWSERBASE_API_KEY',
        'BROWSERBASE_PROJECT_ID',
        'GOOGLE_GENERATIVE_AI_API_KEY',
        'GEMINI_API_KEY',
        'ANTHROPIC_API_KEY'
    ]

    for var in browserbase_vars:
        value = os.environ.get(var)
        if value:
            display_value = f"{'*' * (len(value) - 8)}{value[-8:]}" if len(value) > 8 else "***"
            print(f"   {var}: {display_value}")
        else:
            print(f"   {var}: Not set")

    print("\n🔧 To make these permanent, add these to your .env file:")
    print(f"GOOGLE_GENERATIVE_AI_API_KEY={gemini_api_key}")
    print("# Add your actual Browserbase credentials:")
    print("# BROWSERBASE_API_KEY=bb_live_your_actual_key_here")
    print("# BROWSERBASE_PROJECT_ID=your_actual_project_id_here")

if __name__ == "__main__":
    # Load existing .env first
    from dotenv import load_dotenv
    load_dotenv()

    setup_browserbase_env()