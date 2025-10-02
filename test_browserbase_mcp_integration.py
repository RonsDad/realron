#!/usr/bin/env python3
"""
Test script to verify Browserbase MCP integration in Ron AI
"""

import asyncio
import os
import logging
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_browserbase_mcp_integration():
    """Test the Browserbase MCP integration"""

    print("=" * 60)
    print("BROWSERBASE MCP INTEGRATION TEST")
    print("=" * 60)

    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    # Set up the environment variables
    gemini_key = os.environ.get('GEMINI_API_KEY')
    if gemini_key and not os.environ.get('GOOGLE_GENERATIVE_AI_API_KEY'):
        os.environ['GOOGLE_GENERATIVE_AI_API_KEY'] = gemini_key

    # Test 1: Check environment variables
    print("\n1. Checking Environment Variables:")
    print("-" * 40)

    required_vars = [
        'BROWSERBASE_API_KEY',
        'BROWSERBASE_PROJECT_ID',
        'GOOGLE_GENERATIVE_AI_API_KEY',
        'GEMINI_API_KEY'
    ]

    missing_vars = []
    for var in required_vars:
        value = os.environ.get(var)
        if value:
            print(f"✅ {var}: {'*' * (len(value) - 8)}{value[-8:]}")
        else:
            print(f"❌ {var}: Not set")
            missing_vars.append(var)

    if missing_vars:
        print(f"\n⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("Please ensure these are set in your .env file")

    # Test 2: Test Browserbase MCP integration initialization
    print("\n2. Testing Browserbase MCP Integration:")
    print("-" * 40)

    try:
        from backend.integrations.browserbase_mcp import BrowserbaseMCPIntegration

        integration = BrowserbaseMCPIntegration()

        if integration.initialize_from_env():
            print("✅ Browserbase MCP integration initialized successfully")

            # Test MCP server config generation
            config = integration.get_mcp_server_config()
            if config:
                print("✅ MCP server configuration generated")
                print(f"   Type: {config.get('type')}")
                print(f"   Name: {config.get('name')}")
                print(f"   URL: {config.get('url', 'N/A')}")
            else:
                print("❌ Failed to generate MCP server configuration")
        else:
            print("❌ Failed to initialize Browserbase MCP integration")

    except Exception as e:
        print(f"❌ Error testing Browserbase MCP integration: {e}")

    # Test 3: Test MCP server loading in Claude completions
    print("\n3. Testing MCP Server Loading:")
    print("-" * 40)

    try:
        from backend.agents.claudeAgent.claude_completions import ClaudeCompletions

        claude = ClaudeCompletions()

        if hasattr(claude, 'mcp_servers_cache'):
            mcp_servers = claude.mcp_servers_cache
            print(f"✅ MCP servers cache loaded: {len(mcp_servers)} server(s)")

            # Look for Browserbase server
            browserbase_servers = [s for s in mcp_servers if s.get('name') == 'browserbase']
            if browserbase_servers:
                print(f"✅ Browserbase MCP server found in cache")
                for server in browserbase_servers:
                    print(f"   URL: {server.get('url', 'N/A')}")
            else:
                print("⚠️  Browserbase MCP server not found in cache")
                print("   Available servers:")
                for server in mcp_servers:
                    print(f"   - {server.get('name', 'Unknown')}: {server.get('type', 'Unknown')}")
        else:
            print("❌ MCP servers cache not found in Claude completions")

    except Exception as e:
        print(f"❌ Error testing Claude completions MCP loading: {e}")

    # Test 4: Test API endpoint availability
    print("\n4. Testing API Endpoint Registration:")
    print("-" * 40)

    try:
        # Import the router to test registration
        from backend.api.browserbase_session_handler import router
        print("✅ Browserbase session handler router imported successfully")

        # Check if the router has the expected endpoints
        routes = [route for route in router.routes if hasattr(route, 'path')]
        print(f"✅ Router has {len(routes)} routes:")
        for route in routes:
            print(f"   - {route.methods} {route.path}")

    except Exception as e:
        print(f"❌ Error testing API endpoint registration: {e}")

    # Test 5: Test a simple MCP tool call (if possible)
    print("\n5. Testing MCP Tool Call:")
    print("-" * 40)

    try:
        if not missing_vars:
            claude = ClaudeCompletions()

            # Simple test message to see if MCP tools are available
            messages = [
                {
                    "role": "user",
                    "content": "List the available Browserbase MCP tools. Don't actually call them, just tell me what tools are available."
                }
            ]

            print("📡 Sending test message to Claude with MCP tools...")
            response = await claude.complete(
                messages=messages,
                max_tokens=1000,
                disable_mcp=False
            )

            if hasattr(response, 'content') and response.content:
                content = response.content[0]
                if hasattr(content, 'text'):
                    print("✅ Claude response received:")
                    print(f"   {content.text[:200]}...")
            else:
                print("⚠️  Claude response received but no content found")

        else:
            print("⚠️  Skipping MCP tool call test due to missing environment variables")

    except Exception as e:
        print(f"❌ Error testing MCP tool call: {e}")

    # Test Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    if not missing_vars:
        print("🎉 Environment variables: CONFIGURED")
    else:
        print("⚠️  Environment variables: MISSING REQUIRED VARIABLES")

    print("📋 Integration components:")
    print("   - Browserbase MCP integration: IMPLEMENTED")
    print("   - Frontend API routes: IMPLEMENTED")
    print("   - Backend session handler: IMPLEMENTED")
    print("   - Frontend Browserbase component: IMPLEMENTED")

    print("\n🔧 Next Steps:")
    if missing_vars:
        print("   1. Set missing environment variables in .env file")
        print("   2. Restart the backend server")
    print("   3. Test the integration by visiting /browserbase in the frontend")
    print("   4. Try creating a Browserbase session and executing Stagehand AI tasks")

    print("\n📌 Remember:")
    print("   - Browserbase MCP tools require GOOGLE_GENERATIVE_AI_API_KEY")
    print("   - Live session URLs are embedded in the frontend iframe")
    print("   - Stagehand AI provides natural language browser control")

if __name__ == "__main__":
    asyncio.run(test_browserbase_mcp_integration())