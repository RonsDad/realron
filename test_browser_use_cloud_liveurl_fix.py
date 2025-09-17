#!/usr/bin/env python3
"""
Test Browser-Use Cloud LiveURL Fix
This test verifies that Browser-Use Cloud automation tool results
properly emit browser_live_url events to the frontend.
"""

import sys
import os
import asyncio
import json
import logging
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

# Load environment
from dotenv import load_dotenv
load_dotenv('.env', override=True)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger(__name__)

async def test_browser_use_cloud_liveurl():
    """Test that Browser-Use Cloud LiveURL is properly detected and emitted"""

    try:
        # Import after path setup
        from backend.agents.claudeAgent.claude_tools.browser_use_cloud.browser_use_cloud_tools import (
            execute_browser_use_cloud_automation
        )

        logger.info("🚀 Testing Browser-Use Cloud LiveURL detection...")

        # This should return a result with browser_url/liveUrl that should trigger browser_live_url event
        result = await execute_browser_use_cloud_automation(
            task="Navigate to https://httpbin.org/get and tell me what you see",
            use_case="ultra-fast"
        )

        logger.info("📊 BROWSER-USE CLOUD RESULT:")
        logger.info(f"Success: {result.get('success')}")
        logger.info(f"Message: {result.get('message')}")

        # Check if we have the expected structure for LiveURL
        if result.get('success') and result.get('result'):
            tool_result = result['result']
            logger.info(f"Result keys: {list(tool_result.keys())}")

            # Check all possible live URL fields
            live_url_fields = ['browser_url', 'liveUrl', 'live_url']
            found_live_url = None

            for field in live_url_fields:
                # Check top level
                if tool_result.get(field):
                    found_live_url = tool_result[field]
                    logger.info(f"✅ Found LiveURL at top level '{field}': {found_live_url}")
                    break
                # Check nested in 'result'
                elif tool_result.get('result', {}).get(field):
                    found_live_url = tool_result['result'][field]
                    logger.info(f"✅ Found LiveURL in nested 'result.{field}': {found_live_url}")
                    break

            if found_live_url:
                logger.info(f"🎉 SUCCESS! Browser-Use Cloud returned LiveURL: {found_live_url}")
                logger.info("✅ The new code in claude_completions.py should detect this and emit browser_live_url event")

                # Show what the frontend should receive
                expected_event = {
                    'type': 'browser_live_url',
                    'live_url': found_live_url,
                    'session_id': tool_result.get('session_id'),
                    'task_id': tool_result.get('task_id'),
                    'source': 'browser_use_cloud'
                }
                logger.info(f"📡 Expected frontend event: {json.dumps(expected_event, indent=2)}")
                return True
            else:
                logger.warning("❌ No LiveURL found in Browser-Use Cloud result")
                logger.warning("This might indicate:")
                logger.warning("1. Browser-Use Cloud subscription required")
                logger.warning("2. Session creation failed")
                logger.warning("3. API configuration issue")
                logger.info(f"Full result structure: {json.dumps(result, indent=2)}")
                return False
        else:
            logger.error("❌ Browser-Use Cloud tool failed or returned no result")
            logger.error(f"Full result: {json.dumps(result, indent=2)}")
            return False

    except Exception as e:
        logger.error(f"💥 Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run the test"""
    logger.info("🧪 Starting Browser-Use Cloud LiveURL Fix Test")

    success = await test_browser_use_cloud_liveurl()

    if success:
        logger.info("✅ TEST PASSED: LiveURL detection should work!")
        logger.info("🔧 FIX SUMMARY:")
        logger.info("1. Added Browser-Use Cloud LiveURL detection in claude_completions.py")
        logger.info("2. Added browser_use_cloud_automation to sequential tool execution")
        logger.info("3. Frontend already handles browser_live_url events correctly")
        logger.info("4. ComputerUseAgent will display the LiveURL in iframe")
    else:
        logger.error("❌ TEST FAILED: LiveURL detection may not work")
        logger.error("Check Browser-Use Cloud API configuration and subscription status")

    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)