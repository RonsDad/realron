#!/usr/bin/env python3
"""
Test script to validate anonymous session handling in Claude Code SDK integration
"""

import asyncio
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_anonymous_session():
    """Test Claude Code SDK tool generation without patient_id"""

    try:
        # Import the handler
        from patient_handler import patient_request_handler

        logger.info("Testing anonymous session handling...")

        # Test 1: No patient_id provided
        logger.info("\n=== Test 1: Anonymous user (no patient_id) ===")
        result1 = await patient_request_handler.handle_request(
            message="I need a medication tracker for my diabetes medications",
            patient_id=None,  # Explicitly None
            patient_data=None
        )

        logger.info(f"Result 1:")
        logger.info(f"  Success: {result1.get('success')}")
        logger.info(f"  Patient ID: {result1.get('patient_id')}")
        logger.info(f"  Session ID: {result1.get('session_id')}")
        logger.info(f"  LiveURL: {result1.get('live_url')}")

        # Verify anonymous patient_id was generated
        assert result1.get('patient_id') is not None, "Patient ID should be generated"
        assert result1['patient_id'].startswith('anon_'), f"Expected anonymous ID, got: {result1['patient_id']}"

        # Test 2: With patient_id provided
        logger.info("\n=== Test 2: Registered user (with patient_id) ===")
        result2 = await patient_request_handler.handle_request(
            message="Create a symptom diary for tracking my arthritis pain",
            patient_id="user_12345",
            patient_data={"name": "John Doe", "conditions": ["arthritis"]}
        )

        logger.info(f"Result 2:")
        logger.info(f"  Success: {result2.get('success')}")
        logger.info(f"  Patient ID: {result2.get('patient_id')}")
        logger.info(f"  Session ID: {result2.get('session_id')}")
        logger.info(f"  LiveURL: {result2.get('live_url')}")

        # Verify provided patient_id was used
        assert result2.get('patient_id') == "user_12345", f"Expected user_12345, got: {result2['patient_id']}"

        # Test 3: With custom session_id
        logger.info("\n=== Test 3: Custom session ID ===")
        result3 = await patient_request_handler.handle_request(
            message="Help me track my blood pressure readings",
            patient_id=None,
            patient_data=None,
            session_id="custom_session_123"
        )

        logger.info(f"Result 3:")
        logger.info(f"  Success: {result3.get('success')}")
        logger.info(f"  Patient ID: {result3.get('patient_id')}")
        logger.info(f"  Session ID: {result3.get('session_id')}")
        logger.info(f"  LiveURL: {result3.get('live_url')}")

        # Verify custom session_id was used
        assert result3.get('session_id') == "custom_session_123", f"Expected custom_session_123, got: {result3['session_id']}"

        logger.info("\n✅ All tests passed successfully!")
        return True

    except ImportError as e:
        logger.error(f"Import error: {e}")
        logger.error("Make sure you're running this from the claude_code_sdk directory")
        return False

    except AssertionError as e:
        logger.error(f"Assertion failed: {e}")
        return False

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_tool_function():
    """Test the tools.py claude_code_generate_tool function"""

    try:
        # Import from the parent directory
        import sys
        import os
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

        from tools import claude_code_generate_tool

        logger.info("\n=== Testing claude_code_generate_tool function ===")

        # Test without patient_id
        result = await claude_code_generate_tool(
            message="Create a simple medication reminder tool"
        )

        logger.info(f"Tool function result:")
        logger.info(f"  Success: {result.get('success')}")
        logger.info(f"  Patient ID: {result.get('patient_id')}")
        logger.info(f"  Session ID: {result.get('session_id')}")
        logger.info(f"  LiveURL: {result.get('live_url')}")
        logger.info(f"  Error: {result.get('error')}")

        return result.get('success', False)

    except Exception as e:
        logger.error(f"Tool function test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""

    logger.info("Starting Claude Code SDK Anonymous Session Tests")
    logger.info("=" * 50)

    # Run handler tests
    handler_success = await test_anonymous_session()

    # Run tool function tests
    tool_success = await test_tool_function()

    logger.info("\n" + "=" * 50)
    logger.info("Test Summary:")
    logger.info(f"  Handler Tests: {'✅ PASSED' if handler_success else '❌ FAILED'}")
    logger.info(f"  Tool Function Tests: {'✅ PASSED' if tool_success else '❌ FAILED'}")

    overall_success = handler_success and tool_success
    logger.info(f"\nOverall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")

    return overall_success


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)