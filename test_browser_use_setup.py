#!/usr/bin/env python3
"""
Test Browser-Use Cloud API Setup
Run this to verify your configuration is working
"""

import os
import sys
from pathlib import Path

# Add project paths
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

def test_browser_use_setup():
    print("=" * 60)
    print("Browser-Use Cloud API Configuration Test")
    print("=" * 60)
    print()

    # Step 1: Check .env file exists
    env_file = project_root / ".env"
    if env_file.exists():
        print("✅ .env file found")
    else:
        print("❌ .env file not found")
        print("   Please create .env file in project root")
        return

    # Step 2: Load environment variables
    from dotenv import load_dotenv
    load_dotenv(env_file, override=True)

    # Step 3: Check for API key
    api_key = os.getenv("BROWSER_USE_API_KEY")

    if api_key:
        if api_key.startswith("YOUR") or api_key == "your_api_key_here":
            print("⚠️  BROWSER_USE_API_KEY found but appears to be a placeholder")
            print(f"   Current value: {api_key[:20]}...")
            print("   Please replace with your actual API key from:")
            print("   https://cloud.browser-use.com/billing")
        else:
            print("✅ BROWSER_USE_API_KEY is configured!")
            print(f"   Key length: {len(api_key)} characters")
            print(f"   Key preview: {api_key[:10]}...{api_key[-4:]}")
    else:
        print("❌ BROWSER_USE_API_KEY not found in .env")
        print()
        print("To fix this, add the following line to your .env file:")
        print("BROWSER_USE_API_KEY=your_actual_api_key_here")
        print()
        print("Get your API key from: https://cloud.browser-use.com/billing")
        return

    # Step 4: Try to import the client
    print()
    print("Testing browser-use cloud client import...")
    try:
        from backend.agents.claudeAgent.claude_tools.browser_use_cloud.browser_use_cloud_client import BrowserUseCloudClient
        print("✅ Browser-use cloud client imported successfully")

        # Try to create client instance
        try:
            client = BrowserUseCloudClient()
            print("✅ Browser-use cloud client initialized successfully!")
            print()
            print("🎉 Everything is configured correctly!")
            print()
            print("Available tools for Ron:")
            tools = [
                "browser_use_cloud_automation",
                "browser_use_cloud_pause",
                "browser_use_cloud_resume",
                "browser_use_cloud_status",
                "browser_use_cloud_stop",
                "browser_use_cloud_list_active",
                "browser_use_cloud_account_status"
            ]
            for tool in tools:
                print(f"  • {tool}")

        except ValueError as e:
            print(f"❌ Failed to initialize client: {e}")

    except ImportError as e:
        print(f"❌ Failed to import browser-use cloud client: {e}")

    print()
    print("=" * 60)

if __name__ == "__main__":
    test_browser_use_setup()